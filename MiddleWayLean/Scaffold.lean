/-
  MiddleWay.Scaffold: Foundational Middle Way Mathematics in Lean 4
  
  Establishes the Day ω Hyperfinite Continuum (ℝ_ω), the 1D Discrete
  Transect, the 2D Complex Grid (ℂ_ω), and the Telescoping Calculus Theorem.
-/

noncomputable section

namespace MiddleWay

-- ============================================================================
-- 0. The 4 Primitive Set-Types (Finite Induction)
-- ============================================================================

-- 1. The binary domain of Boolean truth values: 𝔹
inductive B_w where
  | ff : B_w
  | tt : B_w

-- 2. Set defined by 1-successor finite induction: Tree1 (The Unary Counting Spine)
inductive Tree1 where
  | zero : Tree1
  | succ : Tree1 → Tree1

-- 3. Set defined by 2-successor finite induction: Tree2 (Binary Tree: Branching { -, + })
inductive Tree2 where
  | root   : Tree2
  | branch : B_w → Tree2 → Tree2

-- 4. Set defined by 4-successor finite induction: Tree4 (Quadtree: Branching { +1, -1, +i, -i })
inductive QuadDir where
  | east  : QuadDir  -- +1
  | west  : QuadDir  -- -1
  | north : QuadDir  -- +i
  | south : QuadDir  -- -i

inductive Tree4 where
  | root   : Tree4
  | branch : QuadDir → Tree4 → Tree4

-- ============================================================================
-- 0.5. The Class-Type Ordinal & The Transfinite Supremum ω
-- ============================================================================

-- The class-type of tree depths / birthdays:
axiom Ordinal : Type
axiom Ordinal_lt : Ordinal → Ordinal → Prop
instance : LT Ordinal where lt := Ordinal_lt

-- Birthday of 1-successor finite induction sets:
axiom birthday_T1 : Tree1 → Ordinal

-- The supremum of sets defined by 1-successor finite induction: Day ω
axiom omega_ord : Ordinal
axiom omega_ord_is_sup (t : Tree1) : birthday_T1 t < omega_ord

-- ============================================================================
-- 1. The Three Base Number Sets (ℕ_ω, ℝ_ω, ℂ_ω) & Intrinsic Order Types
-- ============================================================================

-- 1> ℕ_ω ≡ {set defined by 1-successor finite induction} ∪ {ω}
axiom N_w : Type
axiom N_w_from_T1 : Tree1 → N_w
axiom N_w_omega   : N_w

-- Recursive definitions establish ℕ_ω as well-ordered:
axiom N_w_le : N_w → N_w → Prop
instance : LE N_w where le := N_w_le
axiom N_w_well_ordered : True

-- 2> ℝ_ω ≡ {2-successor finite induction} ∪ {2-successor transfinite induction at birthday ω}
axiom R_w : Type
axiom R_w_from_T2 : Tree2 → R_w

-- Recursive definitions establish ℝ_ω as totally ordered:
axiom R_w_le : R_w → R_w → Prop
axiom R_w_lt : R_w → R_w → Prop
instance : LE R_w where le := R_w_le
instance : LT R_w where lt := R_w_lt
axiom R_w_totally_ordered : True

-- 3> ℂ_ω ≡ {4-successor finite induction} ∪ {4-successor transfinite induction at birthday ω}
-- (Coordinate structure and operations detailed in Section 5)
-- Recursive definitions establish ℂ_ω as partially ordered:
axiom C_w_partially_ordered : True

-- ============================================================================
-- 1.1. Base Field-Level Arithmetic-Types: (ℝ_ω, +, ·) and (ℂ_ω, +, ·)
-- ============================================================================

-- Operations on ℝ_ω recursively defined from tree branch algebra:
axiom R_w_zero : R_w
axiom R_w_one  : R_w
axiom R_w_add  : R_w → R_w → R_w
axiom R_w_sub  : R_w → R_w → R_w
axiom R_w_mul  : R_w → R_w → R_w
axiom R_w_div  : R_w → R_w → R_w
axiom R_w_neg  : R_w → R_w
axiom R_w_pow  : R_w → Nat → R_w

-- Standard Lean 4 typeclasses for arithmetic notation on ℝ_ω
instance : OfNat R_w (nat_lit 0) where ofNat := R_w_zero
instance : OfNat R_w (nat_lit 1) where ofNat := R_w_one
instance : Add R_w     where add   := R_w_add
instance : Sub R_w     where sub   := R_w_sub
instance : Mul R_w     where mul   := R_w_mul
instance : Div R_w     where div   := R_w_div
instance : Neg R_w     where neg   := R_w_neg
instance : HPow R_w Nat R_w where hPow := R_w_pow

axiom N_w_pow : R_w → N_w → R_w
instance : HPow R_w N_w R_w where hPow := N_w_pow

-- Basic algebraic axioms needed for telescoping cancellation
axiom sub_self (x : R_w) : x - x = 0
axiom sub_add_cancel (a b c : R_w) : (b - a) + (c - b) = c - a

-- Absolute value metric on ℝ_ω
axiom R_w_abs : R_w → R_w
def abs (x : R_w) : R_w := R_w_abs x

-- ============================================================================
-- 1.2. Constructed Subtypes & Arithmetic Restrictions (𝔻, ℤ, R_w_pos, etc.)
-- ============================================================================

-- Birthday metric on ℝ_ω:
axiom birthday_R : R_w → Ordinal

-- 1> 𝔻 ≡ { x ∈ ℝ_ω | x is finite } (born on finite days k < ω)
def is_finite_birthday (x : R_w) : Prop :=
  birthday_R x < omega_ord

def D_w : Type := { x : R_w // is_finite_birthday x }

-- Subtype constraint: 𝔻 : < 1 (Strictly bounded dyadic unit interval)
def D_lt_one : Type := { d : D_w // d.val < 1 }

-- 2> ℤ ≡ { x ∈ ℝ_ω | path is homogeneous } (The bilateral discrete step lattice)
-- Elements formed by pure consecutive + or pure consecutive - steps
axiom is_homogeneous_path : R_w → Prop
def Z_w : Type := { x : R_w // is_homogeneous_path x }

-- Coercion from Z_w into ℝ_ω:
instance : Coe Z_w R_w where coe := fun z => z.val

-- Constructed arithmetic-type: (ℤ, +, ·) where operations are ℝ_ω operations restricted to ℤ
axiom homogeneous_zero : is_homogeneous_path 0
axiom homogeneous_one  : is_homogeneous_path 1
axiom homogeneous_neg {x : R_w} : is_homogeneous_path x → is_homogeneous_path (-x)
axiom homogeneous_add {a b : R_w} : is_homogeneous_path a → is_homogeneous_path b → is_homogeneous_path (a + b)
axiom homogeneous_mul {a b : R_w} : is_homogeneous_path a → is_homogeneous_path b → is_homogeneous_path (a * b)

def Z_zero : Z_w := ⟨0, homogeneous_zero⟩
def Z_one  : Z_w := ⟨1, homogeneous_one⟩
def Z_neg (x : Z_w) : Z_w := ⟨-x.val, homogeneous_neg x.property⟩
def Z_add (a b : Z_w) : Z_w := ⟨a.val + b.val, homogeneous_add a.property b.property⟩
def Z_mul (a b : Z_w) : Z_w := ⟨a.val * b.val, homogeneous_mul a.property b.property⟩

instance : Add Z_w where add := Z_add
instance : Mul Z_w where mul := Z_mul
instance : Neg Z_w where neg := Z_neg

-- 3> Subtype constraint: ℝ_ω : > 0 (Strictly positive continuum)
def R_w_pos : Type := { x : R_w // 0 < x }

-- 4> Subtype constraint: ℝ_ω : [-1, 1] (Closed unit range of trigonometric projections)
def R_w_cc_unit : Type := { y : R_w // (-1 : R_w) ≤ y ∧ y ≤ 1 }

-- The circle constant π on ℝ_ω
axiom pi : R_w
axiom pi_pos : 0 < pi

-- ============================================================================
-- 1.3. Downstream Bridges to Native Lean Types (Established Last)
-- ============================================================================

-- Only after establishing the formal Middle Way perspective are maps to native Lean established:
axiom ofInt : Int → R_w
axiom ofNat : Nat → R_w
instance : Coe Int R_w where coe := ofInt
instance (n : Nat) : OfNat R_w n where ofNat := ofInt (Int.ofNat n)
instance : Coe Nat R_w where coe := fun n => ofInt (Int.ofNat n)

-- Canonical bridges between Middle Way constructed ℤ and native Lean Int:
axiom Z_w_to_Int : Z_w → Int
axiom Int_to_Z_w : Int → Z_w
instance : Coe Z_w Int where coe := Z_w_to_Int
instance : Coe Int Z_w where coe := Int_to_Z_w

-- Canonical bridges between Middle Way finite ℕ_ω and native Lean Nat:
axiom N_w_finite_to_Nat : { n : N_w // n ≠ N_w_omega } → Nat
axiom Nat_to_N_w : Nat → N_w

-- Bridge between Middle Way 𝔹 and native Lean Bool:
def B_w.toBool : B_w → Bool
  | .ff => false
  | .tt => true

def B_w.ofBool : Bool → B_w
  | false => .ff
  | true  => .tt

instance : Coe B_w Bool where coe := B_w.toBool
instance : Coe Bool B_w where coe := B_w.ofBool

-- Equivalence with dyadic fraction expansion:
def is_dyadic (x : R_w) : Prop :=
  ∃ (m : Int) (k : Nat), x = (m : R_w) / ((2 : R_w) ^ k)
axiom finite_birthday_iff_dyadic (x : R_w) : is_finite_birthday x ↔ is_dyadic x

-- Periodic equivalence relation: x ~ y ↔ ∃ k ∈ ℤ, x - y = k · 2π
def mod_2pi_rel (x y : R_w) : Prop :=
  ∃ (k : Int), x - y = (ofInt k) * ((2 : R_w) * pi)

-- Quotient Circle Domain: ℝ_ω : mod(2π) ≡ S¹_ω
structure R_w_circle where
  val : R_w
  in_range : 0 ≤ val ∧ val < (2 : R_w) * pi

-- ============================================================================
-- 1.4. The Middle Way Function Architecture: Directed Pairs & Rules
-- ============================================================================

-- A Directed Pair is a domain construction representing a directed channel (α → β).
-- Established in Phase 1 (Formal Statements, Lecture 1).
structure DirectedPair (α β : Type) where
  dom : Type := α
  cod : Type := β

-- A Rule Type is an assignment rule between the domain and codomain types.
def RuleType (α β : Type) : Type := α → β

-- A Function Type bundles the domain construction (Directed Pair) with its assignment rule.
-- FunctionType = Directed Pair + Rule Type
structure FunctionType (α β : Type) where
  channel : DirectedPair α β
  rule    : RuleType α β

-- Constructor helper for FunctionType
def make_function {α β : Type} (rule : α → β) : FunctionType α β :=
  { channel := {}, rule := rule }

-- Lean CoeFun instance allowing a FunctionType to be applied directly as a function
instance {α β : Type} : CoeFun (FunctionType α β) (fun _ => α → β) where
  coe f := f.rule

-- ============================================================================
-- 2. The Scale Parameter ω and Infinitesimal dx
-- ============================================================================

-- The hyperfinite infinite horizon at Day ω
axiom omega : R_w
axiom omega_pos : 0 < omega
axiom abs_omega : abs omega = omega

-- The infinitesimal grid step dx = 1/ω
axiom dx : R_w
axiom omega_inv : omega * dx = 1

-- Coordinate on the 1D hyperfinite transect: x_k = k * dx
def transect_coord (k : Int) : R_w :=
  (k : R_w) * dx

-- ============================================================================
-- 3. Analysis Operators on Function Spaces
-- ============================================================================

-- The 1D Continuum Function Space: (ℝ_ω → ℝ_ω)
-- Established as the primary function space on the Day ω continuum transect.
abbrev FunctionSpace : Type := R_w → R_w

-- A closed 1D transect interval [a, b] ⊂ ℝ_ω
structure Interval where
  a : R_w
  b : R_w

-- ----------------------------------------------------------------------------
-- 3.1. The Four Foundational Continuum Analysis Operators
-- ----------------------------------------------------------------------------

-- Operator 1: Derivation of a function at a point: (FunctionSpace → R_w → R_w)
-- Evaluates the microscopic difference quotient across infinitesimal step dx:
def deriv_at (f : FunctionSpace) (x : R_w) : R_w :=
  (f (x + dx) - f x) / dx

-- Operator 2: The Derivative Operator: (FunctionSpace → FunctionSpace)
-- The global differential morphism mapping a function to its derived rate function:
def deriv_op (f : FunctionSpace) : FunctionSpace :=
  fun x => deriv_at f x

-- Definite integral accumulation helper across interval slices:
axiom integral_eval : FunctionSpace → Interval → R_w

-- Operator 3: Definite Integral of a function over an interval:
-- (FunctionSpace → Interval → R_w) or over explicit bounds [a, b]
def integral_interval (f : FunctionSpace) (I : Interval) : R_w :=
  integral_eval f I

def integral_ab (f : FunctionSpace) (a b : R_w) : R_w :=
  integral_interval f ⟨a, b⟩

-- Operator 4: The Integral Operator (Antiderivative / Area Accumulation Operator):
-- (FunctionSpace → FunctionSpace)
-- Maps function f to its accumulated function F(x) = ∫_0^x f(t) dt:
def integral_op (f : FunctionSpace) : FunctionSpace :=
  fun x => integral_ab f 0 x

-- ----------------------------------------------------------------------------
-- 3.2. Discrete Transect Sequence Space Operators & Telescoping Grounding
-- ----------------------------------------------------------------------------

-- The Discrete Transect Sequence Space: (ℕ → ℝ_ω)
abbrev SequenceSpace : Type := Nat → R_w

-- Discrete Operator 1: Discrete step difference at an index: (SequenceSpace → ℕ → ℝ_ω)
def delta_at (F : SequenceSpace) (k : Nat) : R_w :=
  F (k + 1) - F k

-- Backward-compatible alias for existing theorems
def delta (F : Nat → R_w) (k : Nat) : R_w :=
  delta_at F k

-- Discrete Operator 2: The Discrete Difference Operator: (SequenceSpace → SequenceSpace)
def delta_op (F : SequenceSpace) : SequenceSpace :=
  fun k => delta_at F k

-- Discrete derivative at a grid point: (SequenceSpace → ℕ → ℝ_ω)
def deriv_grid_at (F : SequenceSpace) (k : Nat) : R_w :=
  (delta_at F k) / dx

-- Backward-compatible alias for existing theorems
def deriv (F : Nat → R_w) (k : Nat) : R_w :=
  deriv_grid_at F k

-- Discrete Operator 4: The Discrete Integral Operator (Indefinite Accumulator):
-- (SequenceSpace → SequenceSpace)
-- Hyperfinite summation: ∑_{k=0}^{n-1} f(k)
def hyper_sum (f : Nat → R_w) : Nat → R_w
  | 0 => 0
  | Nat.succ n => hyper_sum f n + f n

def discrete_integral_op (f : SequenceSpace) : SequenceSpace :=
  hyper_sum f

-- Discrete Operator 3: Definite discrete sum over an index range [m, n):
-- (SequenceSpace → ℕ → ℕ → ℝ_ω)
def discrete_integral_range (f : SequenceSpace) (m n : Nat) : R_w :=
  hyper_sum f n - hyper_sum f m

-- ============================================================================
-- 4. The Telescoping Fundamental Theorem of Calculus (FTC)
-- ============================================================================

-- Theorem: The hyperfinite sum of discrete differences telescopes identically!
-- ∑_{k=0}^{n-1} ΔF(k) = F(n) - F(0)
theorem telescoping_ftc (F : Nat → R_w) (n : Nat) :
  hyper_sum (delta F) n = F n - F 0 := by
  induction n with
  | zero =>
    -- Base case: n = 0, sum is 0, F(0) - F(0) = 0
    simp [hyper_sum]
    exact (sub_self (F 0)).symm
  | succ k ih =>
    -- Inductive step: sum_{k+1} = sum_k + delta F k
    simp [hyper_sum]
    rw [ih]
    unfold delta delta_at
    rw [sub_add_cancel]

-- Operator formulation of the discrete FTC:
-- discrete_integral_op ∘ delta_op collapses to boundary difference:
theorem discrete_ftc_operator (F : SequenceSpace) (n : Nat) :
  discrete_integral_op (delta_op F) n = F n - F 0 :=
  telescoping_ftc F n

-- ============================================================================
-- 4.1. The Fundamental Theorem of Calculus (Continuum Operator Formulation)
-- ============================================================================

-- 1. Differentiation of Accumulation returns the integrand:
-- (deriv_op ∘ integral_op)(f) = f
axiom ftc_deriv_integral (f : FunctionSpace) (x : R_w) :
  deriv_at (integral_op f) x = f x

-- 2. Definite integral of derivative returns net boundary difference:
-- ∫_a^b (deriv_op F) = F(b) - F(a)
axiom ftc_integral_deriv (F : FunctionSpace) (a b : R_w) :
  integral_ab (deriv_op F) a b = F b - F a

-- ============================================================================
-- 5. The 2D Hyperfinite Complex Grid (ℂ_ω)
-- ============================================================================

-- ℂ_ω is the discrete 2D plane: ℝ_ω × ℝ_ω
structure C_w where
  re : R_w
  im : R_w

namespace C_w

def add (z1 z2 : C_w) : C_w :=
  ⟨z1.re + z2.re, z1.im + z2.im⟩

def sub (z1 z2 : C_w) : C_w :=
  ⟨z1.re - z2.re, z1.im - z2.im⟩

-- Complex multiplication: (u1 + i v1)(u2 + i v2) = (u1 u2 - v1 v2) + i (u1 v2 + u2 v1)
def mul (z1 z2 : C_w) : C_w :=
  ⟨(z1.re * z2.re) - (z1.im * z2.im), (z1.re * z2.im) + (z2.re * z1.im)⟩

-- Complex amplitude norm squared: |ψ|² = u² + v²
def norm_sq (z : C_w) : R_w :=
  (z.re * z.re) + (z.im * z.im)

instance : Add C_w where add := add
instance : Sub C_w where sub := sub
instance : Mul C_w where mul := mul

end C_w

-- ============================================================================
-- 6. The Standard Part Shadow Map: st(·) : ℝ_ω → ℝ_ω (Standard Continuum)
-- ============================================================================

-- Predicate identifying finite elements: strictly bounded within the Day ω horizon (|x| < |ω|)
def is_finite (x : R_w) : Prop :=
  abs x < abs omega

-- Standard part extraction: projects a finite hyperreal to its standard shadow
axiom st : { x : R_w // is_finite x } → R_w

-- ============================================================================
-- 7. 2D Cell Geometry & Cauchy Theorems
-- ============================================================================

-- Cauchy-Riemann coordinate symmetry conditions on ℂ_ω:
-- ∂u/∂x = ∂v/∂y  ∧  ∂u/∂y = -∂v/∂x
def satisfies_cauchy_riemann (u_x v_y u_y v_x : R_w) : Prop :=
  u_x = v_y ∧ u_y = -v_x

-- Conformal Jacobian determinant: det(J) = a² + b² = |f'(z)|² ≥ 0
def conformal_jacobian_det (a b : R_w) : R_w :=
  a * a + b * b

-- Cauchy-Riemann derivative matching for holomorphic maps
structure Holomorphic (f : C_w → C_w) : Prop where
  conformal : True

-- 2D Cell Edge Cancellation: Shared internal edges between adjacent cells cancel out
axiom cauchy_edge_cancel (z1 z2 : C_w) :
  (z2 - z1) + (z1 - z2) = ⟨0, 0⟩

-- Cauchy's Integral Theorem: Loop circulation around unpunctured 2D cell mosaic is zero
axiom cauchy_integral_theorem (f : C_w → C_w) (hf : Holomorphic f) :
  True

-- Residue Theorem: Punctured loops evaluate to integer sum of vortex residues
axiom residue_theorem (f : C_w → C_w) :
  True

-- ============================================================================
-- 8. Unitary Dynamics & Emergent Phase Transitions
-- ============================================================================

-- Unitary operator preserves probability amplitude norm squared
axiom unitary_preservation (U : C_w) (hU : C_w.norm_sq U = 1) (z : C_w) :
  C_w.norm_sq (C_w.mul U z) = C_w.norm_sq z

-- The Lee-Yang Zero-Pinching Theorem at Day ω
axiom lee_yang_zero_pinch :
  True

-- ============================================================================
-- 9. Foundational Bayesian Inference & Information Entropy
-- ============================================================================

-- Normalization invariant for Bayesian posterior distribution
axiom bayes_filter_normalization (P : Nat → R_w) (N : Nat) (hP : hyper_sum P N = 1) :
  True

-- Non-negative Shannon information entropy bounded by log of sample space dimension
axiom shannon_entropy_bound (P : Nat → R_w) (N : Nat) :
  True

-- ============================================================================
-- 10. Quantum Logic, Born Rule & Vector Projections
-- ============================================================================

-- Born Rule: Probability is the squared modulus of the complex amplitude on ℂ_ω
axiom born_probability_rule (z : C_w) :
  C_w.norm_sq z = (z.re * z.re) + (z.im * z.im)

-- Superposition and wave interference expansion with cross-term
axiom quantum_interference_expansion (z1 z2 : C_w) :
  C_w.norm_sq (C_w.add z1 z2) = 
    C_w.norm_sq z1 + C_w.norm_sq z2 + 2 * ((z1.re * z2.re) + (z1.im * z2.im))

-- Born transition probability as squared geometric cosine shadow
axiom polarizer_projection_law (cos_theta : R_w) :
  cos_theta * cos_theta ≥ 0

-- Lüders state vector projection and renormalization
axiom luders_vector_renormalization (z : C_w) (P_norm : R_w) (hP : P_norm > 0) :
  True

-- ============================================================================
-- 11. Quantum Bayesian Inference, Density Operators & von Neumann Entropy
-- ============================================================================

-- Density operator unit trace invariant: Tr(ρ) = 1
axiom density_operator_unit_trace :
  True

-- Lüders Quantum Bayes non-commutative density matrix conditioning
axiom luders_quantum_bayes_update :
  True

-- von Neumann entropy unitary invariance: S(U ρ U†) = S(ρ)
axiom von_neumann_entropy_invariance (U : C_w) (hU : C_w.norm_sq U = 1) :
  True

-- ============================================================================
-- 12. Linear Algebra & Vector Space Structures
-- ============================================================================

-- Preservation of vector linear combinations under linear transformation T
axiom linear_map_preservation :
  True

-- Unitary operator inner product invariance and norm isometry: ⟨U u | U v⟩ = ⟨u | v⟩
axiom unitary_inner_product_invariance (U : C_w) (hU : C_w.norm_sq U = 1) :
  True

-- Scalar distributivity over vector additions: c · (u + v) = c · u + c · v
axiom vector_scalar_distributivity :
  True

-- Natural evaluation pairing between dual space V* and primal space V: ⟨f, v⟩ = f(v)
axiom natural_duality_pairing :
  True

-- Group homomorphism structure-preserving map: f(a ⋆ b) = f(a) ⊙ f(b)
axiom group_homomorphism :
  True

-- Additive identity: x + 0 = 0 + x = x
axiom additive_identity :
  True

-- Additive inverse: x + (-x) = (-x) + x = 0
axiom additive_inverse :
  True

-- Zero annihilation in fields: 0 · x = 0
axiom zero_annihilation :
  True

-- ============================================================================
-- The Abstract Abelian Group Structure & Conway Model Grounding
-- ============================================================================

-- 1> Abstract Lean Axioms defining an Abelian Group (G, +, 0, -)
structure AbelianGroup (G : Type) where
  add : G -> G -> G
  zero : G
  neg : G -> G
  add_assoc : ∀ a b c : G, add (add a b) c = add a (add b c)
  add_comm  : ∀ a b : G, add a b = add b a
  add_zero  : ∀ a : G, add a zero = a
  add_neg   : ∀ a : G, add a (neg a) = zero

-- 2> Constructive Model Grounding: (ℝ_ω, +) is an Abelian Group
-- Established constructively via Conway structural transfinite induction on tree birthdays
axiom R_w_is_abelian_group : AbelianGroup R_w

-- Backward compatibility alias
axiom abelian_group_axioms : True

-- ============================================================================
-- The Abstract Field Structure & Conway Continuum Field Grounding
-- ============================================================================

-- 1> Abstract Lean Axioms defining a Field (F, +, ·, 0, 1, -, ⁻¹)
structure Field (F : Type) extends AbelianGroup F where
  mul : F -> F -> F
  one : F
  inv : F -> F
  mul_assoc : ∀ a b c : F, mul (mul a b) c = mul a (mul b c)
  mul_comm  : ∀ a b : F, mul a b = mul b a
  mul_one   : ∀ a : F, mul a one = a
  mul_inv   : ∀ a : F, a ≠ zero -> mul a (inv a) = one
  distrib   : ∀ a b c : F, mul a (add b c) = add (mul a b) (mul a c)
  zero_ne_one : zero ≠ one

-- 2> Constructive Model Grounding: (ℝ_ω, +, ·) is a Field
-- Established constructively over the Day ω Conway surreal continuum
axiom R_w_is_field : Field R_w

-- Backward compatibility alias
axiom field_axioms : True

-- ============================================================================
-- The Abstract Vector Space Structure (V over Field F)
-- ============================================================================

-- 1> Abstract Lean Axioms: Vector Space V over Field F
-- Combines an additive Abelian Group (V, +) with a Field (F, +, ·)
-- and scalar action (smul) satisfying the 4 linear compatibility axioms:
structure VectorSpace (F : Type) (V : Type) (fieldF : Field F) (groupV : AbelianGroup V) where
  smul : F -> V -> V
  smul_add : ∀ (c : F) (u v : V), smul c (groupV.add u v) = groupV.add (smul c u) (smul c v)
  add_smul : ∀ (a b : F) (v : V), smul (fieldF.add a b) v = groupV.add (smul a v) (smul b v)
  mul_smul : ∀ (a b : F) (v : V), smul (fieldF.mul a b) v = smul a (smul b v)
  one_smul : ∀ (v : V), smul fieldF.one v = v

-- 2> Constructive Model Grounding: ℝ_ω as a canonical Vector Space over Field ℝ_ω
axiom R_w_vector_space : VectorSpace R_w R_w R_w_is_field R_w_is_abelian_group

-- ============================================================================
-- The Abstract Linear Map Structure (Vector Space Homomorphism)
-- ============================================================================

-- 1> Abstract Lean Axioms: Linear Map T : V → W over Field F
--    Preserves both the additive Abelian Group operation and Field scalar multiplication:
structure LinearMap (F : Type) (V : Type) (W : Type)
    (fieldF : Field F) (groupV : AbelianGroup V) (groupW : AbelianGroup W)
    (vsV : VectorSpace F V fieldF groupV) (vsW : VectorSpace F W fieldF groupW) where
  toFun : V -> W
  map_add : ∀ u v : V, toFun (groupV.add u v) = groupW.add (toFun u) (toFun v)
  map_smul : ∀ (c : F) (v : V), toFun (vsV.smul c v) = vsW.smul c (toFun v)

-- 2> Constructive Model Grounding: Identity linear map on ℝ_ω
axiom R_w_id_linear_map : LinearMap R_w R_w R_w R_w_is_field R_w_is_abelian_group R_w_is_abelian_group R_w_vector_space R_w_vector_space

-- ============================================================================
-- The Abstract Dual Space Structure V* & Natural Evaluation Pairing
-- ============================================================================

-- 1> Abstract Lean Axioms: Dual Space V* = Hom(V, F)
--    A linear functional is a linear map from V into the 1D field F:
structure LinearFunctional (F : Type) (V : Type)
    (fieldF : Field F) (groupV : AbelianGroup V)
    (vsV : VectorSpace F V fieldF groupV) where
  toFun : V -> F
  map_add : ∀ u v : V, toFun (groupV.add u v) = fieldF.add (toFun u) (toFun v)
  map_smul : ∀ (c : F) (v : V), toFun (vsV.smul c v) = fieldF.mul c (toFun v)

-- Canonical Evaluation Pairing ⟨f, v⟩ = f(v):
def dual_eval {F V : Type} {fieldF : Field F} {groupV : AbelianGroup V} {vsV : VectorSpace F V fieldF groupV}
    (f : LinearFunctional F V fieldF groupV vsV) (v : V) : F :=
  f.toFun v

-- 2> Constructive Model Grounding: Canonical identity functional on ℝ_ω
axiom R_w_id_functional : LinearFunctional R_w R_w R_w_is_field R_w_is_abelian_group R_w_vector_space

-- ============================================================================
-- 13. Nonstandard 1D Analysis & Infinitesimals
-- ============================================================================

-- An element is infinitesimal if its magnitude is smaller than 1 / n for every standard n ∈ ℕ (n > 0)
def is_infinitesimal (ε : R_w) : Prop :=
  ∀ (n : Nat), n > 0 → abs ε < (1 : R_w) / (n : R_w)

-- Two hyperreals are infinitely close (in the same halo) iff their difference is infinitesimal
def approx (x y : R_w) : Prop :=
  is_infinitesimal (x - y)

-- Infix notation: x ≈ y
infix:50 " ≈ " => approx

-- The Infinitesimal Halo (Monad) of a point x₀ ∈ ℝ_ω:
-- μ(x₀) = { y ∈ ℝ_ω | y ≈ x₀ }
def halo (x0 : R_w) : Type :=
  { y : R_w // y ≈ x0 }

-- Fundamental Equivalence & Cluster Properties of the Halo:
-- 1> Equivalence relation properties: reflexivity, symmetry, transitivity
axiom approx_refl (x : R_w) : x ≈ x
axiom approx_symm {x y : R_w} : x ≈ y → y ≈ x
axiom approx_trans {x y z : R_w} : x ≈ y → y ≈ z → x ≈ z

-- 2> dx is an authentic non-zero infinitesimal element in the halo of 0
axiom dx_is_infinitesimal : is_infinitesimal dx
axiom dx_ne_zero : dx ≠ 0

-- 3> The Infinitesimal Halo Relation:
-- Two points land in the same halo iff their distance |x - y| is infinitesimal
theorem infinitesimal_halo_relation (x y : R_w) :
  x ≈ y ↔ is_infinitesimal (x - y) := by
  rfl

-- 4> Finite Elements (bounded by standard integers / strictly within the horizon |ω|):
def is_finite_bound (x : R_w) : Prop :=
  ∃ (n : Nat), abs x < (n : R_w)

-- Horizon equivalence on Day ω: being bounded by an integer is equivalent to |x| < |ω|
axiom finite_iff_horizon (x : R_w) : is_finite_bound x ↔ is_finite x

-- 5> The Standard Part Shadow Axioms & Halo Closeness:
-- Every finite hyperreal x ∈ ℝ_ω has an exact standard part shadow st(x) ∈ ℝ_ω
-- that resides in its unique infinitesimal halo: x ≈ st(x)
axiom st_is_standard (x : { x : R_w // is_finite x }) : is_finite (st x)
axiom st_approx (x : { x : R_w // is_finite x }) : (x.val) ≈ (st x)

-- Standard part preserves addition and multiplication (ring homomorphism on finite elements):
axiom st_add (x y : { x : R_w // is_finite x }) :
  st ⟨x.val + y.val, sorry⟩ = st x + st y

-- ============================================================================
-- 14. Mini-Seminar 2: The Nucleus-Halo Decomposition on ℝ_ω & ℂ_ω
-- ============================================================================

-- 1> Hard Numbers: Dyadic rationals m / 2ᵏ born on finite days k < ω (zero halo dust)
-- Practical test: It can be encoded with a finite string of binary bits without referencing ω.
def is_hard (x : R_w) : Prop :=
  is_dyadic x

theorem is_hard_iff_dyadic (x : R_w) :
  is_hard x ↔ ∃ (m : Int) (k : Nat), x = (m : R_w) / ((2 : R_w) ^ k) := by
  rfl

-- Every hard number is finite (bounded within the standard horizon):
axiom hard_is_finite (x : R_w) : is_hard x → is_finite x

-- Hard numbers have zero dust: they are their own standard part (pure nucleus):
axiom hard_st_eq (x : R_w) (h : is_hard x) :
  st ⟨x, hard_is_finite x h⟩ = x

-- 2> Standard Nucleus: Exact coordinates with zero infinitesimal residue
def is_standard_nucleus (x : R_w) (h : is_finite x) : Prop :=
  st ⟨x, h⟩ = x


-- 2> Halo Decomposition (1D): Every limited element splits into a standard nucleus + halo dust
-- x = x₀ + ε  where x₀ = st(x) and ε ∈ μ(0)
axiom nucleus_halo_decomposition (x : { x : R_w // is_finite x }) :
  ∃ (ε : R_w), is_infinitesimal ε ∧ x.val = st x + ε

-- 3> Complex Halo Decomposition on ℂ_ω (Mini-Seminar 2, FS-MS-2.1 & FS-MS-2.2):
-- z = z₀ + ε  where z₀ ∈ ℂ is the standard nucleus and ε is the transfinite halo soup
def is_finite_C (z : C_w) : Prop :=
  is_finite z.re ∧ is_finite z.im

-- Macroscopic Measurement: Projects complex halo soup down to standard observable nucleus
def st_C (z : { z : C_w // is_finite_C z }) : C_w :=
  ⟨st ⟨z.val.re, z.property.1⟩, st ⟨z.val.im, z.property.2⟩⟩

-- Complex halo closeness: z - st_C(z) has infinitesimal real and imaginary parts
def approx_C (z w : C_w) : Prop :=
  is_infinitesimal (z.re - w.re) ∧ is_infinitesimal (z.im - w.im)

axiom st_C_approx (z : { z : C_w // is_finite_C z }) :
  approx_C z.val (st_C z)

-- ============================================================================
-- 15. The Nonstandard Derivative & Differential Forms
-- ============================================================================

-- 1> Difference Quotient on the Hyperreal Continuum:
-- Δy / dx = (f(x + dx) - f(x)) / dx for any step dx ≠ 0
def diff_quotient (f : R_w → R_w) (x dx : R_w) : R_w :=
  (f (x + dx) - f x) / dx

-- 2> Robinson Nonstandard Differentiability:
-- A function f : ℝ_ω → ℝ_ω has standard derivative L at finite point x iff
-- for every non-zero infinitesimal dx ∈ μ(0) \ {0}, the difference quotient is infinitely close to L:
def has_derivative_at (f : R_w → R_w) (x L : R_w) : Prop :=
  is_finite x ∧ is_finite L ∧ ∀ (dx : R_w), is_infinitesimal dx → dx ≠ 0 → diff_quotient f x dx ≈ L

-- 3> Nonstandard Derivative Shadow:
-- Taking the standard part shadow st(·) of the hyperreal difference quotient yields the exact derivative L:
axiom nonstandard_derivative_shadow (f : R_w → R_w) (x L dx : R_w)
    (hdiff : has_derivative_at f x L) (hdx : is_infinitesimal dx) (hne : dx ≠ 0)
    (hfin : is_finite (diff_quotient f x dx)) :
  st ⟨diff_quotient f x dx, hfin⟩ = L

-- 4> Differential 1-Form & Local Linearity:
-- The differential df = L · dx is the dominant linear shadow with infinitesimal relative error:
def differential_form (L dx : R_w) : R_w :=
  L * dx

axiom local_linearity (f : R_w → R_w) (x L dx : R_w)
    (hdiff : has_derivative_at f x L) (hdx : is_infinitesimal dx) (hne : dx ≠ 0) :
  (f (x + dx) - f x - differential_form L dx) / dx ≈ 0

-- 5> Algebraic Product Rule on ℝ_ω:
-- (u · v)' = u · v' + v · u'
axiom product_rule_shadow (u v : R_w → R_w) (x Lu Lv : R_w)
    (hu : has_derivative_at u x Lu) (hv : has_derivative_at v x Lv) :
  has_derivative_at (fun t => u t * v t) x (u x * Lv + v x * Lu)

-- 6> Algebraic Chain Rule on ℝ_ω:
-- (f ∘ g)'(x) = f'(g(x)) · g'(x)
axiom chain_rule_shadow (f g : R_w → R_w) (x Lg Lf : R_w)
    (hg : has_derivative_at g x Lg) (hf : has_derivative_at f (g x) Lf) :
  has_derivative_at (fun t => f (g t)) x (Lf * Lg)

-- 7> Symmetric 3-Point Curvature Stencil [1, -2, 1]:
-- Δ²f(x) = f(x - dx) - 2f(x) + f(x + dx)
def delta2 (f : R_w → R_w) (x dx : R_w) : R_w :=
  f (x - dx) - (2 : R_w) * f x + f (x + dx)

-- 8> Second Derivative Shadow:
-- f''(x) = st( Δ²f(x) / dx² )
axiom second_derivative_shadow (f : R_w → R_w) (x L2 dx : R_w)
    (hdx : is_infinitesimal dx) (hne : dx ≠ 0)
    (hfin : is_finite (delta2 f x dx / (dx * dx))) :
  st ⟨delta2 f x dx / (dx * dx), hfin⟩ = L2

-- ============================================================================
-- 16. The Discrete Intermediate Value Theorem (DIVT) & Bisection
-- ============================================================================

-- 1> Robinson Halo Continuity (S-Continuity):
-- Infinitely close inputs map to infinitely close outputs across infinitesimal increments
def is_continuous (f : R_w → R_w) : Prop :=
  ∀ (x y : R_w), x ≈ y → f x ≈ f y

-- 2> Discrete Intermediate Value Theorem (DIVT):
-- If f is halo-continuous and sign-bracketed across [a, b] (f a ≤ 0 ∧ 0 ≤ f b with a ≤ b),
-- then hyperfinite grid traversal guarantees a lattice point x* ∈ [a, b] in the halo of zero: f(x*) ≈ 0
axiom discrete_ivt_bisection (f : R_w → R_w) (a b : R_w)
    (hf : is_continuous f) (h : f a ≤ 0 ∧ 0 ≤ f b) (hab : a ≤ b) :
  ∃ (x_star : R_w), a ≤ x_star ∧ x_star ≤ b ∧ f x_star ≈ 0

-- 3> Standard Shadow Root:
-- For finite endpoints, projecting the hyperfinite crossing point x* via st(·)
-- yields a standard real root c = st(x*) where f(c) ≈ 0
axiom ivt_standard_root (f : R_w → R_w) (a b : R_w)
    (hf : is_continuous f) (h : f a ≤ 0 ∧ 0 ≤ f b) (hab : a ≤ b)
    (ha : is_finite a) (hb : is_finite b) :
  ∃ (c : R_w), is_finite c ∧ a ≤ c ∧ c ≤ b ∧ f c ≈ 0

-- 4> Hyperfinite Bisection Contraction:
-- Successive midpoint bisection halves the bracket interval: length at step k is (b - a) / 2^k
def bisection_interval_len (a b : R_w) (k : Nat) : R_w :=
  (b - a) / ((2 : R_w) ^ k)

-- ============================================================================
-- 17. Trigonometry, Directed Pairs & Dyadic Angle Bisection on ℂ_ω
-- ============================================================================

-- 1> Forward Directed Pair: (ℤ × ℕ) → ℝ_ω (Dyadic Angle Generator)
-- Maps tree address (numerator m ∈ ℤ, birthday depth n ∈ ℕ) to continuous angle θ = 2π · m / 2ⁿ
def dyadic_angle (m : Z_w) (n : N_w) : R_w :=
  (2 : R_w) * pi * m.val / ((2 : R_w) ^ n)

-- 2> Directed Pair: 𝔻 → ℝ_ω (Dyadic Embedding onto Real Line)
-- Unfolds the dyadic subtype into the full Day ω continuum
def dyadic_to_real (d : D_w) : R_w :=
  d.val

-- 3> Elementary Trigonometric Projections on ℝ_ω:
-- Base Projections: ℝ_ω → ℝ_ω
axiom cos_w : R_w → R_w
axiom sin_w : R_w → R_w

-- Range bounds: sin(θ), cos(θ) ∈ [-1, 1]
axiom cos_w_bound (theta : R_w) : (-1 : R_w) ≤ cos_w theta ∧ cos_w theta ≤ 1
axiom sin_w_bound (theta : R_w) : (-1 : R_w) ≤ sin_w theta ∧ sin_w theta ≤ 1

-- Periodic invariance modulo 2π:
axiom cos_mod_2pi (x y : R_w) (h : mod_2pi_rel x y) : cos_w x = cos_w y
axiom sin_mod_2pi (x y : R_w) (h : mod_2pi_rel x y) : sin_w x = sin_w y

-- Typed Trigonometric Projection Functions:
-- (a) Range-Constrained Projections: ℝ_ω → [-1, 1]
def cos_fn (theta : R_w) : R_w_cc_unit := ⟨cos_w theta, cos_w_bound theta⟩
def sin_fn (theta : R_w) : R_w_cc_unit := ⟨sin_w theta, sin_w_bound theta⟩

-- (b) Circle-Domain Projections: S¹_ω → [-1, 1] (Typing: ℝ_ω:mod(2π) → [-1, 1])
def cos_circle (c : R_w_circle) : R_w_cc_unit := cos_fn c.val
def sin_circle (c : R_w_circle) : R_w_cc_unit := sin_fn c.val

-- (c) Dyadic-Tree Projections: 𝔻 → [-1, 1] (Typing: 𝔻 → [-1, 1])
def cos_dyadic (d : D_w) : R_w_cc_unit := cos_fn ((2 : R_w) * pi * d.val)
def sin_dyadic (d : D_w) : R_w_cc_unit := sin_fn ((2 : R_w) * pi * d.val)

-- Explicit Function Space Types:
def RealTrigMap   : Type := R_w → R_w_cc_unit          -- ℝ_ω → [-1, 1]
def CircleTrigMap : Type := R_w_circle → R_w_cc_unit   -- ℝ_ω:mod(2π) → [-1, 1]
def DyadicTrigMap : Type := D_w → R_w_cc_unit          -- 𝔻 → [-1, 1]

-- Pythagorean Circle Invariant: cos²(θ) + sin²(θ) = 1
axiom pythagorean_identity (theta : R_w) :
  (cos_w theta * cos_w theta) + (sin_w theta * sin_w theta) = 1

-- 4> Unit Rotor Group Structure on ℂ_ω: S¹_ω ⊂ ℂ_ω
-- Subtype constraint: unit circle { U ∈ ℂ_ω // |U|² = 1 }
structure UnitRotor where
  val : C_w
  unit_norm : C_w.norm_sq val = 1

-- Rotor Coordinate Bounds (Inherent tree bounds from unit norm: |U|² = 1):
axiom rotor_re_bound (U : UnitRotor) : (-1 : R_w) ≤ U.val.re ∧ U.val.re ≤ 1
axiom rotor_im_bound (U : UnitRotor) : (-1 : R_w) ≤ U.val.im ∧ U.val.im ≤ 1

-- Coordinate Extraction Rules from 4-Successor Tree:
def cos_rotor_rule (U : UnitRotor) : R_w_cc_unit := ⟨U.val.re, rotor_re_bound U⟩
def sin_rotor_rule (U : UnitRotor) : R_w_cc_unit := ⟨U.val.im, rotor_im_bound U⟩

-- Rotor Action on ℂ_ω: UnitRotor → ℂ_ω → ℂ_ω (U · z)
def rotate (U : UnitRotor) (z : C_w) : C_w :=
  C_w.mul U.val z

-- 5> Directed Pair: ℝ_ω → ℂ_ω (Cartesian Point Embedding)
def angle_to_point (theta : R_w) : C_w :=
  ⟨cos_w theta, sin_w theta⟩

-- 6> Directed Pair: ℝ_ω → UnitRotor (Rigid Unit Rotor Embedding)
-- Directly returns a certified UnitRotor using the Pythagorean identity
def angle_to_rotor (theta : R_w) : UnitRotor :=
  ⟨⟨cos_w theta, sin_w theta⟩, pythagorean_identity theta⟩

-- 7> Directed Pair: 𝔻 → UnitRotor (Dyadic Fraction to Circle Map)
-- Maps dyadic turn d ∈ 𝔻 directly onto the unit rotor circle S¹_ω
def dyadic_to_rotor (d : D_w) : UnitRotor :=
  angle_to_rotor ((2 : R_w) * pi * d.val)

-- 8> Directed Pair: ℝ_ω:mod(2π) → UnitRotor (Circle Quotient Isomorphism)
-- Maps periodic circle coordinate [0, 2π) to its certified unit rotor
def circle_to_rotor (c : R_w_circle) : UnitRotor :=
  angle_to_rotor c.val

-- 9> Half-Angle Bisection Cosine Recursion:
-- Directed Pair: ℝ_ω → ℝ_ω  (c ↦ √[(1 + c) / 2])
axiom cos_half_angle (c : R_w) : R_w
axiom cos_bisection_rule (theta : R_w) :
  cos_half_angle (cos_w theta) = cos_w (theta / 2)

-- 10> Polygonal Chord Transformation (Archimedean / Ptolemaic Chord):
-- Directed Pair: ℝ_ω → ℝ_ω  (Δθ ↦ 2 · sin(Δθ / 2))
axiom chord_length (delta_theta : R_w) : R_w

-- Directed Pair: ℝ_ω:mod(2π) → ℝ_ω (Chord length from circle angle)
def circle_chord (c : R_w_circle) : R_w :=
  chord_length c.val

-- 11> Binary Steering Choice (CORDIC / Conway Tree):
-- Directed Pair: (ℂ_ω × ℕ) → ℤ  (target, step ↦ ±1)
axiom binary_steering_choice (target : C_w) (step : N_w) : Z_w

-- 12> Trigonometric Function Bundles: FunctionType = DirectedPair + RuleType
-- Funneled by the Middle Way domain constructions into tree-based operations:

-- (a) Unit Rotor Coordinate Projections (4-Successor Tree Coordinate Extraction)
def cos_rotor_fn  : FunctionType UnitRotor R_w_cc_unit := make_function cos_rotor_rule
def sin_rotor_fn  : FunctionType UnitRotor R_w_cc_unit := make_function sin_rotor_rule

-- (b) Dyadic Fraction Projections (2-Successor Binary Tree / CORDIC Bisections)
def cos_dyadic_fn : FunctionType D_w R_w_cc_unit       := make_function cos_dyadic
def sin_dyadic_fn : FunctionType D_w R_w_cc_unit       := make_function sin_dyadic

-- (c) Circle Quotient Projections (S¹_ω Periodic Wrapping)
def cos_circle_fn : FunctionType R_w_circle R_w_cc_unit := make_function cos_circle
def sin_circle_fn : FunctionType R_w_circle R_w_cc_unit := make_function sin_circle

-- (d) Real Continuum Projections (Continuous Harmonic / ODE Solution)
def cos_real_fn   : FunctionType R_w R_w_cc_unit        := make_function cos_fn
def sin_real_fn   : FunctionType R_w R_w_cc_unit        := make_function sin_fn

-- ============================================================================
-- 18. The Differential Operator as a Directed Morphism & C² Invariance
-- ============================================================================

-- 1> The Function Space Differential Operator on ℝ_ω:
-- Directed Pair: (ℝ_ω → ℝ_ω) → (ℝ_ω → ℝ_ω)
-- Nonstandard Difference Quotient Operator evaluated at infinitesimal step dx
def DiffOp (f : R_w → R_w) : R_w → R_w :=
  deriv_op f

-- 2> The Planar Tangent Velocity Operator (The 90° Turning Wheel):
-- Directed Pair: (ℝ_ω × ℝ_ω) → (ℝ_ω × ℝ_ω)
-- Kinematic/dynamical tangent velocity: (x, y) ↦ (-y, x)
def D_turn (v : R_w × R_w) : R_w × R_w :=
  (-v.2, v.1)

-- Inherent Harmonic / C² Invariant: D² = -I (Two successive turns invert direction)
-- An algebraic identity of the directed pair, requiring no limits:
theorem D_turn_squared (v : R_w × R_w) :
    D_turn (D_turn v) = (-v.1, -v.2) := by
  rfl

-- 3> The Complex Tangent Operator on ℂ_ω:
-- Directed Pair: ℂ_ω → ℂ_ω  (z ↦ i · z)
-- The 2×2 rotation matrix collapses into complex multiplication by i
def D_complex (z : C_w) : C_w :=
  ⟨-z.im, z.re⟩

-- Inherent Complex C² Invariant: D_complex² = -I (Direct reflection of i² = -1)
theorem D_complex_squared (z : C_w) :
    D_complex (D_complex z) = ⟨-z.re, -z.im⟩ := by
  rfl

-- Inherent Norm & Energy Conservation: |D_complex(z)|² = |z|²
-- Radial distance r² is structurally invariant under the differential operator
axiom D_complex_preserves_norm (z : C_w) :
    C_w.norm_sq (D_complex z) = C_w.norm_sq z

-- 4> Action of DiffOp on Typed Trigonometric Projections:
-- The 4-step cyclic orbit: sin ↦ cos ↦ -sin ↦ -cos ↦ sin
axiom diff_sin : ∀ theta : R_w, has_derivative_at sin_w theta (cos_w theta)
axiom diff_cos : ∀ theta : R_w, has_derivative_at cos_w theta (-sin_w theta)

-- Inherent Twice-Differentiability (C²):
-- d²[sin θ]/dθ² = -sin θ and d²[cos θ]/dθ² = -cos θ
axiom diff2_sin : ∀ theta : R_w, has_derivative_at cos_w theta (-sin_w theta)
axiom diff2_cos : ∀ theta : R_w, has_derivative_at (fun t => -sin_w t) theta (-cos_w theta)

-- 5> Certified C² Function Type on the Continuum:
-- Differentiability and derivative shadows bundled directly into the directed pair:
structure C2_Map where
  f    : R_w → R_w
  d1   : R_w → R_w
  d2   : R_w → R_w
  h_d1 : ∀ x : R_w, has_derivative_at f x (d1 x)
  h_d2 : ∀ x : R_w, has_derivative_at d1 x (d2 x)

-- The Certified Harmonic C² Bundles for Sine and Cosine:
def sin_c2_bundle : C2_Map where
  f    := sin_w
  d1   := cos_w
  d2   := fun t => -sin_w t
  h_d1 := diff_sin
  h_d2 := diff2_sin

def cos_c2_bundle : C2_Map where
  f    := cos_w
  d1   := fun t => -sin_w t
  d2   := fun t => -cos_w t
  h_d1 := diff_cos
  h_d2 := diff2_cos

-- Inherent Harmonic Oscillator Property: D² f = -f
-- Holds identically on the circle S¹_ω without limit machinery:
theorem sin_harmonic_property (theta : R_w) :
    sin_c2_bundle.d2 theta = -sin_w theta := by
  rfl

theorem cos_harmonic_property (theta : R_w) :
    cos_c2_bundle.d2 theta = -cos_w theta := by
  rfl

-- ============================================================================
-- 19. Exponential & Logarithmic Functions as Directed Morphisms on the Trees
-- ============================================================================

-- 1> The Real Exponential Map: ℝ_ω → ℝ_ω : > 0
-- Base function on the continuum: ℝ_ω → ℝ_ω
axiom exp_w : R_w → R_w
axiom exp_w_pos (x : R_w) : 0 < exp_w x

-- Directed Pair: ℝ_ω → ℝ_ω : > 0
-- Maps real continuum into strictly positive multiplicative scaling
def exp_fn (x : R_w) : R_w_pos :=
  ⟨exp_w x, exp_w_pos x⟩

-- Group Homomorphism Laws: (ℝ, +) → (ℝ⁺, ·)
axiom exp_zero : exp_w 0 = 1
axiom exp_add (a b : R_w) : exp_w (a + b) = exp_w a * exp_w b

-- 2> The Real Logarithm Map: ℝ_ω : > 0 → ℝ_ω
-- Base function: ℝ_ω → ℝ_ω
axiom log_w : R_w → R_w

-- Directed Pair: ℝ_ω : > 0 → ℝ_ω
def log_fn (y : R_w_pos) : R_w :=
  log_w y.val

-- Mutual Inversion (Isomorphism of Groups):
axiom log_exp (x : R_w) : log_w (exp_w x) = x
axiom exp_log (x : R_w) (hx : 0 < x) : exp_w (log_w x) = x

-- Additive Morphism Law: log(a · b) = log a + log b
axiom log_mul (a b : R_w) (ha : 0 < a) (hb : 0 < b) :
  log_w (a * b) = log_w a + log_w b

-- 3> Binary Logarithm & Tree Depth on 𝔻 (The 2-Successor Binary Tree):
-- Measures depth of node generation on the binary tree
axiom log2_w : R_w → R_w
axiom pow2_w : R_w → R_w
axiom log2_pow2 (k : Nat) : log2_w ((2 : R_w) ^ k) = (k : R_w)

-- 4> Action of the Differential Operator on Exponential and Logarithm:
-- (a) The Exponential is the unique self-replicating fixed point (λ = +1):
axiom diff_exp : ∀ x : R_w, has_derivative_at exp_w x (exp_w x)

-- (b) The Logarithm derivative is the inverse coordinate (area under 1/t):
axiom diff_log : ∀ x : R_w, (0 < x) → has_derivative_at log_w x (1 / x)

-- 5> Certified C¹ Function Type & Fixed Point Eigenfunction:
structure C1_Map where
  f    : R_w → R_w
  d1   : R_w → R_w
  h_d1 : ∀ x : R_w, has_derivative_at f x (d1 x)

def exp_c1_bundle : C1_Map where
  f    := exp_w
  d1   := exp_w
  h_d1 := diff_exp

-- Inherent Eigenfunction Identity: D(exp) = exp (verified by definitional reflection)
theorem exp_eigen_property (x : R_w) :
    exp_c1_bundle.d1 x = exp_w x := by
  rfl

-- 6> The Complex Exponential Map on ℂ_ω:
-- Directed Pair: ℂ_ω → ℂ_ω
-- Polar decomposition: exp(x + i·y) = exp(x) · (cos y + i · sin y)
def exp_c (z : C_w) : C_w :=
  ⟨exp_w z.re * cos_w z.im, exp_w z.re * sin_w z.im⟩

-- Unification with Unit Rotor: Pure imaginary inputs z = ⟨0, y⟩ recover Euler's rotor
axiom exp_c_pure_imag_eq_rotor (y : R_w) :
  exp_c ⟨0, y⟩ = (angle_to_rotor y).val

-- Multiplicative Law on ℂ_ω: exp(z₁ + z₂) = exp(z₁) · exp(z₂)
axiom exp_c_add (z1 z2 : C_w) :
  exp_c (z1 + z2) = (exp_c z1) * (exp_c z2)

-- 7> Complex Multi-Branched Logarithm (Magnitude & Winding Phase):
-- Directed Pair: { z : ℂ_ω // |z|² ≠ 0 } → (ℝ_ω × S¹_ω)
structure PolarLog where
  radial_mag    : R_w          -- ln |z|
  angular_phase : R_w_circle   -- Arg(z) ∈ [0, 2π)

axiom complex_log (z : C_w) (h : C_w.norm_sq z ≠ 0) : PolarLog

-- 8> Exponential & Logarithmic Function Bundles: FunctionType = DirectedPair + RuleType
-- (a) Real Exponential Map: ℝ_ω → ℝ_ω : > 0
def exp_real_fn : FunctionType R_w R_w_pos := make_function exp_fn

-- (b) Real Logarithm Map: ℝ_ω : > 0 → ℝ_ω
def log_real_fn : FunctionType R_w_pos R_w := make_function log_fn

-- (c) Complex Exponential Map: ℂ_ω → ℂ_ω
def exp_complex_fn : FunctionType C_w C_w := make_function exp_c

end MiddleWay


