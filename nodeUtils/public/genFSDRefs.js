"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeToFSDExp = normalizeToFSDExp;
exports.convertFSDRefContent = convertFSDRefContent;
exports.processFSDRefFile = processFSDRefFile;
const fs_1 = require("fs");
const path_1 = require("path");
function normalizeToFSDExp(str) {
    // Strip MathML annotations first so TeX annotation is not concatenated with MathML presentation
    let stripped = str.replace(/<annotation[\s\S]*?<\/annotation>/gi, '');
    let cleaned = stripped.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    // Extract Quantifiers (e.g. ∃x1:ℕ, ∃x2:[ℕ|GT(11)], ∀x₂:ℕ ∃x₁:[ℕ|GT(x₂)])
    const qMatches = cleaned.match(/(?:\\forall|\\exists|∀|∃)\s*[a-z0-9_:, 𝒫()ℕ\\[\]|]+/gi) || [];
    let quantifiers = qMatches.join(', ')
        .replace(/\\forall/g, '∀')
        .replace(/\\exists/g, '∃')
        .replace(/\\mathbb\{N\}/g, 'ℕ')
        .replace(/\\in/g, ':')
        .replace(/x_1/g, 'x₁')
        .replace(/x_2/g, 'x₂')
        .replace(/y_1/g, 'y₁')
        .replace(/y_2/g, 'y₂')
        .replace(/x1/g, 'x₁')
        .replace(/x2/g, 'x₂')
        .replace(/y1/g, 'y₁')
        .replace(/y2/g, 'y₂')
        .trim();
    if (!quantifiers)
        quantifiers = '∃x₁:ℕ';
    // Format quantifiers cleanly with comma separation
    const qTokens = quantifiers.split(/[, ]+/).filter(Boolean);
    const normalizedQTokens = qTokens.map(t => {
        let tok = t.trim();
        if (!tok.includes(':')) {
            tok = tok.startsWith('y') || tok.includes('y') ? `${tok}:𝒫(ℕ)` : `${tok}:ℕ`;
        }
        return tok;
    });
    quantifiers = normalizedQTokens.join(', ');
    // Extract body inside brackets or after quantifiers
    let body = cleaned;
    const bracketStart = cleaned.indexOf('[');
    const bracketEnd = cleaned.lastIndexOf(']');
    if (bracketStart !== -1 && bracketEnd !== -1 && bracketEnd > bracketStart) {
        body = cleaned.substring(bracketStart + 1, bracketEnd);
    }
    // Parse Slots and Expression tokens from body
    const slotsList = [];
    // Replace membership expressions first: x1 ∈ GT5 -> m (slots: x1, GT5)
    let expBody = body
        .replace(/([a-z0-9_]+)\s*(?:∈|∊|\\in)\s*([A-Za-z0-9_]+)/g, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂').replace(/y1|y_1/g, 'y₁');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂').replace(/y1|y_1/g, 'y₁');
        slotsList.push(normV1, normV2);
        return 'm';
    })
        // Replace parameterized predicates: GT(x1, x2) -> r (slots: x1, x2)
        .replace(/GT\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'r';
    })
        .replace(/LT\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 's';
    })
        .replace(/GT5\s*\(\s*([a-z0-9_]+)\s*\)/gi, (_, v1) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1);
        return 'p';
    })
        .replace(/LT10\s*\(\s*([a-z0-9_]+)\s*\)/gi, (_, v1) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1);
        return 'q';
    })
        .replace(/EVEN\s*\(\s*([a-z0-9_]+)\s*\)/gi, (_, v1) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1);
        return 'v';
    })
        .replace(/ODD\s*\(\s*([a-z0-9_]+)\s*\)/gi, (_, v1) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1);
        return 'd';
    })
        .replace(/EQ\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'k';
    })
        .replace(/LE\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'l';
    })
        .replace(/SUCC\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'u';
    })
        .replace(/NEAR\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'w';
    })
        .replace(/DIV\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        const normV2 = v2.replace(/x1|x_1/g, 'x₁').replace(/x2|x_2/g, 'x₂');
        slotsList.push(normV1, normV2);
        return 'c';
    })
        .replace(/SUBSET\s*\(\s*([a-z0-9_]+)\s*,\s*([a-z0-9_]+)\s*\)/gi, (_, v1, v2) => {
        const normV1 = v1.replace(/y1|y_1/g, 'y₁').replace(/y2|y_2/g, 'y₂');
        const normV2 = v2.replace(/y1|y_1/g, 'y₁').replace(/y2|y_2/g, 'y₂');
        slotsList.push(normV1, normV2);
        return 'b';
    });
    // Map remaining bare predicate identifiers if any
    expBody = expBody
        .replace(/GT5|PG5/g, () => { slotsList.push('x₁'); return 'p'; })
        .replace(/LT10|PL10/g, () => { slotsList.push('x₁'); return 'q'; })
        .replace(/GT|PG/g, () => { slotsList.push('x₁', 'x₂'); return 'r'; })
        .replace(/LT|PL/g, () => { slotsList.push('x₁', 'x₂'); return 's'; })
        .replace(/EVEN/g, () => { slotsList.push('x₁'); return 'v'; })
        .replace(/ODD/g, () => { slotsList.push('x₁'); return 'd'; })
        .replace(/EQ/g, () => { slotsList.push('x₁', 'x₂'); return 'k'; })
        .replace(/LE|≤/g, () => { slotsList.push('x₁', 'x₂'); return 'l'; })
        .replace(/SUCC/g, () => { slotsList.push('x₁', 'x₂'); return 'u'; })
        .replace(/NEAR|≈/g, () => { slotsList.push('x₁', 'x₂'); return 'w'; })
        .replace(/DIV|∣/g, () => { slotsList.push('x₁', 'x₂'); return 'c'; })
        .replace(/SUBSET|⊆/g, () => { slotsList.push('y₁', 'y₂'); return 'b'; })
        .replace(/\\in|∈|∊|MEM/g, () => { slotsList.push('x₁', 'y₁'); return 'm'; });
    // Map logical connectives
    expBody = expBody
        .replace(/\\leftrightarrow|\\iff|\\equiv|<->|↔/g, 'e')
        .replace(/\\rightarrow|\\implies|\\to|->|→/g, 'i')
        .replace(/\\wedge|\\and|&|∧|⋀/g, 'a')
        .replace(/\\vee|\\or|\||∨|⋁/g, 'o')
        .replace(/\\not|\\neg|~|!|¬/g, 'n')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']');
    let exp = '';
    for (const char of expBody) {
        if ('pqrsmvnaoie[]dkulwcb'.includes(char)) {
            exp += char;
        }
    }
    if (!exp)
        exp = 'paq';
    // Build clean human-readable display string
    let displayBody = body
        .replace(/\\in|∊/g, '∈')
        .replace(/\\wedge|⋀/g, '∧')
        .replace(/\\vee|⋁/g, '∨')
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftrightarrow/g, '↔')
        .replace(/x1/g, 'x₁')
        .replace(/x2/g, 'x₂')
        .replace(/x_1/g, 'x₁')
        .replace(/x_2/g, 'x₂')
        .replace(/y1/g, 'y₁')
        .replace(/y2/g, 'y₂')
        .replace(/\s+/g, ' ')
        .trim();
    const display = `${quantifiers} [ ${displayBody} ]`;
    const slots = slotsList.join(',');
    return { exp, quantifiers, slots, display };
}
function convertFSDRefContent(content) {
    let replacementsCount = 0;
    let updatedContent = content;
    // 1. Convert \fsd{exp}{quantifiers} or \fsd{exp}
    const fsdMarker = '\\fsd{';
    let idx = updatedContent.indexOf(fsdMarker);
    while (idx !== -1) {
        const endBrace = updatedContent.indexOf('}', idx + fsdMarker.length);
        if (endBrace !== -1) {
            const exp = updatedContent.substring(idx + fsdMarker.length, endBrace);
            let quantifiers = '∃x₁:ℕ';
            if (updatedContent[endBrace + 1] === '{') {
                const qEnd = updatedContent.indexOf('}', endBrace + 2);
                if (qEnd !== -1) {
                    quantifiers = updatedContent.substring(endBrace + 2, qEnd);
                }
            }
            const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" style="color:firebrick;font-weight:bold">${quantifiers} [ ${exp} ]</fsd-ref>`;
            const fullMatchLen = updatedContent[endBrace + 1] === '{'
                ? updatedContent.indexOf('}', endBrace + 2) + 1 - idx
                : endBrace + 1 - idx;
            updatedContent = updatedContent.substring(0, idx) + replacement + updatedContent.substring(idx + fullMatchLen);
            replacementsCount++;
            idx = updatedContent.indexOf(fsdMarker, idx + replacement.length);
        }
        else {
            idx = updatedContent.indexOf(fsdMarker, idx + fsdMarker.length);
        }
    }
    // 2. Convert \, tagged quantified predicate expressions inside MathML or plain text
    const marker = '\\,';
    idx = updatedContent.indexOf(marker);
    while (idx !== -1) {
        // 1. Check if \, is inside or immediately following a <math>...</math> block
        let mathStart = -1;
        let mathEnd = -1;
        const priorMathEnd = updatedContent.lastIndexOf('</math>', idx);
        if (priorMathEnd !== -1) {
            const between = updatedContent.substring(priorMathEnd + 7, idx).trim();
            if (between === '') {
                // \, is immediately following </math>
                mathStart = updatedContent.lastIndexOf('<math', priorMathEnd);
                mathEnd = priorMathEnd;
            }
        }
        if (mathStart === -1) {
            const lastMathStart = updatedContent.lastIndexOf('<math', idx);
            const nextMathEnd = updatedContent.indexOf('</math>', idx);
            if (lastMathStart !== -1 && nextMathEnd !== -1 && lastMathStart < idx && idx < nextMathEnd) {
                mathStart = lastMathStart;
                mathEnd = nextMathEnd;
            }
        }
        if (mathStart !== -1 && mathEnd !== -1 && mathStart < mathEnd) {
            const mathBlock = updatedContent.substring(mathStart, mathEnd + 7);
            const { exp, quantifiers, slots, display } = normalizeToFSDExp(mathBlock);
            const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" slots="${slots}" style="color:firebrick;font-weight:bold">${display}</fsd-ref>`;
            const fullEnd = idx + marker.length;
            updatedContent = updatedContent.substring(0, mathStart) + replacement + updatedContent.substring(fullEnd);
            replacementsCount++;
            idx = updatedContent.indexOf(marker, mathStart + replacement.length);
            continue;
        }
        // 2. Check if plain-text preceding the \, marker (e.g. ∃x1:ℕ[GT5(x1)⋀LT10(x1)]\,)
        const lineStart = Math.max(updatedContent.lastIndexOf('\n', idx), updatedContent.lastIndexOf('>', idx), 0);
        const textBefore = updatedContent.substring(lineStart, idx).trim();
        if (textBefore.includes('∀') || textBefore.includes('∃') || textBefore.includes('\\forall') || textBefore.includes('\\exists')) {
            const { exp, quantifiers, slots, display } = normalizeToFSDExp(textBefore);
            const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" slots="${slots}" style="color:firebrick;font-weight:bold">${display}</fsd-ref>`;
            const replaceStart = updatedContent.indexOf(textBefore, lineStart);
            const replaceEnd = idx + marker.length;
            updatedContent = updatedContent.substring(0, replaceStart) + replacement + updatedContent.substring(replaceEnd);
            replacementsCount++;
            idx = updatedContent.indexOf(marker, replaceStart + replacement.length);
            continue;
        }
        idx = updatedContent.indexOf(marker, idx + marker.length);
    }
    return { updatedContent, replacementsCount };
}
function processFSDRefFile(filePath) {
    if (!(0, fs_1.existsSync)(filePath)) {
        console.error(`[genFSDRefs Error] File not found: ${filePath}`);
        return false;
    }
    try {
        const content = (0, fs_1.readFileSync)(filePath, 'utf8');
        const { updatedContent, replacementsCount } = convertFSDRefContent(content);
        if (replacementsCount > 0) {
            (0, fs_1.writeFileSync)(filePath, updatedContent, 'utf8');
            console.log(`[genFSDRefs] Converted ${replacementsCount} expression(s) in ${filePath}`);
        }
        return true;
    }
    catch (err) {
        console.error(`[genFSDRefs Error] Failed processing ${filePath}:`, err);
        return false;
    }
}
// Command-line entry point
function runCLI() {
    const args = process.argv.slice(2);
    let targetFile = '';
    if (args.length > 0) {
        targetFile = args[0];
    }
    if (targetFile) {
        const resolved = (0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), targetFile))
            ? (0, path_1.resolve)(process.cwd(), targetFile)
            : (0, path_1.resolve)(__dirname, '../', targetFile);
        if ((0, fs_1.existsSync)(resolved) && (0, fs_1.statSync)(resolved).isFile()) {
            processFSDRefFile(resolved);
        }
    }
}
if (process.argv[1] && process.argv[1].includes('genFSDRefs')) {
    runCLI();
}
