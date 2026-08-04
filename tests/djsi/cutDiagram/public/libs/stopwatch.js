import { handleOverrides } from './genUtils.js';
import { SVGElt, SVGGrpElt } from './svgElements.js';
export class Stopwatch extends SVGGrpElt {
    constructor(id, overrides) {
        super(id);
        this.size = { radius: 30, edge: 2, ticLen: 3, ticStroke: 1 };
        this.color = { circle: 'black', fill: 'lightblue', handFill: 'black',
            handStroke: "purple", tics: "black", hand: 'black' };
        this.margin = { circleToTic: 2, handToTic: 2 };
        this.handPos = 90;
        handleOverrides(this, overrides);
        const ring = new SVGElt('circle');
        const [cx, cy] = [0, 0];
        ring.setAA(['cx', cx, 'cy', cy,
            'r', this.size.radius,
            'fill', 'none',
            'stroke', this.color.circle,
            'stroke-width', this.size.edge]);
        const tics = this.setTics();
        for (let i = 0; i < tics.length; i++) {
            this.elt.appendChild(tics[i].elt);
        }
        this.hand = new SVGElt('polygon', 'poly');
        const ypt = cy - this.size.radius + this.size.ticLen +
            this.margin.circleToTic + this.margin.handToTic;
        this.hand.setAA(['points', `${cx - 2},${cy + 2} ${cx},${ypt} ${cx + 2},${cy + 2}`,
            "fill", this.color.handFill, "stroke", this.color.handStroke, 'stroke-width', 1]);
        this.elt.appendChild(this.hand.elt);
        const [cw, ch] = ring.eltWH();
        this.width = cw;
        this.height = ch;
        this.elt.appendChild(ring.elt);
    }
    setTics() {
        let tics = [];
        for (let i = 0; i < 12; i++) {
            const angle = Math.PI / 6 * i;
            const rad = this.size.radius - this.size.ticLen;
            const cx = this.getA('cx');
            const cy = this.getA('cy');
            const xp = rad * Math.sin(angle) + +cx;
            const yp = rad * Math.cos(angle) + +cy;
            let partial = this.size.ticLen / rad;
            let dx = partial * (+cx - xp);
            let dy = partial * (+cy - yp);
            const xp1 = xp + dx;
            const yp1 = yp + dy;
            const tic = new SVGElt('line', 'tic-'.concat(i.toString()));
            tic.setAA(['x1', xp, 'y1', yp, 'x2', xp1, 'y2', yp1,
                'stroke', this.color.tics,
                'stroke-width', this.size.ticStroke]);
            tics.push(tic);
        }
        return tics;
    }
    rotateHandTo(pos) {
        const mv = this.handPos - pos;
        this.hand.setA('transform', `rotate(${mv})`);
        this.handPos = pos;
    }
    resetHand() {
        const [cx, cy] = [0, 0];
        this.elt.removeChild(this.hand.elt);
        this.hand = new SVGElt('polygon', 'poly');
        const ypt = cy - this.size.radius + this.size.ticLen +
            this.margin.circleToTic + this.margin.handToTic;
        this.hand.setAA(['points', `${cx - 2},${cy + 2} ${cx},${ypt} ${cx + 2},${cy + 2}`,
            "fill", this.color.handFill, "stroke", this.color.handStroke, 'stroke-width', 1]);
        this.elt.appendChild(this.hand.elt);
        this.handPos = 90;
    }
}
//# sourceMappingURL=stopwatch.js.map