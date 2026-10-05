import { Elt } from './elt.js';
import { getPseudoModule, getAllModulesCombinedCode, MODULE_CATALOG, } from './pseudoCatalog.js';
import { PseudoInterpreter, } from './pseudoInterpreter.js';
import { dyadicMachine } from './dyadicMachine.js';
const ALGO_PRESETS = {
    conway_add: [
        {
            id: 'conway_add_demo',
            label: 'ConwayAdd([+-], [+-+]) ⟹ 1/2 + 3/4 = 1&1/4',
            funcName: 'ConwayAdd',
            args: [dyadicMachine.fromPath('+-'), dyadicMachine.fromPath('+-+')],
        },
        {
            id: 'conway_add_one_half',
            label: 'ConwayAdd([+], [+-]) ⟹ 1 + 1/2 = 1&1/2',
            funcName: 'ConwayAdd',
            args: [dyadicMachine.fromInt(1), dyadicMachine.fromPath('+-')],
        },
    ],
    conway_order: [
        {
            id: 'order_zero_one',
            label: 'ConwayLessEq(0, 1) ⟹ 1 (True: 0 ≤ 1)',
            funcName: 'ConwayLessEq',
            args: [dyadicMachine.root(), dyadicMachine.fromInt(1)],
        },
        {
            id: 'order_one_zero',
            label: 'ConwayLessEq(1, 0) ⟹ 0 (False: 1 not ≤ 0)',
            funcName: 'ConwayLessEq',
            args: [dyadicMachine.fromInt(1), dyadicMachine.root()],
        },
        {
            id: 'order_half_threefourths',
            label: 'ConwayLessEq(1/2, 3/4) ⟹ 1 (True: 1/2 ≤ 3/4)',
            funcName: 'ConwayLessEq',
            args: [dyadicMachine.fromPath('+-'), dyadicMachine.fromPath('+-+')],
        },
    ],
    conway_sort: [
        {
            id: 'sort_standard_5',
            label: 'ConwaySort([1, -1, 1/2, 0, -1/2], 5) ⟹ Total Ascending Order',
            funcName: 'ConwaySort',
            args: [
                [
                    dyadicMachine.fromInt(1),
                    dyadicMachine.fromInt(-1),
                    dyadicMachine.fromPath('+-'),
                    dyadicMachine.root(),
                    dyadicMachine.fromPath('-+'),
                ],
                5,
            ],
        },
        {
            id: 'sort_dyadics_4',
            label: 'ConwaySort([3/4, 1/4, 1/2, 0], 4) ⟹ [0, 1/4, 1/2, 3/4]',
            funcName: 'ConwaySort',
            args: [
                [
                    dyadicMachine.fromPath('+-+'),
                    dyadicMachine.fromPath('+--'),
                    dyadicMachine.fromPath('+-'),
                    dyadicMachine.root(),
                ],
                4,
            ],
        },
    ],
    conway_sub: [
        {
            id: 'sub_demo_1',
            label: 'ConwaySub(1&1/4, 3/4) ⟹ 1/2 ([+-])',
            funcName: 'ConwaySub',
            args: [dyadicMachine.fromPath('++-'), dyadicMachine.fromPath('+-+')],
        },
        {
            id: 'sub_demo_2',
            label: 'ConwaySub(1, 1/2) ⟹ 1/2 ([+-])',
            funcName: 'ConwaySub',
            args: [dyadicMachine.fromInt(1), dyadicMachine.fromPath('+-')],
        },
    ],
    conway_mul: [
        {
            id: 'mul_one_half',
            label: 'ConwayMul(1, 1/2) ⟹ 1 · 1/2 = 1/2 ([+-])',
            funcName: 'ConwayMul',
            args: [dyadicMachine.fromInt(1), dyadicMachine.fromPath('+-')],
        },
        {
            id: 'mul_half_half',
            label: 'ConwayMul(1/2, 1/2) ⟹ 1/2 · 1/2 = 1/4 ([+--])',
            funcName: 'ConwayMul',
            args: [dyadicMachine.fromPath('+-'), dyadicMachine.fromPath('+-')],
        },
        {
            id: 'mul_half_threefourths',
            label: 'ConwayMul(1/2, 3/4) ⟹ 1/2 · 3/4 = 3/8',
            funcName: 'ConwayMul',
            args: [dyadicMachine.fromPath('+-'), dyadicMachine.fromPath('+-+')],
        },
    ],
    conway_neg: [
        {
            id: 'neg_three_fourths',
            label: 'ConwayNeg([+-+]) ⟹ [-+-] (-3/4)',
            funcName: 'ConwayNeg',
            args: [dyadicMachine.fromPath('+-+')],
        },
    ],
    cut: [
        {
            id: 'cut_bounds',
            label: 'Cut(1, 1&1/2) ⟹ 1&1/4 (Stepping the Tree)',
            funcName: 'Cut',
            args: [dyadicMachine.fromInt(1), dyadicMachine.fromPath('++-')],
        },
    ],
    simpler_options: [
        {
            id: 'simpler_half',
            label: 'SimplerOptions([+-]) ⟹ { 0 }, { 1 }',
            funcName: 'SimplerOptions',
            args: [dyadicMachine.fromPath('+-')],
        },
    ],
    euler_compounding: [
        {
            id: 'euler_exp_1',
            label: 'EulerExp(1, 4) ⟹ 4 squarings (16 slices)',
            funcName: 'EulerExp',
            args: [dyadicMachine.fromInt(1), 4],
        },
        {
            id: 'euler_exp_half',
            label: 'EulerExp(1/2, 4) ⟹ 4 squarings',
            funcName: 'EulerExp',
            args: [dyadicMachine.fromPath('+-'), 4],
        },
    ],
    kinematics_step: [
        {
            id: 'kin_step_standard',
            label: 'KinematicStep(v₀=20, g=9&3/4, t=2) ⟹ v=1/2, s=20&1/2',
            funcName: 'KinematicStep',
            args: [dyadicMachine.fromInt(20), dyadicMachine.fromFraction(39, 2), dyadicMachine.fromInt(2)],
        },
        {
            id: 'kin_step_freefall',
            label: 'KinematicStep(v₀=0, g=9&3/4, t=1) ⟹ Free Fall from Rest',
            funcName: 'KinematicStep',
            args: [dyadicMachine.root(), dyadicMachine.fromFraction(39, 2), dyadicMachine.fromInt(1)],
        },
    ],
    cordic_angle: [
        {
            id: 'cordic_angle_zero',
            label: 'CordicAngle(0) ⟹ π/4 ≈ 0.785398',
            funcName: 'CordicAngle',
            args: [0],
        },
    ],
    rotor_trig_cordic: [
        {
            id: 'cordic_zero',
            label: 'CordicRotor(θ=0, 16) ⟹ (1, 0) Pure Real Unit Vector',
            funcName: 'CordicRotor',
            args: [dyadicMachine.root(), 16],
        },
        {
            id: 'cordic_quarter_pi',
            label: 'CordicRotor(θ ≈ π/4, 16) ⟹ (0.7071, 0.7071)',
            funcName: 'CordicRotor',
            args: [dyadicMachine.fromFloat(0.785398), 16],
        },
    ],
    laplacian_heat_step: [
        {
            id: 'heat_pulse',
            label: 'HeatDiffusionStep([0, 1, 0], α=1/4, M=3) ⟹ Central Pulse Dispersion',
            funcName: 'HeatDiffusionStep',
            args: [[dyadicMachine.root(), dyadicMachine.fromInt(1), dyadicMachine.root()], dyadicMachine.fromFraction(1, 2), 3],
        },
    ],
    bayes_discrete_update: [
        {
            id: 'bayes_update_demo',
            label: 'BayesUpdate(Prior=1/2, P(E|H)=3/4, P(E|¬H)=1/4) ⟹ 3/4',
            funcName: 'BayesUpdate',
            args: [dyadicMachine.fromFraction(1, 1), dyadicMachine.fromFraction(3, 2), dyadicMachine.fromFraction(1, 2)],
        },
    ],
    maximum: [
        {
            id: 'max_demo',
            label: 'Maximum({ 0, 1, 1/2 }) ⟹ 1 ([+])',
            funcName: 'Maximum',
            args: [new Set([dyadicMachine.root(), dyadicMachine.fromInt(1), dyadicMachine.fromPath('+-')])],
        },
        {
            id: 'max_negatives',
            label: 'Maximum({ -1, -1/2, 0 }) ⟹ 0 ([])',
            funcName: 'Maximum',
            args: [new Set([dyadicMachine.fromInt(-1), dyadicMachine.fromPath('-+'), dyadicMachine.root()])],
        },
    ],
    minimum: [
        {
            id: 'min_demo',
            label: 'Minimum({ 0, 1, -1 }) ⟹ -1 ([-])',
            funcName: 'Minimum',
            args: [new Set([dyadicMachine.root(), dyadicMachine.fromInt(1), dyadicMachine.fromInt(-1)])],
        },
    ],
    empty_set: [
        {
            id: 'empty_set_demo',
            label: 'EmptySet() ⟹ ∅ (Finite Ancestor Option Set)',
            funcName: 'EmptySet',
            args: [],
        },
    ],
    insert: [
        {
            id: 'insert_demo',
            label: 'Insert({ 0 }, 1/2) ⟹ { 0, 1/2 }',
            funcName: 'Insert',
            args: [new Set([dyadicMachine.root()]), dyadicMachine.fromPath('+-')],
        },
    ],
    length: [
        {
            id: 'len_demo',
            label: 'length([+-+]) ⟹ 3 (Birthday Day 3)',
            funcName: 'length',
            args: [dyadicMachine.fromPath('+-+')],
        },
        {
            id: 'len_root',
            label: 'length([]) ⟹ 0 (Root Born Day 0)',
            funcName: 'length',
            args: [dyadicMachine.root()],
        },
    ],
    sqr: [
        {
            id: 'sqr_three_fourths',
            label: 'sqr(3/4) ⟹ 9/16 in (𝔻, ·)',
            funcName: 'sqr',
            args: [dyadicMachine.fromFraction(3, 2)],
        },
        {
            id: 'sqr_half',
            label: 'sqr(1/2) ⟹ 1/4 in (𝔻, ·)',
            funcName: 'sqr',
            args: [dyadicMachine.fromPath('+-')],
        },
    ],
    val: [
        {
            id: 'val_half',
            label: 'val([+-]) ⟹ 1/2 ∈ 𝔻',
            funcName: 'val',
            args: [dyadicMachine.fromPath('+-')],
        },
    ],
    node: [
        {
            id: 'node_three_fourths',
            label: 'node(3/4) ⟹ [+-+] on Binary Tree',
            funcName: 'node',
            args: [dyadicMachine.fromFraction(3, 2)],
        },
    ],
    create_array: [
        {
            id: 'create_array_demo',
            label: 'CreateArray(4) ⟹ [0, 0, 0, 0]',
            funcName: 'CreateArray',
            args: [4],
        },
    ],
    cordic_angle_table: [
        {
            id: 'cordic_angle_0',
            label: 'CordicAngleTable(0) ⟹ π/4 ≈ 0.785398',
            funcName: 'CordicAngleTable',
            args: [0],
        },
        {
            id: 'cordic_angle_1',
            label: 'CordicAngleTable(1) ⟹ arctan(1/2) ≈ 0.463648',
            funcName: 'CordicAngleTable',
            args: [1],
        },
    ],
    op_add: [
        {
            id: 'op_add_demo',
            label: 'DyadicAdd(1/4, 1/2) ⟹ 3/4',
            funcName: 'DyadicAdd',
            args: [dyadicMachine.fromFraction(1, 2), dyadicMachine.fromFraction(1, 1)],
        },
    ],
    op_concat: [
        {
            id: 'op_concat_demo',
            label: 'TreeConcat([+], "-") ⟹ [+-] (1/2)',
            funcName: 'TreeConcat',
            args: [dyadicMachine.fromPath('+'), '-'],
        },
    ],
};
const SEMANTIC_TOKENS = {
    // Sub-Modules in catalog (Interactive Click-to-Focus)
    SimplerOptions: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'simpler_options',
        desc: 'Extracts simpler tree ancestor prefixes born on earlier days. Click to inspect.',
    },
    Cut: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'cut',
        desc: 'Conway Cut — evaluates unique simplest node strictly between bounds. Click to inspect.',
    },
    ConwayAdd: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_add',
        desc: 'Conway Inductive Addition — evaluates exact sum directly on tree sign paths.',
    },
    ConwayLessEq: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_order',
        desc: 'Conway Inductive Order: verifies X ≤ Y via mutual options induction. Click to inspect.',
    },
    ConwayCompare: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_order',
        desc: 'Conway Total Comparison: -1 (less), 0 (equal), +1 (greater). Click to inspect.',
    },
    ConwaySort: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_sort',
        desc: 'Conway Total Order Sort: sorts array using ConwayLessEq predicate. Click to inspect.',
    },
    ConwaySub: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_sub',
        desc: 'Conway Inductive Subtraction: X - Y = X + (-Y). Click to inspect.',
    },
    ConwayMul: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'conway_mul',
        desc: 'Conway Inductive Multiplication: 4-way cross-products of options. Click to inspect.',
    },
    ConwayNeg: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'conway_neg',
        desc: 'Conway Tree Negation: inverts every sign (+ <-> -). Click to inspect.',
    },
    EulerExp: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'euler_compounding',
        desc: 'Hyperfinite dyadic exponential compounding via bit-shifts and repeated squarings.',
    },
    KinematicStep: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'kinematics_step',
        desc: 'Discrete Newtonian kinematic difference stepping in ring (𝔻, +, ·).',
    },
    CordicAngle: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'cordic_angle',
        desc: 'Elementary rotation angle lookup table arctan(2^-i). Click to inspect.',
    },
    CordicRotor: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'rotor_trig_cordic',
        desc: 'Dyadic CORDIC unit rotor projection (cos θ, sin θ) in ring (𝔻, +, ·).',
    },
    HeatDiffusionStep: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'laplacian_heat_step',
        desc: 'Discrete Laplacian thermal diffusion step across spatial lattice cells.',
    },
    BayesUpdate: {
        role: 'submodule',
        label: 'Sub-Module',
        moduleId: 'bayes_discrete_update',
        desc: 'Discrete Bayesian posterior update over finite hypothesis partition.',
    },
    // Runtime Built-in Primitives (First-Class Atomic Modules)
    EmptySet: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'empty_set',
        desc: 'Initializes an empty finite discrete option collection ∅. Click to inspect.',
    },
    Insert: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'insert',
        desc: 'Inserts option node into discrete ancestor collection. Click to inspect.',
    },
    Maximum: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'maximum',
        desc: 'Evaluates greatest left option (supremum on binary tree). Click to inspect.',
    },
    Minimum: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'minimum',
        desc: 'Evaluates least right option (infimum on binary tree). Click to inspect.',
    },
    length: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'length',
        desc: 'Returns string length (birthday depth) of node from root []. Click to inspect.',
    },
    CreateArray: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'create_array',
        desc: 'Allocates spatial lattice array of M discrete dyadic cells. Click to inspect.',
    },
    CordicAngleTable: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'cordic_angle_table',
        desc: 'Fixed lookup of 16 elementary dyadic rotation angles arctan(2^-i). Click to inspect.',
    },
    val: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'val',
        desc: 'Extracts rational numeric value d ∈ 𝔻 from Conway tree node. Click to inspect.',
    },
    node: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'node',
        desc: 'Maps dyadic rational d to unique canonical sign sequence on tree. Click to inspect.',
    },
    sqr: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'sqr',
        desc: 'Evaluates exact square x² via single ring multiplication in (𝔻, ·). Click to inspect.',
    },
    DyadicAdd: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'op_add',
        desc: 'Exact ring addition with power-of-two denominator alignment in (𝔻, +, ·). Click to inspect.',
    },
    TreeConcat: {
        role: 'primitive',
        label: 'Runtime Primitive',
        moduleId: 'op_concat',
        desc: 'Appends sign step (+ or -) to walk down the binary Conway tree. Click to inspect.',
    },
    // Machine Operators (Informative on hover, Clickable if mapped to module)
    '⊕': {
        role: 'operator',
        label: 'Machine Operator',
        moduleId: 'op_add',
        desc: 'Ring Addition: exact dyadic integer sum with common denominator alignment in (𝔻, +, ·). Click to inspect.',
    },
    '⊖': {
        role: 'operator',
        label: 'Machine Operator',
        desc: 'Ring Subtraction: exact dyadic rational difference in (𝔻, +, ·).',
    },
    '⊗': {
        role: 'operator',
        label: 'Machine Operator',
        desc: 'Ring Multiplication: exact product of numerators and power-of-two denominators.',
    },
    '⊘': {
        role: 'operator',
        label: 'Machine Operator',
        desc: 'Dyadic Quotient: exact division when divisor is power-of-two, or closest approximation.',
    },
    '≫': {
        role: 'operator',
        label: 'Machine Operator',
        desc: 'Right Bit-Shift: exact division by 2^k (halving time-steps and spatial grids).',
    },
    '≪': {
        role: 'operator',
        label: 'Machine Operator',
        desc: 'Left Bit-Shift: exact multiplication by 2^k (grid scaling and difference doubling).',
    },
    '++': {
        role: 'operator',
        label: 'Machine Operator',
        moduleId: 'op_concat',
        desc: 'Tree Concatenation: appends sign step (+ or -) to walk down the binary Conway tree. Click to inspect.',
    },
    '≔': {
        role: 'operator',
        label: 'Directed Equality',
        desc: 'Computational reduction rule: directed equality establishing function evaluation without side effects.',
    },
    '::=': {
        role: 'operator',
        label: 'Directed Equality',
        desc: 'Computational reduction rule: directed equality establishing function evaluation without side effects.',
    },
};
/**
 * Syntax highlighter that renders the code itself as an interactive semantic canvas.
 * - Sub-modules are styled as distinct teal clickable links.
 * - Primitives and operators are styled with hover-informational tokens.
 * - Active execution line is illuminated.
 */
function highlightPseudoCode(rawCode, activeLine = -1, currentFocusFuncName = '') {
    const lines = rawCode.split('\n');
    const formattedLines = lines.map((line, idx) => {
        const lineNum = idx + 1;
        const isActive = lineNum === activeLine;
        const arrow = isActive
            ? `<span style="color:#eab308;font-weight:bold;margin-right:4px;">▶</span>`
            : `<span style="display:inline-block;width:12px;margin-right:4px;"></span>`;
        const lineNumColor = isActive ? '#fbbf24' : '#64748b';
        const lineNumStr = `<span style="display:inline-block;width:30px;margin-right:14px;text-align:right;color:${lineNumColor};user-select:none;font-weight:${isActive ? 'bold' : 'normal'};">${lineNum}</span>`;
        // Strip comments
        let codePart = line;
        let commentPart = '';
        const commentIdx = line.indexOf('//');
        if (commentIdx >= 0) {
            codePart = line.substring(0, commentIdx);
            commentPart = line.substring(commentIdx);
        }
        // Escape HTML characters in codePart
        codePart = codePart
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // Keywords highlighting
        const keywords = [
            'rule',
            'function',
            'var',
            'begin',
            'end',
            'return',
            'for',
            'each',
            'in',
            'to',
            'do',
            'if',
            'then',
            'else',
            'while',
            'or',
            'and',
            'not',
        ];
        for (const kw of keywords) {
            const reg = new RegExp(`\\b${kw}\\b`, 'g');
            codePart = codePart.replace(reg, `<span style="color:#c084fc;font-weight:bold;">${kw}</span>`);
        }
        // Types
        codePart = codePart.replace(/\b(Node|Dyadic|Integer|Boolean|Set|Array)\b|𝔹/g, '<span style="color:#38bdf8;font-weight:600;">$&</span>');
        codePart = codePart.replace(/\bSet of Node\b/g, '<span style="color:#38bdf8;font-weight:600;">Set of Node</span>');
        codePart = codePart.replace(/\bArray of (Node|Dyadic)\b/g, '<span style="color:#38bdf8;font-weight:600;">Array of $1</span>');
        // Identifiers: Sub-modules vs Primitives
        const identRegex = /\b(SimplerOptions|Cut|ConwayAdd|ConwayLessEq|ConwayCompare|ConwaySort|ConwaySub|ConwayMul|ConwayNeg|Insert|EmptySet|Maximum|Minimum|EulerExp|KinematicStep|CordicRotor|CordicAngle|HeatDiffusionStep|BayesUpdate|sqr|val|node|length|CreateArray|CordicAngleTable|DyadicAdd|TreeConcat)\b/g;
        codePart = codePart.replace(identRegex, (match) => {
            const meta = SEMANTIC_TOKENS[match];
            if (!meta)
                return match;
            const isCurrentDeclaration = match === currentFocusFuncName;
            if (isCurrentDeclaration) {
                return `<span class="pseudo-token pseudo-token-focus" data-token-name="${match}" style="color:#38bdf8;font-weight:700;padding:0 2px;">${match}</span>`;
            }
            if (meta.role === 'submodule') {
                return `<span class="pseudo-token pseudo-token-submodule" data-token-name="${match}" data-module-id="${meta.moduleId || ''}" style="color:#2dd4bf;font-weight:700;cursor:pointer;text-decoration:underline;text-decoration-color:#0d9488;text-underline-offset:3px;padding:0 3px;border-radius:3px;transition:background 0.15s, color 0.15s;">${match}</span>`;
            }
            // Runtime primitive (Clickable if mapped to a module definition)
            if (meta.moduleId) {
                return `<span class="pseudo-token pseudo-token-primitive" data-token-name="${match}" data-module-id="${meta.moduleId}" style="color:#4ade80;font-weight:700;cursor:pointer;text-decoration:underline;text-decoration-color:#16a34a;text-underline-offset:3px;padding:0 3px;border-radius:3px;transition:background 0.15s, color 0.15s;">${match}</span>`;
            }
            return `<span class="pseudo-token pseudo-token-primitive" data-token-name="${match}" style="color:#4ade80;font-weight:600;cursor:help;padding:0 2px;">${match}</span>`;
        });
        // Machine & Reduction Operators
        const opRegex = /(≔|::=|:=|&gt;=|&lt;=|\+\+|≫|≪|⊕|⊖|⊗|⊘)/g;
        codePart = codePart.replace(opRegex, (match) => {
            const meta = SEMANTIC_TOKENS[match];
            if (meta && meta.role === 'operator') {
                if (meta.moduleId) {
                    return `<span class="pseudo-token pseudo-token-operator" data-token-name="${match}" data-module-id="${meta.moduleId}" style="color:#fbbf24;font-weight:bold;cursor:pointer;text-decoration:underline;text-decoration-color:#d97706;text-underline-offset:3px;padding:0 3px;border-radius:3px;">${match}</span>`;
                }
                return `<span class="pseudo-token pseudo-token-operator" data-token-name="${match}" style="color:#fbbf24;font-weight:bold;cursor:help;padding:0 3px;">${match}</span>`;
            }
            return `<span style="color:#fbbf24;font-weight:bold;">${match}</span>`;
        });
        const formattedComment = commentPart
            ? `<span style="color:#94a3b8;font-style:italic;">${commentPart}</span>`
            : '';
        const bgStyle = isActive
            ? 'background:rgba(234,179,8,0.22);border-left:4px solid #eab308;padding-left:4px;border-radius:2px;'
            : 'padding-left:8px;';
        return `<div id="pseudo-line-${lineNum}" style="line-height:1.6;white-space:pre;${bgStyle}">${arrow}${lineNumStr}${codePart}${formattedComment}</div>`;
    });
    return formattedLines.join('');
}
/**
 * PseudoViewer: Streamlined text-anchored viewer with interactive semantic code canvas.
 * - Code is strictly 1-to-1 with the focused module.
 * - Sub-modules are color-coded and clickable to drill down into their isolated definition.
 * - Operators and primitives display discrete invariants on hover.
 * - Back button and breadcrumb path allow immediate return to text-anchored entry.
 */
export class PseudoViewer extends Elt {
    currentModuleId = 'conway_add';
    navHistory = ['conway_add'];
    interpreter = null;
    stepper = null;
    currentState = null;
    autoRunTimer = null;
    currentPresetIndex = 0;
    stepCount = 0;
    constructor() {
        super('div', 'pseudo-viewer-stage', 'H');
        this.elt.setAttribute('style', 'box-sizing:border-box;width:100%;min-height:100%;padding:16px 20px 80px 20px;background:transparent;font-family:system-ui,-apple-system,sans-serif;');
    }
    /**
     * Opens a module anchored from narrative text or diagram interaction.
     * Resets the drill-down history stack to this anchor.
     */
    showAlgorithm(id) {
        const mod = getPseudoModule(id) || MODULE_CATALOG.conway_add;
        this.currentModuleId = mod.id;
        this.navHistory = [mod.id];
        this.currentPresetIndex = 0;
        this.stopAutoRun();
        this.initInterpreter();
        this.render();
    }
    /**
     * Drills down into a sub-module clicked in the code canvas.
     */
    navigateToModule(id) {
        const mod = getPseudoModule(id);
        if (!mod)
            return;
        this.navHistory.push(mod.id);
        this.currentModuleId = mod.id;
        this.currentPresetIndex = 0;
        this.stopAutoRun();
        this.initInterpreter();
        this.render();
    }
    /**
     * Returns to the caller / previous module in the navigation stack.
     */
    navigateBack() {
        if (this.navHistory.length > 1) {
            this.navHistory.pop();
            this.currentModuleId = this.navHistory[this.navHistory.length - 1];
            this.currentPresetIndex = 0;
            this.stopAutoRun();
            this.initInterpreter();
            this.render();
        }
    }
    showAlgorithmWithArgs(id, label, funcName, args) {
        const mod = getPseudoModule(id) || MODULE_CATALOG.conway_add;
        this.currentModuleId = mod.id;
        this.navHistory = [mod.id];
        if (!ALGO_PRESETS[mod.id])
            ALGO_PRESETS[mod.id] = [];
        const dynamicPreset = {
            id: 'dynamic_custom',
            label,
            funcName,
            args,
        };
        const existingIdx = ALGO_PRESETS[mod.id].findIndex((p) => p.id === 'dynamic_custom');
        if (existingIdx >= 0) {
            ALGO_PRESETS[mod.id][existingIdx] = dynamicPreset;
            this.currentPresetIndex = existingIdx;
        }
        else {
            ALGO_PRESETS[mod.id].unshift(dynamicPreset);
            this.currentPresetIndex = 0;
        }
        this.stopAutoRun();
        this.initInterpreter();
        this.render();
    }
    layout() {
        // Relayout hook
    }
    initInterpreter() {
        const mod = getPseudoModule(this.currentModuleId) || MODULE_CATALOG.conway_add;
        try {
            // Compile the full combined module library so cross-module calls resolve seamlessly
            const combinedLib = getAllModulesCombinedCode();
            this.interpreter = new PseudoInterpreter(combinedLib);
            this.resetStepper();
        }
        catch (e) {
            console.error('[PseudoViewer] Error initializing interpreter:', e);
            this.interpreter = null;
        }
    }
    resetStepper() {
        this.stopAutoRun();
        this.stepCount = 0;
        this.currentState = null;
        if (!this.interpreter)
            return;
        const mod = getPseudoModule(this.currentModuleId) || MODULE_CATALOG.conway_add;
        const presets = ALGO_PRESETS[this.currentModuleId] || ALGO_PRESETS[mod.id] || [];
        const preset = presets[this.currentPresetIndex];
        if (preset) {
            this.stepper = this.interpreter.runStepper(preset.funcName, preset.args);
        }
        else {
            this.stepper = this.interpreter.runStepper(mod.funcName, []);
        }
        this.updateEditorHighlight(-1);
        this.updateWatchPanels();
    }
    stepForward() {
        if (!this.stepper) {
            this.resetStepper();
        }
        if (!this.stepper)
            return;
        const next = this.stepper.next();
        this.stepCount++;
        this.currentState = next.value;
        if (next.done) {
            this.stopAutoRun();
            this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
            this.updateWatchPanels(true);
        }
        else {
            this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
            this.updateWatchPanels(false);
        }
    }
    toggleAutoRun() {
        if (this.autoRunTimer) {
            this.stopAutoRun();
            this.updateRunButtonLabel(false);
        }
        else {
            if (!this.stepper || (this.currentState && this.currentState.isDone)) {
                this.resetStepper();
            }
            this.updateRunButtonLabel(true);
            this.autoRunTimer = setInterval(() => {
                if (!this.stepper) {
                    this.stopAutoRun();
                    this.updateRunButtonLabel(false);
                    return;
                }
                const next = this.stepper.next();
                this.stepCount++;
                this.currentState = next.value;
                if (next.done) {
                    this.stopAutoRun();
                    this.updateRunButtonLabel(false);
                    this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
                    this.updateWatchPanels(true);
                }
                else {
                    this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
                    this.updateWatchPanels(false);
                }
            }, 450);
        }
    }
    stopAutoRun() {
        if (this.autoRunTimer) {
            clearInterval(this.autoRunTimer);
            this.autoRunTimer = null;
        }
    }
    updateRunButtonLabel(isRunning) {
        const btn = this.elt.querySelector('#pseudo-btn-run');
        if (btn) {
            btn.innerHTML = isRunning ? '⏸ Pause' : '▶ Run';
            btn.setAttribute('style', `padding:5px 14px;border:1px solid ${isRunning ? '#f59e0b' : '#22c55e'};background:${isRunning ? '#78350f' : '#14532d'};color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;`);
        }
    }
    updateEditorHighlight(activeLine) {
        const mod = getPseudoModule(this.currentModuleId) || MODULE_CATALOG.conway_add;
        const editor = this.elt.querySelector('#pseudo-editor-body');
        if (editor) {
            editor.innerHTML = highlightPseudoCode(mod.code, activeLine, mod.funcName);
            this.attachCodeTokenEvents();
            if (activeLine > 0) {
                const lineEl = editor.querySelector(`#pseudo-line-${activeLine}`);
                if (lineEl && typeof lineEl.scrollIntoView === 'function') {
                    lineEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    }
    updateSemanticPill(customMeta, tokenName) {
        const pill = this.elt.querySelector('#pseudo-semantic-pill');
        if (!pill)
            return;
        const mod = getPseudoModule(this.currentModuleId) || MODULE_CATALOG.conway_add;
        if (customMeta && tokenName) {
            const badgeColors = {
                submodule: { bg: '#0f766e', text: '#2dd4bf' },
                primitive: { bg: '#064e3b', text: '#4ade80' },
                operator: { bg: '#451a03', text: '#fbbf24' },
            };
            const colors = badgeColors[customMeta.role] || { bg: '#334155', text: '#cbd5e1' };
            const clickNotice = customMeta.moduleId
                ? `<span style="color:${colors.text};font-weight:600;margin-left:8px;font-size:11px;">[ Click to inspect definition ➔ ]</span>`
                : '';
            pill.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.text};font-size:9.5px;font-weight:bold;padding:2px 7px;border-radius:4px;text-transform:uppercase;">
            ${customMeta.label}
          </span>
          <strong style="color:#f1f5f9;font-family:monospace;font-size:13px;">${tokenName}</strong>
          <span style="color:#cbd5e1;font-size:12px;">— ${customMeta.desc}</span>
          ${clickNotice}
        </div>
      `;
            return;
        }
        // Default quiet status
        pill.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#94a3b8;font-size:12px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8;"></span>
        <span>Module: <strong style="color:#f1f5f9;font-family:monospace;">${mod.funcName}</strong></span>
        <span style="color:#64748b;">|</span>
        <span style="font-style:italic;">Click any sub-module, primitive, or operator in the code to drill down into its isolated definition.</span>
      </div>
    `;
    }
    showFloatingTooltip(targetEl, meta, tokenName) {
        const tooltip = this.elt.querySelector('#pseudo-floating-tooltip');
        const container = this.elt.querySelector('#pseudo-code-container');
        if (!tooltip || !container)
            return;
        const badgeColors = {
            submodule: { bg: '#0f766e', text: '#2dd4bf' },
            primitive: { bg: '#064e3b', text: '#4ade80' },
            operator: { bg: '#451a03', text: '#fbbf24' },
        };
        const colors = badgeColors[meta.role] || { bg: '#334155', text: '#cbd5e1' };
        const clickNotice = meta.moduleId
            ? `<div style="color:#38bdf8;font-weight:600;margin-top:4px;font-size:11px;">➔ Click to inspect definition</div>`
            : '';
        tooltip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
        <span style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.text};font-size:9.5px;font-weight:bold;padding:1px 6px;border-radius:3px;text-transform:uppercase;">
          ${meta.label}
        </span>
        <strong style="color:#f8fafc;font-family:monospace;font-size:12.5px;">${tokenName}</strong>
      </div>
      <div style="color:#cbd5e1;font-size:11.5px;line-height:1.4;">${meta.desc}</div>
      ${clickNotice}
    `;
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        let top = targetRect.top - containerRect.top - 58;
        let left = targetRect.left - containerRect.left;
        if (top < 8) {
            top = targetRect.bottom - containerRect.top + 8;
        }
        if (left + 330 > containerRect.width) {
            left = Math.max(10, containerRect.width - 340);
        }
        if (left < 10)
            left = 10;
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';
    }
    hideFloatingTooltip() {
        const tooltip = this.elt.querySelector('#pseudo-floating-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.display = 'none';
        }
    }
    attachCodeTokenEvents() {
        const editor = this.elt.querySelector('#pseudo-editor-body');
        if (!editor)
            return;
        const tokens = editor.querySelectorAll('.pseudo-token');
        tokens.forEach((el) => {
            const tokenName = el.getAttribute('data-token-name') || '';
            const meta = SEMANTIC_TOKENS[tokenName];
            el.addEventListener('mouseenter', () => {
                if (meta) {
                    this.updateSemanticPill(meta, tokenName);
                    this.showFloatingTooltip(el, meta, tokenName);
                }
            });
            el.addEventListener('mouseleave', () => {
                this.updateSemanticPill();
                this.hideFloatingTooltip();
            });
            // Click: Any token with a moduleId navigates into focus
            if (meta && meta.moduleId) {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetModuleId = el.getAttribute('data-module-id');
                    if (targetModuleId) {
                        this.navigateToModule(targetModuleId);
                    }
                });
            }
        });
    }
    updateWatchPanels(isFinal = false) {
        const varsContainer = this.elt.querySelector('#pseudo-watch-vars');
        const stackContainer = this.elt.querySelector('#pseudo-watch-stack');
        const badge = this.elt.querySelector('#pseudo-status-badge');
        if (badge) {
            if (isFinal) {
                badge.innerHTML = `✓ Execution Finished (Step ${this.stepCount})`;
                badge.setAttribute('style', 'background:#064e3b;color:#6ee7b7;border:1px solid #059669;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;');
            }
            else if (this.stepCount > 0) {
                badge.innerHTML = `Stepping (Step ${this.stepCount}, Line ${this.currentState ? this.currentState.currentLine : ''})`;
                badge.setAttribute('style', 'background:#78350f;color:#fde68a;border:1px solid #d97706;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;');
            }
            else {
                badge.innerHTML = 'Ready to Step';
                badge.setAttribute('style', 'background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;');
            }
        }
        if (varsContainer) {
            if (!this.currentState || Object.keys(this.currentState.variables).length === 0) {
                varsContainer.innerHTML = `<span style="color:#64748b;font-style:italic;font-size:12.5px;">No active local variables. Click "Step" to begin.</span>`;
            }
            else {
                const rows = Object.entries(this.currentState.variables)
                    .map(([k, v]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;font-family:monospace;font-size:12px;">
              <span style="color:#38bdf8;font-weight:bold;">${k}:</span>
              <span style="color:#f1f5f9;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v}">${v}</span>
            </div>`)
                    .join('');
                varsContainer.innerHTML = rows;
            }
        }
        if (stackContainer) {
            if (this.currentState && this.currentState.result !== undefined) {
                const resStr = typeof this.currentState.result === 'object' && 'format' in this.currentState.result
                    ? `${this.currentState.result.toString()}`
                    : String(this.currentState.result);
                stackContainer.innerHTML = `
          <div style="background:#064e3b;border:1px solid #059669;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:12.5px;color:#a7f3d0;">
            <strong style="color:#34d399;">Return Value:</strong> ${resStr}
          </div>
        `;
            }
            else if (!this.currentState || this.currentState.callStack.length === 0) {
                stackContainer.innerHTML = `<span style="color:#64748b;font-style:italic;font-size:12.5px;">Stack empty.</span>`;
            }
            else {
                const stackHtml = this.currentState.callStack
                    .map((c, i) => `
            <div style="padding:3px 0;font-family:monospace;font-size:12px;color:#cbd5e1;">
              <span style="color:#64748b;">[${i}]</span> ${c}
            </div>`)
                    .join('');
                stackContainer.innerHTML = stackHtml;
            }
        }
        const telemetryContainer = this.elt.querySelector('#pseudo-telemetry-gauge');
        if (telemetryContainer) {
            const tel = this.currentState?.telemetry || {
                callCount: 0,
                maxCallDepth: 0,
                stepCount: this.stepCount,
                cutCount: 0,
            };
            telemetryContainer.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;font-family:monospace;font-size:12px;">
          <div style="background:#1e293b;border:1px solid #334155;padding:8px 10px;border-radius:6px;">
            <div style="color:#94a3b8;font-size:10.5px;text-transform:uppercase;">Recursive Calls</div>
            <div style="color:#38bdf8;font-size:16px;font-weight:bold;margin-top:2px;">${tel.callCount.toLocaleString()}</div>
            <div style="color:#64748b;font-size:10px;">vs. Dyadic: 1 op</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;padding:8px 10px;border-radius:6px;">
            <div style="color:#94a3b8;font-size:10.5px;text-transform:uppercase;">Max Stack Depth</div>
            <div style="color:#fbbf24;font-size:16px;font-weight:bold;margin-top:2px;">${tel.maxCallDepth.toLocaleString()}</div>
            <div style="color:#64748b;font-size:10px;">vs. Dyadic: 1 frame</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;padding:8px 10px;border-radius:6px;">
            <div style="color:#94a3b8;font-size:10.5px;text-transform:uppercase;">Conway Cuts</div>
            <div style="color:#a855f7;font-size:16px;font-weight:bold;margin-top:2px;">${tel.cutCount.toLocaleString()}</div>
            <div style="color:#64748b;font-size:10px;">vs. Dyadic: 0</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;padding:8px 10px;border-radius:6px;">
            <div style="color:#94a3b8;font-size:10.5px;text-transform:uppercase;">Steps Executed</div>
            <div style="color:#4ade80;font-size:16px;font-weight:bold;margin-top:2px;">${this.stepCount.toLocaleString()}</div>
            <div style="color:#64748b;font-size:10px;">Line evaluations</div>
          </div>
        </div>
      `;
        }
    }
    render() {
        const mod = getPseudoModule(this.currentModuleId) || MODULE_CATALOG.conway_add;
        const presets = ALGO_PRESETS[this.currentModuleId] || ALGO_PRESETS[mod.id] || [];
        const primitivesHtml = mod.primitives
            .map((p) => `<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:#1e293b;border:1px solid #334155;border-radius:4px;font-family:monospace;font-size:11.5px;color:#38bdf8;">${p}</span>`)
            .join(' ');
        const explanationHtml = mod.explanation
            .map((exp, i) => `<li style="margin-bottom:8px;line-height:1.5;"><strong style="color:#1e3a8a;">${i + 1}.</strong> ${exp}</li>`)
            .join('');
        const presetOptions = presets
            .map((p, idx) => `<option value="${idx}" ${idx === this.currentPresetIndex ? 'selected' : ''}>${p.label}</option>`)
            .join('');
        // Navigation Bar (Anchored in narrative vs Drill-down back button)
        let navBarHtml = '';
        if (this.navHistory.length > 1) {
            const prevId = this.navHistory[this.navHistory.length - 2];
            const prevMod = getPseudoModule(prevId);
            const prevLabel = prevMod ? prevMod.funcName : 'Previous Module';
            const breadcrumbs = this.navHistory
                .map((hId, i) => {
                const hMod = getPseudoModule(hId);
                const label = hMod ? hMod.funcName : hId;
                const isCurrent = i === this.navHistory.length - 1;
                return isCurrent
                    ? `<span style="color:#2563eb;font-weight:bold;">${label}</span>`
                    : `<span style="color:#64748b;">${label}</span>`;
            })
                .join(' <span style="color:#cbd5e1;margin:0 4px;">➔</span> ');
            navBarHtml = `
        <div style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="pseudo-btn-back" style="padding:5px 12px;border:1px solid #cbd5e1;background:#ffffff;color:#0f172a;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all 0.15s;">
              ← Back to ${prevLabel}
            </button>
            <div style="font-size:12.5px;font-family:monospace;">
              ${breadcrumbs}
            </div>
          </div>
          <div style="font-size:11.5px;color:#94a3b8;font-style:italic;">
            Module Drill-Down (Primitive / Sub-Module)
          </div>
        </div>
      `;
        }
        else {
            navBarHtml = `
        <div style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Focused Module:</span>
            <span style="font-family:monospace;font-size:13px;color:#1e3a8a;font-weight:bold;">${mod.funcName}</span>
          </div>
          <div style="font-size:12px;color:#64748b;font-style:italic;">
            Anchored in Lecture Narrative
          </div>
        </div>
      `;
        }
        this.elt.innerHTML = `
      <div style="max-width:890px;margin:0 auto;border:1.5px solid #cbd5e1;border-radius:12px;background:#ffffff;box-shadow:0 6px 20px rgba(0,0,0,0.06);overflow:hidden;">
        
        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#f8fafc;padding:12px 18px;border-bottom:1px solid #334155;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="display:inline-block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;background:#3b82f6;color:#ffffff;padding:2px 8px;border-radius:4px;">
                ${mod.badge}
              </span>
              <h2 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">
                ${mod.name}
              </h2>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div style="background:rgba(192,132,252,0.15);border:1px solid #c084fc;color:#e9d5ff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:14px;font-family:monospace;">
                Rule: ${mod.signature || mod.funcName}
              </div>
              <span style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#4ade80;font-size:11px;font-weight:600;padding:2px 8px;border-radius:14px;">
                Directed Equality
              </span>
              <div style="background:rgba(56,189,248,0.12);border:1px solid #38bdf8;color:#7dd3fc;font-size:11px;font-weight:600;padding:2px 8px;border-radius:14px;">
                Atomic Module (1:1)
              </div>
            </div>
          </div>

          <!-- Collapsible Overview Detail (saves vertical real estate for code) -->
          <details style="margin-top:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:6px 12px;font-size:12.5px;color:#cbd5e1;">
            <summary style="cursor:pointer;font-weight:600;color:#38bdf8;outline:none;user-select:none;font-size:12px;display:flex;align-items:center;gap:6px;">
              <span>ℹ️</span> <span>Module Overview &amp; Domain Details</span>
            </summary>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);line-height:1.5;">
              <p style="margin:0 0 10px 0;font-size:13px;color:#e2e8f0;line-height:1.5;">
                ${mod.summary}
              </p>
              <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);padding:8px 12px;border-radius:6px;font-size:12px;display:flex;flex-direction:column;gap:6px;">
                <div>
                  <span style="color:#94a3b8;font-weight:600;">Formal Rule Signature:</span>
                  <span style="font-family:monospace;color:#c084fc;margin-left:6px;font-weight:bold;">rule ${mod.funcName} : ${mod.signature || 'Function'} ≔</span>
                </div>
                <div>
                  <span style="color:#94a3b8;font-weight:600;">Mathematical Domain:</span>
                  <span style="font-family:monospace;color:#f1f5f9;margin-left:6px;font-weight:bold;">${mod.domain}</span>
                </div>
                <div>
                  <span style="color:#94a3b8;font-weight:600;">Direct Invariants:</span>
                  <span style="margin-left:6px;">${primitivesHtml}</span>
                </div>
              </div>
            </div>
          </details>
        </div>

        <!-- Navigation Bar (Breadcrumb or Narrative Anchor) -->
        ${navBarHtml}

        <!-- Body Content -->
        <div style="padding:14px 18px 20px 18px;">

          <!-- Stepper Control Bar -->
          <div style="background:#1e293b;border:1px solid #334155;border-radius:8px 8px 0 0;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <button id="pseudo-btn-step" style="padding:5px 14px;border:1px solid #38bdf8;background:#0284c7;color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;transition:background 0.15s;">
                ⏭ Step Forward
              </button>
              <button id="pseudo-btn-run" style="padding:5px 14px;border:1px solid #22c55e;background:#166534;color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;transition:background 0.15s;">
                ▶ Run Auto
              </button>
              <button id="pseudo-btn-reset" style="padding:5px 12px;border:1px solid #475569;background:#334155;color:#e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;">
                ↺ Reset
              </button>

              <span style="font-size:12px;color:#94a3b8;margin-left:6px;font-weight:600;">Preset:</span>
              <select id="pseudo-select-preset" style="background:#0f172a;color:#f1f5f9;border:1px solid #475569;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;">
                ${presetOptions || `<option value="0">${mod.funcName}()</option>`}
              </select>
            </div>

            <div id="pseudo-status-badge" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;">
              Ready to Step
            </div>
          </div>

          <!-- Code Box Container (Strictly 1-to-1 with Focused Module) -->
          <div id="pseudo-code-container" style="border:1px solid #1e293b;border-top:none;box-shadow:inset 0 2px 6px rgba(0,0,0,0.3);position:relative;">
            <div id="pseudo-editor-body" style="background:#090d16;padding:16px;color:#f1f5f9;font-family:Consolas, 'Courier New', monospace;font-size:13px;overflow-x:auto;max-height:460px;overflow-y:auto;">
              ${highlightPseudoCode(mod.code, -1, mod.funcName)}
            </div>

            <!-- Floating Hover Tooltip (Appears directly at hovered token) -->
            <div id="pseudo-floating-tooltip" style="display:none;position:absolute;z-index:100;pointer-events:none;background:#0b1120;border:1.5px solid #38bdf8;box-shadow:0 8px 24px rgba(0,0,0,0.7);border-radius:8px;padding:8px 12px;font-size:12px;color:#f1f5f9;max-width:340px;transition:opacity 0.12s ease;opacity:0;"></div>
          </div>

          <!-- Sticky Floating Semantic Status Pill (Always visible on screen) -->
          <div id="pseudo-semantic-pill" style="position:sticky;bottom:8px;z-index:40;border:1px solid #334155;border-radius:8px;background:rgba(15,23,42,0.96);backdrop-filter:blur(8px);padding:8px 14px;font-size:12px;color:#cbd5e1;display:flex;align-items:center;justify-content:space-between;min-height:38px;box-shadow:0 4px 16px rgba(0,0,0,0.45);margin:8px 0 20px 0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#94a3b8;font-size:12px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8;"></span>
              <span>Module: <strong style="color:#f1f5f9;font-family:monospace;">${mod.funcName}</strong></span>
              <span style="color:#64748b;">|</span>
              <span style="font-style:italic;">Hover over operators and primitives to view discrete invariants. Click sub-modules to drill down.</span>
            </div>
          </div>

          <!-- Live Variable Watch & Call Stack Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;margin-bottom:22px;">
            
            <!-- Scope Watch Panel -->
            <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11.5px;font-weight:bold;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">
                  🔍 Live Variable Watch
                </span>
                <span style="font-size:11px;color:#64748b;">Active Scope: ${mod.funcName}</span>
              </div>
              <div id="pseudo-watch-vars">
                <span style="color:#64748b;font-style:italic;font-size:12.5px;">No active local variables. Click "Step" to begin.</span>
              </div>
            </div>

            <!-- Call Stack & Return Result -->
            <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11.5px;font-weight:bold;color:#34d399;text-transform:uppercase;letter-spacing:0.5px;">
                  ⚡ Call Stack &amp; Return
                </span>
                <span style="font-size:11px;color:#64748b;">Invocation Tree</span>
              </div>
              <div id="pseudo-watch-stack">
                <span style="color:#64748b;font-style:italic;font-size:12.5px;">Stack empty.</span>
              </div>
            </div>

          </div>

          <!-- Complexity Ledger -->
          <div style="margin-bottom:22px;">
            <h4 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;">
              Dual Architecture Complexity Ledger
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;">
              
              <div style="border:1.5px solid #fecaca;background:#fff5f5;border-radius:8px;padding:14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span style="color:#dc2626;font-weight:bold;font-size:14px;">🌳</span>
                  <span style="font-weight:bold;font-size:13px;color:#991b1b;">Tree-Inductive Formulation</span>
                </div>
                <div style="font-size:13px;color:#7f1d1d;line-height:1.4;">
                  ${mod.complexity.tree}
                </div>
              </div>

              <div style="border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span style="color:#16a34a;font-weight:bold;font-size:14px;">⚙️</span>
                  <span style="font-weight:bold;font-size:13px;color:#166534;">Dyadic Machine Ring Isomorphism</span>
                </div>
                <div style="font-size:13px;color:#14532d;line-height:1.4;">
                  ${mod.complexity.dyadic}
                </div>
              </div>

            </div>

            <!-- Live Inductive Recursion Telemetry Gauge -->
            <div style="background:#0f172a;border:1.5px solid #334155;border-radius:8px;padding:12px 16px;margin-top:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:14px;">📊</span>
                  <span style="font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">
                    Live Inductive Recursion &amp; Complexity Telemetry
                  </span>
                </div>
                <span style="font-size:11px;color:#94a3b8;font-style:italic;">Updated dynamically on step execution</span>
              </div>
              <div id="pseudo-telemetry-gauge">
                <!-- Dynamically populated by updateWatchPanels -->
              </div>
            </div>
          </div>

          <!-- Mathematical Notes & Invariants -->
          <details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;margin-bottom:10px;">
            <summary style="cursor:pointer;font-size:13px;font-weight:700;color:#1e3a8a;outline:none;user-select:none;display:flex;align-items:center;gap:6px;">
              <span>📖</span> <span>Mathematical Notes &amp; Proof Invariants (${mod.name})</span>
            </summary>
            <ul style="margin:10px 0 0 0;padding-left:18px;font-size:13px;color:#334155;line-height:1.5;">
              ${explanationHtml}
            </ul>
          </details>

        </div>

      </div>
    `;
        // Attach event listeners
        const backBtn = this.elt.querySelector('#pseudo-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateBack());
        }
        const stepBtn = this.elt.querySelector('#pseudo-btn-step');
        if (stepBtn) {
            stepBtn.addEventListener('click', () => this.stepForward());
        }
        const runBtn = this.elt.querySelector('#pseudo-btn-run');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.toggleAutoRun());
        }
        const resetBtn = this.elt.querySelector('#pseudo-btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetStepper());
        }
        const presetSelect = this.elt.querySelector('#pseudo-select-preset');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                this.currentPresetIndex = Number(e.target.value);
                this.resetStepper();
            });
        }
        this.attachCodeTokenEvents();
    }
}
export let pseudoViewer;
export function setPseudoViewer() {
    if (!pseudoViewer) {
        pseudoViewer = new PseudoViewer();
    }
    return pseudoViewer;
}
export function initPseudoViewer() {
    setPseudoViewer();
    return pseudoViewer;
}
