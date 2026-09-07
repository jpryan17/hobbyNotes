import { SVGGrpElt, SVGText } from './svgElt.js';
import { Nav } from './navFW.js';
let that;
export class Index extends SVGGrpElt {
    //
    constructor(indexDesc, initialSelection) {
        super();
        this.choices = [];
        that = this;
        this.chosen = initialSelection;
        this.setA('style', `background-color:aliceblue`);
        const [m, fs, c] = [Index.margin, Index.fontSize, Index.stdColor];
        let y = m + 2 / 3 * fs;
        indexDesc.forEach(choice => {
            const indents = (choice.indents) ? choice.indents : 0;
            const shape = (choice.type == 'html') ? '\u25A0' :
                (choice.type == 'index') ? '\u25B6' : '\u25CF';
            const text = '&nbsp;'.repeat(indents).concat(shape, ' ', choice.topic);
            const item = new SVGText();
            item.setV(text);
            item.setAA(['x', m, 'y', y, 'font-size', fs, 'stroke', `${c}`]);
            this.choices.push([choice, item]);
            this.append(item);
            y = y + Index.fontSize + 10;
            item.elt.addEventListener('mouseover', () => { item.setA('stroke', Index.overColor); });
            item.elt.addEventListener('mouseout', () => {
                const ps = item.getA('pointer-events');
                const c = (ps == 'none') ? Index.selectedColor : Index.stdColor;
                item.setA('stroke', c);
            });
            item.elt.addEventListener('click', (ev) => {
                const itemWidget = ev.target;
                this.chosen = this.choices.findIndex(c => c[1].elt == itemWidget);
                this.setSelectedItem();
                Nav.processSelection();
            });
        });
    }
    setSelectedItem() {
        this.choices.forEach((c, i) => {
            const color = (i == this.chosen) ? Index.selectedColor : Index.stdColor;
            const pstate = (i == this.chosen) ? 'none' : 'auto';
            c[1].setAA(['stroke', color, 'pointer-events', pstate]);
        });
    }
}
Index.fontSize = 16;
Index.margin = 4;
Index.stdColor = 'blue';
Index.overColor = 'purple';
Index.selectedColor = 'black';
//# sourceMappingURL=navIndex.js.map