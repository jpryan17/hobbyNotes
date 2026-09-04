import {
  SVGElt,
  SVGGrpElt,
  SVGText,
  SVGTSpan,
  SVGSelectableText,
  textWidth,
} from './svgElt.js';
import {
  BTreeConfig,
  BTreeMode,
  BTreePalette,
  BTreePresets,
  DEFAULT_PALETTE,
} from './bTreeConfig.js';
import {
  expToId,
  keyToExp,
  setVal,
  nodeKeyToBirthdayLinePos,
  WU,
} from './exputils.js';
import { DR } from './dyadicRationals.js';
import {
  IBTreeController,
  SubtreeController,
  SimplicityController,
  OrderController,
  CutController,
  OpController,
  IsoController,
  OmegaStateController,
} from './bTreeControllers.js';

export class BTreeDiagram extends SVGElt {
  config: BTreeConfig;
  palette: BTreePalette;

  width: number;
  height: number;
  maxBD: number;
  nodeSize: number;
  topRoom: number;
  bottomRoom: number;
  leftRoom: number;
  rightRoom: number;
  fontSize: number;

  treeGroup: SVGGrpElt;
  frameRect?: SVGElt;
  statusLine: SVGText;
  statusSpans: SVGTSpan[] = [];

  // Interaction State
  arity: number;
  state = 0;
  wasVisited: string[] = [];
  controller?: IBTreeController;

  constructor(config: BTreeConfig | BTreeMode) {
    super('svg');

    // Merge preset config with provided overrides
    const baseMode: BTreeMode = typeof config === 'string' ? config : config.mode;
    const preset = BTreePresets[baseMode] || BTreePresets.plain;
    const userConfig = typeof config === 'string' ? { mode: baseMode } : config;

    this.config = { ...preset, ...userConfig };
    this.palette = { ...DEFAULT_PALETTE, ...(this.config.palette || {}) };

    this.width = this.config.width || 900;
    this.height = this.config.height || 420;
    this.maxBD = this.config.maxBD !== undefined ? this.config.maxBD : 6;
    this.nodeSize = this.config.nodeSize !== undefined ? this.config.nodeSize : 6;
    this.fontSize = this.config.fontSize || 12;
    this.topRoom = this.config.topRoom || 20;
    this.bottomRoom = this.config.bottomRoom || 40;
    this.leftRoom = this.config.leftRoom || 20;
    this.rightRoom = this.config.rightRoom || 20;
    this.arity = this.config.arity !== undefined ? this.config.arity : 0;

    this.setAA([
      'width',
      this.width,
      'height',
      this.height,
      'viewBox',
      `0 0 ${this.width} ${this.height}`,
      'style',
      `background-color:${this.palette.bg || '#f8fbff'}`,
    ]);

    // Outer framing
    if (this.config.showFrame !== false) {
      this.frameRect = new SVGElt('rect');
      this.frameRect.setAA([
        'x',
        1,
        'y',
        1,
        'width',
        this.width - 2,
        'height',
        this.height - 2,
        'fill',
        'none',
        'stroke',
        this.palette.frame || '#1565c0',
        'stroke-width',
        2,
        'rx',
        6,
      ]);
      this.append(this.frameRect);
    }

    // Main tree transformation group
    this.treeGroup = new SVGGrpElt();
    this.append(this.treeGroup);

    // Status / Prompt line
    this.statusLine = new SVGText();
    this.statusLine.setAA([
      'x',
      this.leftRoom + 5,
      'y',
      this.height - 18,
      'xml:space',
      'preserve',
      'style',
      'white-space: pre;',
      'font-size',
      Math.max(this.fontSize, 14),
      'font-family',
      'system-ui, -apple-system, sans-serif',
    ]);
    this.append(this.statusLine);

    // Build Diagram Topology
    this.buildTree();

    // Mode-specific initializations
    this.initModeFeatures();

    // Setup Interaction Listeners
    if (this.arity > 0) {
      this.setupEventListeners();
    }
  }

  /**
   * Builds links, nodes, antennas, and static labels
   */
  private buildTree(): void {
    // 1. Links
    for (let i = 0; i < this.maxBD; i++) {
      const levelCount = Math.pow(2, i);
      for (let j = 0; j < levelCount; j++) {
        this.buildNodeLinks(i, j);
      }
    }

    // 2. Antenna rays (beyond maxBD)
    if (this.config.antenna) {
      this.buildAllAntennas();
    }

    // 3. Projections (if mode is projected or precision)
    if (this.config.mode === 'projected') {
      this.buildProjections();
    } else if (this.config.mode === 'precision') {
      this.buildPrecisionProjections(this.config.precisionRoot || '--+');
    }

    // 4. Nodes & Labels
    for (let i = 0; i <= this.maxBD; i++) {
      const levelCount = Math.pow(2, i);
      for (let j = 0; j < levelCount; j++) {
        const key = `K${i}${j}`;
        const [x, y] = this.getNodeCenter(i, j);

        // Node circle
        const node = new SVGElt('circle');
        let fillColor = this.palette.baseNode || '#e6c896';
        if (this.config.mode === 'birthday' && this.palette.birthdayColors) {
          fillColor =
            this.palette.birthdayColors[i % this.palette.birthdayColors.length];
        }

        node.setAA([
          'cx',
          x,
          'cy',
          y,
          'r',
          this.nodeSize,
          'fill',
          fillColor,
          'stroke',
          '#5d4037',
          'stroke-width',
          0.8,
          'class',
          'node',
          'id',
          key,
          'cursor',
          this.arity > 0 ? 'pointer' : 'default',
        ]);
        this.treeGroup.append(node);

        // Node Label (if configured)
        if (this.config.labelType === 'sign') {
          const label = this.getSignExpansionLabel(i, j);
          const fSize = i >= 4 ? 9.5 : (i === 3 ? 10.5 : this.fontSize);
          this.renderNodeText(x, y, label, fSize);
        } else if (this.config.labelType === 'dyadic') {
          const exp = keyToExp(key);
          const label = new DR(exp).format();
          const fSize = label.length > 3 ? 9.5 : this.fontSize;
          this.renderNodeText(x, y, label, fSize);
        }
      }
    }
  }

  private getNodeCenter(bd: number, pos: number): [number, number] {
    const areaWidth = this.width - (this.leftRoom + this.rightRoom);
    const areaHeight = this.height - (this.topRoom + this.bottomRoom);
    const levelSize = areaHeight / (this.maxBD + 1);
    const levelCount = Math.pow(2, bd);
    const levelWidth = areaWidth / levelCount;
    const x = (pos + 0.5) * levelWidth + this.leftRoom;
    const y = this.height - (this.bottomRoom + (bd + 0.5) * levelSize);
    return [x, y];
  }

  private buildNodeLinks(bd: number, pos: number): void {
    const k1 = `K${bd}${pos}K${bd + 1}${pos * 2}`;
    const k2 = `K${bd}${pos}K${bd + 1}${pos * 2 + 1}`;
    const [lx, ly, lxx, lyy] = this.trimLinkCoords(bd, pos, bd + 1, pos * 2);
    const [rx, ry, rxx, ryy] = this.trimLinkCoords(bd, pos, bd + 1, pos * 2 + 1);

    this.createLine(lx, ly, lxx, lyy, this.palette.baseLink || '#c4aa7d', k1);
    this.createLine(rx, ry, rxx, ryy, this.palette.baseLink || '#c4aa7d', k2);
  }

  private trimLinkCoords(
    bd: number,
    pos: number,
    bd1: number,
    pos1: number,
    dir = -1
  ): [number, number, number, number] {
    const [ax, ay] = this.getNodeCenter(bd, pos);
    const [bx, by] = this.getNodeCenter(bd1, pos1);
    const len = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
    const p = this.nodeSize / len;
    const dx = p * (bx - ax);
    const dy = p * (by - ay);
    return [ax + dx, ay + dy, bx + dir * dx, by + dir * dy];
  }

  private buildAllAntennas(): void {
    const levelCount = Math.pow(2, this.maxBD);
    for (let j = 0; j < levelCount; j++) {
      const [x1, y1, xx1, yy1] = this.trimLinkCoords(
        this.maxBD,
        j,
        this.maxBD + 1,
        j * 2,
        -1
      );
      const k1 = `K${this.maxBD}${j}K${this.maxBD + 1}${j * 2}`;
      this.createLine(x1, y1, xx1, yy1, this.palette.antenna || '#c4aa7d', k1, 'antenna');

      const [x2, y2, xx2, yy2] = this.trimLinkCoords(
        this.maxBD,
        j,
        this.maxBD + 1,
        j * 2 + 1,
        -1
      );
      const k2 = `K${this.maxBD}${j}K${this.maxBD + 1}${j * 2 + 1}`;
      this.createLine(x2, y2, xx2, yy2, this.palette.antenna || '#c4aa7d', k2, 'antenna');
    }
  }

  private buildProjections(): void {
    const baselineY = this.height - 0.5 * this.bottomRoom;
    for (let i = 0; i <= this.maxBD; i++) {
      for (let j = 0; j < Math.pow(2, i); j++) {
        const [x, y] = this.getNodeCenter(i, j);
        this.createLine(
          x,
          y + this.nodeSize,
          x,
          baselineY,
          this.palette.projectionLine || '#b0bec5',
          undefined,
          'projection'
        );
      }
    }
    // Baseline axis
    this.createLine(
      this.leftRoom,
      baselineY,
      this.width - this.rightRoom,
      baselineY,
      '#455a64',
      undefined,
      'axis'
    );
  }

  private buildPrecisionProjections(rootNode: string): void {
    const baselineY = this.height - 0.5 * this.bottomRoom;
    const nodes = this.getSubtreeNodes(rootNode);
    const endNode = rootNode.substring(0, rootNode.length - 1);
    const beginNode = rootNode.substring(0, rootNode.length - 2);

    for (let i = 0; i <= this.maxBD; i++) {
      for (let j = 0; j < Math.pow(2, i); j++) {
        const key = `K${i}${j}`;
        const exp = keyToExp(key);
        const [x, y] = this.getNodeCenter(i, j);

        if (exp === beginNode || exp === endNode) {
          this.setNodeColor(key, '#212121');
        }
        if (nodes.includes(exp)) {
          this.setNodeColor(key, '#c62828');
          this.createLine(x, y, x, baselineY, '#ef9a9a', undefined, 'projection');
        } else {
          this.createLine(x, y, x, baselineY, '#e0e0e0', undefined, 'projection');
        }
      }
    }
  }

  private getSignExpansionLabel(bd: number, lp: number): string {
    const len = Math.pow(2, bd);
    let sign = WU.plus;
    if (lp >= len / 2) {
      sign = WU.minus;
      lp = len - lp - 1;
    }
    const expansion = WU.plus.repeat(bd).split('');
    let signPos = bd - 1;
    while (signPos > 0) {
      if (lp % 2 > 0) {
        expansion[signPos] = WU.minus;
      }
      lp = Math.floor(lp / 2);
      signPos--;
    }
    if (sign === WU.plus) {
      for (let i = 0; i < bd; i++) {
        expansion[i] = expansion[i] === WU.plus ? WU.minus : WU.plus;
      }
    }
    const exp = expansion.join('');
    return exp === '' ? '[ ]' : `[${exp}]`;
  }

  private renderNodeText(cx: number, cy: number, text: string, fontSize: number): void {
    const nodeLabel = new SVGText();
    nodeLabel.setAA([
      'x',
      cx,
      'y',
      cy,
      'text-anchor',
      'middle',
      'dominant-baseline',
      'central',
      'fill',
      '#212121',
      'stroke',
      'none',
      'font-size',
      fontSize,
      'font-family',
      'monospace',
      'font-weight',
      'bold',
      'pointer-events',
      'none',
    ]);
    nodeLabel.setV(text);
    this.treeGroup.append(nodeLabel);
  }

  private estimateTextWidth(text: string, fontSize: number): number {
    try {
      const w = textWidth(text, fontSize);
      if (w > 0) return w;
    } catch {
      // ignore
    }
    return text.length * fontSize * 0.58;
  }

  private createLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    id?: string,
    cls = 'link'
  ): SVGElt {
    const ln = new SVGElt('line');
    ln.setAA([
      'x1',
      x1,
      'y1',
      y1,
      'x2',
      x2,
      'y2',
      y2,
      'stroke',
      stroke,
      'stroke-width',
      cls === 'axis' ? 2 : 1.2,
      'class',
      cls,
    ]);
    if (id) ln.setA('id', id);
    this.treeGroup.append(ln);
    return ln;
  }

  /**
   * Initializes the corresponding interactive controller
   */
  private initModeFeatures(): void {
    switch (this.config.mode) {
      case 'subtree':
        this.controller = new SubtreeController(this);
        break;
      case 'simplicity':
        this.controller = new SimplicityController(this);
        break;
      case 'order':
        this.controller = new OrderController(this);
        break;
      case 'cut':
        this.controller = new CutController(this);
        break;
      case 'addition':
        this.controller = new OpController(this, '+');
        break;
      case 'multiplication':
        this.controller = new OpController(this, '\u2217');
        break;
      case 'isomorphism':
        this.controller = new IsoController(this);
        break;
      case 'omegaState':
        this.controller = new OmegaStateController(this);
        break;
      default:
        break;
    }

    if (this.controller) {
      this.controller.init();
    }
  }

  /**
   * Event handling for interactive node selections
   */
  private setupEventListeners(): void {
    this.elt.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.getAttributeNS(null, 'class') === 'node') {
        const key = target.id;
        if (this.arity === 1) {
          this.wasVisited = [key];
          if (this.controller) this.controller.onProcess(this.wasVisited);
        } else if (this.state === 0) {
          this.wasVisited = [key];
          this.state = 1;
          if (this.controller && this.controller.onFirstSelect) {
            this.controller.onFirstSelect(key);
          }
        } else if (this.state === 1 && key !== this.wasVisited[0]) {
          this.wasVisited.push(key);
          this.state = 2;
          if (this.controller) this.controller.onProcess(this.wasVisited);
        }
      } else {
        // Click on background resets
        this.clearHighlights();
        this.wasVisited = [];
        this.state = 0;
        if (this.controller) this.controller.onClear();
      }
    });

    this.elt.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.getAttributeNS(null, 'class') === 'node') {
        const key = target.id;
        if (!this.wasVisited.includes(key)) {
          target.setAttributeNS(null, 'fill', this.palette.hoverNode || '#ff80ab');
        }
      }
    });

    this.elt.addEventListener('mouseout', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.getAttributeNS(null, 'class') === 'node') {
        const key = target.id;
        if (!this.wasVisited.includes(key)) {
          let base = this.palette.baseNode || '#e6c896';
          if (this.config.mode === 'birthday' && this.palette.birthdayColors) {
            const bd = Number(key.substring(1, 2));
            base = this.palette.birthdayColors[bd % this.palette.birthdayColors.length];
          }
          target.setAttributeNS(null, 'fill', base);
        }
      }
    });
  }

  // --- Public Manipulation API ---

  setNodeColor(key: string, color: string): void {
    const node = this.getTreeNode(key);
    if (node) node.setA('fill', color);
  }

  setNodeColorByExp(exp: string, color: string): void {
    const key = expToId(exp);
    this.setNodeColor(key, color);
  }

  setLinkColor(key: string, color: string): void {
    const link = this.getTreeLink(key);
    if (link) link.setA('stroke', color);
  }

  setDirectionAntenna(exp: string, color = '#000000'): void {
    const key = expToId(exp.substring(0, this.maxBD + 1));
    const [bd, pos] = nodeKeyToBirthdayLinePos(key);
    const basePos = pos % 2 === 0 ? pos / 2 : (pos - 1) / 2;
    const baseKey = `K${bd - 1}${basePos}${key}`;
    const antenna = this.getTreeLink(baseKey);
    if (antenna) antenna.setA('stroke', color);
  }

  getTreeNode(key: string): SVGElt | undefined {
    const nodes = Array.from(this.treeGroup.children()) as SVGElt[];
    return nodes.find((n) => n.getA('id') === key && n.getA('class') === 'node');
  }

  getTreeLink(key: string): SVGElt | undefined {
    const links = Array.from(this.treeGroup.children()) as SVGElt[];
    return links.find(
      (n) => n.getA('id') === key && (n.getA('class') === 'link' || n.getA('class') === 'antenna')
    );
  }

  getSubtreeNodes(rootExp: string): string[] {
    let currentLength = rootExp.length;
    const nodes: string[] = [rootExp];
    while (currentLength < this.maxBD) {
      const added: string[] = [];
      nodes.forEach((e) => {
        if (e.length === currentLength) {
          added.push(e.concat('-'));
          added.push(e.concat('+'));
        }
      });
      nodes.push(...added);
      currentLength++;
    }
    return nodes;
  }

  traceAscendingPath(targetKey: string, nodeColor: string, linkColor: string): string[] {
    const exp = keyToExp(targetKey);
    const pathKeys: string[] = ['K00'];

    // Highlight root node at birthday 0
    this.setNodeColor('K00', nodeColor);

    for (let d = 1; d <= exp.length; d++) {
      const subExp = exp.substring(0, d);
      const childKey = expToId(subExp);
      pathKeys.push(childKey);
      this.setNodeColor(childKey, nodeColor);

      const parentExp = exp.substring(0, d - 1);
      const parentKey = d === 1 ? 'K00' : expToId(parentExp);
      const linkKey = `${parentKey}${childKey}`;
      this.setLinkColor(linkKey, linkColor);
    }
    return pathKeys;
  }

  highlightSubtreeCone(rootKey: string, nodeColor: string, linkColor: string): string[] {
    const rootExp = keyToExp(rootKey);
    const descendantExps = this.getSubtreeNodes(rootExp);
    const keys: string[] = [];

    descendantExps.forEach((e) => {
      const k = expToId(e);
      keys.push(k);
      this.setNodeColor(k, nodeColor);

      if (e.length > rootExp.length) {
        const parentExp = e.substring(0, e.length - 1);
        const parentKey = parentExp.length === 0 ? 'K00' : expToId(parentExp);
        const linkKey = `${parentKey}${k}`;
        this.setLinkColor(linkKey, linkColor);
      }
    });

    return keys;
  }

  clearHighlights(): void {
    const elements = Array.from(this.treeGroup.children()) as SVGElt[];
    elements.forEach((el) => {
      const cls = el.getA('class');
      if (cls === 'node') {
        const id = el.getA('id') || '';
        let base = this.palette.baseNode || '#e6c896';
        if (this.config.mode === 'birthday' && this.palette.birthdayColors) {
          const bd = Number(id.substring(1, 2));
          base = this.palette.birthdayColors[bd % this.palette.birthdayColors.length];
        }
        el.setA('fill', base);
      } else if (cls === 'link' || cls === 'antenna') {
        el.setA('stroke', this.palette.baseLink || '#c4aa7d');
      }
    });
  }

  setStatusPrompt(segments: [string, string][]): void {
    this.statusLine.clear();
    this.statusLine.setAA([
      'x',
      this.leftRoom + 5,
      'y',
      this.height - 18,
      'xml:space',
      'preserve',
      'style',
      'white-space: pre;',
    ]);
    segments.forEach(([txt, color]) => {
      const span = new SVGTSpan(this.statusLine);
      span.setV(txt);
      span.setAA(['fill', color, 'stroke', 'none']);
    });
  }

  /**
   * Responsive layout scaling based on container width
   */
  scaleToWidth(availableWidth: number): void {
    const targetW = Math.max(300, availableWidth - 20);
    const sx = Math.min(targetW / this.width, 1);
    const targetH = sx * this.height;

    this.setAA(['width', targetW, 'height', targetH]);
    this.treeGroup.setA('transform', '');
    if (this.frameRect) {
      this.frameRect.setAA(['width', this.width - 2, 'height', this.height - 2]);
    }
  }
}

/**
 * Convenience Factory Helper
 */
export function createBTree(
  container: HTMLElement | string,
  config: BTreeConfig | BTreeMode
): BTreeDiagram {
  const target =
    typeof container === 'string'
      ? (document.getElementById(container) as HTMLElement)
      : container;
  if (!target) {
    throw new Error(`Target container not found: ${container}`);
  }

  target.innerHTML = '';
  const diagram = new BTreeDiagram(config);
  target.appendChild(diagram.elt);
  return diagram;
}
