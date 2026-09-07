import { error } from 'console';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, basename } from 'path';
import { build } from 'esbuild';
let indexFileContent;
let segFolder;
let errFlag;
let msg = '';
async function buildIndex(app) {
    segFolder = `../segs/`;
    errFlag = -1;
    const result = await build({
        entryPoints: ['./main.ts'],
        bundle: true,
        minify: true,
        write: false,
        outdir: 'out',
    });
    const script = result.outputFiles[0].text;
    indexFileContent =
        `<html>
  <head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  </head>
  <body>
    <div id="main-slot"></div>
    <div id="scratch-slot" style="visibility:hidden"></div>`;
    //
    try {
        readdirSync(segFolder).forEach(file => {
            if (extname(file) == ".html") {
                const fileName = basename(file);
                addSegment(fileName);
            }
        });
        writeIndex(script);
    }
    catch (err) {
        msg = `error reading seg dir`;
        errFlag = 1;
    }
}
function addSegment(fileName) {
    const segFilePath = `${segFolder}${fileName}`;
    let data;
    try {
        data = readFileSync(segFilePath, 'utf8');
        const segmentContent = getSegmentContent(data);
        const segmentName = basename(fileName, '.html');
        let seg = `\n<template id="${segmentName}">\n`;
        seg = seg.concat(segmentContent, '\n</template>');
        indexFileContent = indexFileContent.concat(seg);
    }
    catch (err) {
        console.log(err);
    }
}
function getSegmentContent(content) {
    const sp = content.indexOf('<body>') + 6;
    const ep = content.indexOf('</body>');
    return content.substring(sp, ep);
}
function writeIndex(script) {
    const si = `<script type="module">${script}</script>`;
    indexFileContent = indexFileContent.concat(si, `</body></html>`);
    const fp = `./index.html`;
    try {
        writeFileSync(fp, indexFileContent);
        errFlag = 0;
        msg = `index generated sucessfully`;
    }
    catch (err) {
        errFlag = 2;
        msg = `error writing segs file ${error}`;
    }
}
//
buildIndex('app1');
