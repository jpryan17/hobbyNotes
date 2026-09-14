import { Nav } from './navFW.js';
import { Elt } from './elt.js';
import { casDemo, setCasDemo } from './casDemo.js';
import { ArgumentCard } from './argumentCard.js';
import { getScaffoldReflection, SCAFFOLD_REGISTRY } from './scaffoldReflection.js';
import { FS_CATALOG } from './fsCatalog.js';
export class CasRef extends HTMLElement {
    static stdColor = '#047857';
    static overColor = '#064e3b';
    constructor() {
        super();
    }
    connectedCallback() {
        const rawHtml = this.innerHTML.trim();
        if (!rawHtml) {
            const calcId = this.getAttribute('calc-id') || this.getAttribute('calcId') || 'Calculation';
            this.innerHTML = `&lt;&lt;CAS: ${calcId}&gt;&gt;`;
        }
        else if (!rawHtml.startsWith('&lt;&lt;') && !rawHtml.startsWith('<<') && !rawHtml.startsWith('«')) {
            this.innerHTML = `&lt;&lt;CAS: ${rawHtml}&gt;&gt;`;
        }
        this.setAttribute('style', `display:inline-block;color:${CasRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#34d399;text-underline-offset:3px;padding:2px 6px;border-radius:4px;transition:background 0.15s, color 0.15s;`);
        this.addEventListener('mouseover', () => {
            this.setAttribute('style', `display:inline-block;color:${CasRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#059669;text-underline-offset:3px;background:#ecfdf5;padding:2px 6px;border-radius:4px;`);
        });
        this.addEventListener('mouseout', () => {
            this.setAttribute('style', `display:inline-block;color:${CasRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#34d399;text-underline-offset:3px;background:transparent;padding:2px 6px;border-radius:4px;`);
        });
        this.addEventListener('click', (e) => {
            e.stopPropagation();
            const calcId = this.getAttribute('calc-id') || this.getAttribute('calcId') || 'r_diff';
            const expr = this.getAttribute('expr') || '';
            const index = Nav.indices[Nav.currentIndex];
            const choice = index ? index.choices[index.chosen] : null;
            const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
            const buttonText = `back to ${topicName}`;
            // 1. Resolve calcId against FS Catalog (examples/presets, modes, or statements)
            const cleanId = calcId.trim().toLowerCase();
            const matchedExample = FS_CATALOG.examples.find((ex) => (ex.presetKey && ex.presetKey.toLowerCase() === cleanId) || ex.id.toLowerCase() === cleanId);
            const matchedMode = FS_CATALOG.calculationModes.find((m) => m.id.toLowerCase() === cleanId || m.id === matchedExample?.modeId);
            const matchedStatement = FS_CATALOG.formalStatements.find((s) => s.id === (matchedExample?.statementId || matchedMode?.statementId) ||
                s.id.toLowerCase() === cleanId ||
                s.scaffoldKey.toLowerCase() === cleanId);
            const scaffoldKey = matchedStatement?.scaffoldKey ||
                (SCAFFOLD_REGISTRY[calcId] ? calcId : null) ||
                (matchedExample?.statementId ? matchedStatement?.scaffoldKey : null);
            // If a corresponding scaffold or catalog statement exists, open the unified ArgumentCard surface
            if (scaffoldKey || matchedStatement) {
                const resolvedKey = scaffoldKey || calcId;
                const cardTitle = this.innerText.replace(/^<<CAS:\s*/, '').replace(/>>$/, '').trim() ||
                    matchedStatement?.title ||
                    'Formal Calculation Stencil';
                const formalArg = getScaffoldReflection(resolvedKey, cardTitle);
                if (matchedStatement && !formalArg.expression) {
                    formalArg.expression = matchedStatement.expression;
                }
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                Nav.setLastVisit();
                Nav.addNavLineBackButton(buttonText);
                Nav.fo.removeChildren();
                Nav.fo.elt.scrollTop = 0;
                Nav.fo.setA('style', 'overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:16px 20px 80px 20px;');
                const scrollWrap = new Elt('div');
                scrollWrap.setA('style', 'width:100%;min-height:100%;box-sizing:border-box;display:flow-root;padding-bottom:60px;');
                scrollWrap.append(new ArgumentCard(formalArg, {
                    autoOpenCalculator: true,
                    presetKey: matchedExample ? (matchedExample.presetKey || matchedExample.id) : calcId
                }));
                Nav.fo.append(scrollWrap);
                if (Nav.fo && Nav.fo.elt) {
                    Nav.fo.elt.removeEventListener('scroll', Nav.onFoScroll);
                    Nav.fo.elt.addEventListener('scroll', Nav.onFoScroll);
                    Nav.fo.elt.removeEventListener('toggle', Nav.onFoScroll, true);
                    Nav.fo.elt.addEventListener('toggle', Nav.onFoScroll, true);
                }
                Nav.display();
                return;
            }
            // Fallback to legacy detached casDemo if no scaffold or catalog link is established
            if (!casDemo)
                setCasDemo();
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.append(casDemo);
            Nav.display();
            casDemo.loadCalculation(calcId, expr);
            casDemo.layout();
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => casDemo.layout());
            }
        });
    }
}
