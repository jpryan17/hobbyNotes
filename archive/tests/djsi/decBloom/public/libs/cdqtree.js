import { SVGElt, SVGGrpElt } from './svgElements.js';
export class CDQtree extends SVGGrpElt {
    //
    constructor(size, maxBD, nodeSize, df = .006) {
        super('cdqtree');
        this.size = size;
        this.maxBD = maxBD;
        this.nodeSize = nodeSize;
        this.df = df;
        this.margin = { minHorz: 1, minVert: 10 };
        this.favs = [['Raspbery Sorbet', '#D2386C'],
            ['Amethyst Orchid', '#926AA6'],
            ['Mint', '#00A170'],
            ['Biscay Green', '#56C6A9'],
            ['Orange Peel', '#FA7A35'],
            ['Green Ash', '#A0DAA9'],
            ['French Blue', '#0072B5'],
            ['Illuminating', '#F5DF4D'],
            ['Rust', '#B55A30'],
            ['Marigold', '#FDAC53'],
            ['Orange Peel', '#FA7A35'],
            ['Grape Compote', '#9C4722'],
            ['Sunlight', '#EDD59E'],
            ['Mosaic Blue', '#00758F'],
            ['Fiesta', '#DD4132'],
            ['Flame Scarlet', '#CD212A'],
            ['Saffron', '#FFA500'],
            ['Sweet Lilac', '#E8B5CE'],
            ['Mango Mojito', '#D69C2F'],
            ['Burnt Coral', '#E9897E'],
            ['Princess Blue', '#00539C'],
            ['Aspen Gold', '#FFD662']];
        this.minColor = 10;
        this.bgColor = 'snow';
        this.nodes = [[]];
        this.keys = new Map();
        this.nodeInfo = new Map();
        this.addInfo = new Map();
        this.favSelection = new Map();
        this.savedColors = new Map();
        this.rect = new SVGElt('rect');
        this.rect.setAA(['x', 1, 'y', 1, 'width', size - 2, 'height', size - 2, 'fill', 'snow']);
        this.elt.appendChild(this.rect.elt);
        this.setTreeNodes();
        this.setTreeLinks();
    }
    setNodeCenter(quads) {
        const lev = quads.length;
        let cx = this.size / 2;
        let cy = this.size / 2;
        for (let i = 0; i < lev; i++) {
            const q = quads[i];
            const offset = this.size / Math.pow(2, i + 2) - i * 4;
            if (i % 2 == 0) {
                if (q == 0) {
                    cx += offset;
                    cy -= offset;
                }
                else if (q == 1) {
                    cx += offset;
                    cy += offset;
                }
                else if (q == 2) {
                    cx -= offset;
                    cy += offset;
                }
                else {
                    cx -= offset;
                    cy -= offset;
                }
            }
            else {
                if (q == 0) {
                    cy -= 1.3 * offset;
                }
                else if (q == 1) {
                    cx += 1.3 * offset;
                }
                else if (q == 2) {
                    cy += 1.3 * offset;
                }
                else {
                    cx -= 1.3 * offset;
                }
            }
        }
        return [cx, cy];
    }
    setNode(quads = []) {
        const lev = quads.length;
        const key = this.setNodeKey(quads);
        const [cx, cy] = this.setNodeCenter(quads);
        const node = new SVGElt('circle', key);
        node.setAA(['cx', cx, 'cy', cy, 'r', this.nodeSize, 'fill', this.bgColor, 'class', 'node']);
        //
        this.keys.set(key, [node, 'N']);
        this.nodeInfo.set(key, [[], [0, 0, 0]]);
        //
        this.elt.appendChild(node.elt);
    }
    setTreeNodes() {
        for (let lev = 0; lev < this.maxBD; lev++) {
            const newNodes = [];
            this.nodes.forEach(node => {
                if (node.length == lev) {
                    for (let i = 0; i < 4; i++) {
                        newNodes.push(node.concat([i]));
                    }
                }
            });
            newNodes.forEach(n => { this.nodes.push(n); });
        }
        this.nodes.forEach(node => { this.setNode(node); });
    }
    setTreeLinks() {
        for (let i = 0; i < this.maxBD; i++) {
            const snodes = this.nodes.filter(node => node.length == i);
            const tnodes = this.nodes.filter(node => node.length == i + 1);
            snodes.forEach(snode => {
                tnodes.forEach(tnode => {
                    if (this.isLink(snode, tnode)) {
                        this.setTreeLink(snode, tnode);
                    }
                });
            });
        }
    }
    isLink(snode, tnode) {
        let rv = true;
        for (let i = 0; i < snode.length; i++) {
            if (snode[i] != tnode[i]) {
                rv = false;
            }
        }
        return (rv);
    }
    setTreeLink(snode, tnode) {
        const key1 = this.setNodeKey(snode);
        const key2 = this.setNodeKey(tnode);
        const key = key1.concat(key2);
        const [cx1, cy1] = this.setNodeCenter(snode);
        const [cx2, cy2] = this.setNodeCenter(tnode);
        const [lx1, ly1, lx2, ly2] = this.trimLink(cx1, cy1, cx2, cy2, this.nodeSize);
        const line = new SVGElt('line');
        line.setAA(['x1', lx1, 'y1', ly1, 'x2', lx2, 'y2', ly2, 'stroke', this.bgColor, 'class', 'link']);
        this.keys.set(key, [line, 'L', key1, key2]);
        const [links, color] = this.nodeInfo.get(key1);
        links.push([key, key2]);
        this.nodeInfo.set(key1, [links, color]);
        this.elt.appendChild(line.elt);
    }
    trimLink(ax, ay, bx, by, rad) {
        let len = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
        let p = rad / len;
        let dx = p * (bx - ax);
        let dy = p * (by - ay);
        let dir = -1;
        return [ax + dx, ay + dy, bx + dir * dx, by + dir * dy];
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
    setNodeKey(quads) {
        const lev = quads.length;
        let key = `K${lev}`;
        quads.forEach(q => {
            key = key.concat(`${q}`);
        });
        return key;
    }
    //
    awaitFor(dur) {
        return new Promise(resolve => { setTimeout(() => { resolve('k'); }, dur); });
    }
    async drip() {
        const dropNodePos = Math.floor(Math.random() * this.nodes.length);
        const color = this.dropColor();
        const quad = this.nodes[dropNodePos];
        const key = this.setNodeKey(quad);
        const [links, oldColor] = this.nodeInfo.get(key);
        this.nodeInfo.set(key, [links, color]);
        const node = this.keys.get(key)[0];
        const [ro, go, bo] = oldColor;
        const [r, g, b] = color;
        for (let i = 1; i < 10; i++) {
            const rv = ro + i / 10 * (r - ro);
            const gv = go + i / 10 * (g - go);
            const bv = bo + i / 10 * (b - bo);
            node.setAA(['fill', `rgb(${rv},${gv},${bv})`]);
            await this.awaitFor(10);
        }
        node.setAA(['fill', `rgb(${r},${g},${b})`]);
        //return this.nextDropInterval()
    }
    dropColor() {
        let color = [0, 0, 0];
        const pos = Math.floor(Math.random() * 3);
        color[pos] = 255;
        return color;
    }
    showNodeColors() {
        this.nodeInfo.forEach((v, k) => {
            console.log(`${k} ${v[1]}`);
        });
    }
    updateAddInfo(key, by) {
        const kv = this.addInfo.get(key);
        if (kv) {
            const [ra, ga, ba] = by;
            const [ro, go, bo] = kv;
            this.addInfo.set(key, [ra + ro, ga + go, ba + bo]);
        }
        else {
            this.addInfo.set(key, by);
        }
    }
    diffuse() {
        this.addInfo.clear();
        this.nodeInfo.forEach((v, k) => {
            const [links, color] = v;
            if (!color.every(c => c == 0)) {
                const [r, g, b] = color;
                const rd = r * this.df;
                const gd = g * this.df;
                const bd = b * this.df;
                this.updateAddInfo(k, [-rd, -gd, -bd]);
                const ac = [1 / 4 * rd, 1 / 4 * gd, 1 / 4 * bd];
                links.forEach(link => {
                    const [_, linkedNodeKey] = link;
                    this.updateAddInfo(linkedNodeKey, ac);
                });
            }
        });
        this.addInfo.forEach((v, k) => {
            const [links, [rc, gc, bc]] = this.nodeInfo.get(k);
            const [ra, ga, ba] = this.addInfo.get(k);
            this.nodeInfo.set(k, [links, [rc + ra, gc + ga, bc + ba]]);
        });
    }
    clearTreeColors() {
        this.keys.forEach(v => {
            if (v[1] == 'N') {
                v[0].setA('fill', this.bgColor);
            }
            else {
                v[0].setA('stroke', this.bgColor);
            }
        });
    }
    updateColorDisplay() {
        this.clearTreeColors();
        this.nodeInfo.forEach((v, k) => {
            const node = this.keys.get(k)[0];
            const [_, color] = v;
            const [r, g, b] = color.map(c => Math.round(c));
            if (r + g + b > this.minColor) {
                node.setA('fill', `rgb(${r},${g},${b})`);
            }
        });
        this.keys.forEach((v) => {
            if (v[1] == 'L') {
                const link = v[0];
                const [_1, [r1, g1, b1]] = this.nodeInfo.get(v[2]);
                const [_2, [r2, g2, b2]] = this.nodeInfo.get(v[3]);
                if (r1 + g1 + b1 > this.minColor && r2 + g2 + b2 > this.minColor) {
                    const r = Math.round(1 / 2 * (r1 + r2));
                    const g = Math.round(1 / 2 * (g1 + g2));
                    const b = Math.round(1 / 2 * (b1 + b2));
                    if (r + g + b > this.minColor) {
                        link.setA('stroke', `rgb(${r},${g},${b}`);
                    }
                }
            }
        });
    }
    setFavSelection() {
        this.favSelection.clear();
        this.nodeInfo.forEach((_, k) => {
            const selectedPos = Math.floor(Math.random() * this.favs.length);
            const hex = this.favs[selectedPos][1];
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            this.favSelection.set(k, [r, g, b]);
        });
    }
    saveCurrentColors() {
        this.savedColors.clear();
        this.nodeInfo.forEach((v, k) => {
            const [_, [r, g, b]] = v;
            this.savedColors.set(k, [r, g, b]);
        });
    }
    setCurrentColors() {
        this.nodeInfo.forEach((v, k) => {
            const [links, _] = v;
            let color = [0, 0, 0];
            const p = Math.floor(Math.random() * 3);
            color[p] = 255;
            this.nodeInfo.set(k, [links, color]);
        });
    }
}
//# sourceMappingURL=cdqtree.js.map