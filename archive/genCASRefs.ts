import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Converts <<CAS calc-id="..." ...>>...<<\>> or \cas{calcId}{text} into <cas-ref calc-id="...">...</cas-ref>
 */
export function convertCASRefContent(content: string): {
  updatedContent: string;
  replacementsCount: number;
} {
  let replacementsCount = 0;
  let updatedContent = content;

  // 1. Convert <<CAS ...>>...<<\>> or <<CAS ...>>...<</CAS>>
  const casTagRegex = /<<CAS\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/CAS)>>/gi;
  updatedContent = updatedContent.replace(casTagRegex, (_match, attrs, innerText) => {
    replacementsCount++;
    return `<cas-ref ${attrs.trim()}>${innerText.trim()}</cas-ref>`;
  });

  // 2. Convert \cas{calcId}{displayText}
  const macroRegex = /\\cas\{([^}]+)\}\{([^}]+)\}/gi;
  updatedContent = updatedContent.replace(macroRegex, (_match, calcId, text) => {
    replacementsCount++;
    return `<cas-ref calc-id="${calcId.trim()}">${text.trim()}</cas-ref>`;
  });

  // 3. Convert \cas{calcId}
  const simpleMacroRegex = /\\cas\{([^}]+)\}/gi;
  updatedContent = updatedContent.replace(simpleMacroRegex, (_match, calcId) => {
    replacementsCount++;
    return `<cas-ref calc-id="${calcId.trim()}">${calcId.trim()}</cas-ref>`;
  });

  return { updatedContent, replacementsCount };
}

export function processCASRefFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    console.error(`[genCASRefs Error] File not found: ${filePath}`);
    return false;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    const { updatedContent, replacementsCount } = convertCASRefContent(content);
    if (replacementsCount > 0) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[genCASRefs] Converted ${replacementsCount} CAS reference(s) in ${filePath}`);
    }
    return true;
  } catch (err) {
    console.error(`[genCASRefs Error] Failed processing ${filePath}:`, err);
    return false;
  }
}

// CLI handler
if (process.argv[1] && process.argv[1].includes('genCASRefs')) {
  const args = process.argv.slice(2);
  let filePath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = resolve(args[i + 1]);
      i++;
    }
  }
  if (filePath) {
    processCASRefFile(filePath);
  } else {
    console.log('Usage: node genCASRefs.js --file <path-to-html>');
  }
}
