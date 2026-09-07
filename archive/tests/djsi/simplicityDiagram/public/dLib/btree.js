import { Diagram } from './diagram.js';
export class BtreeDiagram extends Diagram {
    constructor(divId, w, h, maxBD, nodeSize, parms, dparms) {
        super(divId, w, h, dparms);
        this.minHorzSpace = 2;
        this.minVertSpace = 10;
        this.baseColor = 'tan';
        this.bgColor = 'aliceBlue';
        this.topRoom = 20;
        this.bottomRoom = 10;
        this.leftRoom = 10;
        this.rightRoom = 10;
        this.antenna = false;
        this.antennaColor = this.baseColor;
        this.antennaScale = 1;
        this.maxBD = maxBD;
        this.nodeSize = nodeSize;
        this.processOptionalParameters(parms);
        this.setTreeNodes();
        this.setTreeLinks();
        if (this.antenna)
            this.setAllAntenna();
    }
    processOptionalParameters(parms) {
        if (parms == undefined)
            return;
        if (parms.minHorzSpace != undefined)
            this.minHorzSpace = parms.minHorzSpace;
        if (parms.minVertSpace != undefined)
            this.minVertSpace = parms.minVertSpace;
        if (parms.baseColor != undefined)
            this.baseColor = parms.baseColor;
        if (parms.bgColor != undefined)
            this.bgColor = parms.bgColor;
        if (parms.topRoom != undefined)
            this.topRoom = parms.topRoom;
        if (parms.bottomRoom != undefined)
            this.bottomRoom = parms.bottomRoom;
        if (parms.leftRoom != undefined)
            this.leftRoom = parms.leftRoom;
        if (parms.rightRoom != undefined)
            this.rightRoom = parms.rightRoom;
        if (parms.antenna != undefined)
            this.antenna = parms.antenna;
        if (parms.antennaColor != undefined)
            this.antennaColor = parms.antennaColor;
        if (parms.antennaScale != undefined)
            this.antennaScale = parms.antennaScale;
    }
    setTreeNodes() {
        for (let i = 0; i <= this.maxBD; i++) {
            let levelCount = Math.pow(2, i);
            for (let j = 0; j < levelCount; j++) {
                let key = `K${i}${j}`;
                let [x, y] = this.setNodeCenter(i, j);
                this.setNodeCircle(x, y, this.nodeSize, this.baseColor, key);
            }
        }
    }
    setNodeCenter(bd, pos) {
        let areaWidth = this.w - (this.leftRoom + this.rightRoom);
        let areaHeight = this.h - (this.topRoom + this.bottomRoom);
        let levelSize = areaHeight / (this.maxBD + 1);
        let levelCount = Math.pow(2, bd);
        let levelWidth = areaWidth / levelCount;
        let x = (pos + 1 / 2) * levelWidth + this.leftRoom;
        let y = +this.h - (this.bottomRoom + (bd + 1 / 2) * levelSize);
        return [x, y];
    }
    setTreeLinks() {
        for (let i = 0; i < this.maxBD; i++) {
            let levelCount = Math.pow(2, i);
            for (let j = 0; j < levelCount; j++) {
                this.setNodeLinks(i, j);
            }
        }
    }
    setNodeLinks(bd, pos) {
        let k1 = `K${bd}${pos}K${bd + 1}${pos * 2}`;
        let k2 = `K${bd}${pos}K${bd + 1}${pos * 2 + 1}`;
        let [lx, ly, lxx, lyy] = this.setNodeLink(bd, pos, bd + 1, pos * 2);
        let [rx, ry, rxx, ryy] = this.setNodeLink(bd, pos, bd + 1, pos * 2 + 1);
        this.setLine(lx, ly, lxx, lyy, this.baseColor, k1);
        this.setLine(rx, ry, rxx, ryy, this.baseColor, k2);
    }
    setNodeLink(bd, pos, bd1, pos1, topOffsetDir) {
        let [x, y] = this.setNodeCenter(bd, pos);
        let [xx, yy] = this.setNodeCenter(bd1, pos1);
        return trimLink(x, y, xx, yy, this.nodeSize, topOffsetDir);
    }
    setAllAntenna() {
        let levelCount = Math.pow(2, this.maxBD);
        for (let j = 0; j < levelCount; j++) {
            let [x, y, xx, yy] = this.setNodeLink(this.maxBD, j, this.maxBD + 1, j * 2, -1);
            this.setLine(x, y, xx, yy, this.antennaColor);
            let [x1, y1, xx1, yy1] = this.setNodeLink(this.maxBD, j, this.maxBD + 1, j * 2 + 1, -1);
            this.setLine(x1, y1, xx1, yy1, this.antennaColor);
        }
    }
}
function trimLink(ax, ay, bx, by, rad, topOffsetDir) {
    let len = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
    let p = rad / len;
    let dx = p * (bx - ax);
    let dy = p * (by - ay);
    let dir = (topOffsetDir == undefined) ? -1 : topOffsetDir;
    return [ax + dx, ay + dy, bx + dir * dx, by + dir * dy];
}
export function nodeKeyToBirthdayLinePos(id) {
    let bd = Number(id.substring(1, 2));
    let lp = Number(id.substring(2));
    return [bd, lp];
}
export function setColor(id, color) {
    let elt = document.getElementById(id);
    elt.setAttributeNS(null, 'fill', color);
}
export function log(msg) {
    let logElt = document.getElementById('log');
    let info = logElt.innerHTML;
    logElt.innerHTML = info.concat('<br>', msg);
}
//# sourceMappingURL=btree.js.map