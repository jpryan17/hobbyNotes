import { Nav } from './navFW.js';
import { eqDemo, setEqDemo } from './eqDemo.js';
/**
 * PresetRef: Custom Element for inline or block references to Stencil Presets.
 * Syntax: <preset-ref id="preset_12tet_scale" stencil="geom_ladder_step">12-TET Chromatic Pitch Scale (440 Hz)</preset-ref>
 * Or:     <preset-ref id="preset_binary_branching">Binary Tree Population Doubling</preset-ref>
 */
const PRESET_CATALOG_META = {
    '1': { numId: 1, key: 'preset_12tet_scale', title: '12-TET Chromatic Pitch Scale (440 Hz)' },
    'preset_12tet_scale': { numId: 1, key: 'preset_12tet_scale', title: '12-TET Chromatic Pitch Scale (440 Hz)' },
    '2': { numId: 2, key: 'preset_binary_branching', title: 'Binary Tree Node Population Doubling' },
    'preset_binary_branching': { numId: 2, key: 'preset_binary_branching', title: 'Binary Tree Node Population Doubling' },
    '3': { numId: 3, key: 'preset_earth_gravity', title: 'Earth Gravitational Kinematics' },
    'preset_earth_gravity': { numId: 3, key: 'preset_earth_gravity', title: 'Earth Gravitational Kinematics' }
};
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
        const rawId = this.getAttribute('id') || this.getAttribute('preset-id') || '';
        const rawKey = this.getAttribute('key') || this.getAttribute('preset-key') || '';
        const stencilId = this.getAttribute('stencil') || this.getAttribute('equation-key') || this.getAttribute('eq-id') || '';
        const desc = this.getAttribute('desc') || this.getAttribute('title') || '';
        const meta = PRESET_CATALOG_META[rawKey] || PRESET_CATALOG_META[rawId];
        const presetKey = meta ? meta.key : (rawKey || rawId);
        const numId = meta ? meta.numId : (/^\d+$/.test(rawId) ? parseInt(rawId, 10) : null);
        const displayLabel = rawHtml || desc || (meta ? meta.title : presetKey.replace(/^preset_/, '').replace(/_/g, ' ')) || 'Preset';
        const badgeHtml = numId
            ? `<span style="margin-left:5px;font-size:0.75em;background:#ede9fe;color:#4c1d95;padding:1px 5px;border-radius:10px;font-weight:700;">#${numId}</span>`
            : '';
        if (!rawHtml.startsWith('🎛️') && !rawHtml.startsWith('«')) {
            this.innerHTML = `🎛️ <span style="font-weight:600;">${displayLabel}</span>${badgeHtml}`;
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
            // Load target preset key if available, or fall back to stencil ID
            eqDemo.loadEquation(presetKey || stencilId);
            eqDemo.layout();
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => eqDemo.layout());
            }
        });
    }
}
