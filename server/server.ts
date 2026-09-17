import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';
import { execSync, spawn, spawnSync } from 'child_process';
import { writeFileSync, readFileSync, statSync, existsSync, readdirSync, unlinkSync, copyFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
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

app.post('/api/sync-to-db', async (req: Request, res: Response) => {
    const { app: appName = 'app1', outlineTree, segOverrides } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Resolve app_id
        const appRes = await client.query<{ id: string | number }>('SELECT id FROM apps WHERE app_code = $1;', [appName]);
        if (appRes.rows.length === 0) {
            throw new Error(`Application '${appName}' not found in database.`);
        }
        const appId = Number(appRes.rows[0].id);

        // 2. Fetch segment key to ID map
        const segRes = await client.query<{ id: string | number; seg_key: string }>('SELECT id, seg_key FROM segments;');
        const segMap = new Map<string, number>();
        for (const r of segRes.rows) {
            segMap.set(r.seg_key, Number(r.id));
        }

        // 3. Synchronize curriculum_nav_items if outlineTree provided
        if (Array.isArray(outlineTree) && outlineTree.length > 0) {
            // Remove existing navigation tree for this app
            await client.query('DELETE FROM curriculum_nav_items WHERE app_id = $1;', [appId]);

            let counter = 0;
            const insertNodes = async (nodes: any[], parentId: number | null): Promise<void> => {
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const itemType = node.type === 'index' ? 'section' : (node.type || 'html');
                    const segId = node.htmlSegmentId ? (segMap.get(node.htmlSegmentId) || null) : null;
                    const navKey = `${appName}_${itemType}_${Date.now().toString(36)}_${++counter}`;

                    const insRes = await client.query<{ id: string | number }>(`
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
    } catch (err: any) {
        await client.query('ROLLBACK');
        client.release();
        console.error('[dbBridge Error] Sync to DB failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 3d. Reseed Database from Clean Git Baseline Endpoint
// ---------------------------------------------------------------------

app.post('/api/reseed-db', async (_req: Request, res: Response) => {
    try {
        const seedPath = resolve(process.cwd(), 'db/seed_v2.sql');
        if (!existsSync(seedPath)) {
            return res.status(404).json({ status: 'error', message: 'db/seed_v2.sql not found.' });
        }
        const seedSql = readFileSync(seedPath, 'utf8');
        const start = Date.now();
        await pool.query(seedSql);
        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Successfully reseeded database from db/seed_v2.sql in ${durationMs}ms`);
        res.json({
            status: 'success',
            message: `Database successfully reseeded from clean Git baseline (seed_v2.sql) in ${durationMs}ms.`,
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

// 1. Stage a segment draft to savedSegs/<segId>.html
app.post('/api/stage-segment', (req: Request, res: Response) => {
    const { app: appName = 'app1', segId, contentHtml } = req.body;
    if (!segId || typeof contentHtml !== 'string') {
        return res.status(400).json({ status: 'error', message: 'segId and contentHtml are required.' });
    }

    try {
        const savedDir = resolve(process.cwd(), 'savedSegs');
        if (!existsSync(savedDir)) {
            mkdirSync(savedDir, { recursive: true });
        }

        let existingHtml: string | null = null;
        const sourcePath = resolve(process.cwd(), `${appName}/segs/${segId}.html`);
        if (existsSync(sourcePath)) {
            existingHtml = readFileSync(sourcePath, 'utf8');
        }

        const formattedHtml = formatSegmentFileHtml(existingHtml, contentHtml, segId);
        const targetPath = resolve(savedDir, `${segId}.html`);
        writeFileSync(targetPath, formattedHtml, 'utf8');

        console.log(`[dbBridge] Staged segment '${segId}' to ${targetPath} (${Buffer.byteLength(formattedHtml)} bytes)`);
        res.json({
            status: 'success',
            segId,
            filePath: `savedSegs/${segId}.html`,
            bytes: Buffer.byteLength(formattedHtml),
            stagedAt: new Date().toISOString(),
            message: `Segment '${segId}' staged successfully to savedSegs/ directory.`
        });
    } catch (err: any) {
        console.error('[dbBridge Error] Stage segment failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 2. List all staged segments in savedSegs/
app.get('/api/staged-segments', (_req: Request, res: Response) => {
    try {
        const savedDir = resolve(process.cwd(), 'savedSegs');
        if (!existsSync(savedDir)) {
            return res.json({ status: 'success', staged: [] });
        }

        const files = readdirSync(savedDir).filter(f => f.endsWith('.html'));
        const staged = files.map(filename => {
            const filePath = resolve(savedDir, filename);
            const stats = statSync(filePath);
            const segId = filename.replace(/\.html$/, '');
            const content = readFileSync(filePath, 'utf8');
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
    } catch (err: any) {
        console.error('[dbBridge Error] Get staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 2b. Get a single staged segment by segId
app.get('/api/staged-segments/:segId', (req: Request, res: Response) => {
    const { segId } = req.params;
    try {
        const filePath = resolve(process.cwd(), `savedSegs/${segId}.html`);
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
        const filePath = resolve(process.cwd(), `savedSegs/${segId}.html`);
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
        const savedDir = resolve(process.cwd(), 'savedSegs');
        if (existsSync(savedDir)) {
            const files = readdirSync(savedDir).filter(f => f.endsWith('.html'));
            for (const f of files) {
                unlinkSync(resolve(savedDir, f));
            }
        }
        res.json({ status: 'success', message: 'All staged segments cleared.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// 5. Promote all staged segments to source files, regenerate seed, reseed DB, and rebuild index
app.post('/api/promote-staged-segments', async (req: Request, res: Response) => {
    const { app: appName = 'app1' } = req.body;
    const savedDir = resolve(process.cwd(), 'savedSegs');
    if (!existsSync(savedDir)) {
        return res.status(400).json({ status: 'error', message: 'No savedSegs/ directory found.' });
    }

    const files = readdirSync(savedDir).filter(f => f.endsWith('.html'));
    if (files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No staged segment files found in savedSegs/.' });
    }

    const start = Date.now();
    try {
        for (const f of files) {
            const src = resolve(savedDir, f);
            const dest = resolve(process.cwd(), `${appName}/segs/${f}`);
            copyFileSync(src, dest);
            console.log(`[dbBridge] Promoted ${f} -> ${dest}`);

            if (existsSync(resolve(process.cwd(), 'consolidated_segs'))) {
                copyFileSync(src, resolve(process.cwd(), `consolidated_segs/${f}`));
            }
        }

        console.log(`[dbBridge] Regenerating segsFile.json for ${appName}...`);
        execSync(`node ./nodeUtils/public/genSegsFiles.js ${appName}`, { cwd: process.cwd() });

        console.log(`[dbBridge] Regenerating db/seed_v2.sql...`);
        execSync('node ./nodeUtils/public/genSqlSeeds.js', { cwd: process.cwd() });

        const seedPath = resolve(process.cwd(), 'db/seed_v2.sql');
        const seedSql = readFileSync(seedPath, 'utf8');
        await pool.query(seedSql);
        console.log(`[dbBridge] Reseeded PostgreSQL database from updated seed_v2.sql`);

        console.log(`[dbBridge] Rebuilding ${appName}/dist/index.html...`);
        execSync(`node ./nodeUtils/public/indexBuild.js ${appName}`, { cwd: process.cwd() });

        for (const f of files) {
            try { unlinkSync(resolve(savedDir, f)); } catch {}
        }

        const durationMs = Date.now() - start;
        console.log(`[dbBridge] Staged promotion complete for ${files.length} segment(s) in ${durationMs}ms.`);

        res.json({
            status: 'success',
            promotedCount: files.length,
            durationMs,
            message: `Successfully promoted ${files.length} segment(s) to source files, updated seed_v2.sql, reseeded PostgreSQL, and rebuilt index.html in ${durationMs}ms.`
        });
    } catch (err: any) {
        console.error('[dbBridge Error] Promote staged segments failed:', err);
        res.status(500).json({ status: 'error', message: err.message || String(err) });
    }
});

// ---------------------------------------------------------------------
// 4. Legacy Editor & Maxima Endpoints (Preserved for compatibility)
// ---------------------------------------------------------------------

app.get('/startEditor/:app/:segment', (req: Request, res: Response) => {
    const { app: appName, segment } = req.params;
    let relativePath = `./${appName}/segs/${segment}.html`;
    if (!existsSync(resolve(process.cwd(), relativePath))) {
        const altApp = appName === 'app1' ? 'app2' : 'app1';
        const altPath = `./${altApp}/segs/${segment}.html`;
        if (existsSync(resolve(process.cwd(), altPath))) {
            relativePath = altPath;
        }
    }
    const absPath = resolve(process.cwd(), relativePath);
    console.log(`launching SeaMonkey Composer for ${absPath}...`);
    spawn('SeaMonkey', ['-editor', absPath]);
    res.type('text/html').send(`editor launched for ${segment}`);
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

app.post('/svgPost/:app/:svgName', (req: Request, res: Response) => {
    const { app: appName, svgName } = req.params;
    const fp = `./${appName}/diagrams/${svgName}.svg`;
    try {
        let svg = '';
        if (typeof req.body === 'string') {
            svg = req.body;
        } else if (req.body && typeof req.body === 'object') {
            svg = req.body.svg || JSON.stringify(req.body);
        }
        writeFileSync(fp, svg);
        res.send('ok');
    } catch (err) {
        res.status(500).send(`error writing ${fp} ${err}`);
    }
});

app.post('/evalMaxima', (req: Request, res: Response) => {
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
        } else if (expr.startsWith('integrate')) {
            maximaCmd = `display2d: false; trace(?sinint, ?integrator, ?diffdiv, ?ratint, ?trigint, ?rischint); ${expr};`;
        } else {
            maximaCmd = `display2d: false; trace(?sinint, ?integrator, ?diffdiv, ?ratint, ?trigint, ?rischint); ${expr.endsWith(';') || expr.endsWith('$') ? expr : expr + ';'}`;
        }

        const maximaPath = existsSync('C:\\maxima-5.46.0\\bin\\maxima.bat')
            ? 'C:\\maxima-5.46.0\\bin\\maxima.bat'
            : (process.platform === 'win32' ? 'maxima.bat' : 'maxima');

        console.log(`[server] Running Maxima command: ${maximaCmd}`);
        const spawnRes = spawnSync(maximaPath, ['--very-quiet', `--batch-string=${maximaCmd}`], {
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
    } catch (err: any) {
        console.error('[server] evalMaxima error:', err);
        res.status(500).json({ success: false, error: String(err) });
    }
});

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
