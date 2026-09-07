import { keyToExp, expToId } from './exputils.js';
import { InteractiveTree } from './interactiveTree.js';
import { SVGText, SVGTSpan, SVGSelectableText, SVGElt, textWidth } from '../clientLib/svgElt.js';
import { Nav } from '../clientLib/navFW.js';
import { DR } from './dyadicRationals.js';
let isoTree;
export function initIsoTree(id) {
    isoTree = new IsoDiagram(id);
    const div = document.getElementById(id);
    div.innerHTML = '';
    div.appendChild(isoTree.elt);
    const frame = new SVGElt('rect');
    frame.setAA(['x', 1, 'y', 1, 'fill', 'none', 'stroke', 'blue', 'stroke-width', 2,
        'width', isoTree.treeWidth - 4, 'height', isoTree.treeHeight - 4]);
    isoTree.tree.append(frame);
}
export function displayIsoTree() {
    const fow = Nav.foWidth;
    const w = fow - 30;
    let sx = w / isoTree.treeWidth;
    sx = Math.min(sx, 1);
    const h = sx * isoTree.treeHeight;
    isoTree.setAA(['width', w, 'height', h]);
    isoTree.tree.xscale(sx, sx);
}
let that;
function processCB() { that.processCB(); }
function initCB() { that.initCB(); }
function middleCB() { that.middleCB(); }
function switchCB() { that.switchCB(); }
export class IsoDiagram extends SVGElt {
    constructor(id, initial = 'add') {
        super('svg');
        this.id = id;
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.treeMaxBD = 6;
        this.treeNodeSize = 6;
        this.op1 = '';
        this.op2 = '';
        this.opResult = '';
        this.fontSize = 20;
        this.prompt = new SVGText();
        this.box = new SVGText();
        this.lineA = new SVGTSpan(this.box);
        this.a1 = new SVGTSpan(this.lineA);
        this.opA = new SVGTSpan(this.lineA);
        this.a2 = new SVGTSpan(this.lineA);
        this.lineB = new SVGTSpan(this.box);
        this.b1 = new SVGTSpan(this.lineB);
        this.opB = new SVGTSpan(this.lineB);
        this.b2 = new SVGTSpan(this.lineB);
        this.eqB = new SVGTSpan(this.lineB);
        this.rB = new SVGTSpan(this.lineB);
        this.toB = new SVGTSpan(this.lineB);
        this.altB = new SVGTSpan(this.lineB);
        that = this;
        this.tree = new InteractiveTree(this, id, this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, { bottomRoom: 100, antenna: true }, 2, processCB, initCB, middleCB);
        this.tree.setAA(['x', 1, 'y', 1]);
        this.append(this.tree);
        this.op = (initial == 'add') ? '+' : '\u2217';
        this.init();
    }
    processCB() {
        this.prompt.setV('click on background to clear');
        this.setBoxValues();
    }
    initCB() {
        this.box.setA('visibility', 'hidden');
        this.tree.clearTree();
        this.prompt.setV('select the first operand');
    }
    middleCB() {
        this.prompt.setV('select the second operand');
    }
    switchCB() {
        var _a;
        this.tree.clearTree();
        this.op = (this.op == '+') ? '\u2217' : '+';
        this.opA.setV(this.op);
        this.opB.setV(this.op);
        const opType = (this.op == '+') ? 'addition' : 'multiplication';
        const opLine = 'operation: '.concat(opType);
        (_a = this.opText) === null || _a === void 0 ? void 0 : _a.setV(opLine);
        if (this.tree.state == 2) {
            this.setBoxValues();
        }
    }
    init() {
        const xp = 10;
        let yp = this.treeHeight - this.tree.bottomRoom - 20;
        const opType = (this.op == '+') ? 'addition' : 'multiplication';
        const opLine = 'operation: '.concat(opType);
        this.opText = new SVGSelectableText(switchCB, opLine);
        this.opText.setAA(['x', xp, 'y', yp, 'font-size', this.fontSize]);
        this.tree.append(this.opText);
        yp += 30;
        this.prompt.setAA(['font-size', this.fontSize, 'stroke', 'cadetblue', 'x', xp, 'y', yp]);
        this.prompt.setV('select the first operand');
        this.tree.append(this.prompt);
        //const ps = this.prompt.elt as SVGGraphicsElement
        const xppp = 3 / 5 * this.treeWidth;
        yp += 30;
        this.box.setAA(['font-size', this.fontSize, 'stroke', 'black', 'visibility', 'hidden',
            'x', xp, 'y', yp]);
        this.lineA.setA('y', yp);
        this.lineB.setA('y', yp + 30);
        this.setVals([[this.opA, this.op], [this.opB, this.op],
            [this.eqB, '='], [this.toB, '\u21D2']]);
        this.tree.append(this.box);
    }
    setVState(input, to) {
        input.forEach(span => { span.setA('visibility', to); });
    }
    setVals(input) {
        input.forEach(e => { const [span, val] = e; span.setV(val); });
    }
    getVals(input) {
        return input.map(span => { span.getV(); });
    }
    setXPositions(input) {
        input.forEach(e => { const [span, Xpos] = e; span.setA('x', Xpos); });
    }
    setColors(input) {
        input.forEach(e => { const [span, c] = e; span.setA('stroke', c); });
    }
    getColors(p1, p2, r) {
        let c1 = 'deepskyblue';
        let c2 = 'darkred';
        let cr = 'black';
        if (p1 == p2 && p2 == r) {
            c1 = c2 = cr = 'sienna';
        }
        else if (p1 == p2) {
            c1 = c2 = 'darkviolet';
        }
        else if (p1 == r) {
            c1 = cr = 'saddlebrown';
        }
        else if (p2 == r) {
            c2 = cr = 'saddlebrown';
        }
        return [c1, c2, cr];
    }
    setNodeColors(input) {
        input.forEach(e => { const [exp, c] = e; this.tree.setNodeColor(expToId(exp), c); });
    }
    setBoxValues() {
        const exp1 = keyToExp(this.tree.wasVisited[0]);
        this.op1 = exp1;
        const exp2 = keyToExp(this.tree.wasVisited[1]);
        this.op2 = exp2;
        const dr1 = new DR(exp1);
        const dr2 = new DR(exp2);
        const dr1F = dr1.format();
        const dr2F = dr2.format();
        const exp1F = (exp1.length == 0) ? '[ ]' : '['.concat(exp1, ']');
        const exp2F = (exp2.length == 0) ? '[ ]' : '['.concat(exp2, ']');
        const inputs = [exp1F, dr1F, exp2F, dr2F, '+'];
        const [a1X, b1X, opX, a2X, b2X, eqX] = this.setInputBoxXValues(inputs);
        const inputPositions = [[this.a1, a1X], [this.b1, b1X],
            [this.opA, opX], [this.opB, opX],
            [this.a2, a2X], [this.b2, b2X],
            [this.eqB, eqX]];
        this.setXPositions(inputPositions);
        this.setVals([[this.a1, exp1F], [this.a2, exp2F],
            [this.b1, dr1F], [this.b2, dr2F]]);
        const rX = +eqX + 35;
        const bv = (this.op == '+') ? DR.add(dr1, dr2) : DR.multiply(dr1, dr2);
        const bvF = bv.format();
        const bva = bv.toSignExpansion();
        this.opResult = bva;
        const bvaF = (bva.length == 0) ? '[ ]' : '['.concat(bva, ']');
        const [eqW, bvW, bvaW] = this.setTextWidths(['=', bvF, bvaF]);
        const toAX = eqX + eqW + bvaW + 50;
        const toBX = eqX + eqW + bvW + 50;
        const raX = toAX + 50;
        const rbX = toBX + 50;
        const [c1, c2, c3] = this.getColors(exp1, exp2, bva);
        this.setXPositions([[this.rB, rX],
            [this.toB, toBX],
            [this.altB, rbX]]);
        this.setVals([[this.rB, bvF], [this.altB, bvaF]]);
        if (bva.length <= this.tree.maxBD)
            this.setNodeColors([[exp1, c1], [exp2, c2], [bva, c3]]);
        else
            this.setNodeColors([[exp1, c1], [exp2, c2]]);
        const toColor = 'darkgreen';
        this.setColors([[this.a1, c1], [this.b1, c1],
            [this.a2, c2], [this.b2, c2],
            [this.rB, c3], [this.toB, toColor],
            [this.altB, toColor]]);
        this.updateTree(exp1, exp2, bva);
        this.box.setA('visibility', 'visible');
    }
    updateTree(exp1, exp2, bva) {
        const [c1, c2, c3] = this.getColors(exp1, exp2, bva);
        if (bva.length <= this.tree.maxBD) {
            this.setNodeColors([[exp1, c1], [exp2, c2], [bva, c3]]);
        }
        else {
            this.setNodeColors([[exp1, c1], [exp2, c2]]);
            this.tree.setDirectionAntenna(bva);
        }
    }
    setTextWidths(texts) {
        let widths = [];
        texts.forEach(txt => {
            const w = textWidth(txt, this.fontSize);
            widths.push(w);
        });
        return widths;
    }
    setInputBoxXValues(inputs) {
        const [exp1W, dr1W, exp2W, dr2W, opW] = this.setTextWidths(inputs);
        const m1 = 20;
        const m2 = 20;
        const max1 = Math.max(exp1W, dr1W);
        const max2 = Math.max(exp2W, dr2W);
        const c1 = m1 + 1 / 2 * max1;
        const exp1X = c1 - 1 / 2 * exp1W;
        const dr1X = c1 - 1 / 2 * dr1W;
        const opX = m1 + max1 + m2;
        const c2 = opX + opW + m2 + 1 / 2 * max2;
        const exp2X = c2 - 1 / 2 * exp2W;
        const dr2X = c2 - 1 / 2 * dr2W;
        const eqX = opX + opW + 2 * m2 + max2;
        return [exp1X, dr1X, opX, exp2X, dr2X, eqX];
    }
}
//# sourceMappingURL=iso.js.map