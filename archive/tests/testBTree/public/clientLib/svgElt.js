import { Elt } from './elt.js';
export class SVGElt extends Elt {
    constructor(qname, id) {
        super(qname, id, 'S');
    }
    getBB() {
        const ge = this.elt;
        return ge.getBBox();
    }
    move(x, y) {
        this.setAA(['x', 0, 'y', 0, 'transform', `translate(${x},${y})`]);
    }
    scale(s, sy) {
        console.log(`scale by x ${s} y ${sy}`);
        if (sy) {
            this.setA('transform', `scale(${s} ${sy})`);
        }
        else {
            this.setA('transform', `scale(${s})`);
        }
    }
    scaleMove(sx, sy, x, y) {
        this.setAA(['x', 0, 'y', 0]);
        this.setA('transform', ` scale(${sx} ${sy}) translate(${x},${y})`);
    }
}
export class SVGGrpElt extends SVGElt {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    constructor(id) {
        super('g', id);
        this.setAA(['x', this.x, 'y', this.y]); //
    }
    gmove(x, y) {
        this.setAA(['x', 0, 'y', 0]);
        this.setA('transform', `translate(${x},${y})`);
    }
    xscale(s, sy) {
        if (sy) {
            this.setA('transform', `scale(${s} ${sy})`);
        }
        else {
            this.setA('transform', `scale(${s})`);
        }
    }
    gmoveScale(x, y, s) {
        this.setAA(['x', 0, 'y', 0]);
        this.setA('transform', `scale(${s}) translate(${x},${y})`);
    }
    gmoveScales(x, y, sx, sy) {
        this.setA('transform', ` translate(${x},${y}) scale(${sx} ${sy}) `);
    }
}
export class SVGTextElt extends SVGElt {
    constructor(qparms, id) {
        super(qparms, id);
    }
    static clearText(elt) {
        let ec = Array.from(elt.children);
        if (ec.length == 0)
            elt.innerHTML = '';
        else {
            for (let c of ec) {
                let cc = Array.from(c.children);
                if (cc.length == 0) {
                    c.innerHTML = '';
                }
                else {
                    let ccc = c;
                    SVGTextElt.clearText(ccc);
                }
            }
        }
    }
    clear() {
        let textElt = this.elt;
        SVGTextElt.clearText(textElt);
    }
    getEstimatedMaxWidth(maxTextLen) {
        const clone = this.elt.cloneNode(true);
        const slot = document.getElementById('scratch-slot');
        slot.innerHTML = '';
        const svg = new SVGElt('svg');
        slot.appendChild(svg.elt);
        svg.elt.appendChild(clone);
        clone.innerHTML = "ABC to XYZ";
        const bb = clone.getBBox();
        slot.innerHTML = '';
        return bb.width / 10 * maxTextLen;
    }
    getTextWidthHeight() {
        //const clone = this.elt.cloneNode(true) as SVGGraphicsElement
        const clone = this.elt;
        const slot = document.getElementById('scratch-slot');
        slot.innerHTML = '';
        const svg = new SVGElt('svg');
        svg.setAA(['x', 1, 'y', 1, 'width', 1000, 'height', 1000]);
        slot.appendChild(svg.elt);
        svg.elt.appendChild(clone);
        const bb = clone.getBBox();
        slot.innerHTML = '';
        return [bb.width, bb.height];
    }
    getTextWidth() {
        return this.getTextWidthHeight()[0];
    }
    getTextWH() {
        const slot = document.getElementById('scratch-slot');
        slot.innerHTML = '';
        const svg = new SVGElt('svg');
        svg.setAA(['x', 1, 'y', 1, 'width', 1000, 'height', 1000]);
        slot.appendChild(svg.elt);
        svg.append(this);
        const ge = this.elt;
        const bb = ge.getBBox();
        slot.innerHTML = '';
        return [bb.width, bb.height];
    }
}
export class SVGText extends SVGTextElt {
    constructor(id, x, y) {
        super('text', id);
        if (x)
            this.setA('x', `${x}`);
        if (y)
            this.setA('y', `${y}`);
    }
}
export class SVGTSpan extends SVGTextElt {
    parent;
    constructor(parent, x, y, id) {
        super('tspan', id);
        this.parent = parent;
        parent.elt.appendChild(this.elt);
        if (x)
            this.setA('x', `${x}`);
        if (y)
            this.setA('y', `${y}`);
    }
}
export class SVGSelectableText extends SVGText {
    color = { std: 'darkblue', over: 'purple', disabled: 'grey', selected: 'darkred' };
    constructor(cb, text, enabled = true, id, color) {
        super(id);
        if (color)
            this.color = color;
        this.setAble(enabled);
        this.setV(text);
        this.elt.addEventListener('click', () => {
            this.setA('stroke', this.color.std);
            cb(this);
        });
        this.elt.addEventListener('mouseover', () => { this.setA('stroke', this.color.over); });
        this.elt.addEventListener('mouseout', () => {
            const enabled = this.getA('pointer-events');
            if (enabled == 'all')
                this.setA('stroke', this.color.std);
        });
    }
    setAble(enabled) {
        if (enabled) {
            this.setAA(['pointer-events', 'all', 'stroke', this.color.std]);
        }
        else {
            this.setAA(['pointer-events', 'none', 'stroke', this.color.disabled]);
        }
    }
}
export class SVGDiagram extends SVGElt {
    group;
    constructor(group) {
        super('svg');
        this.group = group;
        this.elt.appendChild(group.elt);
    }
}
//
export function textWidth(text, fontSize) {
    const slot = document.getElementById('scratch-slot');
    slot.innerHTML = '';
    const svg = new SVGElt('svg');
    svg.setAA(['x', 1, 'y', 1, 'width', 1000, 'height', 100]);
    slot.appendChild(svg.elt);
    const txt = new SVGText();
    txt.setAA(['x', 10, 'y', 30, 'font-size', fontSize]);
    txt.setV(text);
    svg.elt.appendChild(txt.elt);
    const w = txt.getBB().width;
    slot.innerHTML = '';
    return w;
}
export class SelectableTextList extends SVGElt {
    cb;
    maxDisplayLines = 3;
    maxLineCharCnt = 50;
    fontSize = 16;
    disabledColor = 'grey';
    bgColor = 'beige';
    baseColor = 'black';
    overColor = 'purple';
    frameColor = 'darkblue';
    frameWidth = 1;
    id = '';
    //
    margin = 5;
    arrowRectWidth = 25;
    avgWidth;
    //
    list = [];
    box;
    frame;
    arrowRect;
    arrowLine;
    upArrow;
    dnArrow;
    vp;
    choicePos;
    //
    constructor(cb, stl) {
        super('svg');
        this.cb = cb;
        if (stl) {
            if (stl.maxDisplayLines)
                this.maxDisplayLines = stl.maxDisplayLines;
            if (stl.maxLineCharCnt)
                this.maxLineCharCnt = stl.maxLineCharCnt;
            if (stl.fontSize)
                this.fontSize = stl.fontSize;
            if (stl.bgColor)
                this.bgColor = stl.bgColor;
            if (stl.baseColor)
                this.baseColor = stl.baseColor;
            if (stl.overColor)
                this.overColor = stl.overColor;
            if (stl.frameColor)
                this.frameColor = stl.frameColor;
            if (stl.frameWidth)
                this.frameWidth = stl.frameWidth;
            if (stl.id)
                this.id = stl.id;
        }
        this.avgWidth = textWidth('ab=d785kLDW<', this.fontSize) / 12;
        this.setListBox();
    }
    setListBox() {
        this.box = new SVGElt('svg');
        this.append(this.box);
        this.frame = new SVGElt('rect');
        this.append(this.frame);
        this.arrowRect = new SVGElt('svg');
        this.append(this.arrowRect);
        this.arrowLine = new SVGElt('line');
        this.arrowRect.append(this.arrowLine);
        const boxWidth = 2 * this.margin + this.maxLineCharCnt * this.avgWidth;
        const w = boxWidth + this.arrowRectWidth;
        const h = 2 * this.margin + this.maxDisplayLines * this.fontSize;
        this.setAA(['width', w, 'height', h, 'style', `background-color:${this.bgColor}`]);
        this.frame.setAA(['x', 1, 'y', 1, 'width', w - 2, 'height', h - 2, 'stroke', this.frameColor, 'fill', 'none']);
        this.box.setAA(['x', 3, 'y', 3, 'width', boxWidth, 'height', h - 3]);
        const x = w - 2 - this.arrowRectWidth;
        this.arrowRect.setAA(['x', x, 'y', 2, 'width', this.arrowRectWidth, 'height', h - 3, 'fill', 'none',
            'stroke', 'black', 'stroke-width', 1, 'visibility', 'hidden']);
        this.arrowLine.setAA(['x1', 0, 'y1', 0, 'x2', 1, 'y2', 1 + h, 'stroke', 'black', 'stroke-width', 1]);
        this.upArrow = new SVGText();
        this.arrowRect.append(this.upArrow);
        this.upArrow.setV('\u2B9D');
        this.upArrow.setAA(['x', 6, 'y', this.fontSize, 'stroke-width', 2, 'pointer-events', 'none']);
        this.upArrow.elt.addEventListener('mouseover', () => {
            this.upArrow.setA('stroke', 'purple');
        });
        this.upArrow.elt.addEventListener('mouseout', () => {
            const color = (this.vp == 0) ? 'grey' : 'blue';
            this.upArrow.setA('stroke', color);
        });
        this.upArrow.elt.addEventListener('click', (ev) => {
            this.arrowClick('up');
        });
        this.dnArrow = new SVGText();
        this.arrowRect.append(this.dnArrow);
        this.dnArrow.setV('\u2B9F');
        this.dnArrow.setAA(['x', 6, 'y', h - 2 / 3 * this.fontSize, 'stroke-width', 2, 'pointer-events', 'none']);
        this.dnArrow.elt.addEventListener('mouseover', () => {
            this.dnArrow.setA('stroke', 'purple');
        });
        this.dnArrow.elt.addEventListener('mouseout', () => {
            const color = (this.vp + this.maxDisplayLines < this.list.length) ? 'blue' : 'grey';
            this.dnArrow.setA('stroke', color);
        });
        this.dnArrow.elt.addEventListener('click', (ev) => {
            this.arrowClick('dn');
        });
        this.setList();
    }
    setList(inList) {
        if (inList)
            this.list = inList;
        this.vp = 0;
        if (this.list.length > this.maxDisplayLines) {
            this.arrowRect.setA('visibility', 'visible');
            this.upArrow.setAA(['stroke', 'grey']);
            this.dnArrow.setAA(['stroke', 'blue', 'pointer-events', 'auto']);
        }
        else {
            this.arrowRect.setA('visibility', 'hidden');
            this.upArrow.setA('pointer-events', 'none');
            this.dnArrow.setA('pointer-events', 'none');
        }
        this.list.forEach((e, p) => {
            const x = 2 * this.margin + this.maxLineCharCnt * this.avgWidth + 4;
            const y = this.margin + 3 / 4 * this.fontSize + p * this.fontSize;
            e.setAA(['x', 10, 'y', y, 'font-size', this.fontSize]);
            e.elt.addEventListener('mouseover', () => {
                e.setA('stroke', this.overColor);
            });
            e.elt.addEventListener('mouseout', () => {
                e.setA('stroke', this.baseColor);
            });
            e.elt.addEventListener('click', (ev) => {
                const target = ev.target;
                const line = Elt.wrapper(target);
                this.choicePos = p;
                this.cb(this, this.choicePos);
            });
        });
        this.box.removeChildren();
        const maxp = Math.min(this.maxDisplayLines, this.list.length);
        for (let i = 0; i < maxp; i++) {
            this.box.append(this.list[i]);
        }
    }
    arrowClick(dir) {
        this.vp += (dir == 'up') ? -1 : 1;
        this.box.removeChildren();
        let maxp = this.vp + Math.min(this.maxDisplayLines, this.list.length);
        for (let i = this.vp; i < maxp; i++) {
            const y = this.margin + 3 / 4 * this.fontSize + (i - this.vp) * this.fontSize;
            this.list[i].setAA(['x', 10, 'y', y]);
            this.box.append(this.list[i]);
        }
        if (this.vp > 0) {
            this.upArrow.setAA(['stroke', 'blue', 'pointer-events', 'auto']);
        }
        else {
            this.upArrow.setAA(['stroke', 'grey', 'pointer-events', 'none']);
        }
        if (this.vp + this.maxDisplayLines < this.list.length) {
            this.dnArrow.setAA(['stroke', 'blue', 'pointer-events', 'auto']);
        }
        else {
            this.dnArrow.setAA(['stroke', 'grey', 'pointer-events', 'none']);
        }
    }
}
