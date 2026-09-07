import { setExp, compareExps, expToId } from './exputils.js';
import { InteractiveTree } from './interactiveTree.js';
import { SVGElt, SVGText } from './svgElt.js';
import { Nav } from './navFW.js';
//
function processSelection() { that.processSelection(); }
//
let orderedtree;
export function initOrderedtree(id) {
    orderedtree = new OrderedDiagram();
    const div = document.getElementById(id);
    div.innerHTML = '';
    div.appendChild(orderedtree.elt);
    const frame = new SVGElt('rect');
    frame.setAA(['x', 1, 'y', 1, 'fill', 'none', 'stroke', 'blue', 'stroke-width', 2,
        'width', orderedtree.treeWidth - 4, 'height', orderedtree.treeHeight - 4]);
    orderedtree.tree.append(frame);
}
export function displayOrderedtree() {
    const fow = Nav.foWidth;
    const w = fow - 30;
    let sx = w / orderedtree.treeWidth;
    sx = Math.min(sx, 1);
    const h = sx * orderedtree.treeHeight;
    orderedtree.setAA(['width', w, 'height', h]);
    orderedtree.tree.xscale(sx, sx);
}
let that;
export class OrderedDiagram extends SVGElt {
    tree;
    treeWidth = 900;
    treeHeight = 400;
    treeMaxBD = 6;
    treeNodeSize = 6;
    //
    selectedNodeColor = 'black';
    selectedLinkColor = 'gray';
    leftNodeColor = 'red';
    rightNodeColor = 'blue';
    leftSubColor = 'pink';
    rightSubColor = 'lightblue';
    //
    cmd;
    //
    constructor() {
        super('svg');
        that = this;
        this.tree = new InteractiveTree(this, 'ordered', this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, { bottomRoom: 25 }, 1, processSelection);
        this.tree.setAA(['x', 20, 'y', 20]);
        this.cmd = new SVGText();
        this.tree.append(this.cmd);
        this.cmd.setAA(['x', 25, 'y', this.tree.h - 85, 'font-size', '16', 'stroke', 'cadetblue']);
        this.cmd.setV('select node');
    }
    processSelection() {
        this.tree.clearTree();
        if (this.tree.wasVisited.length > 1) {
            this.tree.clearTree();
            this.tree.wasVisited = [this.tree.wasVisited[1]];
        }
        const selected = this.tree.wasVisited[0];
        const [simplerLeft, simplerRight] = this.simplerLeftRightNodes();
        console.log(`selected ${selected} left ${simplerLeft} right ${simplerRight}`);
        this.tree.setNodeColor(selected, this.selectedNodeColor);
        this.colorLeftSubtree(selected);
        this.colorRightSubtree(selected);
        simplerLeft.forEach(node => {
            this.tree.setNodeColor(node, this.leftNodeColor);
            this.colorLeftSubtree(node);
        });
        simplerRight.forEach(node => {
            this.tree.setNodeColor(node, this.rightNodeColor);
            this.colorRightSubtree(node);
        });
        this.colorSimplerLinks(this.selectedLinkColor);
    }
    colorLeftSubtree(key) {
        let exp = setExp(key).concat('-');
        const nodes = this.tree.subtreeNodes(exp);
        nodes.forEach(node => {
            this.tree.setNodeColorByExp(node, this.leftSubColor);
        });
    }
    colorRightSubtree(key) {
        let exp = setExp(key).concat('+');
        const nodes = this.tree.subtreeNodes(exp);
        nodes.forEach(node => {
            this.tree.setNodeColorByExp(node, this.rightSubColor);
        });
    }
    colorSimplerLinks(color) {
        let topNode = this.tree.wasVisited[0];
        const nodes = this.simplerNodes();
        for (let i = 0; i < nodes.length; i++) {
            const linkKey = `${nodes[i]}${topNode}`;
            this.tree.setLinkColor(linkKey, color);
            topNode = nodes[i];
        }
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
}
