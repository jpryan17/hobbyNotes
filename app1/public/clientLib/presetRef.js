import { Nav } from './navFW.js';
import { eqDemo, setEqDemo } from './eqDemo.js';
/**
 * PresetRef: Custom Element for inline or block references to Stencil Presets.
 * Syntax: <preset-ref id="preset_12tet_scale" stencil="geom_ladder_step">12-TET Chromatic Pitch Scale (440 Hz)</preset-ref>
 * Or:     <preset-ref id="preset_binary_branching">Binary Tree Population Doubling</preset-ref>
 */
export class PresetRef extends HTMLElement {
    static stdColor = '#6d28d9';
    static overColor = '#4c1d95';
    static stdBg = '#f5f3ff';
    static overBg = '#ede9fe';
    static stdBorder = '#ddd6fe';
    static overBorder = '#c4b5fd';
    constructor() {
        super();
    }
    connectedCallback() {
        const rawHtml = this.innerHTML.trim();
        const presetId = this.getAttribute('id') || this.getAttribute('preset-id') || this.getAttribute('preset-key') || '';
        const stencilId = this.getAttribute('stencil') || this.getAttribute('equation-key') || this.getAttribute('eq-id') || '';
        const desc = this.getAttribute('desc') || this.getAttribute('title') || '';
        const displayLabel = rawHtml || desc || presetId.replace(/^preset_/, '').replace(/_/g, ' ') || 'Preset';
        if (!rawHtml.startsWith('🎛️') && !rawHtml.startsWith('«')) {
            this.innerHTML = `🎛️ <span style="font-weight:600;">${displayLabel}</span>`;
        }
        this.setAttribute('style', `display:inline-flex;align-items:center;gap:4px;color:${PresetRef.stdColor};background:${PresetRef.stdBg};border:1px solid ${PresetRef.stdBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;line-height:1.4;margin:1px 2px;transition:all 0.15s ease;`);
        this.addEventListener('mouseover', () => {
            this.style.background = PresetRef.overBg;
            this.style.color = PresetRef.overColor;
            this.style.borderColor = PresetRef.overBorder;
        });
        this.addEventListener('mouseout', () => {
            this.style.background = PresetRef.stdBg;
            this.style.color = PresetRef.stdColor;
            this.style.borderColor = PresetRef.stdBorder;
        });
        this.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = Nav.indices[Nav.currentIndex];
            const choice = index ? index.choices[index.chosen] : null;
            const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
            const buttonText = `back to ${topicName}`;
            if (!eqDemo)
                setEqDemo();
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.elt.scrollTop = 0;
            Nav.fo.append(eqDemo);
            Nav.display();
            // Load target preset ID if available, or fall back to stencil ID
            eqDemo.loadEquation(presetId || stencilId);
            eqDemo.layout();
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => eqDemo.layout());
            }
        });
    }
}
