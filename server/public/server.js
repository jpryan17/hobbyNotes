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
app.post('/api/sync-to-db', async (req, res) => {
    const { app: appName = 'app1', outlineTree, segOverrides } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Resolve app_id
        const appRes = await client.query('SELECT id FROM apps WHERE app_code = $1;', [appName]);
        if (appRes.rows.length === 0) {
            throw new Error(`Application '${appName}' not found in database.`);
        }
        const appId = Number(appRes.rows[0].id);
        // 2. Fetch segment key to ID map
        const segRes = await client.query('SELECT id, seg_key FROM segments;');
        const segMap = new Map();
        for (const r of segRes.rows) {
            segMap.set(r.seg_key, Number(r.id));
        }
        // 3. Synchronize curriculum_nav_items if outlineTree provided
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            // Remove existing navigation tree for this app
            await client.query('DELETE FROM curriculum_nav_items WHERE app_id = $1;', [appId]);
            let counter = 0;
            const insertNodes = async (nodes, parentId) => {
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const itemType = node.type === 'index' ? 'section' : (node.type || 'html');
                    const segId = node.htmlSegmentId ? (segMap.get(node.htmlSegmentId) || null) : null;
                    const navKey = `${appName}_${itemType}_${Date.now().toString(36)}_${++counter}`;
                    const insRes = await client.query(`
                        INSERT INTO curriculum_nav_items (
                            nav_key, app_id, parent_id, sequence_order, item_type, topic, nav_topic, segment_id, diagram_key
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        RETURNING id;
                    `, [
                        navKey,
                        appId,
                        parentId,
                        i,
                        itemType,
                        node.topic,
                        node.navTopic || null,
                        segId,
                        node.diagramKey || (itemType === 'diagram' ? 'diagram' : null)
                    ]);
                    const newId = Number(insRes.rows[0].id);
                    if (Array.isArray(node.indexDesc) && node.indexDesc.length > 0) {
                        await insertNodes(node.indexDesc, newId);
                    }
                }
            };
            await insertNodes(outlineTree, null);
        }
        // 4. Synchronize any edited segments if segOverrides provided
        if (segOverrides && typeof segOverrides === 'object') {
            for (const [segKey, newHtml] of Object.entries(segOverrides)) {
                if (typeof newHtml === 'string' && newHtml.trim().length > 0) {
                    await client.query(`
                        UPDATE segments SET content_html = $1, updated_at = CURRENT_TIMESTAMP WHERE seg_key = $2;
                    `, [newHtml, segKey]);
                }
            }
        }
        await client.query('COMMIT');
        client.release();
        console.log(`[dbBridge] Successfully synchronized Dev state to PostgreSQL for '${appName}'.`);
        res.json({ status: 'success', message: `Successfully committed Dev state to database for ${appName}.` });
    }
    catch (err) {
        await client.query('ROLLBACK');
        client.release();
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
