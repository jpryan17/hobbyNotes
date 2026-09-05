import { SVGElt, SVGGrpElt, SVGSelectableText, SVGText, } from './svgElt.js';
import { Nav } from './navFW.js';
import { BIDDiagram } from './bidDiagram.js';
export class BID extends SVGElt {
    controlsFrame;
    diagramGroup;
    currentDiagram = null;
    currentMode = 'transect';
    buttons = new Map();
    staticLabel;
    interactiveLabel;
    controlsHeight = 70;
    fontSize = 13;
    constructor() {
        super('svg', 'bid-demo');
        this.controlsFrame = new SVGElt('rect');
        this.controlsFrame.setAA([
            'x', 0,
            'y', 0,
            'fill', '#f1f5f9',
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'rx', 6,
        ]);
        this.append(this.controlsFrame);
        this.staticLabel = new SVGText();
        this.staticLabel.setAA([
            'font-size', 11,
            'fill', '#64748b',
            'stroke', 'none',
            'font-family', 'system-ui, sans-serif',
            'font-weight', 'bold',
        ]);
        this.staticLabel.setV('STATIC VIEWS:');
        this.append(this.staticLabel);
        this.interactiveLabel = new SVGText();
        this.interactiveLabel.setAA([
            'font-size', 11,
            'fill', '#64748b',
            'stroke', 'none',
            'font-family', 'system-ui, sans-serif',
            'font-weight', 'bold',
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
        this.setMode('stateTree');
    }
    createButtons() {
        const staticModes = [
            ['transect', 'Transect Lattice'],
            ['filter', '3-Stage Filter'],
            ['mosaic', '2D Joint Mosaic'],
            ['treeProjection', 'Tree-to-Transect'],
        ];
        const interactiveModes = [
            ['stateTree', 'Head/Tail Tree (Ω)'],
            ['sequential', 'Sequential Stream'],
            ['oddsGauge', 'Odds Balance'],
            ['continuous', 'Beta-Binomial'],
            ['baseRate', 'Base Rate Test'],
        ];
        staticModes.forEach(([mode, label]) => {
            const btn = new SVGSelectableText(() => this.setMode(mode), label, true, `btn-bid-${mode}`);
            btn.setA('font-size', this.fontSize);
            btn.setA('font-family', 'system-ui, -apple-system, sans-serif');
            btn.setA('cursor', 'pointer');
            this.buttons.set(mode, btn);
            this.append(btn);
        });
        interactiveModes.forEach(([mode, label]) => {
            const btn = new SVGSelectableText(() => this.setMode(mode), label, true, `btn-bid-${mode}`);
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
        this.updateButtonStyles();
        // Replace current diagram
        this.diagramGroup.removeChildren();
        this.currentDiagram = new BIDDiagram(mode);
        this.diagramGroup.append(this.currentDiagram);
        this.layout();
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => this.layout());
        }
    }
    layout() {
        const totalWidth = Nav.foWidth > 0 ? Nav.foWidth : 900;
        const padding = 10;
        const usableWidth = totalWidth - 2 * padding;
        const labelWidth = 105;
        const itemGap = 18;
        const lineSpacing = 28;
        let curY = 26;
        // Position Row 1: Static Views
        let curX = padding + 12;
        this.staticLabel.setAA(['x', curX, 'y', curY]);
        curX += labelWidth;
        const staticOrder = [
            'transect',
            'filter',
            'mosaic',
            'treeProjection',
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
                    btnW = (btn.getV() || '').length * 9.0;
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
            'stateTree',
            'sequential',
            'oddsGauge',
            'continuous',
            'baseRate',
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
                    btnW = (btn.getV() || '').length * 9.0;
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
        // Position and scale active diagram
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
export let bid;
export function setBID() {
    if (!bid) {
        bid = new BID();
    }
    return bid;
}
export function initBID() {
    setBID();
    return bid;
}
export function layoutBID() {
    if (bid) {
        bid.layout();
    }
}
