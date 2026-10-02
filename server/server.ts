import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';
import { execSync, spawn } from 'child_process';
import { writeFileSync, readFileSync, statSync, existsSync, readdirSync, unlinkSync, copyFileSync, mkdirSync } from 'fs';
import { resolve, relative, dirname, isAbsolute, extname, basename } from 'path';
import { pathToFileURL } from 'url';

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ---------------------------------------------------------------------
// 1. PostgreSQL Connection Pool
// ---------------------------------------------------------------------

const pool = new Pool({
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
    } catch (err: any) {
        console.warn(`[dbBridge] Initial DB connection warning: ${err.message}. Ensure PostgreSQL service is running and credentials in .env are valid.`);
    }
})();

// ---------------------------------------------------------------------
// 2. Stateful Transaction Manager
// ---------------------------------------------------------------------

interface ActiveTransaction {
    client: PoolClient;
    timestamp: number;
}

const activeTransactions = new Map<string, ActiveTransaction>();
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

app.get('/api/health', async (_req: Request, res: Response) => {
    try {
        const dbRes = await pool.query('SELECT NOW() as now');
        res.json({ status: 'ok', dbTime: dbRes.rows[0].now });
    } catch (err: any) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.post('/api/sql', async (req: Request, res: Response) => {
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
        } catch (err: any) {
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
    } catch (err: any) {
        return res.status(500).json({
            status: 'error',
            message: 'Database query execution error.',
            error: err.message,
        });
    }
});

app.post('/api/transactions/begin', async (_req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        await client.query('BEGIN');
        const transactionId = randomUUID();
        activeTransactions.set(transactionId, { client, timestamp: Date.now() });

        console.log(`[dbBridge] Transaction started: ${transactionId}`);
        res.json({
            status: 'success',
            message: 'Transaction started.',
            transactionId,
        });
    } catch (err: any) {
        console.error('[dbBridge] Failed to begin transaction:', err);
        res.status(500).json({
            status: 'error',
            message: 'Could not begin transaction.',
            error: err.message,
        });
    }
});

app.post('/api/transactions/commit', async (req: Request, res: Response) => {
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
    } catch (err: any) {
        tx.client.release();
        activeTransactions.delete(transactionId);
        res.status(500).json({ status: 'error', message: 'Commit failed.', error: err.message });
    }
});

app.post('/api/transactions/rollback', async (req: Request, res: Response) => {
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
    } catch (err: any) {
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

app.post('/api/publish', async (req: Request, res: Response) => {
    const { app: appName = 'app1', pageName, outDir, outlineTree, segOverrides } = req.body;
    try {
        const publisherUrl = pathToFileURL(resolve(process.cwd(), 'nodeUtils/public/dbPublisher.js')).href + `?t=${Date.now()}`;
        // @ts-ignore - dbPublisher.js is compiled in nodeUtils without .d.ts
        const { publishStaticSite } = (await import(publisherUrl as any)) as any;
        const result = await publishStaticSite(appName, pool, { pageName, outDir, outlineTree, segOverrides });
        if (result.success) {
            res.json({ status: 'success', data: result });
        } else {
            res.status(500).json({ status: 'error', message: result.error, data: result });
        }
    } catch (err: any) {
        console.error('[dbBridge Error] Publish failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 3c. Commit Dev State to PostgreSQL Database Endpoint
// ---------------------------------------------------------------------

// Helper to reseed PostgreSQL from db/seed.sql
async function reseedPostgresFromSeedFile(): Promise<void> {
    const seedPath = resolve(process.cwd(), 'db/seed.sql');
    if (existsSync(seedPath)) {
        const seedSql = readFileSync(seedPath, 'utf8');
        await pool.query(seedSql);
        console.log('[dbBridge] Reseeded PostgreSQL database from updated seed.sql');
    }
}

app.post('/api/sync-to-db', async (req: Request, res: Response) => {
    const { app: appName = 'app1', outlineTree, segOverrides } = req.body;

    try {
        let filesChanged = false;

        // 1. Synchronize outline tree changes to indices.ts
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            const outlineModified = syncOutlineToIndicesTs(outlineTree, appName);
            if (outlineModified) filesChanged = true;
        }

        // 2. Synchronize any edited segments back to source files
        if (segOverrides && typeof segOverrides === 'object') {
            for (const [segKey, newHtml] of Object.entries(segOverrides)) {
                if (typeof newHtml === 'string' && newHtml.trim().length > 0) {
                    const destPath = resolve(process.cwd(), `${appName}/segs/${segKey}.html`);
                    let existingHtml: string | null = null;
                    if (existsSync(destPath)) {
                        existingHtml = readFileSync(destPath, 'utf8');
                    }
                    const formatted = formatSegmentFileHtml(existingHtml, newHtml, segKey);
                    writeFileSync(destPath, formatted, 'utf8');
                    console.log(`[dbBridge] Wrote updated segment to ${destPath}`);
                    filesChanged = true;
                }
            }
        }

        // 3. Regenerate segsFile.json & db/seed.sql
        console.log(`[dbBridge] Regenerating segsFile.json for ${appName}...`);
        execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });

        console.log(`[dbBridge] Regenerating db/seed.sql...`);
        execSync('node ./nodeUtils/public/genSqlSeeds.js', { cwd: process.cwd() });

        // 4. Reseed PostgreSQL from freshly generated seed.sql
        await reseedPostgresFromSeedFile();

        console.log(`[dbBridge] Successfully committed Dev state: source files, seed.sql, and PostgreSQL in 100% sync.`);
        res.json({
            status: 'success',
            message: `Successfully synchronized Dev state to source files, updated seed.sql, and reseeded PostgreSQL.`
        });
    } catch (err: any) {
        console.error('[dbBridge Error] Sync to DB failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 3d. Reseed Database from Clean Git Baseline Endpoint
// ---------------------------------------------------------------------

app.post('/api/reseed-db', async (_req: Request, res: Response) => {
    try {
        const seedPath = resolve(process.cwd(), 'db/seed.sql');
        if (!existsSync(seedPath)) {
            return res.status(404).json({ status: 'error', message: 'db/seed.sql not found.' });
        }
        const seedSql = readFileSync(seedPath, 'utf8');
        const start = Date.now();
        await pool.query(seedSql);
        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Successfully reseeded database from db/seed.sql in ${durationMs}ms`);
        res.json({
            status: 'success',
            message: `Database successfully reseeded from clean Git baseline (seed.sql) in ${durationMs}ms.`,
            durationMs,
        });
    } catch (err: any) {
        console.error('[dbBridge Error] Reseed DB failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 3e. 2-Phase Segment Staging & Promotion Endpoints
// ---------------------------------------------------------------------

function formatSegmentFileHtml(existingHtml: string | null, newContent: string, segId: string): string {
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

function getStagedDir(): string {
    const staged = resolve(process.cwd(), 'stagedSegs');
    if (existsSync(staged)) return staged;
    const saved = resolve(process.cwd(), 'savedSegs');
    if (existsSync(saved)) return saved;
    return staged;
}

function getStagedFilePath(segId: string | string[]): string {
    const id = Array.isArray(segId) ? segId[0] : segId;
    const stagedPath = resolve(process.cwd(), `stagedSegs/${id}.html`);
    if (existsSync(stagedPath)) return stagedPath;
    const savedPath = resolve(process.cwd(), `savedSegs/${id}.html`);
    if (existsSync(savedPath)) return savedPath;
    return stagedPath;
}

// 1. Stage a segment draft to stagedSegs/<segId>.html
app.post('/api/stage-segment', (req: Request, res: Response) => {
    const { app: appName = 'app1', segId, contentHtml } = req.body;
    if (!segId || typeof contentHtml !== 'string') {
        return res.status(400).json({ status: 'error', message: 'segId and contentHtml are required.' });
    }

    try {
        const stagedDir = getStagedDir();
        if (!existsSync(stagedDir)) {
            mkdirSync(stagedDir, { recursive: true });
        }

        let existingHtml: string | null = null;
        const sourcePath = resolve(process.cwd(), `${appName}/segs/${segId}.html`);
        if (existsSync(sourcePath)) {
            existingHtml = readFileSync(sourcePath, 'utf8');
        }

        const formattedHtml = formatSegmentFileHtml(existingHtml, contentHtml, segId);
        const targetPath = resolve(stagedDir, `${segId}.html`);
        writeFileSync(targetPath, formattedHtml, 'utf8');

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
    } catch (err: any) {
        console.error('[dbBridge Error] Stage segment failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 2. List all staged segments in stagedSegs/
app.get('/api/staged-segments', (_req: Request, res: Response) => {
    try {
        const stagedDir = getStagedDir();
        if (!existsSync(stagedDir)) {
            return res.json({ status: 'success', staged: [] });
        }

        const files = readdirSync(stagedDir).filter(f => f.endsWith('.html'));
        const staged = files.map(filename => {
            const filePath = resolve(stagedDir, filename);
            const stats = statSync(filePath);
            const segId = filename.replace(/\.html$/, '');
            const content = readFileSync(filePath, 'utf8');
            const h1Match = /<h1[^>]*>(.*?)<\/h1>/i.exec(content);
            const hTitleMatch = /<font[^>]*size=["']?\+2["']?[^>]*>(?:<i>)?(?:<b>)?(.*?)(?:<\/b>)?(?:<\/i>)?<\/font>/i.exec(content);
            const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
            const h3Match = /<h3>(.*?)<\/h3>/i.exec(content);
            const rawTitle = (h1Match && h1Match[1]) || (hTitleMatch && hTitleMatch[1]) || (titleMatch && titleMatch[1]) || (h3Match && h3Match[1]) || segId;
            const title = rawTitle
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();

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
    } catch (err: any) {
        console.error('[dbBridge Error] Get staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 2b. Get a single staged segment by segId
app.get('/api/staged-segments/:segId', (req: Request, res: Response) => {
    const { segId } = req.params;
    try {
        const filePath = getStagedFilePath(segId);
        if (!existsSync(filePath)) {
            return res.status(404).json({ status: 'error', message: `Staged segment '${segId}' not found.` });
        }
        const fullContent = readFileSync(filePath, 'utf8');
        const bodyMatch = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i.exec(fullContent);
        const contentHtml = bodyMatch ? bodyMatch[2].trim() : fullContent;
        res.json({ status: 'success', segId, contentHtml, fullHtml: fullContent });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 3. Discard a specific staged segment
app.delete('/api/staged-segments/:segId', (req: Request, res: Response) => {
    const { segId } = req.params;
    try {
        const filePath = getStagedFilePath(segId);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
            console.log(`[dbBridge] Discarded staged segment: ${filePath}`);
            res.json({ status: 'success', message: `Staged segment '${segId}' discarded.` });
        } else {
            res.status(404).json({ status: 'error', message: `Staged segment '${segId}' not found.` });
        }
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 4. Discard all staged segments
app.delete('/api/staged-segments', (_req: Request, res: Response) => {
    try {
        const stagedDir = getStagedDir();
        if (existsSync(stagedDir)) {
            const files = readdirSync(stagedDir).filter(f => f.endsWith('.html'));
            for (const f of files) {
                unlinkSync(resolve(stagedDir, f));
            }
        }
        res.json({ status: 'success', message: 'All staged segments cleared.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 4b. List all files in app1/segs and stagedSegs
app.get('/api/consolidated-segments', (_req: Request, res: Response) => {
    try {
        const segDir = resolve(process.cwd(), 'app1/segs');

        const stagedDir = getStagedDir();
        const segMap = new Map<string, any>();

        // 1. Existing consolidated / source segments
        if (existsSync(segDir)) {
            const files = readdirSync(segDir).filter(f => f.endsWith('.html'));
            for (const filename of files) {
                const filePath = resolve(segDir, filename);
                const stats = statSync(filePath);
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
        if (existsSync(stagedDir)) {
            const stagedFiles = readdirSync(stagedDir).filter(f => f.endsWith('.html'));
            for (const filename of stagedFiles) {
                const filePath = resolve(stagedDir, filename);
                const stats = statSync(filePath);
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
    } catch (err: any) {
        console.error('[dbBridge Error] Get consolidated segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 4c. Get single segment content on demand (searches app1/segs, consolidated_segs, stagedSegs, savedSegs)
app.get('/api/segment-content/:segId', (req: Request, res: Response) => {
    const { segId } = req.params;
    const candidates = [
        resolve(process.cwd(), `app1/segs/${segId}.html`),
        resolve(process.cwd(), `stagedSegs/${segId}.html`),
        resolve(process.cwd(), `savedSegs/${segId}.html`),
    ];
    for (const filePath of candidates) {
        if (existsSync(filePath)) {
            try {
                const fullContent = readFileSync(filePath, 'utf8');
                const bodyMatch = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i.exec(fullContent);
                const contentHtml = bodyMatch ? bodyMatch[2].trim() : fullContent;
                return res.json({ status: 'success', segId, content: contentHtml, fullHtml: fullContent });
            } catch (err: any) {
                return res.status(500).json({ status: 'error', message: `Error reading segment file: ${err.message}` });
            }
        }
    }
    return res.status(404).json({ status: 'error', message: `Segment '${segId}' not found.` });
});

// Helper to synchronize outline tree state into indices.ts
function syncOutlineToIndicesTs(outlineTree: any[], appName: string = 'app1'): boolean {
    const indicesTsPath = resolve(process.cwd(), `${appName}/src/indices.ts`);
    if (!existsSync(indicesTsPath)) return false;
    let content = readFileSync(indicesTsPath, 'utf8');
    let modified = false;

    const activeSegIds = new Set<string>();
    function collectActiveSegIds(nodes: any[]) {
        for (const node of nodes) {
            if (node.htmlSegmentId) activeSegIds.add(node.htmlSegmentId);
            if (node.indexDesc && Array.isArray(node.indexDesc)) collectActiveSegIds(node.indexDesc);
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
    function checkNodes(nodes: any[], parentSectionTitle: string = '') {
        for (const node of nodes) {
            if (node.type === 'index' && Array.isArray(node.indexDesc)) {
                checkNodes(node.indexDesc, node.topic || parentSectionTitle);
            } else if (node.type === 'html' && node.htmlSegmentId) {
                const segId = node.htmlSegmentId;
                if (!content.includes(`"${segId}"`) && !content.includes(`'${segId}'`)) {
                    console.log(`[dbBridge] Attaching new index entry '${segId}' (${node.topic}) to indices.ts...`);
                    const entryCode = `  {\n    type: "html",\n    topic: ${JSON.stringify(node.topic)},\n    navTopic: ${JSON.stringify(node.navTopic || node.topic)},\n    htmlSegmentId: ${JSON.stringify(segId)},\n  },\n];`;

                    let targetArrayName = 'stemBridgeIndex';
                    const pTitle = (parentSectionTitle || '').toLowerCase();
                    if (pTitle.includes('foundation') || pTitle.includes('logic')) {
                        targetArrayName = 'foundationIndex';
                    } else if (pTitle.includes('seminar') || pTitle.includes('satellite')) {
                        targetArrayName = 'satellitesIndex';
                    } else if (pTitle.includes('proposal') || pTitle.includes('research')) {
                        targetArrayName = 'proposalsIndex';
                    }

                    const arrayRegex = new RegExp(`(export const ${targetArrayName}[^=]*=\\s*\\[[\\s\\S]*?)(];)`);
                    if (arrayRegex.test(content)) {
                        content = content.replace(arrayRegex, `$1${entryCode}`);
                        modified = true;
                    } else {
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
        writeFileSync(indicesTsPath, content, 'utf8');
        console.log(`[dbBridge] Updated ${indicesTsPath} to reflect outline tree.`);
        try {
            execSync('npm run compile', { cwd: process.cwd() });
        } catch (e) {
            console.error('[dbBridge Error] Compiling indices.ts failed:', e);
        }
    }
    return modified;
}

// 5. Promote all staged segments to source files, regenerate seed, reseed DB, and rebuild index
app.post('/api/promote-staged-segments', async (req: Request, res: Response) => {
    const { app: appName = 'app1', outlineTree } = req.body;
    const stagedDir = getStagedDir();
    if (!existsSync(stagedDir)) {
        return res.status(400).json({ status: 'error', message: 'No stagedSegs/ directory found.' });
    }

    const files = readdirSync(stagedDir).filter(f => f.endsWith('.html'));
    if (files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No staged segment files found in stagedSegs/.' });
    }

    const start = Date.now();
    try {
        for (const f of files) {
            const src = resolve(stagedDir, f);
            const dest = resolve(process.cwd(), `${appName}/segs/${f}`);
            copyFileSync(src, dest);
            console.log(`[dbBridge] Promoted ${f} -> ${dest}`);


        }

        // Synchronize outline tree to indices.ts if provided
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            syncOutlineToIndicesTs(outlineTree, appName);
        }

        console.log(`[dbBridge] Regenerating segsFile.json for ${appName}...`);
        execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });

        console.log(`[dbBridge] Regenerating db/seed.sql...`);
        execSync('node ./nodeUtils/public/genSqlSeeds.js', { cwd: process.cwd() });

        await reseedPostgresFromSeedFile();

        console.log(`[dbBridge] Rebuilding ${appName}/dist/index.html...`);
        execSync(`node ./nodeUtils/public/indexBuild.js ${appName}`, { cwd: process.cwd() });

        for (const f of files) {
            try { unlinkSync(resolve(stagedDir, f)); } catch {}
        }

        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Staged promotion complete for ${files.length} segment(s) in ${durationMs}ms.`);

        res.json({
            status: 'success',
            promotedCount: files.length,
            durationMs,
            message: `Successfully promoted ${files.length} segment(s) to source files, updated seed.sql, reseeded PostgreSQL, and rebuilt index.html in ${durationMs}ms.`
        });
    } catch (err: any) {
        console.error('[dbBridge Error] Promote staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 4. Standalone Editor & Workspace Umbrella File Endpoints
// ---------------------------------------------------------------------

const UMBRELLA_DIR = resolve(process.cwd());

function validateUmbrellaPath(userPath: string): { fullPath: string; relPath: string } {
    if (!userPath || typeof userPath !== 'string') {
        throw new Error('File path is required.');
    }
    let clean = userPath.trim().replace(/^file:\/\/\/?/i, '');

    // Allow pure segment name shortcut (e.g. "modelsOverview" -> "app1/segs/modelsOverview.html")
    if (!clean.includes('/') && !clean.includes('\\') && !clean.endsWith('.html') && !clean.endsWith('.htm')) {
        if (clean === 'overview') {
            clean = 'overview.html';
        } else {
            clean = `app1/segs/${clean}.html`;
        }
    }

    // Resolve absolute paths directly, or relative paths against workspace root
    const fullPath = isAbsolute(clean) ? resolve(clean) : resolve(UMBRELLA_DIR, clean);
    const rel = relative(UMBRELLA_DIR, fullPath);
    const relPath = (!rel.startsWith('..') && !isAbsolute(rel)) ? rel.replace(/\\/g, '/') : fullPath.replace(/\\/g, '/');

    return { fullPath, relPath };
}

function scanProjectHtmlFiles(): Array<{ path: string; name: string; group: string; mtime: number }> {
    const results: Array<{ path: string; name: string; group: string; mtime: number }> = [];
    const ignoreDirs = new Set(['node_modules', '.git', '.gemini', 'coverage', '.cache', 'dist_backup', 'scratch']);

    function walk(dir: string, baseRel: string) {
        if (!existsSync(dir)) return;
        try {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    if (!ignoreDirs.has(entry.name)) {
                        walk(resolve(dir, entry.name), baseRel ? `${baseRel}/${entry.name}` : entry.name);
                    }
                } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
                    const rel = (baseRel ? `${baseRel}/${entry.name}` : entry.name).replace(/\\/g, '/');
                    let group = 'Workspace Files';
                    if (rel.startsWith('app1/segs/')) group = 'App 1 Segments';
                    else if (rel.startsWith('app2/segs/')) group = 'App 2 Segments';
                    else if (rel.startsWith('app1/dist/')) group = 'App 1 Dist';
                    else if (rel.startsWith('server/')) group = 'Server Templates';
                    else if (!baseRel) group = 'Root Documents';

                    let mtime = 0;
                    try {
                        mtime = statSync(resolve(dir, entry.name)).mtimeMs;
                    } catch {}

                    results.push({
                        path: rel,
                        name: entry.name,
                        group,
                        mtime
                    });
                }
            }
        } catch {}
    }

    walk(UMBRELLA_DIR, '');
    return results;
}

// List all HTML files under the project umbrella
app.get('/api/editor/files', (_req: Request, res: Response) => {
    try {
        const files = scanProjectHtmlFiles();
        res.json({
            status: 'success',
            umbrellaDir: UMBRELLA_DIR,
            count: files.length,
            files
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Load any HTML file within the project umbrella
app.get('/api/editor/file', (req: Request, res: Response) => {
    try {
        const queryPath = (req.query.path || req.query.file || req.query.segId) as string;
        if (!queryPath) {
            return res.status(400).json({ status: 'error', message: 'Parameter "path" or "file" is required.' });
        }
        const { fullPath, relPath } = validateUmbrellaPath(queryPath);
        if (!existsSync(fullPath)) {
            return res.status(404).json({ status: 'error', message: `File not found: ${relPath}` });
        }
        const rawHtml = readFileSync(fullPath, 'utf8');
        res.json({
            status: 'success',
            path: relPath,
            fullPath,
            rawHtml,
            isFullDoc: /<html[^>]*>/i.test(rawHtml)
        });
    } catch (err: any) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// Save or replace any HTML file within the project umbrella
app.post('/api/editor/save', (req: Request, res: Response) => {
    const { path: queryPath, content, saveMode = 'body' } = req.body;
    if (!queryPath || typeof content !== 'string') {
        return res.status(400).json({ status: 'error', message: 'path and content are required.' });
    }

    try {
        const { fullPath, relPath } = validateUmbrellaPath(queryPath);

        // Protect hobbyNotes repository files from standalone editor overwrites
        if (fullPath.startsWith(UMBRELLA_DIR)) {
            return res.status(403).json({
                status: 'error',
                message: 'hobbyNotes project files are protected and off-limits in the standalone editor to prevent accidental overwrites. Please save your document to an external folder or use the native save picker.'
            });
        }

        const parent = dirname(fullPath);
        if (!existsSync(parent)) {
            mkdirSync(parent, { recursive: true });
        }

        let existingHtml: string | null = null;
        if (existsSync(fullPath)) {
            existingHtml = readFileSync(fullPath, 'utf8');
        }

        let finalContent = content;
        if (saveMode === 'body') {
            const segName = basename(fullPath, extname(fullPath));
            finalContent = formatSegmentFileHtml(existingHtml, content, segName);
        }

        writeFileSync(fullPath, finalContent, 'utf8');
        console.log(`[server] Directly replaced file ${relPath} (${Buffer.byteLength(finalContent)} bytes)`);

        // If the saved file is in app1/segs or app2/segs, auto-regenerate segsFile.json
        if (relPath.startsWith('app1/segs/')) {
            try {
                execSync('node ./nodeUtils/public/genSegsFiles.js app1', { cwd: process.cwd() });
                console.log('[server] Auto-regenerated segsFile.json for app1');
            } catch (genErr) {
                console.warn('[server Warning] genSegsFiles app1 error:', genErr);
            }
        } else if (relPath.startsWith('app2/segs/')) {
            try {
                execSync('node ./nodeUtils/public/genSegsFiles.js app2', { cwd: process.cwd() });
                console.log('[server] Auto-regenerated segsFile.json for app2');
            } catch (genErr) {
                console.warn('[server Warning] genSegsFiles app2 error:', genErr);
            }
        }

        // Overview / modelsOverview bidirectional synchronization
        if (relPath === 'app1/segs/modelsOverview.html') {
            const rootOverview = resolve(process.cwd(), 'overview.html');
            if (existsSync(rootOverview)) {
                const rootExisting = readFileSync(rootOverview, 'utf8');
                const formattedOverview = formatSegmentFileHtml(rootExisting, content, 'overview');
                writeFileSync(rootOverview, formattedOverview, 'utf8');
                console.log('[server] Auto-synced modelsOverview to overview.html');
            }
        } else if (relPath === 'overview.html') {
            const modelsOverview = resolve(process.cwd(), 'app1/segs/modelsOverview.html');
            if (existsSync(modelsOverview)) {
                const segExisting = readFileSync(modelsOverview, 'utf8');
                const formattedSeg = formatSegmentFileHtml(segExisting, content, 'modelsOverview');
                writeFileSync(modelsOverview, formattedSeg, 'utf8');
                console.log('[server] Auto-synced overview.html to modelsOverview.html');
            }
        }

        res.json({
            status: 'success',
            ok: true,
            path: relPath,
            fullPath,
            bytes: Buffer.byteLength(finalContent),
            savedAt: new Date().toISOString(),
            message: `File '${relPath}' saved successfully.`
        });
    } catch (err: any) {
        console.error('[server Error] Editor save failed:', err);
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// Backwards compatibility endpoints
app.get('/api/segment-files', (_req: Request, res: Response) => {
    try {
        const appName = 'app1';
        const segsDir = resolve(process.cwd(), `${appName}/segs`);
        const files: string[] = [];
        if (existsSync(segsDir)) {
            const list = readdirSync(segsDir)
                .filter(f => f.endsWith('.html') && !f.includes('File.json'))
                .map(f => f.replace(/\.html$/, ''));
            files.push(...list);
        }
        if (existsSync(resolve(process.cwd(), 'overview.html'))) {
            files.unshift('overview');
        }
        res.json({ status: 'success', files });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/segment-raw/:segId', (req: Request, res: Response) => {
    const { segId } = req.params;
    const appName = (req.query.app as string) || 'app1';
    try {
        let filePath = '';
        const idStr = String(segId);
        if (idStr === 'overview' || idStr === 'overview.html') {
            filePath = resolve(process.cwd(), 'overview.html');
        } else {
            const cleanId = idStr.replace(/\.html$/, '');
            filePath = resolve(process.cwd(), `${appName}/segs/${cleanId}.html`);
        }

        if (!existsSync(filePath)) {
            return res.status(404).json({ status: 'error', message: `File not found: ${filePath}` });
        }

        const rawHtml = readFileSync(filePath, 'utf8');
        res.json({ status: 'success', segId: idStr, rawHtml });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/save-segment-direct', (req: Request, res: Response) => {
    const { app: appName = 'app1', segId, contentHtml } = req.body;
    if (!segId || typeof contentHtml !== 'string') {
        return res.status(400).json({ status: 'error', message: 'segId and contentHtml are required.' });
    }

    try {
        const targetRel = segId === 'overview' || segId === 'overview.html' ? 'overview.html' : `${appName}/segs/${String(segId).replace(/\.html$/, '')}.html`;
        const { fullPath, relPath } = validateUmbrellaPath(targetRel);

        let existingHtml: string | null = null;
        if (existsSync(fullPath)) {
            existingHtml = readFileSync(fullPath, 'utf8');
        }

        const formattedHtml = formatSegmentFileHtml(existingHtml, contentHtml, String(segId));
        writeFileSync(fullPath, formattedHtml, 'utf8');

        if (segId === 'modelsOverview') {
            const rootOverview = resolve(process.cwd(), 'overview.html');
            if (existsSync(rootOverview)) {
                let existingOverview = readFileSync(rootOverview, 'utf8');
                const formattedOverview = formatSegmentFileHtml(existingOverview, contentHtml, 'overview');
                writeFileSync(rootOverview, formattedOverview, 'utf8');
            }
        }

        if (relPath.startsWith('app1/segs/')) {
            try {
                execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });
            } catch (genErr) {
                console.warn(`[server Warning] Failed to regenerate segsFile.json:`, genErr);
            }
        }

        res.json({
            status: 'success',
            ok: true,
            segId,
            filePath: fullPath,
            bytes: Buffer.byteLength(formattedHtml),
            savedAt: new Date().toISOString(),
            message: `Segment '${segId}' saved directly to disk.`
        });
    } catch (err: any) {
        console.error('[server Error] Direct save failed:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get(['/editor', '/editor/:app/:segment', '/startEditor/:app/:segment'], (_req: Request, res: Response) => {
    const editorHtmlPath = resolve(process.cwd(), 'server/standaloneEditor.html');
    if (existsSync(editorHtmlPath)) {
        res.sendFile(editorHtmlPath);
    } else {
        res.redirect('/console');
    }
});

app.get(['/getSegs/:app', '/reload/:app', '/reload/:app/:seg'], (req: Request, res: Response) => {
    const appName = req.params.app;
    const seg = req.params.seg;

    if (req.path.startsWith('/reload')) {
        if (appName && seg) {
            try {
                console.log(`running ttdRefR for ${appName} seg ${seg}...`);
                execSync(`npm run ttdRefR -- --app ${appName} --seg ${seg}`);
            } catch (e) {
                console.error(`error running ttdRefR:`, e);
            }
        }
        try {
            execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`);
        } catch (e) {
            console.error('error running genSegsFiles:', e);
        }
    } else if (appName) {
        try {
            const fp = `./${appName}/segs/segsFile.json`;
            const segDir = resolve(process.cwd(), `./${appName}/segs`);
            let needsRegen = !existsSync(fp);
            if (!needsRegen && existsSync(segDir)) {
                const jsonMtime = statSync(fp).mtimeMs;
                const files = readdirSync(segDir).filter(f => f.endsWith('.html'));
                for (const file of files) {
                    if (statSync(resolve(segDir, file)).mtimeMs > jsonMtime) {
                        needsRegen = true;
                        break;
                    }
                }
            }
            if (needsRegen) {
                execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });
            }
        } catch (e) {
            console.warn('[server Warning] Could not check or regen segsFile.json:', e);
        }
    }

    const fn = 'segsFile.json';
    const fp = `./${appName}/segs/${fn}`;
    try {
        const segs = readFileSync(fp, 'utf8');
        res.type('application/json').send(segs);
    } catch (err) {
        res.status(404).send(`error reading ${fn} ${err}`);
    }
});

app.get(['/getSegsDate/:app', '/getSegsDate/:app/:editFlag'], (req: Request, res: Response) => {
    const { app: appName, editFlag } = req.params;
    const fn = editFlag === 'true' ? 'segsEditFile.json' : 'segsFile.json';
    const fp = `../${appName}/segs/${fn}`;
    try {
        const timestamp = statSync(fp).mtimeMs;
        res.type('application/json').send(timestamp.toString());
    } catch (err) {
        res.status(404).send(`error finding modified time for ${fn} ${err}`);
    }
});

app.post(['/svgPost/:app/:svgName', '/svgPostWithMeta'], (req: Request, res: Response) => {
    const appName = req.params.app || req.body?.app || 'app1';
    const svgName = req.params.svgName || req.body?.diagramName || 'diagram';
    const segId = req.body?.segId;

    try {
        let svg = '';
        if (typeof req.body === 'string') {
            svg = req.body;
        } else if (req.body && typeof req.body === 'object') {
            svg = req.body.svg || JSON.stringify(req.body);
        }

        if (!svg || !svg.includes('<svg')) {
            console.warn(`[server Warning] Received non-SVG or empty content for diagram "${svgName}", skipping write.`);
            return res.status(400).send('Invalid SVG content');
        }

        if (svg && !svg.includes(`data-diagram-name="${svgName}"`)) {
            svg = svg.replace(/<svg\b/i, `<svg data-diagram-name="${svgName}" `);
        }

        // 1. Save to diagrams/ folder
        const diagramsDir = resolve(process.cwd(), `./${appName}/diagrams`);
        if (!existsSync(diagramsDir)) mkdirSync(diagramsDir, { recursive: true });
        writeFileSync(resolve(diagramsDir, `${svgName}.svg`), svg, 'utf8');

        // 2. Save to segPics/ folder as dual-format .drawio.svg
        const segPicsDir = resolve(process.cwd(), `./${appName}/segPics`);
        if (!existsSync(segPicsDir)) mkdirSync(segPicsDir, { recursive: true });
        writeFileSync(resolve(segPicsDir, `${svgName}.drawio.svg`), svg, 'utf8');

        // 3. If segId provided, also update the segment file on disk
        if (segId) {
            const segFile = resolve(process.cwd(), `./${appName}/segs/${segId}.html`);
            if (existsSync(segFile)) {
                let segContent = readFileSync(segFile, 'utf8');
                const svgMatchRegex = new RegExp(`<svg[^>]*data-diagram-name="${svgName}"[^>]*>[\\s\\S]*?<\\/svg>`, 'i');
                if (svgMatchRegex.test(segContent)) {
                    segContent = segContent.replace(svgMatchRegex, svg);
                    writeFileSync(segFile, segContent, 'utf8');
                    console.log(`[server] Updated inline SVG in segment file ${segId}.html`);
                }
            }

            if (segId === 'modelsOverview') {
                const overviewFile = resolve(process.cwd(), 'overview.html');
                if (existsSync(overviewFile)) {
                    let overviewContent = readFileSync(overviewFile, 'utf8');
                    const svgMatchRegex = new RegExp(`<svg[^>]*data-diagram-name="${svgName}"[^>]*>[\\s\\S]*?<\\/svg>`, 'i');
                    if (svgMatchRegex.test(overviewContent)) {
                        overviewContent = overviewContent.replace(svgMatchRegex, svg);
                        writeFileSync(overviewFile, overviewContent, 'utf8');
                        console.log(`[server] Updated inline SVG in root overview.html`);
                    }
                }
            }

            try {
                execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });
                console.log(`[server] Regenerated segsFile.json after SVG update for ${appName}`);
            } catch (genErr) {
                console.warn(`[server Warning] Failed to regenerate segsFile.json:`, genErr);
            }
        }

        console.log(`[server] Successfully saved diagram "${svgName}" for ${appName}`);
        res.send('ok');
    } catch (err) {
        console.error(`[server Error] Error writing SVG:`, err);
        res.status(500).send(`error writing svg ${err}`);
    }
});

// Static assets hosting
app.use('/segPics', express.static(resolve(process.cwd(), 'app1/segPics')));
app.use('/diagrams', express.static(resolve(process.cwd(), 'app1/diagrams')));

// ---------------------------------------------------------------------
// 5. Static Console & Documentation Hosting
// ---------------------------------------------------------------------

app.use('/console', express.static(resolve(process.cwd(), 'console')));

app.get('/', (_req: Request, res: Response) => {
    res.redirect('/console');
});

// ---------------------------------------------------------------------
// 6. Server Startup (HTTP port 3000 + HTTPS port 8080 if certs exist)
// ---------------------------------------------------------------------

const HTTP_PORT = parseInt(process.env.DB_SERVER_PORT || '3000');
http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`[dbBridge] HTTP server listening on http://localhost:${HTTP_PORT}`);
    console.log(`[dbBridge] Interactive Database Console at http://localhost:${HTTP_PORT}/console`);
});

const sslKeyPath = resolve(process.cwd(), '../ssl/localhost+1-key.pem');
const sslCertPath = resolve(process.cwd(), '../ssl/localhost+1.pem');

if (existsSync(sslKeyPath) && existsSync(sslCertPath)) {
    try {
        const sslOptions = {
            key: readFileSync(sslKeyPath),
            cert: readFileSync(sslCertPath),
        };
        https.createServer(sslOptions, app).listen(8080, () => {
            console.log(`[server] HTTPS server listening on https://localhost:8080`);
        });
    } catch (err: any) {
        console.warn(`[server] Could not initialize HTTPS server on port 8080: ${err.message}`);
    }
}
