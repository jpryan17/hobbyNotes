import { SVGElt, SVGText } from '../clientLib/svgElt.js';
export class Diagram extends SVGElt {
    constructor(divId, w, h, parms) {
        super('svg', divId);
        this.bgColor = 'aliceblue';
        this.borderColor = 'rosybrown';
        this.labelDiagram = true;
        this.xp = 10;
        this.yp = 20;
        this.parent = document.getElementById(divId);
        this.w = w;
        this.h = h;
        this.setAA(['width', this.w, 'height', this.h,
            'style', `background-color:${this.bgColor}`]);
        this.processParameters(parms);
        this.setBorder();
        if (this.labelDiagram)
            this.setText(this.xp, this.yp, divId, 'black');
        this.parent.appendChild(this.elt);
    }
    processParameters(parms) {
        if (parms == undefined)
            return;
        if (parms.bgColor != undefined)
            this.bgColor = parms.bgColor;
        if (parms.labelDiagram != undefined)
            this.labelDiagram = parms.labelDiagram;
        if (parms.xp != undefined)
            this.xp = parms.xp;
        if (parms.yp != undefined)
            this.yp = parms.yp;
    }
    setBorder() {
        const border = new SVGElt('rect');
        border.setAA(['x', 2, 'y', 2, 'width', this.w - 4, 'height', this.h - 4,
            'fill', 'none', 'stroke-width', 3, 'stroke', this.borderColor]);
        this.append(border);
    }
    setLine(x1, y1, x2, y2, c, id) {
        const ln = new SVGElt('line');
        ln.setAA(['x1', x1, 'y1', y1, 'x2', x2, 'y2', y2, 'stroke', c]);
        if (id != undefined)
            ln.setA('id', id);
        this.append(ln);
        return ln;
    }
    setNodeCircle(cx, cy, radius, fill, id) {
        const cc = new SVGElt('circle');
        cc.setAA(['cx', cx, 'cy', cy, 'r', radius, 'fill', fill, 'class', 'node']);
        if (id != undefined)
            cc.setA('id', id);
        this.append(cc);
        return cc;
    }
    setText(x, y, label, color) {
        const nodeLabel = new SVGText();
        nodeLabel.setAA(['x', x, 'y', y, 'stroke', color]);
        nodeLabel.setV(label);
        this.append(nodeLabel);
        return nodeLabel;
    }
}
//# sourceMappingURL=diagram.js.map