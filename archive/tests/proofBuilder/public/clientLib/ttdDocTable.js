import { Elt } from './elt.js';
export class TTDDocTable extends Elt {
    //
    constructor() {
        super('table');
        this.charTokens = [['p', 0x1d45d], ['q', 0x1d45e], ['r', 0x1d45f], ['s', 0x1d460],
            ['[', 0x005b], [']', 0x005d], ['n', 0x00ac],
            ['a', 0x2227], ['o', 0x2228], ['i', 0x2192], ['e', 0x2194]];
        this.charset = this.charTokens.map(e => e[0]);
        this.tokenset = this.charTokens.map(e => String.fromCodePoint(e[1]));
        this.setTable();
    }
    setTable() {
        this.setAA(['width', '95%', 'style', 'border: 1px solid black']);
        const r1 = new Elt('tr');
        const r2 = new Elt('tr');
        const r3 = new Elt('tr');
        this.append(r1);
        this.append(r2);
        this.append(r3);
        const vh1 = new Elt('th');
        const vh2 = new Elt('td');
        const vh3 = new Elt('td');
        r1.append(vh1);
        r2.append(vh2);
        r3.append(vh3);
        vh1.setV('keyboard input:');
        vh2.setV('resulting token:');
        vh3.setV('token class');
        this.setStyle([vh1, vh2], 0);
        this.setStyle(vh3, 1);
        this.charset.forEach(c => {
            const cv = c;
            const cell = new Elt('th');
            r1.append(cell);
            cell.setV(cv);
            this.setStyle(cell, 1);
        });
        this.tokenset.forEach(t => {
            const tv = t;
            const cell = new Elt('td');
            r2.append(cell);
            cell.setV(tv);
            this.setStyle(cell, 1);
        });
        const r1Cells = Array.from(r1.elt.children);
        r1Cells.forEach(c => { Elt.sa(c, 'scope', 'col'); });
        const tc1 = new Elt('td');
        const tc2 = new Elt('td');
        const tc3 = new Elt('td');
        const tc4 = new Elt('td');
        r3.append(tc1);
        r3.append(tc2);
        r3.append(tc3);
        r3.append(tc4);
        tc1.setV('propositional symbols');
        tc2.setV('brackets');
        tc3.setV('negation');
        tc4.setV('binary operations');
        this.setStyle([tc1, tc2, tc3, tc4], 1);
        tc1.setA('colspan', 4);
        tc2.setA('colspan', 2);
        tc4.setA('colspan', 4);
    }
    setStyle(elts, styleSet, span) {
        const styles = ['border: 1px solid black;text-align:right',
            `border: 1px solid black;text-align:center`,
            'border: 1px solid black;text-align:center'];
        if (Array.isArray(elts)) {
            elts.forEach(e => e.setA('style', styles[styleSet]));
        }
        else {
            elts.setA('style', styles[styleSet]);
        }
    }
}
//# sourceMappingURL=ttdDocTable.js.map