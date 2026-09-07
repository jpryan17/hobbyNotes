import { SVGElt } from './svgElt.js';
class SE extends SVGElt {
    context;
    constructor(context) {
        super('svg');
        this.context = context;
    }
}
