// clientLib/fsRef.ts
// FSRef: Unified Custom Element for inline or block references to Middle Way Formal Statements & Theorems.
// Syntax:
//   <fs-ref id="3" desc="Telescoping Fundamental Theorem of Calculus"></fs-ref>
//   <fs-ref id="22" desc="The Core Dyadic Isomorphism (Tree2 ≡ 𝔻)"></fs-ref>
import { FSDRef } from './fsdRef.js';
import { FS_CATALOG } from './fsCatalog.js';
export class FSRef extends HTMLElement {
    static stdColor = '#0369a1';
    static overColor = '#0284c7';
    static stdBg = '#f0f9ff';
    static overBg = '#e0f2fe';
    static stdBorder = '#bae6fd';
    static overBorder = '#7dd3fc';
    constructor() {
        super();
    }
    connectedCallback() {
        const rawId = this.getAttribute('id') || this.getAttribute('scaffold') || this.getAttribute('statement-id') || '';
        const desc = this.getAttribute('desc') || this.getAttribute('title') || '';
        const cleanId = rawId.trim();
        const isNum = /^\d+$/.test(cleanId);
        const numVal = isNum ? parseInt(cleanId, 10) : -1;
        // Look up in catalog to determine active vs. inactive and canonical title
        const stmt = FS_CATALOG.formalStatements.find((s, idx) => (isNum && (s.numId === numVal || idx === numVal - 1)) ||
            s.id === cleanId ||
            s.scaffoldKey === cleanId ||
            s.id.toLowerCase() === cleanId.toLowerCase());
        // FAIL-FAST: If ID does not exist in FS_CATALOG, fail visibly with an error badge
        if (!stmt) {
            const errLabel = desc || (cleanId ? `ID "${cleanId}"` : 'Missing ID');
            this.innerHTML = `<span style="font-size:0.88em;margin-right:3px;">⚠️</span><span style="opacity:0.85;">${errLabel}</span><span style="margin-left:5px;font-size:0.75em;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:10px;font-weight:700;">Unresolved FS</span>`;
            this.setAttribute('style', 'display:inline-flex;align-items:center;gap:3px;color:#991b1b;background:#fef2f2;border:1.5px dashed #f87171;font-weight:600;font-size:0.92em;cursor:not-allowed;padding:2px 8px;border-radius:6px;line-height:1.4;margin:1px 2px;');
            this.setAttribute('title', `Error: Formal Statement id="${cleanId}" is not registered in FS_CATALOG. Statements must be constructed and verified in Dev/DB first.`);
            this.addEventListener('click', (e) => {
                e.stopPropagation();
                alert(`❌ Unresolved Formal Statement [id="${cleanId}"]\n\nThis ID does not exist in FS_CATALOG.\n\nUnder Middle Way Architecture, formal statements must be constructed, verified against the Lean Scaffold, and registered in the database before they can be referenced.`);
            });
            return;
        }
        const isActive = stmt.statementKind === 'directed_equality' ||
            FS_CATALOG.calculationModes.some(m => m.statementId === stmt.id) ||
            !!stmt.pseudoAlgoId;
        const icon = isActive ? '⚡' : '📜';
        const displayLabel = desc || stmt.title || (cleanId ? `Statement #${cleanId}` : 'Formal Statement');
        const badgeLabel = stmt.numId ? `#${stmt.numId}` : (isNum ? `#${cleanId}` : '');
        const rawHtml = this.innerHTML.trim();
        if (!rawHtml) {
            this.innerHTML = `<span style="font-size:0.88em;opacity:0.9;margin-right:3px;">${icon}</span><span>${displayLabel}</span>${badgeLabel ? `<span style="margin-left:5px;font-size:0.75em;background:${isActive ? '#ede9fe' : '#e0f2fe'};color:${isActive ? '#6b21a8' : '#0369a1'};padding:1px 5px;border-radius:10px;font-weight:700;">${badgeLabel}</span>` : ''}`;
        }
        const baseBg = isActive ? '#faf5ff' : FSRef.stdBg;
        const baseBorder = isActive ? '#e9d5ff' : FSRef.stdBorder;
        const baseColor = isActive ? '#6b21a8' : FSRef.stdColor;
        const hoverBg = isActive ? '#f3e8ff' : FSRef.overBg;
        const hoverBorder = isActive ? '#d8b4fe' : FSRef.overBorder;
        this.setAttribute('style', `display:inline-flex;align-items:center;gap:3px;color:${baseColor};background:${baseBg};border:1px solid ${baseBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;text-decoration:none;line-height:1.4;margin:1px 2px;`);
        this.addEventListener('mouseover', () => {
            this.setAttribute('style', `display:inline-flex;align-items:center;gap:3px;color:${baseColor};background:${hoverBg};border:1px solid ${hoverBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-decoration:none;line-height:1.4;margin:1px 2px;`);
        });
        this.addEventListener('mouseout', () => {
            this.setAttribute('style', `display:inline-flex;align-items:center;gap:3px;color:${baseColor};background:${baseBg};border:1px solid ${baseBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;text-decoration:none;line-height:1.4;margin:1px 2px;`);
        });
        this.addEventListener('click', (e) => {
            e.stopPropagation();
            const algoAttr = this.getAttribute('algo') || '';
            FSDRef.openScaffoldCard(cleanId || rawId, desc, { algoKey: algoAttr });
        });
    }
}
