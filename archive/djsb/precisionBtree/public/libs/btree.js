import { handleOverrides } from './genUtils.js';
import { SVGElt } from './svgElements.js';
export class Btree {
    constructor(diagram, x, y, w, h, maxBD, nodeSize, overrides) {
        this.diagram = diagram;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.maxBD = maxBD;
        this.nodeSize = nodeSize;
        this.margin = { minHorz: 1, minVert: 10 };
        this.color = { base: 'tan', antenna: 'tan' };
        this.antennaWidth = 1;
        this.antenna = false;
        handleOverrides(this, overrides);
        this.setTreeNodes();
        this.setTreeLinks();
        if (this.antenna)
            this.setAllAntenna();
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
        const diagramId = this.diagram.getA('id');
        if (keyOrId.length > diagramId.length &&
            diagramId == keyOrId.substring(0, diagramId.length)) {
            return keyOrId;
        }
        else {
            return diagramId.concat(keyOrId);
        }
    }
    getKey(keyOrId) {
        const diagramId = this.diagram.getA('id');
        if (keyOrId.length > diagramId.length &&
            diagramId == keyOrId.substring(0, diagramId.length)) {
            return keyOrId.substring(diagramId.length);
        }
        else {
            return keyOrId;
        }
    }
    setTreeNodes() {
        for (let i = 0; i <= this.maxBD; i++) {
            const levelCount = Math.pow(2, i);
            for (let j = 0; j < levelCount; j++) {
                const key = `K${i}${j}`;
                const id = this.setId(key);
                const [x, y] = this.setNodeCenter(i, j);
                const node = this.diagram.setCircle(x, y, this.nodeSize, this.color.base, id);
                node.setA('class', 'node');
            }
        }
    }
    setNodeCenter(bd, pos) {
        const vmbd = (this.antenna) ? this.maxBD + 2 : this.maxBD + 1;
        const levelWidth = this.w / Math.pow(2, bd);
        const levelHeight = this.h / vmbd;
        let cx = this.x + (pos + 1 / 2) * levelWidth;
        let cy = this.y + this.h - (bd + 1 / 2) * levelHeight;
        return [cx, cy];
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
        const k1 = `K${bd}${pos}K${bd + 1}${pos * 2}`;
        const id1 = this.setId(k1);
        const k2 = `K${bd}${pos}K${bd + 1}${pos * 2 + 1}`;
        const id2 = this.setId(k2);
        const [lx, ly, lxx, lyy] = this.setNodeLink(bd, pos, bd + 1, pos * 2);
        const [rx, ry, rxx, ryy] = this.setNodeLink(bd, pos, bd + 1, pos * 2 + 1);
        const l1 = this.diagram.setLine(lx, ly, lxx, lyy, this.color.base, id1);
        const l2 = this.diagram.setLine(rx, ry, rxx, ryy, this.color.base, id2);
        l1.setA('class', 'link');
        l2.setA('class', 'link');
    }
    setNodeLink(bd, pos, bd1, pos1, topOffsetDir) {
        let [x, y] = this.setNodeCenter(bd, pos);
        let [xx, yy] = this.setNodeCenter(bd1, pos1);
        return this.trimLink(x, y, xx, yy, this.nodeSize, topOffsetDir);
    }
    setAllAntenna() {
        const levelCount = Math.pow(2, this.maxBD);
        for (let j = 0; j < levelCount; j++) {
            const [x, y, xx, yy] = this.setNodeLink(this.maxBD, j, this.maxBD + 1, j * 2, -1);
            const l1 = new SVGElt('line');
            const key1 = `K${this.maxBD + 1}${j * 2}`;
            const id1 = this.setId(key1);
            l1.setAA(['x1', x, 'y1', y, 'x2', xx, 'y2', yy, 'stroke', this.color.antenna,
                'stroke-width', this.antennaWidth, 'id', id1, 'class', 'antenna']);
            this.diagram.elt.appendChild(l1.elt);
            const [x1, y1, xx1, yy1] = this.setNodeLink(this.maxBD, j, this.maxBD + 1, j * 2 + 1, -1);
            const l2 = new SVGElt('line');
            const key2 = `K${this.maxBD + 1}${j * 2 + 1}`;
            const id2 = this.setId(key2);
            l2.setAA(['x1', x1, 'y1', y1, 'x2', xx1, 'y2', yy1, 'stroke', this.color.antenna,
                'stroke-width', this.antennaWidth, 'id', id2, 'class', 'antenna']);
            this.diagram.elt.appendChild(l2.elt);
        }
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
//# sourceMappingURL=btree.js.map