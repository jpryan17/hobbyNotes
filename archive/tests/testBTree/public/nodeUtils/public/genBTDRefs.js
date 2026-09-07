"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBTDRefContent = convertBTDRefContent;
exports.processBTDRefFile = processBTDRefFile;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Converts <<BTD mode="..." ...>>...<<\>> or \btd{mode}{text} into <btd-ref mode="...">...</btd-ref>
 */
function convertBTDRefContent(content) {
    let replacementsCount = 0;
    let updatedContent = content;
    // 1. Convert <<BTD ...>>...<<\>> or <<BTD ...>>...<</BTD>>
    const btdTagRegex = /<<BTD\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/BTD)>>/gi;
    updatedContent = updatedContent.replace(btdTagRegex, (_match, attrs, innerText) => {
        replacementsCount++;
        return `<btd-ref ${attrs.trim()}>${innerText.trim()}</btd-ref>`;
    });
    // 2. Convert \btd{mode}{displayText}
    const macroRegex = /\\btd\{([^}]+)\}\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(macroRegex, (_match, mode, text) => {
        replacementsCount++;
        return `<btd-ref mode="${mode.trim()}">${text.trim()}</btd-ref>`;
    });
    // 3. Convert \btd{mode}
    const simpleMacroRegex = /\\btd\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(simpleMacroRegex, (_match, mode) => {
        replacementsCount++;
        return `<btd-ref mode="${mode.trim()}">View in 2-Successor Demo [${mode.trim()}]</btd-ref>`;
    });
    return { updatedContent, replacementsCount };
}
function processBTDRefFile(filePath) {
    if (!(0, fs_1.existsSync)(filePath)) {
        console.error(`[genBTDRefs Error] File not found: ${filePath}`);
        return false;
    }
    try {
        const content = (0, fs_1.readFileSync)(filePath, 'utf8');
        const { updatedContent, replacementsCount } = convertBTDRefContent(content);
        if (replacementsCount > 0) {
            (0, fs_1.writeFileSync)(filePath, updatedContent, 'utf8');
            console.log(`[genBTDRefs] Converted ${replacementsCount} BTD reference(s) in ${filePath}`);
        }
        return true;
    }
    catch (err) {
        console.error(`[genBTDRefs Error] Failed processing ${filePath}:`, err);
        return false;
    }
}
// CLI handler
if (process.argv[1] && process.argv[1].includes('genBTDRefs')) {
    const args = process.argv.slice(2);
    let filePath = '';
    if (args.includes('--file')) {
        const idx = args.indexOf('--file');
        filePath = args[idx + 1];
    }
    else if (args.length >= 2) {
        const app = args[0];
        const seg = args[1].endsWith('.html') ? args[1] : `${args[1]}.html`;
        filePath = (0, path_1.resolve)(__dirname, `../../${app}/segs/${seg}`);
    }
    if (filePath) {
        processBTDRefFile(filePath);
    }
    else {
        console.log('Usage: node genBTDRefs.js --file <filePath> OR node genBTDRefs.js <appName> <segName>');
    }
}
