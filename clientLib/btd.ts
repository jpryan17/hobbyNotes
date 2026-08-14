import { SVGElt, SVGGrpElt, SVGSelectableText, SVGText } from './svgElt.js';
import { Nav } from './navFW.js';
import { BTreeDiagram } from './bTreeDiagram.js';
import { BTreeMode } from './bTreeConfig.js';

export class BTD extends SVGElt {
  controlsFrame: SVGElt;
  diagramGroup: SVGGrpElt;
  currentDiagram: BTreeDiagram | null = null;
  currentMode: BTreeMode = 'plain';

  buttons: Map<BTreeMode, SVGSelectableText> = new Map();
  staticLabel: SVGText;
  interactiveLabel: SVGText;

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

  private createButtons(): void {
    const staticModes: [BTreeMode, string][] = [
      ['plain', 'Plain Tree'],
      ['birthday', 'Birthday Levels'],
      ['labeled', 'Sign Expansions'],
      ['dyadic', 'Dyadic Fractions'],
      ['projected', 'Number Line'],
      ['precision', 'Precision Path'],
    ];

    const interactiveModes: [BTreeMode, string][] = [
      ['subtree', 'Subtrees'],
      ['simplicity', 'Simplicity (<s)'],
      ['order', 'Total Order (<)'],
      ['cut', 'Conway Cut (L|R)'],
      ['addition', 'Surreal Add (+)'],
      ['multiplication', 'Surreal Mult (*)'],
      ['isomorphism', 'Dyadic Isomorphism'],
      ['omegaState', 'State/Ω Inspector'],
    ];

    staticModes.forEach(([mode, label]) => {
      const btn = new SVGSelectableText(
        () => this.setMode(mode),
        label,
        true,
        `btn-${mode}`
      );
      btn.setA('font-size', this.fontSize);
      btn.setA('font-family', 'system-ui, sans-serif');
      btn.setA('cursor', 'pointer');
      this.buttons.set(mode, btn);
      this.append(btn);
    });

    interactiveModes.forEach(([mode, label]) => {
      const btn = new SVGSelectableText(
        () => this.setMode(mode),
        label,
        true,
        `btn-${mode}`
      );
      btn.setA('font-size', this.fontSize);
      btn.setA('font-family', 'system-ui, sans-serif');
      btn.setA('cursor', 'pointer');
      this.buttons.set(mode, btn);
      this.append(btn);
    });
  }

  setMode(mode: BTreeMode): void {
    this.currentMode = mode;

    // Update active styling on buttons
    this.buttons.forEach((btn, m) => {
      if (m === mode) {
        btn.setAA(['font-weight', 'bold', 'stroke', '#d97706']);
      } else {
        btn.setAA(['font-weight', 'normal', 'stroke', '#1e40af']);
      }
    });

    // Replace current diagram
    this.diagramGroup.removeChildren();
    this.currentDiagram = new BTreeDiagram({ mode });
    this.diagramGroup.append(this.currentDiagram);

    this.layout();
  }

  layout(): void {
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

    const staticOrder: BTreeMode[] = [
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
        btn.setAA(['x', x1, 'y', y1]);
        const textLen = (btn.getV() || '').length;
        x1 += textLen * 7.5 + 16;
      }
    });

    // Position Row 2: Interactive Operations
    let x2 = padding + 12;
    const y2 = 56;
    this.interactiveLabel.setAA(['x', x2, 'y', y2]);
    x2 += 95;

    const interactiveOrder: BTreeMode[] = [
      'subtree',
      'simplicity',
      'order',
      'cut',
      'addition',
      'multiplication',
      'isomorphism',
    ];

    interactiveOrder.forEach((mode) => {
      const btn = this.buttons.get(mode);
      if (btn) {
        btn.setAA(['x', x2, 'y', y2]);
        const textLen = (btn.getV() || '').length;
        x2 += textLen * 7.5 + 16;
      }
    });

    // Position and scale the active diagram
    if (this.currentDiagram) {
      this.diagramGroup.move(padding, this.controlsHeight + 15);
      this.currentDiagram.scaleToWidth(usableWidth);
    }
  }
}

export let btd: BTD;

export function setBTD(): BTD {
  if (!btd) {
    btd = new BTD();
  }
  return btd;
}

export function initBTD(): BTD {
  setBTD();
  return btd;
}

export function layoutBTD(): void {
  if (btd) {
    btd.layout();
  }
}
