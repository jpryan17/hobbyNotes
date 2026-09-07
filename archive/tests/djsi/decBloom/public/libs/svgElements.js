import { Elt, handleOverrides } from './genUtils.js';
export class SVGElt extends Elt {
    constructor(qname, id, elt) {
        super({ nsi: 'S', qname: qname, elt: elt, id: id });
    }
    eltWH() {
        if (!SVGElt.scratchArea)
            SVGElt.scratchArea = new Diagram({ w: 1200, h: 1200, id: 'scratch',
                divId: 'svg-scratch-slot' });
        SVGElt.scratchArea.setAA(['visibility', 'hidden', 'display', 'block']);
        this.setA('x', '10');
        this.setA('y', '20');
        SVGElt.scratchArea.elt.appendChild(this.elt);
        const ge = this.elt;
        let bb = ge.getBBox();
        SVGElt.scratchArea.elt.removeChild(this.elt);
        SVGElt.scratchArea.setAA(['visibility', 'hidden', 'display', 'none']);
        return [bb.width, bb.height];
    }
}
export class SVGDiagram extends SVGElt {
    constructor(group) {
        super('svg');
        this.group = group;
        this.elt.appendChild(group.elt);
    }
}
export class SVGGrpElt extends SVGElt {
    constructor(id) {
        super('g', id);
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.setAA(['x', this.x, 'y', this.y]);
    }
    gmove(x, y) {
        this.setAA(['x', 0, 'y', 0]);
        this.setA('transform', `translate(${x},${y})`);
    }
    scale(w, h, s) {
        //console.log(`w ${w} h ${h} s ${s}`)
        this.setAA(['width', w, 'height', h]);
        this.setA('transform', `scale(${s})`);
    }
    gmoveScale(x, y, s) {
        this.setAA(['x', 0, 'y', 0]);
        this.setA('transform', `scale(${s}) translate(${x},${y})`);
    }
}
class SVGTextElt extends SVGElt {
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
    constructor(cb, text, id, overrides) {
        super(id);
        this.color = { std: 'black', over: 'purple' };
        handleOverrides(this, overrides);
        this.cc = this.color.std;
        this.setV(text);
        this.elt.addEventListener('click', () => {
            this.setA('stroke', this.color.std);
            cb(this);
        });
        this.elt.addEventListener('mouseover', () => { this.setA('stroke', this.color.over); });
        this.elt.addEventListener('mouseout', () => { this.setA('stroke', this.color.std); });
    }
}
export class SVGTextRBSet {
    constructor(cb, texts, overrides) {
        this.cb = cb;
        this.color = { std: 'cornflowerblue', over: 'purple', chosen: 'darkblue' };
        this.buttons = [];
        handleOverrides(this, overrides);
        let i = 0;
        texts.forEach(txt => {
            const b = new SVGText();
            b.setV(txt);
            b.setAA(['id', `${i++}`, 'stroke', this.color.std]);
            b.elt.addEventListener('click', () => { this.rbcb(b); });
            b.elt.addEventListener('mouseover', () => {
                b.setA('stroke', this.color.over);
            });
            b.elt.addEventListener('mouseout', () => {
                const be = this.buttons.find(e => e[0] == b);
                const bc = (be && be[1]) ? this.color.chosen : this.color.std;
                b.setA('stroke', bc);
            });
            this.buttons.push([b, false]);
        });
    }
    rbcb(which) {
        this.buttons.forEach(b => {
            if (b[0] != which) {
                b[1] = false;
                b[0].setA('stroke', this.color.std);
            }
            else {
                b[1] = true;
                b[0].setA('stroke', this.color.chosen);
                this.cb(b[0]);
            }
        });
    }
}
export class SVGTextButton extends SVGGrpElt {
    constructor(shape, id, text, clickFN, maxText, overrides) {
        super(id);
        this.clickFN = clickFN;
        this.size = { font: 20, edge: 2, squishBy: 12 };
        this.color = { text: 'black', fill: 'lightblue',
            edge: 'darkblue', edgeOver: 'purple' };
        this.margin = { horz: 10, vert: 10, diag: 10 };
        handleOverrides(this, overrides);
        this.shapeW = new SVGElt(shape, id.concat('-shape'));
        const rv = this.addText(text, id);
        this.textW = rv[0];
        this.textWidth = (maxText) ? this.maxWidth(maxText) : rv[1];
        this.center = rv[2];
        const [sw, sh] = this.shapeW.eltWH();
        this.width = sw;
        this.height = sh;
        this.shapeW.elt.addEventListener('mouseover', () => {
            this.shapeW.setA('stroke', this.color.edgeOver);
        });
        this.shapeW.elt.addEventListener('mouseout', () => {
            this.shapeW.setA('stroke', this.color.edge);
        });
        this.shapeW.elt.addEventListener('click', () => {
            clickFN(this);
        });
    }
    maxWidth(text) {
        const tw = new SVGText();
        tw.setAA(['font-size', this.size.font, 'stroke', this.color.text,
            'pointer-events', 'none']);
        tw.setV(text);
        const [w, _] = tw.eltWH();
        return w;
    }
    addText(text, id) {
        const textW = new SVGText(id.concat('-text'));
        textW.setAA(['font-size', this.size.font, 'stroke', this.color.text,
            'pointer-events', 'none']);
        textW.setV(text);
        const [w, _] = textW.eltWH();
        const [tx, ty] = (this instanceof SVGRectTextButton) ?
            [this.margin.horz + this.size.edge,
                .73 * this.size.font + this.margin.vert] :
            [-1 / 2 * w, .35 * this.size.font];
        const center = [tx + 1 / 2 * w, ty + 1 / 2 * this.size.font];
        textW.setAA(['x', tx, 'y', ty]);
        return [textW, w, center];
    }
    changeText(to) {
        const id = this.textW.getA('id');
        this.elt.removeChild(this.textW.elt);
        const rv = this.addText(to, id);
        this.textW = rv[0];
        this.elt.appendChild(this.textW.elt);
    }
}
export class SVGRectTextButton extends SVGTextButton {
    constructor(id, text, clickFN, maxText, overrides) {
        super('rect', id, text, clickFN, maxText, overrides);
        //
        const rw = this.textWidth + 2 * (this.margin.horz + this.size.edge);
        const rh = this.size.font + 2 * this.margin.vert + this.size.edge;
        this.shapeW.setAA(['x', 0, 'y', 0, 'width', rw, 'height', rh, 'fill', this.color.fill,
            'stroke', this.color.edge, 'stroke-width', this.size.edge]);
        this.width = rw;
        this.height = rh;
        this.elt.appendChild(this.shapeW.elt);
        this.elt.appendChild(this.textW.elt);
    }
}
export class SVGCircTextButton extends SVGTextButton {
    constructor(id, text, clickFN, maxText, overrides) {
        super('ellipse', id, text, clickFN, maxText, overrides);
        //
        const rx = 1 / 2 * this.textWidth + this.margin.diag + this.size.edge;
        const ry = rx - this.size.squishBy;
        this.shapeW.setAA(['cx', 0, 'cy', 0, 'rx', rx, 'ry', ry, 'fill', this.color.fill,
            'stroke', this.color.edge, 'stroke-width', this.size.edge]);
        const [ww, wh] = this.shapeW.eltWH();
        this.width = ww;
        this.height = wh;
        this.elt.appendChild(this.shapeW.elt);
        this.elt.appendChild(this.textW.elt);
    }
}
export class SVGBoxedText extends SVGGrpElt {
    constructor(id, text, overrides) {
        super(id);
        this.size = { font: 20, edge: 2 };
        this.color = { text: 'black', fill: 'lightblue',
            edge: 'darkblue' };
        this.margin = { horz: 10, vert: 10 };
        this.textW = new SVGText;
        this.textWidth = 0;
        handleOverrides(this, overrides);
        this.shape = new SVGElt('rect', id.concat('-shape'));
        this.center = this.addText(text, id.concat('-text'));
        const rw = this.textWidth + 2 * (this.margin.horz + this.size.edge);
        const rh = this.size.font + 2 * this.margin.vert + this.size.edge;
        this.shape.setAA(['x', 0, 'y', 0, 'width', rw, 'height', rh, 'fill', this.color.fill,
            'stroke', this.color.edge, 'stroke-width', this.size.edge]);
        this.width = rw;
        this.height = rh;
        this.elt.appendChild(this.shape.elt);
        this.elt.appendChild(this.textW.elt);
    }
    addText(text, id) {
        const [textw, w] = this.setTextAndWidth(text, id);
        this.textW = textw;
        this.textWidth = w;
        const [tx, ty] = this.setTextXY();
        const center = [tx + 1 / 2 * w, ty + 1 / 2 * this.size.font];
        this.textW.setAA(['x', tx, 'y', ty]);
        return center;
    }
    changeText(to) {
        const id = this.textW.getA('id');
        this.elt.removeChild(this.textW.elt);
        const [textW, w] = this.setTextAndWidth(to, id);
        this.textW = textW;
        this.textWidth = w;
        const tx = this.center[0] - 1 / 2 * w;
        const ty = .73 * this.size.font + this.margin.vert;
        this.textW.setAA(['x', tx, 'y', ty]);
        this.elt.appendChild(this.textW.elt);
    }
    setTextAndWidth(text, id) {
        const textW = new SVGText(id);
        textW.setAA(['font-size', this.size.font, 'stroke', this.color.text,
            'pointer-events', 'none']);
        textW.setV(text);
        const [w, _] = textW.eltWH();
        return [textW, w];
    }
    setTextXY() {
        const tx = this.margin.horz + this.size.edge;
        const ty = .73 * this.size.font + this.margin.vert;
        return [tx, ty];
    }
}
//
export class SVGSelectionList extends SVGGrpElt {
    constructor(id, title, x, y, isRadioSet, choices, overrides) {
        super(id);
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = { titleFont: 20, choiceFont: 25, buttonHeight: 12, buttonXRadius: 8,
            buttonBorderWidth: 3, boxBorderWidth: 1, button: 12 };
        this.color = { title: 'blue', choice: 'black', border: 'black',
            button: 'lightgreen', buttonEdge: 'lightblue',
            buttonOver: 'purple', buttonSelected: 'purple',
            widget: 'none', box: 'none' };
        this.margin = { titleLeft: 20, titleTop: 20,
            boxLeft: 10, boxRight: 10, boxTitle: 10, boxBottom: 10,
            boxButton: 10, buttonChoice: 20, choiceChoice: 8,
            choicesBoxTop: 20, choicesBoxBottom: 20, choicesBoxRight: 20 };
        this.conditional = { selectionsBorder: true };
        this.state = [];
        this.rect = new SVGElt('rect', id.concat('-rect'));
        handleOverrides(this, overrides);
        const widgetTitle = this.setTitle(title);
        const [bx, by, maxW] = this.processChoices(choices, isRadioSet);
        const boxRect = this.processSelectionBox(bx, by, maxW);
        this.setWidget(widgetTitle, boxRect, maxW);
    }
    setTitle(title) {
        const titleText = new SVGTextElt('text');
        titleText.setAA(['font-size', this.size.titleFont,
            'stroke', this.color.title,
            'x', this.x + this.margin.titleLeft,
            'y', this.y + this.margin.titleTop + .75 * this.size.titleFont,
            'pointer-events', 'none']);
        titleText.setV(title);
        return titleText;
    }
    processChoices(choices, isRadioSet) {
        const bx = this.x + this.margin.boxLeft;
        const by = this.y + this.margin.titleTop + this.size.titleFont + this.margin.boxTitle;
        let cbx = bx + this.margin.boxLeft;
        if (isRadioSet)
            cbx += this.size.buttonXRadius;
        this.size.button = (isRadioSet) ? this.size.buttonXRadius * 2 : 1.5 * this.size.buttonHeight;
        const ctx = cbx + this.size.button + this.margin.buttonChoice;
        let cby = by + this.margin.choicesBoxTop + 1 / 2 * this.size.choiceFont;
        if (!isRadioSet)
            cby -= 1 / 2 * this.size.buttonHeight;
        let cty = by + this.margin.choicesBoxTop + 3 / 4 * this.size.choiceFont;
        let pos = 1;
        let maxW = 0;
        choices.forEach(choice => {
            const textId = `${this.id}-choice-${pos})`;
            const text = new SVGTextElt('text', textId);
            text.setV(choice);
            text.setA('font-size', this.size.choiceFont.toString());
            const [w, _] = text.eltWH();
            text.setA('x', ctx.toString());
            text.setA('y', cty.toString());
            text.setA('stroke', this.color.choice);
            text.setA('pointer-event', 'none');
            if (w > maxW)
                maxW = w;
            const buttonId = `${this.id}-button-${pos++}`;
            const shape = (isRadioSet) ? 'ellipse' : 'rect';
            const button = new SVGTextElt(shape, buttonId);
            button.setA('fill', this.color.button);
            button.setA('stroke', this.color.buttonEdge);
            button.setA('stroke-width', this.size.buttonBorderWidth.toString());
            this.setListeners(button);
            if (isRadioSet) {
                button.setA('cx', cbx.toString());
                button.setA('cy', cby.toString());
                button.setA('rx', this.size.buttonXRadius.toString());
                button.setA('ry', (this.size.buttonXRadius - 2).toString());
            }
            else {
                button.setA('x', cbx.toString());
                button.setA('y', cby.toString());
                button.setA('width', this.size.button.toString());
                button.setA('height', this.size.buttonHeight.toString());
            }
            cby += this.size.choiceFont + this.margin.choiceChoice;
            cty += this.size.choiceFont + this.margin.choiceChoice;
            this.state.push({ text: text, button: button, selected: false });
        });
        return [bx, by, maxW];
    }
    setListeners(button) {
        button.elt.addEventListener('mouseover', () => {
            button.setA('stroke', this.color.buttonOver);
        });
        button.elt.addEventListener('mouseout', () => {
            button.setA('stroke', this.color.buttonEdge);
        });
        button.elt.addEventListener('click', () => {
            this.clickFN(button);
        });
    }
    clickFN(_) { }
    setButtonSelected(button) {
        const sb = this.state.find(s => s.button == button);
        if (sb)
            sb.selected = true;
    }
    resetButton(button) {
        button.setA('fill', this.color.button);
        button.setA('stroke', this.color.buttonEdge);
        const sb = this.state.find(s => s.button == button);
        if (sb)
            sb.selected == false;
    }
    processSelectionBox(bx, by, maxW) {
        if (this.conditional.selectionsBorder) {
            const boxRect = new SVGElt('rect', this.id.concat('-box'));
            const bw = this.margin.boxButton + this.size.button + this.margin.buttonChoice +
                maxW + this.margin.choicesBoxRight;
            const bh = this.margin.choicesBoxTop + this.margin.choicesBoxBottom +
                (this.state.length - 1) * this.margin.choiceChoice +
                this.state.length * this.size.choiceFont;
            boxRect.setA('x', bx.toString());
            boxRect.setA('y', by.toString());
            boxRect.setA('width', bw.toString());
            boxRect.setA('height', bh.toString());
            boxRect.setA('fill', this.color.box);
            boxRect.setA('stroke', this.color.border);
            boxRect.setA('stroke-width', this.size.boxBorderWidth.toString());
            boxRect.setA('pointer-events', 'none');
            return boxRect;
        }
    }
    setWidget(title, box, maxW) {
        const widgetWidth = this.margin.boxLeft + this.margin.boxButton + this.size.button +
            this.margin.buttonChoice + maxW + this.margin.choicesBoxRight +
            this.margin.boxRight;
        const widgetHeight = this.margin.titleTop + this.size.titleFont + this.margin.boxTitle +
            this.margin.choicesBoxTop + this.margin.choicesBoxBottom +
            (this.state.length - 1) * this.margin.choiceChoice +
            this.state.length * this.size.choiceFont +
            this.margin.boxBottom;
        this.rect.setAA(['x', this.x, 'y', this.y, 'width', widgetWidth, 'height', widgetHeight,
            'fill', this.color.widget, 'pointer-events', 'none']);
        this.elt.appendChild(this.rect.elt);
        this.elt.appendChild(title.elt);
        this.elt.appendChild(box.elt);
        this.state.forEach(e => {
            this.elt.appendChild(e.button.elt);
            this.elt.appendChild(e.text.elt);
        });
    }
}
export class SVGRadioButtonSet extends SVGSelectionList {
    constructor(id, title, x, y, userCB, choices, overrides) {
        super(id, title, x, y, true, choices, overrides);
        this.userCB = userCB;
    }
    clickFN(button) {
        const buttonStateInfo = this.state.find(e => e.button == button);
        if (buttonStateInfo && !buttonStateInfo.selected) {
            this.state.forEach(s => {
                if (s.selected) {
                    this.resetButton(s.button);
                    s.button.setA('stroke-width', this.size.buttonBorderWidth.toString());
                    s.selected = false;
                }
            });
            this.setButtonSelected(button);
            button.setA('fill', this.color.buttonSelected);
            button.setA('stroke-width', '0');
            this.userCB(this);
        }
    }
}
export class SVGMultSelectionsList extends SVGSelectionList {
    constructor(id, title, x, y, userCB, choices, overrides) {
        super(id, title, x, y, false, choices, overrides);
        this.userCB = userCB;
    }
    clickFN(button) {
        const sb = this.state.find(e => e.button == button);
        if (sb) {
            if (sb.selected) {
                this.resetButton(button);
                sb.selected = false;
            }
            else {
                sb.selected = true;
                button.setA('fill', this.color.buttonSelected);
            }
            this.userCB();
        }
    }
}
export class Diagram extends SVGElt {
    constructor(dp, overrides) {
        const id = (dp) ? dp.id : undefined;
        super('svg', id);
        this.size = { labelFont: 15 };
        this.color = { bg: 'aliceblue', border: 'rosyBrown', label: 'black' };
        this.hasBorder = false;
        this.label = undefined;
        this.xp = 10;
        this.yp = 20;
        handleOverrides(this, overrides);
        this.setA('style', `background-color:${this.color.bg}`);
        if (dp && dp.w && dp.h)
            this.setWH(dp.w, dp.h);
        if (this.label) {
            const labelW = new SVGText();
            labelW.setAA(['x', this.xp, 'y', this.yp, 'font-size', this.size.labelFont,
                'stroke', this.color.label]);
            this.elt.appendChild(labelW.elt);
        }
        if (dp && dp.divId) {
            const slot = document.getElementById(dp.divId);
            slot.append(this.elt);
        }
    }
    setWH(w, h) {
        this.setAA(['width', w, 'height', h,]);
        if (this.hasBorder) {
            const ge = this.elt;
            const r = ge.getBBox();
            const rect = new SVGElt('rect');
            this.elt.appendChild(rect.elt);
            rect.setAA(['x', 2, 'y', 2, 'width', r.width + 2, 'height', r.height + 2,
                'fill', 'none', 'stroke', this.color.border, 'stroke-width', 3]);
        }
    }
    setLine(x1, y1, x2, y2, c, id) {
        const ln = new SVGElt('line', id);
        ln.setAA(['x1', x1, 'y1', y1, 'x2', x2, 'y2', y2, 'stroke', c]);
        this.elt.appendChild(ln.elt);
        return ln;
    }
    setCircle(cx, cy, radius, fill, id) {
        const cc = new SVGElt('circle', id);
        cc.setAA(['cx', cx, 'cy', cy, 'r', radius, 'fill', fill, 'class', 'node']);
        this.elt.appendChild(cc.elt);
        return cc;
    }
    setText(x, y, label, color) {
        const text = new SVGElt('text');
        text.setAA(['x', x, 'y', y, 'stroke', color]);
        text.setV(label);
        this.elt.appendChild(text.elt);
        return text;
    }
}
export class DiagramGroup extends SVGGrpElt {
    constructor() {
        super();
    }
}
//# sourceMappingURL=svgElements.js.map