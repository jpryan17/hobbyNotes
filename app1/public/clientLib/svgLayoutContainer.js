import { Elt } from './elt.js';
import { SVGElt, SVGText } from './svgElt.js';
//
export class Container extends SVGElt {
    widgets = new Map();
    actions = new Map();
    styles = new Map();
    toWidget = new Map();
    //
    constructor() {
        super('svg');
    }
    addAction(name, action) {
        this.actions.set(name, action);
    }
    addStyle(name, style) {
        this.styles.set(name, style);
    }
    addSelectionWidget(name, loc, style, type, text, action) {
        const widget = this.initWidget(type, loc, style, false);
        this.addListeners(widget);
        this.widgets.set(name, widget);
    }
    addListeners(widget) {
        const svgElt = (widget.rect != undefined) ? widget.rect : widget.text;
        const elt = svgElt.elt;
        elt.addEventListener('mouseover', (ev) => { this.mouseOver(ev); });
        elt.addEventListener('mouseout', (ev) => { this.mouseOut(ev); });
        elt.addEventListener('click', (ev) => { this.click(ev); });
    }
    addStrip(name, loc, type, style, label) {
        const needLabel = label != undefined;
        const widget = this.initWidget(type, loc, style, needLabel);
        this.widgets.set(name, widget);
    }
    addField(name, type, loc, style, label) {
        const needLabel = label != undefined;
        const widget = this.initWidget(type, loc, style, needLabel);
        this.widgets.set(name, widget);
    }
    initWidget(type, loc, style, needLabel) {
        const widget = { type: type, loc: loc, style: style };
        if (this.needsRect(widget)) {
            widget.rect = new SVGElt('rect');
        }
        if (this.hasText(widget)) {
            widget.text = new SVGText();
        }
        if (needLabel) {
            widget.label = new SVGText();
        }
        this.setLoc(widget);
        return widget;
    }
    needsRect(widget) {
        const style = this.styles.get(widget.style);
        return ['strip'].includes(widget.type) || style.colors.border != null;
    }
    hasText(widget) {
        return ['button', 'selection', 'field'].includes(widget.type);
    }
    setLoc(widget) {
        const loc = widget.loc;
        if (loc.type == 'quad') {
            this.setQuadLoc();
        }
        else if (loc.type == 'rel') {
            this.setRelLoc();
        }
        else if (loc.type == 'linear') {
            this.setLinearLoc();
        }
    }
    setQuadLoc() {
    }
    setRelLoc() {
    }
    setLinearLoc() {
    }
    setColor(occasion, widget) {
    }
    eventWidget(ev) {
        const elt = ev.target;
        const svg = Elt.wrapper(this.elt);
        return this.toWidget.get(svg);
    }
    mouseOver(e) {
        const widget = this.eventWidget(e);
        const actionName = widget.action;
        const action = this.actions.get(actionName);
        const status = action.status;
        if (['std', 'selected'].includes(status)) {
            const color = this.setColor('over', widget);
        }
    }
    mouseOut(e) {
        const widget = this.eventWidget(e);
        const actionName = widget.action;
        const action = this.actions.get(actionName);
        const status = action.status;
    }
    click(e) {
        const widget = this.eventWidget(e);
        const actionName = widget.action;
        const action = this.actions.get(actionName);
        const status = action.status;
    }
}
