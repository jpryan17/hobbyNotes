import { WU, expToId } from './exputils.js';
import { BtreeDiagram, nodeKeyToBirthdayLinePos } from './btree.js';
import { SVGElt } from '../clientLib/svgElt.js';
export class InteractiveTree extends BtreeDiagram {
    constructor(id, w, h, maxBD, nodeSize, arity = 2, processCB, initCB, middleCB, hasPerps = false, needBeDistinct = false, btreeOverrides, dparms) {
        super(id, w, h, maxBD, nodeSize, btreeOverrides, dparms);
        this.arity = arity;
        this.processCB = processCB;
        this.initCB = initCB;
        this.middleCB = middleCB;
        this.hasPerps = hasPerps;
        this.needBeDistinct = needBeDistinct;
        this.state = 0;
        this.wasVisited = [];
        this.color = { base: 'tan', antenna: 'tan' };
        this.myColor = { overNode: 'pink', op: 'black', selected: 'orange',
            firstSelection: 'blue', secondSelection: 'red', base: 'tan' };
        //
        if (this.hasPerps)
            this.drawCutPerps();
        if (arity > 0)
            this.setNodeSelectionListeners();
    }
    setNodeColor(key, color) {
        const id = this.setId(key);
        const node = document.getElementById(id);
        const nc = node.getAttributeNS(null, 'class');
        if (nc == 'node')
            node.setAttributeNS(null, 'fill', color);
        else
            node.setAttributeNS(null, 'stroke', color);
    }
    setId(keyOrId) {
        const diagramId = this.getA('id');
        if (keyOrId.length > diagramId.length &&
            diagramId == keyOrId.substring(0, diagramId.length)) {
            return keyOrId;
        }
        else {
            return diagramId.concat(keyOrId);
        }
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
    drawCutPerps() {
        const x1 = .1 * this.w;
        const x2 = .9 * this.w;
        const leftId = this.setId('leftPerp');
        const rightId = this.setId('rightPerp');
        this.drawCutPerp(leftId, x1, this.color.base);
        this.drawCutPerp(rightId, x2, this.color.base);
    }
    drawCutPerp(id, x, color) {
        const y = .8 * this.h;
        const radius = 18;
        const fontSize = 20;
        const xt = x - 7;
        const yt = y + 5;
        //const perp = this.diagram.setText(xt,yt,WU.undetermined,color)
        const perp = new SVGElt('text');
        perp.setAA(['x', xt, 'y', yt, 'font-size', fontSize, 'stroke', 'black']);
        perp.setV(WU.undetermined);
        const cir = new SVGElt('circle', id);
        cir.setAA(['cx', x, 'cy', y, 'r', radius, 'fill', color, 'class', 'node']);
        this.elt.appendChild(cir.elt);
        this.elt.appendChild(perp.elt);
    }
    setNodeSelectionListeners() {
        this.elt.addEventListener('click', event => {
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
        for (let i = 0; i < this.wasVisited.length; i++) {
            this.setNodeColor(this.wasVisited[i], this.color.base);
        }
        this.wasVisited = [];
        this.state = 0;
        if (this.dirAntenna != undefined) {
            this.dirAntenna.elt.remove();
            this.dirAntenna = undefined;
        }
        if (this.initCB != undefined)
            this.initCB();
    }
    setDirectionAntenna(exp) {
        let dir = (exp[this.maxBD] == WU.plus) ? 1 : -1;
        let key = expToId(exp.substring(0, this.maxBD));
        let [bd, pos] = nodeKeyToBirthdayLinePos(key);
        let [x1, y1, x2, y2] = this.setNodeLink(bd, pos, bd + 1, pos * 2 + dir, -4);
        this.dirAntenna = new SVGElt('line');
        this.dirAntenna.setAA(['x1', x1, 'y1', y2, 'x2', x2, 'y2', y2,
            'stroke', this.myColor.op, 'stroke-width', '3']);
        this.elt.appendChild(this.dirAntenna.elt);
        //this.dirAntenna= this.diagram.setLine(x1,y1,x2,y2,this.myColor.op)
        //this.dirAntenna.setA('stroke-width','3')
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
        const id = this.setId(idOrKey);
        return document.getElementById(id);
    }
}
//# sourceMappingURL=interactiveTree.js.map