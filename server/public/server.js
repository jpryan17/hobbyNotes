"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const crypto_1 = require("crypto");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
// Load environment variables from .env
dotenv_1.default.config({ path: (0, path_1.resolve)(process.cwd(), '.env') });
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
// ---------------------------------------------------------------------
// 1. PostgreSQL Connection Pool
// ---------------------------------------------------------------------
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'hobbynotes',
    password: process.env.DB_PASSWORD || 'repj',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: false,
});
pool.on('error', (err) => {
    console.error('[dbBridge] Unexpected idle PostgreSQL client error:', err);
});
// Test connection on startup
(async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT current_database(), current_user;');
        client.release();
        console.log(`[dbBridge] Connected to PostgreSQL: db=${res.rows[0].current_database}, user=${res.rows[0].current_user}`);
    }
    catch (err) {
        console.warn(`[dbBridge] Initial DB connection warning: ${err.message}. Ensure PostgreSQL service is running and credentials in .env are valid.`);
    }
})();
const activeTransactions = new Map();
const TRANSACTION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
// Automatic cleanup of stale transactions
setInterval(() => {
    const now = Date.now();
    for (const [txId, tx] of activeTransactions.entries()) {
        if (now - tx.timestamp > TRANSACTION_TIMEOUT_MS) {
            console.warn(`[dbBridge] Transaction ${txId} timed out. Rolling back...`);
            tx.client.query('ROLLBACK')
                .catch((e) => console.error(`[dbBridge] Error rolling back timed out tx ${txId}:`, e))
                .finally(() => {
                tx.client.release();
                activeTransactions.delete(txId);
            });
        }
    }
}, 60 * 1000);
// ---------------------------------------------------------------------
// 3. Database Gateway Endpoints (Thin SQL Bridge)
// ---------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
    try {
        const dbRes = await pool.query('SELECT NOW() as now');
        res.json({ status: 'ok', dbTime: dbRes.rows[0].now });
    }
    catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});
app.post('/api/sql', async (req, res) => {
    const { sql, params, transactionId } = req.body;
    if (!sql || typeof sql !== 'string' || sql.trim().length < 2) {
        return res.status(400).json({
            status: 'error',
            message: 'SQL statement is required and must be a valid string.',
        });
    }
    // Stateful transaction branch
    if (transactionId) {
        const tx = activeTransactions.get(transactionId);
        if (!tx) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found or timed out.',
            });
        }
        try {
            const queryRes = Array.isArray(params)
                ? await tx.client.query(sql, params)
                : await tx.client.query(sql);
            tx.timestamp = Date.now();
            return res.json({
                status: 'success',
                message: `Executed within transaction. ${queryRes.rowCount ?? 0} row(s) affected/returned.`,
                data: {
                    rows: queryRes.rows || [],
                    rowCount: queryRes.rowCount ?? 0,
                },
            });
        }
        catch (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Query execution error within transaction.',
                error: err.message,
            });
        }
    }
    // Stateless branch (direct pool query)
    try {
        const queryRes = Array.isArray(params)
            ? await pool.query(sql, params)
            : await pool.query(sql);
        return res.json({
            status: 'success',
            message: `Query successful. ${queryRes.rowCount ?? 0} row(s) returned/affected.`,
            data: {
                rows: queryRes.rows || [],
                rowCount: queryRes.rowCount ?? 0,
            },
        });
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Database query execution error.',
            error: err.message,
        });
    }
});
app.post('/api/transactions/begin', async (_req, res) => {
    try {
        const client = await pool.connect();
        await client.query('BEGIN');
        const transactionId = (0, crypto_1.randomUUID)();
        activeTransactions.set(transactionId, { client, timestamp: Date.now() });
        console.log(`[dbBridge] Transaction started: ${transactionId}`);
        res.json({
            status: 'success',
            message: 'Transaction started.',
            transactionId,
        });
    }
    catch (err) {
        console.error('[dbBridge] Failed to begin transaction:', err);
        res.status(500).json({
            status: 'error',
            message: 'Could not begin transaction.',
            error: err.message,
        });
    }
});
app.post('/api/transactions/commit', async (req, res) => {
    const { transactionId } = req.body;
    if (!transactionId) {
        return res.status(400).json({ status: 'error', message: 'transactionId is required.' });
    }
    const tx = activeTransactions.get(transactionId);
    if (!tx) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found or expired.' });
    }
    try {
        await tx.client.query('COMMIT');
        tx.client.release();
        activeTransactions.delete(transactionId);
        console.log(`[dbBridge] Transaction committed: ${transactionId}`);
        res.json({ status: 'success', message: 'Transaction successfully committed.' });
    }
    catch (err) {
        tx.client.release();
        activeTransactions.delete(transactionId);
        res.status(500).json({ status: 'error', message: 'Commit failed.', error: err.message });
    }
});
app.post('/api/transactions/rollback', async (req, res) => {
    const { transactionId } = req.body;
    if (!transactionId) {
        return res.status(400).json({ status: 'error', message: 'transactionId is required.' });
    }
    const tx = activeTransactions.get(transactionId);
    if (!tx) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found or expired.' });
    }
    try {
        await tx.client.query('ROLLBACK');
        tx.client.release();
        activeTransactions.delete(transactionId);
        console.log(`[dbBridge] Transaction rolled back: ${transactionId}`);
        res.json({ status: 'success', message: 'Transaction rolled back.' });
    }
    catch (err) {
        tx.client.release();
        activeTransactions.delete(transactionId);
        res.status(500).json({ status: 'error', message: 'Rollback failed.', error: err.message });
    }
});
// ---------------------------------------------------------------------
// 3b. Static Site Publisher (Studio Build Page Endpoint)
// ---------------------------------------------------------------------
// 3b. Static Site Publisher (Studio Build Page Endpoint)
// ---------------------------------------------------------------------
app.post('/api/publish', async (req, res) => {
    const { app: appName = 'app1', pageName, outDir, outlineTree, segOverrides } = req.body;
    try {
        const publisherUrl = (0, url_1.pathToFileURL)((0, path_1.resolve)(process.cwd(), 'nodeUtils/public/dbPublisher.js')).href + `?t=${Date.now()}`;
        // @ts-ignore - dbPublisher.js is compiled in nodeUtils without .d.ts
        const { publishStaticSite } = (await import(publisherUrl));
        const result = await publishStaticSite(appName, pool, { pageName, outDir, outlineTree, segOverrides });
        if (result.success) {
            res.json({ status: 'success', data: result });
        }
        else {
            res.status(500).json({ status: 'error', message: result.error, data: result });
        }
    }
    catch (err) {
        console.error('[dbBridge Error] Publish failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// ---------------------------------------------------------------------
// 3c. Commit Dev State to PostgreSQL Database Endpoint
// ---------------------------------------------------------------------
// Helper to reseed PostgreSQL from db/seed_v2.sql
async function reseedPostgresFromSeedFile() {
    const seedPath = (0, path_1.resolve)(process.cwd(), 'db/seed_v2.sql');
    if ((0, fs_1.existsSync)(seedPath)) {
        const seedSql = (0, fs_1.readFileSync)(seedPath, 'utf8');
        await pool.query(seedSql);
        console.log('[dbBridge] Reseeded PostgreSQL database from updated seed_v2.sql');
    }
}
app.post('/api/sync-to-db', async (req, res) => {
    const { app: appName = 'app1', outlineTree, segOverrides } = req.body;
    try {
        let filesChanged = false;
        // 1. Synchronize outline tree changes to indices.ts
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            const outlineModified = syncOutlineToIndicesTs(outlineTree, appName);
            if (outlineModified)
                filesChanged = true;
        }
        // 2. Synchronize any edited segments back to source files
        if (segOverrides && typeof segOverrides === 'object') {
            for (const [segKey, newHtml] of Object.entries(segOverrides)) {
                if (typeof newHtml === 'string' && newHtml.trim().length > 0) {
                    const destPath = (0, path_1.resolve)(process.cwd(), `${appName}/segs/${segKey}.html`);
                    let existingHtml = null;
                    if ((0, fs_1.existsSync)(destPath)) {
                        existingHtml = (0, fs_1.readFileSync)(destPath, 'utf8');
                    }
                    const formatted = formatSegmentFileHtml(existingHtml, newHtml, segKey);
                    (0, fs_1.writeFileSync)(destPath, formatted, 'utf8');
                    console.log(`[dbBridge] Wrote updated segment to ${destPath}`);
                    const consPath = (0, path_1.resolve)(process.cwd(), `consolidated_segs/${segKey}.html`);
                    if ((0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), 'consolidated_segs'))) {
                        (0, fs_1.writeFileSync)(consPath, formatted, 'utf8');
                    }
                    filesChanged = true;
                }
            }
        }
        // 3. Regenerate segsFile.json & db/seed_v2.sql
        console.log(`[dbBridge] Regenerating segsFile.json for ${appName}...`);
        (0, child_process_1.execSync)(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });
        console.log(`[dbBridge] Regenerating db/seed_v2.sql...`);
        (0, child_process_1.execSync)('node ./nodeUtils/public/genSqlSeeds.js', { cwd: process.cwd() });
        // 4. Reseed PostgreSQL from freshly generated seed_v2.sql
        await reseedPostgresFromSeedFile();
        console.log(`[dbBridge] Successfully committed Dev state: source files, seed_v2.sql, and PostgreSQL in 100% sync.`);
        res.json({
            status: 'success',
            message: `Successfully synchronized Dev state to source files, updated seed_v2.sql, and reseeded PostgreSQL.`
        });
    }
    catch (err) {
        console.error('[dbBridge Error] Sync to DB failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// ---------------------------------------------------------------------
// 3d. Reseed Database from Clean Git Baseline Endpoint
// ---------------------------------------------------------------------
app.post('/api/reseed-db', async (_req, res) => {
    try {
        const seedPath = (0, path_1.resolve)(process.cwd(), 'db/seed_v2.sql');
        if (!(0, fs_1.existsSync)(seedPath)) {
            return res.status(404).json({ status: 'error', message: 'db/seed_v2.sql not found.' });
        }
        const seedSql = (0, fs_1.readFileSync)(seedPath, 'utf8');
        const start = Date.now();
        await pool.query(seedSql);
        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Successfully reseeded database from db/seed_v2.sql in ${durationMs}ms`);
        res.json({
            status: 'success',
            message: `Database successfully reseeded from clean Git baseline (seed_v2.sql) in ${durationMs}ms.`,
            durationMs,
        });
    }
    catch (err) {
        console.error('[dbBridge Error] Reseed DB failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// ---------------------------------------------------------------------
// 3e. 2-Phase Segment Staging & Promotion Endpoints
// ---------------------------------------------------------------------
function formatSegmentFileHtml(existingHtml, newContent, segId) {
    if (existingHtml && /<body[^>]*>/i.test(existingHtml) && /<\/body>/i.test(existingHtml)) {
        return existingHtml.replace(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i, (_match, p1, _inner, p3) => {
            return `${p1}\n${newContent.trim()}\n${p3}`;
        });
    }
    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <title>${segId}</title>
  </head>
  <body>
${newContent.trim()}
  </body>
</html>\n`;
}
function getStagedDir() {
    const staged = (0, path_1.resolve)(process.cwd(), 'stagedSegs');
    if ((0, fs_1.existsSync)(staged))
        return staged;
    const saved = (0, path_1.resolve)(process.cwd(), 'savedSegs');
    if ((0, fs_1.existsSync)(saved))
        return saved;
    return staged;
}
function getStagedFilePath(segId) {
    const id = Array.isArray(segId) ? segId[0] : segId;
    const stagedPath = (0, path_1.resolve)(process.cwd(), `stagedSegs/${id}.html`);
    if ((0, fs_1.existsSync)(stagedPath))
        return stagedPath;
    const savedPath = (0, path_1.resolve)(process.cwd(), `savedSegs/${id}.html`);
    if ((0, fs_1.existsSync)(savedPath))
        return savedPath;
    return stagedPath;
}
// 1. Stage a segment draft to stagedSegs/<segId>.html
app.post('/api/stage-segment', (req, res) => {
    const { app: appName = 'app1', segId, contentHtml } = req.body;
    if (!segId || typeof contentHtml !== 'string') {
        return res.status(400).json({ status: 'error', message: 'segId and contentHtml are required.' });
    }
    try {
        const stagedDir = getStagedDir();
        if (!(0, fs_1.existsSync)(stagedDir)) {
            (0, fs_1.mkdirSync)(stagedDir, { recursive: true });
        }
        let existingHtml = null;
        const sourcePath = (0, path_1.resolve)(process.cwd(), `${appName}/segs/${segId}.html`);
        if ((0, fs_1.existsSync)(sourcePath)) {
            existingHtml = (0, fs_1.readFileSync)(sourcePath, 'utf8');
        }
        const formattedHtml = formatSegmentFileHtml(existingHtml, contentHtml, segId);
        const targetPath = (0, path_1.resolve)(stagedDir, `${segId}.html`);
        (0, fs_1.writeFileSync)(targetPath, formattedHtml, 'utf8');
        console.log(`[dbBridge] Staged segment '${segId}' to ${targetPath} (${Buffer.byteLength(formattedHtml)} bytes)`);
        res.json({
            status: 'success',
            ok: true,
            segId,
            filePath: `stagedSegs/${segId}.html`,
            bytes: Buffer.byteLength(formattedHtml),
            stagedAt: new Date().toISOString(),
            message: `Segment '${segId}' staged successfully to stagedSegs/ directory.`
        });
    }
    catch (err) {
        console.error('[dbBridge Error] Stage segment failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 2. List all staged segments in stagedSegs/
app.get('/api/staged-segments', (_req, res) => {
    try {
        const stagedDir = getStagedDir();
        if (!(0, fs_1.existsSync)(stagedDir)) {
            return res.json({ status: 'success', staged: [] });
        }
        const files = (0, fs_1.readdirSync)(stagedDir).filter(f => f.endsWith('.html'));
        const staged = files.map(filename => {
            const filePath = (0, path_1.resolve)(stagedDir, filename);
            const stats = (0, fs_1.statSync)(filePath);
            const segId = filename.replace(/\.html$/, '');
            const content = (0, fs_1.readFileSync)(filePath, 'utf8');
            const hTitleMatch = /<font[^>]*size=["']?\+2["']?[^>]*>(?:<i>)?(?:<b>)?(.*?)(?:<\/b>)?(?:<\/i>)?<\/font>/i.exec(content);
            const h3Match = /<h3>(.*?)<\/h3>/i.exec(content);
            const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
            const title = (hTitleMatch && hTitleMatch[1]) || (h3Match && h3Match[1]) || (titleMatch && titleMatch[1]) || segId;
            const bodyMatch = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i.exec(content);
            const contentHtml = bodyMatch ? bodyMatch[2].trim() : content;
            return {
                segId,
                filename,
                title: title.replace(/<[^>]*>/g, '').trim(),
                contentHtml,
                bytes: stats.size,
                modifiedMs: stats.mtimeMs,
                modifiedAt: stats.mtime.toISOString(),
            };
        });
        staged.sort((a, b) => b.modifiedMs - a.modifiedMs);
        res.json({ status: 'success', staged });
    }
    catch (err) {
        console.error('[dbBridge Error] Get staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 2b. Get a single staged segment by segId
app.get('/api/staged-segments/:segId', (req, res) => {
    const { segId } = req.params;
    try {
        const filePath = getStagedFilePath(segId);
        if (!(0, fs_1.existsSync)(filePath)) {
            return res.status(404).json({ status: 'error', message: `Staged segment '${segId}' not found.` });
        }
        const fullContent = (0, fs_1.readFileSync)(filePath, 'utf8');
        const bodyMatch = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i.exec(fullContent);
        const contentHtml = bodyMatch ? bodyMatch[2].trim() : fullContent;
        res.json({ status: 'success', segId, contentHtml, fullHtml: fullContent });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 3. Discard a specific staged segment
app.delete('/api/staged-segments/:segId', (req, res) => {
    const { segId } = req.params;
    try {
        const filePath = getStagedFilePath(segId);
        if ((0, fs_1.existsSync)(filePath)) {
            (0, fs_1.unlinkSync)(filePath);
            console.log(`[dbBridge] Discarded staged segment: ${filePath}`);
            res.json({ status: 'success', message: `Staged segment '${segId}' discarded.` });
        }
        else {
            res.status(404).json({ status: 'error', message: `Staged segment '${segId}' not found.` });
        }
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 4. Discard all staged segments
app.delete('/api/staged-segments', (_req, res) => {
    try {
        const stagedDir = getStagedDir();
        if ((0, fs_1.existsSync)(stagedDir)) {
            const files = (0, fs_1.readdirSync)(stagedDir).filter(f => f.endsWith('.html'));
            for (const f of files) {
                (0, fs_1.unlinkSync)((0, path_1.resolve)(stagedDir, f));
            }
        }
        res.json({ status: 'success', message: 'All staged segments cleared.' });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 4b. List all files in consolidated_segs (or app1/segs fallback) and stagedSegs
app.get('/api/consolidated-segments', (_req, res) => {
    try {
        const segDir = (0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), 'consolidated_segs'))
            ? (0, path_1.resolve)(process.cwd(), 'consolidated_segs')
            : (0, path_1.resolve)(process.cwd(), 'app1/segs');
        const stagedDir = getStagedDir();
        const segMap = new Map();
        // 1. Existing consolidated / source segments
        if ((0, fs_1.existsSync)(segDir)) {
            const files = (0, fs_1.readdirSync)(segDir).filter(f => f.endsWith('.html'));
            for (const filename of files) {
                const filePath = (0, path_1.resolve)(segDir, filename);
                const stats = (0, fs_1.statSync)(filePath);
                const segId = filename.replace(/\.html$/, '');
                segMap.set(segId, {
                    segId,
                    filename,
                    modifiedMs: stats.mtimeMs,
                    modifiedAt: stats.mtime.toISOString(),
                    size: stats.size,
                    isStaged: false,
                });
            }
        }
        // 2. Staged segments (marked isStaged: true, can override or provide new drafts)
        if ((0, fs_1.existsSync)(stagedDir)) {
            const stagedFiles = (0, fs_1.readdirSync)(stagedDir).filter(f => f.endsWith('.html'));
            for (const filename of stagedFiles) {
                const filePath = (0, path_1.resolve)(stagedDir, filename);
                const stats = (0, fs_1.statSync)(filePath);
                const segId = filename.replace(/\.html$/, '');
                segMap.set(segId, {
                    segId,
                    filename,
                    modifiedMs: stats.mtimeMs,
                    modifiedAt: stats.mtime.toISOString(),
                    size: stats.size,
                    isStaged: true,
                });
            }
        }
        const segments = Array.from(segMap.values());
        res.json({ status: 'success', count: segments.length, segments });
    }
    catch (err) {
        console.error('[dbBridge Error] Get consolidated segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// 4c. Get single segment content on demand (searches app1/segs, consolidated_segs, stagedSegs, savedSegs)
app.get('/api/segment-content/:segId', (req, res) => {
    const { segId } = req.params;
    const candidates = [
        (0, path_1.resolve)(process.cwd(), `app1/segs/${segId}.html`),
        (0, path_1.resolve)(process.cwd(), `consolidated_segs/${segId}.html`),
        (0, path_1.resolve)(process.cwd(), `stagedSegs/${segId}.html`),
        (0, path_1.resolve)(process.cwd(), `savedSegs/${segId}.html`),
        (0, path_1.resolve)(process.cwd(), `app2/segs/${segId}.html`),
    ];
    for (const filePath of candidates) {
        if ((0, fs_1.existsSync)(filePath)) {
            try {
                const fullContent = (0, fs_1.readFileSync)(filePath, 'utf8');
                const bodyMatch = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i.exec(fullContent);
                const contentHtml = bodyMatch ? bodyMatch[2].trim() : fullContent;
                return res.json({ status: 'success', segId, content: contentHtml, fullHtml: fullContent });
            }
            catch (err) {
                return res.status(500).json({ status: 'error', message: `Error reading segment file: ${err.message}` });
            }
        }
    }
    return res.status(404).json({ status: 'error', message: `Segment '${segId}' not found.` });
});
// Helper to synchronize outline tree state into indices.ts
function syncOutlineToIndicesTs(outlineTree, appName = 'app1') {
    const indicesTsPath = (0, path_1.resolve)(process.cwd(), `${appName}/src/indices.ts`);
    if (!(0, fs_1.existsSync)(indicesTsPath))
        return false;
    let content = (0, fs_1.readFileSync)(indicesTsPath, 'utf8');
    let modified = false;
    const activeSegIds = new Set();
    function collectActiveSegIds(nodes) {
        for (const node of nodes) {
            if (node.htmlSegmentId)
                activeSegIds.add(node.htmlSegmentId);
            if (node.indexDesc && Array.isArray(node.indexDesc))
                collectActiveSegIds(node.indexDesc);
        }
    }
    collectActiveSegIds(outlineTree);
    // 1. Remove unlinked entries from indices.ts that are no longer in the outline tree
    const allSegIdMatches = Array.from(content.matchAll(/htmlSegmentId:\s*["']([^"']+)["']/g));
    for (const match of allSegIdMatches) {
        const existingSegId = match[1];
        if (!activeSegIds.has(existingSegId)) {
            console.log(`[dbBridge] Removing unlinked index entry '${existingSegId}' from indices.ts...`);
            const removeRegex = new RegExp(`\\s*\\{[^}]*htmlSegmentId:\\s*["']${existingSegId}["'][^}]*\\},?`, 'g');
            content = content.replace(removeRegex, '');
            modified = true;
        }
    }
    // 2. Add newly hooked outline nodes into indices.ts
    function checkNodes(nodes, parentSectionTitle = '') {
        for (const node of nodes) {
            if (node.type === 'index' && Array.isArray(node.indexDesc)) {
                checkNodes(node.indexDesc, node.topic || parentSectionTitle);
            }
            else if (node.type === 'html' && node.htmlSegmentId) {
                const segId = node.htmlSegmentId;
                if (!content.includes(`"${segId}"`) && !content.includes(`'${segId}'`)) {
                    console.log(`[dbBridge] Attaching new index entry '${segId}' (${node.topic}) to indices.ts...`);
                    const entryCode = `  {\n    type: "html",\n    topic: ${JSON.stringify(node.topic)},\n    navTopic: ${JSON.stringify(node.navTopic || node.topic)},\n    htmlSegmentId: ${JSON.stringify(segId)},\n  },\n];`;
                    let targetArrayName = 'stemBridgeIndex';
                    const pTitle = (parentSectionTitle || '').toLowerCase();
                    if (pTitle.includes('foundation') || pTitle.includes('logic')) {
                        targetArrayName = 'foundationIndex';
                    }
                    else if (pTitle.includes('seminar') || pTitle.includes('satellite')) {
                        targetArrayName = 'satellitesIndex';
                    }
                    else if (pTitle.includes('proposal') || pTitle.includes('research')) {
                        targetArrayName = 'proposalsIndex';
                    }
                    const arrayRegex = new RegExp(`(export const ${targetArrayName}[^=]*=\\s*\\[[\\s\\S]*?)(];)`);
                    if (arrayRegex.test(content)) {
                        content = content.replace(arrayRegex, `$1${entryCode}`);
                        modified = true;
                    }
                    else {
                        const mainIdxPos = content.indexOf('export const mainIndex');
                        if (mainIdxPos !== -1) {
                            content = content.slice(0, mainIdxPos) + entryCode + '\n' + content.slice(mainIdxPos);
                            modified = true;
                        }
                    }
                }
            }
        }
    }
    checkNodes(outlineTree);
    if (modified) {
        (0, fs_1.writeFileSync)(indicesTsPath, content, 'utf8');
        console.log(`[dbBridge] Updated ${indicesTsPath} to reflect outline tree.`);
        try {
            (0, child_process_1.execSync)('npm run compile', { cwd: process.cwd() });
        }
        catch (e) {
            console.error('[dbBridge Error] Compiling indices.ts failed:', e);
        }
    }
    return modified;
}
// 5. Promote all staged segments to source files, regenerate seed, reseed DB, and rebuild index
app.post('/api/promote-staged-segments', async (req, res) => {
    const { app: appName = 'app1', outlineTree } = req.body;
    const stagedDir = getStagedDir();
    if (!(0, fs_1.existsSync)(stagedDir)) {
        return res.status(400).json({ status: 'error', message: 'No stagedSegs/ directory found.' });
    }
    const files = (0, fs_1.readdirSync)(stagedDir).filter(f => f.endsWith('.html'));
    if (files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No staged segment files found in stagedSegs/.' });
    }
    const start = Date.now();
    try {
        for (const f of files) {
            const src = (0, path_1.resolve)(stagedDir, f);
            const dest = (0, path_1.resolve)(process.cwd(), `${appName}/segs/${f}`);
            (0, fs_1.copyFileSync)(src, dest);
            console.log(`[dbBridge] Promoted ${f} -> ${dest}`);
            if ((0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), 'consolidated_segs'))) {
                (0, fs_1.copyFileSync)(src, (0, path_1.resolve)(process.cwd(), `consolidated_segs/${f}`));
            }
        }
        // Synchronize outline tree to indices.ts if provided
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            syncOutlineToIndicesTs(outlineTree, appName);
        }
        console.log(`[dbBridge] Regenerating segsFile.json for ${appName}...`);
        (0, child_process_1.execSync)(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });
        console.log(`[dbBridge] Regenerating db/seed_v2.sql...`);
        (0, child_process_1.execSync)('node ./nodeUtils/public/genSqlSeeds.js', { cwd: process.cwd() });
        await reseedPostgresFromSeedFile();
        console.log(`[dbBridge] Rebuilding ${appName}/dist/index.html...`);
        (0, child_process_1.execSync)(`node ./nodeUtils/public/indexBuild.js ${appName}`, { cwd: process.cwd() });
        for (const f of files) {
            try {
                (0, fs_1.unlinkSync)((0, path_1.resolve)(stagedDir, f));
            }
            catch { }
        }
        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Staged promotion complete for ${files.length} segment(s) in ${durationMs}ms.`);
        res.json({
            status: 'success',
            promotedCount: files.length,
            durationMs,
            message: `Successfully promoted ${files.length} segment(s) to source files, updated seed_v2.sql, reseeded PostgreSQL, and rebuilt index.html in ${durationMs}ms.`
        });
    }
    catch (err) {
        console.error('[dbBridge Error] Promote staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});
// ---------------------------------------------------------------------
// 4. Legacy Editor & Maxima Endpoints (Preserved for compatibility)
// ---------------------------------------------------------------------
app.get('/startEditor/:app/:segment', (req, res) => {
    const { app: appName, segment } = req.params;
    let relativePath = `./${appName}/segs/${segment}.html`;
    if (!(0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), relativePath))) {
        const altApp = appName === 'app1' ? 'app2' : 'app1';
        const altPath = `./${altApp}/segs/${segment}.html`;
        if ((0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), altPath))) {
            relativePath = altPath;
        }
    }
    const absPath = (0, path_1.resolve)(process.cwd(), relativePath);
    console.log(`launching SeaMonkey Composer for ${absPath}...`);
    (0, child_process_1.spawn)('SeaMonkey', ['-editor', absPath]);
    res.type('text/html').send(`editor launched for ${segment}`);
});
app.get(['/getSegs/:app', '/reload/:app', '/reload/:app/:seg'], (req, res) => {
    const appName = req.params.app;
    const seg = req.params.seg;
    if (req.path.startsWith('/reload')) {
        if (appName && seg) {
            try {
                console.log(`running ttdRefR for ${appName} seg ${seg}...`);
                (0, child_process_1.execSync)(`npm run ttdRefR -- --app ${appName} --seg ${seg}`);
            }
            catch (e) {
                console.error(`error running ttdRefR:`, e);
            }
        }
        try {
            (0, child_process_1.execSync)(`node ./nodeUtils/public/genSegsFiles.js ${appName}`);
        }
        catch (e) {
            console.error('error running genSegsFiles:', e);
        }
    }
    const fn = 'segsFile.json';
    const fp = `./${appName}/segs/${fn}`;
    try {
        const segs = (0, fs_1.readFileSync)(fp, 'utf8');
        res.type('application/json').send(segs);
    }
    catch (err) {
        res.status(404).send(`error reading ${fn} ${err}`);
    }
});
app.get(['/getSegsDate/:app', '/getSegsDate/:app/:editFlag'], (req, res) => {
    const { app: appName, editFlag } = req.params;
    const fn = editFlag === 'true' ? 'segsEditFile.json' : 'segsFile.json';
    const fp = `../${appName}/segs/${fn}`;
    try {
        const timestamp = (0, fs_1.statSync)(fp).mtimeMs;
        res.type('application/json').send(timestamp.toString());
    }
    catch (err) {
        res.status(404).send(`error finding modified time for ${fn} ${err}`);
    }
});
app.post('/svgPost/:app/:svgName', (req, res) => {
    const { app: appName, svgName } = req.params;
    const fp = `./${appName}/diagrams/${svgName}.svg`;
    try {
        let svg = '';
        if (typeof req.body === 'string') {
            svg = req.body;
        }
        else if (req.body && typeof req.body === 'object') {
            svg = req.body.svg || JSON.stringify(req.body);
        }
        (0, fs_1.writeFileSync)(fp, svg);
        res.send('ok');
    }
    catch (err) {
        res.status(500).send(`error writing ${fp} ${err}`);
    }
});
app.post('/evalMaxima', (req, res) => {
    try {
        const payload = req.body || {};
        const expr = (payload.expression || '').trim();
        const variable = (payload.variable || 'x').trim();
        const operation = payload.operation || 'integrate';
        if (!expr) {
            return res.status(400).json({ success: false, error: 'Expression cannot be empty.' });
        }
        let maximaCmd = '';
        const isPureInt = operation === 'integrate' && !expr.startsWith('diff') && !expr.startsWith('ratsimp') && !expr.startsWith('integrate');
        if (isPureInt) {
            maximaCmd = `display2d: false; trace(?sinint, ?integrator, ?diffdiv, ?ratint, ?trigint, ?rischint); integrate(${expr}, ${variable});`;
        }
        else if (expr.startsWith('integrate')) {
            maximaCmd = `display2d: false; trace(?sinint, ?integrator, ?diffdiv, ?ratint, ?trigint, ?rischint); ${expr};`;
        }
        else {
            maximaCmd = `display2d: false; trace(?sinint, ?integrator, ?diffdiv, ?ratint, ?trigint, ?rischint); ${expr.endsWith(';') || expr.endsWith('$') ? expr : expr + ';'}`;
        }
        const maximaPath = (0, fs_1.existsSync)('C:\\maxima-5.46.0\\bin\\maxima.bat')
            ? 'C:\\maxima-5.46.0\\bin\\maxima.bat'
            : (process.platform === 'win32' ? 'maxima.bat' : 'maxima');
        console.log(`[server] Running Maxima command: ${maximaCmd}`);
        const spawnRes = (0, child_process_1.spawnSync)(maximaPath, ['--very-quiet', `--batch-string=${maximaCmd}`], {
            encoding: 'utf8',
            timeout: 10000,
        });
        const rawStdout = (spawnRes.stdout || '') + (spawnRes.stderr ? `\n${spawnRes.stderr}` : '');
        res.json({
            success: true,
            rawOutput: rawStdout,
            command: maximaCmd,
            expression: expr,
            variable,
        });
    }
    catch (err) {
        console.error('[server] evalMaxima error:', err);
        res.status(500).json({ success: false, error: String(err) });
    }
});
// ---------------------------------------------------------------------
// 5. Static Console & Documentation Hosting
// ---------------------------------------------------------------------
app.use('/console', express_1.default.static((0, path_1.resolve)(process.cwd(), 'console')));
app.get('/', (_req, res) => {
    res.redirect('/console');
});
// ---------------------------------------------------------------------
// 6. Server Startup (HTTP port 3000 + HTTPS port 8080 if certs exist)
// ---------------------------------------------------------------------
const HTTP_PORT = parseInt(process.env.DB_SERVER_PORT || '3000');
http_1.default.createServer(app).listen(HTTP_PORT, () => {
    console.log(`[dbBridge] HTTP server listening on http://localhost:${HTTP_PORT}`);
    console.log(`[dbBridge] Interactive Database Console at http://localhost:${HTTP_PORT}/console`);
});
const sslKeyPath = (0, path_1.resolve)(process.cwd(), '../ssl/localhost+1-key.pem');
const sslCertPath = (0, path_1.resolve)(process.cwd(), '../ssl/localhost+1.pem');
if ((0, fs_1.existsSync)(sslKeyPath) && (0, fs_1.existsSync)(sslCertPath)) {
    try {
        const sslOptions = {
            key: (0, fs_1.readFileSync)(sslKeyPath),
            cert: (0, fs_1.readFileSync)(sslCertPath),
        };
        https_1.default.createServer(sslOptions, app).listen(8080, () => {
            console.log(`[server] HTTPS server listening on https://localhost:8080`);
        });
    }
    catch (err) {
        console.warn(`[server] Could not initialize HTTPS server on port 8080: ${err.message}`);
    }
}
