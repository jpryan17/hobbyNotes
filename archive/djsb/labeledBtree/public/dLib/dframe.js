import { SVGElt, SVGGrpElt } from "../clientLib/svgElt.js";
import { BtreeDiagram } from "./btree.js";
export class DframeStatic extends SVGElt {
    constructor(w, h, maxBD, nodeSize, pp, dp) {
        super('svg');
        const grp = new SVGGrpElt();
        this.append(grp);
        new BtreeDiagram(grp, w, h, maxBD, nodeSize, pp, dp);
    }
}
export class DframeInteractive extends SVGElt {
    constructor(w, h, maxBD, nodeSize, pp, dp) {
        super('svg');
        const grp = new SVGGrpElt();
        this.append(grp);
        new BtreeDiagram(grp, w, h, maxBD, nodeSize, pp, dp);
    }
}
//# sourceMappingURL=dframe.js.map