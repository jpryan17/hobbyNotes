import { expToId, setVal, setExp, compareExps, setCut } from '../libs/exputils.js';
import { InteractiveTree } from '../libs/interactiveTree.js';
import { Nav } from '../libs/navFW.js';
import { SVGText, SVGTSpan, SVGGrpElt } from '../libs/svgElements.js';
//
export function drawCutDiagram() {
    const id = 'cut-diagram';
    const diagram = new CutDiagram(id);
    Nav.setHTMLDiagram('cut-diagram', diagram);
}
function init() { that.init(); }
function middle() { that.middle(); }
function process() { that.process(); }
//
let that;
export class CutDiagram extends SVGGrpElt {
    constructor(id) {
        super(id);
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.maxBD = 6;
        this.nodeSize = 6;
        that = this;
        this.tree = new InteractiveTree(id.concat('-tree'), this.treeWidth, this.treeHeight, this.maxBD, this.nodeSize, 2, process, init, middle, true, true, [['antenna', 'true']]);
        this.elt.appendChild(this.tree.elt);
        this.tree.setAA(['x', 20, 'y', 20]);
        this.line = new SVGText('line');
        this.elt.appendChild(this.line.elt);
        this.line.setAA(['x', 40, 'y', this.treeHeight + 40]);
        this.line.setAA(['font-size', 20, 'stroke', 'black']);
        this.width = this.treeWidth;
        this.height = this.treeHeight + 60;
        this.cmd = new SVGTSpan(this.line);
        this.res = new SVGTSpan(this.line, 250);
        this.s0 = new SVGTSpan(this.res);
        this.s1 = new SVGTSpan(this.res);
        this.s2 = new SVGTSpan(this.res);
        this.s3 = new SVGTSpan(this.res);
        this.s4 = new SVGTSpan(this.res);
        this.s5 = new SVGTSpan(this.res);
        this.tree.clearOutput();
    }
    init() {
        this.line.clear();
        this.cmd.setV('select node');
        this.cmd.setA('stroke', 'cadetblue');
    }
    middle() {
        this.s0.setV('selected: ');
        this.s1.setA('stroke', this.tree.myColor.firstSelection);
        this.s1.setV(setVal(setExp(this.tree.wasVisited[0])));
        this.cmd.setV('select another');
    }
    process() {
        let [left, leftExp, right, rightExp] = this.setLeftRight();
        let cutExp = setCut(leftExp, rightExp);
        let cut = expToId(cutExp);
        let [leftC, rightC, cutC] = this.setColors(left, cut);
        let leftNode = this.tree.getElementByIdOrKey(left);
        let rightNode = this.tree.getElementByIdOrKey(right);
        let cutNode = this.tree.getElementByIdOrKey(cut);
        leftNode.setAttributeNS(null, 'fill', leftC);
        rightNode.setAttributeNS(null, 'fill', rightC);
        if (cutNode.getAttributeNS(null, 'class') == 'node')
            cutNode.setAttributeNS(null, 'fill', cutC);
        else
            cutNode.setAttributeNS(null, 'stroke', cutC);
        this.s1.setA('stroke', leftC);
        this.s3.setA('stroke', rightC);
        this.s5.setA('stroke', cutC);
        this.s0.setV('result: ');
        this.s1.setV(setVal(leftExp));
        this.s2.setV(' | ');
        this.s3.setV(setVal(rightExp));
        this.s4.setV(' = ');
        this.s5.setV(setVal(cutExp));
        this.cmd.setV('click to clear');
        this.tree.wasVisited.push(cut);
    }
    setColors(left, cut) {
        const stdLeftColor = 'lightblue';
        const repeatLeftColor = 'darkturquoise';
        const stdRightColor = 'palegreen';
        const stdCutColor = 'black';
        if (left == cut)
            return [repeatLeftColor, stdRightColor, repeatLeftColor];
        else
            return [stdLeftColor, stdRightColor, stdCutColor];
    }
    setLeftRight() {
        let choice = this.tree.wasVisited[1];
        let prevChoice = this.tree.wasVisited[0];
        let cx = setExp(choice);
        let px = setExp(prevChoice);
        if (choice == 'leftPerp' || prevChoice == 'rightPerp')
            return [choice, cx, prevChoice, px];
        if (choice == 'rightPerp' || prevChoice == 'leftPerp')
            return [prevChoice, px, choice, cx];
        if (compareExps(cx, px) == -1)
            return [prevChoice, px, choice, cx];
        return [choice, cx, prevChoice, px];
    }
}
//# sourceMappingURL=cut.js.map