import { handleOverrides } from './genUtils.js';
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
        Nav.index.setA('visibility', 'hidden');
        Nav.fo = new SVGElt('foreignObject');
        //
        const mainSlot = document.getElementById('main-slot');
        mainSlot.appendChild(Nav.frame.elt);
        Nav.frame.elt.appendChild(Nav.top.elt);
        Nav.frame.elt.appendChild(Nav.line.elt);
        Nav.frame.elt.appendChild(Nav.fo.elt);
        Nav.frame.setAA(['style', 'background-color:darkgoldenrod']);
        Nav.top.setAA(['x', Nav.frameMargin, 'y', Nav.frameMargin, 'height', Nav.height, 'fill', 'beige']);
        Nav.fo.setAA(['x', Nav.height + 2 * Nav.frameMargin, 'y', 2 * Nav.frameMargin + Nav.height,
            'style', `overflow:auto;background-color:${Nav.foBgColor};padding:${Nav.foPadding}`]);
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
        const bw = window.innerWidth - Nav.offset;
        const bh = window.innerHeight - Nav.offset;
        const fm = Nav.frameMargin;
        Nav.frame.setAA(['width', bw, 'height', bh]);
        Nav.top.setA('width', bw - 2 * fm);
        if (Nav.indexVisible) {
            Nav.index.setA('visibility', 'visible');
        }
        else {
            Nav.index.setA('visibility', 'hidden');
        }
        const x = (Nav.indexVisible) ? 2 * fm + Nav.indexWidth : fm;
        Nav.foWidth = (Nav.indexVisible) ? bw - 3 * fm - Nav.indexWidth : bw - 2 * fm;
        Nav.foHeight = bh - Nav.height - 3 * fm;
        Nav.fo.setAA(['x', x, 'width', Nav.foWidth, 'height', Nav.foHeight]);
        if (Nav.indexVisible) {
            Nav.index.setA('height', Nav.foHeight);
            Nav.indexRect.setA('height', Nav.foHeight);
        }
        Nav.width = bw;
        if (Nav.currentDiagram) {
            Nav.fo.elt.innerHTML = '';
            Nav.fo.elt.appendChild(Nav.currentDiagram.elt);
            Nav.setDiagram();
        }
        else {
            Nav.removeAnyHTMLDiagrams();
            Nav.HTMLGroups.forEach(sd => {
                const [slotName, group] = sd;
                const slot = document.getElementById(slotName);
                const diagram = new SVGDiagram(group);
                // yikes. fudge factors (*.9,-16) currently required.
                const scale = Nav.setScale(group) * .9;
                const nh = scale * group.height;
                diagram.setAA(['width', Nav.foWidth - 2 * Nav.foPadding - 16, 'height', nh]);
                group.gmoveScale(0, 0, scale);
                slot.appendChild(diagram.elt);
            });
        }
    }
    static removeAnyHTMLDiagrams() {
        Nav.HTMLGroups.forEach(sd => {
            const [slotName, _] = sd;
            const slot = document.getElementById(slotName);
            slot.innerHTML = '';
        });
    }
    static setDiagram() {
        if (!Nav.currentDiagram)
            return;
        Nav.fo.elt.appendChild(Nav.currentDiagram.elt);
        Nav.currentDiagram.setAA(['width', Nav.foWidth - 2 * Nav.foPadding, 'height', Nav.foHeight - 2 * Nav.foPadding]);
        const scale = Nav.setScale(Nav.currentDiagram.group);
        const xd = Nav.foWidth - scale * (Nav.currentDiagram.group.width) - 2 * Nav.foPadding;
        const yd = Nav.foHeight - scale * (Nav.currentDiagram.group.height) - 2 * Nav.foPadding;
        let x = (Nav.marginLeft == 0) ? (xd > 0) ? xd / 2 : 0 : Nav.marginLeft;
        let y = (Nav.marginTop == 0) ? (yd > 0) ? yd / 2 : 0 : Nav.marginTop;
        Nav.currentDiagram.group.gmoveScale(x, y, scale);
    }
    static setScale(group) {
        let scale = 1;
        const wr = (group.width) / (Nav.foWidth - 2 * Nav.foPadding);
        const hr = (group.height) / (Nav.foHeight - 2 * Nav.foPadding);
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
    static setContentToHTML(segName) {
        Nav.currentDiagram = undefined;
        const seg = document.getElementById(segName);
        const innerComment = seg.innerHTML;
        Nav.HTML = innerComment.substring(8, innerComment.length - 8);
        Nav.fo.elt.innerHTML = Nav.HTML;
        Nav.HTMLGroups = [];
    }
    static addHTMLGroup(slotName, group) {
        Nav.HTMLGroups.push([slotName, group]);
    }
    static setContentToDiagram(group, marginLeft = 0, marginTop = 0) {
        Nav.HTMLGroups = [];
        Nav.currentDiagram = new SVGDiagram(group);
        Nav.marginLeft = marginLeft;
        Nav.marginTop = marginTop;
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
    static showButton(choices, choice, cb) {
        let maxWidth = 0;
        Nav.cb = cb;
        Nav.indexChoice = choice;
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
        const px = Nav.frameMargin;
        const py = Nav.height + 2 * Nav.frameMargin;
        Nav.indexWidth = maxWidth + 8 + 2 * Nav.frameMargin;
        Nav.index.setAA(['x', px, 'y', py, 'width', Nav.indexWidth, 'height', Nav.foHeight, 'visibility', 'hidden']);
        Nav.indexRect = new SVGElt('rect');
        Nav.indexRect.setAA(['x', px, 'y', py, 'width', Nav.indexWidth, 'height', Nav.foHeight, 'fill', 'antiquewhite']);
        Nav.index.elt.appendChild(Nav.indexRect.elt);
        let y = py + Nav.sideFontSize + 6;
        Nav.indexChoices.map(e => {
            e.setAA(['x', px + 4, 'y', y]);
            y += Nav.sideFontSize + 6;
            Nav.index.elt.appendChild(e.elt);
        });
        const arrow = (Nav.indexVisible) ? Nav.upArrow : Nav.dnArrow;
        Nav.button.setV(arrow);
        Nav.button.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        if (Nav.initIndexState) {
            Nav.initIndexState = false;
            Nav.indexVisible = true;
            Nav.showSideIndex();
        }
    }
    static hideButton() {
        Nav.button.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        Nav.index.elt.innerHTML = '';
        Nav.hideSideIndex();
    }
    static showSideIndex() {
        Nav.indexVisible = true;
        Nav.display();
    }
    static hideSideIndex() {
        Nav.indexVisible = false;
        Nav.display();
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
Nav.initIndexState = true;
Nav.indexChoices = [];
Nav.currentElts = [];
Nav.HTMLGroups = [];
Nav.color = { bg: 'beige', std: 'black', active: 'lightblue', over: 'purple' };
Nav.margin = { start: 15, init: 75, std: 25, line: 30 };
Nav.foPadding = 15;
Nav.foBgColor = 'whitesmoke';
Nav.fontSize = 20;
Nav.sideFontSize = 14;
Nav.height = 40;
Nav.offset = 30;
Nav.frameMargin = 5;
Nav.upArrow = '\u2B9D';
Nav.dnArrow = '\u2B9F';
Nav.arrowSize = 30;
//# sourceMappingURL=navFW.js.map