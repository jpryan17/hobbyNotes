import { SVGElt, SVGGrpElt, SVGText, SVGTSpan } from './svgElt.js';
import { Nav } from './navFW.js';
let that;
export class Banner extends SVGElt {
    constructor(lines, f, s, w, h) {
        super('svg');
        this.lines = lines;
        this.color = { border: 'darkblue', bg: 'aliceblue', fill: 'azure', text: 'black' };
        this.fontSize = 30;
        this.margin = 10;
        this.space = 15;
        this.outerBorderWidth = 5;
        this.innerBorderWidth = 2;
        this.connectWidth = 2;
        this.w = 500;
        this.h = 500;
        this.bannerElts = [];
        this.connections = [];
        that = this;
        if (f)
            this.fontSize = f;
        if (s)
            this.space = s;
        if (w)
            this.w = w;
        if (h)
            this.h = h;
        //const [fow,foh] = [Nav.foWidth,Nav.foHeight]
        this.setAA(['style', `background-color:${this.color.fill}`, 'width', this.w, 'height', this.h]);
        let pv = this.outerBorderWidth / 2;
        const width = this.w - this.outerBorderWidth;
        const height = this.h - this.outerBorderWidth;
        this.frame = new SVGElt('rect');
        this.frame.setAA(['x', pv, 'y', pv, 'fill', 'none',
            'stroke', this.color.border, 'stroke-width', this.outerBorderWidth]);
        this.append(this.frame);
        Nav.fo.append(this);
        this.group = new SVGGrpElt();
        this.append(this.group);
        this.append(this.frame);
        this.text = new SVGText();
        this.group.append(this.text);
        this.text = new SVGText();
        this.group.append(this.text);
        const tw = this.fontSize * lines.length;
        let ly = 1 / 2 * this.h - 1 / 2 * tw + 2 / 3 * this.fontSize;
        this.lines.forEach((line, i) => {
            const lineWidget = new SVGTSpan(this.text);
            lineWidget.setV(line);
            const color = this.color.text;
            lineWidget.setAA(['font-size', this.fontSize, 'stroke', color]);
            const lx = 1 / 2 * this.w - 1 / 2 * lineWidget.getBB().width;
            ly += i * (this.fontSize + this.space);
            lineWidget.setAA(['x', lx, 'y', ly]);
        });
        const tbb = this.text.getBB();
        const rw = tbb.width + 2 * this.margin;
        const rh = tbb.height + 2 * this.margin;
        const rx = 1 / 2 * this.w - 1 / 2 * rw;
        const ry = 1 / 2 * this.h - 1 / 2 * rh;
        this.rect = new SVGElt('rect');
        this.rect.setAA(['x', rx, 'y', ry, 'width', rw, 'height', rh, 'fill', this.color.fill,
            'stroke', this.color.border, 'stroke-width', this.innerBorderWidth]);
        this.group.append(this.rect);
        this.group.append(this.text);
        if (this.connectWidth > 0) {
            const pos = [[0, 0, rx, ry], [this.w, 0, rx + rw, ry], [this.w, this.h, rx + rw, ry + rh], [0, this.h, rx, ry + rh]];
            for (let i = 0; i < 4; i++) {
                const lw = new SVGElt('line');
                lw.setAA(['x1', pos[i][0], 'y1', pos[i][1], 'x2', pos[i][2], 'y2', pos[i][3],
                    'stroke', this.color.border, 'stroke-width', this.connectWidth]);
                this.group.append(lw);
            }
        }
    }
    layout() {
        const [fow, foh] = [Nav.foWidth, Nav.foHeight];
        this.frame.setAA(['width', fow - this.outerBorderWidth, 'height', foh - this.outerBorderWidth]);
        this.setAA(['width', fow, 'height', foh]);
        const [sx, sy] = [fow / this.w, foh / this.h];
        const s = Math.max(sx, sy);
        this.group.xscale(sx, sy);
    }
}
//# sourceMappingURL=banner.js.map