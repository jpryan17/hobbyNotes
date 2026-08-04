import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

export function formatExp(exp: string): string {
    const codeMap: Record<string, string> = {
        'p': String.fromCodePoint(0x1d45d),
        'q': String.fromCodePoint(0x1d45e),
        'r': String.fromCodePoint(0x1d45f),
        's': String.fromCodePoint(0x1d460),
        '[': '\u005b',
        ']': '\u005d',
        'n': '\u00ac',
        'a': '\u2227',
        'o': '\u2228',
        'i': '\u2192',
        'e': '\u2194'
    };
    let displayExp = '';
    for (let i = 0; i < exp.length; i++) {
        const key = exp[i];
        const code = codeMap[key] || key;
        if (key === '[') {
            displayExp += code + '\u2009';
        } else if (key === 'a' || key === 'o') {
            displayExp += '\u2009' + code + '\u2009';
        } else if (key === 'i') {
            displayExp += '\u205f' + code + '\u205f';
        } else if (key === 'e') {
            displayExp += '\u205f\u205f' + code + '\u205f\u205f';
        } else if (key === ']') {
            displayExp += '\u2009' + code;
        } else if (key === 'n') {
            displayExp += code + '\u200a';
        } else {
            displayExp += code;
        }
    }
    return displayExp;
}

export function normalizeToInternalExp(str: string): string {
    let cleaned = str.replace(/<[^>]+>/g, '');
    cleaned = cleaned
        .replace(/\\leftrightarrow|\\iff|\\equiv|<->|↔/g, 'e')
        .replace(/\\rightarrow|\\implies|\\to|->|→/g, 'i')
        .replace(/\\wedge|\\and|&|∧/g, 'a')
        .replace(/\\vee|\\or|\||∨/g, 'o')
        .replace(/\\not|\\neg|~|!|¬/g, 'n')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']')
        .replace(new RegExp(`𝑝|${String.fromCodePoint(0x1d45d)}`, 'g'), 'p')
        .replace(new RegExp(`𝑞|${String.fromCodePoint(0x1d45e)}`, 'g'), 'q')
        .replace(new RegExp(`𝑟|${String.fromCodePoint(0x1d45f)}`, 'g'), 'r')
        .replace(new RegExp(`𝑠|${String.fromCodePoint(0x1d460)}`, 'g'), 's');

    // Remove letter 'n' if preceded by another letter (part of an English word like "expression")
    cleaned = cleaned.replace(/([a-zA-Z])n/g, '$1');

    let exp = '';
    for (const char of cleaned) {
        if ('pqrsnaoie[]'.includes(char)) {
            exp += char;
        }
    }
    return exp;
}

export function validateExp(exp: string): { isValid: boolean; exp: string } {
    let nl = 0;
    let expectState: 'front' | 'back' = 'front';
    const predChars = ['p', 'q', 'r', 's'];
    const binChars = ['a', 'o', 'i', 'e'];

    if (!exp || exp.length === 0) return { isValid: false, exp: '' };

    for (let i = 0; i < exp.length; i++) {
        const ch = exp[i];
        if (expectState === 'front') {
            if (predChars.includes(ch)) {
                expectState = 'back';
            } else if (ch === '[') {
                nl++;
                expectState = 'front';
            } else if (ch === 'n') {
                expectState = 'front';
            } else {
                return { isValid: false, exp };
            }
        } else {
            if (ch === ']' && nl > 0) {
                nl--;
                expectState = 'back';
            } else if (binChars.includes(ch)) {
                expectState = 'front';
            } else {
                return { isValid: false, exp };
            }
        }
    }

    const isValid = expectState === 'back' && nl === 0;
    return { isValid, exp };
}

export function convertTTDRefContent(content: string): { updatedContent: string; replacementsCount: number } {
    let replacementsCount = 0;
    let updatedContent = content;

    const marker = '\\,';
    let idx = updatedContent.indexOf(marker);

    while (idx !== -1) {
        // Check if marker is inside a MathML <math ...> ... </math> element
        const mathStart = updatedContent.lastIndexOf('<math', idx);
        const mathEnd = updatedContent.indexOf('</math>', idx);

        if (mathStart !== -1 && mathEnd !== -1 && mathStart < idx && idx < mathEnd) {
            const mathBlock = updatedContent.substring(mathStart, mathEnd + 7);

            let candidateText = mathBlock;
            const annotMatch = mathBlock.match(/<annotation[^>]*>([\s\S]*?)<\/annotation>/i);
            if (annotMatch && annotMatch[1]) {
                candidateText = annotMatch[1];
            } else {
                const mrowMatch = mathBlock.match(/<mrow[^>]*>([\s\S]*?)<\/mrow>/i);
                if (mrowMatch && mrowMatch[1]) {
                    candidateText = mrowMatch[1];
                }
            }

            const exp = normalizeToInternalExp(candidateText);
            const { isValid } = validateExp(exp);

            if (isValid) {
                const formattedText = formatExp(exp);
                const replacement = `<ttd-ref exp="${exp}" style="color:firebrick;font-weight:bold">${formattedText}</ttd-ref>`;
                updatedContent = updatedContent.substring(0, mathStart) + replacement + updatedContent.substring(mathEnd + 7);
                replacementsCount++;
                idx = updatedContent.indexOf(marker, mathStart + replacement.length);
                continue;
            }
        }

        // Fallback for non-MathML tagged expressions (plain text)
        let startIdx = idx - 1;
        while (startIdx >= 0 && updatedContent[startIdx] !== '>' && updatedContent[startIdx] !== '\n' && updatedContent[startIdx] !== '\r') {
            startIdx--;
        }
        if (startIdx < 0) startIdx = 0;
        if (updatedContent[startIdx] === '>' || updatedContent[startIdx] === '\n' || updatedContent[startIdx] === '\r') {
            startIdx++;
        }

        const rawBlock = updatedContent.substring(startIdx, idx);
        let foundValid = false;

        for (let subStart = 0; subStart < rawBlock.length; subStart++) {
            if (subStart > 0 && /[a-zA-Z0-9]/.test(rawBlock[subStart - 1]) && /[a-zA-Z0-9]/.test(rawBlock[subStart])) {
                continue;
            }

            const candidate = rawBlock.substring(subStart);
            const exp = normalizeToInternalExp(candidate);
            const { isValid } = validateExp(exp);
            if (isValid) {
                const actualMatchStart = startIdx + subStart;
                const formattedText = formatExp(exp);
                const replacement = `<ttd-ref exp="${exp}" style="color:firebrick;font-weight:bold">${formattedText}</ttd-ref>`;
                updatedContent = updatedContent.substring(0, actualMatchStart) + replacement + updatedContent.substring(idx + marker.length);
                replacementsCount++;
                idx = updatedContent.indexOf(marker, actualMatchStart + replacement.length);
                foundValid = true;
                break;
            }
        }

        if (!foundValid) {
            console.warn(`[genTTDRefs Warning] Candidate block "${rawBlock}" at index ${idx} ended in \\, but did not contain a valid expression. Skipping.`);
            idx = updatedContent.indexOf(marker, idx + marker.length);
        }
    }

    return { updatedContent, replacementsCount };
}

export function processTTDRefFile(filePath: string): boolean {
    if (!existsSync(filePath)) {
        console.error(`[genTTDRefs Error] File not found: ${filePath}`);
        return false;
    }
    try {
        const content = readFileSync(filePath, 'utf8');
        const { updatedContent, replacementsCount } = convertTTDRefContent(content);
        if (replacementsCount > 0) {
            writeFileSync(filePath, updatedContent);
            console.log(`[genTTDRefs] Converted ${replacementsCount} expression(s) in ${filePath}`);
        } else {
            console.log(`[genTTDRefs] No valid \\, tagged expressions found in ${filePath}`);
        }
        return true;
    } catch (err) {
        console.error(`[genTTDRefs Error] Failed processing ${filePath}:`, err);
        return false;
    }
}

// Command-line entry point
function runCLI() {
    const args = process.argv.slice(2);
    let targetFile = '';
    let app = '';
    let seg = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file' && i + 1 < args.length) {
            targetFile = args[i + 1];
            i++;
        } else if (args[i] === '--app' && i + 1 < args.length) {
            app = args[i + 1];
            i++;
        } else if (args[i] === '--seg' && i + 1 < args.length) {
            seg = args[i + 1];
            i++;
        }
    }

    if (!targetFile && !app && !seg) {
        if (args.length >= 2 && !args[0].startsWith('--') && !args[1].startsWith('--')) {
            app = args[0];
            seg = args[1];
        } else if (args.length === 1 && !args[0].startsWith('--')) {
            targetFile = args[0];
        }
    }

    if (targetFile) {
        const resolved = existsSync(resolve(process.cwd(), targetFile))
            ? resolve(process.cwd(), targetFile)
            : resolve(__dirname, '../', targetFile);
        if (existsSync(resolved) && statSync(resolved).isFile()) {
            processTTDRefFile(resolved);
        } else {
            console.error(`[genTTDRefs Error] File not found or is a directory: ${resolved}`);
        }
    } else if (app && seg) {
        const filePath = existsSync(resolve(process.cwd(), app, 'segs', `${seg}.html`))
            ? resolve(process.cwd(), app, 'segs', `${seg}.html`)
            : resolve(__dirname, `../../${app}/segs/${seg}.html`);
        processTTDRefFile(filePath);
    } else {
        console.log('Usage: node genTTDRefs.js --file <filePath> OR node genTTDRefs.js <appName> <segName>');
    }
}

// Run CLI if invoked directly
if (process.argv[1] && process.argv[1].includes('genTTDRefs')) {
    runCLI();
}
