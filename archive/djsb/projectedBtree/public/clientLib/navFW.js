import { Elt } from './elt.js';
import { SVGElt, SVGText, SVGTSpan } from './svgElt.js';
import { Index } from './navIndex.js';
import { Sed } from './editor.js';
export class Nav {
    constructor(app, parent = null, editMode = false, bgC = 'darkgoldenrod', lineC = 'beige', indexC = 'white', foC = 'aliceBlue') {
        const mainSlot = document.getElementById('main-slot');
        //
        Nav.app = app;
        Nav.parent = parent;
        Nav.editMode = editMode;
        Nav.frame = new SVGElt('svg');
        Nav.line = new SVGElt('g');
        Nav.lineRect = new SVGElt('rect');
        Nav.lineBlock = new SVGText();
        Nav.lineArrowButton = new SVGTSpan(Nav.lineBlock);
        Nav.lineTopics = new SVGTSpan(Nav.lineBlock);
        Nav.index = new SVGElt('svg');
        Nav.indexRect = new SVGElt('rect');
        Nav.fo = new SVGElt('foreignObject');
        //
        mainSlot.appendChild(Nav.frame.elt);
        Nav.frame.append(Nav.line);
        Nav.line.append(Nav.lineRect);
        Nav.line.append(Nav.lineBlock);
        Nav.frame.append(Nav.index);
        Nav.frame.append(Nav.fo);
        //
        const fm = Nav.frameMargin;
        const h = Nav.lineHeight;
        const y = 2 * fm + h;
        const xp = Nav.margin.start;
        const yp = 1 / 2 * Nav.lineHeight + .6 * Nav.fontSize;
        Nav.frame.setA('style', `background-color:${bgC}`);
        Nav.line.setA('height', h);
        Nav.lineRect.setAA(['x', fm, 'y', fm, 'height', h, 'fill', `${lineC}`]);
        Nav.index.setAA(['x', fm, 'y', y]);
        Nav.indexRect.setAA(['x', 0, 'y', 0, 'fill', `${indexC}`]);
        Nav.fo.setAA(['y', y, 'style', `overflow:auto;background-color:${Nav.foBgColor}`]);
        Nav.lineArrowButton.setAA(['x', xp, 'y', yp, 'stroke', Nav.color.std, 'font-size', Nav.arrowSize]);
        Nav.lineArrowButton.setV(Nav.dnArrow);
        Nav.lineArrowButton.elt.addEventListener('click', () => { Nav.lineArrowButtonPressed(); });
        Nav.lineArrowButton.elt.addEventListener('mouseover', () => { Nav.lineArrowButton.setA('stroke', Nav.color.over); });
        Nav.lineArrowButton.elt.addEventListener('mouseout', () => { Nav.lineArrowButton.setA('stroke', Nav.color.std); });
        //
        if (Nav.editMode) {
            new Sed(Nav.color);
        }
        if (Nav.parent) {
            Nav.addNavLineIndexItem('Banner', Nav.toBanner);
        }
        //
        window.onresize = () => { Nav.display(); };
        Nav.display();
    }
    //
    static toBanner(e) {
        const mainSlot = document.getElementById('main-slot');
        mainSlot.innerHTML = '';
        const p = Nav.parent;
        mainSlot.appendChild(p.elt);
    }
    static display() {
        const bw = window.innerWidth - Nav.offset;
        const bh = window.innerHeight - Nav.offset;
        const fm = Nav.frameMargin;
        const py = Nav.lineHeight + 2 * fm;
        //
        Nav.frame.setAA(['width', bw, 'height', bh]);
        Nav.line.setA('width', bw - 2 * fm);
        Nav.lineRect.setA('width', bw - 2 * fm);
        Nav.foHeight = bh - Nav.lineHeight - 3 * fm;
        //
        if (Nav.editMode) {
            Sed.setEditControlsPos(bw - 2 * fm);
        }
        //
        let indexWidth = 0;
        let layoutCB;
        if (Nav.currentIndex != -1) {
            const index = Nav.indices[Nav.currentIndex];
            if (index.chosen != -1) {
                layoutCB = index.choices[index.chosen][0].layoutCB;
            }
            const indexVisible = Nav.lineArrowButton.getV() == Nav.dnArrow;
            if (indexVisible) {
                Nav.index.removeChildren();
                Nav.index.append(Nav.indexRect);
                Nav.index.append(index);
                indexWidth = index.getBB().width + 2 * Index.margin;
                Nav.indexRect.setAA(['width', indexWidth, 'height', Nav.foHeight]);
            }
        }
        const foX = (indexWidth > 0) ? 2 * fm + indexWidth : fm;
        Nav.foWidth = (indexWidth > 0) ? bw - 3 * fm - indexWidth : bw - 2 * fm;
        Nav.fo.setAA(['x', `${foX}`, 'width', Nav.foWidth, 'height', Nav.foHeight]);
        if (!layoutCB) {
            layoutCB = Nav.xLayout;
        }
        if (layoutCB) {
            layoutCB();
        }
    }
    static addNavLineIndexItem(header, cb) {
        const widget = new SVGTSpan(Nav.lineTopics);
        const [stdC, activeC] = [Nav.color.std, Nav.color.active];
        widget.setAA(['font-size', Nav.fontSize, 'stroke', stdC, 'pointer-events', 'none']);
        widget.setV(header);
        widget.elt.addEventListener('mouseover', () => { widget.setA('stroke', Nav.color.over); });
        widget.elt.addEventListener('mouseout', () => {
            const color = (widget.getA('pointer-events') == 'none') ? stdC : activeC;
            widget.setA('stroke', color);
        });
        widget.elt.addEventListener('click', (ev) => {
            if (cb)
                cb(ev);
            else
                Nav.lineItemSelectionHandler(ev);
        });
        const lineElts = Nav.lineTopics.children();
        for (let i = 0; i < lineElts.length - 1; i++) {
            lineElts[i].setAA(['stroke', activeC, 'pointer-events', 'auto']);
        }
        if (cb)
            lineElts[0].setAA(['stroke', activeC, 'pointer-events', 'auto']);
        Nav.showNavLine();
    }
    static lineArrowButtonPressed() {
        const v = (Nav.lineArrowButton.getV() == Nav.dnArrow) ? Nav.upArrow : Nav.dnArrow;
        Nav.lineArrowButton.setV(v);
        Nav.display();
    }
    static loadIndex(header, indexDesc, initialSelection = 0) {
        let index = new Index(indexDesc, initialSelection);
        Nav.indices.push(index);
        Nav.currentIndex = Nav.indices.length - 1;
        //if(header){
        Nav.addNavLineIndexItem(header);
        //}
        index.setSelectedItem();
        Nav.processSelection();
    }
    //
    static processSelection() {
        if (Nav.editMode) {
            Sed.setEditControlStatus(false);
        }
        const index = Nav.indices[Nav.currentIndex];
        const selected = index.choices[index.chosen];
        const [c, w] = selected; //[IndexItemDesc,SVGTSpan]
        const lineElts = Nav.lineTopics.children();
        Nav.fo.removeChildren();
        if (c.type == 'index') {
            Nav.loadNewIndex(c);
        }
        else {
            const len = lineElts.length;
            const widget = lineElts[len - 1];
            const val = widget.getV();
            if (['comments', 'back'].includes(val)) {
                Nav.lineTopics.elt.removeChild(widget.elt);
                Nav.showNavLine();
            }
            if (c.type == 'html') {
                Nav.segId = c.htmlSegmentId;
                Nav.loadSegment();
                Nav.setSegPos();
                if (Nav.editMode) {
                    Sed.setEditControlStatus(true);
                }
            }
            else if (c.initCB) {
                const diagram = c.initCB();
                Nav.fo.append(diagram);
            }
        }
        Nav.display();
    }
    static setSegPos() {
        if (Nav.lastVisits.has(Nav.segId)) {
            Nav.fo.elt.scrollTop = Nav.lastVisits.get(Nav.segId);
        }
        else {
            Nav.fo.elt.scrollTop = 0;
        }
    }
    static setLastVisit() {
        const index = Nav.indices[Nav.currentIndex];
        const choice = index.choices[index.chosen][0];
        if (choice.type == 'html') {
            Nav.lastVisits.set(Nav.segId, Nav.fo.elt.scrollTop);
        }
    }
    static loadNewIndex(choice) {
        Nav.setLastVisit();
        const indexDesc = choice.indexDesc;
        Nav.loadIndex(choice.topic, indexDesc, choice.indexSelection);
    }
    static loadSegment() {
        const seg = Nav.segMap.get(Nav.segId);
        if (seg) {
            const div = new Elt('div');
            div.setAA(['style', `overflow:auto;padding:${Nav.foPadding}`]);
            div.elt.innerHTML = seg;
            Nav.fo.removeChildren();
            Nav.fo.append(div);
        }
    }
    static addNavLineBackButton(header) {
        const widget = new SVGTSpan(Nav.lineTopics);
        const [stdC, activeC] = [Nav.color.std, Nav.color.active];
        widget.setAA(['font-size', Nav.fontSize, 'stroke', activeC, 'pointer-events', 'auto']);
        widget.setV(header);
        widget.elt.addEventListener('mouseover', () => { widget.setA('stroke', Nav.color.over); });
        widget.elt.addEventListener('mouseout', () => {
            const color = (widget.getA('pointer-events') == 'none') ? stdC : activeC;
            widget.setA('stroke', color);
        });
        widget.elt.addEventListener('click', (ev) => { Nav.backButtonSelectionHandler(ev); });
        Nav.showNavLine();
    }
    static lineItemSelectionHandler(ev) {
        const lineElts = Nav.lineTopics.children();
        const elt = ev.target;
        const widget = Elt.wrapper(elt);
        const widgetPos = lineElts.findIndex(w => w == widget);
        console.log(`widgetPos ${widgetPos}`);
        if (widgetPos != -1) {
            for (let i = lineElts.length - 1; i > widgetPos; i--) {
                Nav.lineTopics.elt.removeChild(lineElts[i].elt);
            }
            const [stdC, activeC] = [Nav.color.std, Nav.color.active];
            Nav.currentIndex = widgetPos;
            lineElts[widgetPos].setAA(['stroke', stdC, 'pointer-events', 'none']);
            for (let i = 0; i < widgetPos; i++) {
                lineElts[i].setAA(['stroke', activeC, 'pointer-events', 'auto']);
            }
        }
        Nav.setLastVisit();
        Nav.showNavLine();
        const index = Nav.indices[this.currentIndex];
        index.chosen = 0;
        index.setSelectedItem();
        Nav.processSelection();
    }
    static backButtonSelectionHandler(ev) {
        const lineElts = Nav.lineTopics.children();
        const len = lineElts.length;
        Nav.lineTopics.elt.removeChild(lineElts[len - 1].elt);
        Nav.showNavLine();
        Nav.processSelection();
    }
    static showNavLine() {
        let xp = Nav.margin.init;
        const yp = 1 / 2 * Nav.lineHeight + 1 / 4 * Nav.fontSize + Nav.frameMargin;
        const lineElts = Nav.lineTopics.children();
        lineElts.forEach(widget => {
            const svgElt = widget;
            const bb = svgElt.getBB();
            widget.setAA(['x', xp, 'y', yp]);
            xp += bb.width + Nav.margin.std;
        });
    }
    static clearNavLine() {
        Nav.lineTopics.removeChildren();
        Nav.showNavLine();
    }
}
Nav.indices = [];
Nav.currentIndex = -1;
Nav.segMap = new Map();
Nav.lastVisits = new Map();
Nav.color = { bg: 'beige', std: 'black', active: 'blue', over: 'purple', busy: 'orange' };
Nav.margin = { start: 15, init: 75, std: 25, line: 30 };
Nav.foPadding = 10;
Nav.foBgColor = 'whitesmoke';
Nav.fontSize = 20;
Nav.sideFontSize = 14;
Nav.lineHeight = 40;
Nav.offset = 30;
Nav.frameMargin = 5;
Nav.upArrow = '\u2B9D';
Nav.dnArrow = '\u2B9F';
Nav.arrowSize = 30;
//# sourceMappingURL=navFW.js.map