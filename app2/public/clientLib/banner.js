import { SVGElt, SVGGrpElt, SVGText, SVGTSpan } from './svgElt.js';
import { Nav } from './navFW.js';
let that;
export class Banner extends SVGElt {
    lines;
    color = {
        border: 'darkblue',
        bg: 'aliceblue',
        fill: 'azure',
        text: 'black',
        date: '#475569',
    };
    fontSize = 50;
    margin = 50;
    space = 15;
    outerBorderWidth = 5;
    innerBorderWidth = 2;
    connectWidth = 2;
    w = 1000;
    h = 750;
    updateDate;
    dateCorner = 'BR';
    group;
    frame;
    rect;
    text;
    dateText;
    bannerElts = [];
    connections = [];
    constructor(lines, fOrOptions, s, w, h, updateDate) {
        super('svg');
        this.lines = lines;
        that = this;
        if (typeof fOrOptions === 'object' && fOrOptions !== null) {
            if (fOrOptions.fontSize)
                this.fontSize = fOrOptions.fontSize;
            if (fOrOptions.space)
                this.space = fOrOptions.space;
            if (fOrOptions.w)
                this.w = fOrOptions.w;
            if (fOrOptions.h)
                this.h = fOrOptions.h;
            if (fOrOptions.updateDate)
                this.updateDate = fOrOptions.updateDate;
            if (fOrOptions.dateCorner)
                this.dateCorner = fOrOptions.dateCorner;
            if (fOrOptions.color) {
                this.color = { ...this.color, ...fOrOptions.color };
            }
        }
        else {
            if (typeof fOrOptions === 'number')
                this.fontSize = fOrOptions;
            if (s !== undefined)
                this.space = s;
            if (w !== undefined)
                this.w = w;
            if (h !== undefined)
                this.h = h;
            if (updateDate)
                this.updateDate = updateDate;
        }
        this.setAA([
            'style', `background-color:${this.color.bg}`,
            'width', this.w,
            'height', this.h,
        ]);
        const pv = this.outerBorderWidth / 2;
        this.frame = new SVGElt('rect');
        this.frame.setAA([
            'x', pv,
            'y', pv,
            'fill', 'none',
            'stroke', this.color.border,
            'stroke-width', this.outerBorderWidth,
        ]);
        this.append(this.frame);
        Nav.fo.append(this);
        this.group = new SVGGrpElt();
        this.append(this.group);
        // Normalize lines to BannerLine objects
        const normalizedLines = this.lines.map((l) => {
            if (typeof l === 'string') {
                return { text: l, fontSize: this.fontSize, color: this.color.text };
            }
            return {
                fontSize: this.fontSize,
                color: this.color.text,
                ...l,
            };
        });
        // Calculate total text block height
        let totalTextHeight = 0;
        normalizedLines.forEach((nl, i) => {
            const fSize = nl.fontSize || this.fontSize;
            const sp = nl.space !== undefined ? nl.space : this.space;
            totalTextHeight += fSize;
            if (i > 0)
                totalTextHeight += sp;
        });
        this.text = new SVGText();
        this.group.append(this.text);
        let currentY = (this.h - totalTextHeight) / 2;
        normalizedLines.forEach((lineObj, i) => {
            const fSize = lineObj.fontSize || this.fontSize;
            const sp = lineObj.space !== undefined ? lineObj.space : this.space;
            if (i > 0)
                currentY += sp;
            const lineWidget = new SVGTSpan(this.text);
            lineWidget.setV(lineObj.text);
            const color = lineObj.color || this.color.text;
            lineWidget.setAA([
                'font-size', fSize,
                'stroke', color,
                'fill', color,
            ]);
            if (lineObj.fontWeight)
                lineWidget.setA('font-weight', lineObj.fontWeight);
            if (lineObj.fontStyle)
                lineWidget.setA('font-style', lineObj.fontStyle);
            if (lineObj.fontFamily)
                lineWidget.setA('font-family', lineObj.fontFamily);
            const textBB = lineWidget.getBB();
            const lx = (this.w - textBB.width) / 2;
            const ly = currentY + fSize * 0.82;
            lineWidget.setAA(['x', lx, 'y', ly]);
            currentY += fSize;
            this.bannerElts.push(lineWidget);
        });
        const tbb = this.text.getBB();
        const rw = tbb.width + 2 * this.margin;
        const rh = tbb.height + 2 * this.margin;
        const rx = (this.w - rw) / 2;
        const ry = (this.h - rh) / 2;
        this.rect = new SVGElt('rect');
        this.rect.setAA([
            'x', rx,
            'y', ry,
            'width', rw,
            'height', rh,
            'fill', this.color.fill,
            'stroke', this.color.border,
            'stroke-width', this.innerBorderWidth,
            'rx', 6,
        ]);
        this.group.elt.insertBefore(this.rect.elt, this.text.elt);
        // Corner Connection lines
        if (this.connectWidth > 0) {
            const pos = [
                [0, 0, rx, ry],
                [this.w, 0, rx + rw, ry],
                [this.w, this.h, rx + rw, ry + rh],
                [0, this.h, rx, ry + rh],
            ];
            for (let i = 0; i < 4; i++) {
                const lw = new SVGElt('line');
                lw.setAA([
                    'x1', pos[i][0],
                    'y1', pos[i][1],
                    'x2', pos[i][2],
                    'y2', pos[i][3],
                    'stroke', this.color.border,
                    'stroke-width', this.connectWidth,
                ]);
                this.group.elt.insertBefore(lw.elt, this.rect.elt);
                this.connections.push(lw);
            }
        }
        // Update Date in corner
        if (this.updateDate) {
            this.dateText = new SVGText();
            let dx = this.w - 25;
            let dy = this.h - 20;
            let anchor = 'end';
            if (this.dateCorner === 'BL') {
                dx = 25;
                dy = this.h - 20;
                anchor = 'start';
            }
            else if (this.dateCorner === 'TL') {
                dx = 25;
                dy = 30;
                anchor = 'start';
            }
            else if (this.dateCorner === 'TR') {
                dx = this.w - 25;
                dy = 30;
                anchor = 'end';
            }
            this.dateText.setAA([
                'x', dx,
                'y', dy,
                'font-size', 14,
                'font-family', 'system-ui, sans-serif',
                'font-style', 'italic',
                'fill', this.color.date || '#64748b',
                'stroke', 'none',
                'text-anchor', anchor,
            ]);
            this.dateText.setV(this.updateDate);
            this.group.append(this.dateText);
        }
    }
    layout() {
        const [fow, foh] = [Nav.foWidth, Nav.foHeight];
        this.frame.setAA([
            'width', fow - this.outerBorderWidth,
            'height', foh - this.outerBorderWidth,
        ]);
        this.setAA(['width', fow, 'height', foh]);
        const [sx, sy] = [fow / this.w, foh / this.h];
        this.group.xscale(sx, sy);
    }
}
