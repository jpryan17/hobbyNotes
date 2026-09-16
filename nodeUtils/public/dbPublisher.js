"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDbPool = createDbPool;
exports.publishStaticSite = publishStaticSite;
const fs_1 = require("fs");
const path_1 = require("path");
const esbuild_1 = require("esbuild");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
// Load environment variables for DB access
const rootDir = (0, path_1.resolve)(__dirname, '..', '..');
dotenv.config({ path: (0, path_1.resolve)(rootDir, '.env') });
function createDbPool() {
    return new pg_1.Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'hobbynotes',
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: false,
    });
}
async function publishStaticSite(appCode = 'app1', customPool, options) {
    const startTime = Date.now();
    const pool = customPool || createDbPool();
    const shouldClosePool = !customPool;
    const appDir = (0, path_1.resolve)(rootDir, appCode);
    const segFolder = (0, path_1.resolve)(appDir, 'segs');
    const outDirName = options?.outDir || 'builds';
    let rawPageName = (options?.pageName || 'enhanced_index.html').trim();
    if (!rawPageName.toLowerCase().endsWith('.html')) {
        rawPageName += '.html';
    }
    const buildsFolder = (0, path_1.resolve)(appDir, outDirName);
    const outputDistPath = (0, path_1.resolve)(buildsFolder, rawPageName);
    const outputSegsPath = (0, path_1.resolve)(segFolder, 'segsFile.json');
    if (!(0, fs_1.existsSync)(buildsFolder)) {
        (0, fs_1.mkdirSync)(buildsFolder, { recursive: true });
    }
    if (!(0, fs_1.existsSync)(segFolder)) {
        (0, fs_1.mkdirSync)(segFolder, { recursive: true });
    }
    try {
        console.log(`[dbPublisher] Querying segments from PostgreSQL for app: ${appCode}...`);
        // 1. Fetch all segments for the app ordered by sequence_order
        const segRes = await pool.query(`
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
            const segMap = new Map();
            for (const [k, v] of Object.entries(options.segOverrides)) {
                if (v)
                    segMap.set(k, v);
            }
            for (const row of segments) {
                if (segMap.has(row.seg_key)) {
                    row.content_html = segMap.get(row.seg_key);
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
        const result = await (0, esbuild_1.build)({
            stdin: {
                contents: `import { top } from './top.js'; top(false);`,
                resolveDir: (0, path_1.resolve)(appDir, 'src'),
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
        let indexFileContent = `<html>
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
            indexFileContent = indexFileContent.concat(`\n<script>window.__MWM_DEV_INDEX__ = ${JSON.stringify(options.outlineTree)};</script>`);
        }
        const scriptTag = `<script type="module">${script}</script>`;
        indexFileContent = indexFileContent.concat(`\n`, scriptTag, `\n</body>\n</html>`);
        // 4. Write output standalone file
        (0, fs_1.writeFileSync)(outputDistPath, indexFileContent, 'utf8');
        const distBytes = Buffer.byteLength(indexFileContent, 'utf8');
        console.log(`[dbPublisher] Written ${outputDistPath} (${distBytes} bytes).`);
        // 5. Synchronize segsFile.json for production builds (avoiding dev builds folder)
        if (outDirName !== 'builds') {
            const segArray = segments.map(s => ({ id: s.seg_key, seg: s.content_html }));
            (0, fs_1.writeFileSync)(outputSegsPath, JSON.stringify(segArray), 'utf8');
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
    }
    catch (err) {
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
    }
    finally {
        if (shouldClosePool) {
            await pool.end();
        }
    }
}
// CLI Execution Support
if (require.main === module) {
    const targetApp = process.argv[2] || 'app1';
    const targetPage = process.argv[3];
    publishStaticSite(targetApp, undefined, { pageName: targetPage }).then(res => {
        if (!res.success) {
            process.exit(1);
        }
    });
}
