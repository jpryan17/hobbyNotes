import { keyToExp, expToId } from './exputils.js';
import { InteractiveTree } from './interactiveTree.js';
import { SVGText, SVGTSpan, SVGSelectableText, SVGElt } from '../clientLib/svgElt.js';
import { Nav } from '../clientLib/navFW.js';
import { DR } from './dyadicRationals.js';
import { RsOps } from './rsOps.js';
let that;
function processCB() { that.processCB(); }
function initCB() { that.initCB(); }
function middleCB() { that.middleCB(); }
function switchCB() { that.switchCB(); }
function showRest() { that.showRest(); }
export function drawAddDiagram(id) {
    const ad = new ArithmeticDiagram(id);
    Nav.fo.append(ad);
}
export function drawAddIsoDiagram(id) {
    const ad = new ArithmeticDiagram(id, 'add', true, true);
    Nav.fo.append(ad);
}
export function drawMultiplyDiagram(id) {
    const ad = new ArithmeticDiagram(id, 'multiply', false);
    Nav.fo.append(ad);
}
export class ArithmeticDiagram extends SVGElt {
    constructor(id, initial = 'add', freeze = true, iso = false) {
        super('svg');
        this.id = id;
        this.freeze = freeze;
        this.iso = iso;
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.treeMaxBD = 6;
        this.treeNodeSize = 6;
        this.op1 = '';
        this.op2 = '';
        this.opResult = '';
        this.fontSize = 20;
        this.prompt = new SVGText();
        this.rcnt = new SVGText();
        this.box = new SVGText();
        this.lineA = new SVGTSpan(this.box);
        this.a1 = new SVGTSpan(this.lineA);
        this.opA = new SVGTSpan(this.lineA);
        this.a2 = new SVGTSpan(this.lineA);
        this.eqA = new SVGTSpan(this.lineA);
        this.rA = new SVGTSpan(this.lineA);
        this.toA = new SVGTSpan(this.lineA);
        this.altA = new SVGTSpan(this.lineA);
        this.lineB = new SVGTSpan(this.box);
        this.b1 = new SVGTSpan(this.lineB);
        this.opB = new SVGTSpan(this.lineB);
        this.b2 = new SVGTSpan(this.lineB);
        this.eqB = new SVGTSpan(this.lineB);
        this.rB = new SVGTSpan(this.lineB);
        this.toB = new SVGTSpan(this.lineB);
        this.altB = new SVGTSpan(this.lineB);
        that = this;
        this.tree = new InteractiveTree(this, 'ops', this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, 2, processCB, initCB, middleCB);
        this.tree.setAA(['x', 1, 'y', 1]);
        this.elt.appendChild(this.tree.elt);
        this.width = this.treeWidth + 20;
        this.height = this.treeHeight + 150;
        this.op = (initial == 'add') ? '+' : '\u2217';
        this.init();
    }
    processCB() {
        RsOps.mc = 0;
        RsOps.ac = 0;
        RsOps.bailed = false;
        this.prompt.setV('click on background to clear');
        this.setBoxValues();
    }
    initCB() {
        this.box.setA('visibility', 'hidden');
        this.rcnt.setV('');
        if (this.opResult.length <= this.tree.maxBD) {
            const key = expToId(this.opResult);
            this.tree.setNodeColor(key, this.tree.color.base);
        }
        this.prompt.setV('select the first operand');
    }
    middleCB() {
        this.prompt.setV('select the second operand');
    }
    switchCB() {
        var _a;
        if (this.opResult.length <= this.tree.maxBD) {
            const key = expToId(this.opResult);
            this.tree.setNodeColor(key, this.tree.color.base);
        }
        this.op = (this.op == '+') ? '\u2217' : '+';
        this.opA.setV(this.op);
        this.opB.setV(this.op);
        const opType = (this.op == '+') ? 'addition' : 'multiplication';
        const opLine = 'operation: '.concat(opType);
        (_a = this.opText) === null || _a === void 0 ? void 0 : _a.setV(opLine);
        if (this.tree.state == 2) {
            if (this.opResult.length <= this.tree.maxBD) {
                const key = expToId(this.opResult);
                this.tree.setNodeColor(key, this.tree.color.base);
            }
            RsOps.ac = 0;
            RsOps.mc = 0;
            this.setBoxValues();
        }
    }
    init() {
        const xp = 0;
        let yp = this.treeHeight + 20;
        const opType = (this.op == '+') ? 'addition' : 'multiplication';
        const opLine = 'operation: '.concat(opType);
        if (this.freeze) {
            this.opText = new SVGText();
            this.opText.setV(opLine);
            this;
            this.opText.setA('stroke', 'black');
            if (!this.iso)
                this.setVState([this.lineB, this.toA, this.altA], 'hidden');
        }
        else {
            this.opText = new SVGSelectableText(switchCB, opLine);
        }
        this.opText.setAA(['x', xp, 'y', yp, 'font-size', 20]);
        this.elt.appendChild(this.opText.elt);
        const svg = this.opText.elt;
        const opW = svg.getBBox().width;
        const xpp = xp + opW + 20;
        this.prompt.setAA(['font-size', 20, 'stroke', 'cadetblue', 'x', xpp, 'y', yp - 50]);
        this.prompt.setV('select the first operand');
        this.elt.appendChild(this.prompt.elt);
        const ps = this.prompt.elt;
        const xppp = 3 / 5 * this.width;
        this.rcnt.setAA(['font-size', 18, 'stroke', 'black', 'x', xppp, 'y', yp - 1]);
        this.elt.appendChild(this.rcnt.elt);
        const y1 = yp + 50;
        const y2 = y1 + 30;
        this.box.setAA(['font-size', 20, 'stroke', 'black', 'visibility', 'hidden', 'y', y1]);
        this.lineA.setA('y', y1);
        this.lineB.setA('y', y2);
        this.setVals([[this.opA, this.op], [this.opB, this.op],
            [this.eqA, '='], [this.eqB, '='],
            [this.toA, '\u21D2'], [this.toB, '\u21D2']]);
        this.elt.appendChild(this.box.elt);
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
            [this.eqA, eqX], [this.eqB, eqX]];
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
        this.setXPositions([[this.rA, rX], [this.rB, rX],
            [this.toA, toAX], [this.toB, toBX],
            [this.altA, raX], [this.altB, rbX]]);
        this.setVals([[this.rB, bvF], [this.altB, bvaF],
            [this.rA, ''], [this.altA, ''],
            [this.rcnt, 'pending..']]);
        if (bva.length <= this.tree.maxBD)
            this.setNodeColors([[exp1, c1], [exp2, c2], [bva, c3]]);
        else
            this.setNodeColors([[exp1, c1], [exp2, c2]]);
        const toColor = 'darkgreen';
        this.setColors([[this.a1, c1], [this.b1, c1],
            [this.a2, c2], [this.b2, c2],
            [this.rA, c3], [this.rB, c3],
            [this.toA, toColor], [this.toB, toColor],
            [this.altA, toColor], [this.altB, toColor],
            [this.rcnt, 'lightpink']]);
        this.updateTree(exp1, exp2, bva);
        this.box.setA('visibility', 'visible');
        window.setTimeout(showRest, 100);
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
    showRest() {
        const exp1 = this.op1;
        const exp2 = this.op2;
        const av = (this.op == '+') ? RsOps.add(exp1, exp2) : RsOps.multiply(exp1, exp2);
        let rci = `(maximum recursion count ${RsOps.maxOps} exceeded)`;
        if (!RsOps.bailed) {
            const avF = (av.length == 0) ? '[ ]' : '['.concat(av, ']');
            const ava = new DR(av);
            const avaF = ava.format();
            if ((this.op == '+'))
                rci = `(addition recursion count ${RsOps.ac})`;
            else
                rci = `(recursions. mult: ${RsOps.mc}   add: ${RsOps.ac})`;
            this.setVals([[this.rA, avF], [this.altA, avaF]]);
        }
        this.rcnt.setA('stroke', 'black');
        this.rcnt.setV(rci);
        this.box.setA('visibility', 'visible');
    }
    setTextWidths(texts) {
        let widths = [];
        texts.forEach(txt => {
            const tw = new SVGText();
            tw.setAA(['font-size', this.fontSize, 'stroke', 'black']);
            tw.setV(txt);
            const [w, _] = tw.eltWH();
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
//# sourceMappingURL=op.js.map