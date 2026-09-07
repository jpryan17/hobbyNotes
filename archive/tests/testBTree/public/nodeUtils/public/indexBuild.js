"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const esbuild_1 = require("esbuild");
const indexUtils_js_1 = require("./indexUtils.js");
function getSegmentContent(content) {
    const sp = content.indexOf('<body>') + 6;
    const ep = content.indexOf('</body>');
    if (sp === -1 || ep === -1 || ep < sp) {
        throw new Error('Invalid <body> content');
    }
    return content.substring(sp, ep);
}
async function buildIndex(app) {
    const appDir = (0, path_1.resolve)(__dirname, `../../${app}`);
    const segFolder = (0, path_1.resolve)(appDir, 'segs');
    const outputFilePath = (0, path_1.resolve)(appDir, 'dist/index.html');
    try {
        const segIds = await (0, indexUtils_js_1.getRequiredSegIds)(app);
        console.log(`[indexBuild] Extracted ${segIds.length} segIds from mainIndex for ${app}:`, segIds);
        // Bundle top.ts with top(false) for standalone index.html (non-edit mode)
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
            const filePath = (0, path_1.resolve)(segFolder, `${segId}.html`);
            if (!(0, fs_1.existsSync)(filePath)) {
                console.error(`[indexBuild Error] Missing required segment file: ${filePath}`);
                missingCount++;
                continue;
            }
            try {
                const body = (0, fs_1.readFileSync)(filePath, 'utf8');
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
        (0, fs_1.writeFileSync)(outputFilePath, indexFileContent);
        console.log(`[indexBuild] index.html generated successfully for ${app} (using top.ts with edit=false) at ${outputFilePath}.`);
    }
    catch (err) {
        console.error(`[indexBuild Error] Error building index for ${app}:`, err);
        process.exit(1);
    }
}
buildIndex('app1');
