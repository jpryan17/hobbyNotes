import { Elt } from './elt.js';
import { Nav } from './navFW.js';
import { BTreeDiagram } from './bTreeDiagram.js';
import { IsoController } from './bTreeControllers.js';
export const BTD_MODE_METADATA = {
    plain: {
        title: '2-Successor Binary Tree (𝕋₂)',
        desc: 'Discrete binary branching with [-] (left) and [+] (right) constructing dyadics and surreal numbers.',
    },
    birthday: {
        title: 'Tree Birthday Levels (ω Generation)',
        desc: 'Constructive generation of surreal tree nodes by discrete birthday stage (0, 1, 2, ...).',
    },
    labeled: {
        title: 'Sign Expansions & Branching Paths',
        desc: 'Conway sign-expansion vectors: root ∅, left [-], right [+], and composite strings.',
    },
    dyadic: {
        title: 'Dyadic Rational Fractions (𝔻 ⊂ ℝ)',
        desc: 'Canonical isomorphism between binary tree sign expansions and dyadic rationals a / 2ᵇ.',
    },
    projected: {
        title: 'Dyadic Number Line Projection',
        desc: 'Vertical geometric projection of tree paths onto the standard real continuum.',
    },
    precision: {
        title: 'Precision Path & Binary Intervals',
        desc: 'Iterative nested interval convergence along an infinite binary sign sequence.',
    },
    subtree: {
        title: 'Binary Subtree Isolation',
        desc: 'Click any node to highlight its left and right descendants as independent subtrees.',
    },
    simplicity: {
        title: 'Conway Simplicity Ordering (≺)',
        desc: 'The simplicity hierarchy: an earlier birthday means strictly simpler (x ≺ y).',
    },
    order: {
        title: 'Surreal Total Order (x ≤ y)',
        desc: 'Inductive total ordering on binary trees: x ≤ y iff no xᴸ ≥ y and no yᴿ ≤ x.',
    },
    cut: {
        title: 'Conway Cut & Number Generation',
        desc: 'Pick left set L and right set R with L < R; the cut constructs the simplest number between them.',
    },
    addition: {
        title: 'Inductive Tree Addition (+)',
        desc: 'Conway inductive addition: x + y = { xᴸ + y, x + yᴸ | xᴿ + y, x + yᴿ }.',
    },
    multiplication: {
        title: 'Inductive Tree Multiplication (·)',
        desc: 'Conway cross-product multiplication: x · y defined recursively on left and right options.',
    },
    isomorphism: {
        title: 'Dyadic Tree Arithmetic & Isomorphism',
        desc: 'Exact correspondence between Conway tree operations and dyadic rational arithmetic.',
    },
    omegaState: {
        title: 'Tree State & Ω-Path Transitions',
        desc: 'State machine transitions and infinite path limits on the 2-successor tree.',
    },
    eulerCompounding: {
        title: 'Dyadic Euler Compounding (exp)',
        desc: 'Discrete dyadic step compounding approaching the exponential continuum.',
    },
};
export class BTD extends Elt {
    modernContainer;
    modernScaleWrapper;
    headerTitleEl;
    headerDescEl;
    diagramMount;
    currentDiagram = null;
    currentMode = 'plain';
    modeButtons = new Map();
    constructor() {
        super('div', 'btd-demo');
        this.modernContainer = document.createElement('div');
        this.modernContainer.className = 'btd-modern-container';
        this.modernContainer.style.cssText =
            'box-sizing: border-box; width: 100%; min-height: 100%; padding: 18px 20px 80px 20px; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; overflow-x: hidden; overflow-y: auto;';
        this.modernScaleWrapper = document.createElement('div');
        this.modernScaleWrapper.className = 'btd-scale-wrapper';
        this.modernScaleWrapper.style.cssText =
            'box-sizing: border-box; width: 940px; transform-origin: top left; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1.5px solid #e2e8f0; padding: 20px; color: #0f172a;';
        this.modernContainer.appendChild(this.modernScaleWrapper);
        this.elt.appendChild(this.modernContainer);
        // Build header
        const headerRow = document.createElement('div');
        headerRow.style.cssText =
            'margin-bottom: 16px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 12px;';
        const badge = document.createElement('div');
        badge.style.cssText =
            'display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;';
        badge.innerHTML = '<span>🌲</span> <span>2-Successor Binary Tree (𝕋₂)</span>';
        headerRow.appendChild(badge);
        this.headerTitleEl = document.createElement('h3');
        this.headerTitleEl.style.cssText =
            'margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;';
        this.headerTitleEl.textContent = '2-Successor Binary Tree (𝕋₂)';
        headerRow.appendChild(this.headerTitleEl);
        this.headerDescEl = document.createElement('div');
        this.headerDescEl.style.cssText = 'font-size: 13px; color: #64748b; line-height: 1.5;';
        this.headerDescEl.textContent =
            'Discrete binary branching with [-] (left) and [+] (right) constructing dyadics and surreal numbers.';
        headerRow.appendChild(this.headerDescEl);
        this.modernScaleWrapper.appendChild(headerRow);
        // Build modern mode selector
        this.buildModeSelector();
        // Diagram mount
        this.diagramMount = document.createElement('div');
        this.diagramMount.id = 'btd-diagram-mount';
        this.diagramMount.style.cssText =
            'width: 900px; margin: 16px auto 0 auto; display: flex; justify-content: center; background: #f8fbff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 8px; box-sizing: border-box; overflow: hidden;';
        this.modernScaleWrapper.appendChild(this.diagramMount);
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('nav-display-resize', () => this.handleResize());
        }
        this.setMode('plain');
    }
    buildModeSelector() {
        const selectorContainer = document.createElement('div');
        selectorContainer.style.cssText =
            'display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;';
        const staticModes = [
            ['plain', 'Plain Tree'],
            ['birthday', 'Birthday Levels'],
            ['labeled', 'Sign Expansions'],
            ['dyadic', 'Dyadic Fractions'],
            ['projected', 'Number Line'],
            ['precision', 'Precision Path'],
        ];
        const interactiveModes = [
            ['subtree', 'Subtrees'],
            ['simplicity', 'Simplicity (≺)'],
            ['order', 'Total Order'],
            ['cut', 'Conway Cut'],
            ['isomorphism', 'Arithmetic (+ ·)'],
            ['omegaState', 'State / Ω'],
            ['eulerCompounding', 'Euler Exp'],
        ];
        const makeRow = (label, modes) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 6px; flex-wrap: wrap;';
            const rowLabel = document.createElement('span');
            rowLabel.style.cssText =
                'font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; width: 88px; flex-shrink: 0;';
            rowLabel.textContent = label;
            row.appendChild(rowLabel);
            modes.forEach(([mode, name]) => {
                const btn = document.createElement('button');
                btn.textContent = name;
                btn.style.cssText =
                    'display: inline-flex; align-items: center; justify-content: center; height: 28px; padding: 0 10px; font-size: 12px; font-weight: 600; border-radius: 5px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; cursor: pointer; transition: all 0.15s ease; user-select: none;';
                btn.addEventListener('click', () => this.setMode(mode));
                btn.addEventListener('mouseover', () => {
                    if (this.currentMode !== mode) {
                        btn.style.background = '#f1f5f9';
                        btn.style.borderColor = '#94a3b8';
                    }
                });
                btn.addEventListener('mouseout', () => {
                    if (this.currentMode !== mode) {
                        btn.style.background = '#ffffff';
                        btn.style.borderColor = '#cbd5e1';
                    }
                });
                this.modeButtons.set(mode, btn);
                row.appendChild(btn);
            });
            return row;
        };
        selectorContainer.appendChild(makeRow('Structural:', staticModes));
        selectorContainer.appendChild(makeRow('Interactive:', interactiveModes));
        this.modernScaleWrapper.appendChild(selectorContainer);
    }
    setMode(mode, customTitle) {
        let targetMode = mode;
        let initialOp;
        if (mode === 'addition') {
            targetMode = 'isomorphism';
            initialOp = '+';
        }
        else if (mode === 'multiplication') {
            targetMode = 'isomorphism';
            initialOp = '\u2217';
        }
        this.currentMode = targetMode;
        const meta = BTD_MODE_METADATA[targetMode] || BTD_MODE_METADATA.plain;
        this.headerTitleEl.textContent = customTitle || meta.title;
        this.headerDescEl.textContent = meta.desc;
        // Update active button styling
        this.modeButtons.forEach((btn, m) => {
            if (m === targetMode ||
                (targetMode === 'isomorphism' && (m === 'addition' || m === 'multiplication'))) {
                btn.style.background = '#0284c7';
                btn.style.borderColor = '#0284c7';
                btn.style.color = '#ffffff';
                btn.style.fontWeight = '700';
            }
            else {
                btn.style.background = '#ffffff';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#475569';
                btn.style.fontWeight = '600';
            }
        });
        // Replace current diagram
        this.diagramMount.innerHTML = '';
        this.currentDiagram = new BTreeDiagram({ mode: targetMode });
        if (initialOp && this.currentDiagram.controller instanceof IsoController) {
            this.currentDiagram.controller.setOp(initialOp);
        }
        this.diagramMount.appendChild(this.currentDiagram.elt);
        this.layout();
    }
    handleResize() {
        this.layout();
    }
    applyScale() {
        if (!this.modernContainer || !this.modernScaleWrapper)
            return;
        let availW = this.modernContainer.clientWidth;
        if (!availW || availW < 100) {
            if (typeof Nav !== 'undefined' && Nav.foWidth) {
                availW = Nav.foWidth;
            }
            else if (typeof window !== 'undefined') {
                availW = window.innerWidth - (typeof Nav !== 'undefined' && Nav.isIndexVisible ? 260 : 30);
            }
        }
        const netAvailW = Math.max(280, availW - 40);
        const targetW = 940;
        const scale = netAvailW < targetW ? Math.max(0.40, netAvailW / targetW) : 1;
        const wrapperStyle = this.modernScaleWrapper.style;
        if ('zoom' in wrapperStyle) {
            wrapperStyle.zoom = String(scale);
            wrapperStyle.transform = '';
        }
        else {
            wrapperStyle.transform = `scale(${scale})`;
        }
    }
    layout() {
        this.applyScale();
    }
}
export let btd;
export function setBTD() {
    if (!btd) {
        btd = new BTD();
    }
    return btd;
}
export function initBTD() {
    setBTD();
    return btd;
}
export function layoutBTD() {
    if (btd) {
        btd.layout();
    }
}
