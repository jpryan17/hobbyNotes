import { Nav } from './navFW.js';
import { pseudoViewer, setPseudoViewer } from './pseudoViewer.js';
import { PSEUDO_CATALOG } from './pseudoCatalog.js';
/**
 * PseudoRef: Custom Element for inline or block references to Structured Pseudocode.
 * Syntax:
 *   <pseudo-ref id="conway_add">Conway Recursive Addition Algorithm</pseudo-ref>
 *   <<PSEUDO id="conway_add">>Conway Recursive Addition Algorithm<<\>>
 */
export class PseudoRef extends HTMLElement {
    static stdColor = '#4f46e5';
    static overColor = '#3730a3';
    static bgColor = '#eef2ff';
    static borderColor = '#c7d2fe';
    constructor() {
        super();
    }
    connectedCallback() {
        const rawHtml = this.innerHTML.trim();
        const algoId = this.getAttribute('id') ||
            this.getAttribute('algo-id') ||
            this.getAttribute('ref') ||
            'conway_add';
        if (!rawHtml) {
            const catalogEntry = PSEUDO_CATALOG[algoId];
            const displayLabel = catalogEntry ? catalogEntry.name : algoId;
            this.innerHTML = `«Alg: ${displayLabel}»`;
        }
        else if (!rawHtml.startsWith('«') &&
            !rawHtml.startsWith('&laquo;') &&
            !rawHtml.startsWith('<<')) {
            this.innerHTML = `«Alg: ${rawHtml}»`;
        }
        this.setAttribute('style', `display:inline-block;color:${PseudoRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:${PseudoRef.borderColor};text-underline-offset:3px;padding:2px 8px;border-radius:4px;background:transparent;transition:background 0.15s, color 0.15s;`);
        this.addEventListener('mouseover', () => {
            this.setAttribute('style', `display:inline-block;color:${PseudoRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:${PseudoRef.stdColor};text-underline-offset:3px;background:${PseudoRef.bgColor};padding:2px 8px;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.05);`);
        });
        this.addEventListener('mouseout', () => {
            this.setAttribute('style', `display:inline-block;color:${PseudoRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:${PseudoRef.borderColor};text-underline-offset:3px;background:transparent;padding:2px 8px;border-radius:4px;`);
        });
        this.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = Nav.indices[Nav.currentIndex];
            const choice = index ? index.choices[index.chosen] : null;
            const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
            const buttonText = `back to ${topicName}`;
            if (!pseudoViewer)
                setPseudoViewer();
            pseudoViewer.showAlgorithm(algoId);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.elt.scrollTop = 0;
            Nav.fo.append(pseudoViewer);
            Nav.display();
            pseudoViewer.layout();
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => pseudoViewer.layout());
            }
        });
    }
}
