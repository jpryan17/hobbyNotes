import { expToId } from './exputils.js';
import { Btree, nodeKeyToBirthdayLinePos } from './btree.js';
export class InteractiveTree extends Btree {
    constructor(parent, id, w, h, maxBD, nodeSize, btreeOverrides, arity = 2, processCB, initCB, middleCB, needBeDistinct = false) {
        super(parent, id, w, h, maxBD, nodeSize, btreeOverrides);
        this.arity = arity;
        this.processCB = processCB;
        this.initCB = initCB;
        this.middleCB = middleCB;
        this.needBeDistinct = needBeDistinct;
        this.state = 0;
        this.wasVisited = [];
        this.color = { base: 'tan', antenna: 'tan' };
        this.myColor = { overNode: 'pink', op: 'black', selected: 'orange',
            firstSelection: 'blue', secondSelection: 'red', base: 'tan' };
        //
        if (arity > 0)
            this.setNodeSelectionListeners(parent);
    }
    getKey(keyOrId) {
        const diagramId = this.getA('id');
        if (keyOrId.length > diagramId.length &&
            diagramId == keyOrId.substring(0, diagramId.length)) {
            return keyOrId.substring(diagramId.length);
        }
        else {
            return keyOrId;
        }
    }
    setNodeSelectionListeners(parent) {
        parent.elt.addEventListener('click', event => {
            let target = event.target;
            let choice = target.id;
            if (target.getAttributeNS(null, 'class') == 'node') {
                const key = this.getKey(choice);
                if (this.arity == 1) {
                    this.wasVisited.push(key);
                    if (this.processCB)
                        this.processCB();
                }
                else if (this.state == 0) {
                    this.wasVisited.push(key);
                    this.setNodeColor(choice, this.myColor.firstSelection);
                    this.state = 1;
                    if (this.middleCB != undefined)
                        this.middleCB();
                }
                else if (this.state == 1 &&
                    !(this.needBeDistinct &&
                        key == this.wasVisited[0])) {
                    this.wasVisited.push(key);
                    this.state = 2;
                    if (this.processCB)
                        this.processCB();
                }
            }
            else if (this.arity > 1) {
                this.clearOutput();
            }
        });
        this.elt.addEventListener('mouseover', event => {
            const target = event.target;
            const choice = target.id;
            const key = this.getKey(choice);
            if (!this.wasVisited.includes(key)) {
                const tc = target.getAttributeNS(null, 'class');
                if (tc == 'node') {
                    target.setAttributeNS(null, 'fill', this.myColor.overNode);
                }
                else if (tc == 'antenna') {
                    target.setAttributeNS(null, 'stroke', this.myColor.overNode);
                }
            }
        });
        this.elt.addEventListener('mouseout', event => {
            const target = event.target;
            const choice = target.id;
            const key = this.getKey(choice);
            if (!this.wasVisited.includes(key)) {
                const tc = target.getAttributeNS(null, 'class');
                if (tc == 'node') {
                    target.setAttributeNS(null, 'fill', this.color.base);
                }
                else if (tc == 'antenna') {
                    target.setAttributeNS(null, 'stroke', this.color.antenna);
                }
            }
        });
    }
    clearOutput() {
        this.wasVisited = [];
        this.state = 0;
        this.clearTree();
        if (this.initCB != undefined)
            this.initCB();
    }
    setDirectionAntenna(exp, color = 'black') {
        let key = expToId(exp.substring(0, this.maxBD + 1));
        let [bd, pos] = nodeKeyToBirthdayLinePos(key);
        const basePos = (pos % 2 == 0) ? 1 / 2 * pos : 1 / 2 * (pos - 1);
        const baseKey = `K${bd - 1}${basePos}${key}`;
        const antenna = this.getTreeLink(baseKey);
        antenna.setA('stroke', color);
    }
    trimLink(ax, ay, bx, by, rad, topOffsetDir) {
        let len = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
        let p = rad / len;
        let dx = p * (bx - ax);
        let dy = p * (by - ay);
        let dir = (topOffsetDir == undefined) ? -1 : topOffsetDir;
        return [ax + dx, ay + dy, bx + dir * dx, by + dir * dy];
    }
    getElementByIdOrKey(idOrKey) {
        const id = idOrKey;
        return document.getElementById(id);
    }
    clearTree(nodeBaseColor = this.color.base, linkBaseColor = this.color.base) {
        let parts = Array.from(this.children());
        parts.forEach(part => {
            if (part.getA('class') == 'node') {
                part.setA('fill', nodeBaseColor);
            }
            else if (part.getA('class') == 'link') {
                part.setA('stroke', linkBaseColor);
            }
        });
    }
    subtreeNodes(rootNode) {
        let currentLength = rootNode.length;
        let nodes = [rootNode];
        while (currentLength < this.maxBD) {
            nodes.forEach(e => {
                if (e.length == currentLength)
                    nodes.push(e.concat('-'));
                nodes.push(e.concat('+'));
            });
            currentLength++;
        }
        return nodes;
    }
}
//# sourceMappingURL=interactiveTree.js.map