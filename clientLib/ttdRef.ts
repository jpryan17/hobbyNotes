import { Nav } from './navFW.js';
import { ttd } from './ttd.js';
import { getDemoCatalogItem } from './demoCatalog.js';
import { PxeEngine } from './pxeEngine.js';

export class TTDRef extends HTMLElement {
    static stdColor = 'firebrick';
    static overColor = 'fuchsia';

    constructor() {
        super();
    }

    connectedCallback() {
        const rawId = this.getAttribute('id') || this.getAttribute('demo-id') || '';
        const legacyExp = this.getAttribute('exp') || '';

        let exp = '';
        let fmt = '';

        if (rawId) {
            const demo = getDemoCatalogItem(rawId);
            if (demo) {
                exp = demo.expression || demo.init_packet?.exp || '';
                fmt = demo.init_packet?.fmt || (exp ? PxeEngine.fmt(exp) : '');
            } else {
                console.warn(`[TTDRef] Unresolved proposition demo ID: "${rawId}"`);
            }
        } else if (legacyExp) {
            exp = legacyExp;
            fmt = PxeEngine.fmt(exp);
        }

        // Auto-populate inner HTML typography if empty
        if (!this.innerHTML.trim() && fmt) {
            this.textContent = fmt;
        }

        this.setAttribute('style', `color:${TTDRef.stdColor};font-weight:bold;cursor:pointer;`);

        this.addEventListener('mouseover', () => {
            this.style.color = TTDRef.overColor;
        });
        this.addEventListener('mouseout', () => {
            this.style.color = TTDRef.stdColor;
        });
        this.addEventListener('click', () => {
            if (!exp) return;
            const index = Nav.indices[Nav.currentIndex];
            const choice = index.choices[index.chosen];
            const buttonText = `back to ${choice[0].topic}`;
            ttd.pxe.exp = exp;
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.append(ttd);
            ttd.layoutEditor();
            ttd.displayTable();
            Nav.display();
        });
    }
}
