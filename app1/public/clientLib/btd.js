import { SVGElt, SVGGrpElt, SVGSelectableText, SVGText } from './svgElt.js';
import { Nav } from './navFW.js';
import { BTreeDiagram } from './bTreeDiagram.js';
export class BTD extends SVGElt {
    controlsFrame;
    diagramGroup;
    currentDiagram = null;
    currentMode = 'plain';
    buttons = new Map();
    staticLabel;
    interactiveLabel;
    controlsHeight = 70;
    fontSize = 13;
    constructor() {
        super('svg', 'btd-demo');
        this.controlsFrame = new SVGElt('rect');
        this.controlsFrame.setAA([
            'x',
            0,
            'y',
            0,
            'fill',
            '#f1f5f9',
            'stroke',
            '#cbd5e1',
            'stroke-width',
            1,
            'rx',
            6,
        ]);
        this.append(this.controlsFrame);
        this.staticLabel = new SVGText();
        this.staticLabel.setAA([
            'font-size',
            11,
            'fill',
            '#64748b',
            'stroke',
            'none',
            'font-family',
            'system-ui, sans-serif',
            'font-weight',
            'bold',
        ]);
        this.staticLabel.setV('STATIC VIEWS:');
        this.append(this.staticLabel);
        this.interactiveLabel = new SVGText();
        this.interactiveLabel.setAA([
            'font-size',
            11,
            'fill',
            '#64748b',
            'stroke',
            'none',
            'font-family',
            'system-ui, sans-serif',
            'font-weight',
            'bold',
        ]);
        this.interactiveLabel.setV('INTERACTIVE:');
        this.append(this.interactiveLabel);
        // Build buttons
        this.createButtons();
        // Diagram host group
        this.diagramGroup = new SVGGrpElt();
        this.diagramGroup.move(0, this.controlsHeight + 10);
        this.append(this.diagramGroup);
        // Initial default mode
        this.setMode('plain');
    }
    createButtons() {
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
            ['addition', 'Surreal Add'],
            ['multiplication', 'Surreal Mult'],
            ['isomorphism', 'Isomorphism'],
            ['omegaState', 'State / Ω'],
        ];
        staticModes.forEach(([mode, label]) => {
            const btn = new SVGSelectableText(() => this.setMode(mode), label, true, `btn-${mode}`);
            btn.setA('font-size', this.fontSize);
            btn.setA('font-family', 'system-ui, -apple-system, sans-serif');
            btn.setA('cursor', 'pointer');
            this.buttons.set(mode, btn);
            this.append(btn);
        });
        interactiveModes.forEach(([mode, label]) => {
            const btn = new SVGSelectableText(() => this.setMode(mode), label, true, `btn-${mode}`);
            btn.setA('font-size', this.fontSize);
            btn.setA('font-family', 'system-ui, -apple-system, sans-serif');
            btn.setA('cursor', 'pointer');
            this.buttons.set(mode, btn);
            this.append(btn);
        });
        this.updateButtonStyles();
    }
    updateButtonStyles() {
        this.buttons.forEach((btn, m) => {
            if (m === this.currentMode) {
                btn.color = {
                    std: '#d97706',
                    over: '#b45309',
                    disabled: 'grey',
                    selected: '#d97706',
                };
                btn.setAA(['font-weight', 'bold', 'stroke', '#d97706']);
            }
            else {
                btn.color = {
                    std: '#1e40af',
                    over: '#7c3aed',
                    disabled: 'grey',
                    selected: '#1e40af',
                };
                btn.setAA(['font-weight', 'normal', 'stroke', '#1e40af']);
            }
        });
    }
    setMode(mode) {
        this.currentMode = mode;
        // Update active styling on buttons
        this.updateButtonStyles();
        // Replace current diagram
        this.diagramGroup.removeChildren();
        this.currentDiagram = new BTreeDiagram({ mode });
        this.diagramGroup.append(this.currentDiagram);
        this.layout();
    }
    layout() {
        const totalWidth = Nav.foWidth > 0 ? Nav.foWidth : 900;
        const padding = 10;
        const usableWidth = totalWidth - 2 * padding;
        const labelWidth = 105;
        const itemGap = 16;
        const lineSpacing = 28;
        let curY = 26;
        // Position Row 1: Static Views
        let curX = padding + 12;
        this.staticLabel.setAA(['x', curX, 'y', curY]);
        curX += labelWidth;
        const staticOrder = [
            'plain',
            'birthday',
            'labeled',
            'dyadic',
            'projected',
            'precision',
        ];
        staticOrder.forEach((mode) => {
            const btn = this.buttons.get(mode);
            if (btn) {
                let btnW = 0;
                try {
                    const bb = btn.getBB();
                    if (bb && bb.width > 0)
                        btnW = bb.width;
                }
                catch {
                    // ignore
                }
                if (!btnW) {
                    btnW = (btn.getV() || '').length * 8.0;
                }
                if (curX + btnW > usableWidth - 10 && curX > padding + 12 + labelWidth) {
                    curY += lineSpacing;
                    curX = padding + 12 + labelWidth;
                }
                btn.setAA(['x', curX, 'y', curY]);
                curX += btnW + itemGap;
            }
        });
        // Position Row 2: Interactive Operations
        curY += lineSpacing + 4;
        curX = padding + 12;
        this.interactiveLabel.setAA(['x', curX, 'y', curY]);
        curX += labelWidth;
        const interactiveOrder = [
            'subtree',
            'simplicity',
            'order',
            'cut',
            'addition',
            'multiplication',
            'isomorphism',
            'omegaState',
        ];
        interactiveOrder.forEach((mode) => {
            const btn = this.buttons.get(mode);
            if (btn) {
                let btnW = 0;
                try {
                    const bb = btn.getBB();
                    if (bb && bb.width > 0)
                        btnW = bb.width;
                }
                catch {
                    // ignore
                }
                if (!btnW) {
                    btnW = (btn.getV() || '').length * 8.0;
                }
                if (curX + btnW > usableWidth - 10 && curX > padding + 12 + labelWidth) {
                    curY += lineSpacing;
                    curX = padding + 12 + labelWidth;
                }
                btn.setAA(['x', curX, 'y', curY]);
                curX += btnW + itemGap;
            }
        });
        this.controlsHeight = curY + 16;
        this.controlsFrame.setAA(['x', padding, 'y', 5, 'width', usableWidth, 'height', this.controlsHeight]);
        // Position and scale the active diagram
        if (this.currentDiagram) {
            this.diagramGroup.move(padding, this.controlsHeight + 15);
            this.currentDiagram.scaleToWidth(usableWidth);
            const targetH = (usableWidth / this.currentDiagram.width) * this.currentDiagram.height;
            this.setAA(['width', totalWidth, 'height', Math.ceil(this.controlsHeight + 25 + targetH)]);
        }
        else {
            this.setAA(['width', totalWidth, 'height', this.controlsHeight + 20]);
        }
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
