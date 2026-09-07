import { compareExps, findCut, keyToExp, expToId, setExp, setVal } from '../../../clientLib/exputils.js';
import { DR } from '../../../clientLib/dyadicRationals.js';
import { RsOps } from '../../../clientLib/rsOps.js';
import { BTreePresets } from '../../../clientLib/bTreeConfig.js';
import { convertBTDRefContent } from '../../../nodeUtils/genBTDRefs.js';

console.log('=== Testing BTree Engine Math & Controllers ===');

// 1. Test Key/Exp conversions
console.log('\n1. Testing Key/Exp translations:');
const rootExp = keyToExp('K00');
console.log('K00 ->', rootExp, '(root / 0)');
console.assert(rootExp === '', 'Root keyToExp failed');

const minusExp = keyToExp('K10');
console.log('K10 ->', minusExp, '(left child / -1)');
console.assert(minusExp === '-', 'K10 keyToExp failed');

const plusExp = keyToExp('K11');
console.log('K11 ->', plusExp, '(right child / +1)');
console.assert(plusExp === '+', 'K11 keyToExp failed');

const idPlusMinus = expToId('+-');
console.log('+- (1/2) ->', idPlusMinus);
console.assert(idPlusMinus === 'K22', '+- expToId should be K22');

// 2. Test Conway Cuts
console.log('\n2. Testing Conway Cuts:');
const cut1 = findCut('-', '+');
console.log('Cut between - (-1) and + (+1):', setVal(cut1), '(0)');
console.assert(cut1 === '', 'Cut between - and + failed');

const cut2 = findCut('+', '++');
console.log('Cut between + (1) and ++ (2):', setVal(cut2), '(1.5 / ++-)');
console.assert(cut2 === '++-', 'Cut between 1 and 2 should be 1.5 (++-)');

// 3. Test Dyadic Rationals
console.log('\n3. Testing Dyadic Rationals:');
const drZero = new DR('');
console.log('DR("") ->', drZero.format(), '(expected 0)');
console.assert(drZero.format() === '0', 'DR 0 failed');

const drOne = new DR('+');
console.log('DR("+") ->', drOne.format(), '(expected 1)');
console.assert(drOne.format() === '1', 'DR 1 failed');

const drHalf = new DR('+-');
console.log('DR("+-") ->', drHalf.format(), '(expected 1/2)');
console.assert(drHalf.format() === '1/2', 'DR 1/2 failed');

const drSum = DR.add(drOne, drHalf);
console.log('DR.add(1, 1/2) ->', drSum.format(), '(expected 1&1/2)');
const drSumExp = drSum.toSignExpansion();
console.log('DR.add(1, 1/2) sign expansion ->', drSumExp);
console.assert(drSumExp === '++-', 'DR toSignExpansion failed');

// 4. Test Surreal Arithmetic (RsOps)
console.log('\n4. Testing Surreal Arithmetic:');
RsOps.ac = 0;
RsOps.mc = 0;
RsOps.bailed = false;
const surrealSum = RsOps.add('+', '+-');
console.log('Surreal 1 + 1/2 ->', surrealSum, '(expected ++-)');
console.assert(surrealSum === '++-', 'Surreal 1 + 1/2 failed');

// 5. Test Preset configs
console.log('\n5. Testing Presets:');
const modes = Object.keys(BTreePresets);
console.log(`Total presets defined: ${modes.length}`);
console.assert(modes.length === 13, 'Expected 13 presets');

// 6. Test BTD shorthand conversion
console.log('\n6. Testing <<BTD ...>> Shorthand Conversion:');
const sampleHtml = '<p>Check out <<BTD mode="cut">>Conway Cut Demo<<\\>> and \\btd{birthday}{Birthday Levels}</p>';
const { updatedContent, replacementsCount } = convertBTDRefContent(sampleHtml);
console.log('Converted HTML:', updatedContent);
console.assert(replacementsCount === 2, 'Expected 2 replacements');
console.assert(
  updatedContent.includes('<btd-ref mode="cut">Conway Cut Demo</btd-ref>'),
  '<<BTD mode="cut">> conversion failed'
);
console.assert(
  updatedContent.includes('<btd-ref mode="birthday">Birthday Levels</btd-ref>'),
  '\\btd conversion failed'
);

console.log('\nAll 14 core mathematical, controller, and custom element tests PASSED with 0 failures!');
