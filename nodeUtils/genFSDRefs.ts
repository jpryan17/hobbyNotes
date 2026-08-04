import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

export function convertFSDRefContent(content: string): { updatedContent: string; replacementsCount: number } {
  let replacementsCount = 0;
  let updatedContent = content;

  // Search for \fsd{exp}{quantifiers} or \fsd{exp}
  const marker = '\\fsd{';
  let idx = updatedContent.indexOf(marker);

  while (idx !== -1) {
    const endBrace = updatedContent.indexOf('}', idx + marker.length);
    if (endBrace !== -1) {
      const exp = updatedContent.substring(idx + marker.length, endBrace);
      let quantifiers = '∀x ∃y';

      // Check for optional second parameter {quantifiers}
      if (updatedContent[endBrace + 1] === '{') {
        const qEnd = updatedContent.indexOf('}', endBrace + 2);
        if (qEnd !== -1) {
          quantifiers = updatedContent.substring(endBrace + 2, qEnd);
        }
      }

      const replacement = `<fsd-ref exp="${exp}" quantifiers="${quantifiers}" style="color:firebrick;font-weight:bold">${quantifiers} [ PG(x,y) ]</fsd-ref>`;
      const fullMatchLen = updatedContent[endBrace + 1] === '{' 
        ? updatedContent.indexOf('}', endBrace + 2) + 1 - idx
        : endBrace + 1 - idx;

      updatedContent = updatedContent.substring(0, idx) + replacement + updatedContent.substring(idx + fullMatchLen);
      replacementsCount++;
      idx = updatedContent.indexOf(marker, idx + replacement.length);
    } else {
      idx = updatedContent.indexOf(marker, idx + marker.length);
    }
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
