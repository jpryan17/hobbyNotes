"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const indexUtils_js_1 = require("./indexUtils.js");
const genTTDRefs_js_1 = require("./genTTDRefs.js");
const genFSDRefs_js_1 = require("./genFSDRefs.js");
const genBTDRefs_js_1 = require("./genBTDRefs.js");
const genBIDRefs_js_1 = require("./genBIDRefs.js");
async function processSegFolder(app) {
    const segFolder = (0, path_1.resolve)(__dirname, `../../${app}/segs`);
    const segArray = [];
    let missingCount = 0;
    try {
        const segIds = await (0, indexUtils_js_1.getRequiredSegIds)(app);
        console.log(`[genSegsFiles] Extracted ${segIds.length} segIds from mainIndex:`, segIds);
        for (const segId of segIds) {
            const filePath = (0, path_1.resolve)(segFolder, `${segId}.html`);
            if (!(0, fs_1.existsSync)(filePath)) {
                console.error(`[genSegsFiles Error] Missing required segment file: ${filePath}`);
                missingCount++;
                continue;
            }
            try {
                // Pre-process TTD, FSD, BTD, and BID reference tags in tandem
                (0, genTTDRefs_js_1.processTTDRefFile)(filePath);
                (0, genFSDRefs_js_1.processFSDRefFile)(filePath);
                (0, genBTDRefs_js_1.processBTDRefFile)(filePath);
                (0, genBIDRefs_js_1.processBIDRefFile)(filePath);
                const body = (0, fs_1.readFileSync)(filePath, 'utf8');
                const startMatch = /<body[^>]*>/i.exec(body);
                const endMatch = /<\/body>/i.exec(body);
                if (!startMatch || !endMatch || endMatch.index < startMatch.index) {
                    console.error(`[genSegsFiles Error] Invalid <body> content in segment file: ${filePath}`);
                    missingCount++;
                    continue;
                }
                const sp = startMatch.index + startMatch[0].length;
                const ep = endMatch.index;
                const seg = body.substring(sp, ep);
                segArray.push({ id: segId, seg: seg });
            }
            catch (err) {
                console.error(`[genSegsFiles Error] Error reading ${filePath}:`, err);
                missingCount++;
            }
        }
        if (missingCount > 0) {
            console.error(`[genSegsFiles Error] Failed generation: ${missingCount} required segment file(s) missing or invalid.`);
            process.exit(1);
        }
        const js = JSON.stringify(segArray);
        const fn = 'segsFile.json';
        const fp = (0, path_1.resolve)(segFolder, fn);
        try {
            (0, fs_1.writeFileSync)(fp, js);
            console.log(`[genSegsFiles] ${fn} generated successfully (${segArray.length} segments).`);
        }
        catch (err) {
            console.error(`[genSegsFiles Error] Error writing segs file ${fp}:`, err);
            process.exit(1);
        }
    }
    catch (err) {
        console.error(`[genSegsFiles Error] Error processing segment folder for ${app}:`, err);
        process.exit(1);
    }
}
const targetApp = process.argv[2] || 'app1';
processSegFolder(targetApp);
