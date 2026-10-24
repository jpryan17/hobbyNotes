"use strict";
/**
 * Canonical Formal Statements & Computational Stencils Catalog Builder
 * (Replaces legacy harvestStencils scraper)
 *
 * Generates:
 * 1. clientLib/fsCatalog.json
 * 2. clientLib/fsCatalog.ts
 * 3. nodeUtils/public/fsCatalog.json
 * 4. app1/public/fsCatalog.json
 *
 * Scans all curricular segments in app1/segs for unified <fs-ref> tags
 * to dynamically correlate formal statements with their curricular segment locations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanCurricularReferences = scanCurricularReferences;
exports.validateCurricularReferences = validateCurricularReferences;
exports.buildCurricularCatalog = buildCurricularCatalog;
exports.writeCatalogFiles = writeCatalogFiles;
exports.writeDemoCatalog = writeDemoCatalog;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const leanScaffoldParser_1 = require("./leanScaffoldParser");
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const app1SegsDir = path.resolve(__dirname, '../../app1/segs');
const clientLibDir = path.resolve(__dirname, '../../clientLib');
function scanCurricularReferences() {
    const refMap = {};
    if (!fs.existsSync(app1SegsDir))
        return refMap;
    const segFiles = fs.readdirSync(app1SegsDir).filter(f => f.endsWith('.html'));
    const fsTagRegex = /<fs-ref\b([^>]*)>/gi;
    for (const file of segFiles) {
        const segId = file.replace(/\.html$/, '');
        const content = fs.readFileSync(path.join(app1SegsDir, file), 'utf8');
        let match;
        while ((match = fsTagRegex.exec(content)) !== null) {
            const attrs = match[1];
            const idMatch = /\b(?:id|scaffold|statement-id)=["']?([^"'\s>]+)["']?/i.exec(attrs);
            const rawId = idMatch ? idMatch[1].trim() : '__MISSING_ID__';
            if (!refMap[rawId]) {
                refMap[rawId] = new Set();
            }
            refMap[rawId].add(segId);
        }
    }
    return refMap;
}
/**
 * FAIL-FAST VALIDATOR:
 * Since HTML is no longer scrubbed to synthesize statements, every <fs-ref> in
 * curricular segments must reference an authoritative Formal Statement constructed
 * and verified in the Dev environment. If an ID does not work, the build fails.
 */
function validateCurricularReferences(formalStatements, segmentRefs) {
    const validNumIds = new Set();
    const validStringIds = new Set();
    const validScaffolds = new Set();
    for (const stmt of formalStatements) {
        if (stmt.numId !== undefined) {
            validNumIds.add(String(stmt.numId));
        }
        validStringIds.add(stmt.id.toLowerCase());
        if (stmt.scaffoldKey) {
            validScaffolds.add(stmt.scaffoldKey.toLowerCase());
        }
    }
    const errors = [];
    for (const [rawId, segs] of Object.entries(segmentRefs)) {
        const segList = Array.from(segs).join(', ');
        if (rawId === '__MISSING_ID__') {
            errors.push(`  • <fs-ref> tag missing 'id' attribute in segment(s): [${segList}]`);
            continue;
        }
        const cleanId = rawId.trim().toLowerCase();
        const isNum = /^\d+$/.test(cleanId);
        const isValid = (isNum && validNumIds.has(cleanId)) ||
            validStringIds.has(cleanId) ||
            validScaffolds.has(cleanId);
        if (!isValid) {
            errors.push(`  • ID "${rawId}" referenced in: [${segList}]`);
        }
    }
    if (errors.length > 0) {
        const banner = [
            '',
            '========================================================================',
            '🚨 [buildCatalog FATAL ERROR] UNRESOLVED FORMAL STATEMENT REFERENCES',
            '========================================================================',
            'The following <fs-ref> reference(s) do not resolve to any registered Formal Statement:',
            ...errors,
            '',
            'Middle Way Architecture Invariant:',
            'HTML segments are no longer scrubbed to synthesize statements.',
            'The Dev environment is where Formal Statements must be constructed,',
            'verified against the Lean 4 Scaffold, and registered before reference.',
            'If the ID does not work, it fails.',
            '========================================================================',
            ''
        ].join('\n');
        console.error(banner);
        throw new Error(`Build failed: ${errors.length} unresolved formal statement reference(s).`);
    }
    console.log(`[buildCatalog] Strict ID Check Passed: ${Object.keys(segmentRefs).length} formal statement reference(s) verified across all segments.`);
}
function buildCurricularCatalog() {
    const segmentRefs = scanCurricularReferences();
    function getRefs(id, numId, defaults = []) {
        const set = new Set(defaults);
        const byKey = segmentRefs[id];
        if (byKey)
            byKey.forEach(s => set.add(s));
        const byNum = segmentRefs[String(numId)];
        if (byNum)
            byNum.forEach(s => set.add(s));
        return Array.from(set);
    }
    const formalStatements = [
        // --- Physics Branch: Newtonian Mechanics & Free Fall ---
        {
            numId: 1,
            id: 'fs_newtonian_mechanics',
            type: 'physics',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'boundary_law',
            title: 'Newtonian Dynamics & Boundary Acceleration',
            description: 'Foundational relation between force, inertia, and momentum conservation on ℝ_ω.',
            scaffoldKey: 'newtonian_mechanics',
            expression: 'F = m · a  ∧  p = m · v',
            referencedInSegments: getRefs('fs_newtonian_mechanics', 1, ['stemNewtonianBridge'])
        },
        {
            numId: 2,
            id: 'fs_free_fall_accel',
            parentId: 'fs_newtonian_mechanics',
            type: 'physics',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'boundary_law',
            title: 'Uniform Free Fall Kinematics',
            description: 'Motion under constant gravitational acceleration g on ℝ_ω.',
            scaffoldKey: 'free_fall_accel',
            expression: 'v(t) = v₀ - g · t  ∧  s(t) = v₀·t - (1/2)·g·t²',
            leanSignature: 'theorem free_fall_stencil (v0 g t : R_w) : v = v0 - g * t',
            pseudoAlgoId: 'kinematics_step',
            referencedInSegments: getRefs('fs_free_fall_accel', 2, ['stemNewtonianBridge'])
        },
        // --- Math & Applied Branch: Telescoping FTC & Physical Conserved Fluxes ---
        {
            numId: 3,
            id: 'fs_telescoping_ftc',
            type: 'math',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'boundary_law',
            title: 'Telescoping Fundamental Theorem of Calculus',
            description: 'Discrete interior cancellation collapsing whole-transect sums to boundary differences.',
            scaffoldKey: 'telescoping_ftc',
            expression: '∑_{k=0}^{n-1} ΔF(k) = F(n) - F(0)',
            leanSignature: 'theorem telescoping_ftc (F : Nat → R_w) (n : Nat) : hyper_sum (delta F) n = F n - F 0',
            referencedInSegments: getRefs('fs_telescoping_ftc', 3, ['analysis1DLecture3', 'stemHeatDiffusion'])
        },
        {
            numId: 4,
            id: 'fs_work_energy',
            parentId: 'fs_telescoping_ftc',
            type: 'physics',
            tier: 'law',
            statementKind: 'directed_equality',
            governingSeed: 'boundary_law',
            title: 'Telescoping Work-Energy Principle',
            description: 'Exact cancellation of interior work increments yielding net kinetic energy change.',
            scaffoldKey: 'work_energy',
            expression: 'Δ(KE) = (1/2)·m·v² - (1/2)·m·v₀² = ∑_{k=0}^{n-1} F_k · Δx_k',
            leanSignature: 'theorem work_energy_conservation (m v0 v : R_w) : delta_ke = work_sum',
            referencedInSegments: getRefs('fs_work_energy', 4, ['stemNewtonianBridge'])
        },
        {
            numId: 5,
            id: 'fs_heat_flux',
            parentId: 'fs_telescoping_ftc',
            type: 'physics',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'boundary_law',
            title: 'Discrete Thermal Diffusion Balance',
            description: 'Conservation of thermal energy across discrete boundaries governed by second differences.',
            scaffoldKey: 'heat_flux',
            expression: 'u_j(t + Δt) = u_j(t) + α · (Δt / Δx²) · [u_{j+1}(t) - 2·u_j(t) + u_{j-1}(t)]',
            leanSignature: 'theorem heat_stencil_conservation (alpha dt dx u_L u_C u_R : R_w) : u_new = heat_step alpha dt dx u_L u_C u_R',
            pseudoAlgoId: 'laplacian_heat_step',
            referencedInSegments: getRefs('fs_heat_flux', 5, ['stemHeatDiffusion'])
        },
        // --- Infinitesimal Calculus & Nonstandard Analysis ---
        {
            numId: 6,
            id: 'fs_hyperfinite_derivative',
            type: 'math',
            tier: 'law',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: 'Hyperfinite Difference Quotient Derivative',
            description: 'Standard part of hyperfinite difference quotients matching classical derivative values.',
            scaffoldKey: 'hyperfinite_derivative',
            expression: 'f\'(x) = st([f(x + dx) - f(x)] / dx)  for infinitesimal dx ≠ 0',
            leanSignature: 'theorem nonstandard_derivative (f : R_w → R_w) (x : R_w) (dx : Infinitesimal) : f_prime x = st ((f (x + dx) - f x) / dx)',
            pseudoAlgoId: 'euler_compounding',
            demoRef: { engine: 'bid', mode: 'eulerCompounding', label: 'Euler Compounding in BID' },
            referencedInSegments: getRefs('fs_hyperfinite_derivative', 6, ['analysis1DLecture1', 'analysis1DLecture2'])
        },
        {
            numId: 7,
            id: 'fs_complex_step_invariance',
            type: 'math',
            tier: 'law',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: '2D Complex Step & Modulus Invariance on ℂ_ω',
            description: 'Isotropic step invariance of hypercomplex numbers preserving holomorphic geometry.',
            scaffoldKey: 'complex_step_invariance',
            expression: '|z + dz|² = |z|² + 2·Re(z̄·dz) + |dz|²',
            leanSignature: 'theorem complex_step_modulus (z dz : C_w) : norm_sq (z + dz) = norm_sq z + 2 * Re (conj z * dz) + norm_sq dz',
            referencedInSegments: getRefs('fs_complex_step_invariance', 7, ['analysis2DLecture1'])
        },
        {
            numId: 8,
            id: 'fs_cauchy_riemann_symmetry',
            parentId: 'fs_complex_step_invariance',
            type: 'math',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'shadow_map',
            title: 'Cauchy-Riemann Coordinate Symmetry',
            description: 'Equalities of partial derivatives underpinning hypercomplex conformal mappings.',
            scaffoldKey: 'cauchy_riemann_symmetry',
            expression: '∂u/∂x = ∂v/∂y  ∧  ∂u/∂y = -∂v/∂x',
            leanSignature: 'theorem cauchy_riemann_orthogonality (u v : R_w → R_w → R_w) : du_dx = dv_dy ∧ du_dy = -dv_dx',
            referencedInSegments: getRefs('fs_cauchy_riemann_symmetry', 8, ['analysis2DLecture1', 'analysis2DIntro'])
        },
        {
            numId: 9,
            id: 'fs_contour_cauchy_goursat',
            parentId: 'fs_cauchy_riemann_symmetry',
            type: 'math',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'shadow_map',
            title: 'Hyperfinite Cauchy-Goursat Loop Vanishing',
            description: 'Sum of holomorphic increments along a closed discrete polygon collapses to zero.',
            scaffoldKey: 'contour_cauchy_goursat',
            expression: '∮_γ f(z) dz = ∑_{k=0}^{N-1} f(z_k)·(z_{k+1} - z_k) ≃ 0',
            leanSignature: 'theorem cauchy_goursat_loop (f : C_w → C_w) (gamma : ClosedContour) : hyper_sum (eval_step f gamma) = 0',
            referencedInSegments: getRefs('fs_contour_cauchy_goursat', 9, ['analysis2DLecture2'])
        },
        {
            numId: 10,
            id: 'fs_lee_yang_circle',
            parentId: 'fs_complex_step_invariance',
            type: 'physics',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'shadow_map',
            title: 'The Lee-Yang Unit Circle Partition Theorem',
            description: 'All partition function zeros of ferromagnetic Ising systems lie precisely on the unit circle |z| = 1.',
            scaffoldKey: 'lee_yang_circle',
            expression: 'Z_N(z) = 0 ⟹ |z| = 1  in the complex fugacity plane',
            leanSignature: 'theorem lee_yang_circle (N : Nat) (z : C_w) (hZ : ising_partition N z = 0) : norm z = 1',
            referencedInSegments: getRefs('fs_lee_yang_circle', 10, ['analysis2DLecture3', 'analysis2DIntro'])
        },
        // --- Oscillations & Harmonic Geometry ---
        {
            numId: 11,
            id: 'fs_harmonic_oscillator',
            type: 'physics',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'boundary_law',
            title: 'Harmonic Leapfrog Phase Space Orbit',
            description: 'Exact energy preservation in discrete symplectic integration of harmonic oscillators.',
            scaffoldKey: 'harmonic_oscillator',
            expression: 'x(t + dt) = x(t) + v(t + dt/2)·dt  ∧  v(t + dt/2) = v(t - dt/2) - ω²·x(t)·dt',
            leanSignature: 'theorem harmonic_leapfrog_energy (x0 v0 omega dt : R_w) : leapfrog_energy x0 v0 = initial_energy',
            pseudoAlgoId: 'kinematics_step',
            referencedInSegments: getRefs('fs_harmonic_oscillator', 11, ['stemNewtonianBridge', 'vectorsLecture2'])
        },
        // --- Information, Probability & Quantum Foundations ---
        {
            numId: 12,
            id: 'fs_three_polarizer_quantum',
            type: 'physics',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: 'Three-Polarizer Geometric Quantum Transmission',
            description: 'Quantum state projection through intermediate non-orthogonal polarization filters.',
            scaffoldKey: 'three_polarizer_quantum',
            expression: 'I = I₀ · cos²(θ₁) · cos²(θ₂ - θ₁)',
            leanSignature: 'theorem three_polarizer_transmission (I0 theta1 theta2 : R_w) : I_trans = I0 * (cos theta1)^2 * (cos (theta2 - theta1))^2',
            referencedInSegments: getRefs('fs_three_polarizer_quantum', 12, ['quantumLogicLecture1', 'quantumLogicLecture3', 'vectorsLecture3'])
        },
        {
            numId: 13,
            id: 'fs_hyperfinite_probability',
            type: 'information',
            tier: 'constitutional',
            statementKind: 'axiom',
            governingSeed: 'shadow_map',
            title: 'Hyperfinite Normalized Probability Space',
            description: 'Uniform hyperfinite counting probability with infinitesimal resolution and no null sets.',
            scaffoldKey: 'hyperfinite_probability',
            expression: 'P(A) = st(|A| / |Ω|)  where |Ω| = H ∈ *ℕ \\ ℕ',
            leanSignature: 'theorem hyperfinite_probability_measure (Omega : HyperfiniteSampleSpace) (A : Event Omega) : P A = st (card A / card Omega)',
            referencedInSegments: getRefs('fs_hyperfinite_probability', 13, ['bayesianInferenceLecture1'])
        },
        {
            numId: 14,
            id: 'fs_bayes_updating',
            parentId: 'fs_hyperfinite_probability',
            type: 'information',
            tier: 'law',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: 'Hyperfinite Bayesian Likelihood Inversion',
            description: 'Strictly positive hyperfinite updating preserving order under evidence accumulation.',
            scaffoldKey: 'bayes_updating',
            expression: 'P(H|E) = [P(E|H) · P(H)] / [P(E|H)·P(H) + P(E|¬H)·P(¬H)]',
            leanSignature: 'theorem bayes_rule (pH pE_H pE_notH : R_w) : p_posterior = (pE_H * pH) / (pE_H * pH + pE_notH * (1 - pH))',
            pseudoAlgoId: 'bayes_discrete_update',
            referencedInSegments: getRefs('fs_bayes_updating', 14, ['bayesianInferenceLecture2', 'bayesianInferenceLecture3', 'quantumBayesianInferenceLecture1', 'formalStatementsIntro'])
        },
        // --- Foundations of Numbers & Dyadic Trees ---
        {
            numId: 15,
            id: 'fs_tree2_totally_ordered',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'theorem',
            governingSeed: 'conway_cut',
            title: 'Total Ordering on Conway Sign Sequences (Tree2)',
            description: 'Strict trichotomy and transitivity of Conway sign sequences representing Surreal dyadics.',
            scaffoldKey: 'D_w_is_totally_ordered',
            expression: '∀ x y ∈ Tree2, (x < y) ∨ (x = y) ∨ (y < x)',
            leanSignature: 'theorem Tree2.totally_ordered (x y : Tree2) : x < y ∨ x = y ∨ y < x',
            pseudoAlgoId: 'conway_order',
            demoRef: { engine: 'btd', mode: 'order', label: 'Conway Tree Order Relations' },
            referencedInSegments: getRefs('fs_tree2_totally_ordered', 15, ['numbersLecture2'])
        },
        {
            numId: 16,
            id: 'fs_ptolemaic_half_angle',
            type: 'math',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'conway_cut',
            title: 'Dyadic Ptolemaic Half-Angle Root Bisection',
            description: 'Algebraic calculation of sine and chord values via iterative nested square root bisections.',
            scaffoldKey: 'dyadic_ptolemaic_sine',
            expression: 'sin(θ/2) = √((1 - cos(θ)) / 2)',
            leanSignature: 'theorem ptolemaic_half_angle (theta : R_w) : sin (theta / 2) = sqrt ((1 - cos theta) / 2)',
            pseudoAlgoId: 'rotor_trig_cordic',
            referencedInSegments: getRefs('fs_ptolemaic_half_angle', 16, ['stemTrigFoundations'])
        },
        {
            numId: 17,
            id: 'fs_standard_part_homomorphism',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'theorem',
            governingSeed: 'shadow_map',
            title: 'Standard Part Ring Homomorphism st(·)',
            description: 'Preservation of addition and multiplication under standard part shadow projection from finite ℝ_ω to ℝ.',
            scaffoldKey: 'standard_part_homomorphism',
            expression: 'st(x + y) = st(x) + st(y)  ∧  st(x · y) = st(x) · st(y)',
            leanSignature: 'theorem standard_part_is_homomorphism (x y : R_w_fin) : st (x + y) = st x + st y ∧ st (x * y) = st x * st y',
            referencedInSegments: getRefs('fs_standard_part_homomorphism', 17, ['analysis1DLecture1', 'analysis2DLecture1', 'vectorsLecture1', 'formalStatementsIntro'])
        },
        {
            numId: 18,
            id: 'fs_cauchy_schwarz_discrete',
            type: 'math',
            tier: 'law',
            statementKind: 'theorem',
            governingSeed: 'boundary_law',
            title: 'Discrete Cauchy-Schwarz Inner Product Inequality',
            description: 'Fundamental geometric bound on hyperfinite Euclidean and Hilbert space projections.',
            scaffoldKey: 'cauchy_schwarz_discrete',
            expression: '|⟨u, v⟩|² ≤ ⟨u, u⟩ · ⟨v, v⟩',
            leanSignature: 'theorem cauchy_schwarz_hyperfinite (u v : HyperVector N) : (inner_product u v)^2 ≤ inner_product u u * inner_product v v',
            referencedInSegments: getRefs('fs_cauchy_schwarz_discrete', 18, ['vectorsLecture3'])
        },
        {
            numId: 19,
            id: 'fs_polygonal_rim_chord',
            type: 'math',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'conway_cut',
            title: 'Dyadic Polygonal Rim Chord Law',
            description: 'Calculation of regular polygonal rim segment lengths on the discrete circle.',
            scaffoldKey: 'polygonal_rim_chord',
            expression: 'c_n = 2 · sin(π / n)',
            leanSignature: 'theorem rim_chord_length (n : Nat) : chord_len n = 2 * sin (pi / n)',
            pseudoAlgoId: 'rotor_trig_cordic',
            referencedInSegments: getRefs('fs_polygonal_rim_chord', 19, ['stemTrigFoundations'])
        },
        {
            numId: 20,
            id: 'fs_euler_identity_rotor',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: 'Euler Polar Rotor Decomposition',
            description: 'Representation of complex units as exponential orthogonal phase rotators.',
            scaffoldKey: 'euler_identity_rotor',
            expression: 'e^{iθ} = cos(θ) + i · sin(θ)',
            leanSignature: 'theorem euler_rotor_identity (theta : R_w) : exp_i theta = Complex.mk (cos theta) (sin theta)',
            pseudoAlgoId: 'rotor_trig_cordic',
            referencedInSegments: getRefs('fs_euler_identity_rotor', 20, ['stemTrigFoundations', 'formalStatementsIntro'])
        },
        {
            numId: 21,
            id: 'fs_unit_rotor_projection',
            parentId: 'fs_euler_identity_rotor',
            type: 'math',
            tier: 'scenario',
            statementKind: 'directed_equality',
            governingSeed: 'shadow_map',
            title: 'Unit Rotor Sine & Cosine Projection',
            description: 'Orthogonal coordinate projection of 2D unit rotors under angle parameterization.',
            scaffoldKey: 'unit_rotor_projection',
            expression: 'x = cos(θ),  y = sin(θ)  with  x² + y² = 1',
            leanSignature: 'theorem unit_rotor_norm (theta : R_w) : (cos theta)^2 + (sin theta)^2 = 1',
            pseudoAlgoId: 'rotor_trig_cordic',
            referencedInSegments: getRefs('fs_unit_rotor_projection', 21, ['stemTrigFoundations'])
        },
        {
            numId: 22,
            id: 'fs_dyadic_isomorphism',
            parentId: 'fs_tree2_totally_ordered',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'axiom',
            governingSeed: 'conway_cut',
            title: 'The Core Dyadic Isomorphism Tree2 ≡ 𝔻',
            description: 'Order and ring isomorphism between sign-sequence trees and dyadic rationals.',
            scaffoldKey: 'Tree2_finite_is_dyad',
            expression: 'Tree2(s) ≅ m / 2^n  ∧  Tree2 ↪ ℝ_ω',
            leanSignature: 'axiom Tree2_finite_is_dyad (t : Tree1) : Tree2_at (Tree1.toOrd t) = Dyad',
            demoRef: { engine: 'btd', mode: 'isomorphism', label: 'Operation Isomorphism in BTD' },
            referencedInSegments: getRefs('fs_dyadic_isomorphism', 22, ['numbersLecture2'])
        },
        {
            numId: 23,
            id: 'fs_van_den_dries_ehrlich',
            parentId: 'fs_tree2_totally_ordered',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'axiom',
            governingSeed: 'conway_cut',
            title: 'van den Dries–Ehrlich Subfield Theorem (2001)',
            description: 'Proof that the surreal numbers No(ε₀) formed at stage ε₀ constitute a real-closed field.',
            scaffoldKey: 'No_eps0_totally_ordered',
            expression: 'No(ε₀) is a real-closed field  ∧  No(ω) ⊂ No(ε₀) ⊂ No',
            leanSignature: 'axiom No_eps0_totally_ordered : TotalOrder No_eps0 No_eps0_le',
            referencedInSegments: getRefs('fs_van_den_dries_ehrlich', 23, ['numbersLecture2'])
        },
        {
            numId: 24,
            id: 'fs_conway_addition',
            parentId: 'fs_tree2_totally_ordered',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'directed_equality',
            governingSeed: 'conway_cut',
            title: 'Conway Inductive Addition (+)',
            description: 'Recursive bilateral addition on tree options choosing the simplest number born in the resulting cut gap.',
            scaffoldKey: 'conway_addition',
            expression: 'x + y = { xᴸ + y, x + yᴸ | xᴿ + y, x + yᴿ }',
            leanSignature: 'def Conway.add (x y : Tree2) : Tree2',
            pseudoAlgoId: 'conway_add',
            demoRef: { engine: 'btd', mode: 'addition', label: 'Conway Inductive Addition in BTD' },
            referencedInSegments: getRefs('fs_conway_addition', 24, ['numbersLecture2'])
        },
        {
            numId: 25,
            id: 'fs_conway_multiplication',
            parentId: 'fs_tree2_totally_ordered',
            type: 'math',
            tier: 'constitutional',
            statementKind: 'directed_equality',
            governingSeed: 'conway_cut',
            title: 'Conway Inductive Multiplication (·)',
            description: 'Recursive 4-way cross-product multiplication on tree options ensuring (x - xᴸ)(y - yᴸ) > 0.',
            scaffoldKey: 'conway_multiplication',
            expression: 'x · y = { xᴸ·y + x·yᴸ - xᴸ·yᴸ, xᴿ·y + x·yᴿ - xᴿ·yᴿ | xᴸ·y + x·yᴿ - xᴸ·yᴿ, xᴿ·y + x·yᴸ - xᴿ·yᴸ }',
            leanSignature: 'def Conway.mul (x y : Tree2) : Tree2',
            pseudoAlgoId: 'conway_mul',
            demoRef: { engine: 'btd', mode: 'multiplication', label: 'Conway Inductive Multiplication in BTD' },
            referencedInSegments: getRefs('fs_conway_multiplication', 25, ['numbersLecture2'])
        },
        {
            numId: 39,
            id: 'fs_geometric_scale_step',
            type: 'math',
            tier: 'law',
            statementKind: 'directed_equality',
            governingSeed: 'boundary_law',
            title: 'Chromatic Scale Geometric Progression',
            description: 'In twelve-tone equal temperament (12-TET), each semitone step multiplies frequency by 2^(1/12), forming a geometric sequence with ratio r = 2^(1/12).',
            scaffoldKey: 'geometric_scale_step',
            expression: 'f_k = f_0 · (2^(1/12))^k',
            pseudoAlgoId: 'algo_geometric_scale_step',
            referencedInSegments: getRefs('fs_geometric_scale_step', 39, ['sequencesAndSums'])
        }
    ];
    // Dynamic Lean 4 Scaffold Verification:
    // Classify each Formal Statement as 'certified' (has exact verified Lean declaration)
    // or 'pending' (conceptual / scenario statement awaiting further Lean formalization).
    const scaffoldDecls = (0, leanScaffoldParser_1.parseScaffoldDeclarations)().declarations;
    let certifiedCount = 0;
    let pendingCount = 0;
    for (const stmt of formalStatements) {
        const key = stmt.scaffoldKey.replace(/^scaffold:/, '');
        let sigName = '';
        if (stmt.leanSignature) {
            const m = /^(?:theorem|def|axiom|structure|inductive)\s+([a-zA-Z0-9_'.]+)/.exec(stmt.leanSignature);
            if (m)
                sigName = m[1];
        }
        if (scaffoldDecls[key] || (sigName && scaffoldDecls[sigName])) {
            stmt.leanStatus = 'certified';
            certifiedCount++;
        }
        else {
            stmt.leanStatus = 'pending';
            pendingCount++;
        }
    }
    const calculationModes = [
        // --- Physics: Uniform Free Fall ---
        {
            id: 'ff_v_from_v0_g_t',
            statementId: 'fs_free_fall_accel',
            label: 'Compute Terminal Velocity v(t)',
            targetSymbol: 'v',
            targetDomain: 'ℝ_ω',
            targetUnit: 'm/s',
            formulaDescription: 'v = v₀ - g · t',
            formulaExpr: 'v0 - g * t',
            hasSimulation: true,
            inputs: [
                { name: 'v0', symbol: 'v₀', domain: 'ℝ_ω', unit: 'm/s', defaultValue: 0, description: 'Initial vertical velocity' },
                { name: 'g', symbol: 'g', domain: 'ℝ_ω', unit: 'm/s²', defaultValue: 9.8, min: 0, max: 50, step: 0.1, description: 'Uniform gravitational acceleration' },
                { name: 't', symbol: 't', domain: 'ℝ_ω', unit: 's', defaultValue: 2, min: 0, max: 100, step: 0.1, description: 'Elapsed duration' }
            ]
        },
        {
            id: 'ff_t_from_v_v0_g',
            statementId: 'fs_free_fall_accel',
            label: 'Compute Fall Duration t',
            targetSymbol: 't',
            targetDomain: 'ℝ_ω',
            targetUnit: 's',
            formulaDescription: 't = (v₀ - v) / g',
            formulaExpr: '(v0 - v) / g',
            inputs: [
                { name: 'v0', symbol: 'v₀', domain: 'ℝ_ω', unit: 'm/s', defaultValue: 10, description: 'Initial velocity' },
                { name: 'v', symbol: 'v', domain: 'ℝ_ω', unit: 'm/s', defaultValue: 0, description: 'Current/Target velocity' },
                { name: 'g', symbol: 'g', domain: 'ℝ_ω', unit: 'm/s²', defaultValue: 9.8, min: 0.1, max: 50, step: 0.1, description: 'Gravitational acceleration' }
            ]
        },
        {
            id: 'ff_s_from_v0_g_t',
            statementId: 'fs_free_fall_accel',
            label: 'Compute Vertical Displacement s(t)',
            targetSymbol: 's',
            targetDomain: 'ℝ_ω',
            targetUnit: 'm',
            formulaDescription: 's = v₀ · t - 0.5 · g · t²',
            formulaExpr: 'v0 * t - 0.5 * g * t * t',
            hasSimulation: true,
            inputs: [
                { name: 'v0', symbol: 'v₀', domain: 'ℝ_ω', unit: 'm/s', defaultValue: 0, description: 'Initial vertical velocity' },
                { name: 'g', symbol: 'g', domain: 'ℝ_ω', unit: 'm/s²', defaultValue: 9.8, min: 0, max: 50, step: 0.1, description: 'Gravitational acceleration' },
                { name: 't', symbol: 't', domain: 'ℝ_ω', unit: 's', defaultValue: 2, min: 0, max: 100, step: 0.1, description: 'Elapsed duration' }
            ]
        },
        // --- Physics: Work-Energy Conservation ---
        {
            id: 'we_ke_from_m_v',
            statementId: 'fs_work_energy',
            label: 'Compute Kinetic Energy KE',
            targetSymbol: 'KE',
            targetDomain: 'ℝ_ω',
            targetUnit: 'J',
            formulaDescription: 'KE = 0.5 · m · v²',
            formulaExpr: '0.5 * m * v * v',
            inputs: [
                { name: 'm', symbol: 'm', domain: 'ℝ_ω', unit: 'kg', defaultValue: 2.0, min: 0.01, step: 0.1, description: 'Particle inertial mass' },
                { name: 'v', symbol: 'v', domain: 'ℝ_ω', unit: 'm/s', defaultValue: 5.0, step: 0.5, description: 'Instantaneous speed' }
            ]
        },
        {
            id: 'we_v_from_ke_m',
            statementId: 'fs_work_energy',
            label: 'Compute Velocity from Kinetic Energy',
            targetSymbol: 'v',
            targetDomain: 'ℝ_ω',
            targetUnit: 'm/s',
            formulaDescription: 'v = √(2 · KE / m)',
            formulaExpr: 'Math.sqrt(2 * KE / m)',
            inputs: [
                { name: 'KE', symbol: 'KE', domain: 'ℝ_ω', unit: 'J', defaultValue: 25.0, min: 0, step: 1.0, description: 'Kinetic energy' },
                { name: 'm', symbol: 'm', domain: 'ℝ_ω', unit: 'kg', defaultValue: 2.0, min: 0.01, step: 0.1, description: 'Mass' }
            ]
        },
        // --- Physics: Discrete Heat Diffusion ---
        {
            id: 'diff_heat_step',
            statementId: 'fs_heat_flux',
            label: 'Compute Next Center Temperature u_C(t + Δt)',
            targetSymbol: 'u_new',
            targetDomain: 'ℝ_ω',
            targetUnit: '°C',
            formulaDescription: 'u_new = u_C + α · (Δt / Δx²) · (u_L - 2·u_C + u_R)',
            formulaExpr: 'u_C + alpha * (dt / (dx * dx)) * (u_L - 2 * u_C + u_R)',
            hasSimulation: true,
            inputs: [
                { name: 'alpha', symbol: 'α', domain: 'ℝ_ω', unit: 'm²/s', defaultValue: 0.1, min: 0.001, max: 1.0, step: 0.01, description: 'Thermal diffusivity' },
                { name: 'dt', symbol: 'Δt', domain: 'ℝ_ω', unit: 's', defaultValue: 0.01, min: 0.001, max: 1.0, step: 0.005, description: 'Time step increment' },
                { name: 'dx', symbol: 'Δx', domain: 'ℝ_ω', unit: 'm', defaultValue: 0.1, min: 0.01, max: 2.0, step: 0.01, description: 'Spatial mesh spacing' },
                { name: 'u_L', symbol: 'u_L', domain: 'ℝ_ω', unit: '°C', defaultValue: 100.0, step: 5.0, description: 'Left neighbor temperature' },
                { name: 'u_C', symbol: 'u_C', domain: 'ℝ_ω', unit: '°C', defaultValue: 50.0, step: 5.0, description: 'Center node temperature' },
                { name: 'u_R', symbol: 'u_R', domain: 'ℝ_ω', unit: '°C', defaultValue: 20.0, step: 5.0, description: 'Right neighbor temperature' }
            ]
        },
        // --- Mathematics: Hyperfinite Difference Derivative ---
        {
            id: 'diff_poly_square',
            statementId: 'fs_hyperfinite_derivative',
            label: 'Hyperfinite Derivative of f(x) = x²',
            targetSymbol: 'f\'(x)',
            targetDomain: 'ℝ_ω',
            formulaDescription: 'f\'(x) = [(x + dx)² - x²] / dx = 2x + dx  ⟹  st(f\'(x)) = 2x',
            formulaExpr: '((x + dx) * (x + dx) - x * x) / dx',
            inputs: [
                { name: 'x', symbol: 'x', domain: 'ℝ_ω', defaultValue: 3.0, step: 0.5, description: 'Base evaluation point' },
                { name: 'dx', symbol: 'dx', domain: 'Infinitesimal', defaultValue: 0.0001, min: 0.000001, max: 0.01, step: 0.0001, description: 'Nonstandard infinitesimal step' }
            ]
        },
        // --- Mathematics: 2D Complex Modulus Step ---
        {
            id: 'cplx_step_norm',
            statementId: 'fs_complex_step_invariance',
            label: 'Compute 2D Step Modulus |z + dz|²',
            targetSymbol: '|z + dz|²',
            targetDomain: 'ℝ_ω',
            formulaDescription: '|z + dz|² = (x + dx)² + (y + dy)²',
            formulaExpr: '(x + dx) * (x + dx) + (y + dy) * (y + dy)',
            inputs: [
                { name: 'x', symbol: 'Re(z)', domain: 'ℝ_ω', defaultValue: 3.0, step: 0.5, description: 'Real component of z' },
                { name: 'y', symbol: 'Im(z)', domain: 'ℝ_ω', defaultValue: 4.0, step: 0.5, description: 'Imaginary component of z' },
                { name: 'dx', symbol: 'Re(dz)', domain: 'ℝ_ω', defaultValue: 0.01, step: 0.005, description: 'Real step increment' },
                { name: 'dy', symbol: 'Im(dz)', domain: 'ℝ_ω', defaultValue: 0.02, step: 0.005, description: 'Imaginary step increment' }
            ]
        },
        // --- Information: Bayesian Discrete Update ---
        {
            id: 'bayes_posterior',
            statementId: 'fs_bayes_updating',
            label: 'Compute Posterior P(H | E)',
            targetSymbol: 'P(H|E)',
            targetDomain: '[0, 1]',
            formulaDescription: 'P(H|E) = (P(E|H) · P(H)) / [P(E|H)·P(H) + P(E|¬H)·(1 - P(H))]',
            formulaExpr: '(pE_H * pH) / (pE_H * pH + pE_notH * (1.0 - pH))',
            hasSimulation: true,
            inputs: [
                { name: 'pH', symbol: 'P(H)', domain: '[0, 1]', defaultValue: 0.5, min: 0.001, max: 0.999, step: 0.05, description: 'Prior probability of hypothesis H' },
                { name: 'pE_H', symbol: 'P(E|H)', domain: '[0, 1]', defaultValue: 0.8, min: 0.0, max: 1.0, step: 0.05, description: 'Likelihood: P(Evidence | H is True)' },
                { name: 'pE_notH', symbol: 'P(E|¬H)', domain: '[0, 1]', defaultValue: 0.2, min: 0.0, max: 1.0, step: 0.05, description: 'False Alarm: P(Evidence | H is False)' }
            ]
        },
        // --- Physics: Quantum Three-Polarizer Transmission ---
        {
            id: 'quantum_three_polarizer',
            statementId: 'fs_three_polarizer_quantum',
            label: 'Compute Quantum Transmission Intensity I',
            targetSymbol: 'I / I₀',
            targetDomain: '[0, 1]',
            formulaDescription: 'I / I₀ = cos²(θ₁) · cos²(θ₂ - θ₁)',
            formulaExpr: 'Math.cos(theta1 * Math.PI / 180)**2 * Math.cos((theta2 - theta1) * Math.PI / 180)**2',
            hasSimulation: true,
            inputs: [
                { name: 'theta1', symbol: 'θ₁', domain: '[0°, 90°]', unit: 'deg', defaultValue: 45.0, min: 0, max: 90, step: 1.0, description: 'Angle of intermediate polarizer' },
                { name: 'theta2', symbol: 'θ₂', domain: '[0°, 90°]', unit: 'deg', defaultValue: 90.0, min: 0, max: 90, step: 1.0, description: 'Angle of final analyzer' }
            ]
        },
        // --- Mathematics: Ptolemaic Dyadic Half-Angle Sine ---
        {
            id: 'ptolemaic_sine_half',
            statementId: 'fs_ptolemaic_half_angle',
            label: 'Compute Dyadic Half-Angle Sine sin(θ/2)',
            targetSymbol: 'sin(θ/2)',
            targetDomain: '[-1, 1]',
            formulaDescription: 'sin(θ/2) = √((1 - cos(θ)) / 2)',
            formulaExpr: 'Math.sqrt(Math.max(0, (1 - cosTheta) / 2))',
            inputs: [
                { name: 'cosTheta', symbol: 'cos(θ)', domain: '[-1, 1]', defaultValue: 0.5, min: -1.0, max: 1.0, step: 0.05, description: 'Cosine of parent angle θ' }
            ]
        },
        // --- Mathematics: Regular Polygonal Rim Chord ---
        {
            id: 'polygonal_chord_calc',
            statementId: 'fs_polygonal_rim_chord',
            label: 'Compute Regular Polygon Rim Chord Length',
            targetSymbol: 'c_n',
            targetDomain: 'ℝ_ω',
            formulaDescription: 'c_n = 2 · sin(π / n)',
            formulaExpr: '2 * Math.sin(Math.PI / n)',
            inputs: [
                { name: 'n', symbol: 'n', domain: 'ℕ', defaultValue: 6, min: 3, max: 128, step: 1, description: 'Number of polygon sides' }
            ]
        },
        // --- Mathematics: Unit Rotor Phase Projection ---
        {
            id: 'rotor_phase_projection',
            statementId: 'fs_unit_rotor_projection',
            label: 'Compute Unit Rotor (x, y) = (cos θ, sin θ)',
            targetSymbol: '(x, y)',
            targetDomain: 'ℂ_ω',
            formulaDescription: 'x = cos(θ),  y = sin(θ)  with x² + y² = 1',
            formulaExpr: 'Math.cos(thetaRad)',
            inputs: [
                { name: 'thetaRad', symbol: 'θ', domain: '[0, 2π]', unit: 'rad', defaultValue: 0.785398, min: 0, max: 6.283185, step: 0.05, description: 'Rotor angle in radians' }
            ]
        },
        {
            id: 'music_et_scale_step',
            statementId: 'fs_geometric_scale_step',
            label: 'Chromatic Frequency f_k = f₀ · (2^(1/12))^k',
            targetSymbol: 'f_k',
            targetDomain: 'ℝ_ω',
            targetUnit: 'Hz',
            formulaDescription: 'f_k = f₀ · (2^(1/12))^k',
            formulaExpr: 'f0 * Math.pow(2, k / 12)',
            inputs: [
                { name: 'f0', symbol: 'f₀', domain: 'ℝ⁺', unit: 'Hz', defaultValue: 440.0, min: 20.0, max: 20000.0, step: 1.0, description: 'Reference base pitch (e.g., Concert A = 440 Hz)' },
                { name: 'k', symbol: 'k', domain: 'ℕ', unit: 'semitones', defaultValue: 0, min: 0, max: 24, step: 1.0, description: 'Semitone index offset (0 = unison, 12 = octave, 24 = two octaves)' }
            ]
        }
    ];
    const examples = [
        {
            id: 'ex_equal_temperament_c5',
            modeId: 'music_et_scale_step',
            statementId: 'fs_geometric_scale_step',
            title: 'Concert Pitch A4 to Middle C5 (3 Semitones)',
            values: { f0: 440.0, k: 3 },
            displayResult: '523.251 Hz',
            formattedFormula: 'f_3 = 440 · (2^(1/12))^3 ≈ 523.251 Hz',
            domainBadge: '∈ ℝ_ω',
            notes: 'Three semitones above Concert A4 (440 Hz) yields equal-tempered C5.'
        },
        {
            id: 'ex_earth_free_fall',
            modeId: 'ff_v_from_v0_g_t',
            statementId: 'fs_free_fall_accel',
            presetKey: 'cas_free_fall_kinematics',
            title: 'Earth Gravity Drop from Rest',
            values: { v0: 0.0, g: 9.8, t: 3.0 },
            displayResult: '-29.400 m/s',
            formattedFormula: 'v = (0.00) - (9.80) · (3.00)',
            domainBadge: '∈ ℝ_ω',
            notes: 'Constant acceleration drops velocity linearly over 3 seconds.'
        },
        {
            id: 'ex_mars_free_fall',
            modeId: 'ff_v_from_v0_g_t',
            statementId: 'fs_free_fall_accel',
            title: 'Mars Rover Descent Stage',
            values: { v0: 15.0, g: 3.71, t: 3.0 },
            displayResult: '3.870 m/s',
            formattedFormula: 'v = (15.00) - (3.71) · (3.00)',
            domainBadge: '∈ ℝ_ω'
        },
        {
            id: 'ex_cart_braking',
            modeId: 'we_ke_from_m_v',
            statementId: 'fs_work_energy',
            presetKey: 'newton_work_energy',
            title: 'Laboratory Cart Kinetic Energy',
            values: { m: 2.0, v: 10.0 },
            displayResult: '100.000 J',
            formattedFormula: 'KE = 0.5 · (2.00) · (10.00)²',
            domainBadge: '∈ ℝ_ω',
            notes: 'Matches exact work integral: W = ∫ F dx = 100 J.'
        },
        {
            id: 'ex_thermal_slab',
            modeId: 'diff_heat_step',
            statementId: 'fs_heat_flux',
            presetKey: 'heat_slice_flux',
            title: 'Interior Thermal Slab Conduction',
            values: { alpha: 0.15, dt: 0.02, dx: 0.1, u_L: 100.0, u_C: 50.0, u_R: 20.0 },
            displayResult: '56.000 °C',
            formattedFormula: 'u_new = (50.0) + (0.15)·(0.02 / 0.01)·[(100.0) - 2·(50.0) + (20.0)]',
            domainBadge: '∈ ℝ_ω',
            notes: 'Positive net curvature (100 - 100 + 20 = 20) drives net warming.'
        },
        {
            id: 'ex_medical_test',
            modeId: 'bayes_posterior',
            statementId: 'fs_bayes_updating',
            presetKey: 'cas_bayes_filter',
            title: 'Medical Diagnostic Screen Update',
            values: { pH: 0.05, pD_H: 0.95, pD_notH: 0.10 },
            displayResult: '0.333',
            formattedFormula: 'P(H|D) = (0.95 · 0.05) / [ (0.95 · 0.05) + (0.10 · 0.95) ]',
            domainBadge: '∈ [0, 1]',
            notes: 'Low prior prevalence dampens positive predictive value.'
        }
    ];
    // Strictly enforce fail-fast invariant: if any ID referenced in HTML cannot be resolved, halt build!
    validateCurricularReferences(formalStatements, segmentRefs);
    return {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        formalStatements,
        calculationModes,
        examples
    };
}
function writeCatalogFiles() {
    const catalog = buildCurricularCatalog();
    const jsonContent = JSON.stringify(catalog, null, 2);
    // 1. Write clientLib/fsCatalog.json
    const clientJsonPath = path.join(clientLibDir, 'fsCatalog.json');
    fs.writeFileSync(clientJsonPath, jsonContent, 'utf8');
    console.log(`[buildCatalog] Wrote catalog JSON to: ${clientJsonPath}`);
    // 2. Write clientLib/fsCatalog.ts for zero-config ES module imports
    const tsContent = `/**
 * Pre-compiled Relational Catalog of Curricular Formal Statements,
 * Directional Calculation Modes, and Verified Presets.
 *
 * Generated automatically by nodeUtils/buildCatalog.ts
 */

export type FsStatementType = 'math' | 'physics' | 'information';

export interface FsCatalogDemoRef {
  engine: 'btd' | 'bid' | 'ttd';
  mode: string;
  label: string;
}

export interface FsCatalogStatement {
  id: string;
  numId?: number;
  statementKind?: 'axiom' | 'theorem' | 'directed_equality';
  pseudoAlgoId?: string | number;
  demoRef?: FsCatalogDemoRef;
  parentId?: string;
  type: FsStatementType;
  tier: 'constitutional' | 'law' | 'scenario';
  title: string;
  description?: string;
  governingSeed?: 'conway_cut' | 'shadow_map' | 'boundary_law';
  scaffoldKey: string;
  expression: string;
  leanSignature?: string;
  leanSnippet?: string;
  leanStatus?: 'certified' | 'pending';
  referencedInSegments: string[];
}

export interface FsCatalogSlotOption {
  value: number;
  label: string;
  description?: string;
}

export interface FsCatalogSlot {
  name: string;
  symbol: string;
  domain: string;
  unit?: string;
  defaultValue: number | number[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  options?: FsCatalogSlotOption[];
}

export interface FsCatalogMode {
  id: string;
  statementId: string;
  label: string;
  targetSymbol: string;
  targetDomain: string;
  targetUnit?: string;
  formulaDescription: string;
  formulaExpr: string;
  inputs: FsCatalogSlot[];
  hasSimulation?: boolean;
}

export interface FsCatalogExample {
  id: string;
  modeId: string;
  statementId: string;
  title: string;
  presetKey?: string;
  values: Record<string, number>;
  displayResult: string;
  formattedFormula: string;
  domainBadge: string;
  notes?: string;
}

export interface FsCatalog {
  generatedAt: string;
  version: string;
  formalStatements: FsCatalogStatement[];
  calculationModes: FsCatalogMode[];
  examples: FsCatalogExample[];
}

export const FS_CATALOG: FsCatalog = ${jsonContent};
`;
    const clientTsPath = path.join(clientLibDir, 'fsCatalog.ts');
    fs.writeFileSync(clientTsPath, tsContent, 'utf8');
    console.log(`[buildCatalog] Wrote catalog TypeScript to: ${clientTsPath}`);
    // 3. Write nodeUtils/public/fsCatalog.json
    const publicDir = path.join(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
        const publicJsonPath = path.join(publicDir, 'fsCatalog.json');
        fs.writeFileSync(publicJsonPath, jsonContent, 'utf8');
        console.log(`[buildCatalog] Wrote public catalog to: ${publicJsonPath}`);
    }
    // 4. Write app1/public/fsCatalog.json if directory exists
    const app1PublicDir = path.resolve(__dirname, '../../app1/public');
    if (fs.existsSync(app1PublicDir)) {
        const app1JsonPath = path.join(app1PublicDir, 'fsCatalog.json');
        fs.writeFileSync(app1JsonPath, jsonContent, 'utf8');
        console.log(`[buildCatalog] Wrote app1 public catalog to: ${app1JsonPath}`);
    }
    const certified = catalog.formalStatements.filter(s => s.leanStatus === 'certified').length;
    const pending = catalog.formalStatements.filter(s => s.leanStatus === 'pending').length;
    console.log(`[buildCatalog] Successfully emitted ${catalog.formalStatements.length} formal statements (${certified} certified Lean 4 theorems, ${pending} unconfirmed/pending scaffold stencils), ${catalog.calculationModes.length} calculation modes, and ${catalog.examples.length} examples.`);
}
async function writeDemoCatalog() {
    const pool = new pg_1.Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'hobbynotes',
        password: process.env.DB_PASSWORD || 'repj',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: false,
    });
    try {
        const res = await pool.query('SELECT id, engine, mode, title, description, expression, status, init_packet FROM interactive_demos ORDER BY id ASC;');
        const demos = res.rows.map(r => ({
            ...r,
            id: Number(r.id),
            init_packet: typeof r.init_packet === 'string' ? JSON.parse(r.init_packet) : r.init_packet
        }));
        const jsonContent = JSON.stringify(demos, null, 2);
        const tsContent = `/**
 * Canonical Interactive Demos & Propositions Catalog
 * Generated automatically by nodeUtils/buildCatalog.ts
 */

export interface DemoCatalogItem {
  id: number;
  engine: 'ttd' | 'btd' | 'bid' | 'fsd' | string;
  mode: string;
  title: string;
  description?: string;
  expression?: string;
  status?: 'taut' | 'cont' | 'unsat' | string;
  init_packet?: any;
}

export const DEMO_CATALOG: DemoCatalogItem[] = ${jsonContent};

export function getDemoCatalogItem(idOrTitle: string | number): DemoCatalogItem | undefined {
  const raw = String(idOrTitle).trim().toLowerCase();
  const isNum = /^\\d+$/.test(raw);
  const num = isNum ? parseInt(raw, 10) : -1;
  return DEMO_CATALOG.find(d => (isNum && d.id === num) || d.title.toLowerCase() === raw || String(d.id) === raw);
}
`;
        // 1. Write clientLib/demoCatalog.json & .ts
        const clientTsPath = path.join(clientLibDir, 'demoCatalog.ts');
        const clientJsonPath = path.join(clientLibDir, 'demoCatalog.json');
        fs.writeFileSync(clientTsPath, tsContent, 'utf8');
        fs.writeFileSync(clientJsonPath, jsonContent, 'utf8');
        console.log(`[buildCatalog] Wrote demo catalog TypeScript to: ${clientTsPath}`);
        // 2. Write app1/public/demoCatalog.json
        const app1PublicDir = path.resolve(__dirname, '../../app1/public');
        if (fs.existsSync(app1PublicDir)) {
            const app1JsonPath = path.join(app1PublicDir, 'demoCatalog.json');
            fs.writeFileSync(app1JsonPath, jsonContent, 'utf8');
            console.log(`[buildCatalog] Wrote app1 public demo catalog to: ${app1JsonPath}`);
        }
        console.log(`[buildCatalog] Successfully emitted ${demos.length} interactive demo records (${demos.filter(d => d.engine === 'ttd').length} TTD propositions).`);
    }
    catch (err) {
        console.error('[buildCatalog] Error building demo catalog from PostgreSQL:', err);
    }
    finally {
        await pool.end();
    }
}
// Execute when invoked directly
if (require.main === module) {
    writeCatalogFiles();
    writeDemoCatalog().catch((err) => {
        console.error('[buildCatalog] writeDemoCatalog error:', err);
    });
}
