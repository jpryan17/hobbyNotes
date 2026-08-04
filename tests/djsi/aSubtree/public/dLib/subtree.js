import { Nav } from '../clientLib/navFW.js';
import { keyToExp, expToId } from './exputils.js';
import { InteractiveTree } from './interactiveTree.js';
import { SVGElt, SVGText, SVGTSpan } from '../clientLib/svgElt.js';
function processSelection() { subtree.processSelection(); }
let subtree;
export function initSubtree(id) {
    const subtree = new SubtreeDiagram();
    const div = document.getElementById(id);
    div.appendChild(subtree.elt);
}
export function displaySubtree() {
    const fow = Nav.foWidth;
    const sx = fow / subtree.treeWidth;
    subtree.tree.xscale(sx, sx);
}
export class SubtreeDiagram extends SVGElt {
    //
    constructor() {
        super('svg', 'subtree');
        this.treeWidth = 900;
        this.treeHeight = 400;
        this.treeMaxBD = 6;
        this.treeNodeSize = 6;
        this.selectedNodeColor = 'black';
        this.leftSubtreeColor = 'red';
        this.rightSubtreeColor = 'blue';
        this.subtrees = [[], []];
        this.setAA(['width', this.treeWidth, 'height', this.treeHeight]);
        this.tree = new InteractiveTree(this, 'subtree', this.treeWidth, this.treeHeight, this.treeMaxBD, this.treeNodeSize, 1, processSelection);
        this.tree.w = this.treeWidth;
        this.tree.h = this.treeHeight + 50;
        this.initOutputBox();
    }
    processSelection() {
        if (this.tree.wasVisited.length > 1) {
            this.tree.setNodeColor(this.tree.wasVisited[0], this.tree.myColor.base);
            this.clearSubtrees();
            this.tree.wasVisited = [this.tree.wasVisited[1]];
        }
        this.tree.setNodeColor(this.tree.wasVisited[0], this.selectedNodeColor);
        this.setSubtrees(this.tree.wasVisited[0]);
        this.showSubtrees();
    }
    coloredText(textSegs) {
        const line = new SVGText();
        textSegs.forEach(seg => {
            const span = new SVGTSpan(line);
            span.setV(seg[0]);
            span.setA('stroke', seg[1]);
        });
        return line;
    }
    initOutputBox() {
        const box = this.coloredText([['select the ', 'cadetblue'],
            ['source node', this.selectedNodeColor],
            [' for the ', 'black'],
            ['left', this.leftSubtreeColor],
            [' and ', 'black'],
            ['right', this.rightSubtreeColor],
            [' subtrees', 'black']]);
        box.setAA(['x', 15, 'y', this.treeHeight + 15, 'font-size', 18]);
        this.elt.appendChild(box.elt);
    }
    clearSubtrees() {
        this.subtrees[0].forEach(e => this.setNodeColor(e, this.tree.myColor.base));
        this.subtrees[1].forEach(e => this.setNodeColor(e, this.tree.myColor.base));
    }
    setSubtrees(sourceNodeKey) {
        const sourceExp = keyToExp(sourceNodeKey);
        this.subtrees = [this.subtreeNodes(sourceExp.concat('-')),
            this.subtreeNodes(sourceExp.concat('+'))];
    }
    subtreeNodes(rootNode) {
        let currentLength = rootNode.length;
        let nodes = [rootNode];
        while (currentLength < this.tree.maxBD) {
            nodes.forEach(e => {
                if (e.length == currentLength)
                    nodes.push(e.concat('-'));
                nodes.push(e.concat('+'));
            });
            currentLength++;
        }
        return nodes;
    }
    showSubtrees() {
        this.subtrees[0].forEach(e => this.setNodeColor(e, this.leftSubtreeColor));
        this.subtrees[1].forEach(e => this.setNodeColor(e, this.rightSubtreeColor));
    }
    setNodeColor(exp, color) {
        const key = expToId(exp);
        this.tree.setNodeColor(key, color);
    }
}
//# sourceMappingURL=subtree.js.map