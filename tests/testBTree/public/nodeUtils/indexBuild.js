import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { build } from 'esbuild';
import { getRequiredSegIds } from './indexUtils.js';
function getSegmentContent(content) {
    const sp = content.indexOf('<body>') + 6;
    const ep = content.indexOf('</body>');
    if (sp === -1 || ep === -1 || ep < sp) {
        throw new Error('Invalid <body> content');
    }
    return content.substring(sp, ep);
}
async function buildIndex(app) {
    const appDir = resolve(__dirname, `../../${app}`);
    const segFolder = resolve(appDir, 'segs');
    const outputFilePath = resolve(appDir, 'dist/index.html');
    try {
        const segIds = await getRequiredSegIds(app);
        console.log(`[indexBuild] Extracted ${segIds.length} segIds from mainIndex for ${app}:`, segIds);
        // Bundle top.ts with top(false) for standalone index.html (non-edit mode)
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
        let indexFileContent = `<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
</head>
<body>
  <div id="main-slot"></div>
  <div id="scratch-slot" style="visibility:hidden"></div>`;
        let missingCount = 0;
        for (const segId of segIds) {
            const filePath = resolve(segFolder, `${segId}.html`);
            if (!existsSync(filePath)) {
                console.error(`[indexBuild Error] Missing required segment file: ${filePath}`);
                missingCount++;
                continue;
            }
            try {
                const body = readFileSync(filePath, 'utf8');
                const segmentContent = getSegmentContent(body);
                let seg = `\n<template id="${segId}">\n`;
                seg = seg.concat(segmentContent, '\n</template>');
                indexFileContent = indexFileContent.concat(seg);
            }
            catch (err) {
                console.error(`[indexBuild Error] Error processing ${filePath}:`, err);
                missingCount++;
            }
        }
        if (missingCount > 0) {
            console.error(`[indexBuild Error] Failed generation: ${missingCount} required segment file(s) missing or invalid.`);
            process.exit(1);
        }
        const scriptTag = `<script type="module">${script}</script>`;
        indexFileContent = indexFileContent.concat(scriptTag, `\n</body>\n</html>`);
        writeFileSync(outputFilePath, indexFileContent);
        console.log(`[indexBuild] index.html generated successfully for ${app} (using top.ts with edit=false) at ${outputFilePath}.`);
    }
    catch (err) {
        console.error(`[indexBuild Error] Error building index for ${app}:`, err);
        process.exit(1);
    }
}
buildIndex('app1');
