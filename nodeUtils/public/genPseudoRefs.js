"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPseudoRefContent = convertPseudoRefContent;
exports.processPseudoRefFile = processPseudoRefFile;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Converts <<PSEUDO id="..." ...>>...<<\>>, \pseudo{id}{text}, and \pseudo{id} into <pseudo-ref id="...">...</pseudo-ref>
 */
function convertPseudoRefContent(content) {
    let replacementsCount = 0;
    let updatedContent = content;
    // 1. Convert <<PSEUDO ...>>...<<\>> or <<PSEUDO ...>>...<</PSEUDO>>
    const pseudoTagRegex = /<<PSEUDO\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/PSEUDO)>>/gi;
    updatedContent = updatedContent.replace(pseudoTagRegex, (_match, attrs, innerText) => {
        replacementsCount++;
        return `<pseudo-ref ${attrs.trim()}>${innerText.trim()}</pseudo-ref>`;
    });
    // 2. Convert \pseudo{id}{displayText}
    const macroRegex = /\\pseudo\{([^}]+)\}\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(macroRegex, (_match, id, text) => {
        replacementsCount++;
        return `<pseudo-ref id="${id.trim()}">${text.trim()}</pseudo-ref>`;
    });
    // 3. Convert \pseudo{id}
    const simpleMacroRegex = /\\pseudo\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(simpleMacroRegex, (_match, id) => {
        replacementsCount++;
        return `<pseudo-ref id="${id.trim()}">View Algorithm [${id.trim()}]</pseudo-ref>`;
    });
    return { updatedContent, replacementsCount };
}
function processPseudoRefFile(filePath) {
    if (!(0, fs_1.existsSync)(filePath)) {
        console.error(`[genPseudoRefs Error] File not found: ${filePath}`);
        return false;
    }
    try {
        const content = (0, fs_1.readFileSync)(filePath, 'utf8');
        const { updatedContent, replacementsCount } = convertPseudoRefContent(content);
        if (replacementsCount > 0) {
            (0, fs_1.writeFileSync)(filePath, updatedContent, 'utf8');
            console.log(`[genPseudoRefs] Converted ${replacementsCount} Pseudocode reference(s) in ${filePath}`);
        }
        return true;
    }
    catch (err) {
        console.error(`[genPseudoRefs Error] Failed processing ${filePath}:`, err);
        return false;
    }
}
if (process.argv[1] && process.argv[1].includes('genPseudoRefs')) {
    const args = process.argv.slice(2);
    let filePath = '';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file' && args[i + 1]) {
            filePath = (0, path_1.resolve)(args[i + 1]);
            break;
        }
    }
    if (filePath) {
        processPseudoRefFile(filePath);
    }
    else {
        console.log('Usage: node genPseudoRefs.js --file <path-to-html>');
    }
}
