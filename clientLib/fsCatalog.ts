/**
 * Pre-harvested Relational Catalog of Curricular Formal Statements,
 * Directional Calculation Modes, and Verified Presets.
 *
 * Generated automatically by nodeUtils/harvestStencils.ts
 */

export type FsStatementType = 'math' | 'physics' | 'information';

export interface FsCatalogStatement {
  id: string;
  parentId?: string;
  type: FsStatementType;
  tier: 'constitutional' | 'axiom' | 'theorem' | 'scenario' | 'corollary' | 'law';
  title: string;
  description?: string;
  governingSeed?: 'conway_cut' | 'shadow_map' | 'boundary_law';
  scaffoldKey: string;
  expression: string;
  leanSignature?: string;
  leanSnippet?: string;
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

export const FS_CATALOG: FsCatalog = {
  "generatedAt": "2026-09-25T07:00:58.079Z",
  "version": "1.0.0",
  "formalStatements": [
    {
      "id": "fs_newtonian_mechanics",
      "type": "physics",
      "tier": "law",
      "governingSeed": "boundary_law",
      "title": "Newtonian Dynamics & Boundary Acceleration",
      "description": "Foundational relation between force, inertia, and momentum conservation on ℝ_ω.",
      "scaffoldKey": "newtonian_mechanics",
      "expression": "F = m · a  ∧  p = m · v",
      "referencedInSegments": [
        "stemNewtonianBridge"
      ]
    },
    {
      "id": "fs_free_fall_accel",
      "parentId": "fs_newtonian_mechanics",
      "type": "physics",
      "tier": "scenario",
      "governingSeed": "boundary_law",
      "title": "Uniform Free Fall Kinematics",
      "description": "Motion under constant gravitational acceleration g on ℝ_ω.",
      "scaffoldKey": "free_fall_accel",
      "expression": "v(t) = v₀ - g · t  ∧  s(t) = v₀·t - (1/2)·g·t²",
      "leanSignature": "theorem free_fall_stencil (v0 g t : R_w) : v = v0 - g * t",
      "referencedInSegments": [
        "stemNewtonianBridge"
      ]
    },
    {
      "id": "fs_telescoping_ftc",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "boundary_law",
      "title": "Telescoping Fundamental Theorem of Calculus",
      "description": "Discrete interior cancellation collapsing whole-transect sums to boundary differences.",
      "scaffoldKey": "telescoping_ftc",
      "expression": "∑_{k=0}^{n-1} ΔF(k) = F(n) - F(0)",
      "leanSignature": "theorem telescoping_ftc (F : Nat → R_w) (n : Nat) : hyper_sum (delta F) n = F n - F 0",
      "referencedInSegments": [
        "analysis1DLecture3",
        "middlewayIntro",
        "sequencesAndSums",
        "stemHeatDiffusion",
        "stemTrigFoundations"
      ]
    },
    {
      "id": "fs_work_energy",
      "parentId": "fs_telescoping_ftc",
      "type": "physics",
      "tier": "law",
      "governingSeed": "boundary_law",
      "title": "Telescoping Work-Energy Principle",
      "description": "Exact cancellation of interior work increments yielding net kinetic energy change.",
      "scaffoldKey": "work_energy",
      "expression": "Δ(KE) = (1/2)·m·v² - (1/2)·m·v₀² = ∑_{k=0}^{n-1} F_k · Δx_k",
      "leanSignature": "theorem work_energy_conservation (m v0 v : R_w) : delta_ke = work_sum",
      "referencedInSegments": [
        "stemNewtonianBridge"
      ]
    },
    {
      "id": "fs_heat_flux",
      "parentId": "fs_telescoping_ftc",
      "type": "physics",
      "tier": "scenario",
      "governingSeed": "boundary_law",
      "title": "Thermal Flux Balance & Discrete Laplacian Stencil",
      "description": "Net thermal flux balance across spatial slices with tridiagonal Toeplitz Laplacian operator.",
      "scaffoldKey": "heat_flux",
      "expression": "∂u/∂t = α · [u_{i-1} - 2u_i + u_{i+1}] / Δx²",
      "leanSignature": "theorem heat_flux_conservation (alpha dx dt : R_w) : conserved",
      "referencedInSegments": [
        "stemHeatDiffusion"
      ]
    },
    {
      "id": "fs_quartic_diff",
      "parentId": "fs_telescoping_ftc",
      "type": "math",
      "tier": "corollary",
      "governingSeed": "shadow_map",
      "title": "Hyperfinite Quartic Derivative",
      "description": "Algebraic derivative of f(x) = x⁴ with 3-point difference curvature stencil.",
      "scaffoldKey": "r_quartic",
      "expression": "diff_w(x⁴, x) = 4x³  ∧  st( [f(x+dx)-2f(x)+f(x-dx)]/dx² ) = 12x²",
      "referencedInSegments": [
        "analysis1DLecture2"
      ]
    },
    {
      "id": "fs_complex_arithmetic",
      "type": "math",
      "tier": "axiom",
      "governingSeed": "conway_cut",
      "title": "Hyperfinite Complex Arithmetic & Cell Loop",
      "description": "2D tensor product algebra ℂ_ω = ℝ_ω ⊗ ℝ_ω and Cauchy cell edge cancellation.",
      "scaffoldKey": "cauchy_edge_cancel",
      "expression": "z₁ · z₂ = (x₁·x₂ - y₁·y₂) + i·(x₁·y₂ + x₂·y₁)",
      "leanSignature": "axiom cauchy_edge_cancel (z1 z2 : C_w) : (z2 - z1) + (z1 - z2) = ⟨0, 0⟩",
      "referencedInSegments": [
        "analysis2DLecture2"
      ]
    },
    {
      "id": "fs_cauchy_riemann",
      "parentId": "fs_complex_arithmetic",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "shadow_map",
      "title": "Cauchy-Riemann Conformal Symmetries",
      "description": "Direction-independent complex derivative enforcing angle preservation and zero shear.",
      "scaffoldKey": "cauchy_riemann",
      "expression": "∂u/∂x = ∂v/∂y  ∧  ∂u/∂y = -∂v/∂x",
      "referencedInSegments": [
        "analysis2DLecture1"
      ]
    },
    {
      "id": "fs_residue_integral",
      "parentId": "fs_complex_arithmetic",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "boundary_law",
      "title": "Residue Theorem & Vortex Circulation",
      "description": "Punctured closed loop integral evaluating to integer vortex winding residues.",
      "scaffoldKey": "residue_theorem",
      "expression": "∮_γ f(z) dz = 2π i · ∑ Res(f, z_k)",
      "referencedInSegments": [
        "analysis2DIntro",
        "analysis2DLecture2"
      ]
    },
    {
      "id": "fs_lee_yang",
      "parentId": "fs_complex_arithmetic",
      "type": "physics",
      "tier": "theorem",
      "governingSeed": "conway_cut",
      "title": "Lee-Yang Zero Circle & Critical Phase Transition",
      "description": "Partition function zeros on complex unit circle pinching real axis at Day ω.",
      "scaffoldKey": "lee_yang",
      "expression": "dist(z*, ℝ) = |T - T_c| + 1 / √N",
      "referencedInSegments": [
        "stemHeatDiffusion",
        "cosmologyAsInformation"
      ]
    },
    {
      "id": "fs_unitary_isometry",
      "type": "physics",
      "tier": "law",
      "governingSeed": "boundary_law",
      "title": "Unitary Evolution & Norm Isometry",
      "description": "Norm-preserving probability evolution under self-adjoint operators U† · U = I.",
      "scaffoldKey": "unitary_isometry",
      "expression": "⟨U ϕ | U ψ⟩ = ⟨ϕ | ψ⟩  ∧  ∥U ψ∥ = ∥ψ∥ = 1",
      "leanSignature": "axiom unitary_isometry (U : C_w) : norm_sq U = 1",
      "referencedInSegments": [
        "vectorsLecture2",
        "vectorsLecture3"
      ]
    },
    {
      "id": "fs_three_polarizer",
      "parentId": "fs_unitary_isometry",
      "type": "physics",
      "tier": "scenario",
      "governingSeed": "boundary_law",
      "title": "Three-Polarizer Sequential Projection",
      "description": "Quantum state projection through non-commuting measurement operators via Born rule.",
      "scaffoldKey": "born_rule",
      "expression": "I = I₀ · cos²(θ₁) · cos²(θ₂ - θ₁) · cos²(90° - θ₂)",
      "referencedInSegments": [
        "quantumLogicLecture2",
        "vectorsLecture3"
      ]
    },
    {
      "id": "fs_probability_foundations",
      "type": "math",
      "tier": "axiom",
      "governingSeed": "shadow_map",
      "title": "Discrete Probability Measure & Conditioning",
      "description": "Non-negative measure on finite state spaces with unit total mass.",
      "scaffoldKey": "discrete_probability",
      "expression": "P(A ∩ B) = P(A|B) · P(B)",
      "referencedInSegments": [
        "bayesianInferenceIntro"
      ]
    },
    {
      "id": "fs_bayes_updating",
      "parentId": "fs_probability_foundations",
      "type": "information",
      "tier": "theorem",
      "governingSeed": "shadow_map",
      "title": "Bayesian Posterior Updating (P(H|D))",
      "description": "Prior belief update under sensory observation with probability normalization.",
      "scaffoldKey": "bayes_rule",
      "expression": "P(H|D) = [ P(D|H) · P(H) ] / [ P(D|H)·P(H) + P(D|¬H)·P(¬H) ]",
      "referencedInSegments": [
        "editedBayesianInferenceLecture1V1"
      ]
    },
    {
      "id": "fs_scale_reciprocity",
      "type": "math",
      "tier": "constitutional",
      "governingSeed": "conway_cut",
      "title": "Scale Horizon & Infinitesimal Reciprocity",
      "description": "Fundamental scale axiom: Day ω cosmic horizon and grid step dx are mutual inverses ω · dx = 1.",
      "scaffoldKey": "omega_inv",
      "expression": "ω · dx = 1  ∧  dx = 1/ω",
      "referencedInSegments": [
        "analysis1DLecture1"
      ]
    },
    {
      "id": "fs_discrete_ivt",
      "parentId": "fs_scale_reciprocity",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "conway_cut",
      "title": "Discrete Intermediate Value Theorem Bisection",
      "description": "Constructive root isolation through dyadic interval halving on sign change.",
      "scaffoldKey": "discrete_ivt",
      "expression": "f(a)·f(b) < 0  ⇒  c = (a + b)/2",
      "referencedInSegments": [
        "analysis1DLecture1"
      ]
    },
    {
      "id": "fs_nucleus_halo_decomposition",
      "parentId": "fs_scale_reciprocity",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "shadow_map",
      "title": "Nucleus-Halo Decomposition Theorem",
      "description": "Unique splitting of every finite hyperreal into standard real nucleus and infinitesimal Day ω halo dust.",
      "scaffoldKey": "nucleus_halo_decomposition",
      "expression": "x = st(x) + ε  ∧  ε ∈ μ(0)",
      "leanSignature": "axiom nucleus_halo_decomposition (x : { x : R_w // is_finite x }) : ∃ (ε : R_w), is_infinitesimal ε ∧ x.val = st x + ε",
      "referencedInSegments": [
        "analysis1DLecture1"
      ]
    },
    {
      "id": "fs_dyadic_angle_bisection",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "conway_cut",
      "title": "Dyadic Angle Bisection & Unit Rotor Generation",
      "description": "Directed pair (ℤ × ℕ) → ℝ_ω generating all dyadic angles via recursive bisection and unit rotors on ℂ_ω.",
      "scaffoldKey": "dyadic_angle",
      "expression": "θ_{m,n} = 2π · (m / 2ⁿ)  ∧  cos(θ/2) = √[(1 + cos θ)/2]  ∧  |U(θ)|² = 1",
      "leanSignature": "def dyadic_angle (m : Int) (n : Nat) : R_w",
      "referencedInSegments": [
        "stemTrigFoundations"
      ]
    },
    {
      "id": "fs_polygonal_horn_chord",
      "parentId": "fs_dyadic_angle_bisection",
      "type": "math",
      "tier": "scenario",
      "governingSeed": "boundary_law",
      "title": "Polygonal Horn Rim Chord & Inward Deflection",
      "description": "Directed pair ℝ_ω → ℝ_ω mapping central angle Δθ to Euclidean rim chord length wrapping around the origin.",
      "scaffoldKey": "chord_length",
      "expression": "c(Δθ) = 2 · sin(Δθ / 2) = √[2 - 2·cos(Δθ)]",
      "leanSignature": "axiom chord_length (delta_theta : R_w) : R_w",
      "referencedInSegments": [
        "stemTrigFoundations"
      ]
    },
    {
      "id": "fs_sin_dyadic_bisection",
      "parentId": "fs_dyadic_angle_bisection",
      "type": "math",
      "tier": "theorem",
      "governingSeed": "conway_cut",
      "title": "Dyadic Tree Sine Function & CORDIC Bisection",
      "description": "Directed pair 𝔻 → [-1, 1] mapping Conway binary angle tree nodes to standard sine coordinates.",
      "scaffoldKey": "sin_dyadic_fn",
      "expression": "sin_dyadic_fn(d) = sin(2π · d.val) ∈ [-1, 1]",
      "leanSignature": "def sin_dyadic_fn : FunctionType D_w R_w_cc_unit := make_function sin_dyadic",
      "referencedInSegments": [
        "stemTrigFoundations"
      ]
    },
    {
      "id": "fs_sin_rotor_projection",
      "type": "math",
      "tier": "axiom",
      "governingSeed": "conway_cut",
      "title": "Unit Rotor Group Sine Projection",
      "description": "Directed pair UnitRotor → [-1, 1] projecting 4-successor complex unit rotor U ∈ ℂ_ω to vertical imaginary coordinate.",
      "scaffoldKey": "sin_rotor_fn",
      "expression": "sin_rotor_fn(U) = U.val.im ∈ [-1, 1]  where  |U|² = 1",
      "leanSignature": "def sin_rotor_fn : FunctionType UnitRotor R_w_cc_unit := make_function sin_rotor_rule",
      "referencedInSegments": [
        "stemTrigFoundations"
      ]
    }
  ],
  "calculationModes": [
    {
      "id": "ff_v_from_v0_g_t",
      "statementId": "fs_free_fall_accel",
      "label": "(v₀, g, t) → v",
      "targetSymbol": "v",
      "targetDomain": "ℝ_ω",
      "targetUnit": "m/s",
      "formulaDescription": "v = v₀ - g · t",
      "formulaExpr": "v0 - g * t",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "v0",
          "symbol": "v₀",
          "domain": "ℝ_ω",
          "unit": "m/s",
          "defaultValue": 20,
          "min": -100,
          "max": 200,
          "step": 1,
          "description": "Initial velocity"
        },
        {
          "name": "g",
          "symbol": "g",
          "domain": "ℝ_ω",
          "unit": "m/s²",
          "defaultValue": 9.8,
          "min": 0.1,
          "max": 50,
          "step": 0.1,
          "description": "Gravitational acceleration"
        },
        {
          "name": "t",
          "symbol": "t",
          "domain": "ℝ_ω",
          "unit": "s",
          "defaultValue": 1.5,
          "min": 0,
          "max": 50,
          "step": 0.1,
          "description": "Elapsed time"
        }
      ]
    },
    {
      "id": "ff_t_from_v_v0_g",
      "statementId": "fs_free_fall_accel",
      "label": "(v, v₀, g) → t",
      "targetSymbol": "t",
      "targetDomain": "ℝ_ω",
      "targetUnit": "s",
      "formulaDescription": "t = (v₀ - v) / g",
      "formulaExpr": "(v0 - v) / g",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "v",
          "symbol": "v",
          "domain": "ℝ_ω",
          "unit": "m/s",
          "defaultValue": 0,
          "min": -100,
          "max": 200,
          "step": 1,
          "description": "Current velocity"
        },
        {
          "name": "v0",
          "symbol": "v₀",
          "domain": "ℝ_ω",
          "unit": "m/s",
          "defaultValue": 20,
          "min": -100,
          "max": 200,
          "step": 1,
          "description": "Initial velocity"
        },
        {
          "name": "g",
          "symbol": "g",
          "domain": "ℝ_ω",
          "unit": "m/s²",
          "defaultValue": 9.8,
          "min": 0.1,
          "max": 50,
          "step": 0.1,
          "description": "Gravitational acceleration"
        }
      ]
    },
    {
      "id": "ff_s_from_v0_g_t",
      "statementId": "fs_free_fall_accel",
      "label": "(v₀, g, t) → s",
      "targetSymbol": "s",
      "targetDomain": "ℝ_ω",
      "targetUnit": "m",
      "formulaDescription": "s = v₀ · t - (1/2) · g · t²",
      "formulaExpr": "v0 * t - 0.5 * g * (t ** 2)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "v0",
          "symbol": "v₀",
          "domain": "ℝ_ω",
          "unit": "m/s",
          "defaultValue": 20,
          "min": -100,
          "max": 200,
          "step": 1,
          "description": "Initial velocity"
        },
        {
          "name": "g",
          "symbol": "g",
          "domain": "ℝ_ω",
          "unit": "m/s²",
          "defaultValue": 9.8,
          "min": 0.1,
          "max": 50,
          "step": 0.1,
          "description": "Gravitational acceleration"
        },
        {
          "name": "t",
          "symbol": "t",
          "domain": "ℝ_ω",
          "unit": "s",
          "defaultValue": 1.5,
          "min": 0,
          "max": 50,
          "step": 0.1,
          "description": "Elapsed time"
        }
      ]
    },
    {
      "id": "we_ke_from_m_v",
      "statementId": "fs_work_energy",
      "label": "(m, v) → KE",
      "targetSymbol": "KE",
      "targetDomain": "ℝ_ω",
      "targetUnit": "J",
      "formulaDescription": "KE = (1/2) · m · v²",
      "formulaExpr": "0.5 * m * (v ** 2)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "m",
          "symbol": "m",
          "domain": "ℝ_ω",
          "unit": "kg",
          "defaultValue": 2,
          "min": 0.01,
          "max": 100,
          "step": 0.1,
          "description": "Mass"
        },
        {
          "name": "v",
          "symbol": "v",
          "domain": "ℝ_ω",
          "unit": "m/s",
          "defaultValue": 10,
          "min": 0,
          "max": 200,
          "step": 0.5,
          "description": "Velocity"
        }
      ]
    },
    {
      "id": "we_v_from_ke_m",
      "statementId": "fs_work_energy",
      "label": "(KE, m) → v",
      "targetSymbol": "v",
      "targetDomain": "ℝ_ω",
      "targetUnit": "m/s",
      "formulaDescription": "v = √(2 · KE / m)",
      "formulaExpr": "Math.sqrt((2 * KE) / m)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "KE",
          "symbol": "KE",
          "domain": "ℝ_ω",
          "unit": "J",
          "defaultValue": 100,
          "min": 0,
          "max": 10000,
          "step": 5,
          "description": "Kinetic Energy"
        },
        {
          "name": "m",
          "symbol": "m",
          "domain": "ℝ_ω",
          "unit": "kg",
          "defaultValue": 2,
          "min": 0.01,
          "max": 100,
          "step": 0.1,
          "description": "Mass"
        }
      ]
    },
    {
      "id": "diff_heat_step",
      "statementId": "fs_heat_flux",
      "label": "(α, Δt, Δx, u_L, u_C, u_R) → u_new",
      "targetSymbol": "u_new",
      "targetDomain": "ℝ_ω",
      "targetUnit": "°C",
      "formulaDescription": "u_new = u_C + α · (Δt / Δx²) · (u_L - 2·u_C + u_R)",
      "formulaExpr": "u_C + alpha * (dt / (dx ** 2)) * (u_L - 2 * u_C + u_R)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "alpha",
          "symbol": "α",
          "domain": "ℝ_ω",
          "unit": "m²/s",
          "defaultValue": 0.15,
          "min": 0.01,
          "max": 2,
          "step": 0.01,
          "description": "Thermal diffusivity"
        },
        {
          "name": "dt",
          "symbol": "Δt",
          "domain": "ℝ_ω",
          "unit": "s",
          "defaultValue": 0.02,
          "min": 0.001,
          "max": 0.5,
          "step": 0.005,
          "description": "Time step"
        },
        {
          "name": "dx",
          "symbol": "Δx",
          "domain": "ℝ_ω",
          "unit": "m",
          "defaultValue": 0.1,
          "min": 0.01,
          "max": 1,
          "step": 0.01,
          "description": "Spatial grid step"
        },
        {
          "name": "u_L",
          "symbol": "u_{i-1}",
          "domain": "ℝ_ω",
          "unit": "°C",
          "defaultValue": 100,
          "min": -50,
          "max": 300,
          "step": 5,
          "description": "Left neighbor"
        },
        {
          "name": "u_C",
          "symbol": "u_i",
          "domain": "ℝ_ω",
          "unit": "°C",
          "defaultValue": 50,
          "min": -50,
          "max": 300,
          "step": 5,
          "description": "Center node"
        },
        {
          "name": "u_R",
          "symbol": "u_{i+1}",
          "domain": "ℝ_ω",
          "unit": "°C",
          "defaultValue": 20,
          "min": -50,
          "max": 300,
          "step": 5,
          "description": "Right neighbor"
        }
      ]
    },
    {
      "id": "complex_mult_eval",
      "statementId": "fs_complex_arithmetic",
      "label": "(x₁, y₁, x₂, y₂) → z₁ · z₂",
      "targetSymbol": "z₁ · z₂",
      "targetDomain": "ℂ_ω",
      "formulaDescription": "z₁ · z₂ = (x₁x₂ - y₁y₂) + i·(x₁y₂ + x₂y₁)",
      "formulaExpr": "[(x1*x2 - y1*y2), (x1*y2 + x2*y1)]",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "x1",
          "symbol": "x₁",
          "domain": "ℝ_ω",
          "defaultValue": 1,
          "step": 0.5
        },
        {
          "name": "y1",
          "symbol": "y₁",
          "domain": "ℝ_ω",
          "defaultValue": 2,
          "step": 0.5
        },
        {
          "name": "x2",
          "symbol": "x₂",
          "domain": "ℝ_ω",
          "defaultValue": 3,
          "step": 0.5
        },
        {
          "name": "y2",
          "symbol": "y₂",
          "domain": "ℝ_ω",
          "defaultValue": 4,
          "step": 0.5
        }
      ]
    },
    {
      "id": "polarizer_transmission",
      "statementId": "fs_three_polarizer",
      "label": "(θ₁, θ₂, I₀) → I_final",
      "targetSymbol": "I_final",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "I = I₀ · cos²(θ₁) · cos²(θ₂ - θ₁) · cos²(90° - θ₂)",
      "formulaExpr": "I0 * (Math.cos(t1 * Math.PI/180)**2) * (Math.cos((t2-t1)*Math.PI/180)**2) * (Math.cos((90-t2)*Math.PI/180)**2)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "theta1",
          "symbol": "θ₁",
          "domain": "ℝ_ω",
          "unit": "°",
          "defaultValue": 30,
          "min": 0,
          "max": 90,
          "step": 5,
          "description": "First filter angle"
        },
        {
          "name": "theta2",
          "symbol": "θ₂",
          "domain": "ℝ_ω",
          "unit": "°",
          "defaultValue": 60,
          "min": 0,
          "max": 90,
          "step": 5,
          "description": "Second filter angle"
        },
        {
          "name": "I0",
          "symbol": "I₀",
          "domain": "ℝ_ω",
          "defaultValue": 1,
          "min": 0,
          "max": 100,
          "step": 0.1,
          "description": "Initial beam intensity"
        }
      ]
    },
    {
      "id": "bayes_posterior",
      "statementId": "fs_bayes_updating",
      "label": "(P(H), P(D|H), P(D|¬H)) → P(H|D)",
      "targetSymbol": "P(H|D)",
      "targetDomain": "[0, 1]",
      "formulaDescription": "P(H|D) = [ P(D|H) · P(H) ] / [ P(D|H)·P(H) + P(D|¬H)·(1 - P(H)) ]",
      "formulaExpr": "(pD_H * pH) / (pD_H * pH + pD_notH * (1 - pH))",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "pH",
          "symbol": "P(H)",
          "domain": "[0, 1]",
          "defaultValue": 0.1,
          "min": 0.001,
          "max": 0.999,
          "step": 0.01,
          "description": "Prior probability"
        },
        {
          "name": "pD_H",
          "symbol": "P(D|H)",
          "domain": "[0, 1]",
          "defaultValue": 0.9,
          "min": 0.001,
          "max": 1,
          "step": 0.01,
          "description": "Sensitivity / True positive"
        },
        {
          "name": "pD_notH",
          "symbol": "P(D|¬H)",
          "domain": "[0, 1]",
          "defaultValue": 0.05,
          "min": 0,
          "max": 0.999,
          "step": 0.01,
          "description": "False positive rate"
        }
      ]
    },
    {
      "id": "scale_reciprocity_eval",
      "statementId": "fs_scale_reciprocity",
      "label": "(ω, dx) → Balance Product ω · dx",
      "targetSymbol": "ω · dx",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "ω · dx = 1.0",
      "formulaExpr": "omega * dx",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "omega",
          "symbol": "Scale Horizon ω",
          "domain": "ℝ_ω",
          "defaultValue": 1000,
          "min": 10,
          "max": 100000,
          "step": 100
        },
        {
          "name": "dx",
          "symbol": "Infinitesimal Step dx",
          "domain": "ℝ_ω",
          "defaultValue": 0.001,
          "min": 0.00001,
          "max": 0.1,
          "step": 0.0001
        }
      ]
    },
    {
      "id": "diff_x4_st",
      "statementId": "fs_quartic_diff",
      "label": "(x, dx) → st(Δ(x⁴)/dx) = 4x³",
      "targetSymbol": "f'(x)",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "st( [ (x+dx)⁴ - x⁴ ] / dx ) = 4x³",
      "formulaExpr": "4 * (x ** 3)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "x",
          "symbol": "Point x",
          "domain": "ℝ_ω",
          "defaultValue": 2,
          "min": -10,
          "max": 10,
          "step": 0.5
        },
        {
          "name": "dx",
          "symbol": "Step dx",
          "domain": "ℝ_ω",
          "defaultValue": 0.001,
          "min": 0.0001,
          "max": 0.05,
          "step": 0.0005
        }
      ]
    },
    {
      "id": "ivt_root_bisection",
      "statementId": "fs_discrete_ivt",
      "label": "(a, b) → Midpoint c = (a + b)/2",
      "targetSymbol": "c",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "c = (a + b) / 2",
      "formulaExpr": "(a + b) / 2",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "a",
          "symbol": "Left Bound a",
          "domain": "ℝ_ω",
          "defaultValue": 1,
          "step": 0.5
        },
        {
          "name": "b",
          "symbol": "Right Bound b",
          "domain": "ℝ_ω",
          "defaultValue": 2,
          "step": 0.5
        }
      ]
    },
    {
      "id": "trig_dyadic_angle",
      "statementId": "fs_dyadic_angle_bisection",
      "label": "(m, n) → θ",
      "targetSymbol": "θ",
      "targetDomain": "[0, 2π)",
      "targetUnit": "rad",
      "formulaDescription": "θ = 2π · (m / 2ⁿ)",
      "formulaExpr": "2 * Math.PI * (m / (2 ** n))",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "m",
          "symbol": "Numerator m",
          "domain": "ℤ",
          "defaultValue": 1,
          "min": 0,
          "max": 64,
          "step": 1,
          "description": "Dyadic numerator"
        },
        {
          "name": "n",
          "symbol": "Birthday n",
          "domain": "ℕ",
          "defaultValue": 3,
          "min": 0,
          "max": 10,
          "step": 1,
          "description": "Tree birthday / depth"
        }
      ]
    },
    {
      "id": "trig_chord_length",
      "statementId": "fs_polygonal_horn_chord",
      "label": "(Δθ, R) → Chord c",
      "targetSymbol": "c",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "c = 2 · R · sin(Δθ / 2)",
      "formulaExpr": "2 * R * Math.sin((dtheta * Math.PI / 180) / 2)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "dtheta",
          "symbol": "Central Turn Δθ",
          "domain": "ℝ_ω",
          "unit": "°",
          "defaultValue": 45,
          "min": 0.1,
          "max": 180,
          "step": 1,
          "description": "Central turning angle in degrees"
        },
        {
          "name": "R",
          "symbol": "Radius R",
          "domain": "ℝ_ω",
          "defaultValue": 1,
          "min": 0.1,
          "max": 10,
          "step": 0.5,
          "description": "Circle radius"
        }
      ]
    },
    {
      "id": "trig_sin_dyadic_eval",
      "statementId": "fs_sin_dyadic_bisection",
      "label": "(m, n) → sin(θ)",
      "targetSymbol": "sin(θ)",
      "targetDomain": "[-1, 1]",
      "formulaDescription": "sin(θ) = sin(2π · m / 2ⁿ)",
      "formulaExpr": "Math.sin(2 * Math.PI * (m / (2 ** n)))",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "m",
          "symbol": "Numerator m",
          "domain": "ℤ",
          "defaultValue": 1,
          "min": 0,
          "max": 64,
          "step": 1,
          "description": "Dyadic numerator"
        },
        {
          "name": "n",
          "symbol": "Birthday n",
          "domain": "ℕ",
          "defaultValue": 3,
          "min": 0,
          "max": 12,
          "step": 1,
          "description": "Tree depth / birthday (2ⁿ bisections)"
        }
      ]
    },
    {
      "id": "trig_sin_rotor_eval",
      "statementId": "fs_sin_rotor_projection",
      "label": "(θ) → (cos θ, sin θ)",
      "targetSymbol": "sin(θ)",
      "targetDomain": "[-1, 1]",
      "formulaDescription": "sin(U) = Im(U) = sin(θ) ∈ [-1, 1]",
      "formulaExpr": "Math.sin(theta * Math.PI / 180)",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "theta",
          "symbol": "Rotor Angle θ",
          "domain": "ℝ_ω",
          "unit": "°",
          "defaultValue": 45,
          "min": 0,
          "max": 360,
          "step": 1,
          "description": "Rotor orientation angle"
        }
      ]
    },
    {
      "id": "nucleus_halo_decomp_eval",
      "statementId": "fs_nucleus_halo_decomposition",
      "label": "(x₀, k) → x = x₀ + k·dx",
      "targetSymbol": "x",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "x = st(x) + ε = x₀ + k · dx",
      "formulaExpr": "x0 + k * dx",
      "inputs": [
        {
          "name": "x0",
          "symbol": "x₀",
          "domain": "ℝ",
          "defaultValue": 4,
          "min": -100,
          "max": 100,
          "step": 0.5,
          "description": "Standard nucleus shadow"
        },
        {
          "name": "k",
          "symbol": "k",
          "domain": "ℤ",
          "defaultValue": 3,
          "min": -50,
          "max": 50,
          "step": 1,
          "description": "Halo step multiplier (dx = 1/ω)"
        }
      ]
    }
  ],
  "examples": [
    {
      "id": "ex_halo_point_4_plus_3dx",
      "modeId": "nucleus_halo_decomp_eval",
      "statementId": "fs_nucleus_halo_decomposition",
      "presetKey": "point_4_plus_3dx",
      "title": "Hyperreal Point Decomposition (x = 4 + 3·dx)",
      "values": {
        "x0": 4,
        "k": 3
      },
      "displayResult": "st(x) = 4, ε = 3·dx",
      "formattedFormula": "x = 4 + 3·dx = st(x) + ε",
      "domainBadge": "x ∈ ℝ_ω",
      "notes": "Decomposes point into hard integer nucleus 4 and infinitesimal Day ω halo perturbation 3·dx."
    },
    {
      "id": "ex_dyadic_45deg",
      "modeId": "trig_dyadic_angle",
      "statementId": "fs_dyadic_angle_bisection",
      "title": "Day 3 Diagonal Bisection (π/4)",
      "values": {
        "m": 1,
        "n": 3
      },
      "displayResult": "0.785 rad (45.0°)",
      "formattedFormula": "θ = 2π · (1 / 2³) = π/4",
      "domainBadge": "∈ [0, 2π)",
      "notes": "Generated on Day 3 of the Conway angle tree."
    },
    {
      "id": "ex_chord_square",
      "modeId": "trig_chord_length",
      "statementId": "fs_polygonal_horn_chord",
      "title": "Quadrant Inscribed Chord (90°)",
      "values": {
        "dtheta": 90,
        "R": 1
      },
      "displayResult": "1.414 (√2)",
      "formattedFormula": "c = 2 · 1.0 · sin(45°) = √2",
      "domainBadge": "∈ ℝ_ω",
      "notes": "First inward chord step across quadrant boundary."
    },
    {
      "id": "ex_dyadic_sin_45",
      "modeId": "trig_sin_dyadic_eval",
      "statementId": "fs_sin_dyadic_bisection",
      "title": "Day 3 Dyadic Sine (π/4 = 45°)",
      "presetKey": "sin_dyadic_fn",
      "values": {
        "m": 1,
        "n": 3
      },
      "displayResult": "0.7071 (1/√2)",
      "formattedFormula": "sin(2π · 1/2³) = sin(π/4) = 1/√2",
      "domainBadge": "∈ [-1, 1]",
      "notes": "Generated by 3 Conway bisections down the angle tree."
    },
    {
      "id": "ex_rotor_sin_90",
      "modeId": "trig_sin_rotor_eval",
      "statementId": "fs_sin_rotor_projection",
      "title": "Unit Rotor North Pole (90° = π/2)",
      "presetKey": "sin_rotor_fn",
      "values": {
        "theta": 90
      },
      "displayResult": "1.0000 (Top Pole)",
      "formattedFormula": "sin(⟨0, 1⟩) = 1.0",
      "domainBadge": "∈ [-1, 1]",
      "notes": "Rotor lies directly on imaginary axis (U = ⟨0, 1⟩ = i)."
    },
    {
      "id": "ex_earth_free_fall",
      "modeId": "ff_v_from_v0_g_t",
      "statementId": "fs_free_fall_accel",
      "presetKey": "newton_free_fall",
      "title": "Earth Surface Free Fall Apex Transit",
      "values": {
        "v0": 20,
        "g": 9.8,
        "t": 1.5
      },
      "displayResult": "5.300 m/s",
      "formattedFormula": "v = (20.00) - (9.80) · (1.50)",
      "domainBadge": "∈ ℝ_ω",
      "notes": "v > 0 indicates particle is still climbing toward apex."
    },
    {
      "id": "ex_mars_free_fall",
      "modeId": "ff_v_from_v0_g_t",
      "statementId": "fs_free_fall_accel",
      "title": "Mars Rover Descent Stage",
      "values": {
        "v0": 15,
        "g": 3.71,
        "t": 3
      },
      "displayResult": "3.870 m/s",
      "formattedFormula": "v = (15.00) - (3.71) · (3.00)",
      "domainBadge": "∈ ℝ_ω"
    },
    {
      "id": "ex_cart_braking",
      "modeId": "we_ke_from_m_v",
      "statementId": "fs_work_energy",
      "presetKey": "newton_work_energy",
      "title": "Laboratory Cart Kinetic Energy",
      "values": {
        "m": 2,
        "v": 10
      },
      "displayResult": "100.000 J",
      "formattedFormula": "KE = 0.5 · (2.00) · (10.00)²",
      "domainBadge": "∈ ℝ_ω",
      "notes": "Matches exact work integral: W = ∫ F dx = 100 J."
    },
    {
      "id": "ex_thermal_slab",
      "modeId": "diff_heat_step",
      "statementId": "fs_heat_flux",
      "presetKey": "heat_slice_flux",
      "title": "Interior Thermal Slab Conduction",
      "values": {
        "alpha": 0.15,
        "dt": 0.02,
        "dx": 0.1,
        "u_L": 100,
        "u_C": 50,
        "u_R": 20
      },
      "displayResult": "56.000 °C",
      "formattedFormula": "u_new = (50.0) + (0.15)·(0.02 / 0.01)·[(100.0) - 2·(50.0) + (20.0)]",
      "domainBadge": "∈ ℝ_ω",
      "notes": "Positive net curvature (100 - 100 + 20 = 20) drives net warming."
    },
    {
      "id": "ex_medical_test",
      "modeId": "bayes_posterior",
      "statementId": "fs_bayes_updating",
      "presetKey": "cas_bayes_filter",
      "title": "Medical Diagnostic Screen Update",
      "values": {
        "pH": 0.05,
        "pD_H": 0.95,
        "pD_notH": 0.1
      },
      "displayResult": "0.333",
      "formattedFormula": "P(H|D) = (0.95 · 0.05) / [ (0.95 · 0.05) + (0.10 · 0.95) ]",
      "domainBadge": "∈ [0, 1]",
      "notes": "Low prior prevalence dampens positive predictive value."
    }
  ]
};
