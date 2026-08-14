import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Converts <<BID mode="..." ...>>...<<\>> or \bid{mode}{text} into <bid-ref mode="...">...</bid-ref>
 */
export function convertBIDRefContent(content: string): {
  updatedContent: string;
  replacementsCount: number;
} {
  let replacementsCount = 0;
  let updatedContent = content;

  // 1. Convert <<BID ...>>...<<\>> or <<BID ...>>...<</BID>>
  const bidTagRegex = /<<BID\s+([^>]+?)>>([\s\S]*?)<<(?:\\|\/BID)>>/gi;
  updatedContent = updatedContent.replace(bidTagRegex, (_match, attrs, innerText) => {
    replacementsCount++;
    return `<bid-ref ${attrs.trim()}>${innerText.trim()}</bid-ref>`;
  });

  // 2. Convert \bid{mode}{displayText}
  const macroRegex = /\\bid\{([^}]+)\}\{([^}]+)\}/gi;
  updatedContent = updatedContent.replace(macroRegex, (_match, mode, text) => {
    replacementsCount++;
    return `<bid-ref mode="${mode.trim()}">${text.trim()}</bid-ref>`;
  });

  // 3. Convert \bid{mode}
  const simpleMacroRegex = /\\bid\{([^}]+)\}/gi;
  updatedContent = updatedContent.replace(simpleMacroRegex, (_match, mode) => {
    replacementsCount++;
    return `<bid-ref mode="${mode.trim()}">View in Bayesian Demo [${mode.trim()}]</bid-ref>`;
  });

  return { updatedContent, replacementsCount };
}

export function processBIDRefFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    console.error(`[genBIDRefs Error] File not found: ${filePath}`);
    return false;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    const { updatedContent, replacementsCount } = convertBIDRefContent(content);
    if (replacementsCount > 0) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[genBIDRefs] Converted ${replacementsCount} BID reference(s) in ${filePath}`);
    }
    return true;
  } catch (err) {
    console.error(`[genBIDRefs Error] Failed processing ${filePath}:`, err);
    return false;
  }
}

// CLI handler
if (process.argv[1] && process.argv[1].includes('genBIDRefs')) {
  const args = process.argv.slice(2);
  let filePath = '';
  if (args.includes('--file')) {
    const idx = args.indexOf('--file');
    filePath = args[idx + 1];
  } else if (args.length >= 2) {
    const app = args[0];
    const seg = args[1].endsWith('.html') ? args[1] : `${args[1]}.html`;
    filePath = resolve(__dirname, `../../${app}/segs/${seg}`);
  }

  if (filePath) {
    processBIDRefFile(filePath);
  } else {
    console.log('Usage: node genBIDRefs.js --file <filePath> OR node genBIDRefs.js <appName> <segName>');
  }
}
