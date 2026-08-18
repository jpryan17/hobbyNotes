import { SVGText } from './svgElt.js';
//type ExtendedSelection = [string,Function,number]
class SList {
    parent;
    w = new SVGText();
    constructor(parent, list, width) {
        this.parent = parent;
        this.w.setA('font-size', this.parent.getN('font-size'));
        const selectionList = list.map(selection => {
            const [text, cb] = selection;
            const selectionWidth = this.subWH(selection[0])[0];
            return [text, cb, selectionWidth];
        });
        const widths = selectionList.map(e => e[2]);
        const totalWidth = widths.reduce((a, c) => a + c, 0);
    }
    subWH(sub) {
        this.w.setV(sub);
        return this.w.getTextWH();
    }
}
