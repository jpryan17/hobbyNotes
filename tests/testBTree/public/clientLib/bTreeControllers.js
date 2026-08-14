import { expToId, keyToExp, setExp, setVal, compareExps, findCut, nodeKeyToBirthdayLinePos, } from './exputils.js';
import { DR } from './dyadicRationals.js';
import { RsOps } from './rsOps.js';
/**
 * Subtree Controller (1-operand):
 * Highlights the selected node in black, left subtree in red, right subtree in blue.
 */
export class SubtreeController {
    diagram;
    leftNodes = [];
    rightNodes = [];
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select a ', '#37474f'],
            ['source node', this.diagram.palette.selectedNode || '#212121'],
            [' to highlight its ', '#37474f'],
            ['left', this.diagram.palette.leftSubtree || '#d32f2f'],
            [' and ', '#37474f'],
            ['right', this.diagram.palette.rightSubtree || '#1976d2'],
            [' subtrees', '#37474f'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const leftColor = this.diagram.palette.leftSubtree || '#d32f2f';
        const rightColor = this.diagram.palette.rightSubtree || '#1976d2';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        const sourceExp = keyToExp(selectedKey);
        this.leftNodes = this.diagram.getSubtreeNodes(sourceExp.concat('-'));
        this.rightNodes = this.diagram.getSubtreeNodes(sourceExp.concat('+'));
        this.leftNodes.forEach((exp) => this.diagram.setNodeColorByExp(exp, leftColor));
        this.rightNodes.forEach((exp) => this.diagram.setNodeColorByExp(exp, rightColor));
        this.diagram.setStatusPrompt([
            ['Selected: ', '#37474f'],
            [setVal(sourceExp), selectedColor],
            [' | Left: ', leftColor],
            [`${this.leftNodes.length} nodes`, leftColor],
            [' | Right: ', rightColor],
            [`${this.rightNodes.length} nodes`, rightColor],
            [' (click background to clear)', '#78909c'],
        ]);
    }
    onClear() {
        this.leftNodes = [];
        this.rightNodes = [];
        this.init();
    }
}
/**
 * Simplicity Controller (1-operand):
 * Traces ancestor simpler nodes, partitions them into simpler-left (<) and simpler-right (>).
 */
export class SimplicityController {
    diagram;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select a node', '#1565c0'],
            [' to display its simpler ancestor path and simpler left/right sets', '#37474f'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const linkColor = this.diagram.palette.highlightLink || '#78909c';
        const leftColor = this.diagram.palette.leftSimpler || '#d32f2f';
        const rightColor = this.diagram.palette.rightSimpler || '#1976d2';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        const simplerNodeIds = this.getSimplerNodeIds(selectedKey);
        const keyExp = setExp(selectedKey);
        const leftNodes = [];
        const rightNodes = [];
        simplerNodeIds.forEach((nodeId) => {
            if (compareExps(setExp(nodeId), keyExp) === 1) {
                leftNodes.push(nodeId);
                this.diagram.setNodeColor(nodeId, leftColor);
            }
            else {
                rightNodes.push(nodeId);
                this.diagram.setNodeColor(nodeId, rightColor);
            }
        });
        // Highlight ancestor path links
        let prevNode = selectedKey;
        for (let i = 0; i < simplerNodeIds.length; i++) {
            const linkKey = `${simplerNodeIds[i]}${prevNode}`;
            this.diagram.setLinkColor(linkKey, linkColor);
            prevNode = simplerNodeIds[i];
        }
        const formatSet = (ids) => '{' + ids.map((id) => setVal(setExp(id)).trim()).join(', ') + '}';
        this.diagram.setStatusPrompt([
            ['Selected: ', '#37474f'],
            [setVal(keyExp), selectedColor],
            ['  Left Simpler: ', leftColor],
            [formatSet(leftNodes), leftColor],
            ['  Right Simpler: ', rightColor],
            [formatSet(rightNodes), rightColor],
        ]);
    }
    getSimplerNodeIds(key) {
        const nodeExp = setExp(key);
        const nodes = [];
        for (let i = nodeExp.length - 1; i >= 0; i--) {
            const subExp = nodeExp.substring(0, i);
            nodes.push(expToId(subExp));
        }
        return nodes;
    }
    onClear() {
        this.init();
    }
}
/**
 * Total Order Controller (1-operand):
 * Demonstrates Conway total order (<) by coloring left/right simpler nodes and all their subtrees.
 */
export class OrderController {
    diagram;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select a node', '#1565c0'],
            [' to illustrate total order partition (all strictly smaller & larger nodes)', '#37474f'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const leftNodeColor = this.diagram.palette.leftSimpler || '#d32f2f';
        const rightNodeColor = this.diagram.palette.rightSimpler || '#1976d2';
        const leftSubColor = '#ffcdd2'; // light red
        const rightSubColor = '#bbdefb'; // light blue
        const linkColor = this.diagram.palette.highlightLink || '#78909c';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        // Color direct subtrees
        this.colorSubtree(selectedKey, '-', leftSubColor);
        this.colorSubtree(selectedKey, '+', rightSubColor);
        const nodeExp = setExp(selectedKey);
        const simpler = this.getSimplerNodes(nodeExp);
        simpler.left.forEach((id) => {
            this.diagram.setNodeColor(id, leftNodeColor);
            this.colorSubtree(id, '-', leftSubColor);
        });
        simpler.right.forEach((id) => {
            this.diagram.setNodeColor(id, rightNodeColor);
            this.colorSubtree(id, '+', rightSubColor);
        });
        // Simpler links
        let topNode = selectedKey;
        const allSimplerIds = simpler.all;
        for (let i = 0; i < allSimplerIds.length; i++) {
            const linkKey = `${allSimplerIds[i]}${topNode}`;
            this.diagram.setLinkColor(linkKey, linkColor);
            topNode = allSimplerIds[i];
        }
        this.diagram.setStatusPrompt([
            ['Total Order for ', '#37474f'],
            [setVal(nodeExp), selectedColor],
            [': Less (<) = ', leftNodeColor],
            ['left simpler & subtrees', leftNodeColor],
            [' | Greater (>) = ', rightNodeColor],
            ['right simpler & subtrees', rightNodeColor],
        ]);
    }
    colorSubtree(key, side, color) {
        const exp = setExp(key).concat(side);
        const nodes = this.diagram.getSubtreeNodes(exp);
        nodes.forEach((nodeExp) => this.diagram.setNodeColorByExp(nodeExp, color));
    }
    getSimplerNodes(nodeExp) {
        const all = [];
        const left = [];
        const right = [];
        for (let i = nodeExp.length - 1; i >= 0; i--) {
            const subExp = nodeExp.substring(0, i);
            const id = expToId(subExp);
            all.push(id);
            if (compareExps(subExp, nodeExp) === 1) {
                left.push(id);
            }
            else {
                right.push(id);
            }
        }
        return { all, left, right };
    }
    onClear() {
        this.init();
    }
}
/**
 * Cut Controller (2-operand):
 * Finds the unique simplest real number r = L | R strictly between the two chosen operands.
 */
export class CutController {
    diagram;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select first node', '#1565c0'],
            [' for Conway cut (L | R)', '#37474f'],
        ]);
    }
    onFirstSelect(key) {
        const firstExp = setExp(key);
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        this.diagram.setStatusPrompt([
            ['First operand: ', '#37474f'],
            [setVal(firstExp), this.diagram.palette.firstSelection || '#1976d2'],
            [' \u2192 Select second node', '#1565c0'],
        ]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        const keyA = visited[0];
        const keyB = visited[1];
        const expA = setExp(keyA);
        const expB = setExp(keyB);
        // Determine left (smaller) vs right (larger)
        const [leftKey, leftExp, rightKey, rightExp] = compareExps(expA, expB) === 1
            ? [keyB, expB, keyA, expA]
            : [keyA, expA, keyB, expB];
        const cutExp = findCut(leftExp, rightExp);
        const cutKey = expToId(cutExp);
        const leftColor = '#b71c1c'; // dark red
        const rightColor = '#1b5e20'; // dark green
        const cutColor = this.diagram.palette.cutResult || '#000000';
        this.diagram.setNodeColor(leftKey, leftColor);
        this.diagram.setNodeColor(rightKey, rightColor);
        const [bd, pos] = nodeKeyToBirthdayLinePos(cutKey);
        if (bd > this.diagram.maxBD) {
            if (bd <= this.diagram.maxBD + 1) {
                const basePos = pos % 2 === 0 ? pos / 2 : (pos - 1) / 2;
                const antennaKey = `K${bd - 1}${basePos}${cutKey}`;
                this.diagram.setLinkColor(antennaKey, cutColor);
            }
        }
        else {
            this.diagram.setNodeColor(cutKey, cutColor);
        }
        this.diagram.setStatusPrompt([
            ['Result: ', '#37474f'],
            [setVal(leftExp), leftColor],
            [' | ', '#37474f'],
            [setVal(rightExp), rightColor],
            [' = ', '#37474f'],
            [setVal(cutExp), cutColor],
            [' (click background to clear)', '#78909c'],
        ]);
    }
    onClear() {
        this.init();
    }
}
/**
 * Operation Controller (2-operand):
 * Executes recursive Surreal Addition or Multiplication with step counts and result highlighting.
 */
export class OpController {
    diagram;
    op;
    constructor(diagram, op = '+') {
        this.diagram = diagram;
        this.op = op;
    }
    init() {
        const opName = this.op === '+' ? 'addition' : 'multiplication';
        this.diagram.setStatusPrompt([
            [`Select first operand for Surreal ${opName} (${this.op})`, '#1565c0'],
        ]);
    }
    onFirstSelect(key) {
        const exp1 = keyToExp(key);
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        this.diagram.setStatusPrompt([
            ['First operand: ', '#37474f'],
            [setVal(exp1), this.diagram.palette.firstSelection || '#1976d2'],
            [` ${this.op} Select second operand`, '#1565c0'],
        ]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        const exp1 = keyToExp(visited[0]);
        const exp2 = keyToExp(visited[1]);
        RsOps.mc = 0;
        RsOps.ac = 0;
        RsOps.bailed = false;
        const exp1Color = '#d32f2f'; // red
        const exp2Color = '#2e7d32'; // green
        const resColor = '#000000'; // black
        this.diagram.setNodeColor(expToId(exp1), exp1Color);
        this.diagram.setNodeColor(expToId(exp2), exp2Color);
        const resultExp = this.op === '+' ? RsOps.add(exp1, exp2) : RsOps.multiply(exp1, exp2);
        let statsMsg = '';
        if (!RsOps.bailed) {
            if (this.op === '+') {
                statsMsg = ` (addition recursion count: ${RsOps.ac})`;
            }
            else {
                statsMsg = ` (mult: ${RsOps.mc}, add: ${RsOps.ac})`;
            }
            if (resultExp.length <= this.diagram.maxBD) {
                this.diagram.setNodeColor(expToId(resultExp), resColor);
            }
            else {
                this.diagram.setDirectionAntenna(resultExp, resColor);
            }
        }
        else {
            statsMsg = ' (max recursion count exceeded)';
        }
        this.diagram.setStatusPrompt([
            [setVal(exp1), exp1Color],
            [` ${this.op} `, '#37474f'],
            [setVal(exp2), exp2Color],
            [' = ', '#37474f'],
            [setVal(resultExp), resColor],
            [statsMsg, '#546e7a'],
        ]);
    }
    onClear() {
        this.init();
    }
}
/**
 * Isomorphism Controller (2-operand with toggle):
 * Demonstrates the exact isomorphism between Surreal tree arithmetic and Dyadic Rational arithmetic.
 */
export class IsoController {
    diagram;
    currentOp = '+';
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['[Toggle Op] ', '#1565c0'],
            [`Operation: ${this.currentOp === '+' ? 'Addition (+)' : 'Multiplication (*)'} | `, '#37474f'],
            ['Select first operand', '#1565c0'],
        ]);
    }
    toggleOp() {
        this.currentOp = this.currentOp === '+' ? '\u2217' : '+';
        this.diagram.clearHighlights();
        this.init();
    }
    onFirstSelect(key) {
        const exp1 = keyToExp(key);
        const dr1 = new DR(exp1).format();
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        this.diagram.setStatusPrompt([
            ['Op 1: ', '#37474f'],
            [`${setVal(exp1)} (${dr1})`, this.diagram.palette.firstSelection || '#1976d2'],
            [` ${this.currentOp} Select second operand`, '#1565c0'],
        ]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        const exp1 = keyToExp(visited[0]);
        const exp2 = keyToExp(visited[1]);
        const dr1 = new DR(exp1);
        const dr2 = new DR(exp2);
        const dr1Str = dr1.format();
        const dr2Str = dr2.format();
        const drResult = this.currentOp === '+' ? DR.add(dr1, dr2) : DR.multiply(dr1, dr2);
        const drResStr = drResult.format();
        const surrealRes = drResult.toSignExpansion();
        const c1 = '#0288d1'; // blue
        const c2 = '#c2185b'; // pink/red
        const cRes = '#2e7d32'; // green
        this.diagram.setNodeColor(expToId(exp1), c1);
        this.diagram.setNodeColor(expToId(exp2), c2);
        if (surrealRes.length <= this.diagram.maxBD) {
            this.diagram.setNodeColor(expToId(surrealRes), cRes);
        }
        else {
            this.diagram.setDirectionAntenna(surrealRes, cRes);
        }
        this.diagram.setStatusPrompt([
            ['Surreal: ', '#37474f'],
            [setVal(exp1), c1],
            [` ${this.currentOp} `, '#37474f'],
            [setVal(exp2), c2],
            [' = ', '#37474f'],
            [setVal(surrealRes), cRes],
            ['  \u21D4  Dyadic: ', '#00695c'],
            [`${dr1Str} ${this.currentOp} ${dr2Str} = ${drResStr}`, '#00695c'],
        ]);
    }
    onClear() {
        this.init();
    }
}
/**
 * Omega State Inspector Controller (1-operand):
 * Allows the user to select any state node in the tree (especially top canopy nodes p ∈ Ω).
 * Traces its ascending path from Root 0, displays its sign path and dyadic coordinates,
 * and computes competing hypothesis likelihoods and the resulting Bayes factor.
 */
export class OmegaStateController {
    diagram;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select any state node ', '#1e40af'],
            ['(e.g. on the top canopy in Ω) ', '#0284c7'],
            ['to inspect its address, hypothesis likelihoods & Bayes update', '#64748b'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const exp = keyToExp(selectedKey);
        const bd = exp.length;
        const isTopLeaf = bd >= this.diagram.maxBD;
        const nodeColor = this.diagram.palette.omegaStateNode || '#d97706';
        const pathColor = this.diagram.palette.omegaStatePath || '#0284c7';
        const coneColor = '#059669'; // emerald for subtree event cone
        // 1. Highlight ascending spine from Root 0 to selected node
        this.diagram.traceAscendingPath(selectedKey, pathColor, pathColor);
        this.diagram.setNodeColor(selectedKey, nodeColor);
        const signSeq = exp; // e.g. "+-++"
        const numPlus = (signSeq.match(/\+/g) || []).length;
        const numMinus = (signSeq.match(/-/g) || []).length;
        const formattedSign = signSeq.length > 0 ? `[ ${signSeq.split('').join(' ')} ]` : '[ 0 (Root) ]';
        const dyadicCoord = new DR(exp).format();
        // Friendly coin translation: '+' -> 'H', '-' -> 'T'
        const coinSeq = signSeq.length > 0 ? `(${signSeq.replace(/\+/g, 'H').replace(/-/g, 'T')})` : '(Root)';
        // Hypothesis Likelihoods for this path prefix:
        // H_fair (p = 0.5): P = (0.5)^bd
        // H_biased (p = 0.7 H, 0.3 T): P = (0.7)^numPlus * (0.3)^numMinus
        const pHFair = Math.pow(0.5, bd);
        const pHBiased = Math.pow(0.7, numPlus) * Math.pow(0.3, numMinus);
        const bayesFactor = pHFair > 0 ? pHBiased / pHFair : 1;
        const pHFairPct = (pHFair * 100).toFixed(bd > 4 ? 3 : 2) + '%';
        const pHBiasedPct = (pHBiased * 100).toFixed(bd > 4 ? 3 : 2) + '%';
        const bfText = bayesFactor >= 1
            ? `${bayesFactor.toFixed(2)}× (favors Biased)`
            : `${(1 / bayesFactor).toFixed(2)}× (favors Fair)`;
        if (isTopLeaf) {
            // Top-level atomic state in Omega
            this.diagram.setStatusPrompt([
                ['Top State p: ', '#1e293b'],
                [formattedSign, '#1e40af'],
                [` ${coinSeq}`, '#0284c7'],
                [` (x = ${dyadicCoord})`, '#059669'],
                [' | P(p|Fair)=', '#64748b'],
                [pHFairPct, '#1e40af'],
                [' | P(p|Biased 70%)=', '#64748b'],
                [pHBiasedPct, '#d97706'],
                [' | Bayes Factor: ', '#1e293b'],
                [bfText, bayesFactor >= 1 ? '#d97706' : '#1e40af'],
            ]);
        }
        else {
            // Lower-level node: composite event / subtree cone covering multiple Omega leaves
            this.diagram.highlightSubtreeCone(selectedKey, coneColor, coneColor);
            this.diagram.setNodeColor(selectedKey, nodeColor); // keep focal node distinct
            const spanStates = Math.pow(2, this.diagram.maxBD - bd);
            this.diagram.setStatusPrompt([
                ['Event E (Subtree): ', '#1e293b'],
                [`${formattedSign}*`, '#059669'],
                [` (Covers ${spanStates} states in Ω)`, '#0284c7'],
                [' | P(E|Fair)=', '#64748b'],
                [pHFairPct, '#1e40af'],
                [' | P(E|Biased 70%)=', '#64748b'],
                [pHBiasedPct, '#d97706'],
                [' | Event Bayes Factor: ', '#1e293b'],
                [bfText, bayesFactor >= 1 ? '#d97706' : '#1e40af'],
            ]);
        }
    }
    onClear() {
        this.init();
    }
}
