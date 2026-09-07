import { BtreeDiagram } from '../../../dLib/btree.js';
import { keyToExp } from '../../../dLib/exputils.js';
let tree;
export function drawPrecisionTreeDiagram() {
    tree = new BtreeDiagram('precTree', 900, 400, 6, 2);
    drawPrecisionProjection('--+');
}
function drawPrecisionProjection(rootNode) {
    const h = 400;
    const nodes = subtreeNodes(rootNode);
    const endNode = rootNode.substring(0, rootNode.length - 1);
    const beginNode = rootNode.substring(0, rootNode.length - 2);
    for (let i = 0; i <= tree.maxBD; i++) {
        for (let j = 0; j < Math.pow(2, i); j++) {
            let key = `K${i}${j}`;
            let id = tree.setId(key);
            let exp = keyToExp(key);
            let svgc = tree.elt.children;
            let val = svgc.namedItem(id);
            let x = val.cx.baseVal.value;
            let y = val.cy.baseVal.value + tree.nodeSize;
            let yy = h - 0.5 * 50;
            if (exp == beginNode || exp == endNode) {
                tree.setNodeColor(key, 'black');
            }
            if (nodes.find(e => e == exp)) {
                tree.setNodeColor(key, 'crimson');
                tree.setLine(x, y, x, yy, 'lightpink');
            }
            else {
                tree.setLine(x, y, x, yy, 'lightgray');
            }
        }
    }
}
function subtreeNodes(rootNode) {
    let currentLength = rootNode.length;
    let nodes = [rootNode];
    while (currentLength < tree.maxBD) {
        nodes.forEach(e => {
            if (e.length == currentLength)
                nodes.push(e.concat('-'));
            nodes.push(e.concat('+'));
        });
        currentLength++;
    }
    return nodes;
}
//# sourceMappingURL=mainPrecision.js.map