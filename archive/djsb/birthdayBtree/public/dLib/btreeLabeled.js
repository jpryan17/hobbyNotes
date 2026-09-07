import { SVGElt } from '../clientLib/svgElt.js';
import { Btree } from './btree.js';
import { WU } from './exputils.js';
export function drawLabelTreeDiagram() {
    const width = 700;
    const height = 450;
    const maxBD = 3;
    const nodeSize = 30;
    const bgColor = 'aliceblue';
    const svg = new SVGElt('svg');
    const div = document.getElementById('static-diagram');
    div.appendChild(svg.elt);
    svg.setAA(['width', width, 'height', height,
        'style', `background-color:${bgColor}`]);
    const tree = new Btree(svg, 'labeledTree', width, height, maxBD, nodeSize, { antenna: true, topRoom: 70 });
    setLabelTreeInfo(tree);
}
function setLabelTreeInfo(tree) {
    for (let i = 0; i <= tree.maxBD; i++) {
        for (let j = 0; j < Math.pow(2, i); j++) {
            let key = `K${i}${j}`;
            let node = getTreeNode(tree, key);
            let x = node.getN('cx');
            let y = node.getN('cy');
            let label = setNodeLabel(i, j);
            tree.setText(x - (6 + 5 * i), y + 4, label, 'black');
        }
    }
}
function getTreeNode(tree, key) {
    let nodes = Array.from(tree.children());
    let m = 0;
    nodes.forEach((node, i) => {
        if (node.getA('id') == key) {
            m = i;
        }
    });
    return nodes[m];
}
function setNodeLabel(bd, lp) {
    let len = Math.pow(2, bd);
    let sign = WU.plus;
    if (lp >= len / 2) {
        sign = WU.minus;
        lp = len - lp - 1;
    }
    let expansion = WU.plus.repeat(bd).split("");
    let signPos = bd - 1;
    while (signPos > 0) {
        if (lp % 2 > 0) {
            expansion[signPos] = WU.minus;
        }
        lp = Math.floor(lp / 2);
        signPos--;
    }
    if (sign == WU.plus) {
        for (let i = 0; i < bd; i++) {
            expansion[i] = (expansion[i] == WU.plus) ? WU.minus : WU.plus;
        }
    }
    let exp = expansion.join(" ");
    return (exp == '') ? '[ ]' : '['.concat(expansion.join(" "), ']');
}
//# sourceMappingURL=btreeLabeled.js.map