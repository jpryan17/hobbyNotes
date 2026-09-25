import { Nav } from './navFW.js';
import { eqDemo, setEqDemo } from './eqDemo.js';
/**
 * EqRef: Custom Element for inline or block references to Equation Evaluations.
 * Syntax: <eq-ref eq-id="nucleus_halo_1d">«Eq: x = st(x) + ε»</eq-ref>
 * Or:     <eq-ref formula="2*x + 3" domain="ℝ">«Eval: 2x + 3»</eq-ref>
 */
export class EqRef extends HTMLElement {
    static stdColor = '#047857';
    static overColor = '#064e3b';
    constructor() {
        super();
    }
    connectedCallback() {
        const rawHtml = this.innerHTML.trim();
        const eqId = this.getAttribute('eq-id') || this.getAttribute('calc-id') || this.getAttribute('eqId') || '';
        const formula = this.getAttribute('formula') || this.getAttribute('expr') || '';
        if (!rawHtml) {
            const displayLabel = formula || eqId || 'Equation';
            this.innerHTML = `«Eq: ${displayLabel}»`;
        }
        else if (!rawHtml.startsWith('«') && !rawHtml.startsWith('&laquo;') && !rawHtml.startsWith('<<')) {
            this.innerHTML = `«Eq: ${rawHtml}»`;
        }
        this.setAttribute('style', `display:inline-block;color:${EqRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#34d399;text-underline-offset:3px;padding:2px 6px;border-radius:4px;transition:background 0.15s, color 0.15s;`);
        this.addEventListener('mouseover', () => {
            this.setAttribute('style', `display:inline-block;color:${EqRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#059669;text-underline-offset:3px;background:#ecfdf5;padding:2px 6px;border-radius:4px;`);
        });
        this.addEventListener('mouseout', () => {
            this.setAttribute('style', `display:inline-block;color:${EqRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#34d399;text-underline-offset:3px;background:transparent;padding:2px 6px;border-radius:4px;`);
        });
        this.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = Nav.indices[Nav.currentIndex];
            const choice = index ? index.choices[index.chosen] : null;
            const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
            const buttonText = `back to ${topicName}`;
            if (!eqDemo)
                setEqDemo();
            const domain = this.getAttribute('domain') || 'ℝ';
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.elt.scrollTop = 0;
            Nav.fo.append(eqDemo);
            Nav.display();
            eqDemo.loadEquation(eqId, formula, domain);
            eqDemo.layout();
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => eqDemo.layout());
            }
        });
    }
}
