import { log } from './genUtils.js';
import { WU, nodeKeyToBirthdayLinePos, expToId } from './exputils.js';
import { Btree } from './btree.js';
export class InteractiveBtree extends Btree {
    constructor(diagram, x, y, w, h, maxBD, nodeSize, arity = 2, processCB, initCB, middleCB, hasPerps = false, needBeDistinct = false, btreeOverrides) {
        super(diagram, x, y, w, h, maxBD, nodeSize, btreeOverrides);
        this.arity = arity;
        this.processCB = processCB;
        this.initCB = initCB;
        this.middleCB = middleCB;
        this.hasPerps = hasPerps;
        this.needBeDistinct = needBeDistinct;
        this.state = 0;
        this.overNode = false;
        this.wasVisited = [];
        this.mySize = {};
        this.myColor = { overNode: 'pink', op: 'black', selected: 'orange',
            firstSelection: 'blue', secondSelection: 'red', base: 'tan' };
        this.myMargin = {};
        if (this.hasPerps)
            this.drawCutPerps();
        if (arity > 0)
            this.setNodeSelectionListeners();
    }
    drawCutPerps() {
        const x1 = this.x + .1 * this.w;
        const x2 = this.x + .9 * this.w;
        const leftId = this.setId('leftPerp');
        const rightId = this.setId('rightPerp');
        this.drawCutPerp(leftId, x1, this.color.base);
        this.drawCutPerp(rightId, x2, this.color.base);
    }
    drawCutPerp(id, x, color) {
        const y = this.y + .8 * this.h;
        const radius = 18;
        const fontSize = 20;
        const xt = x - 7;
        const yt = y + 5;
        const perp = this.diagram.setText(xt, yt, WU.undetermined, color);
        perp.setA('font-size', fontSize.toString());
        perp.setA('stroke', 'black');
        perp.setA('x', xt.toString());
        perp.setA('y', yt.toString());
        this.diagram.setCircle(x, y, radius, color, id);
        this.diagram.elt.appendChild(perp.elt);
    }
    setNodeSelectionListeners() {
        this.diagram.elt.addEventListener('click', event => {
            let target = event.target;
            let choice = target.id;
            if (choice == this.diagram.getA('id') && this.arity > 1) {
                this.clearOutput();
            }
            else if (target.getAttributeNS(null, 'class') == 'node') {
                const key = this.getKey(choice);
                log(`choice ${choice} key ${key}`);
                if (this.arity == 1) {
                    this.wasVisited.push(key);
                    this.overNode = false;
                    if (this.processCB)
                        this.processCB();
                }
                else if (this.state == 0) {
                    this.wasVisited.push(key);
                    this.setNodeColor(choice, this.myColor.firstSelection);
                    this.overNode = false;
                    this.state = 1;
                    if (this.middleCB != undefined)
                        this.middleCB();
                }
                else if (this.state == 1 &&
                    !(this.needBeDistinct &&
                        key == this.wasVisited[0])) {
                    this.wasVisited.push(key);
                    this.overNode = false;
                    this.state = 2;
                    if (this.processCB)
                        this.processCB();
                }
            }
        });
        this.diagram.elt.addEventListener('mouseover', event => {
            const target = event.target;
            const tc = target.getAttributeNS(null, 'class');
            if (tc == 'node') {
                target.setAttributeNS(null, 'fill', this.myColor.overNode);
                this.overNode = true;
            }
            else if (tc == 'antenna') {
                target.setAttributeNS(null, 'stroke', this.myColor.overNode);
                this.overNode = true;
            }
        });
        this.diagram.elt.addEventListener('mouseout', event => {
            if (this.overNode) {
                const target = event.target;
                const tc = target.getAttributeNS(null, 'class');
                if (tc == 'node') {
                    target.setAttributeNS(null, 'fill', this.color.base);
                    this.overNode = false;
                }
                else if (tc == 'antenna') {
                    target.setAttributeNS(null, 'stroke', this.color.antenna);
                    this.overNode = false;
                }
            }
        });
    }
    clearOutput() {
        for (let i = 0; i < this.wasVisited.length; i++) {
            this.setNodeColor(this.wasVisited[i], this.myColor.base);
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
        this.dirAntenna = this.diagram.setLine(x1, y1, x2, y2, this.myColor.op);
        this.dirAntenna.setA('stroke-width', '3');
    }
    trimLink(ax, ay, bx, by, rad, topOffsetDir) {
        let len = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
        let p = rad / len;
        let dx = p * (bx - ax);
        let dy = p * (by - ay);
        let dir = (topOffsetDir == undefined) ? -1 : topOffsetDir;
        return [ax + dx, ay + dy, bx + dir * dx, by + dir * dy];
    }
}
//# sourceMappingURL=interactivebtree.js.map