/**
 * Modular Pseudocode Dependency Graph
 * Synthesizes strictly downstream direct dependencies (sub-modules and discrete machine primitives)
 * for the module currently in focus.
 */
import { tokenize, PseudoParser, } from './pseudoInterpreter.js';
import { MODULE_CATALOG, getPseudoModule, } from './pseudoCatalog.js';
const PRIMITIVE_DOCS = {
    // Machine Operators
    '⊕': 'Ring Addition: exact dyadic integer sum with common denominator alignment in (𝔻, +, ·)',
    '⊖': 'Ring Subtraction: exact dyadic rational difference in (𝔻, +, ·)',
    '⊗': 'Ring Multiplication: exact product of numerators and power-of-two denominators',
    '⊘': 'Dyadic Quotient: exact division when divisor is power-of-two, or closest dyadic approximation',
    '≫': 'Right Bit-Shift: exact division by 2^k (halfing time-steps and spatial grids)',
    '≪': 'Left Bit-Shift: exact multiplication by 2^k (grid scaling and central difference doubling)',
    '++': 'Tree Concatenation: appends sign step (+ or -) to walk down the binary Conway tree',
    // Machine Functions
    'val': 'Projection: extracts numeric rational value d ∈ 𝔻 from a Conway tree node',
    'node': 'Canonical Node: maps dyadic rational d to its unique shortest sign sequence on the tree',
    'sqr': 'Exact Squaring: evaluates x² in the ring (𝔻, ·) using single integer multiplication',
    'length': 'Tree Depth: birthday / string length of node sign sequence from the root []',
    'EmptySet': 'Finite Set: initializes an empty discrete option collection ∅',
    'Insert': 'Option Inclusion: adds a simpler tree ancestor node to the option set',
    'Maximum': 'Tree Supremum: finds greatest left option strictly below upper bound',
    'Minimum': 'Tree Infimum: finds least right option strictly above lower bound',
    'CreateArray': 'Discrete Lattice: allocates spatial grid array of M dyadic cells',
    'CordicAngle': 'Elementary Angle: dyadic rotation angle arctan(2^-i) without transcendentals',
    'CordicAngleTable': 'Angle Table: predefined 16-step dyadic constant lookup',
};
/**
 * Extracts strictly downstream direct dependencies for the module in focus.
 */
export function extractModuleDownstreamDag(moduleIdOrName) {
    const mod = getPseudoModule(moduleIdOrName) || MODULE_CATALOG.conway_add;
    const focusFuncName = mod.funcName;
    // Build index of known functions to module IDs
    const knownFns = new Map();
    for (const m of Object.values(MODULE_CATALOG)) {
        knownFns.set(m.funcName, m);
    }
    const tokens = tokenize(mod.code);
    const parser = new PseudoParser(tokens);
    const program = parser.parseProgram();
    const fnDef = program.functions.get(focusFuncName);
    const nodesMap = new Map();
    const edgesMap = new Map();
    let isRecursive = false;
    // 1. Add the central Focus Node
    nodesMap.set(focusFuncName, {
        id: focusFuncName,
        label: focusFuncName,
        tier: 'focus',
        moduleId: mod.id,
        line: fnDef ? fnDef.line : 1,
        params: fnDef ? fnDef.params : [],
        doc: mod.summary,
    });
    function addEdge(from, to, type, line) {
        const key = `${from}->${to}:${type}`;
        if (!edgesMap.has(key)) {
            edgesMap.set(key, { from, to, type, count: 0, lines: [] });
        }
        const e = edgesMap.get(key);
        e.count++;
        if (line > 0 && !e.lines.includes(line))
            e.lines.push(line);
    }
    function addDependencyNode(id, tier, moduleId, line, doc) {
        if (!nodesMap.has(id)) {
            nodesMap.set(id, {
                id,
                label: id,
                tier,
                moduleId,
                line,
                doc: doc || PRIMITIVE_DOCS[id] || '',
            });
        }
    }
    // 2. Traverse statements and expressions of the focused module
    if (fnDef) {
        function visitExpr(expr) {
            if (!expr)
                return;
            switch (expr.type) {
                case 'CALL': {
                    const callee = expr.callee;
                    if (callee === focusFuncName) {
                        isRecursive = true;
                        addEdge(focusFuncName, focusFuncName, 'recurse', expr.line);
                    }
                    else if (knownFns.has(callee)) {
                        // Direct sub-module call
                        const subMod = knownFns.get(callee);
                        addDependencyNode(callee, 'submodule', subMod.id, expr.line, subMod.summary);
                        addEdge(focusFuncName, callee, 'call', expr.line);
                    }
                    else {
                        // Built-in primitive
                        addDependencyNode(callee, 'primitive', undefined, expr.line);
                        addEdge(focusFuncName, callee, 'call', expr.line);
                    }
                    if (expr.args) {
                        for (const arg of expr.args)
                            visitExpr(arg);
                    }
                    break;
                }
                case 'BINARY': {
                    if (['⊕', '⊖', '⊗', '⊘', '≫', '≪', '++'].includes(expr.op)) {
                        addDependencyNode(expr.op, 'operator', undefined, expr.line);
                        addEdge(focusFuncName, expr.op, 'operator', expr.line);
                    }
                    visitExpr(expr.left);
                    visitExpr(expr.right);
                    break;
                }
                case 'UNARY':
                    visitExpr(expr.expr);
                    break;
                case 'SLICE':
                    visitExpr(expr.target);
                    visitExpr(expr.start);
                    visitExpr(expr.end);
                    break;
                case 'INDEX':
                    visitExpr(expr.target);
                    visitExpr(expr.index);
                    break;
                case 'TUPLE':
                    if (expr.elements) {
                        for (const el of expr.elements)
                            visitExpr(el);
                    }
                    break;
            }
        }
        function visitStmt(stmt) {
            if (!stmt)
                return;
            switch (stmt.type) {
                case 'ASSIGN':
                    if (stmt.indexExpr)
                        visitExpr(stmt.indexExpr);
                    visitExpr(stmt.expr);
                    break;
                case 'RETURN':
                    visitExpr(stmt.expr);
                    break;
                case 'IF':
                    visitExpr(stmt.cond);
                    if (stmt.thenBranch) {
                        for (const s of stmt.thenBranch)
                            visitStmt(s);
                    }
                    if (stmt.elseBranch) {
                        for (const s of stmt.elseBranch)
                            visitStmt(s);
                    }
                    break;
                case 'WHILE':
                    visitExpr(stmt.cond);
                    if (stmt.body) {
                        for (const s of stmt.body)
                            visitStmt(s);
                    }
                    break;
                case 'FOR':
                    visitExpr(stmt.start);
                    visitExpr(stmt.end);
                    if (stmt.body) {
                        for (const s of stmt.body)
                            visitStmt(s);
                    }
                    break;
                case 'FOR_EACH':
                    visitExpr(stmt.setExpr);
                    if (stmt.body) {
                        for (const s of stmt.body)
                            visitStmt(s);
                    }
                    break;
                case 'CALL_STMT':
                    visitExpr(stmt.call);
                    break;
            }
        }
        for (const stmt of fnDef.body) {
            visitStmt(stmt);
        }
    }
    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());
    const submodules = nodes.filter((n) => n.tier === 'submodule');
    const primitives = nodes.filter((n) => n.tier === 'primitive' || n.tier === 'operator');
    // 3. Compute clean 2-tier downstream layout
    const bounds = computeDownstreamGraphLayout(nodesMap.get(focusFuncName), submodules, primitives);
    const nodeMap = {};
    for (const n of nodes) {
        nodeMap[n.id] = n;
    }
    return {
        focusModuleId: mod.id,
        focusFuncName,
        focusModule: mod,
        nodes,
        edges,
        nodeMap,
        bounds,
        isRecursive,
        submoduleCount: submodules.length,
        primitiveCount: primitives.length,
    };
}
/**
 * Computes crisp 2-tier coordinates:
 * Top Row: Focus Module (centered)
 * Bottom Row: Direct Callee Sub-Modules followed by Primitive Operations
 */
function computeDownstreamGraphLayout(focusNode, submodules, primitives) {
    const canvasWidth = 760;
    const topY = 48;
    const bottomY = 175;
    // Focus node position
    focusNode.width = Math.max(160, focusNode.label.length * 10 + 40);
    focusNode.height = 42;
    focusNode.x = Math.round(canvasWidth / 2);
    focusNode.y = topY;
    // Bottom dependencies
    const allDeps = [...submodules, ...primitives];
    const depCount = allDeps.length;
    if (depCount > 0) {
        const spacing = canvasWidth / (depCount + 1);
        allDeps.forEach((node, idx) => {
            node.x = Math.round(spacing * (idx + 1));
            node.y = bottomY;
            node.width = node.tier === 'operator' ? 44 : Math.max(105, node.label.length * 8.5 + 24);
            node.height = node.tier === 'operator' ? 36 : 38;
        });
    }
    return {
        width: canvasWidth,
        height: depCount > 0 ? 230 : 110,
    };
}
/**
 * Renders the focused module's downstream dependency SVG.
 */
export function renderModuleDownstreamSvg(graph, highlightedLine) {
    const { width, height } = graph.bounds;
    const TIER_COLORS = {
        focus: {
            bg: '#1e3a8a',
            border: '#3b82f6',
            text: '#ffffff',
            glow: 'rgba(59,130,246,0.6)',
        },
        submodule: {
            bg: '#0f766e',
            border: '#2dd4bf',
            text: '#ffffff',
            glow: 'rgba(45,212,191,0.5)',
        },
        primitive: {
            bg: '#1e293b',
            border: '#475569',
            text: '#38bdf8',
            glow: 'rgba(56,189,248,0.3)',
        },
        operator: {
            bg: '#312e81',
            border: '#818cf8',
            text: '#fbbf24',
            glow: 'rgba(129,140,248,0.35)',
        },
    };
    const focusNode = graph.nodeMap[graph.focusFuncName];
    // Draw Edges
    let edgesSvg = '';
    for (const edge of graph.edges) {
        const fromNode = graph.nodeMap[edge.from];
        const toNode = graph.nodeMap[edge.to];
        if (!fromNode || !toNode)
            continue;
        const isRecurse = edge.type === 'recurse';
        const isLineActive = highlightedLine !== undefined && edge.lines.includes(highlightedLine);
        const strokeColor = isLineActive
            ? '#eab308'
            : edge.type === 'call'
                ? toNode.tier === 'submodule'
                    ? '#2dd4bf'
                    : '#38bdf8'
                : '#64748b';
        const strokeWidth = isLineActive ? 3.0 : 1.8;
        const strokeDash = isRecurse ? 'stroke-dasharray="4 3"' : '';
        if (isRecurse) {
            // Self-loop recursion arc on left of focus node
            const x = fromNode.x;
            const y = fromNode.y;
            const pathD = `M ${x - fromNode.width / 2} ${y - 8} C ${x - fromNode.width / 2 - 45} ${y - 35}, ${x - fromNode.width / 2 - 45} ${y + 35}, ${x - fromNode.width / 2} ${y + 8}`;
            edgesSvg += `
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${strokeDash} marker-end="url(#downstream-arrow-${isLineActive ? 'active' : 'sub'})" />
        <text x="${x - fromNode.width / 2 - 50}" y="${y}" fill="${strokeColor}" font-size="10.5" font-family="monospace" font-weight="bold" text-anchor="end" alignment-baseline="middle">recurse (x${edge.count})</text>
      `;
        }
        else {
            const x1 = fromNode.x;
            const y1 = fromNode.y + fromNode.height / 2;
            const x2 = toNode.x;
            const y2 = toNode.y - toNode.height / 2;
            const midY = (y1 + y2) / 2;
            const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
            const markerId = isLineActive
                ? 'active'
                : toNode.tier === 'submodule'
                    ? 'sub'
                    : 'prim';
            edgesSvg += `
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${strokeDash} marker-end="url(#downstream-arrow-${markerId})" style="transition:all 0.2s;" />
      `;
        }
    }
    // Draw Nodes
    let nodesSvg = '';
    for (const node of graph.nodes) {
        const isFocus = node.tier === 'focus';
        const isSubmodule = node.tier === 'submodule';
        const styling = TIER_COLORS[node.tier];
        const x = node.x - node.width / 2;
        const y = node.y - node.height / 2;
        const ringStyle = isFocus
            ? `stroke:${styling.border};stroke-width:2.5;filter:drop-shadow(0 0 12px ${styling.glow});`
            : isSubmodule
                ? `stroke:${styling.border};stroke-width:2;filter:drop-shadow(0 0 6px ${styling.glow});`
                : `stroke:${styling.border};stroke-width:1.5;`;
        const cursorStyle = isSubmodule ? 'cursor:pointer;' : isFocus ? 'cursor:default;' : 'cursor:help;';
        let badgeText = '';
        if (isFocus)
            badgeText = 'FOCUSED MODULE';
        else if (isSubmodule)
            badgeText = 'SUB-MODULE (CLICK)';
        else if (node.tier === 'primitive')
            badgeText = 'PRIMITIVE';
        else if (node.tier === 'operator')
            badgeText = 'OPERATOR';
        nodesSvg += `
      <g class="downstream-dag-node" data-node-id="${node.id}" data-tier="${node.tier}" data-module-id="${node.moduleId || ''}" style="${cursorStyle}transition:transform 0.15s;">
        <rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="7" fill="${styling.bg}" ${ringStyle} />
        <text x="${node.x}" y="${node.y + 4}" fill="${styling.text}" font-family="Consolas, monospace" font-size="${node.tier === 'operator' ? 16 : isFocus ? 13.5 : 12}" font-weight="bold" text-anchor="middle">
          ${node.label}
        </text>
        <text x="${node.x}" y="${y - 5}" fill="${isSubmodule ? '#2dd4bf' : isFocus ? '#93c5fd' : '#94a3b8'}" font-family="system-ui, sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.5px" text-anchor="middle">
          ${badgeText}
        </text>
      </g>
    `;
    }
    const noDepsNotice = graph.nodes.length === 1
        ? `<text x="${width / 2}" y="115" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-style="italic" text-anchor="middle">Self-contained leaf module (no sub-module dependencies)</text>`
        : '';
    return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="background:#090d16;border-radius:8px;overflow:visible;user-select:none;">
      <defs>
        <marker id="downstream-arrow-sub" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#2dd4bf" />
        </marker>
        <marker id="downstream-arrow-prim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="downstream-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#eab308" />
        </marker>
      </defs>
      <g id="downstream-edges-layer">${edgesSvg}</g>
      <g id="downstream-nodes-layer">${nodesSvg}</g>
      ${noDepsNotice}
    </svg>
  `;
}
