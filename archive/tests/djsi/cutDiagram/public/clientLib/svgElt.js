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
    constructor(id) {
        super('g', id);
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
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
    constructor(cb, text, enabled = true, id) {
        super(id);
        this.color = { std: 'darkblue', over: 'purple', disabled: 'grey' };
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
//# sourceMappingURL=svgElt.js.map