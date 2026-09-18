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
  "generatedAt": "2026-09-18T09:17:04.304Z",
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
        "stemHeatDiffusion"
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
        "editedQuantumLogicLecture2V1",
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
      "id": "ftc_sum_eval",
      "statementId": "fs_telescoping_ftc",
      "label": "(F₀, F_n) → ΔF_net",
      "targetSymbol": "ΔF_net",
      "targetDomain": "ℝ_ω",
      "formulaDescription": "∑ ΔF(k) = F(n) - F(0)",
      "formulaExpr": "F_n - F_0",
      "hasSimulation": true,
      "inputs": [
        {
          "name": "F_0",
          "symbol": "F(0)",
          "domain": "ℝ_ω",
          "defaultValue": 3,
          "min": -100,
          "max": 100,
          "step": 1,
          "description": "Starting boundary value"
        },
        {
          "name": "F_n",
          "symbol": "F(n)",
          "domain": "ℝ_ω",
          "defaultValue": 28,
          "min": -100,
          "max": 200,
          "step": 1,
          "description": "Ending boundary value"
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
    }
  ],
  "examples": [
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
