/**
 * Normalizes input to nonstandard dual representation { st: real nucleus, eps: infinitesimal halo }
 * or standard real numbers, allowing seamless algebraic evaluation of predicates across ℝ_ω, ℕ, and Ord.
 */
export function toDual(val) {
    if (typeof val === 'number') {
        return { st: val, eps: 0 };
    }
    if (val && typeof val === 'object') {
        if (typeof val.st === 'number') {
            return { st: val.st, eps: Number(val.eps) || 0 };
        }
        if (typeof val.val === 'number') {
            return { st: val.val, eps: 0 };
        }
        if (typeof val.order === 'number') {
            return { st: val.order, eps: 0 };
        }
    }
    const parsed = Number(val);
    return { st: isNaN(parsed) ? 0 : parsed, eps: 0 };
}
export const DEFAULT_DOMAINS_DATA = {
    baseSets: [
        { id: "B_w", symbol: "𝔹", name: "Boolean Truth Values", elements: [0, 1], category: "inductive_tree" },
        { id: "Tree1", symbol: "ℕ", name: "1-Successor Counting Spine", defaultDomain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], category: "inductive_tree" },
        { id: "Tree2", symbol: "Tree₂", name: "2-Successor Binary Tree", category: "inductive_tree" },
        { id: "D_w", symbol: "𝔻", name: "Dyadic Rationals (Fraction Model)", rule: "m / 2^n", category: "inductive_tree" },
        { id: "Tree4", symbol: "Tree₄", name: "4-Successor Quadtree", category: "inductive_tree" },
        { id: "GaussianDyad", symbol: "𝔻[i]", name: "Discrete 2D Gaussian Dyadics", category: "inductive_tree" },
        { id: "R_w", symbol: "ℝ_ω", name: "Hyperfinite 1D Transect", step: "dx = 1/ω", category: "continuum" },
        { id: "C_w", symbol: "ℂ_ω", name: "Hyperfinite 2D Complex Grid", components: ["R_w", "R_w"], category: "continuum" },
        { id: "Z", symbol: "ℤ", name: "Discrete Integer Lattice / Steps", category: "discrete" },
        { id: "Ord", symbol: "Ord", name: "Ordinal Scale (ℕ ∪ {ω, ..., ε₀})", category: "ordinal_hierarchy" }
    ],
    constructedSets: [
        {
            id: "Tree1_x_Tree1",
            symbol: "ℕ × ℕ",
            type: "cartesianProduct",
            components: ["Tree1", "Tree1"],
            description: "Pairs of counting spine nodes for binary relations"
        },
        {
            id: "P_Tree1",
            symbol: "𝒫(ℕ)",
            type: "powerSet",
            base: "Tree1",
            description: "Subsets of counting spine nodes"
        },
        {
            id: "R_w_x_R_w",
            symbol: "ℝ_ω × ℝ_ω",
            type: "cartesianProduct",
            components: ["R_w", "R_w"],
            description: "2D hyperfinite continuous plane"
        }
    ],
    constantSubsets: [
        {
            id: "GT5",
            symbol: "GT5",
            baseSet: "Tree1",
            description: "{x ∈ ℕ | x > 5}",
            evaluator: "(x) => x > 5"
        },
        {
            id: "LT10",
            symbol: "LT10",
            baseSet: "Tree1",
            description: "{x ∈ ℕ | x < 10}",
            evaluator: "(x) => x < 10"
        },
        {
            id: "EMPTY",
            symbol: "∅",
            baseSet: "Tree1",
            description: "∅ = {}",
            evaluator: "(x) => false"
        }
    ],
    predicates: [
        {
            id: "GT5",
            code: "p",
            symbol: "GT5",
            arity: 1,
            signature: ["Tree1"],
            displayTemplate: "GT5(${s1})",
            evaluator: "(s1) => s1 > 5",
            isSubsetConstant: true
        },
        {
            id: "LT10",
            code: "q",
            symbol: "LT10",
            arity: 1,
            signature: ["Tree1"],
            displayTemplate: "LT10(${s1})",
            evaluator: "(s1) => s1 < 10",
            isSubsetConstant: true
        },
        {
            id: "GT",
            code: "r",
            symbol: "GT",
            arity: 2,
            signature: ["Ord", "Ord"],
            displayTemplate: "${s1} > ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st !== b.st ? a.st > b.st : a.eps > b.eps; }"
        },
        {
            id: "LT",
            code: "s",
            symbol: "LT",
            arity: 2,
            signature: ["Ord", "Ord"],
            displayTemplate: "${s1} < ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st !== b.st ? a.st < b.st : a.eps < b.eps; }",
            equationKey: "eq_pred_lt"
        },
        {
            id: "MEM",
            code: "m",
            symbol: "∈",
            arity: 2,
            signature: ["Tree1", "P_Tree1"],
            displayTemplate: "${s1} ∈ ${s2}",
            evaluator: "(s1, s2) => typeof s2 === 'function' ? s2(s1) : Boolean(s2 && s2.has ? s2.has(s1) : (s2 & (1 << (s1 - 1))))"
        },
        {
            id: "EVEN",
            code: "v",
            symbol: "EVEN",
            arity: 1,
            signature: ["Tree1"],
            displayTemplate: "EVEN(${s1})",
            evaluator: "(s1) => s1 % 2 === 0",
            equationKey: "eq_pred_even"
        },
        {
            id: "EQ",
            code: "k",
            symbol: "=",
            arity: 2,
            signature: ["Ord", "Ord"],
            displayTemplate: "${s1} = ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st === b.st && a.eps === b.eps; }",
            equationKey: "eq_pred_eq"
        },
        {
            id: "LE",
            code: "l",
            symbol: "≤",
            arity: 2,
            signature: ["Ord", "Ord"],
            displayTemplate: "${s1} ≤ ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st !== b.st ? a.st < b.st : a.eps <= b.eps; }",
            equationKey: "eq_pred_le"
        },
        {
            id: "SUCC",
            code: "u",
            symbol: "+1",
            arity: 2,
            signature: ["Tree1", "Tree1"],
            displayTemplate: "SUCC(${s1}, ${s2})",
            evaluator: "(s1, s2) => s2 === s1 + 1",
            equationKey: "eq_pred_succ"
        },
        {
            id: "ODD",
            code: "d",
            symbol: "ODD",
            arity: 1,
            signature: ["Tree1"],
            displayTemplate: "ODD(${s1})",
            evaluator: "(s1) => s1 % 2 !== 0",
            equationKey: "eq_pred_odd"
        },
        {
            id: "SUBSET",
            code: "b",
            symbol: "⊆",
            arity: 2,
            signature: ["P_Tree1", "P_Tree1"],
            displayTemplate: "${s1} ⊆ ${s2}",
            evaluator: "(s1, s2) => typeof s1 === 'number' && typeof s2 === 'number' ? ((s1 & s2) === s1) : true"
        },
        {
            id: "NEAR",
            code: "w",
            symbol: "≈",
            arity: 2,
            signature: ["R_w", "R_w"],
            displayTemplate: "${s1} ≈ ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st === b.st || Math.abs(a.st - b.st) <= (1 / 4096); }",
            equationKey: "eq_pred_near"
        },
        {
            id: "DIV",
            code: "c",
            symbol: "∣",
            arity: 2,
            signature: ["Tree1", "Tree1"],
            displayTemplate: "${s1} ∣ ${s2}",
            evaluator: "(s1, s2) => s1 !== 0 && s2 % s1 === 0",
            equationKey: "eq_pred_div"
        },
        {
            id: "ASSIGN",
            code: "j",
            symbol: "≔",
            arity: 2,
            signature: ["Ord", "Ord"],
            displayTemplate: "${s1} ≔ ${s2}",
            evaluator: "(s1, s2) => { const a = (typeof toDual !== 'undefined' ? toDual(s1) : { st: s1, eps: 0 }); const b = (typeof toDual !== 'undefined' ? toDual(s2) : { st: s2, eps: 0 }); return a.st === b.st && a.eps === b.eps; }",
            equationKey: "eq_pred_assign"
        }
    ]
};
export class PredicateRegistry {
    static data = DEFAULT_DOMAINS_DATA;
    static compiledPredicates = new Map();
    static compiledSubsets = new Map();
    static init(customData) {
        if (customData) {
            this.data = customData;
        }
        this.compile();
    }
    static compile() {
        this.compiledPredicates.clear();
        this.compiledSubsets.clear();
        // Compile Constant Subsets
        this.data.constantSubsets.forEach((cs) => {
            try {
                const fn = new Function("x", "toDual", `return (${cs.evaluator})(x);`);
                const wrappedFn = (x) => fn(x, toDual);
                const compiled = { ...cs, fn: wrappedFn };
                this.compiledSubsets.set(cs.id, compiled);
                this.compiledSubsets.set(cs.symbol, compiled);
            }
            catch (err) {
                console.error(`[PredicateRegistry] Failed compiling subset evaluator for ${cs.id}:`, err);
            }
        });
        // Compile Predicates
        this.data.predicates.forEach((p) => {
            try {
                let fn;
                if (p.arity === 1) {
                    const rawFn = new Function("s1", "toDual", `return (${p.evaluator})(s1);`);
                    fn = (s1) => rawFn(s1, toDual);
                }
                else if (p.arity === 2) {
                    const rawFn = new Function("s1", "s2", "toDual", `return (${p.evaluator})(s1, s2);`);
                    fn = (s1, s2) => rawFn(s1, s2, toDual);
                }
                else {
                    const rawFn = new Function("slots", "toDual", `return (${p.evaluator})(...slots);`);
                    fn = (...slots) => rawFn(slots, toDual);
                }
                const compiled = { ...p, fn };
                this.compiledPredicates.set(p.id, compiled);
                this.compiledPredicates.set(p.code, compiled);
                this.compiledPredicates.set(p.symbol, compiled);
                // Register common syntactic aliases
                if (p.id === 'LT') {
                    this.compiledPredicates.set('<', compiled);
                }
                else if (p.id === 'GT') {
                    this.compiledPredicates.set('>', compiled);
                }
                else if (p.id === 'LE') {
                    this.compiledPredicates.set('<=', compiled);
                    this.compiledPredicates.set('LE', compiled);
                }
                else if (p.id === 'EQ') {
                    this.compiledPredicates.set('EQ', compiled);
                    this.compiledPredicates.set('==', compiled);
                    this.compiledPredicates.set('===', compiled);
                }
                else if (p.id === 'NEAR') {
                    this.compiledPredicates.set('NEAR', compiled);
                    this.compiledPredicates.set('~', compiled);
                }
                else if (p.id === 'DIV') {
                    this.compiledPredicates.set('DIV', compiled);
                    this.compiledPredicates.set('|', compiled);
                }
                else if (p.id === 'SUCC') {
                    this.compiledPredicates.set('SUCC', compiled);
                }
                else if (p.id === 'MEM') {
                    this.compiledPredicates.set('MEM', compiled);
                    this.compiledPredicates.set('in', compiled);
                }
                else if (p.id === 'SUBSET') {
                    this.compiledPredicates.set('SUBSET', compiled);
                }
                else if (p.id === 'ASSIGN') {
                    this.compiledPredicates.set(':=', compiled);
                    this.compiledPredicates.set('≔', compiled);
                    this.compiledPredicates.set('ASSIGN', compiled);
                }
            }
            catch (err) {
                console.error(`[PredicateRegistry] Failed compiling predicate evaluator for ${p.id}:`, err);
            }
        });
    }
    static getPredicates() {
        if (this.compiledPredicates.size === 0)
            this.compile();
        return this.data.predicates.map(p => this.compiledPredicates.get(p.id));
    }
    static getPredicate(idOrCodeOrSymbol) {
        if (this.compiledPredicates.size === 0)
            this.compile();
        return this.compiledPredicates.get(idOrCodeOrSymbol);
    }
    static getConstantSubset(idOrSymbol) {
        if (this.compiledSubsets.size === 0)
            this.compile();
        return this.compiledSubsets.get(idOrSymbol);
    }
    static getBaseSet(idOrSymbol) {
        // Normalization mapping for canonical MWM atomic domains vs legacy symbols
        const norm = idOrSymbol === 'N' ? 'Tree1'
            : idOrSymbol === 'B' ? 'B_w'
                : idOrSymbol === 'D' ? 'D_w'
                    : idOrSymbol === 'R' ? 'R_w'
                        : idOrSymbol === 'C' ? 'C_w'
                            : idOrSymbol;
        return this.data.baseSets.find(s => s.id === norm || s.id === idOrSymbol || s.symbol === idOrSymbol || s.symbol === norm);
    }
    static getDefaultDomain(baseSetId = "Tree1") {
        const norm = baseSetId === 'N' ? 'Tree1' : baseSetId === 'B' ? 'B_w' : baseSetId;
        const bs = this.getBaseSet(norm);
        return bs?.defaultDomain || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    }
    /**
     * Dynamically loads atomic domains and directed equality predicates from PostgreSQL via /api/sql.
     * If offline or unavailable, retains clean Middle Way Math static schema defaults without crashing.
     */
    static async loadFromDatabase(apiEndpoint) {
        try {
            const endpoint = apiEndpoint || (typeof window !== 'undefined' ? '/api/sql' : 'http://127.0.0.1:3000/api/sql');
            const domainsRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sql: 'SELECT id, domain_key, name, symbol, category FROM domains ORDER BY id'
                })
            });
            if (!domainsRes.ok)
                return false;
            const domainsJson = await domainsRes.json();
            if (domainsJson.status !== 'success' || !Array.isArray(domainsJson.data?.rows))
                return false;
            const dbDomains = domainsJson.data.rows;
            const updatedBaseSets = dbDomains.map((d) => ({
                id: d.domain_key,
                symbol: d.symbol || d.domain_key,
                name: d.name || d.domain_key,
                category: d.category,
                defaultDomain: (d.domain_key === 'Tree1' || d.domain_key === 'N') ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] : undefined,
                elements: (d.domain_key === 'B_w' || d.domain_key === 'B') ? [0, 1] : undefined
            }));
            this.data.baseSets = updatedBaseSets;
            // Query database directed equations for predicate directed equalities (target_domain = 'B_w' or '𝔹')
            const deRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sql: `
            SELECT de.id, de.equation_key, de.target_domain, de.target_symbol, de.label, de.formula_expr,
                   fs.statement_key, fs.title, fs.expression
            FROM directed_equations de
            LEFT JOIN equation_statement_links esl ON esl.equation_id = de.id
            LEFT JOIN formal_statements fs ON fs.id = esl.statement_id
            WHERE de.target_domain IN ('B_w', '𝔹', 'B')
            ORDER BY de.id
          `
                })
            });
            if (deRes.ok) {
                const deJson = await deRes.json();
                if (deJson.status === 'success' && Array.isArray(deJson.data?.rows)) {
                    // Link DB equation keys to predicates and dynamically register any newly created DEs
                    deJson.data.rows.forEach((row) => {
                        const pred = this.data.predicates.find(p => p.equationKey === row.equation_key || p.id === row.equation_key?.replace('eq_pred_', '').toUpperCase());
                        if (pred) {
                            pred.equationKey = row.equation_key;
                        }
                        else {
                            const cleanId = (row.equation_key || `PRED_${row.id}`).replace('eq_pred_', '').toUpperCase();
                            const autoCode = cleanId.length === 1 ? cleanId.toLowerCase() : cleanId;
                            const newPred = {
                                id: cleanId,
                                code: autoCode,
                                symbol: row.target_symbol && row.target_symbol !== 'b' ? row.target_symbol : cleanId,
                                arity: 2,
                                signature: ['Ord', 'Ord'],
                                displayTemplate: `${cleanId}(\${s1}, \${s2})`,
                                evaluator: row.formula_expr ? `(s1, s2) => Boolean(${row.formula_expr.replace(/x/g, 's1').replace(/y/g, 's2')})` : '(s1, s2) => true',
                                equationKey: row.equation_key
                            };
                            this.data.predicates.push(newPred);
                        }
                    });
                }
            }
            this.compile();
            console.log(`[PredicateRegistry] Loaded ${this.data.baseSets.length} domains and compiled ${this.data.predicates.length} predicates from database.`);
            return true;
        }
        catch (err) {
            console.warn('[PredicateRegistry] Offline or unable to load from database, continuing with MWM static schema:', err);
            return false;
        }
    }
    /**
     * Evaluates a predicate by name/code for specific bound slot variables against a runtime environment σ
     * @param predId Predicate code or symbol (e.g. 'p', 'GT5', 'r', 'GT', 'm', 'LT', '<')
     * @param boundSlots Array of bound variable/constant names (e.g. ['x1'], ['x1', 'x2'], ['x1', 'GT5'])
     * @param env Variable environment map (e.g. { 'x₁': 7, 'x₂': 3, 'y₁': 4 })
     */
    static evaluateAt(predId, boundSlots, env) {
        const pred = this.getPredicate(predId);
        if (!pred || !pred.fn) {
            console.warn(`[PredicateRegistry] Evaluator not found for predicate ${predId}`);
            return false;
        }
        // Resolve slot arguments
        const slotValues = boundSlots.map((slotSym) => {
            // Normalize variable names
            const normSym = slotSym.replace(/x1/g, 'x₁').replace(/x2/g, 'x₂').replace(/y1/g, 'y₁').replace(/y2/g, 'y₂');
            if (env.hasOwnProperty(normSym)) {
                return env[normSym];
            }
            if (env.hasOwnProperty(slotSym)) {
                return env[slotSym];
            }
            // Check if slot references a constant subset (e.g. GT5, LT10, EMPTY)
            const subset = this.getConstantSubset(slotSym);
            if (subset && subset.fn) {
                return subset.fn;
            }
            if (slotSym === '∅' || slotSym === 'EMPTY') {
                return () => false;
            }
            // Check if slot is a literal number term (e.g. "5", "0", "9.8")
            const parsedNum = Number(slotSym);
            if (!isNaN(parsedNum) && slotSym.trim() !== '') {
                return parsedNum;
            }
            // Check if slot is a rational / dyadic fraction (e.g. "1/2", "3/4")
            if (slotSym.includes('/')) {
                const parts = slotSym.split('/').map(s => Number(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
                    return parts[0] / parts[1];
                }
            }
            // Check named mathematical constants
            if (slotSym === 'π' || slotSym.toLowerCase() === 'pi')
                return Math.PI;
            if (slotSym === 'e')
                return Math.E;
            // Default fallback
            return slotSym;
        });
        try {
            return pred.fn(...slotValues);
        }
        catch (err) {
            console.error(`[PredicateRegistry] Runtime error evaluating ${predId}:`, err);
            return false;
        }
    }
}
// Auto-initialize default registry
PredicateRegistry.init();
