import { WU, setExp, setVal, compareExps, expToId } from '../libs/exputils.js';
import { InteractiveTree } from '../libs/interactiveTree.js';
import { SVGGrpElt, SVGText, SVGTSpan } from '../libs/svgElements.js';
import { Nav } from '../libs/navFW.js';
//
export function drawSimplicityDiagram() {
    const diagram = new SimplicityDiagram();
    Nav.setHTMLDiagram('simplicity-diagram', diagram.tree);
}
function processSelection() { that.processSelection(); }
//
let that;
export class SimplicityDiagram extends SVGGrpElt {
    //
    constructor() {
        super();
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.treeMaxBD = 6;
        this.treeNodeSize = 6;
        //
        this.selectedNodeColor = 'black';
        this.selectedLinkColor = 'gray';
        this.leftNodeColor = 'blue';
        this.rightNodeColor = 'green';
        that = this;
        this.tree = new InteractiveTree('simplicity', this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, 1, processSelection);
        this.elt.appendChild(this.tree.elt);
        this.tree.setAA(['x', 20, 'y', 20]);
        this.width = this.treeWidth;
        this.height = this.treeHeight + 125;
        this.cmd = new SVGText();
        this.elt.appendChild(this.cmd.elt);
        this.cmd.setAA(['x', 25, 'y', this.tree.height - 40, 'font-size', '20', 'stroke', 'cadetblue']);
        this.cmd.setV('select node');
        this.box = new SVGText();
        this.box.setAA(['x', 25, 'y', this.tree.height + 15, 'font-size', '20', 'stroke', 'black', 'visibility', 'hidden']);
        this.line1 = new SVGTSpan(this.box);
        this.line2 = new SVGTSpan(this.box);
        this.line2.setA('y', this.treeHeight + 50);
        this.line3 = new SVGTSpan(this.box);
        this.line3.setA('y', this.treeHeight + 85);
        this.selectedLabel = new SVGTSpan(this.line1, 25);
        this.selectedLabel.setV('selected node: ');
        this.selected = new SVGTSpan(this.line1);
        this.leftLabel = new SVGTSpan(this.line2, 25);
        this.leftLabel.setV('simpler left nodes:');
        this.leftLabel.setA('stroke', this.leftNodeColor);
        this.leftResult = new SVGTSpan(this.line2);
        this.rightLabel = new SVGTSpan(this.line3, 25);
        this.rightLabel.setV('simpler right nodes:');
        this.rightLabel.setA('stroke', this.rightNodeColor);
        this.rightResult = new SVGTSpan(this.line3);
        this.elt.appendChild(this.box.elt);
    }
    processSelection() {
        if (this.tree.wasVisited.length > 1) {
            this.clearTree();
            this.tree.wasVisited = [this.tree.wasVisited[1]];
        }
        this.setTreeSelectionColors();
        this.updateOutputBox();
    }
    updateOutputBox() {
        this.cmd.setV('select another node');
        this.box.setA('visibility', 'visible');
        this.selected.setV(setVal(setExp(this.tree.wasVisited[0])));
        let [left, right] = this.simplerLeftRightNodes();
        this.leftResult.setV(this.labelList(left));
        this.rightResult.setV(this.labelList(right));
    }
    clearTree() {
        this.tree.setNodeColor(this.tree.wasVisited[0], this.tree.color.base);
        this.colorSimplerNodes(this.tree.color.base);
        this.colorSimplerLinks(this.tree.color.base);
    }
    colorSimplerNodes(color) {
        for (let nodeId of this.simplerNodes())
            this.tree.setNodeColor(nodeId, color);
    }
    colorSimplerLinks(color) {
        const diagramId = this.tree.getA('id');
        let topNode = this.tree.wasVisited[0];
        const nodes = this.simplerNodes();
        for (let i = 0; i < nodes.length; i++) {
            const linkKey = `${nodes[i]}${topNode}`;
            const linkId = (diagramId) ? diagramId.concat(linkKey) : linkKey;
            let link = document.getElementById(linkId);
            console.log(`linkKey:${linkKey} link:${link}`);
            link.setAttributeNS(null, 'stroke', color);
            topNode = nodes[i];
        }
    }
    setTreeSelectionColors() {
        this.tree.setNodeColor(this.tree.wasVisited[0], this.selectedNodeColor);
        this.colorSimplerLeftRightNodes();
        this.colorSimplerLinks(this.selectedLinkColor);
    }
    simplerNodes() {
        let nodeExp = setExp(this.tree.wasVisited[0]);
        let nodes = [];
        for (let i = nodeExp.length - 1; i >= 0; i--) {
            let subExp = nodeExp.substring(0, i);
            nodes.push(expToId(subExp));
        }
        return nodes;
    }
    colorSimplerLeftRightNodes() {
        let [leftNodes, rightNodes] = this.simplerLeftRightNodes();
        for (let node of leftNodes)
            this.tree.setNodeColor(node, this.leftNodeColor);
        for (let node of rightNodes)
            this.tree.setNodeColor(node, this.rightNodeColor);
    }
    simplerLeftRightNodes() {
        let keyExp = setExp(this.tree.wasVisited[0]);
        let nodes = this.simplerNodes();
        let leftNodes = [];
        let rightNodes = [];
        for (let node of nodes) {
            if (compareExps(setExp(node), keyExp) == 1)
                leftNodes.push(node);
            else
                rightNodes.push(node);
        }
        return [leftNodes, rightNodes];
    }
    labelList(nodes) {
        if (nodes == undefined || nodes.length == 0)
            return WU.undetermined;
        else {
            let rv = [];
            for (let node of nodes)
                rv.push(setVal(setExp(node)));
            return '{'.concat(rv.join(','), '}');
        }
    }
}
//# sourceMappingURL=simplicity.js.map