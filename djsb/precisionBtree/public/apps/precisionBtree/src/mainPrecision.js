import { Btree } from '../../../libs/btree.js';
import { Diagram } from '../../../libs/svgElements.js';
import { log, initLog } from '../../../libs/genUtils.js';
import { keyToExp } from '../../../libs/exputils.js';
initLog(true);
let tree;
export function drawPrecisionTreeDiagram() {
    const diagram = new Diagram({ w: 900, h: 400, divId: 'main-slot' });
    tree = new Btree(diagram, 50, 50, 850, 350, 6, 4);
    drawPrecisionProjection('--+');
}
function drawPrecisionProjection(rootNode) {
    const h = 400;
    const nodes = subtreeNodes(rootNode);
    const endNode = rootNode.substring(0, rootNode.length - 1);
    const beginNode = rootNode.substring(0, rootNode.length - 2);
    log(`nodes len ${nodes.length} nodes[0] ${nodes[0]}`);
    for (let i = 0; i <= tree.maxBD; i++) {
        for (let j = 0; j < Math.pow(2, i); j++) {
            let key = `K${i}${j}`;
            let id = tree.setId(key);
            let exp = keyToExp(key);
            let svgc = tree.diagram.elt.children;
            let val = svgc.namedItem(id);
            let x = val.cx.baseVal.value;
            let y = val.cy.baseVal.value + tree.nodeSize;
            let yy = h - 0.5 * 50;
            if (exp == beginNode || exp == endNode) {
                tree.setNodeColor(key, 'black');
            }
            if (nodes.find(e => e == exp)) {
                tree.setNodeColor(key, 'crimson');
                tree.diagram.setLine(x, y, x, yy, 'lightpink');
            }
            else {
                tree.diagram.setLine(x, y, x, yy, 'lightgray');
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