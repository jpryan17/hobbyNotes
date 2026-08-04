import { keyToExp, expToId } from './exputils.js';
import { InteractiveTree } from './interactiveTree.js';
import { SVGText, SVGTSpan, SVGElt, textWidth } from '../clientLib/svgElt.js';
import { RsOps } from './rsOps.js';
import { Nav } from '../clientLib/navFW.js';
let addTree;
export function initAddTree(id) {
    addTree = new OpDiagram(id, '+');
    const div = document.getElementById(id);
    div.innerHTML = '';
    div.appendChild(addTree.elt);
    const frame = new SVGElt('rect');
    frame.setAA(['x', 1, 'y', 1, 'fill', 'none', 'stroke', 'blue', 'stroke-width', 2,
        'width', addTree.treeWidth - 4, 'height', addTree.treeHeight - 4]);
    addTree.tree.append(frame);
}
export function displayAddTree() {
    const fow = Nav.foWidth;
    const w = fow - 30;
    let sx = w / addTree.treeWidth;
    sx = Math.min(sx, 1);
    const h = sx * addTree.treeHeight;
    addTree.setAA(['width', w, 'height', h]);
    addTree.tree.xscale(sx, sx);
}
//
let multiplyTree;
export function initMultiplyTree(id) {
    multiplyTree = new OpDiagram(id, '\u2217');
    const div = document.getElementById(id);
    div.innerHTML = '';
    div.appendChild(multiplyTree.elt);
    const frame = new SVGElt('rect');
    frame.setAA(['x', 1, 'y', 1, 'fill', 'none', 'stroke', 'blue', 'stroke-width', 2,
        'width', multiplyTree.treeWidth - 4, 'height', multiplyTree.treeHeight - 4]);
    multiplyTree.tree.append(frame);
}
export function displayMultiplyTree() {
    const fow = Nav.foWidth;
    const w = fow - 30;
    let sx = w / multiplyTree.treeWidth;
    sx = Math.min(sx, 1);
    const h = sx * multiplyTree.treeHeight;
    multiplyTree.setAA(['width', w, 'height', h]);
    multiplyTree.tree.xscale(sx, sx);
}
function processCB() { that.processCB(); }
function initCB() { that.initCB(); }
function middleCB() { that.middleCB(); }
function showRest() { that.showRest(); }
let that;
export class OpDiagram extends SVGElt {
    //
    constructor(id, op) {
        super('svg');
        this.id = id;
        this.op = op;
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.treeMaxBD = 6;
        this.treeNodeSize = 6;
        //
        this.op1 = '';
        this.op2 = '';
        this.fontSize = 20;
        this.prompt = new SVGText();
        this.rcnt = new SVGText();
        this.lineA = new SVGText();
        this.a1 = new SVGTSpan(this.lineA);
        this.opA = new SVGTSpan(this.lineA);
        this.a2 = new SVGTSpan(this.lineA);
        this.eqA = new SVGTSpan(this.lineA);
        this.rA = new SVGTSpan(this.lineA);
        this.c1 = 'red';
        this.c2 = 'green';
        this.c3 = 'black';
        this.xp = 1;
        that = this;
        this.tree = new InteractiveTree(this, id, this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, { bottomRoom: 75, topRoom: 30, antenna: true }, 2, processCB, initCB, middleCB);
        this.append(this.tree);
        this.init();
    }
    processCB() {
        RsOps.mc = 0;
        RsOps.ac = 0;
        RsOps.bailed = false;
        this.prompt.setV('click on background to clear');
        this.setLineValues();
    }
    initCB() {
        this.lineA.setA('visibility', 'hidden');
        this.rcnt.setV('');
        this.tree.clearTree();
        this.prompt.setV('select the first operand');
    }
    middleCB() {
        this.prompt.setV('select the second operand');
    }
    init() {
        const xp = 10;
        let yp = this.treeHeight - this.tree.bottomRoom + this.fontSize;
        this.prompt.setAA(['font-size', this.fontSize, 'stroke', 'darkblue', 'x', xp, 'y', yp]);
        this.prompt.setV('select the first operand');
        this.tree.append(this.prompt);
        const xppp = 3 / 5 * this.treeWidth;
        this.rcnt.setAA(['font-size', 16, 'x', xppp, 'y', yp]);
        this.tree.append(this.rcnt);
        yp += this.fontSize + 10;
        this.lineA.setAA(['font-size', this.fontSize, 'x', xp, 'y', yp, 'stroke', this.c3, 'visibility', 'hidden']);
        this.opA.setV(this.op);
        this.eqA.setV('=');
        this.a1.setA('stroke', this.c1);
        this.a2.setA('stroke', this.c2);
        this.tree.append(this.lineA);
    }
    setLineValues() {
        const exp1 = keyToExp(this.tree.wasVisited[0]);
        this.op1 = exp1;
        const exp2 = keyToExp(this.tree.wasVisited[1]);
        this.op2 = exp2;
        this.op2 = exp2;
        const exp1F = (exp1.length == 0) ? '[ ]' : '['.concat(exp1, ']');
        const exp2F = (exp2.length == 0) ? '[ ]' : '['.concat(exp2, ']');
        let xp = 12;
        this.a1.setA('x', xp);
        this.a1.setV(exp1F);
        xp += textWidth(exp1F, this.fontSize) + 4;
        this.opA.setA('x', xp);
        xp += textWidth(this.op, this.fontSize) + 4;
        this.a2.setA('x', xp);
        this.a2.setV(exp2F);
        xp += textWidth(exp2F, this.fontSize) + 4;
        this.tree.setNodeColor(expToId(exp1), this.c1);
        this.tree.setNodeColor(expToId(exp2), this.c2);
        this.eqA.setA('x', xp);
        this.rcnt.setA('stroke', 'pink');
        this.rcnt.setV('pending ..');
        this.xp = xp += textWidth('=', this.fontSize) + 4;
        window.setTimeout(showRest, 100);
    }
    showRest() {
        this.rcnt.setA('stroke', this.c3);
        let rci = `(max recursion count ${RsOps.maxOps} exceeded)`;
        const exp1 = keyToExp(this.tree.wasVisited[0]);
        const exp2 = keyToExp(this.tree.wasVisited[1]);
        const exp3 = (this.op == '+') ? RsOps.add(exp1, exp2) : RsOps.multiply(exp1, exp2);
        const exp3F = (exp3.length == 0) ? '[ ]' : '['.concat(exp3, ']');
        if (!RsOps.bailed) {
            if ((this.op == '+'))
                rci = `(addition recursion count ${RsOps.ac})`;
            else
                rci = `(recursions. mult: ${RsOps.mc}   add: ${RsOps.ac})`;
            if (exp3.length <= this.tree.maxBD) {
                this.tree.setNodeColor(expToId(exp3), this.c3);
            }
            else {
                this.tree.setDirectionAntenna(exp3);
            }
        }
        this.rA.setA('x', this.xp);
        this.rA.setV(exp3F);
        this.rcnt.setV(rci);
        this.lineA.setA('visibility', 'visible');
    }
    setTextWidths(texts) {
        let widths = [];
        texts.forEach(txt => {
            const w = textWidth(txt, this.fontSize);
            widths.push(w);
        });
        return widths;
    }
}
//# sourceMappingURL=addMult.js.map