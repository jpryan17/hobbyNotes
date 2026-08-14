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
            btn.setA('font-family', 'system-ui, sans-serif');
            btn.setA('cursor', 'pointer');
            this.buttons.set(mode, btn);
            this.append(btn);
        });
        interactiveModes.forEach(([mode, label]) => {
            const btn = new SVGSelectableText(() => this.setMode(mode), label, true, `btn-bid-${mode}`);
            btn.setA('font-size', this.fontSize);
            btn.setA('font-family', 'system-ui, sans-serif');
            btn.setA('cursor', 'pointer');
            this.buttons.set(mode, btn);
            this.append(btn);
        });
    }
    setMode(mode) {
        this.currentMode = mode;
        // Update active button styling
        this.buttons.forEach((btn, m) => {
            if (m === mode) {
                btn.setAA(['font-weight', 'bold', 'stroke', '#d97706']);
            }
            else {
                btn.setAA(['font-weight', 'normal', 'stroke', '#1e40af']);
            }
        });
        // Replace current diagram
        this.diagramGroup.removeChildren();
        this.currentDiagram = new BIDDiagram(mode);
        this.diagramGroup.append(this.currentDiagram);
        this.layout();
    }
    layout() {
        const totalWidth = Nav.foWidth > 0 ? Nav.foWidth : 900;
        const padding = 10;
        const usableWidth = totalWidth - 2 * padding;
        this.setAA(['width', totalWidth, 'height', 520]);
        this.controlsFrame.setAA(['x', padding, 'y', 5, 'width', usableWidth, 'height', this.controlsHeight]);
        // Position Row 1: Static Views
        let x1 = padding + 12;
        const y1 = 26;
        this.staticLabel.setAA(['x', x1, 'y', y1]);
        x1 += 95;
        const staticOrder = [
            'transect',
            'filter',
            'mosaic',
            'treeProjection',
        ];
        staticOrder.forEach((mode) => {
            const btn = this.buttons.get(mode);
            if (btn) {
                btn.setAA(['x', x1, 'y', y1]);
                const textLen = (btn.getV() || '').length;
                x1 += textLen * 7.5 + 20;
            }
        });
        // Position Row 2: Interactive Operations
        let x2 = padding + 12;
        const y2 = 56;
        this.interactiveLabel.setAA(['x', x2, 'y', y2]);
        x2 += 95;
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
                btn.setAA(['x', x2, 'y', y2]);
                const textLen = (btn.getV() || '').length;
                x2 += textLen * 7.5 + 20;
            }
        });
        // Scale active diagram
        if (this.currentDiagram) {
            this.diagramGroup.move(padding, this.controlsHeight + 15);
            this.currentDiagram.scaleToWidth(usableWidth);
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
