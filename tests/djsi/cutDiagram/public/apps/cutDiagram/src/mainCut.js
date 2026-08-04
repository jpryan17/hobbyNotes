import { initLog } from '../../../libs/genUtils.js';
import { expToId, setVal, setExp, compareExps, setCut, } from '../../../libs/exputils.js';
import { Diagram } from '../../../libs/svgElements.js';
import { InteractiveBtree } from '../../../libs/interactiveBtree.js';
import { SVGText, SVGTSpan } from '../../../libs/svgElements.js';
initLog(true);
const diagram = new Diagram({ w: 950, h: 550, divId: 'main-slot' });
/* constructor(diagram:Diagram,x:number,y:number,w:number,h:number,
                maxBD:number,nodeSize:number,
                public arity=2,
                public processCB?:Function|undefined,
                public initCB?:Function|undefined,
                public middleCB?:Function|undefined,
                public hasPerps=false,
                public needBeDistinct=false,
                btreeOverrides?:any[][]){*/
const tree = new InteractiveBtree(diagram, 10, 10, 930, 500, 6, 6, 2, processCB, initCB, middleCB, true, true, [['antenna', 'true']]);
const dh = diagram.getA('height');
const line = new SVGText('line', 25, +dh - 15);
const cmd = new SVGTSpan(line);
const res = new SVGTSpan(line, 250);
const s0 = new SVGTSpan(res);
const s1 = new SVGTSpan(res);
const s2 = new SVGTSpan(res);
const s3 = new SVGTSpan(res);
const s4 = new SVGTSpan(res);
const s5 = new SVGTSpan(res);
export function drawCutDiagram() {
    line.setA('font-size', '20');
    line.setA('stroke', 'black');
    tree.diagram.elt.appendChild(line.elt);
    tree.clearOutput();
}
function initCB() {
    line.clear();
    cmd.setV('select node');
}
function middleCB() {
    s0.setV('selected: ');
    s1.setA('stroke', tree.myColor.firstSelection);
    s1.setV(setVal(setExp(tree.wasVisited[0])));
    cmd.setV('select another');
}
function processCB() {
    let [left, leftExp, right, rightExp] = setLeftRight();
    let cutExp = setCut(leftExp, rightExp);
    let cut = expToId(cutExp);
    let [leftC, rightC, cutC] = setColors(left, cut);
    let leftNode = document.getElementById(left);
    let rightNode = document.getElementById(right);
    let cutNode = document.getElementById(cut);
    leftNode.setAttributeNS(null, 'fill', leftC);
    rightNode.setAttributeNS(null, 'fill', rightC);
    if (cutNode.getAttributeNS(null, 'class') == 'node')
        cutNode.setAttributeNS(null, 'fill', cutC);
    else
        cutNode.setAttributeNS(null, 'stroke', cutC);
    s1.setA('stroke', leftC);
    s3.setA('stroke', rightC);
    s5.setA('stroke', cutC);
    s0.setV('result: ');
    s1.setV(setVal(leftExp));
    s2.setV(' | ');
    s3.setV(setVal(rightExp));
    s4.setV(' = ');
    s5.setV(setVal(cutExp));
    cmd.setV('click to clear');
    tree.wasVisited.push(cut);
}
function setLeftRight() {
    let choice = tree.wasVisited[1];
    let prevChoice = tree.wasVisited[0];
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
function setColors(left, cut) {
    const stdLeftColor = 'lightblue';
    const repeatLeftColor = 'darkturquoise';
    const stdRightColor = 'palegreen';
    const stdCutColor = 'black';
    if (left == cut)
        return [repeatLeftColor, stdRightColor, repeatLeftColor];
    else
        return [stdLeftColor, stdRightColor, stdCutColor];
}
//# sourceMappingURL=mainCut.js.map