"use strict";
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
const fs_1 = require("fs");
const path_1 = require("path");
const esbuild_1 = require("esbuild");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const indexUtils_js_1 = require("./indexUtils.js");
// Load environment variables for PostgreSQL access
const rootDir = (0, path_1.resolve)(__dirname, '../../');
dotenv.config({ path: (0, path_1.resolve)(rootDir, '.env') });
function createDbPool() {
    return new pg_1.Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'hobbynotes',
        password: process.env.DB_PASSWORD || 'repj',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: false,
    });
}
function extractSegmentBody(content) {
    const startMatch = /<body[^>]*>/i.exec(content);
    const endMatch = /<\/body>/i.exec(content);
    if (startMatch && endMatch && endMatch.index > startMatch.index) {
        const sp = startMatch.index + startMatch[0].length;
        const ep = endMatch.index;
        return content.substring(sp, ep);
    }
    return content;
}
async function buildIndex(app) {
    const startTime = Date.now();
    const appDir = (0, path_1.resolve)(__dirname, `../../${app}`);
    const distFolder = (0, path_1.resolve)(appDir, 'dist');
    const outputFilePath = (0, path_1.resolve)(distFolder, 'index.html');
    if (!(0, fs_1.existsSync)(distFolder)) {
        (0, fs_1.mkdirSync)(distFolder, { recursive: true });
    }
    // Ensure asset directories (segPics, diagrams) are synced to dist
    const segPicsFolder = (0, path_1.resolve)(appDir, 'segPics');
    const distSegPicsFolder = (0, path_1.resolve)(distFolder, 'segPics');
    if ((0, fs_1.existsSync)(segPicsFolder)) {
        (0, fs_1.cpSync)(segPicsFolder, distSegPicsFolder, { recursive: true });
    }
    const diagramsFolder = (0, path_1.resolve)(appDir, 'diagrams');
    const distDiagramsFolder = (0, path_1.resolve)(distFolder, 'diagrams');
    if ((0, fs_1.existsSync)(diagramsFolder)) {
        (0, fs_1.cpSync)(diagramsFolder, distDiagramsFolder, { recursive: true });
    }
    // Ensure standalone overview and pseudocode spec are synced to dist
    const rootOverview = (0, path_1.resolve)(rootDir, 'overview.html');
    if ((0, fs_1.existsSync)(rootOverview)) {
        (0, fs_1.copyFileSync)(rootOverview, (0, path_1.resolve)(distFolder, 'overview.html'));
        console.log(`[indexBuild] Synced overview.html to ${distFolder}`);
    }
    const rootSpec = (0, path_1.resolve)(rootDir, 'mwm_pseudocode_spec.html');
    if ((0, fs_1.existsSync)(rootSpec)) {
        (0, fs_1.copyFileSync)(rootSpec, (0, path_1.resolve)(distFolder, 'mwm_pseudocode_spec.html'));
        console.log(`[indexBuild] Synced mwm_pseudocode_spec.html to ${distFolder}`);
    }
    const pool = createDbPool();
    try {
        const segIds = await (0, indexUtils_js_1.getRequiredSegIds)(app);
        console.log(`[indexBuild] Extracted ${segIds.length} segIds from mainIndex for ${app}:`, segIds);
        // Fetch all segment contents directly from PostgreSQL (single source of truth)
        console.log(`[indexBuild] Querying segments from PostgreSQL for ${app}...`);
        const segRes = await pool.query(`
            SELECT DISTINCT s.seg_key, s.content_html
            FROM segments s
            JOIN curriculum_nav_items n ON n.segment_id = s.id
            JOIN apps a ON a.id = n.app_id
            WHERE a.app_code = $1;
        `, [app]);
        const segMap = new Map();
        for (const row of segRes.rows) {
            segMap.set(row.seg_key, row.content_html);
        }
        console.log(`[indexBuild] Loaded ${segMap.size} unique segment(s) from PostgreSQL.`);
        // Bundle top.ts with top(false) for standalone index.html (pure reader mode)
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
        const script = result.outputFiles[0].text;
        let indexFileContent = `<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
</head>
<body>
  <div id="main-slot"></div>
  <div id="scratch-slot" style="visibility:hidden"></div>`;
        let missingCount = 0;
        for (const segId of segIds) {
            const rawContent = segMap.get(segId);
            if (!rawContent) {
                console.error(`[indexBuild Error] Missing required segment in PostgreSQL: ${segId}`);
                missingCount++;
                continue;
            }
            const segmentContent = extractSegmentBody(rawContent);
            let seg = `\n<template id="${segId}">\n`;
            seg = seg.concat(segmentContent, '\n</template>');
            indexFileContent = indexFileContent.concat(seg);
        }
        if (missingCount > 0) {
            console.error(`[indexBuild Error] Failed generation: ${missingCount} required segment(s) missing from PostgreSQL.`);
            process.exit(1);
        }
        const scriptTag = `<script type="module">${script}</script>`;
        indexFileContent = indexFileContent.concat(scriptTag, `\n</body>\n</html>`);
        (0, fs_1.writeFileSync)(outputFilePath, indexFileContent, 'utf8');
        const durationMs = Date.now() - startTime;
        const bytes = Buffer.byteLength(indexFileContent, 'utf8');
        console.log(`[indexBuild] index.html generated successfully for ${app} from PostgreSQL (${bytes} bytes, ${segIds.length} segments) in ${durationMs}ms at ${outputFilePath}.`);
    }
    catch (err) {
        console.error(`[indexBuild Error] Error building index for ${app}:`, err);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
const targetApp = process.argv[2] || 'app1';
buildIndex(targetApp);
