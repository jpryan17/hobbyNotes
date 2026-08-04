"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("console");
const fs_1 = require("fs");
const path_1 = require("path");
const esbuild_1 = require("esbuild");
let indexFileContent;
let segFolder;
let errFlag;
let msg = '';
async function buildIndex(app) {
    segFolder = `../segs/`;
    errFlag = -1;
    const result = await (0, esbuild_1.build)({
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
        (0, fs_1.readdirSync)(segFolder).forEach(file => {
            if ((0, path_1.extname)(file) == ".html") {
                const fileName = (0, path_1.basename)(file);
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
        data = (0, fs_1.readFileSync)(segFilePath, 'utf8');
        const segmentContent = getSegmentContent(data);
        const segmentName = (0, path_1.basename)(fileName, '.html');
        let seg = `\n<div id="${segmentName}" visibility="hidden">\n<!--SEG `;
        seg = seg.concat(segmentContent, ' SEG-->\n</div>');
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
        (0, fs_1.writeFileSync)(fp, indexFileContent);
        errFlag = 0;
        msg = `index generated sucessfully`;
    }
    catch (err) {
        errFlag = 2;
        msg = `error writing segs file ${console_1.error}`;
    }
}
//
buildIndex('app1');
