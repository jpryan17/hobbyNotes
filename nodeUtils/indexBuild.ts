import { existsSync, writeFileSync, mkdirSync, cpSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { build } from 'esbuild';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { getRequiredSegIds } from './indexUtils.js';

// Load environment variables for PostgreSQL access
const rootDir = resolve(__dirname, '../../');
dotenv.config({ path: resolve(rootDir, '.env') });

function createDbPool(): Pool {
    return new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'hobbynotes',
        password: process.env.DB_PASSWORD || 'repj',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: false,
    });
}

function extractSegmentBody(content: string): string {
    const startMatch = /<body[^>]*>/i.exec(content);
    const endMatch = /<\/body>/i.exec(content);
    if (startMatch && endMatch && endMatch.index > startMatch.index) {
        const sp = startMatch.index + startMatch[0].length;
        const ep = endMatch.index;
        return content.substring(sp, ep);
    }
    return content;
}

async function buildIndex(app: string) {
    const startTime = Date.now();
    const appDir = resolve(__dirname, `../../${app}`);
    const distFolder = resolve(appDir, 'dist');
    const outputFilePath = resolve(distFolder, 'index.html');

    if (!existsSync(distFolder)) {
        mkdirSync(distFolder, { recursive: true });
    }

    // Ensure asset directories (segPics, diagrams) are synced to dist
    const segPicsFolder = resolve(appDir, 'segPics');
    const distSegPicsFolder = resolve(distFolder, 'segPics');
    if (existsSync(segPicsFolder)) {
        cpSync(segPicsFolder, distSegPicsFolder, { recursive: true });
    }
    const diagramsFolder = resolve(appDir, 'diagrams');
    const distDiagramsFolder = resolve(distFolder, 'diagrams');
    if (existsSync(diagramsFolder)) {
        cpSync(diagramsFolder, distDiagramsFolder, { recursive: true });
    }

    // Ensure standalone overview is synced to dist
    const rootOverview = resolve(rootDir, 'overview.html');
    if (existsSync(rootOverview)) {
        copyFileSync(rootOverview, resolve(distFolder, 'overview.html'));
        console.log(`[indexBuild] Synced overview.html to ${distFolder}`);
    }

    const pool = createDbPool();

    try {
        const segIds = await getRequiredSegIds(app);
        console.log(`[indexBuild] Extracted ${segIds.length} segIds from mainIndex for ${app}:`, segIds);

        // Fetch all segment contents directly from PostgreSQL (single source of truth)
        console.log(`[indexBuild] Querying segments from PostgreSQL for ${app}...`);
        const segRes = await pool.query<{
            seg_key: string;
            content_html: string;
        }>(`
            SELECT DISTINCT s.seg_key, s.content_html
            FROM segments s
            JOIN curriculum_nav_items n ON n.segment_id = s.id
            JOIN apps a ON a.id = n.app_id
            WHERE a.app_code = $1;
        `, [app]);

        const segMap = new Map<string, string>();
        for (const row of segRes.rows) {
            segMap.set(row.seg_key, row.content_html);
        }
        console.log(`[indexBuild] Loaded ${segMap.size} unique segment(s) from PostgreSQL.`);

        // Bundle top.ts with top(false) for standalone index.html (pure reader mode)
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
        const script = result.outputFiles[0].text;

        let indexFileContent = 
`<html>
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

        writeFileSync(outputFilePath, indexFileContent, 'utf8');

        const durationMs = Date.now() - startTime;
        const bytes = Buffer.byteLength(indexFileContent, 'utf8');
        console.log(`[indexBuild] index.html generated successfully for ${app} from PostgreSQL (${bytes} bytes, ${segIds.length} segments) in ${durationMs}ms at ${outputFilePath}.`);
    } catch (err) {
        console.error(`[indexBuild Error] Error building index for ${app}:`, err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

const targetApp = process.argv[2] || 'app1';
buildIndex(targetApp);
