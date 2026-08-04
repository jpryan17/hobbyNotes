const SVGns = 'http://www.w3.org/2000/svg';
const HTMLns = 'http://www.w3.org/1999/xhtml';
export class Elt {
    constructor(qname = 'div', id, nsi = 'H', wrapElt) {
        const ns = (nsi == "H") ? HTMLns : SVGns;
        if (wrapElt) {
            this.elt = wrapElt;
        }
        else {
            this.elt = document.createElementNS(ns, qname);
        }
        if (id != undefined)
            this.elt.setAttribute("id", id);
        Elt.elements.set(this.elt, this);
    }
    static delete(key) { Elt.elements.delete(key); }
    static wrapper(key) { if (key)
        return Elt.elements.get(key); }
    append(elt) { this.elt.appendChild(elt.elt); }
    getV() { return this.elt.innerHTML; }
    setV(val) { this.elt.innerHTML = val; }
    getA(name) { return this.elt.getAttribute(name); }
    getS(name) { return this.getA(name); }
    getN(name) { return +this.getS(name); }
    getAN(names) { return names.map(e => this.getN(e)); }
    getAA(names) { return names.map(e => this.elt.getAttributeNS(null, e)); }
    setA(name, val) { this.elt.setAttributeNS(null, name, val.toString()); }
    setAA(avPairs) {
        for (let i = 0; i < avPairs.length - 1; i += 2) {
            this.elt.setAttributeNS(null, avPairs[i].toString(), avPairs[i + 1].toString());
        }
    }
    eltBCR() {
        if (this.elt.parentElement) {
            return this.elt.getBoundingClientRect();
        }
        else {
            const scratchArea = document.getElementById('scratch-slot');
            scratchArea.innerHTML = '';
            scratchArea.appendChild(this.elt);
            const bcr = this.elt.getBoundingClientRect();
            scratchArea.innerHTML = '';
            return bcr;
        }
    }
    eltW() { return this.eltBCR().width; }
    eltH() { return this.eltBCR().height; }
    eltX() { return this.eltBCR().x; }
    eltY() { return this.eltBCR().y; }
    eltWH() {
        const dr = this.eltBCR();
        return [dr.width, dr.height];
    }
    eltXYWH() {
        const dr = this.eltBCR();
        return [dr.x, dr.y, dr.width, dr.height];
    }
    removeChildren() {
        Array.from(this.elt.children).forEach(c => this.elt.removeChild(c));
    }
    child() {
        const children = Array.from(this.elt.children);
        if (children.length == 0) {
            console.log(`${this} has no children`);
        }
        else if (children.length != 1) {
            console.log(`${this} has multiple children`);
        }
        else {
            return Elt.wrapper(children[0]);
        }
    }
    children() {
        const widgets = [];
        Array.from(this.elt.children).forEach(elt => {
            const widget = Elt.wrapper(elt);
            widgets.push(widget);
        });
        return widgets;
    }
    static ga(elt, att) {
        if (typeof elt == "string") {
            elt = document.getElementById(elt);
        }
        if (typeof att == 'string') {
            return elt.getAttributeNS(null, att);
        }
        else {
            const asElt = elt;
            return att.map(e => asElt.getAttributeNS(null, e));
        }
    }
    static sa(elt, a, v) {
        if (typeof elt == "string") {
            elt = document.getElementById(elt);
        }
        elt.setAttributeNS(null, a, v.toString());
    }
    static saa(elt, av) {
        if (typeof elt == "string") {
            elt = document.getElementById(elt);
        }
        if (!Array.isArray(av)) {
            av = [av];
        }
        for (let i = 0; i < av.length - 1; i += 2) {
            elt.setAttributeNS(null, av[i].toString(), av[i + 1].toString());
        }
    }
}
Elt.elements = new Map();
//# sourceMappingURL=elt.js.map