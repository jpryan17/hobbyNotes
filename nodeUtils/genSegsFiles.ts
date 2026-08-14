import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { getRequiredSegIds } from './indexUtils.js';
import { processTTDRefFile } from './genTTDRefs.js';
import { processFSDRefFile } from './genFSDRefs.js';
import { processBTDRefFile } from './genBTDRefs.js';
import { processBIDRefFile } from './genBIDRefs.js';

async function processSegFolder(app: string) {
    const segFolder = resolve(__dirname, `../../${app}/segs`);
    const segArray: { id: string; seg: string }[] = [];
    let missingCount = 0;

    try {
        const segIds = await getRequiredSegIds(app);
        console.log(`[genSegsFiles] Extracted ${segIds.length} segIds from mainIndex:`, segIds);
        
        for (const segId of segIds) {
            const filePath = resolve(segFolder, `${segId}.html`);
            if (!existsSync(filePath)) {
                console.error(`[genSegsFiles Error] Missing required segment file: ${filePath}`);
                missingCount++;
                continue;
            }

            try {
                // Pre-process TTD, FSD, BTD, and BID reference tags in tandem
                processTTDRefFile(filePath);
                processFSDRefFile(filePath);
                processBTDRefFile(filePath);
                processBIDRefFile(filePath);

                const body = readFileSync(filePath, 'utf8');
                const sp = body.indexOf('<body>') + 6;
                const ep = body.indexOf('</body>');
                if (sp === -1 || ep === -1 || ep < sp) {
                    console.error(`[genSegsFiles Error] Invalid <body> content in segment file: ${filePath}`);
                    missingCount++;
                    continue;
                }
                const seg = body.substring(sp, ep);
                segArray.push({ id: segId, seg: seg });
            } catch (err) {
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
        const fp = resolve(segFolder, fn);
        try {
            writeFileSync(fp, js);
            console.log(`[genSegsFiles] ${fn} generated successfully (${segArray.length} segments).`);
        } catch (err) {
            console.error(`[genSegsFiles Error] Error writing segs file ${fp}:`, err);
            process.exit(1);
        }
    } catch (err) {
        console.error(`[genSegsFiles Error] Error processing segment folder for ${app}:`, err);
        process.exit(1);
    }
}

processSegFolder('app1');
