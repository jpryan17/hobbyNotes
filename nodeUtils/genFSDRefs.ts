import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

export function normalizeToFSDExp(str: string): { exp: string; quantifiers: string } {
  let cleaned = str.replace(/<[^>]+>/g, '');

  // Extract Quantifiers (e.g. \forall x, \exists y or ∀x ∃y)
  const qMatches = cleaned.match(/(?:\\forall|\\exists|∀|∃)\s*[a-z0-9_, ]+/gi) || [];
  let quantifiers = qMatches.join(' ')
    .replace(/\\forall|∀/g, '∀')
    .replace(/\\exists|∃/g, '∃')
    .replace(/,/g, '')
    .trim();

  if (!quantifiers) quantifiers = '∀x₁ ∃x₂';

  // Map Predicates to internal codes: PG5 -> p, PL10 -> q, PG -> r, PL -> s, ∈ -> m
  let body = cleaned;
  body = body
    .replace(/\\in|∈|MEM/g, 'm')
    .replace(/PG5/g, 'p')
    .replace(/PL10/g, 'q')
    .replace(/PG/g, 'r')
    .replace(/PL/g, 's')
    .replace(/P_1|P1|P/gi, 'r');

  // Map logical connectives
  body = body
    .replace(/\\leftrightarrow|\\iff|\\equiv|<->|↔/g, 'e')
    .replace(/\\rightarrow|\\implies|\\to|->|→/g, 'i')
    .replace(/\\wedge|\\and|&|∧/g, 'a')
    .replace(/\\vee|\\or|\||∨/g, 'o')
    .replace(/\\not|\\neg|~|!|¬/g, 'n')
    .replace(/\(/g, '[')
    .replace(/\)/g, ']');

  let exp = '';
  for (const char of body) {
    if ('pqrsmnaoie[]'.includes(char)) {
      exp += char;
    }
  }

  if (!exp) exp = 'r';

  return { exp, quantifiers };
}

export function convertFSDRefContent(content: string): { updatedContent: string; replacementsCount: number } {
  let replacementsCount = 0;
  let updatedContent = content;

  // 1. Convert \fsd{exp}{quantifiers} or \fsd{exp}
  const fsdMarker = '\\fsd{';
  let idx = updatedContent.indexOf(fsdMarker);

  while (idx !== -1) {
    const endBrace = updatedContent.indexOf('}', idx + fsdMarker.length);
    if (endBrace !== -1) {
      const exp = updatedContent.substring(idx + fsdMarker.length, endBrace);
      let quantifiers = '∀x₁ ∃x₂';

      if (updatedContent[endBrace + 1] === '{') {
        const qEnd = updatedContent.indexOf('}', endBrace + 2);
        if (qEnd !== -1) {
          quantifiers = updatedContent.substring(endBrace + 2, qEnd);
        }
      }

      const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" style="color:firebrick;font-weight:bold">${quantifiers} [ PG(x₁,x₂) ]</fsd-ref>`;
      const fullMatchLen = updatedContent[endBrace + 1] === '{' 
        ? updatedContent.indexOf('}', endBrace + 2) + 1 - idx
        : endBrace + 1 - idx;

      updatedContent = updatedContent.substring(0, idx) + replacement + updatedContent.substring(idx + fullMatchLen);
      replacementsCount++;
      idx = updatedContent.indexOf(fsdMarker, idx + replacement.length);
    } else {
      idx = updatedContent.indexOf(fsdMarker, idx + fsdMarker.length);
    }
  }

  // 2. Convert \, tagged quantified predicate expressions inside MathML or plain text
  const marker = '\\,';
  idx = updatedContent.indexOf(marker);

  while (idx !== -1) {
    const mathStart = updatedContent.lastIndexOf('<math', idx);
    const mathEnd = updatedContent.indexOf('</math>', idx);

    if (mathStart !== -1 && mathEnd !== -1 && mathStart < idx && idx < mathEnd) {
      const mathBlock = updatedContent.substring(mathStart, mathEnd + 7);
      const { exp, quantifiers } = normalizeToFSDExp(mathBlock);

      const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" style="color:firebrick;font-weight:bold">${quantifiers} [ PG(x₁,x₂) ]</fsd-ref>`;
      updatedContent = updatedContent.substring(0, mathStart) + replacement + updatedContent.substring(mathEnd + 7);
      replacementsCount++;
      idx = updatedContent.indexOf(marker, mathStart + replacement.length);
      continue;
    }

    idx = updatedContent.indexOf(marker, idx + marker.length);
  }

  return { updatedContent, replacementsCount };
}

export function processFSDRefFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    console.error(`[genFSDRefs Error] File not found: ${filePath}`);
    return false;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    const { updatedContent, replacementsCount } = convertFSDRefContent(content);
    if (replacementsCount > 0) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[genFSDRefs] Converted ${replacementsCount} expression(s) in ${filePath}`);
    }
    return true;
  } catch (err) {
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
    const resolved = existsSync(resolve(process.cwd(), targetFile))
      ? resolve(process.cwd(), targetFile)
      : resolve(__dirname, '../', targetFile);
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      processFSDRefFile(resolved);
    }
  }
}

if (process.argv[1] && process.argv[1].includes('genFSDRefs')) {
  runCLI();
}
