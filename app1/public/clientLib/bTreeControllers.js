import { expToId, keyToExp, setExp, setVal, nodeKeyToBirthdayLinePos, } from './exputils.js';
import { DR } from './dyadicRationals.js';
import { dyadicMachine } from './dyadicMachine.js';
import { SVGElt, SVGGrpElt } from './svgElt.js';
import { pseudoViewer, setPseudoViewer } from './pseudoViewer.js';
import { Nav } from './navFW.js';
/**
 * Shared Rule Gateway: Opens the Pseudocode Viewer and activates a specific algorithm,
 * scrolling to top, creating the navigation back button, and executing responsive layout.
 */
export function openRuleGateway(algoId, label, funcName, args) {
    const index = Nav.indices[Nav.currentIndex];
    const choice = index && index.choices ? index.choices[index.chosen] : null;
    const topicName = choice && choice[0] ? choice[0].topic : 'binary tree';
    const buttonText = `back to ${topicName}`;
    if (!pseudoViewer)
        setPseudoViewer();
    if (label && funcName && args && args.length > 0) {
        pseudoViewer.showAlgorithmWithArgs(algoId, label, funcName, args);
    }
    else {
        pseudoViewer.showAlgorithm(algoId);
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    Nav.setLastVisit();
    Nav.addNavLineBackButton(buttonText);
    Nav.fo.removeChildren();
    Nav.fo.elt.scrollTop = 0;
    Nav.fo.append(pseudoViewer);
    Nav.display();
    pseudoViewer.layout();
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => pseudoViewer.layout());
    }
}
/**
 * Creates an interactive SVG rounded pill button with hover and active states.
 * Flagged with data-ctrl="true" to prevent background tree clicks from clearing selection.
 */
export function createPillButton(parent, x, y, w, h, label, onClick, title) {
    const grp = new SVGGrpElt();
    grp.setAA([
        'transform', `translate(${x}, ${y})`,
        'cursor', 'pointer',
        'data-ctrl', 'true',
        'class', 'diagram-control',
    ]);
    if (title) {
        const titleEl = new SVGElt('title');
        titleEl.setV(title);
        grp.append(titleEl);
    }
    const rect = new SVGElt('rect');
    rect.setAA([
        'x', 0,
        'y', 0,
        'width', w,
        'height', h,
        'rx', h / 2,
        'fill', '#ffffff',
        'stroke', '#cbd5e1',
        'stroke-width', 1.2,
        'data-ctrl', 'true',
    ]);
    grp.append(rect);
    const txt = new SVGElt('text');
    txt.setAA([
        'x', w / 2,
        'y', h / 2 + 0.5,
        'text-anchor', 'middle',
        'dominant-baseline', 'central',
        'font-size', 11,
        'font-weight', '600',
        'font-family', 'system-ui, -apple-system, sans-serif',
        'fill', '#475569',
        'pointer-events', 'none',
        'data-ctrl', 'true',
    ]);
    txt.setV(label);
    grp.append(txt);
    let isActive = false;
    let currentActiveColor = '#1e40af';
    const updateColors = (isHover) => {
        if (isActive) {
            rect.setAA([
                'fill', currentActiveColor,
                'stroke', currentActiveColor,
            ]);
            txt.setAA(['fill', '#ffffff', 'font-weight', '700']);
        }
        else if (isHover) {
            rect.setAA([
                'fill', '#e2e8f0',
                'stroke', '#94a3b8',
            ]);
            txt.setAA(['fill', '#0f172a', 'font-weight', '600']);
        }
        else {
            rect.setAA([
                'fill', '#ffffff',
                'stroke', '#cbd5e1',
            ]);
            txt.setAA(['fill', '#475569', 'font-weight', '600']);
        }
    };
    grp.elt.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    grp.elt.addEventListener('mouseenter', () => updateColors(true));
    grp.elt.addEventListener('mouseleave', () => updateColors(false));
    parent.append(grp);
    return {
        group: grp,
        rect,
        text: txt,
        setLabel: (newLabel) => {
            txt.setV(newLabel);
        },
        setActive: (active, activeColor = '#1e40af') => {
            isActive = active;
            currentActiveColor = activeColor;
            updateColors(false);
        },
    };
}
/**
 * Subtree Controller (1-operand):
 * Highlights the selected node in black, left subtree in red, right subtree in blue.
 */
export class SubtreeController {
    diagram;
    leftNodes = [];
    rightNodes = [];
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select a ', '#37474f'],
            ['source node', this.diagram.palette.selectedNode || '#212121'],
            [' to highlight its ', '#37474f'],
            ['left', this.diagram.palette.leftSubtree || '#d32f2f'],
            [' and ', '#37474f'],
            ['right', this.diagram.palette.rightSubtree || '#1976d2'],
            [' subtrees', '#37474f'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const leftColor = this.diagram.palette.leftSubtree || '#d32f2f';
        const rightColor = this.diagram.palette.rightSubtree || '#1976d2';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        const sourceExp = keyToExp(selectedKey);
        this.leftNodes = this.diagram.getSubtreeNodes(sourceExp.concat('-'));
        this.rightNodes = this.diagram.getSubtreeNodes(sourceExp.concat('+'));
        this.leftNodes.forEach((exp) => this.diagram.setNodeColorByExp(exp, leftColor));
        this.rightNodes.forEach((exp) => this.diagram.setNodeColorByExp(exp, rightColor));
        this.diagram.setStatusPrompt([
            ['Selected: ', '#37474f'],
            [setVal(sourceExp), selectedColor],
            [' | Left: ', leftColor],
            [`${this.leftNodes.length} nodes`, leftColor],
            [' | Right: ', rightColor],
            [`${this.rightNodes.length} nodes`, rightColor],
            [' (click background to clear)', '#78909c'],
        ]);
    }
    onClear() {
        this.leftNodes = [];
        this.rightNodes = [];
        this.init();
    }
}
/**
 * Simplicity Controller (1-operand):
 * Traces ancestor simpler nodes, partitions them into simpler-left (<) and simpler-right (>),
 * powered by dyadicMachine.simplerOptions with a direct rule gateway to simpler_options.
 */
export class SimplicityController {
    diagram;
    controlsGroup;
    btnGateway;
    selectedKey;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        if (!this.controlsGroup) {
            this.buildControls();
        }
        this.diagram.setStatusPrompt([
            ['Select a node', '#1565c0'],
            [' to display its simpler ancestor path and simpler left/right sets', '#37474f'],
        ]);
    }
    buildControls() {
        this.controlsGroup = new SVGGrpElt();
        this.controlsGroup.setAA([
            'class', 'diagram-control-bar',
            'data-ctrl', 'true',
        ]);
        const bar = new SVGElt('rect');
        bar.setAA([
            'x', 15,
            'y', 366,
            'width', 870,
            'height', 38,
            'rx', 8,
            'fill', '#f8fafc',
            'stroke', '#cbd5e1',
            'stroke-width', 1.2,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(bar);
        const label = new SVGElt('text');
        label.setAA([
            'x', 28,
            'y', 386,
            'font-size', 11,
            'font-weight', '700',
            'font-family', 'system-ui, -apple-system, sans-serif',
            'fill', '#475569',
            'data-ctrl', 'true',
        ]);
        label.setV('Mode:');
        this.controlsGroup.append(label);
        createPillButton(this.controlsGroup, 72, 372, 130, 26, '🌱 Simplicity { L | R }', () => { }, 'Simpler ancestral options partition').setActive(true, '#0d9488');
        // Divider
        const div = new SVGElt('line');
        div.setAA([
            'x1', 214, 'y1', 374,
            'x2', 214, 'y2', 396,
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(div);
        // Gateway Button
        this.btnGateway = createPillButton(this.controlsGroup, 226, 372, 230, 26, '📜 View SimplerOptions Rule ➔', () => this.openRuleGateway(), 'Inspect SimplerOptions rule in Pseudocode Viewer');
        // Reset Button
        createPillButton(this.controlsGroup, 820, 372, 56, 26, '↺ Clear', () => {
            this.diagram.clearHighlights();
            this.diagram.wasVisited = [];
            this.diagram.state = 0;
            this.onClear();
        }, 'Reset selected node');
        this.diagram.append(this.controlsGroup);
    }
    openRuleGateway() {
        if (this.selectedKey) {
            const keyExp = setExp(this.selectedKey);
            openRuleGateway('simpler_options', `SimplerOptions(${setVal(keyExp)})`, 'SimplerOptions', [keyExp]);
        }
        else {
            openRuleGateway('simpler_options');
        }
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.selectedKey = selectedKey;
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const linkColor = this.diagram.palette.highlightLink || '#78909c';
        const leftColor = this.diagram.palette.leftSimpler || '#d32f2f';
        const rightColor = this.diagram.palette.rightSimpler || '#1976d2';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        const keyExp = setExp(selectedKey);
        const { leftOptions, rightOptions } = dyadicMachine.simplerOptions(keyExp);
        leftOptions.forEach((opt) => {
            this.diagram.setNodeColor(expToId(opt.path), leftColor);
        });
        rightOptions.forEach((opt) => {
            this.diagram.setNodeColor(expToId(opt.path), rightColor);
        });
        // Highlight ancestor path links
        let prevNode = selectedKey;
        for (let i = keyExp.length - 1; i >= 0; i--) {
            const subExp = keyExp.substring(0, i);
            const ancestorId = expToId(subExp);
            const linkKey = `${ancestorId}${prevNode}`;
            this.diagram.setLinkColor(linkKey, linkColor);
            prevNode = ancestorId;
        }
        const formatSet = (nodes) => '{ ' + nodes.map((n) => setVal(n.path).trim()).join(', ') + ' }';
        if (this.btnGateway) {
            this.btnGateway.setLabel(`📜 View SimplerOptions (${setVal(keyExp)}) ➔`);
        }
        const line1 = [
            ['Selected: ', '#37474f'],
            [setVal(keyExp), selectedColor],
            ['   Left Simpler Xᴸ: ', leftColor],
            [formatSet(leftOptions), leftColor],
            ['   Right Simpler Xᴿ: ', rightColor],
            [formatSet(rightOptions), rightColor],
        ];
        const line2 = [
            ['💡 Conway Simplicity: ', '#0f766e'],
            [`${setVal(keyExp)} is the unique simplest number (earliest birthday) strictly between Xᴸ and Xᴿ.`, '#64748b'],
        ];
        this.diagram.setStatusLines([line1, line2]);
    }
    onClear() {
        this.selectedKey = undefined;
        if (this.btnGateway) {
            this.btnGateway.setLabel('📜 View SimplerOptions Rule ➔');
        }
        this.init();
    }
}
/**
 * Total Order Controller (1-operand):
 * Demonstrates Conway total order (≤) by coloring left/right simpler nodes and all their subtrees,
 * powered by dyadicMachine.simplerOptions with a direct rule gateway to conway_order.
 */
export class OrderController {
    diagram;
    controlsGroup;
    btnGateway;
    selectedKey;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        if (!this.controlsGroup) {
            this.buildControls();
        }
        this.diagram.setStatusPrompt([
            ['Select a node', '#1565c0'],
            [' to illustrate total order partition (all strictly smaller & larger nodes)', '#37474f'],
        ]);
    }
    buildControls() {
        this.controlsGroup = new SVGGrpElt();
        this.controlsGroup.setAA([
            'class', 'diagram-control-bar',
            'data-ctrl', 'true',
        ]);
        const bar = new SVGElt('rect');
        bar.setAA([
            'x', 15,
            'y', 366,
            'width', 870,
            'height', 38,
            'rx', 8,
            'fill', '#f8fafc',
            'stroke', '#cbd5e1',
            'stroke-width', 1.2,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(bar);
        const label = new SVGElt('text');
        label.setAA([
            'x', 28,
            'y', 386,
            'font-size', 11,
            'font-weight', '700',
            'font-family', 'system-ui, -apple-system, sans-serif',
            'fill', '#475569',
            'data-ctrl', 'true',
        ]);
        label.setV('Mode:');
        this.controlsGroup.append(label);
        createPillButton(this.controlsGroup, 72, 372, 130, 26, '⚖ Total Order (≤)', () => { }, 'Conway Total Order Partition').setActive(true, '#4f46e5');
        // Divider
        const div = new SVGElt('line');
        div.setAA([
            'x1', 214, 'y1', 374,
            'x2', 214, 'y2', 396,
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(div);
        // Gateway Button
        this.btnGateway = createPillButton(this.controlsGroup, 226, 372, 230, 26, '📜 View ConwayOrder Rule ➔', () => this.openRuleGateway(), 'Inspect ConwayLessEq rule in Pseudocode Viewer');
        // Reset Button
        createPillButton(this.controlsGroup, 820, 372, 56, 26, '↺ Clear', () => {
            this.diagram.clearHighlights();
            this.diagram.wasVisited = [];
            this.diagram.state = 0;
            this.onClear();
        }, 'Reset selected node');
        this.diagram.append(this.controlsGroup);
    }
    openRuleGateway() {
        if (this.selectedKey) {
            const nodeExp = setExp(this.selectedKey);
            openRuleGateway('conway_order', `Order(${setVal(nodeExp)})`, 'ConwayLessEq', [nodeExp, '']);
        }
        else {
            openRuleGateway('conway_order');
        }
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.selectedKey = selectedKey;
        this.diagram.clearHighlights();
        const selectedColor = this.diagram.palette.selectedNode || '#212121';
        const leftNodeColor = this.diagram.palette.leftSimpler || '#d32f2f';
        const rightNodeColor = this.diagram.palette.rightSimpler || '#1976d2';
        const leftSubColor = '#ffcdd2'; // light red
        const rightSubColor = '#bbdefb'; // light blue
        const linkColor = this.diagram.palette.highlightLink || '#78909c';
        this.diagram.setNodeColor(selectedKey, selectedColor);
        // Color direct subtrees
        this.colorSubtree(selectedKey, '-', leftSubColor);
        this.colorSubtree(selectedKey, '+', rightSubColor);
        const nodeExp = setExp(selectedKey);
        const { leftOptions, rightOptions } = dyadicMachine.simplerOptions(nodeExp);
        leftOptions.forEach((opt) => {
            const id = expToId(opt.path);
            this.diagram.setNodeColor(id, leftNodeColor);
            this.colorSubtree(id, '-', leftSubColor);
        });
        rightOptions.forEach((opt) => {
            const id = expToId(opt.path);
            this.diagram.setNodeColor(id, rightNodeColor);
            this.colorSubtree(id, '+', rightSubColor);
        });
        // Simpler links
        let topNode = selectedKey;
        for (let i = nodeExp.length - 1; i >= 0; i--) {
            const subExp = nodeExp.substring(0, i);
            const ancestorId = expToId(subExp);
            const linkKey = `${ancestorId}${topNode}`;
            this.diagram.setLinkColor(linkKey, linkColor);
            topNode = ancestorId;
        }
        if (this.btnGateway) {
            this.btnGateway.setLabel(`📜 View ConwayOrder (${setVal(nodeExp)}) ➔`);
        }
        const line1 = [
            ['Total Order for ', '#37474f'],
            [setVal(nodeExp), selectedColor],
            [': Less (<) = ', leftNodeColor],
            ['left simpler & subtrees', leftNodeColor],
            [' | Greater (>) = ', rightNodeColor],
            ['right simpler & subtrees', rightNodeColor],
        ];
        const line2 = [
            ['💡 Conway Order Theorem: ', '#4338ca'],
            ['Every number X ∈ ℝ_ω partitions all other numbers into strictly smaller and strictly larger sets.', '#64748b'],
        ];
        this.diagram.setStatusLines([line1, line2]);
    }
    colorSubtree(key, side, color) {
        const exp = setExp(key).concat(side);
        const nodes = this.diagram.getSubtreeNodes(exp);
        nodes.forEach((nodeExp) => this.diagram.setNodeColorByExp(nodeExp, color));
    }
    onClear() {
        this.selectedKey = undefined;
        if (this.btnGateway) {
            this.btnGateway.setLabel('📜 View ConwayOrder Rule ➔');
        }
        this.init();
    }
}
/**
 * Cut Controller (2-operand):
 * Finds the unique simplest real number r = L | R strictly between the two chosen operands,
 * powered by dyadicMachine.cut with ambient ledger step tracking and rule gateway to cut.
 */
export class CutController {
    diagram;
    controlsGroup;
    btnGateway;
    lastVisited = [];
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        if (!this.controlsGroup) {
            this.buildControls();
        }
        this.diagram.setStatusPrompt([
            ['Select first node', '#1565c0'],
            [' for Conway cut (L | R)', '#37474f'],
        ]);
    }
    buildControls() {
        this.controlsGroup = new SVGGrpElt();
        this.controlsGroup.setAA([
            'class', 'diagram-control-bar',
            'data-ctrl', 'true',
        ]);
        const bar = new SVGElt('rect');
        bar.setAA([
            'x', 15,
            'y', 366,
            'width', 870,
            'height', 38,
            'rx', 8,
            'fill', '#f8fafc',
            'stroke', '#cbd5e1',
            'stroke-width', 1.2,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(bar);
        const label = new SVGElt('text');
        label.setAA([
            'x', 28,
            'y', 386,
            'font-size', 11,
            'font-weight', '700',
            'font-family', 'system-ui, -apple-system, sans-serif',
            'fill', '#475569',
            'data-ctrl', 'true',
        ]);
        label.setV('Mode:');
        this.controlsGroup.append(label);
        createPillButton(this.controlsGroup, 72, 372, 130, 26, '✂ Conway Cut (L | R)', () => { }, 'Conway Dedekind Cut on Binary Tree').setActive(true, '#b91c1c');
        // Divider
        const div = new SVGElt('line');
        div.setAA([
            'x1', 214, 'y1', 374,
            'x2', 214, 'y2', 396,
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(div);
        // Gateway Button
        this.btnGateway = createPillButton(this.controlsGroup, 226, 372, 210, 26, '📜 View Cut Rule ➔', () => this.openRuleGateway(), 'Inspect Cut rule in Pseudocode Viewer');
        // Reset Button
        createPillButton(this.controlsGroup, 820, 372, 56, 26, '↺ Clear', () => {
            this.diagram.clearHighlights();
            this.diagram.wasVisited = [];
            this.diagram.state = 0;
            this.onClear();
        }, 'Reset selected operands');
        this.diagram.append(this.controlsGroup);
    }
    openRuleGateway() {
        if (this.lastVisited && this.lastVisited.length >= 2) {
            const expA = setExp(this.lastVisited[0]);
            const expB = setExp(this.lastVisited[1]);
            const [leftExp, rightExp] = dyadicMachine.compare(expA, expB) > 0
                ? [expB, expA]
                : [expA, expB];
            openRuleGateway('cut', `Cut(${setVal(leftExp)} | ${setVal(rightExp)})`, 'Cut', [leftExp, rightExp]);
        }
        else {
            openRuleGateway('cut');
        }
    }
    onFirstSelect(key) {
        this.lastVisited = [key];
        const firstExp = setExp(key);
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        this.diagram.setStatusPrompt([
            ['First operand: ', '#37474f'],
            [setVal(firstExp), this.diagram.palette.firstSelection || '#1976d2'],
            [' \u2192 Select second node', '#1565c0'],
        ]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        this.lastVisited = visited.slice(0, 2);
        const keyA = visited[0];
        const keyB = visited[1];
        const expA = setExp(keyA);
        const expB = setExp(keyB);
        // Determine left (smaller) vs right (larger) using dyadicMachine.compare
        const [leftKey, leftExp, rightKey, rightExp] = dyadicMachine.compare(expA, expB) > 0
            ? [keyB, expB, keyA, expA]
            : [keyA, expA, keyB, expB];
        dyadicMachine.resetLedger();
        const cutNode = dyadicMachine.cut(leftExp, rightExp);
        const cutExp = cutNode.path;
        const cutKey = expToId(cutExp);
        const leftColor = '#b71c1c'; // dark red
        const rightColor = '#1b5e20'; // dark green
        const cutColor = this.diagram.palette.cutResult || '#000000';
        this.diagram.setNodeColor(leftKey, leftColor);
        this.diagram.setNodeColor(rightKey, rightColor);
        const [bd, pos] = nodeKeyToBirthdayLinePos(cutKey);
        if (bd > this.diagram.maxBD) {
            if (bd <= this.diagram.maxBD + 1) {
                const basePos = pos % 2 === 0 ? pos / 2 : (pos - 1) / 2;
                const antennaKey = `K${bd - 1}${basePos}${cutKey}`;
                this.diagram.setLinkColor(antennaKey, cutColor);
            }
        }
        else {
            this.diagram.setNodeColor(cutKey, cutColor);
        }
        if (this.btnGateway) {
            this.btnGateway.setLabel(`📜 View Cut (${setVal(cutExp)}) ➔`);
        }
        const line1 = [
            ['Result: ', '#37474f'],
            [setVal(leftExp), leftColor],
            [' | ', '#37474f'],
            [setVal(rightExp), rightColor],
            [' = ', '#37474f'],
            [setVal(cutExp), cutColor],
            [`  (ambient cut steps: ${dyadicMachine.systemLedger.cutCount})`, '#0284c7'],
        ];
        const line2 = [
            ['💡 Conway Cut Rule: ', '#b91c1c'],
            [`The cut walks from root 0, branching right when \u2264 ${setVal(leftExp)} and left when \u2265 ${setVal(rightExp)}.`, '#64748b'],
        ];
        this.diagram.setStatusLines([line1, line2]);
    }
    onClear() {
        this.lastVisited = [];
        if (this.btnGateway) {
            this.btnGateway.setLabel('📜 View Cut Rule ➔');
        }
        this.init();
    }
}
/**
 * Operation Controller (2-operand):
 * Executes recursive Addition or Multiplication in ℝ_ω with step counts and result highlighting.
 */
export class OpController {
    diagram;
    op;
    constructor(diagram, op = '+') {
        this.diagram = diagram;
        this.op = op;
    }
    init() {
        const opName = this.op === '+' ? 'addition' : 'multiplication';
        this.diagram.setStatusPrompt([
            [`Select first operand for ${opName} (${this.op})`, '#1565c0'],
        ]);
    }
    onFirstSelect(key) {
        const exp1 = keyToExp(key);
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        this.diagram.setStatusPrompt([
            ['First operand: ', '#37474f'],
            [setVal(exp1), this.diagram.palette.firstSelection || '#1976d2'],
            [` ${this.op} Select second operand`, '#1565c0'],
        ]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        const exp1 = keyToExp(visited[0]);
        const exp2 = keyToExp(visited[1]);
        dyadicMachine.resetLedger();
        const stats = this.op === '+'
            ? dyadicMachine.countConwayAdd(exp1, exp2)
            : dyadicMachine.countConwayMul(exp1, exp2);
        const resultNode = this.op === '+'
            ? dyadicMachine.conwayAdd(exp1, exp2)
            : dyadicMachine.conwayMul(exp1, exp2);
        const resultExp = resultNode.path;
        const exp1Color = '#d32f2f'; // red
        const exp2Color = '#2e7d32'; // green
        const resColor = '#000000'; // black
        this.diagram.setNodeColor(expToId(exp1), exp1Color);
        this.diagram.setNodeColor(expToId(exp2), exp2Color);
        let statsMsg = '';
        if (stats.calls <= 500) {
            if (this.op === '+') {
                statsMsg = ` (addition recursion count: ${stats.calls}, depth: ${stats.maxDepth})`;
            }
            else {
                statsMsg = ` (mult: ${stats.calls}, add: ${stats.addCalls || 0})`;
            }
            if (resultExp.length <= this.diagram.maxBD) {
                this.diagram.setNodeColor(expToId(resultExp), resColor);
            }
            else {
                this.diagram.setDirectionAntenna(resultExp, resColor);
            }
        }
        else {
            statsMsg = ' (max recursion count exceeded)';
        }
        this.diagram.setStatusPrompt([
            [setVal(exp1), exp1Color],
            [` ${this.op} `, '#37474f'],
            [setVal(exp2), exp2Color],
            [' = ', '#37474f'],
            [setVal(resultExp), resColor],
            [statsMsg, '#546e7a'],
        ]);
    }
    onClear() {
        this.init();
    }
}
/**
 * Combined Isomorphism & Arithmetic Lab Controller (2-operand):
 * Unifies Tree Addition & Multiplication in ℝ_ω with Dyadic Rational Arithmetic,
 * featuring interactive operation toggling (+, ·), an evaluation engine toggle
 * (Instant Dyadic O(1) vs Conway Inductive Recursion with live telemetry & stats),
 * and a direct gateway to the underlying formal pseudocode rules.
 */
export class IsoController {
    diagram;
    currentOp = '+';
    engineMode = 'conway';
    lastVisited = [];
    // Controls UI elements
    controlsGroup;
    btnOpAdd;
    btnOpMul;
    btnEngDyadic;
    btnEngConway;
    btnGateway;
    constructor(diagram, initialOp = '+') {
        this.diagram = diagram;
        this.currentOp = initialOp;
    }
    setOp(op) {
        if (this.currentOp === op)
            return;
        this.currentOp = op;
        this.updateControlsUI();
        if (this.lastVisited.length === 2) {
            this.onProcess(this.lastVisited);
        }
        else if (this.lastVisited.length === 1) {
            this.onFirstSelect(this.lastVisited[0]);
        }
        else {
            this.initPrompts();
        }
    }
    setEngine(mode) {
        if (this.engineMode === mode)
            return;
        this.engineMode = mode;
        this.updateControlsUI();
        if (this.lastVisited.length === 2) {
            this.onProcess(this.lastVisited);
        }
        else {
            this.initPrompts();
        }
    }
    init() {
        if (!this.controlsGroup) {
            this.buildControls();
        }
        this.updateControlsUI();
        this.initPrompts();
    }
    buildControls() {
        this.controlsGroup = new SVGGrpElt();
        this.controlsGroup.setAA([
            'class', 'diagram-control-bar',
            'data-ctrl', 'true',
        ]);
        // Background bar
        const bar = new SVGElt('rect');
        bar.setAA([
            'x', 15,
            'y', 366,
            'width', 870,
            'height', 38,
            'rx', 8,
            'fill', '#f8fafc',
            'stroke', '#cbd5e1',
            'stroke-width', 1.2,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(bar);
        // Op Label
        const opLabel = new SVGElt('text');
        opLabel.setAA([
            'x', 28,
            'y', 386,
            'font-size', 11,
            'font-weight', '700',
            'font-family', 'system-ui, -apple-system, sans-serif',
            'fill', '#475569',
            'data-ctrl', 'true',
        ]);
        opLabel.setV('Op:');
        this.controlsGroup.append(opLabel);
        // Buttons for Op
        this.btnOpAdd = this.createPillButton(this.controlsGroup, 52, 372, 78, 26, '+ Add', () => this.setOp('+'), 'Tree Addition in ℝ_ω');
        this.btnOpMul = this.createPillButton(this.controlsGroup, 136, 372, 98, 26, '· Mult', () => this.setOp('\u2217'), 'Tree Multiplication in ℝ_ω');
        // Divider 1
        const div1 = new SVGElt('line');
        div1.setAA([
            'x1', 244, 'y1', 374,
            'x2', 244, 'y2', 396,
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(div1);
        // Engine Label
        const engLabel = new SVGElt('text');
        engLabel.setAA([
            'x', 256,
            'y', 386,
            'font-size', 11,
            'font-weight', '700',
            'font-family', 'system-ui, -apple-system, sans-serif',
            'fill', '#475569',
            'data-ctrl', 'true',
        ]);
        engLabel.setV('Engine:');
        this.controlsGroup.append(engLabel);
        // Engine Buttons
        this.btnEngDyadic = this.createPillButton(this.controlsGroup, 306, 372, 118, 26, '⚡ Dyadic (O(1))', () => this.setEngine('dyadic'), 'Instant ring bit-shift ALU evaluation');
        this.btnEngConway = this.createPillButton(this.controlsGroup, 430, 372, 150, 26, '🌳 Conway Recursion', () => this.setEngine('conway'), 'Recursive tree induction in ℝ_ω with live stats feedback');
        // Divider 2
        const div2 = new SVGElt('line');
        div2.setAA([
            'x1', 590, 'y1', 374,
            'x2', 590, 'y2', 396,
            'stroke', '#cbd5e1',
            'stroke-width', 1,
            'data-ctrl', 'true',
        ]);
        this.controlsGroup.append(div2);
        // Gateway Button to Pseudocode Viewer
        this.btnGateway = this.createPillButton(this.controlsGroup, 602, 372, 212, 26, '📜 View Conway Rule ➔', () => this.openRuleGateway(), 'Inspect formal rule in Pseudocode Viewer');
        // Reset Button
        this.createPillButton(this.controlsGroup, 820, 372, 56, 26, '↺ Clear', () => {
            this.diagram.clearHighlights();
            this.diagram.wasVisited = [];
            this.diagram.state = 0;
            this.onClear();
        }, 'Reset selected operands');
        this.diagram.append(this.controlsGroup);
    }
    createPillButton(parent, x, y, w, h, label, onClick, title) {
        return createPillButton(parent, x, y, w, h, label, onClick, title);
    }
    updateControlsUI() {
        if (!this.btnOpAdd)
            return;
        this.btnOpAdd.setActive(this.currentOp === '+', '#1e40af');
        this.btnOpMul.setActive(this.currentOp === '\u2217', '#1e40af');
        this.btnEngDyadic.setActive(this.engineMode === 'dyadic', '#0284c7');
        this.btnEngConway.setActive(this.engineMode === 'conway', '#059669');
        const ruleName = this.currentOp === '+' ? 'ConwayAdd' : 'ConwayMul';
        this.btnGateway.setLabel(`📜 View ${ruleName} Rule ➔`);
        this.btnGateway.setActive(false);
    }
    initPrompts() {
        const opName = this.currentOp === '+' ? 'Addition (+)' : 'Multiplication (\u2217)';
        const engName = this.engineMode === 'conway'
            ? '🌳 Conway Recursion & Stats'
            : '⚡ Instant Dyadic Machine (O(1))';
        const line1 = [
            [`[${opName}] `, '#1e40af'],
            [`Engine: ${engName}  |  `, '#475569'],
            ['Select first operand on the binary tree', '#1565c0'],
        ];
        const line2 = [
            ['💡 Click any tree node to pick operand 1. Toggle op or engine anytime above.', '#64748b'],
        ];
        this.diagram.setStatusLines([line1, line2]);
    }
    onFirstSelect(key) {
        this.lastVisited = [key];
        const exp1 = keyToExp(key);
        const dr1 = new DR(exp1).format();
        this.diagram.setNodeColor(key, this.diagram.palette.firstSelection || '#1976d2');
        const line1 = [
            ['Op 1: ', '#37474f'],
            [`${setVal(exp1)} (${dr1})`, this.diagram.palette.firstSelection || '#1976d2'],
            [`  ${this.currentOp}  Select second operand`, '#1565c0'],
        ];
        const line2 = [
            [
                '👉 Click a second node on the tree to evaluate and view isomorphic telemetry.',
                '#64748b',
            ],
        ];
        this.diagram.setStatusLines([line1, line2]);
    }
    onProcess(visited) {
        if (visited.length < 2)
            return;
        this.lastVisited = visited.slice(0, 2);
        const exp1 = keyToExp(this.lastVisited[0]);
        const exp2 = keyToExp(this.lastVisited[1]);
        const dr1 = new DR(exp1);
        const dr2 = new DR(exp2);
        const dr1Str = dr1.format();
        const dr2Str = dr2.format();
        const drResult = this.currentOp === '+' ? DR.add(dr1, dr2) : DR.multiply(dr1, dr2);
        const drResStr = drResult.format();
        const signRes = drResult.toSignExpansion();
        const c1 = '#0288d1'; // blue
        const c2 = '#c2185b'; // pink/red
        const cRes = '#2e7d32'; // green
        this.diagram.setNodeColor(expToId(exp1), c1);
        this.diagram.setNodeColor(expToId(exp2), c2);
        if (signRes.length <= this.diagram.maxBD) {
            this.diagram.setNodeColor(expToId(signRes), cRes);
        }
        else {
            this.diagram.setDirectionAntenna(signRes, cRes);
        }
        const line1 = [
            ['Tree: ', '#37474f'],
            [setVal(exp1), c1],
            [` ${this.currentOp} `, '#37474f'],
            [setVal(exp2), c2],
            [' = ', '#37474f'],
            [setVal(signRes), cRes],
            ['   \u21D4   Dyadic: ', '#0f172a'],
            [`${dr1Str} ${this.currentOp} ${dr2Str} = ${drResStr}`, '#00695c'],
        ];
        if (this.engineMode === 'conway') {
            dyadicMachine.resetLedger();
            const stats = this.currentOp === '+'
                ? dyadicMachine.countConwayAdd(exp1, exp2)
                : dyadicMachine.countConwayMul(exp1, exp2);
            // Execute actual Conway operation via dyadic machine
            const conwayResult = this.currentOp === '+'
                ? dyadicMachine.conwayAdd(exp1, exp2)
                : dyadicMachine.conwayMul(exp1, exp2);
            const isBailed = stats.calls > 500;
            let telemetryText = '';
            if (isBailed) {
                telemetryText = `⚠️ Conway Telemetry: 500+ calls (safety limit reached) | Max Depth: ${stats.maxDepth} | Dyadic ALU: O(1)`;
            }
            else {
                const crossStr = stats.addCalls ? ` | ${stats.addCalls} cross-additions` : '';
                telemetryText = `🌳 Conway Telemetry: ${stats.calls} additions | Max Depth: ${stats.maxDepth} | ${stats.cuts} cuts resolved${crossStr} | Isomorphism verified`;
            }
            const line2 = [
                [telemetryText, isBailed ? '#b45309' : '#047857'],
            ];
            this.diagram.setStatusLines([line1, line2]);
        }
        else {
            const line2 = [
                ['⚡ Instant Dyadic Machine: ', '#0284c7'],
                ['Evaluated in O(1) bit-shift ring operations via Dyadic ALU | Ring homomorphism verified', '#475569'],
            ];
            this.diagram.setStatusLines([line1, line2]);
        }
    }
    onClear() {
        this.lastVisited = [];
        this.initPrompts();
    }
    openRuleGateway() {
        const algoId = this.currentOp === '+' ? 'conway_add' : 'conway_mul';
        const funcName = this.currentOp === '+' ? 'ConwayAdd' : 'ConwayMul';
        if (this.lastVisited && this.lastVisited.length >= 2) {
            const exp1 = keyToExp(this.lastVisited[0]);
            const exp2 = keyToExp(this.lastVisited[1]);
            const label = `Custom: ${setVal(exp1)} ${this.currentOp} ${setVal(exp2)}`;
            openRuleGateway(algoId, label, funcName, [exp1, exp2]);
        }
        else {
            openRuleGateway(algoId);
        }
    }
}
/**
 * Omega State Inspector Controller (1-operand):
 * Allows the user to select any state node in the tree (especially top canopy nodes p ∈ Ω).
 * Traces its ascending path from Root 0, displays its sign path and dyadic coordinates,
 * and computes competing hypothesis likelihoods and the resulting Bayes factor.
 */
export class OmegaStateController {
    diagram;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        this.diagram.setStatusPrompt([
            ['Select any state node ', '#1e40af'],
            ['(e.g. on the top canopy in Ω) ', '#0284c7'],
            ['to inspect its address, hypothesis likelihoods & Bayes update', '#64748b'],
        ]);
    }
    onProcess(visited) {
        const selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const exp = keyToExp(selectedKey);
        const bd = exp.length;
        const isTopLeaf = bd >= this.diagram.maxBD;
        const nodeColor = this.diagram.palette.omegaStateNode || '#d97706';
        const pathColor = this.diagram.palette.omegaStatePath || '#0284c7';
        const coneColor = '#059669'; // emerald for subtree event cone
        // 1. Highlight ascending spine from Root 0 to selected node
        this.diagram.traceAscendingPath(selectedKey, pathColor, pathColor);
        this.diagram.setNodeColor(selectedKey, nodeColor);
        const signSeq = exp; // e.g. "+-++"
        const numPlus = (signSeq.match(/\+/g) || []).length;
        const numMinus = (signSeq.match(/-/g) || []).length;
        const formattedSign = signSeq.length > 0 ? `[ ${signSeq.split('').join(' ')} ]` : '[ 0 (Root) ]';
        const dyadicCoord = new DR(exp).format();
        // Friendly coin translation: '+' -> 'H', '-' -> 'T'
        const coinSeq = signSeq.length > 0 ? `(${signSeq.replace(/\+/g, 'H').replace(/-/g, 'T')})` : '(Root)';
        // Hypothesis Likelihoods for this path prefix:
        // H_fair (p = 0.5): P = (0.5)^bd
        // H_biased (p = 0.7 H, 0.3 T): P = (0.7)^numPlus * (0.3)^numMinus
        const pHFair = Math.pow(0.5, bd);
        const pHBiased = Math.pow(0.7, numPlus) * Math.pow(0.3, numMinus);
        const bayesFactor = pHFair > 0 ? pHBiased / pHFair : 1;
        const pHFairPct = (pHFair * 100).toFixed(bd > 4 ? 3 : 2) + '%';
        const pHBiasedPct = (pHBiased * 100).toFixed(bd > 4 ? 3 : 2) + '%';
        const bfText = bayesFactor >= 1
            ? `${bayesFactor.toFixed(2)}× (favors Biased)`
            : `${(1 / bayesFactor).toFixed(2)}× (favors Fair)`;
        if (isTopLeaf) {
            // Top-level atomic state in Omega
            this.diagram.setStatusPrompt([
                ['Top State p: ', '#1e293b'],
                [formattedSign, '#1e40af'],
                [` ${coinSeq}`, '#0284c7'],
                [` (x = ${dyadicCoord})`, '#059669'],
                [' | P(p|Fair)=', '#64748b'],
                [pHFairPct, '#1e40af'],
                [' | P(p|Biased 70%)=', '#64748b'],
                [pHBiasedPct, '#d97706'],
                [' | Bayes Factor: ', '#1e293b'],
                [bfText, bayesFactor >= 1 ? '#d97706' : '#1e40af'],
            ]);
        }
        else {
            // Lower-level node: composite event / subtree cone covering multiple Omega leaves
            this.diagram.highlightSubtreeCone(selectedKey, coneColor, coneColor);
            this.diagram.setNodeColor(selectedKey, nodeColor); // keep focal node distinct
            const spanStates = Math.pow(2, this.diagram.maxBD - bd);
            this.diagram.setStatusPrompt([
                ['Event E (Subtree): ', '#1e293b'],
                [`${formattedSign}*`, '#059669'],
                [` (Covers ${spanStates} states in Ω)`, '#0284c7'],
                [' | P(E|Fair)=', '#64748b'],
                [pHFairPct, '#1e40af'],
                [' | P(E|Biased 70%)=', '#64748b'],
                [pHBiasedPct, '#d97706'],
                [' | Event Bayes Factor: ', '#1e293b'],
                [bfText, bayesFactor >= 1 ? '#d97706' : '#1e40af'],
            ]);
        }
    }
    onClear() {
        this.init();
    }
}
/**
 * Euler Hyperfinite Compounding Controller (1-operand):
 * Demonstrates the nonstandard dyadic calculation of exp(x) = (1 + x/2^k)^(2^k)
 * on the 2-successor Conway number tree using pure dyadic shifts and squarings.
 */
export class EulerCompoundingController {
    diagram;
    currentK = 12; // 4096 slices
    selectedKey = null;
    constructor(diagram) {
        this.diagram = diagram;
    }
    init() {
        const defaultKey = expToId('+');
        this.onProcess([defaultKey]);
    }
    onProcess(visited) {
        if (visited.length === 0)
            return;
        this.selectedKey = visited[visited.length - 1];
        this.diagram.clearHighlights();
        const exp = keyToExp(this.selectedKey);
        const nodeColor = '#1e40af'; // royal blue for selected input
        const baseColor = '#7c3aed'; // purple for base u0
        const resColor = '#059669'; // emerald for result
        // 1. Highlight selected input node
        this.diagram.setNodeColor(this.selectedKey, nodeColor);
        // 2. Evaluate hyperfinite compounding via dyadic machine
        const trace = dyadicMachine.expWithTrace(exp, this.currentK, 32);
        const inputFmt = trace.input.format();
        const inputSign = trace.input.path.length > 0 ? `[${trace.input.path}]` : '[ ]';
        const dxFmt = trace.stepSize.format();
        const baseFmt = trace.base.format();
        const resFmt = trace.result.format();
        const resSign = trace.result.path.length > 0 ? `[${trace.result.path}]` : '[ ]';
        const resDec = trace.result.toFloat();
        const expected = Math.exp(trace.input.toFloat());
        // 3. Highlight base u0 if within maxBD
        if (trace.base.birthday <= this.diagram.maxBD) {
            this.diagram.setNodeColor(expToId(trace.base.path), baseColor);
        }
        // 4. Highlight result node or antenna
        if (trace.result.birthday <= this.diagram.maxBD) {
            this.diagram.setNodeColor(expToId(trace.result.path), resColor);
        }
        else {
            this.diagram.setDirectionAntenna(trace.result.path, resColor);
        }
        // 5. Multi-line status ledger
        this.diagram.setStatusLines([
            [
                ['Input x: ', '#334155'],
                [`${inputSign} (${inputFmt})`, nodeColor],
                ['  |  Slice dx: ', '#334155'],
                [`1/2^${this.currentK} = ${dxFmt}`, '#0284c7'],
                ['  |  Base u₀: ', '#334155'],
                [`1 + x·dx = ${baseFmt}`, baseColor],
            ],
            [
                [`exp(x) via ${this.currentK} squarings: `, '#1e3a8a'],
                [`${resFmt}`, resColor],
                [` ≈ ${resDec.toFixed(6)}`, '#059669'],
                [` (Standard e^x ≈ ${expected.toFixed(6)}, diff: ${Math.abs(resDec - expected).toExponential(2)})`, '#64748b'],
            ],
        ]);
    }
    onClear() {
        this.selectedKey = null;
        this.init();
    }
}
