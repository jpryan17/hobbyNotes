import { SVGElt } from './svgElt.js';
class Banner extends SVGElt {
    constructor() {
        super('svg');
    }
    LocToXY(loc) {
        if (loc[0] == 'Quad') {
            const [quad, vertAlign, horzAlign] = loc[1];
            this.setQuadXY(quad);
        }
        else {
            const [wrtBlurb, [rel, alignment]] = loc[1];
        }
    }
    setQuadXY(quad) {
    }
    addTitle(loc, range, title) {
    }
    addSelectionList(loc, range, selections) {
    }
    addTextCol(loc, range) {
    }
    addTextBox(loc, range) {
    }
    addImage(loc, range, imageURI) {
    }
}
