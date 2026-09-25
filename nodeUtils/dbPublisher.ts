/**
 * Database-Driven Static Page Publisher (MWM-DB)
 *
 * Queries curriculum content directly from PostgreSQL 16 (MWM-DB)
 * and generates production static assets:
 * 1. app/dist/index.html (Fully bundled standalone application)
 * 2. app/segs/segsFile.json (Synchronized segment catalog for dev/runtime)
 *
 * Exposes:
 * - publishStaticSite(appCode): Programmatic API for server/studio
 * - CLI execution: node ./nodeUtils/public/dbPublisher.js [appCode]
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables for DB access
const rootDir = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(rootDir, '.env') });

export interface PublishOptions {
    pageName?: string;
    outDir?: string;
    outlineTree?: any[];
    segOverrides?: Record<string, string>;
}

export interface PublishResult {
    success: boolean;
    app: string;
    segmentCount: number;
    distBytes: number;
    distPath: string;
    pageName: string;
    segsFilePath: string;
    durationMs: number;
    timestamp: string;
    error?: string;
}

export function createDbPool(): Pool {
    return new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'hobbynotes',
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: false,
    });
}

export async function publishStaticSite(
    appCode: string = 'app1',
    customPool?: Pool,
    options?: PublishOptions
): Promise<PublishResult> {
    const startTime = Date.now();
    const pool = customPool || createDbPool();
    const shouldClosePool = !customPool;

    const appDir = resolve(rootDir, appCode);
    const segFolder = resolve(appDir, 'segs');
    const outDirName = options?.outDir || 'builds';
    let rawPageName = (options?.pageName || 'enhanced_index.html').trim();
    if (!rawPageName.toLowerCase().endsWith('.html')) {
        rawPageName += '.html';
    }
    const buildsFolder = resolve(appDir, outDirName);
    const outputDistPath = resolve(buildsFolder, rawPageName);
    const outputSegsPath = resolve(segFolder, 'segsFile.json');

    if (!existsSync(buildsFolder)) {
        mkdirSync(buildsFolder, { recursive: true });
    }
    if (!existsSync(segFolder)) {
        mkdirSync(segFolder, { recursive: true });
    }

    try {
        console.log(`[dbPublisher] Querying segments from PostgreSQL for app: ${appCode}...`);
        
        // 1. Fetch all segments for the app ordered by sequence_order
        const segRes = await pool.query<{
            id: string | number;
            seg_key: string;
            content_html: string;
            sequence_order: number;
            title: string;
        }>(`
            SELECT DISTINCT s.id, s.seg_key, s.content_html, s.sequence_order, s.title
            FROM segments s
            JOIN curriculum_nav_items n ON n.segment_id = s.id
            JOIN apps a ON a.id = n.app_id
            WHERE a.app_code = $1
            ORDER BY s.sequence_order ASC;
        `, [appCode]);

        const segments = segRes.rows;
        if (segments.length === 0) {
            throw new Error(`No segments found in PostgreSQL for app '${appCode}'`);
        }
        console.log(`[dbPublisher] Retrieved ${segments.length} segments from database.`);

        // Merge any client-side in-memory segment overrides from active Dev session
        if (options?.segOverrides) {
            const segMap = new Map<string, string>();
            for (const [k, v] of Object.entries(options.segOverrides)) {
                if (v) segMap.set(k, v);
            }
            for (const row of segments) {
                if (segMap.has(row.seg_key)) {
                    row.content_html = segMap.get(row.seg_key)!;
                    segMap.delete(row.seg_key);
                }
            }
            // Add any newly created segments not yet in DB
            for (const [newKey, newContent] of segMap.entries()) {
                segments.push({
                    id: newKey,
                    seg_key: newKey,
                    content_html: newContent,
                    sequence_order: 9999,
                    title: newKey,
                });
            }
        }

        // 2. Bundle app/src/top.ts with top(false) for standalone index.html
        console.log(`[dbPublisher] Bundling ${appCode}/src/top.ts with esbuild...`);
        const result = await build({
            stdin: {
                contents: `import { top } from './top.js'; top(false);`,
                resolveDir: resolve(appDir, 'src'),
                loader: 'ts',
            },
            bundle: true,
            minify: true,
            write: false,
        });

        if (!result.outputFiles || result.outputFiles.length === 0) {
            throw new Error('esbuild returned no output files.');
        }
        const script = result.outputFiles[0].text;

        // 3. Assemble index.html
        let indexFileContent = 
`<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
</head>
<body>
  <div id="main-slot"></div>
  <div id="scratch-slot" style="visibility:hidden"></div>`;

        for (const row of segments) {
            let seg = `\n<template id="${row.seg_key}">\n`;
            seg = seg.concat(row.content_html, '\n</template>');
            indexFileContent = indexFileContent.concat(seg);
        }

        // Inject active Dev Mode outline hierarchy snapshot if provided
        if (options?.outlineTree && Array.isArray(options.outlineTree) && options.outlineTree.length > 0) {
            indexFileContent = indexFileContent.concat(
                `\n<script>window.__MWM_DEV_INDEX__ = ${JSON.stringify(options.outlineTree)};</script>`
            );
        }

        const scriptTag = `<script type="module">${script}</script>`;
        indexFileContent = indexFileContent.concat(`\n`, scriptTag, `\n</body>\n</html>`);

        // 4. Write output standalone file
        writeFileSync(outputDistPath, indexFileContent, 'utf8');
        const distBytes = Buffer.byteLength(indexFileContent, 'utf8');
        console.log(`[dbPublisher] Written ${outputDistPath} (${distBytes} bytes).`);

        // 5. Synchronize segsFile.json for production builds (avoiding dev builds folder)
        if (outDirName !== 'builds') {
            const segArray = segments.map(s => ({ id: s.seg_key, seg: s.content_html }));
            writeFileSync(outputSegsPath, JSON.stringify(segArray), 'utf8');
            console.log(`[dbPublisher] Synchronized ${outputSegsPath} (${segArray.length} segments).`);
        }

        const durationMs = Date.now() - startTime;
        console.log(`[dbPublisher] Successfully published ${appCode} in ${durationMs}ms!`);

        return {
            success: true,
            app: appCode,
            segmentCount: segments.length,
            distBytes,
            distPath: outputDistPath,
            pageName: rawPageName,
            segsFilePath: outputSegsPath,
            durationMs,
            timestamp: new Date().toISOString(),
        };
    } catch (err: any) {
        console.error(`[dbPublisher Error] Failed publishing ${appCode}:`, err);
        return {
            success: false,
            app: appCode,
            segmentCount: 0,
            distBytes: 0,
            distPath: outputDistPath,
            pageName: rawPageName,
            segsFilePath: outputSegsPath,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            error: err.message || String(err),
        };
    } finally {
        if (shouldClosePool) {
            await pool.end();
        }
    }
}

// CLI Execution Support
if (require.main === module) {
    const targetApp = process.argv[2] || 'app1';
    const targetPage = process.argv[3];
    const targetOutDir = process.argv[4];
    publishStaticSite(targetApp, undefined, { pageName: targetPage, outDir: targetOutDir }).then(res => {
        if (!res.success) {
            process.exit(1);
        }
    });
}
