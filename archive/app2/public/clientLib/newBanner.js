import { SVGElt, SVGGrpElt, SVGText, SVGTSpan } from './svgElt.js';
export class Banner extends SVGElt {
    bn;
    frame;
    grp;
    rect;
    width = 0;
    height = 0;
    sw;
    connections = [];
    constructor(bn) {
        super('svg');
        this.bn = bn;
        const main = document.getElementById('main-slot');
        const ww = window.innerWidth;
        this.sw = ww - main.clientWidth; // this presumably is the scrollbar width.
        this.frame = new SVGElt('rect');
        this.append(this.frame);
        this.frame.setAA(['x', 0, 'y', 0, 'fill', bn.color.bg,
            'stroke', bn.color.border, 'stroke-width', bn.outerBorderWidth]);
        this.grp = new SVGGrpElt();
        this.append(this.grp);
        this.rect = new SVGElt('rect');
        this.grp.append(this.rect);
        this.rect.setAA(['fill', bn.color.fill,
            'stroke', bn.color.border, 'stroke-width', bn.innerBorderWidth]);
        let maxWidth = 0;
        let sumHeights = 0;
        let yp = bn.margin;
        bn.lines.forEach(line => {
            const lineWidget = this.processLine(line);
            line.len = lineWidget.getTextWidth();
            if (line.len > maxWidth) {
                maxWidth = line.len;
            }
            yp += line.fontSize + line.topMargin;
            lineWidget.setA('y', yp - 1 / 4 * line.fontSize);
            sumHeights += line.fontSize + line.topMargin;
        });
        const rw = 2 * bn.margin + bn.innerBorderWidth + maxWidth;
        const rh = 2 * bn.margin + sumHeights;
        this.rect.setAA(['x', 0, 'y', 0, 'width', rw, 'height', rh]);
        this.width = rw;
        this.height = rh;
        if (bn.connectWidth > 0) {
            for (let i = 0; i < 4; i++) {
                const lw = new SVGElt('line');
                lw.setAA(['stroke', bn.color.border, 'stroke-width', bn.connectWidth]);
                this.append(lw);
                this.connections.push(lw);
            }
        }
        bn.lines.forEach((line, index) => {
            let xp;
            let ww = 0;
            let sp = 0;
            let lineWidget = line.w;
            let lineLen = line.len;
            if (line.pos == 'L') {
                xp = bn.margin;
            }
            else if (line.pos == 'R') {
                xp = rw - bn.margin - lineLen;
            }
            else {
                xp = 1 / 2 * rw - 1 / 2 * lineLen;
            }
            lineWidget.setA('x', xp);
        });
        window.onresize = () => { this.display(); };
        this.display();
    }
    processLine(line) {
        const lineWidget = new SVGText();
        line.w = lineWidget;
        this.grp.append(lineWidget);
        line.spans.forEach((span, index) => {
            const spanWidget = new SVGTSpan(lineWidget);
            span.w = spanWidget;
            spanWidget.setV(span.text);
            const color = (span.cb) ? this.bn.color.cb : this.bn.color.std;
            spanWidget.setAA(['font-size', line.fontSize, 'stroke', color]);
            if (index > 0 && span.dx) {
                spanWidget.setA('dx', span.dx);
            }
            if (span.cb) {
                const cb = span.cb;
                spanWidget.elt.addEventListener('click', () => { cb(); });
                spanWidget.elt.addEventListener('mouseover', (e) => {
                    const elt = e.target;
                    elt.setAttribute('stroke', this.bn.color.over);
                });
                spanWidget.elt.addEventListener('mouseout', (e) => {
                    const elt = e.target;
                    elt.setAttribute('stroke', this.bn.color.cb);
                });
            }
        });
        return lineWidget;
    }
    display() {
        const [ww, wh] = [window.innerWidth, window.innerHeight];
        const [dw, dh] = [ww - this.sw - 1, wh - this.sw - 1];
        this.setAA(['width', dw, 'height', dh]);
        this.frame.setAA(['width', dw, 'height', dh]);
        const [bw, bh] = this.bn.buildDimensions;
        const [sx, sy] = [dw / bw, dh / bh];
        const [gw, gh] = [this.rect.getN('width'), this.rect.getN('height')];
        const [mx, my] = [(dw - sx * gw) / 2, (dh - sy * gh) / 2];
        this.grp.gmoveScales(mx, my, sx, sy);
        if (this.bn.connectWidth > 0) {
            this.drawConnections();
        }
    }
    drawConnections() {
        const [fx, fy, fw, fh] = this.frame.getAN(['x', 'y', 'width', 'height']);
        const [rw, rh] = [this.width, this.height];
        const [cw, ch] = this.bn.buildDimensions;
        const [sx, sy] = [fw / cw, fh / ch];
        const [bw, bh] = [sx * rw / 2, sy * rh / 2];
        const fpts = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh, fx, fy + fh], [fx, fy + fh]];
        const [cx, cy] = [fx + fw / 2, fy + fh / 2];
        const bpts = [[cx - bw, cy - bh], [cx + bw, cy - bh], [cx + bw, cy + bh], [cx - bw, cy + bh]];
        for (let i = 0; i < 4; i++) {
            const [x1, y1, x2, y2] = [fpts[i][0], fpts[i][1], bpts[i][0], bpts[i][1]];
            this.connections[i].setAA(['x1', x1, 'y1', y1, 'x2', x2, 'y2', y2]);
        }
    }
}
