"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertEqRefContent = convertEqRefContent;
exports.processEqRefFile = processEqRefFile;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Converts legacy <<CAS ...>>, \cas{...}, and <cas-ref> into normalized <eq-ref> tags.
 */
function convertEqRefContent(content) {
    let replacementsCount = 0;
    let updatedContent = content;
    // 1. Convert <cas-ref calc-id="..." ...>...</cas-ref> to <eq-ref eq-id="..." ...>...</eq-ref>
    const casRefTagRegex = /<cas-ref\s+([^>]*?)>([\s\S]*?)<\/cas-ref>/gi;
    updatedContent = updatedContent.replace(casRefTagRegex, (_match, attrs, innerText) => {
        replacementsCount++;
        const updatedAttrs = attrs.replace(/\bcalc-id=/gi, 'eq-id=').replace(/\bexpr=/gi, 'formula=');
        return `<eq-ref ${updatedAttrs.trim()}>${innerText.trim()}</eq-ref>`;
    });
    // 2. Convert <<CAS ...>>...<<\>> or <<CAS ...>>...<</CAS>>
    const casTagRegex = /<<CAS\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/CAS)>>/gi;
    updatedContent = updatedContent.replace(casTagRegex, (_match, attrs, innerText) => {
        replacementsCount++;
        const updatedAttrs = attrs.replace(/\bcalc-id=/gi, 'eq-id=').replace(/\bexpr=/gi, 'formula=');
        return `<eq-ref ${updatedAttrs.trim()}>${innerText.trim()}</eq-ref>`;
    });
    // 3. Convert <<EQ ...>>...<<\>>
    const eqTagRegex = /<<EQ\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/EQ)>>/gi;
    updatedContent = updatedContent.replace(eqTagRegex, (_match, attrs, innerText) => {
        replacementsCount++;
        return `<eq-ref ${attrs.trim()}>${innerText.trim()}</eq-ref>`;
    });
    // 4. Convert \cas{calcId}{displayText} or \eq{eqId}{displayText}
    const macroRegex = /\\(?:cas|eq)\{([^}]+)\}\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(macroRegex, (_match, id, text) => {
        replacementsCount++;
        return `<eq-ref eq-id="${id.trim()}">${text.trim()}</eq-ref>`;
    });
    // 5. Convert \cas{calcId} or \eq{eqId}
    const simpleMacroRegex = /\\(?:cas|eq)\{([^}]+)\}/gi;
    updatedContent = updatedContent.replace(simpleMacroRegex, (_match, id) => {
        replacementsCount++;
        return `<eq-ref eq-id="${id.trim()}">${id.trim()}</eq-ref>`;
    });
    return { updatedContent, replacementsCount };
}
function processEqRefFile(filePath) {
    if (!(0, fs_1.existsSync)(filePath)) {
        console.error(`[genEqRefs Error] File not found: ${filePath}`);
        return false;
    }
    try {
        const content = (0, fs_1.readFileSync)(filePath, 'utf8');
        const { updatedContent, replacementsCount } = convertEqRefContent(content);
        if (replacementsCount > 0) {
            (0, fs_1.writeFileSync)(filePath, updatedContent, 'utf8');
            console.log(`[genEqRefs] Converted ${replacementsCount} Equation reference(s) in ${filePath}`);
        }
        return true;
    }
    catch (err) {
        console.error(`[genEqRefs Error] Failed processing ${filePath}:`, err);
        return false;
    }
}
if (process.argv[1] && process.argv[1].includes('genEqRefs')) {
    const args = process.argv.slice(2);
    let filePath = '';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file' && args[i + 1]) {
            filePath = (0, path_1.resolve)(args[i + 1]);
            break;
        }
    }
    if (filePath) {
        processEqRefFile(filePath);
    }
    else {
        console.log('Usage: node genEqRefs.js --file <path-to-html>');
    }
}
