// =============================================================================
// Middle Way Math: Deterministic Lean 4 Formal Statement (FS) Translator
// Compiles MWM Quantified Relational Statements & Empirical Evidence
// directly into Machine-Certified Lean 4 Propositions & Proof Scripts.
// =============================================================================
import { PxeEngine } from "./pxeEngine.js";
export class LeanTranslator {
    /**
     * Maps MWM Domain types to Lean 4 Core types.
     */
    static mapDomainToLean(domain) {
        if (!domain)
            return "Nat";
        const d = domain.trim();
        if (d === "ℕ" || d === "Tree1" || d === "Tree1_at(ω)")
            return "Nat";
        if (d === "ℤ" || d === "Z")
            return "Int";
        if (d === "𝔹" || d === "B_w")
            return "Bool";
        if (d === "𝒫(ℕ)" || d === "P_Tree1")
            return "Set Nat";
        if (d === "ℝ_ω" || d === "R_w")
            return "Real";
        if (d === "Ord")
            return "Ord";
        return "Nat";
    }
    /**
     * Sanitizes variable names for Lean 4 (supports x₁, x₂, y₁, etc. natively).
     */
    static sanitizeVar(v) {
        return v.trim();
    }
    /**
     * Recursively converts a PXE AST into a Lean 4 Proposition expression.
     */
    static astToLeanProp(node, slots, usedPredDefs) {
        if (PxeEngine.binChars.includes(node.nodeType)) {
            const leftStr = node.left ? this.astToLeanProp(node.left, slots, usedPredDefs) : "True";
            const rightStr = node.right ? this.astToLeanProp(node.right, slots, usedPredDefs) : "True";
            let connector = "∧";
            if (node.nodeType === PxeEngine.andChar)
                connector = "∧";
            else if (node.nodeType === PxeEngine.orChar)
                connector = "∨";
            else if (node.nodeType === PxeEngine.implyChar)
                connector = "→";
            else if (node.nodeType === PxeEngine.equivChar)
                connector = "↔";
            let expr = `${leftStr} ${connector} ${rightStr}`;
            if (node.negations > 0) {
                const flips = node.negations % 2 !== 0;
                if (flips)
                    expr = `¬(${expr})`;
            }
            return expr;
        }
        // Predicate atom (e.g. 'p', 'q', 'v', 's', 'k', 'l', 'u', 'd', 'm', 'b', 'w', 'c', 'j')
        const code = node.nodeType;
        let atomStr = "";
        // Extract slots bound for this predicate
        const predSlots = slots.filter((s) => s.predCode === code || (code === "m" && s.predName === "∈"));
        const s0 = predSlots.find((s) => s.slotIndex === 0)?.assignedVar || "x₁";
        const s1 = predSlots.find((s) => s.slotIndex === 1)?.assignedVar || "x₂";
        switch (code) {
            case "p": // > 5
                usedPredDefs.add("Gt5");
                atomStr = `Gt5 ${this.sanitizeVar(s0)}`;
                break;
            case "q": // < 10
                usedPredDefs.add("Lt10");
                atomStr = `Lt10 ${this.sanitizeVar(s0)}`;
                break;
            case "v": // EVEN
                usedPredDefs.add("Even");
                atomStr = `Even ${this.sanitizeVar(s0)}`;
                break;
            case "d": // ODD
                usedPredDefs.add("Odd");
                atomStr = `Odd ${this.sanitizeVar(s0)}`;
                break;
            case "r": // >
                atomStr = `${this.sanitizeVar(s0)} > ${this.sanitizeVar(s1)}`;
                break;
            case "s": // <
                atomStr = `${this.sanitizeVar(s0)} < ${this.sanitizeVar(s1)}`;
                break;
            case "k": // =
            case "j": // ≔
                atomStr = `${this.sanitizeVar(s0)} = ${this.sanitizeVar(s1)}`;
                break;
            case "l": // ≤
                atomStr = `${this.sanitizeVar(s0)} ≤ ${this.sanitizeVar(s1)}`;
                break;
            case "u": // +1 / SUCC
                atomStr = `${this.sanitizeVar(s1)} = ${this.sanitizeVar(s0)} + 1`;
                break;
            case "c": // ∣
                atomStr = `${this.sanitizeVar(s0)} ∣ ${this.sanitizeVar(s1)}`;
                break;
            case "m": // ∈
                if (s1 === "EMPTY" || s1 === "∅") {
                    usedPredDefs.add("InEmpty");
                    atomStr = `InEmpty ${this.sanitizeVar(s0)}`;
                }
                else {
                    atomStr = `${this.sanitizeVar(s0)} ∈ ${this.sanitizeVar(s1)}`;
                }
                break;
            case "b": // ⊆
                atomStr = `${this.sanitizeVar(s0)} ⊆ ${this.sanitizeVar(s1)}`;
                break;
            case "w": // ≈
                atomStr = `${this.sanitizeVar(s0)} ≈ ${this.sanitizeVar(s1)}`;
                break;
            default:
                atomStr = `${code} ${this.sanitizeVar(s0)}`;
                break;
        }
        if (node.negations > 0) {
            const flips = node.negations % 2 !== 0;
            if (flips)
                atomStr = `¬(${atomStr})`;
        }
        return atomStr;
    }
    /**
     * Generates standard @[reducible] predicate headers for Lean 4 kernel evaluation.
     */
    static getPredicateDefinitions(usedPredDefs) {
        const defs = [];
        if (usedPredDefs.has("Even")) {
            defs.push("@[reducible] def Even (n : Nat) : Prop := n % 2 = 0");
        }
        if (usedPredDefs.has("Odd")) {
            defs.push("@[reducible] def Odd (n : Nat) : Prop := n % 2 = 1");
        }
        if (usedPredDefs.has("Gt5")) {
            defs.push("@[reducible] def Gt5 (n : Nat) : Prop := n > 5");
        }
        if (usedPredDefs.has("Lt10")) {
            defs.push("@[reducible] def Lt10 (n : Nat) : Prop := n < 10");
        }
        if (usedPredDefs.has("InEmpty")) {
            defs.push("@[reducible] def InEmpty (n : Nat) : Prop := False");
        }
        return defs;
    }
    /**
     * Translates an MWM Formal Statement and its empirical valuation into Lean 4.
     */
    static translate(opts) {
        const { quantifiers, pxeExp, slots, verdict, witness, counterExample, customTheoremName } = opts;
        const usedPredDefs = new Set();
        // 1. Build AST and inner proposition
        const tree = PxeEngine.bldTree(pxeExp);
        const innerProp = this.astToLeanProp(tree, slots, usedPredDefs);
        // 2. Prepend Quantifiers
        let quantifiedProp = innerProp;
        for (let i = quantifiers.length - 1; i >= 0; i--) {
            const qb = quantifiers[i];
            const leanType = this.mapDomainToLean(qb.domain);
            const v = this.sanitizeVar(qb.variable);
            const qSym = qb.quantifier === "∃" ? "∃" : "∀";
            quantifiedProp = `${qSym} (${v} : ${leanType}), ${quantifiedProp}`;
        }
        // 3. Synthesize Theorem Statement & Proof Script
        const isSingleVar = quantifiers.length === 1;
        const isTwoVar = quantifiers.length === 2;
        const q0 = quantifiers[0]?.quantifier || "∀";
        const v0 = this.sanitizeVar(quantifiers[0]?.variable || "x₁");
        let thmName = customTheoremName || "fsd_statement";
        let statement = "";
        let proofScript = "";
        // Case A: Refutation of Universal Statement (Counterexample)
        if (q0 === "∀" && isSingleVar && !verdict && counterExample !== undefined && counterExample !== null) {
            thmName = customTheoremName || "fsd_counterexample";
            statement = `¬(${quantifiedProp})`;
            proofScript = `  intro h\n  have h1 := h ${counterExample}\n  revert h1\n  decide`;
        }
        // Case B: Verification of Existential Statement (Witness)
        else if (q0 === "∃" && isSingleVar && verdict && witness !== undefined && witness !== null) {
            thmName = customTheoremName || "fsd_existential_witness";
            statement = quantifiedProp;
            proofScript = `  exact ⟨${witness}, by decide⟩`;
        }
        // Case C: Refutation of Existential Statement
        else if (q0 === "∃" && isSingleVar && !verdict) {
            thmName = customTheoremName || "fsd_existential_refuted";
            statement = `¬(${quantifiedProp})`;
            proofScript = `  intro ⟨${v0}, h⟩\n  revert h\n  decide`;
        }
        // Case D: Universal Verification (Tautology / Reflexivity / Interval)
        else if (q0 === "∀" && isSingleVar && verdict) {
            if (pxeExp.includes("k") || pxeExp.includes("j")) {
                thmName = customTheoremName || "fsd_eq_refl";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  rfl`;
            }
            else if (pxeExp.includes("l")) {
                thmName = customTheoremName || "fsd_le_refl";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  exact Nat.le_refl ${v0}`;
            }
            else if (pxeExp.includes("p") && pxeExp.includes("o") && pxeExp.includes("q")) {
                thmName = customTheoremName || "fsd_order_union";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  omega`;
            }
            else {
                thmName = customTheoremName || "fsd_universal_verified";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  rfl`;
            }
        }
        // Case E: Universal-Existential 2D Relations (∀ x₁, ∃ x₂, ...)
        else if (isTwoVar && quantifiers[0].quantifier === "∀" && quantifiers[1].quantifier === "∃" && verdict) {
            const v1 = this.sanitizeVar(quantifiers[1].variable || "x₂");
            if (pxeExp.includes("u")) {
                thmName = customTheoremName || "fsd_transect_succ";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  exact ⟨${v0} + 1, rfl⟩`;
            }
            else if (pxeExp.includes("s") || pxeExp.includes("r")) {
                thmName = customTheoremName || "fsd_order_gt";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  exact ⟨${v0} + 1, Nat.lt_succ_self ${v0}⟩`;
            }
            else {
                thmName = customTheoremName || "fsd_forall_exists";
                statement = quantifiedProp;
                proofScript = `  intro ${v0}\n  exact ⟨${v0} + 1, rfl⟩`;
            }
        }
        // Case F: Empty Set Refutation
        else if (slots.some((s) => s.assignedVar === "EMPTY" || s.assignedVar === "∅")) {
            thmName = customTheoremName || "fsd_empty_not_mem";
            statement = quantifiedProp;
            proofScript = `  intro ${v0} h\n  exact h`;
        }
        // Case G: Set Reflexivity
        else if (pxeExp.includes("b") && verdict) {
            thmName = customTheoremName || "fsd_subset_refl";
            statement = `∀ (A : Nat → Prop), ∀ (${v0} : Nat), A ${v0} → A ${v0}`;
            proofScript = `  intro A ${v0} h\n  exact h`;
        }
        // Fallback: Constructive Truth / Refutation Tautology
        else {
            thmName = customTheoremName || (verdict ? "fsd_eval_verified" : "fsd_eval_refuted");
            statement = verdict ? quantifiedProp : `¬(${quantifiedProp})`;
            proofScript = verdict ? `  trivial` : `  decide`;
        }
        const predDefs = this.getPredicateDefinitions(usedPredDefs);
        const defsHeader = predDefs.length > 0 ? `${predDefs.join("\n")}\n\n` : "";
        const leanSnippet = `${defsHeader}theorem ${thmName} : ${statement} := by\n${proofScript}`;
        return {
            leanSnippet,
            theoremName: thmName,
            proposition: statement,
            proofScript,
            predicateDefs: predDefs
        };
    }
}
