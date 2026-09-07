import { Elt, handleOverrides } from './genUtils.js';
import { SVGElt, SVGText, SVGDiagram } from './svgElements.js';
export class Nav {
    constructor(overrides) {
        handleOverrides(this, overrides);
        //
        Nav.frame = new SVGElt('svg');
        Nav.top = new SVGElt('rect');
        Nav.line = new SVGElt('g');
        Nav.button = new SVGText();
        Nav.index = new SVGElt('g');
        Nav.main = new Elt({ nsi: "H", qname: 'div' });
        Nav.fo = new SVGElt('foreignObject');
        //
        const mainSlot = document.getElementById('main-slot');
        mainSlot.appendChild(Nav.frame.elt);
        Nav.frame.elt.appendChild(Nav.top.elt);
        Nav.frame.elt.appendChild(Nav.line.elt);
        Nav.frame.elt.appendChild(Nav.fo.elt);
        Nav.fo.elt.appendChild(Nav.main.elt);
        //
        Nav.frame.setAA(['style', 'background-color:darkgoldenrod']);
        Nav.top.setAA(['x', Nav.frameMargin, 'y', Nav.frameMargin, 'height', Nav.height, 'fill', 'beige']);
        Nav.fo.setAA(['x', Nav.height + 2 * Nav.frameMargin, 'y', 2 * Nav.frameMargin + Nav.height,
            'style', 'overflow:auto;background-color:whitesmoke']);
        Nav.main.setA('style', 'background-color:whitesmoke;padding:10');
        //
        Nav.button.setA('font-size', Nav.arrowSize);
        const xp = Nav.margin.start;
        const yp = 1 / 2 * Nav.height + .6 * Nav.fontSize;
        Nav.button.setAA(['stroke', Nav.color.std, 'x', xp, 'y', yp,
            'visibility', 'hidden', 'pointer-events', 'none']);
        Nav.button.elt.addEventListener('click', () => { Nav.buttonPressed(); });
        Nav.button.elt.addEventListener('mouseover', () => {
            Nav.button.setA('stroke', Nav.color.over);
        });
        Nav.button.elt.addEventListener('mouseout', () => {
            Nav.button.setA('stroke', Nav.color.std);
        });
        Nav.frame.elt.appendChild(Nav.button.elt);
        Nav.frame.elt.appendChild(Nav.index.elt);
        //
        window.onresize = () => Nav.display();
        Nav.display();
    }
    static display() {
        const mysteryMargin = 0;
        const bw = window.innerWidth - Nav.offset;
        const bh = window.innerHeight - Nav.offset;
        const fm = Nav.frameMargin;
        Nav.frame.setAA(['width', bw, 'height', bh]);
        Nav.top.setA('width', bw - 2 * fm);
        const x = (Nav.indexVisible) ? 2 * fm + Nav.panelWidth : fm;
        Nav.foWidth = (Nav.indexVisible) ? bw - 3 * fm - Nav.panelWidth : bw - 2 * fm;
        Nav.foHeight = bh - Nav.height - 3 * fm;
        if (Nav.indexVisible) {
            Nav.panel.setA('height', Nav.foHeight);
        }
        Nav.fo.setAA(['x', x, 'width', Nav.foWidth, 'height', Nav.foHeight]);
        Nav.width = bw;
        Nav.fo.elt.innerHTML = '';
        if (Nav.currentDiagram)
            Nav.setDiagram(Nav.currentDiagram);
        else
            Nav.HTMLDiagrams.forEach(diagram => { Nav.setDiagram(diagram); });
    }
    static setDiagram(diagram) {
        diagram.setAA(['width', Nav.foWidth, 'height', Nav.foHeight]);
        const scale = Nav.setScale(diagram);
        const xd = Nav.foWidth - scale * diagram.group.width;
        const yd = Nav.foHeight - scale * diagram.group.height;
        const x = (xd > 0) ? xd / 2 : 0;
        const y = (yd > 0) ? yd / 2 : 0;
        console.log(`x ${x} y ${y} scale ${scale}`);
        diagram.group.gmoveScale(x, y, scale);
        Nav.fo.elt.appendChild(diagram.elt);
    }
    static setScale(diagram) {
        let scale = 1;
        const wr = diagram.group.width / Nav.foWidth;
        const hr = diagram.group.height / Nav.foHeight;
        const r = Math.max(wr, hr);
        if (r > 1) {
            scale = 1 / r;
        }
        return scale;
    }
    static setGroupDiagram(group) {
        const diagram = new SVGDiagram(group);
        diagram.elt.appendChild(group.elt);
        diagram.setAA(['width', group.width, 'height', group.height]);
        return diagram;
    }
    static setContentToHTML(segName, groups = []) {
        Nav.currentDiagram = undefined;
        const seg = document.getElementById(segName);
        const innerComment = seg.innerHTML;
        const innerContent = innerComment.substring(8, innerComment.length - 8);
        Nav.main.elt.innerHTML = innerContent;
        Nav.fo.elt.appendChild(Nav.main.elt);
        Nav.HTMLDiagrams = [];
        groups.forEach(entry => { Nav.setHTMLDiagram(entry[0], entry[1]); });
    }
    static setHTMLDiagram(slotName, group) {
        const slot = document.getElementById(slotName);
        const diagram = Nav.setGroupDiagram(group);
        slot.appendChild(diagram.elt);
        Nav.HTMLDiagrams.push(diagram);
    }
    static setContentToDiagram(group) {
        Nav.HTMLDiagrams = [];
        const diagram = new SVGDiagram(group);
        //diagram.setAA(['width',Nav.foWidth,'height',Nav.foHeight])
        Nav.currentDiagram = diagram;
        Nav.fo.elt.appendChild(diagram.elt);
        Nav.display();
    }
    //
    static addText(text, cb, active = true) {
        const widget = new SVGText();
        const cbFlag = (cb) ? true : false;
        Nav.currentElts.push([widget, cbFlag]);
        if (active)
            Nav.activeElt = widget;
        widget.setV(text);
        widget.setA('font-size', Nav.fontSize);
        if (cb) {
            widget.elt.addEventListener('click', () => { cb(); });
            widget.elt.addEventListener('mouseover', () => { widget.setA('stroke', Nav.color.over); });
            widget.elt.addEventListener('mouseout', () => {
                const color = (widget == Nav.activeElt) ? Nav.color.active : Nav.color.std;
                widget.setA('stroke', color);
            });
        }
        if (active) {
            Nav.setActiveElt(text);
        }
        Nav.line.elt.appendChild(widget.elt);
        Nav.show();
    }
    static buttonPressed() {
        if (Nav.indexVisible) {
            Nav.indexVisible = false;
            Nav.button.setV(Nav.dnArrow);
            Nav.hideSideIndex();
        }
        else {
            Nav.indexVisible = true;
            Nav.button.setV(Nav.upArrow);
            Nav.showSideIndex();
        }
    }
    static showButton(choices, choice, initState, cb) {
        let maxWidth = 0;
        Nav.cb = cb;
        Nav.indexChoice = choice;
        Nav.indexVisible = initState;
        Nav.indexChoices = choices.map(e => {
            const txt = new SVGText();
            txt.setV(e);
            const color = (e == choice) ? Nav.color.active : Nav.color.std;
            txt.setAA(['font-size', Nav.sideFontSize, 'stroke', color]);
            txt.elt.addEventListener('click', (ev) => {
                if (e != Nav.indexChoice)
                    Nav.indexSelected(ev);
            });
            txt.elt.addEventListener('mouseover', () => {
                if (e != Nav.indexChoice)
                    txt.setA('stroke', Nav.color.over);
            });
            txt.elt.addEventListener('mouseout', () => {
                if (e != Nav.indexChoice)
                    txt.setA('stroke', Nav.color.std);
            });
            const [w, _] = txt.eltWH();
            if (w > maxWidth)
                maxWidth = w;
            return txt;
        });
        Nav.panel = new SVGElt('rect');
        const px = Nav.frameMargin;
        const py = Nav.height + 2 * Nav.frameMargin;
        Nav.panelWidth = maxWidth + 8 + 2 * Nav.frameMargin;
        const ph = window.innerHeight - Nav.offset - Nav.height;
        Nav.panel.setAA(['x', px, 'y', py, 'width', Nav.panelWidth, 'height', ph, 'fill', 'gold']);
        Nav.index.elt.appendChild(Nav.panel.elt);
        let y = py + Nav.sideFontSize + 6;
        Nav.indexChoices.map(e => {
            e.setAA(['x', px + 4, 'y', y]);
            y += Nav.sideFontSize + 6;
            Nav.index.elt.appendChild(e.elt);
        });
        const arrow = (Nav.indexVisible) ? Nav.upArrow : Nav.dnArrow;
        Nav.button.setV(arrow);
        Nav.button.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        if (Nav.indexVisible)
            Nav.showSideIndex();
    }
    static hideButton() {
        Nav.button.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        Nav.index.elt.innerHTML = '';
        Nav.hideSideIndex();
    }
    static showSideIndex() {
        const nx = 2 * Nav.frameMargin + Nav.panelWidth;
        const nw = window.innerWidth - Nav.offset - Nav.panelWidth - 2 * Nav.frameMargin;
        Nav.fo.setAA(['x', nx, 'width', nw]);
        Nav.index.setA('style', 'display:block');
    }
    static hideSideIndex() {
        const nw = window.innerWidth - Nav.offset - Nav.frameMargin;
        Nav.index.setA('style', 'display:none');
        this.fo.setAA(['x', Nav.frameMargin, 'width', nw]);
    }
    static indexSelected(ev) {
        const selectedElt = ev.target;
        Nav.indexChoice = selectedElt.innerHTML;
        Nav.indexChoices.map(e => {
            const color = (e.getV() == Nav.indexChoice) ? Nav.color.active : Nav.color.std;
            e.setA('stroke', color);
        });
        Nav.currentElts = Nav.currentElts.slice(0, 2);
        Nav.line.elt.innerHTML = '';
        Nav.line.elt.appendChild(Nav.currentElts[0][0].elt);
        Nav.line.elt.appendChild(Nav.currentElts[1][0].elt);
        Nav.cb(Nav.indexChoice);
    }
    static show() {
        let xp = Nav.margin.start + Nav.margin.init;
        const yp = 1 / 2 * Nav.height + 1 / 4 * Nav.fontSize + Nav.frameMargin;
        Nav.currentElts.forEach(e => {
            const widget = e[0];
            const color = (widget == Nav.activeElt) ? Nav.color.active : Nav.color.std;
            widget.setAA(['stroke', color, 'x', xp, 'y', yp]);
            const w = widget.getSVGBox().width;
            xp += w + Nav.margin.std;
        });
    }
    static setActiveElt(which) {
        Nav.currentElts.forEach(e => {
            if (e[0].getV() == which) {
                Nav.activeElt = e[0];
                if (e[1]) {
                    e[0].setA('pointer-events', 'none');
                }
            }
            else if (e[1]) {
                e[0].setA('pointer-events', 'auto');
            }
        });
    }
    static remove(text) {
        Nav.currentElts = Nav.currentElts.filter(w => (w[0].getV() != text));
        Nav.show();
    }
    static clear() {
        Nav.currentElts = [];
        Nav.activeElt = undefined;
        Nav.line.elt.innerHTML = '';
    }
}
Nav.indexVisible = false;
Nav.indexChoices = [];
Nav.currentElts = [];
Nav.HTMLDiagrams = [];
Nav.color = { bg: 'beige', std: 'black', active: 'lightblue', over: 'purple' };
Nav.margin = { start: 15, init: 75, std: 25, line: 30 };
Nav.fontSize = 20;
Nav.sideFontSize = 14;
Nav.height = 40;
Nav.offset = 35;
Nav.frameMargin = 5;
Nav.upArrow = '\u2B9D';
Nav.dnArrow = '\u2B9F';
Nav.arrowSize = 30;
//# sourceMappingURL=navFW.js.map