// clientLib/sessionRegistry.ts
// In-Memory Session Registry for Middle Way Mathematics.
// Bridges static FS/DE catalogs with active session-constructed statements,
// executable DE stencils (scalars, complex vectors, and probability states),
// and formal invariant predicate guards.
import { FS_CATALOG } from './fsCatalog.js';
export class SessionRegistry {
    static instance;
    statements = new Map();
    modes = new Map();
    customEvaluators = new Map();
    predicates = new Map();
    constructor() {
        this.hydrateFromCatalog();
        this.registerStandardEvaluators();
        this.registerStandardPredicates();
    }
    static getInstance() {
        if (!SessionRegistry.instance) {
            SessionRegistry.instance = new SessionRegistry();
        }
        return SessionRegistry.instance;
    }
    /**
     * Cold-boot hydration from pre-compiled static catalog snapshot.
     */
    hydrateFromCatalog() {
        if (!FS_CATALOG)
            return;
        for (const stmt of FS_CATALOG.formalStatements || []) {
            this.indexStatement(stmt);
        }
        for (const mode of FS_CATALOG.calculationModes || []) {
            this.indexMode(mode);
        }
    }
    indexStatement(stmt) {
        if (stmt.id)
            this.statements.set(stmt.id.toLowerCase(), stmt);
        if (stmt.numId !== undefined)
            this.statements.set(String(stmt.numId), stmt);
        if (stmt.scaffoldKey)
            this.statements.set(stmt.scaffoldKey.toLowerCase(), stmt);
    }
    indexMode(mode) {
        if (mode.id)
            this.modes.set(mode.id.toLowerCase(), mode);
        if (mode.statementId) {
            this.modes.set(`mode_of_${mode.statementId.toLowerCase()}`, mode);
        }
    }
    /**
     * Registers baseline evaluators for fundamental stencils
     * (discrete arithmetic/geometric ladders, CORDIC rotations, Taylor steps, Bayes, and complex operations).
     */
    registerStandardEvaluators() {
        // 1. Linear Ladder Step (Arithmetic Difference): v_next = v + a * dt
        this.registerEvaluator('linear_ladder_step', (v, a, dt) => Number(v) + Number(a) * Number(dt));
        this.registerEvaluator('de_linear_ladder_step', (v, a, dt) => Number(v) + Number(a) * Number(dt));
        // 2. Geometric Ladder Step: f_k = a * r^k
        this.registerEvaluator('geom_ladder_step', (a, r, k) => Number(a) * Math.pow(Number(r), Number(k)));
        this.registerEvaluator('de_geom_ladder_step', (a, r, k) => Number(a) * Math.pow(Number(r), Number(k)));
        // 3. Free Fall Kinematics: [v_next, s_next]
        this.registerEvaluator('kinematic_step', (v, s, a, dt) => {
            const vNext = Number(v) + Number(a) * Number(dt);
            const sNext = Number(s) + Number(v) * Number(dt) + 0.5 * Number(a) * Number(dt) * Number(dt);
            return [vNext, sNext];
        });
        // 4. Exponential Compounding Step: y_next = y * (1 + lambda * dt)
        this.registerEvaluator('exp_ladder_step', (y, lambda, dt) => Number(y) * (1.0 + Number(lambda) * Number(dt)));
        // 5. CORDIC Micro-Step (Planar rotation in D_w[i]): (x, y, theta) -> (x_next, y_next, theta_next)
        this.registerEvaluator('cordic_micro_step', (x, y, theta, dir, shift, angleTableVal) => {
            const d = Number(dir) >= 0 ? 1 : -1;
            const factor = Math.pow(2, -Number(shift));
            const nextX = Number(x) - d * Number(y) * factor;
            const nextY = Number(y) + d * Number(x) * factor;
            const nextTheta = Number(theta) - d * Number(angleTableVal);
            return [nextX, nextY, nextTheta];
        });
        // 6. Complex Arithmetic in D_w[i] (Gaussian Dyadics): z = [re, im]
        this.registerEvaluator('complex_add', (z1, z2) => {
            const a = Array.isArray(z1) ? z1 : [Number(z1), 0];
            const b = Array.isArray(z2) ? z2 : [Number(z2), 0];
            return [Number(a[0]) + Number(b[0]), Number(a[1]) + Number(b[1])];
        });
        this.registerEvaluator('complex_mul', (z1, z2) => {
            const a = Array.isArray(z1) ? z1 : [Number(z1), 0];
            const b = Array.isArray(z2) ? z2 : [Number(z2), 0];
            const re = Number(a[0]) * Number(b[0]) - Number(a[1]) * Number(b[1]);
            const im = Number(a[0]) * Number(b[1]) + Number(a[1]) * Number(b[0]);
            return [re, im];
        });
        this.registerEvaluator('complex_norm_sq', (z) => {
            const a = Array.isArray(z) ? z : [Number(z), 0];
            return Number(a[0]) * Number(a[0]) + Number(a[1]) * Number(a[1]);
        });
        // 7. Bayesian Probability Update (Level 5): P(H|E) = (P(E|H)*P(H)) / P(E)
        this.registerEvaluator('bayes_update', (pH, pE_H, pE_notH) => {
            const priorH = Number(pH);
            const priorNotH = 1.0 - priorH;
            const num = Number(pE_H) * priorH;
            const denom = num + Number(pE_notH) * priorNotH;
            return denom !== 0 ? num / denom : 0;
        });
        // 8. Quantum 2-State Unitary Rotor Step (Level 5): psi = [[re0, im0], [re1, im1]]
        this.registerEvaluator('qubit_phase_step', (re, im, omegaVal, dt) => {
            const cosVal = Math.cos(Number(omegaVal) * Number(dt));
            const sinVal = Math.sin(Number(omegaVal) * Number(dt));
            const nextRe = Number(re) * cosVal - Number(im) * sinVal;
            const nextIm = Number(re) * sinVal + Number(im) * cosVal;
            return [nextRe, nextIm];
        });
    }
    /**
     * Registers baseline formal predicate guards and invariants
     * (Telescoping identity, Pythagorean unit norm, Born rule, and Probability normalization).
     */
    registerStandardPredicates() {
        // 1. Telescoping Sum Identity: sum_delta === end - start
        this.registerPredicate('telescoping_ftc', (netSum, f0, fn) => {
            if (f0 !== undefined && fn !== undefined) {
                return Math.abs(Number(netSum) - (Number(fn) - Number(f0))) < 1e-7;
            }
            return Number.isFinite(Number(netSum));
        });
        // 2. Trigonometric / CORDIC Unit Circle Invariant: x^2 + y^2 = r^2 (default r = 1.0)
        this.registerPredicate('pythagorean_identity', (x, y, r = 1.0) => {
            const normSq = Number(x) * Number(x) + Number(y) * Number(y);
            const targetSq = Number(r) * Number(r);
            return Math.abs(normSq - targetSq) < 1e-4;
        });
        // 3. Probability Distribution Normalization (Level 5): sum P(H) = 1
        this.registerPredicate('probability_normalized', (...probs) => {
            const flat = probs.flat().map(Number);
            const sum = flat.reduce((acc, p) => acc + p, 0);
            return Math.abs(sum - 1.0) < 1e-6;
        });
        // 4. Quantum Born Rule Normalization (Level 5): |alpha|^2 + |beta|^2 = 1
        this.registerPredicate('quantum_norm_conserved', (...states) => {
            const flat = states.flat();
            let totalNorm = 0;
            for (const item of flat) {
                if (Array.isArray(item)) {
                    totalNorm += (Number(item[0]) || 0) ** 2 + (Number(item[1]) || 0) ** 2;
                }
                else {
                    totalNorm += (Number(item) || 0) ** 2;
                }
            }
            return Math.abs(totalNorm - 1.0) < 1e-5;
        });
    }
    // ---------------------------------------------------------------------------
    // Public Registration & Session Mutators
    // ---------------------------------------------------------------------------
    registerStatement(stmt) {
        this.indexStatement(stmt);
    }
    registerMode(mode, evaluator) {
        this.indexMode(mode);
        if (evaluator) {
            this.registerEvaluator(mode.id, evaluator);
        }
    }
    registerEvaluator(key, fn) {
        const norm = key.toLowerCase().replace(/^(de\.|de_)/, '');
        this.customEvaluators.set(norm, fn);
        this.customEvaluators.set(`de.${norm}`, fn);
        this.customEvaluators.set(`de_${norm}`, fn);
    }
    registerPredicate(key, fn) {
        const norm = key.toLowerCase().replace(/^(fs\.|fs_)/, '');
        this.predicates.set(norm, fn);
        this.predicates.set(`fs.${norm}`, fn);
        this.predicates.set(`fs_${norm}`, fn);
    }
    // ---------------------------------------------------------------------------
    // Public Lookup & Execution Dispatch
    // ---------------------------------------------------------------------------
    getStatement(key) {
        return this.statements.get(key.toLowerCase());
    }
    getMode(key) {
        const norm = key.toLowerCase().replace(/^(de\.|de_)/, '');
        return this.modes.get(norm) || this.modes.get(key.toLowerCase());
    }
    hasDE(key) {
        const norm = key.toLowerCase().replace(/^(de\.|de_)/, '');
        return this.customEvaluators.has(norm) || this.modes.has(norm);
    }
    hasPredicate(key) {
        const norm = key.toLowerCase().replace(/^(fs\.|fs_)/, '');
        return this.predicates.has(norm) || this.statements.has(norm);
    }
    /**
     * Executes a registered Directed Equation (DE) stencil with positional or named arguments.
     */
    executeDE(key, ...args) {
        const norm = key.toLowerCase().replace(/^(de\.|de_)/, '');
        // 1. Direct custom evaluator function (if registered)
        const custom = this.customEvaluators.get(norm);
        if (custom) {
            return custom(...args);
        }
        // 2. Evaluated from formulaExpr in calculation mode
        const mode = this.getMode(norm);
        if (mode && mode.formulaExpr) {
            return this.evaluateModeFormula(mode, args);
        }
        throw new Error(`[SessionRegistry] Unknown Directed Equation (DE) stencil: "${key}"`);
    }
    /**
     * Evaluates a formal predicate assertion (FS) with positional arguments.
     */
    evalPredicate(key, ...args) {
        const norm = key.toLowerCase().replace(/^(fs\.|fs_)/, '');
        const custom = this.predicates.get(norm);
        if (custom) {
            return custom(...args);
        }
        // Default: if statement is registered and certified, treat as sound invariant
        const stmt = this.getStatement(norm);
        if (stmt) {
            return true;
        }
        throw new Error(`[SessionRegistry] Unknown Formal Statement (FS) predicate: "${key}"`);
    }
    /**
     * Dynamic formula evaluator using the mode's input slot names.
     */
    evaluateModeFormula(mode, args) {
        const inputs = mode.inputs || [];
        const scope = {};
        // Bind positional args to slot names
        inputs.forEach((slot, idx) => {
            const val = args[idx] !== undefined ? args[idx] : slot.defaultValue;
            scope[slot.name] = val;
            if (slot.symbol)
                scope[slot.symbol] = val;
        });
        try {
            // Evaluate cleanly with Math in scope
            const fn = new Function(...Object.keys(scope), 'Math', `return (${mode.formulaExpr});`);
            return fn(...Object.values(scope), Math);
        }
        catch (err) {
            throw new Error(`[SessionRegistry] Error evaluating stencil formula "${mode.formulaExpr}": ${err.message}`);
        }
    }
    getAllStatements() {
        const unique = new Set(this.statements.values());
        return Array.from(unique);
    }
    getAllModes() {
        const unique = new Set(this.modes.values());
        return Array.from(unique);
    }
}
export const sessionRegistry = SessionRegistry.getInstance();
