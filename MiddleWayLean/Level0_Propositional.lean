/-
  MiddleWay.Level0_Propositional
  Level 0: Propositional Logic and Truth Table Verification (TTD)
  
  Demonstrates:
  1. Structural deduction (Modus Ponens, De Morgan)
  2. The automated "Tactics Shield" (`tauto` for propositional tautologies)
  3. Direct truth-table execution (`Bool` and `decide`)
-/

namespace MiddleWay.Level0

-- ============================================================================
-- 1. Modus Ponens: The Core Rule of Deduction
-- If P is true, and P implies Q, then Q is true.
-- ============================================================================

theorem modus_ponens (P Q : Prop) (hP : P) (hImp : P → Q) : Q := by
  -- Apply the implication to the evidence of P
  exact hImp hP


-- ============================================================================
-- 2. De Morgan's Law (First Direction)
-- Not (P or Q) is logically equivalent to (Not P and Not Q)
-- ============================================================================

theorem de_morgan_or (P Q : Prop) : ¬(P ∨ Q) ↔ (¬P ∧ ¬Q) := by
  constructor
  · -- Forward direction: ¬(P ∨ Q) → ¬P ∧ ¬Q
    intro hNotOr
    constructor
    · intro hP; exact hNotOr (Or.inl hP)
    · intro hQ; exact hNotOr (Or.inr hQ)
  · -- Reverse direction: ¬P ∧ ¬Q → ¬(P ∨ Q)
    intro ⟨hNotP, hNotQ⟩
    intro hOr
    cases hOr with
    | inl hP => exact hNotP hP
    | inr hQ => exact hNotQ hQ


-- ============================================================================
-- 3. The "Tactics Shield" in Action: Propositional Verification
-- Proving standard classical equivalences directly in core Lean 4
-- ============================================================================

-- Double Negation Elimination (Classical)
theorem not_not_elim (P : Prop) [Decidable P] : ¬¬P → P := by
  by_cases h : P
  · exact fun _ => h
  · intro hNotNot; exact False.elim (hNotNot h)

-- Contraposition: (P → Q) is logically equivalent to (¬Q → ¬P)
theorem contraposition (P Q : Prop) [Decidable P] [Decidable Q] :
    (P → Q) ↔ (¬Q → ¬P) := by
  constructor
  · intro hImp hNotQ hP
    exact hNotQ (hImp hP)
  · intro hContra hP
    by_cases hQ : Q
    · exact hQ
    · exact False.elim ((hContra hQ) hP)

-- Distributive Law: P ∧ (Q ∨ R) ↔ (P ∧ Q) ∨ (P ∧ R)
theorem and_distrib_or (P Q R : Prop) :
    P ∧ (Q ∨ R) ↔ (P ∧ Q) ∨ (P ∧ R) := by
  constructor
  · intro ⟨hP, hQR⟩
    cases hQR with
    | inl hQ => exact Or.inl ⟨hP, hQ⟩
    | inr hR => exact Or.inr ⟨hP, hR⟩
  · intro h
    cases h with
    | inl hPQ => exact ⟨hPQ.1, Or.inl hPQ.2⟩
    | inr hPR => exact ⟨hPR.1, Or.inr hPR.2⟩


-- ============================================================================
-- 4. Computational Truth Table (Pure Bool Execution)
-- This directly mirrors the TTD app's truth table rows!
-- ============================================================================

def implies (p q : Bool) : Bool :=
  (!p) || q

-- Verify all 4 rows of Modus Ponens computationally:
-- (P && (P → Q)) → Q is true in all cases
#eval (implies (true  && implies true  true)  true)   -- true
#eval (implies (true  && implies true  false) false)  -- true
#eval (implies (false && implies false true)  true)   -- true
#eval (implies (false && implies false false) false)  -- true

-- Lean checks that the entire truth table is identically true in one shot:
theorem modus_ponens_table (p q : Bool) :
    implies (p && implies p q) q = true := by
  revert p q
  decide

end MiddleWay.Level0
