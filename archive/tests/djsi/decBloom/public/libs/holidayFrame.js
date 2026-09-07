import { SVGElt, SVGDiagram } from './svgElements.js';
export class HF {
    constructor(group) {
        HF.currentDiagram = new SVGDiagram(group);
        //
        HF.frame = new SVGElt('svg');
        HF.fo = new SVGElt('foreignObject');
        const mainSlot = document.getElementById('main-slot');
        mainSlot.appendChild(HF.frame.elt);
        HF.frame.elt.appendChild(HF.fo.elt);
        HF.frame.setAA(['style', `background-color:${HF.bgColor}`]);
        HF.fo.setAA(['x', 2 * HF.frameMargin, 'y', 2 * HF.frameMargin,
            'style', `overflow:auto;background-color:${HF.foBgColor};
                    padding:${HF.foPadding}`]);
        HF.fo.elt.appendChild(HF.currentDiagram.elt);
        window.onresize = () => HF.display();
        HF.display();
    }
    static display() {
        HF.frame.elt.innerHTML = '';
        HF.frame.elt.appendChild(HF.fo.elt);
        const bw = window.innerWidth - HF.offset;
        const bh = window.innerHeight - HF.offset;
        const fm = HF.frameMargin;
        HF.frame.setAA(['width', bw, 'height', bh]);
        HF.foWidth = bw - 2 * fm;
        HF.foHeight = bh - 2 * fm;
        HF.fo.setAA(['x', 2 * fm, 'width', HF.foWidth, 'height', HF.foHeight]);
        HF.drawStripes(bw, bh);
        HF.drawDiagram();
    }
    static drawDiagram() {
        HF.currentDiagram.setAA(['width', HF.foWidth - 2 * HF.foPadding, 'height', HF.foHeight - 2 * HF.foPadding]);
        const scale = HF.setScale(HF.currentDiagram.group);
        const xd = HF.foWidth - scale * (HF.currentDiagram.group.width) - 2 * HF.foPadding;
        const yd = HF.foHeight - scale * (HF.currentDiagram.group.height) - 2 * HF.foPadding;
        let x = xd / 2;
        let y = yd / 2;
        HF.currentDiagram.group.gmoveScale(x, y, scale);
    }
    static setScale(group) {
        let scale = 1;
        const wr = (group.width) / (HF.foWidth - 2 * HF.foPadding);
        const hr = (group.height) / (HF.foHeight - 2 * HF.foPadding);
        const r = Math.max(wr, hr);
        if (r > 1) {
            scale = 1 / r;
        }
        return scale;
    }
    static drawStripes(w, h) {
        w = w - 15;
        h = h - 15;
        HF.setFramePath(w, h, 3, 'red');
        HF.setFramePath(w, h, 7, 'green');
        HF.setFramePath(w, h, 11, 'blue');
    }
    static setFramePath(w, h, inset, color) {
        const path = new SVGElt('polygon');
        const pathPts = `${inset},${inset},${w - inset},${inset},
                         ${w - inset},${h - inset},${inset},${h - inset}`;
        path.setAA(['points', pathPts, 'stroke', color, 'stroke-width', 2, 'fill', 'none']);
        HF.frame.elt.appendChild(path.elt);
    }
}
HF.foPadding = 15;
HF.bgColor = 'snow';
HF.foBgColor = 'snow';
HF.offset = 30;
HF.frameMargin = 15;
//# sourceMappingURL=holidayFrame.js.map