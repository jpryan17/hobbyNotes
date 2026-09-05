export const DEFAULT_DOMAINS_DATA = {
    baseSets: [
        { id: "B", symbol: "𝔹", name: "Booleans", elements: [0, 1] },
        { id: "N", symbol: "ℕ", name: "Natural Numbers", defaultDomain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
        { id: "Z", symbol: "ℤ", name: "Integers" },
        { id: "D", symbol: "𝔻", name: "Dyadic Rationals", rule: "m / 2^n" },
        { id: "R_omega", symbol: "ℝ_ω", name: "Hyperfinite Transect", step: "dx = 1/ω" },
        { id: "R", symbol: "ℝ", name: "Standard Real Numbers", map: "st(ℝ_ω)" },
        { id: "C_omega", symbol: "ℂ_ω", name: "Hyperfinite Complex Grid", components: ["R_omega", "R_omega"] },
        { "id": "C", symbol: "ℂ", name: "Standard Complex Field" }
    ],
    constructedSets: [
        {
            id: "N_x_N",
            symbol: "ℕ × ℕ",
            type: "cartesianProduct",
            components: ["N", "N"],
            description: "Pairs of natural numbers for binary relations"
        },
        {
            id: "P_N",
            symbol: "𝒫(ℕ)",
            type: "powerSet",
            base: "N",
            description: "Subsets of natural numbers"
        },
        {
            id: "R_omega_x_R_omega",
            symbol: "ℝ_ω × ℝ_ω",
            type: "cartesianProduct",
            components: ["R_omega", "R_omega"],
            description: "2D hyperfinite continuous plane"
        }
    ],
    constantSubsets: [
        {
            id: "GT5",
            symbol: "GT5",
            baseSet: "N",
            description: "{x ∈ ℕ | x > 5}",
            evaluator: "(x) => x > 5"
        },
        {
            id: "LT10",
            symbol: "LT10",
            baseSet: "N",
            description: "{x ∈ ℕ | x < 10}",
            evaluator: "(x) => x < 10"
        },
        {
            id: "EMPTY",
            symbol: "∅",
            baseSet: "N",
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
            signature: ["N"],
            displayTemplate: "GT5(${s1})",
            evaluator: "(s1) => s1 > 5",
            isSubsetConstant: true
        },
        {
            id: "LT10",
            code: "q",
            symbol: "LT10",
            arity: 1,
            signature: ["N"],
            displayTemplate: "LT10(${s1})",
            evaluator: "(s1) => s1 < 10",
            isSubsetConstant: true
        },
        {
            id: "GT",
            code: "r",
            symbol: "GT",
            arity: 2,
            signature: ["N", "N"],
            displayTemplate: "GT(${s1}, ${s2})",
            evaluator: "(s1, s2) => s1 > s2"
        },
        {
            id: "LT",
            code: "s",
            symbol: "LT",
            arity: 2,
            signature: ["N", "N"],
            displayTemplate: "LT(${s1}, ${s2})",
            evaluator: "(s1, s2) => s1 < s2"
        },
        {
            id: "MEM",
            code: "m",
            symbol: "∈",
            arity: 2,
            signature: ["N", "P_N"],
            displayTemplate: "${s1} ∈ ${s2}",
            evaluator: "(s1, s2) => typeof s2 === 'function' ? s2(s1) : Boolean(s2 && s2.has ? s2.has(s1) : (s2 & (1 << (s1 - 1))))"
        },
        {
            id: "EVEN",
            code: "v",
            symbol: "EVEN",
            arity: 1,
            signature: ["N"],
            displayTemplate: "EVEN(${s1})",
            evaluator: "(s1) => s1 % 2 === 0"
        },
        {
            id: "EQ",
            code: "k",
            symbol: "=",
            arity: 2,
            signature: ["N", "N"],
            displayTemplate: "EQ(${s1}, ${s2})",
            evaluator: "(s1, s2) => s1 === s2"
        },
        {
            id: "LE",
            code: "l",
            symbol: "≤",
            arity: 2,
            signature: ["N", "N"],
            displayTemplate: "LE(${s1}, ${s2})",
            evaluator: "(s1, s2) => s1 <= s2"
        },
        {
            id: "SUCC",
            code: "u",
            symbol: "+1",
            arity: 2,
            signature: ["N", "N"],
            displayTemplate: "SUCC(${s1}, ${s2})",
            evaluator: "(s1, s2) => s2 === s1 + 1"
        },
        {
            id: "ODD",
            code: "d",
            symbol: "ODD",
            arity: 1,
            signature: ["N"],
            displayTemplate: "ODD(${s1})",
            evaluator: "(s1) => s1 % 2 !== 0"
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
                const fn = new Function("x", `return (${cs.evaluator})(x);`);
                this.compiledSubsets.set(cs.id, { ...cs, fn });
                this.compiledSubsets.set(cs.symbol, { ...cs, fn });
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
                    fn = new Function("s1", `return (${p.evaluator})(s1);`);
                }
                else if (p.arity === 2) {
                    fn = new Function("s1", "s2", `return (${p.evaluator})(s1, s2);`);
                }
                else {
                    fn = new Function("...slots", `return (${p.evaluator})(...slots);`);
                }
                const compiled = { ...p, fn };
                this.compiledPredicates.set(p.id, compiled);
                this.compiledPredicates.set(p.code, compiled);
                this.compiledPredicates.set(p.symbol, compiled);
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
        return this.data.baseSets.find(s => s.id === idOrSymbol || s.symbol === idOrSymbol);
    }
    static getDefaultDomain(baseSetId = "N") {
        const bs = this.getBaseSet(baseSetId);
        return bs?.defaultDomain || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    }
    /**
     * Evaluates a predicate by name/code for specific bound slot variables against a runtime environment σ
     * @param predId Predicate code or symbol (e.g. 'p', 'GT5', 'r', 'GT', 'm')
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
            // Check if slot references a constant subset (e.g. GT5, LT10)
            const subset = this.getConstantSubset(slotSym);
            if (subset && subset.fn) {
                return subset.fn;
            }
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
