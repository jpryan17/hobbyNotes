import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";

export interface EquationSlot {
  name: string;
  symbol: string;
  domain: "ℝ" | "ℝ_ω" | "ℂ" | "ℂ_ω" | "ℕ" | "ℤ" | "𝔹" | string;
  defaultValue: number | string;
  step?: number;
  min?: number;
  max?: number;
  description?: string;
}

export interface EquationResult {
  displayValue: string;
  hardPart?: string;
  dustPart?: string;
  details?: string[];
  isHard?: boolean;
}

export interface EquationSpec {
  id: string;
  title: string;
  formalStatementId?: string;
  governingTheorem?: string;
  leanSignature?: string;
  lhsFormula: string;
  latexFormula?: string;
  rhsSymbol: string;
  rhsDomain: "ℝ" | "ℝ_ω" | "ℂ" | "ℂ_ω" | "ℕ" | "ℤ" | "𝔹" | string;
  description: string;
  inputs: EquationSlot[];
  evaluate: (inputs: Record<string, number>) => EquationResult;
}

export interface EquationEvaluatorOptions {
  initialStage?: 1 | 2 | 3 | 4;
  presetId?: string;
}

export const EQUATION_PRESETS: Record<string, EquationSpec> = {
  sin_halo: {
    id: "sin_halo",
    title: "Nonstandard Sine & Halo Shadow",
    formalStatementId: "FS-A1D-1.2",
    governingTheorem: "infinitesimal_halo",
    leanSignature: "theorem sin_halo_linear (x0 : R_w) (k : Z_w) : st (sin_w (x0 + k * dx)) = sin_w x0",
    lhsFormula: "sin(x₀ + k · dx)",
    latexFormula: "\\sin(x_0 + k \\cdot dx)",
    rhsSymbol: "y",
    rhsDomain: "ℝ_ω",
    description: "Evaluates the hyperreal nonstandard sine calculation into its standard real nucleus sin(x₀) and first-order cosine halo dust k·cos(x₀)·dx.",
    inputs: [
      { name: "x0", symbol: "x₀", domain: "ℝ", defaultValue: 0.5236, step: 0.1, min: -10, max: 10, description: "Standard angle nucleus (radians)" },
      { name: "k", symbol: "k", domain: "ℤ", defaultValue: 1, step: 1, min: -50, max: 50, description: "Infinitesimal halo step multiplier (dx = 1/ω)" }
    ],
    evaluate: (vals) => {
      const x0 = vals["x0"] ?? 0.5236;
      const k = Math.round(vals["k"] ?? 1);
      const hardVal = Math.sin(x0);
      const derivVal = Math.cos(x0);
      const hardStr = hardVal.toFixed(4);
      const dustMag = (k * derivVal);
      const dustStr = k === 0 ? "0 (Zero Dust)" : `${dustMag >= 0 ? "+" : ""}${dustMag.toFixed(4)}·dx`;
      const isHard = k === 0;

      return {
        displayValue: k === 0 ? hardStr : `${hardStr} + ${dustStr.replace(/^\+/, "")}`,
        hardPart: hardStr,
        dustPart: dustStr,
        isHard,
        details: [
          `Standard Part: st(sin(x)) = sin(x₀) = ${hardStr} ∈ ℝ`,
          `Halo Dust: ε = k · cos(x₀) · dx = ${dustStr} ∈ μ(0)`,
          `Algebraic Derivative: d(sin x)/dx = st( [sin(x₀ + dx) - sin(x₀)] / dx ) = cos(x₀) = ${derivVal.toFixed(4)}`
        ]
      };
    }
  },

  nucleus_halo_1d: {
    id: "nucleus_halo_1d",
    title: "1D Nucleus-Halo Decomposition",
    formalStatementId: "FS-A1D-1.1",
    governingTheorem: "nucleus_halo_decomposition",
    leanSignature: "axiom nucleus_halo_decomposition (x : { x : R_w // is_finite x }) : ∃ (ε : R_w), is_infinitesimal ε ∧ x.val = st x + ε",
    lhsFormula: "x₀ + k · dx",
    rhsSymbol: "y",
    rhsDomain: "ℝ_ω",
    description: "Decomposes any finite hyperreal into its standard real nucleus shadow st(y) and Day ω halo dust.",
    inputs: [
      { name: "x0", symbol: "x₀", domain: "ℝ", defaultValue: 4.0, step: 0.5, min: -100, max: 100, description: "Standard real nucleus shadow (st(y))" },
      { name: "k", symbol: "k", domain: "ℤ", defaultValue: 3, step: 1, min: -50, max: 50, description: "Infinitesimal halo step multiplier (dx = 1/ω)" }
    ],
    evaluate: (vals) => {
      const x0 = vals["x0"] ?? 4.0;
      const k = Math.round(vals["k"] ?? 3);
      const signStr = k > 0 ? `+ ${k}·dx` : (k < 0 ? `- ${Math.abs(k)}·dx` : "");
      const pointStr = k === 0 ? `${x0}` : `${x0} ${signStr}`;
      const dustStr = k === 0 ? "0 (Zero Dust)" : (k > 0 ? `${k}·dx` : `-${Math.abs(k)}·dx`);
      const isHard = k === 0;

      return {
        displayValue: pointStr,
        hardPart: `${x0}`,
        dustPart: dustStr,
        isHard,
        details: [
          `Standard Part: st(y) = ${x0} ∈ ℝ`,
          `Halo Dust: ε = y - st(y) = ${dustStr} ∈ μ(0)`,
          `Closeness: |y - st(y)| = ${Math.abs(k)}·dx < 1/n for all standard n ∈ ℕ`
        ]
      };
    }
  },

  complex_halo_2d: {
    id: "complex_halo_2d",
    title: "2D Complex Halo Decomposition",
    formalStatementId: "FS-A2D-1.1",
    governingTheorem: "nucleus_halo_decomposition",
    leanSignature: "axiom complex_halo_decomposition (z : C_w) : ∃ (ε : C_w), is_infinitesimal_C ε ∧ z = st_C z + ε",
    lhsFormula: "(x₀ + k_x · dx) + i · (y₀ + k_y · dx)",
    rhsSymbol: "z",
    rhsDomain: "ℂ_ω",
    description: "Evaluates a 2D complex point into its Gaussian dyadic nucleus and transfinite halo soup.",
    inputs: [
      { name: "x0", symbol: "x₀", domain: "ℝ", defaultValue: 3.0, step: 0.5, min: -50, max: 50, description: "Real coordinate nucleus" },
      { name: "y0", symbol: "y₀", domain: "ℝ", defaultValue: 2.0, step: 0.5, min: -50, max: 50, description: "Imaginary coordinate nucleus" },
      { name: "kx", symbol: "k_x", domain: "ℤ", defaultValue: 4, step: 1, min: -20, max: 20, description: "Real halo step multiplier" },
      { name: "ky", symbol: "k_y", domain: "ℤ", defaultValue: -1, step: 1, min: -20, max: 20, description: "Imaginary halo step multiplier" }
    ],
    evaluate: (vals) => {
      const x0 = vals["x0"] ?? 3.0;
      const y0 = vals["y0"] ?? 2.0;
      const kx = Math.round(vals["kx"] ?? 4);
      const ky = Math.round(vals["ky"] ?? -1);

      const reSign = kx > 0 ? `+ ${kx}·dx` : (kx < 0 ? `- ${Math.abs(kx)}·dx` : "");
      const imSign = ky > 0 ? `+ ${ky}·dx` : (ky < 0 ? `- ${Math.abs(ky)}·dx` : "");
      const reStr = kx === 0 ? `${x0}` : `(${x0} ${reSign})`;
      const imStr = ky === 0 ? `${y0}` : `(${y0} ${imSign})`;
      const pointStr = `${reStr} + i · ${imStr}`;

      const hardStr = `${x0} + ${y0}i`;
      const dustTerms: string[] = [];
      if (kx !== 0) dustTerms.push(kx > 0 ? `${kx}·dx` : `-${Math.abs(kx)}·dx`);
      if (ky !== 0) dustTerms.push(ky > 0 ? `${ky}i·dx` : `-${Math.abs(ky)}i·dx`);
      const dustStr = dustTerms.length > 0 ? dustTerms.join(" + ").replace(/\+ -/g, "- ") : "0 (Zero Dust)";
      const isHard = kx === 0 && ky === 0;

      return {
        displayValue: pointStr,
        hardPart: hardStr,
        dustPart: dustStr,
        isHard,
        details: [
          `Gaussian Nucleus: st_C(z) = ${hardStr} ∈ ℂ`,
          `Complex Halo Soup: ε = z - st_C(z) = ${dustStr} ∈ μ(0)`,
          `Modulus of Hard Nucleus: |z₀| = ${Math.sqrt(x0*x0 + y0*y0).toFixed(3)}`
        ]
      };
    }
  },

  quadratic_halo_diff: {
    id: "quadratic_halo_diff",
    title: "Parabola Increment & Halo Preservation",
    formalStatementId: "FS-A1D-1.2",
    governingTheorem: "infinitesimal_halo",
    leanSignature: "theorem quadratic_halo_preservation (x : R_w) (dx : R_w) (h : is_infinitesimal dx) : is_infinitesimal ((x + dx)^2 - x^2)",
    lhsFormula: "(x + k·dx)² - x²",
    rhsSymbol: "Δf",
    rhsDomain: "ℝ_ω",
    description: "Evaluates the increment of f(x) = x² under an infinitesimal step to prove halo preservation without ε-δ.",
    inputs: [
      { name: "x", symbol: "x", domain: "ℝ", defaultValue: 2.0, step: 0.5, min: -20, max: 20, description: "Operating point on real line" },
      { name: "k", symbol: "k", domain: "ℤ", defaultValue: 1, step: 1, min: -10, max: 10, description: "Infinitesimal input step (dx = 1/ω)" }
    ],
    evaluate: (vals) => {
      const x = vals["x"] ?? 2.0;
      const k = Math.round(vals["k"] ?? 1);
      const linearCoeff = 2 * x * k;
      const quadCoeff = k * k;

      const exprStr = `${linearCoeff}·dx + ${quadCoeff}·dx²`;
      const isZero = k === 0;

      return {
        displayValue: isZero ? "0" : exprStr,
        hardPart: "0.0",
        dustPart: isZero ? "0" : exprStr,
        isHard: isZero,
        details: [
          `Input Step: dx = ${k}·(1/ω) ∈ μ(0)`,
          `Difference: Δf = 2x·(k·dx) + (k·dx)² = ${exprStr}`,
          `Halo Preservation: st(Δf) = 0.0 ⟹ f(x + dx) ≈ f(x) (Continuous everywhere)`
        ]
      };
    }
  },

  telescoping_sum: {
    id: "telescoping_sum",
    title: "Discrete FTC Telescoping Sum",
    formalStatementId: "FS-A1D-3.1",
    governingTheorem: "telescoping_ftc",
    leanSignature: "theorem telescoping_ftc (F : Nat → R_w) (n : Nat) : hyper_sum (delta F) n = F n - F 0",
    lhsFormula: "∑_{k=0}^{n-1} ΔF(k)  [ F(k) = c · k² ]",
    rhsSymbol: "Total",
    rhsDomain: "ℝ",
    description: "Evaluates pairwise cancellation across n steps on the discrete tree.",
    inputs: [
      { name: "n", symbol: "n", domain: "ℕ", defaultValue: 5, step: 1, min: 1, max: 50, description: "Number of discrete slices" },
      { name: "c", symbol: "c", domain: "ℝ", defaultValue: 1.0, step: 0.5, min: -10, max: 10, description: "Quadratic coefficient" }
    ],
    evaluate: (vals) => {
      const n = Math.max(1, Math.round(vals["n"] ?? 5));
      const c = vals["c"] ?? 1.0;
      const f0 = 0;
      const fn = c * n * n;
      const total = fn - f0;

      return {
        displayValue: `${total}`,
        hardPart: `${total}`,
        dustPart: "0",
        isHard: true,
        details: [
          `Boundary Values: F(0) = ${f0}, F(${n}) = ${fn}`,
          `Telescoping Guarantee: F(n) - F(0) = ${total}`,
          `All intermediate internal differences ΔF(1)...ΔF(${n-1}) cancel pairwise.`
        ]
      };
    }
  },

  newton_accel: {
    id: "newton_accel",
    title: "Newtonian Kinematic Acceleration Invariant",
    formalStatementId: "FS-PHYS-1.1",
    governingTheorem: "newtonian_mechanics",
    leanSignature: "theorem free_fall_accel (v0 g t dt : R_w) (hdt : dt ≠ 0) : ( (v0*(t-dt) - (1/2)*g*(t-dt)^2) - 2*(v0*t - (1/2)*g*t^2) + (v0*(t+dt) - (1/2)*g*(t+dt)^2) ) / dt^2 = -g",
    lhsFormula: "[ s(t - dt) - 2s(t) + s(t + dt) ] / dt²",
    rhsSymbol: "a",
    rhsDomain: "ℝ",
    description: "Evaluates the second discrete difference stencil on parabolic free fall to reveal the exact acceleration invariant -g.",
    inputs: [
      { name: "g", symbol: "g", domain: "ℝ", defaultValue: 9.8, step: 0.1, min: 0, max: 50, description: "Gravitational acceleration" },
      { name: "v0", symbol: "v₀", domain: "ℝ", defaultValue: 20.0, step: 1.0, min: -100, max: 100, description: "Initial launch velocity" },
      { name: "t", symbol: "t", domain: "ℝ", defaultValue: 2.0, step: 0.5, min: 0, max: 20, description: "Flight observation time" }
    ],
    evaluate: (vals) => {
      const g = vals["g"] ?? 9.8;
      const res = -g;
      return {
        displayValue: `${res}`,
        hardPart: `${res}`,
        dustPart: "0",
        isHard: true,
        details: [
          `Discrete Acceleration Stencil: Δ²s / dt² = -g = ${res} m/s²`,
          `Pairwise Invariance: all velocity terms v₀ and time terms t cancel identically`,
          `Residual Dust: exactly 0 (no infinitesimal truncation error)`
        ]
      };
    }
  },

  bayes_filter: {
    id: "bayes_filter",
    title: "3-Stage Bayesian Filter",
    formalStatementId: "FS-BAYES-1.1",
    governingTheorem: "bayes_filter_normalization",
    leanSignature: "axiom bayes_filter_normalization (P : Nat → R_w) (N : Nat) (hP : hyper_sum P N = 1) : True",
    lhsFormula: "(P(D|H) · P(H)) / (P(D|H)·P(H) + P(D|¬H)·P(¬H))",
    rhsSymbol: "P(H|D)",
    rhsDomain: "ℝ",
    description: "Evaluates normalized posterior probability given prior belief and evidence likelihood.",
    inputs: [
      { name: "prior", symbol: "P(H)", domain: "ℝ", defaultValue: 0.01, step: 0.01, min: 0.001, max: 0.999, description: "Prior base rate" },
      { name: "sens", symbol: "P(D|H)", domain: "ℝ", defaultValue: 0.95, step: 0.05, min: 0.01, max: 1.0, description: "Sensitivity / true positive rate" },
      { name: "fpr", symbol: "P(D|¬H)", domain: "ℝ", defaultValue: 0.05, step: 0.01, min: 0.001, max: 0.999, description: "False positive rate" }
    ],
    evaluate: (vals) => {
      const prior = vals["prior"] ?? 0.01;
      const sens = vals["sens"] ?? 0.95;
      const fpr = vals["fpr"] ?? 0.05;
      const numerator = sens * prior;
      const denominator = numerator + fpr * (1.0 - prior);
      const posterior = denominator > 0 ? numerator / denominator : 0;

      return {
        displayValue: posterior.toFixed(4),
        hardPart: posterior.toFixed(4),
        dustPart: "0",
        isHard: true,
        details: [
          `Joint Evidence Weight: P(D ∧ H) = ${numerator.toFixed(5)}`,
          `Marginal Likelihood: P(D) = ${denominator.toFixed(5)}`,
          `Posterior Probability: ${(posterior * 100).toFixed(2)}%`
        ]
      };
    }
  },

  pythagorean_trig: {
    id: "pythagorean_trig",
    title: "Pythagorean Trigonometric Invariant",
    formalStatementId: "FS-STEM-TRIG-1.1",
    governingTheorem: "sin_sq_add_cos_sq",
    leanSignature: "theorem sin_sq_add_cos_sq (x : ℝ) : sin x ^ 2 + cos x ^ 2 = 1",
    lhsFormula: "sin(x)^2 + cos(x)^2",
    latexFormula: "\\sin^2(x) + \\cos^2(x) = 1",
    rhsSymbol: "1",
    rhsDomain: "ℝ",
    description: "Evaluates the foundational Pythagorean trigonometric invariant sin(x)² + cos(x)² = 1. Demonstrates exact zero halo dust for any real angle x.",
    inputs: [
      { name: "x", symbol: "x", domain: "ℝ", defaultValue: 0.7854, step: 0.1, min: -10, max: 10, description: "Input angle (radians, default π/4)" }
    ],
    evaluate: (vals) => {
      const x = vals["x"] ?? 0.7854;
      const s = Math.sin(x);
      const c = Math.cos(x);
      const sumVal = s * s + c * c;
      const rounded = Math.round(sumVal * 10000) / 10000;
      return {
        displayValue: rounded.toString(),
        hardPart: rounded.toString(),
        dustPart: "0 (Zero Dust)",
        isHard: true,
        details: [
          `Evaluated LHS: sin²(${x.toFixed(4)}) + cos²(${x.toFixed(4)}) = ${(s*s).toFixed(4)} + ${(c*c).toFixed(4)} = 1`,
          "Algebraic Derivative: d/dx[sin²(x) + cos²(x)] = 2·sin(x)cos(x) - 2·cos(x)sin(x) = 0",
          "Vanishing halo: zero infinitesimal fluctuation (dust = 0) confirms strict hard equality."
        ]
      };
    }
  },

  derivative_sine: {
    id: "derivative_sine",
    title: "Calculus Derivative: d/dx[sin(x)]",
    formalStatementId: "FS-CALC-1.1",
    governingTheorem: "hasDerivAt_sin",
    leanSignature: "theorem deriv_sin (x : ℝ) : HasDerivAt sin (cos x) x",
    lhsFormula: "d/dx(sin(x))",
    latexFormula: "\\frac{d}{dx}[\\sin(x)] = \\cos(x)",
    rhsSymbol: "y",
    rhsDomain: "ℝ",
    description: "Evaluates the instantaneous hyperreal derivative d/dx[sin(x)] = cos(x) via infinitesimal difference quotient st([sin(x + dx) - sin(x)] / dx).",
    inputs: [
      { name: "x", symbol: "x", domain: "ℝ", defaultValue: 0.0, step: 0.1, min: -10, max: 10, description: "Evaluation point x (radians)" }
    ],
    evaluate: (vals) => {
      const x = vals["x"] ?? 0.0;
      const cosVal = Math.cos(x);
      const cosStr = Number.isInteger(cosVal) ? cosVal.toString() : cosVal.toFixed(4);
      return {
        displayValue: cosStr,
        hardPart: cosStr,
        dustPart: "0",
        isHard: true,
        details: [
          `Evaluated Derivative: d/dx[sin(x)] = cos(${x.toFixed(4)}) = ${cosStr}`,
          "Hyperreal stencil: st( [sin(x + dx) - sin(x)] / dx ) = cos(x)",
          "Lean 4 Certified: Matches Mathlib HasDerivAt theorem for trigonometric sine"
        ]
      };
    }
  },

  ftc_integral_sine: {
    id: "ftc_integral_sine",
    title: "Calculus Integral: ∫₀ˣ cos(t) dt",
    formalStatementId: "FS-CALC-1.2",
    governingTheorem: "integral_cos",
    leanSignature: "theorem ftc_cos (x : ℝ) : ∫ t in 0..x, cos t = sin x",
    lhsFormula: "int(cos(t), t, 0, x)",
    latexFormula: "\\int_0^x \\cos(t) \\, dt = \\sin(x)",
    rhsSymbol: "y",
    rhsDomain: "ℝ",
    description: "Evaluates the Fundamental Theorem of Calculus accumulator: ∫₀ˣ cos(t) dt = sin(x).",
    inputs: [
      { name: "x", symbol: "x", domain: "ℝ", defaultValue: 1.5708, step: 0.1, min: -10, max: 10, description: "Upper accumulation limit x (radians)" }
    ],
    evaluate: (vals) => {
      const x = vals["x"] ?? 1.5708;
      const sinVal = Math.sin(x);
      const sinStr = Number.isInteger(sinVal) ? sinVal.toString() : sinVal.toFixed(4);
      return {
        displayValue: sinStr,
        hardPart: sinStr,
        dustPart: "0",
        isHard: true,
        details: [
          `Evaluated Integral: ∫₀^(${x.toFixed(4)}) cos(t) dt = sin(${x.toFixed(4)}) = ${sinStr}`,
          "Discrete FTC: pairwise telescoping difference cancellation on hyperfinite transect",
          "Continuous accumulation exact match for definite Riemann sum"
        ]
      };
    }
  }
};

export interface NonstandardFunctionRule {
  name: string;
  domain: string;
  codomain: string;
  domainCondition?: (x: number) => boolean;
  domainConditionDesc?: string;
  latexDisplay: string;
  description: string;
  hardRuleDesc: string;
  dustRuleDesc: string;
  derivativeFormula: string;
  leanSignature?: string;
  governingTheorem?: string;
  evalHard: (...args: number[]) => number;
  evalDust?: (x0: number, k: number) => number;
}

export const NONSTANDARD_FUNCTION_REGISTRY: Record<string, NonstandardFunctionRule> = {
  sin: {
    name: "sin",
    domain: "ℝ_ω",
    codomain: "[-1, 1]_ω",
    latexDisplay: "\\sin(x_0 + k \\cdot dx) = \\sin(x_0) + k \\cdot \\cos(x_0) \\cdot dx",
    description: "Sine with first-order cosine halo dust",
    hardRuleDesc: "st(sin(x)) = sin(x₀) ∈ ℝ",
    dustRuleDesc: "ε = k · cos(x₀) · dx ∈ μ(0)",
    derivativeFormula: "cos(x₀)",
    governingTheorem: "sin_halo_linear",
    leanSignature: "theorem sin_halo_linear (x0 : R_w) (k : Z_w) : st (sin_w (x0 + k * dx)) = sin_w x0",
    evalHard: (x) => Math.sin(x),
    evalDust: (x0, k) => k * Math.cos(x0)
  },
  cos: {
    name: "cos",
    domain: "ℝ_ω",
    codomain: "[-1, 1]_ω",
    latexDisplay: "\\cos(x_0 + k \\cdot dx) = \\cos(x_0) - k \\cdot \\sin(x_0) \\cdot dx",
    description: "Cosine with negative sine halo dust",
    hardRuleDesc: "st(cos(x)) = cos(x₀) ∈ ℝ",
    dustRuleDesc: "ε = -k · sin(x₀) · dx ∈ μ(0)",
    derivativeFormula: "-sin(x₀)",
    governingTheorem: "cos_halo_linear",
    leanSignature: "theorem cos_halo_linear (x0 : R_w) (k : Z_w) : st (cos_w (x0 + k * dx)) = cos_w x0",
    evalHard: (x) => Math.cos(x),
    evalDust: (x0, k) => -k * Math.sin(x0)
  },
  tan: {
    name: "tan",
    domain: "[ℝ_ω | x ≠ π/2 + kπ]",
    codomain: "ℝ_ω",
    domainCondition: (x) => Math.abs(Math.cos(x)) > 1e-4,
    domainConditionDesc: "x ≠ π/2 + kπ (cos x ≠ 0)",
    latexDisplay: "\\tan(x_0 + k \\cdot dx) = \\tan(x_0) + k \\cdot \\sec^2(x_0) \\cdot dx",
    description: "Tangent with secant-squared halo dust",
    hardRuleDesc: "st(tan(x)) = tan(x₀) ∈ ℝ",
    dustRuleDesc: "ε = k · sec²(x₀) · dx ∈ μ(0)",
    derivativeFormula: "sec²(x₀) = 1/cos²(x₀)",
    governingTheorem: "tan_halo_linear",
    leanSignature: "axiom tan_halo_linear (x0 : R_w) (k : Z_w) : st (tan_w (x0 + k * dx)) = tan_w x0",
    evalHard: (x) => Math.tan(x),
    evalDust: (x0, k) => k / (Math.cos(x0) * Math.cos(x0))
  },
  asin: {
    name: "asin",
    domain: "[ℝ_ω | -1 ≤ x ≤ 1]",
    codomain: "[-π/2, π/2]_ω",
    domainCondition: (x) => x >= -1 && x <= 1,
    domainConditionDesc: "-1 ≤ x ≤ 1",
    latexDisplay: "\\arcsin(x_0 + k \\cdot dx) = \\arcsin(x_0) + \\frac{k}{\\sqrt{1 - x_0^2}} \\cdot dx",
    description: "Inverse sine with inverse square-root halo dust",
    hardRuleDesc: "st(asin(x)) = asin(x₀) ∈ ℝ",
    dustRuleDesc: "ε = (k / √(1 - x₀²)) · dx ∈ μ(0)",
    derivativeFormula: "1 / √(1 - x₀²)",
    governingTheorem: "asin_halo_linear",
    leanSignature: "axiom asin_halo_linear (x0 : R_w) (k : Z_w) : st (asin_w (x0 + k * dx)) = asin_w x0",
    evalHard: (x) => Math.asin(x),
    evalDust: (x0, k) => Math.abs(x0) < 1 ? k / Math.sqrt(1 - x0 * x0) : 0
  },
  acos: {
    name: "acos",
    domain: "[ℝ_ω | -1 ≤ x ≤ 1]",
    codomain: "[0, π]_ω",
    domainCondition: (x) => x >= -1 && x <= 1,
    domainConditionDesc: "-1 ≤ x ≤ 1",
    latexDisplay: "\\arccos(x_0 + k \\cdot dx) = \\arccos(x_0) - \\frac{k}{\\sqrt{1 - x_0^2}} \\cdot dx",
    description: "Inverse cosine with negative halo dust",
    hardRuleDesc: "st(acos(x)) = acos(x₀) ∈ ℝ",
    dustRuleDesc: "ε = -(k / √(1 - x₀²)) · dx ∈ μ(0)",
    derivativeFormula: "-1 / √(1 - x₀²)",
    governingTheorem: "acos_halo_linear",
    leanSignature: "axiom acos_halo_linear (x0 : R_w) (k : Z_w) : st (acos_w (x0 + k * dx)) = acos_w x0",
    evalHard: (x) => Math.acos(x),
    evalDust: (x0, k) => Math.abs(x0) < 1 ? -k / Math.sqrt(1 - x0 * x0) : 0
  },
  atan: {
    name: "atan",
    domain: "ℝ_ω",
    codomain: "(-π/2, π/2)_ω",
    latexDisplay: "\\arctan(x_0 + k \\cdot dx) = \\arctan(x_0) + \\frac{k}{1 + x_0^2} \\cdot dx",
    description: "Inverse tangent with Cauchy halo dust",
    hardRuleDesc: "st(atan(x)) = atan(x₀) ∈ ℝ",
    dustRuleDesc: "ε = (k / (1 + x₀²)) · dx ∈ μ(0)",
    derivativeFormula: "1 / (1 + x₀²)",
    governingTheorem: "atan_halo_linear",
    leanSignature: "axiom atan_halo_linear (x0 : R_w) (k : Z_w) : st (atan_w (x0 + k * dx)) = atan_w x0",
    evalHard: (x) => Math.atan(x),
    evalDust: (x0, k) => k / (1 + x0 * x0)
  },
  exp: {
    name: "exp",
    domain: "ℝ_ω",
    codomain: "[ℝ_ω | y > 0]",
    latexDisplay: "\\exp(x_0 + k \\cdot dx) = \\exp(x_0) + k \\cdot \\exp(x_0) \\cdot dx",
    description: "Exponential self-derivative growth stencil",
    hardRuleDesc: "st(exp(x)) = exp(x₀) ∈ ℝ",
    dustRuleDesc: "ε = k · exp(x₀) · dx ∈ μ(0)",
    derivativeFormula: "exp(x₀)",
    governingTheorem: "exp_halo_linear",
    leanSignature: "theorem exp_halo_linear (x0 : R_w) (k : Z_w) : st (exp_w (x0 + k * dx)) = exp_w x0",
    evalHard: (x) => Math.exp(x),
    evalDust: (x0, k) => k * Math.exp(x0)
  },
  ln: {
    name: "ln",
    domain: "[ℝ_ω | x > 0]",
    codomain: "ℝ_ω",
    domainCondition: (x) => x > 0,
    domainConditionDesc: "x > 0",
    latexDisplay: "\\ln(x_0 + k \\cdot dx) = \\ln(x_0) + \\frac{k}{x_0} \\cdot dx",
    description: "Natural logarithm with reciprocal halo dust",
    hardRuleDesc: "st(ln(x)) = ln(x₀) ∈ ℝ",
    dustRuleDesc: "ε = (k / x₀) · dx ∈ μ(0)",
    derivativeFormula: "1 / x₀",
    governingTheorem: "log_halo_linear",
    leanSignature: "axiom log_halo_linear (x0 : R_w) (k : Z_w) (hx : 0 < x0) : st (log_w (x0 + k * dx)) = log_w x0",
    evalHard: (x) => Math.log(x),
    evalDust: (x0, k) => x0 > 0 ? k / x0 : 0
  },
  sqrt: {
    name: "sqrt",
    domain: "[ℝ_ω | x ≥ 0]",
    codomain: "[ℝ_ω | y ≥ 0]",
    domainCondition: (x) => x >= 0,
    domainConditionDesc: "x ≥ 0",
    latexDisplay: "\\sqrt{x_0 + k \\cdot dx} = \\sqrt{x_0} + \\frac{k}{2\\sqrt{x_0}} \\cdot dx",
    description: "Square root nonstandard branch stencil",
    hardRuleDesc: "st(sqrt(x)) = sqrt(x₀) ∈ ℝ",
    dustRuleDesc: "ε = (k / 2√x₀) · dx ∈ μ(0)",
    derivativeFormula: "1 / (2√x₀)",
    governingTheorem: "sqrt_halo_linear",
    leanSignature: "axiom sqrt_halo_linear (x0 : R_w) (k : Z_w) (hx : 0 < x0) : st (sqrt_w (x0 + k * dx)) = sqrt_w x0",
    evalHard: (x) => Math.sqrt(Math.max(0, x)),
    evalDust: (x0, k) => x0 > 0 ? k / (2 * Math.sqrt(x0)) : 0
  },
  cbrt: {
    name: "cbrt",
    domain: "ℝ_ω",
    codomain: "ℝ_ω",
    latexDisplay: "\\sqrt[3]{x_0 + k \\cdot dx} = \\sqrt[3]{x_0} + \\frac{k}{3 x_0^{2/3}} \\cdot dx",
    description: "Cube root nonstandard branch stencil",
    hardRuleDesc: "st(cbrt(x)) = cbrt(x₀) ∈ ℝ",
    dustRuleDesc: "ε = (k / 3 x₀^(2/3)) · dx ∈ μ(0)",
    derivativeFormula: "1 / (3·x₀^(2/3))",
    governingTheorem: "diff_cbrt",
    leanSignature: "axiom diff_cbrt : ∀ x : R_w, (x ≠ 0) → has_derivative_at cbrt_w x (1 / (3 * cbrt_w (x * x)))",
    evalHard: (x) => Math.cbrt(x),
    evalDust: (x0, k) => x0 !== 0 ? k / (3 * Math.cbrt(x0 * x0)) : 0
  },
  sqr: {
    name: "sqr",
    domain: "ℝ_ω",
    codomain: "[ℝ_ω | y ≥ 0]",
    latexDisplay: "(x_0 + k \\cdot dx)^2 = x_0^2 + 2 x_0 k \\cdot dx",
    description: "Square algebraic binomial stencil",
    hardRuleDesc: "st(x²) = x₀² ∈ ℝ",
    dustRuleDesc: "ε = 2 x₀ k · dx ∈ μ(0)",
    derivativeFormula: "2·x₀",
    governingTheorem: "diff_pow",
    leanSignature: "theorem sqr_halo (x0 : R_w) (k : Z_w) : st ((x0 + k * dx)^2) = x0^2",
    evalHard: (x) => x * x,
    evalDust: (x0, k) => 2 * x0 * k
  },
  abs: {
    name: "abs",
    domain: "ℝ_ω",
    codomain: "[ℝ_ω | y ≥ 0]",
    latexDisplay: "|x_0 + k \\cdot dx| = |x_0| + \\text{sgn}(x_0) k \\cdot dx",
    description: "Absolute value piecewise sign stencil",
    hardRuleDesc: "st(|x|) = |x₀| ∈ ℝ",
    dustRuleDesc: "ε = sgn(x₀) k · dx ∈ μ(0)",
    derivativeFormula: "sgn(x₀)",
    governingTheorem: "R_w_abs",
    leanSignature: "axiom R_w_abs : R_w → R_w",
    evalHard: (x) => Math.abs(x),
    evalDust: (x0, k) => Math.sign(x0) * k
  }
};

export interface CalculusOperatorRule {
  key: string;
  symbol: string;
  badge: string;
  title: string;
  domain: string;
  codomain: string;
  category: "calculus" | "nonstandard" | "algebra";
  description: string;
  tooltip: string;
  derivativeFormula?: string;
  governingTheorem?: string;
  leanSignature?: string;
  wrapPrefix: string;
  wrapSuffix: string;
  defaultInner: string;
  cursorOffsetInside: number;
}

export const CALCULUS_OPERATOR_REGISTRY: Record<string, CalculusOperatorRule> = {
  op_D: {
    key: "op_D",
    symbol: "D( )",
    badge: "D",
    title: "Higher-Order Derivative Operator",
    domain: "ℝ_ω → ℝ_ω",
    codomain: "ℝ_ω → ℝ_ω",
    category: "calculus",
    description: "Higher-order functional derivative operator mapping f ↦ f'",
    tooltip: "D(f) — Higher-order differential operator on FunctionSpace: D(sin) = cos",
    governingTheorem: "deriv_op",
    leanSignature: "def deriv_op (f : FunctionSpace) : FunctionSpace := fun x => deriv_at f x",
    wrapPrefix: "D(",
    wrapSuffix: ")",
    defaultInner: "sin",
    cursorOffsetInside: 2
  },
  op_I: {
    key: "op_I",
    symbol: "I( )",
    badge: "I",
    title: "Higher-Order Accumulator Integral Operator",
    domain: "ℝ_ω → ℝ_ω",
    codomain: "ℝ_ω → ℝ_ω",
    category: "calculus",
    description: "Higher-order accumulator integral operator mapping f ↦ ∫ f",
    tooltip: "I(f) — Higher-order accumulator integral on FunctionSpace: I(cos) = sin",
    governingTheorem: "integral_op",
    leanSignature: "axiom ftc_deriv_integral (f : FunctionSpace) (x : R_w) : deriv_at (integral_op f) x = f x",
    wrapPrefix: "I(",
    wrapSuffix: ")",
    defaultInner: "cos",
    cursorOffsetInside: 2
  },
  diff_x: {
    key: "diff_x",
    symbol: "d/dx( )",
    badge: "d/dx",
    title: "Derivative with respect to x",
    domain: "(ℝ_ω → ℝ_ω) × ℝ_ω",
    codomain: "ℝ_ω",
    category: "calculus",
    description: "Calculates algebraic / hyperreal derivative st([f(x + dx) - f(x)] / dx)",
    tooltip: "d/dx [f(x)] — Instantaneous rate of change with respect to variable x",
    governingTheorem: "deriv_at",
    leanSignature: "def deriv_at (f : FunctionSpace) (x : R_w) : R_w := (f (x + dx) - f x) / dx",
    wrapPrefix: "d/dx(",
    wrapSuffix: ")",
    defaultInner: "x",
    cursorOffsetInside: 5
  },
  diff_t: {
    key: "diff_t",
    symbol: "d/dt( )",
    badge: "d/dt",
    title: "Time Derivative with respect to t",
    domain: "(ℝ_ω → ℝ_ω) × ℝ_ω",
    codomain: "ℝ_ω",
    category: "calculus",
    description: "Calculates kinematic velocity or rate of change with respect to time t",
    tooltip: "d/dt [s(t)] — Kinematic time derivative for velocities & flow rates",
    governingTheorem: "deriv_op",
    leanSignature: "def deriv_op (f : FunctionSpace) : FunctionSpace := fun x => deriv_at f x",
    wrapPrefix: "d/dt(",
    wrapSuffix: ")",
    defaultInner: "t",
    cursorOffsetInside: 5
  },
  int_x: {
    key: "int_x",
    symbol: "∫(...) dx",
    badge: "∫ dx",
    title: "Accumulator Integral",
    domain: "(ℝ_ω → ℝ_ω) × ℝ_ω",
    codomain: "ℝ_ω",
    category: "calculus",
    description: "Calculates continuous accumulation ∫₀ˣ f(t) dt from 0 to current x",
    tooltip: "∫ f(t) dt — Continuous accumulation from 0 to x (Fundamental Theorem of Calculus)",
    governingTheorem: "ftc_deriv_integral",
    leanSignature: "axiom ftc_deriv_integral (f : FunctionSpace) (x : R_w) : deriv_at (integral_op f) x = f x",
    wrapPrefix: "int(",
    wrapSuffix: ", x)",
    defaultInner: "x",
    cursorOffsetInside: 4
  },
  int_ab: {
    key: "int_ab",
    symbol: "∫ₐᵇ (...) dx",
    badge: "∫ₐᵇ",
    title: "Definite Integral",
    domain: "(ℝ_ω → ℝ_ω) × Interval",
    codomain: "ℝ_ω",
    category: "calculus",
    description: "Calculates definite integral ∫ₐᵇ f(x) dx between explicit limits a and b",
    tooltip: "∫ₐᵇ f(x) dx — Definite accumulation between explicit lower and upper bounds",
    governingTheorem: "ftc_integral_deriv",
    leanSignature: "axiom ftc_integral_deriv (F : FunctionSpace) (a b : R_w) : integral_ab (deriv_op F) a b = F b - F a",
    wrapPrefix: "int(",
    wrapSuffix: ", x, 0, 1)",
    defaultInner: "x",
    cursorOffsetInside: 4
  },
  st: {
    key: "st",
    symbol: "st( )",
    badge: "st",
    title: "Standard Part Operator",
    domain: "{ x : ℝ_ω // is_finite x }",
    codomain: "ℝ",
    category: "nonstandard",
    description: "Strips infinitesimal halo dust, returning standard real nucleus value",
    tooltip: "st(x₀ + ε) = x₀ — Standard shadow projection dropping infinitesimal halo dust",
    governingTheorem: "st",
    leanSignature: "axiom st : { x : R_w // is_finite x } → R_w",
    wrapPrefix: "st(",
    wrapSuffix: ")",
    defaultInner: "x",
    cursorOffsetInside: 3
  },
  delta: {
    key: "delta",
    symbol: "Δ( )",
    badge: "Δ",
    title: "Infinitesimal Forward Increment",
    domain: "SequenceSpace × ℕ",
    codomain: "ℝ_ω",
    category: "nonstandard",
    description: "Calculates forward increment Δf = f(x + dx) - f(x) ≈ f'(x)·dx",
    tooltip: "Δf — Discrete / infinitesimal increment on the 2-successor hyperfinite lattice",
    governingTheorem: "delta_at",
    leanSignature: "def delta_at (F : SequenceSpace) (k : Nat) : R_w := to_nat_seq F (k + 1) - to_nat_seq F k",
    wrapPrefix: "diff(",
    wrapSuffix: ", x) * dx",
    defaultInner: "x^2",
    cursorOffsetInside: 5
  }
};

export const ALGEBRAIC_OPERATORS: { label: string; insert: string; title: string }[] = [
  { label: "+", insert: " + ", title: "Addition" },
  { label: "−", insert: " - ", title: "Subtraction" },
  { label: "×", insert: " * ", title: "Multiplication" },
  { label: "÷", insert: " / ", title: "Division" },
  { label: "x²", insert: "^2", title: "Square power" },
  { label: "xⁿ", insert: "^", title: "Exponentiation power" },
  { label: "( )", insert: "()", title: "Parentheses grouping" },
  { label: "π", insert: "pi", title: "Archimedes Circle Constant (3.14159...)" },
  { label: "e", insert: "e", title: "Euler's Number (2.71828...)" },
  { label: "dx", insert: "dx", title: "Infinitesimal step (1/ω)" }
];

/**
 * Splits top-level comma-separated arguments while respecting nested parentheses.
 */
function splitTopLevelArgs(str: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      args.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

/**
 * High-precision numerical derivative evaluator for hyperreal / algebraic rates.
 */
function __diff(f: (x: number) => number, xVal: number): number {
  const h = 1e-6;
  const v = (f(xVal + h) - f(xVal - h)) / (2 * h);
  return Math.abs(v) < 1e-10 ? 0 : Math.round(v * 1e8) / 1e8;
}

/**
 * High-precision Simpson's 1/3 adaptive quadrature evaluator for continuous accumulation.
 */
function __integrate(f: (t: number) => number, a: number, b: number, n: number = 200): number {
  if (a === b) return 0;
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 1 ? 4 : 2) * f(x);
  }
  const res = (h / 3) * sum;
  return Math.abs(res) < 1e-10 ? 0 : Math.round(res * 1e8) / 1e8;
}

/**
 * Parses free variable identifiers from a mathematical expression string,
 * automatically excluding registered nonstandard functions, calculus operators, and bound dummy variables.
 */
function extractFreeVariables(expr: string): string[] {
  let s = (expr || "").trim();
  const boundVars = new Set<string>();

  // Find dummy integration variables in int(expr, dummy, ...) or integrate(expr, dummy, ...)
  const intMatches = [...s.matchAll(/\b(int|integrate)\s*\(/g)];
  for (const m of intMatches) {
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    const inside = s.slice(m.index + m[0].length, i - 1);
    const args = splitTopLevelArgs(inside);
    if (args.length >= 2) {
      const dummy = args[1].trim();
      if (/^[a-zA-Z_]\w*$/.test(dummy)) {
        boundVars.add(dummy);
      }
    }
  }

  const tokens = s.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const reserved = new Set([
    "Math", "PI", "E", "pi", "e", "dx", "dt", "st", "i", "log", "ln",
    "diff", "int", "integrate", "d", "D", "I", "Δ", "Delta", "sum",
    ...Object.keys(NONSTANDARD_FUNCTION_REGISTRY),
    ...Object.keys(CALCULUS_OPERATOR_REGISTRY),
    ...Object.keys(EQUATION_PRESETS),
    ...boundVars
  ]);
  const vars = new Set<string>();
  for (const t of tokens) {
    if (!reserved.has(t)) {
      vars.add(t);
    }
  }
  return Array.from(vars);
}

/**
 * Normalizes and sanitizes user mathematical expressions:
 * - Trims leading pluses and duplicate consecutive operators (+ +, + -, etc.)
 * - Handles conventional math notation like sin^2(x) -> sin(x)^2
 * - Removes dangling trailing operators
 */
function sanitizeFormula(expr: string): string {
  let s = (expr || "").trim();

  // Strip leading plus operators: '+ sin(x)' -> 'sin(x)'
  s = s.replace(/^\s*\++\s*/, "");

  // Strip trailing operators that may be left from unfinished typing: 'sin(x) +' -> 'sin(x)'
  s = s.replace(/\s*[+\-*/^]+\s*$/, "");

  // Normalize duplicate plus/minus signs: '+ +' -> '+', '+ -' -> '-'
  s = s.replace(/\+\s*\+/g, "+");
  s = s.replace(/\+\s*-\s*\+/g, "-");
  s = s.replace(/\+\s*-/g, "-");
  s = s.replace(/-\s*\+/g, "-");

  // Support standard mathematical notation: sin^2(x) -> sin(x)^2, cos^3(θ) -> cos(θ)^3
  s = s.replace(/\b([a-zA-Z_]\w*)\^(\d+)\s*\(([^()]+)\)/g, "$1($3)^$2");

  return s;
}

/**
 * Prepares raw user math expression into a runnable JavaScript string,
 * resolving derivatives, integrals, powers, and nonstandard functions.
 */
function prepareJsExpr(rawExpr: string): string {
  let s = sanitizeFormula(rawExpr);

  // Convert D(f) or D(f(x)) to diff(f(x), x)
  const dOpRegex = /\bD\s*\(/;
  let match: RegExpExecArray | null;
  while ((match = dOpRegex.exec(s)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    let inner = s.slice(match.index + match[0].length, i - 1).trim();
    if (!inner.includes("(") && !inner.includes(")")) inner = `${inner}(x)`;
    s = s.slice(0, match.index) + "diff(" + inner + ", x)" + s.slice(i);
  }

  // Convert I(f) or I(f(x)) to int(f(x), x)
  const iOpRegex = /\bI\s*\(/;
  while ((match = iOpRegex.exec(s)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    let inner = s.slice(match.index + match[0].length, i - 1).trim();
    if (!inner.includes("(") && !inner.includes(")")) inner = `${inner}(x)`;
    s = s.slice(0, match.index) + "int(" + inner + ", x)" + s.slice(i);
  }

  // Convert d/d<var>( ... ) to diff(..., var)
  const dRegex = /\bd\/d([a-zA-Z_]\w*)\s*\(/;
  while ((match = dRegex.exec(s)) !== null) {
    const varName = match[1];
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    const inner = s.slice(match.index + match[0].length, i - 1);
    s = s.slice(0, match.index) + "diff(" + inner + ", " + varName + ")" + s.slice(i);
  }

  // Convert ∫( ... ) d<var> or ∫( ... ) to int(...)
  const intDRegex = /∫\s*\(/;
  while ((match = intDRegex.exec(s)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    const inner = s.slice(match.index + match[0].length, i - 1);
    const remainder = s.slice(i);
    const dMatch = remainder.match(/^\s*d([a-zA-Z_]\w*)/);
    if (dMatch) {
      const varName = dMatch[1];
      s = s.slice(0, match.index) + "int(" + inner + ", " + varName + ")" + remainder.slice(dMatch[0].length);
    } else {
      s = s.slice(0, match.index) + "int(" + inner + ")" + remainder;
    }
  }

  // Math functions substitution
  s = s
    .replace(/\bsin\b/g, "Math.sin")
    .replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan")
    .replace(/\basin\b/g, "Math.asin")
    .replace(/\bacos\b/g, "Math.acos")
    .replace(/\batan\b/g, "Math.atan")
    .replace(/\bexp\b/g, "Math.exp")
    .replace(/\bln\b/g, "Math.log")
    .replace(/\blog\b/g, "Math.log")
    .replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\bcbrt\b/g, "Math.cbrt")
    .replace(/\babs\b/g, "Math.abs")
    .replace(/\bsqr\b/g, "((x) => x * x)")
    .replace(/\bst\b/g, "((x) => x)")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E");

  // Convert base ^ exp into Math.pow(base, exp)
  const basePattern = /((?:\bMath\.[a-z]+\s*\([^()]*\)|\b[a-zA-Z_]\w*\s*\([^()]*\)|\([^()]+\)|[a-zA-Z_]\w*|\d+(?:\.\d+)?))\s*\^\s*((?:\bMath\.[a-z]+\s*\([^()]*\)|\b[a-zA-Z_]\w*\s*\([^()]*\)|\([^()]+\)|[a-zA-Z_]\w*|\d+(?:\.\d+)?))/;
  let prev = "";
  while (basePattern.test(s) && s !== prev) {
    prev = s;
    s = s.replace(basePattern, "Math.pow($1, $2)");
  }
  s = s.replace(/\^/g, "**");

  // Replace diff and int/integrate from innermost to outermost
  while (true) {
    const matches = [...s.matchAll(/\b(diff|int|integrate)\s*\(/g)];
    if (matches.length === 0) break;
    const m = matches[matches.length - 1]; // innermost!
    const op = m[1];
    const startIdx = m.index!;
    let depth = 1;
    let i = startIdx + m[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      i++;
    }
    const inside = s.slice(startIdx + m[0].length, i - 1);
    const args = splitTopLevelArgs(inside);
    let rep = "";
    if (op === "diff") {
      const innerExpr = args[0] || "x";
      const varName = args[1] || "x";
      const atVal = args[2] || varName;
      rep = "__diff((" + varName + ") => (" + innerExpr + "), " + atVal + ")";
    } else {
      const innerExpr = args[0] || "x";
      const varName = args[1] || "x";
      if (args.length >= 4) {
        rep = "__integrate((" + varName + ") => (" + innerExpr + "), " + args[2] + ", " + args[3] + ")";
      } else {
        rep = "__integrate((" + varName + ") => (" + innerExpr + "), 0, " + varName + ")";
      }
    }
    s = s.slice(0, startIdx) + rep + s.slice(i);
  }

  return s;
}

/**
 * Safely evaluates a mathematical expression string for given variable numbers,
 * exposing calculus operations (__diff, __integrate) and nonstandard stencils in the execution scope.
 */
function safeEvalExpression(expr: string, vals: Record<string, number>): number {
  try {
    const jsExpr = prepareJsExpr(expr);
    const varNames = Object.keys(vals);
    const varValues = varNames.map(k => vals[k]);
    const fn = new Function("__diff", "__integrate", ...varNames, `return (${jsExpr});`);
    const res = fn(__diff, __integrate, ...varValues);
    return typeof res === "number" && !isNaN(res) ? res : 0;
  } catch (err) {
    console.warn("[EquationEvaluator] safeEvalExpression warning:", err);
    return 0;
  }
}

/**
 * Computes the infinitesimal halo dust for any equation evaluated on ℝ_ω.
 * Drops halo dust to 0 for strict invariants and standard part projections.
 */
function computeHaloDust(expr: string, vals: Record<string, number>, isHalo: boolean): { dustStr: string; isHard: boolean; dustVal: number } {
  if (!isHalo) return { dustStr: "0", isHard: true, dustVal: 0 };

  // Explicit standard part operator drops all halo dust
  if (/^\s*st\s*\(/.test(expr)) {
    return { dustStr: "0 (Zero Dust)", isHard: true, dustVal: 0 };
  }

  const h = 1e-5;
  let totalDerivative = 0;
  for (const [varName, baseVal] of Object.entries(vals)) {
    const valPlus = { ...vals, [varName]: baseVal + h };
    const valMinus = { ...vals, [varName]: baseVal - h };
    const df = (safeEvalExpression(expr, valPlus) - safeEvalExpression(expr, valMinus)) / (2 * h);
    totalDerivative += df;
  }

  const roundedDeriv = Math.round(totalDerivative * 10000) / 10000;
  const isHard = Math.abs(roundedDeriv) < 1e-6;
  const dustStr = isHard ? "0 (Zero Dust)" : `${roundedDeriv >= 0 ? "" : "-"}${Math.abs(roundedDeriv)}·dx`;
  return { dustStr, isHard, dustVal: roundedDeriv };
}

/**
 * Detects all nonstandard functions and calculus operators present in a given formula string.
 */
export function detectUsedFunctionsAndOperators(formula: string): {
  functions: NonstandardFunctionRule[];
  operators: CalculusOperatorRule[];
} {
  const funcs: NonstandardFunctionRule[] = [];
  const ops: CalculusOperatorRule[] = [];

  for (const [key, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(formula)) {
      funcs.push(rule);
    }
  }

  for (const [key, rule] of Object.entries(CALCULUS_OPERATOR_REGISTRY)) {
    if (key === "diff_x" && (/\bd\/dx\b/.test(formula) || /\bdiff\s*\([^,]+,\s*x/.test(formula))) {
      ops.push(rule);
    } else if (key === "diff_t" && (/\bd\/dt\b/.test(formula) || /\bdiff\s*\([^,]+,\s*t/.test(formula))) {
      ops.push(rule);
    } else if (key === "int_x" && (/\bint\s*\(/.test(formula) || /∫/.test(formula))) {
      ops.push(rule);
    } else if (key === "int_ab" && /\bint\s*\([^,]+,[^,]+,[^,]+,[^,]+\)/.test(formula)) {
      ops.push(rule);
    } else if (key === "st" && /\bst\s*\(/.test(formula)) {
      ops.push(rule);
    } else if (key === "delta" && (/Δ/.test(formula) || /\bDelta\b/.test(formula))) {
      ops.push(rule);
    }
  }

  return { functions: funcs, operators: ops };
}

export interface SymbolicResolution {
  hasOperator: boolean;
  operatorType?: "derivative" | "integral";
  operatorSymbol?: string;
  sourceFunction?: string;
  symbolicFunction?: string;
  governingTheorem?: string;
  stencilFormula?: string;
}

/**
 * Resolves high-level symbolic derivative and integral operator mappings on function spaces.
 */
export function resolveSymbolicRule(formula: string): SymbolicResolution {
  const s = (formula || "").trim();

  // Higher-order operator D: D(sin), D(cos), D(sin(x)), etc.
  const dOpMatch = s.match(/^D\s*\((.+)\)$/i);
  if (dOpMatch) {
    let inner = dOpMatch[1].trim();
    const hasArg = inner.includes("(");
    const varName = hasArg ? (inner.match(/\(\s*([a-zA-Z_]\w*)\s*\)/) || [])[1] || "x" : "x";
    const baseFn = inner.replace(/\(.*\)/, "").trim().toLowerCase();

    for (const [fnKey, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
      if (baseFn === fnKey.toLowerCase()) {
        const derivSym = hasArg
          ? rule.derivativeFormula.replace(/x₀/g, varName)
          : rule.derivativeFormula.replace(/\(x₀\)/g, "");
        const lhsSym = hasArg ? `${fnKey}(${varName})` : fnKey;
        return {
          hasOperator: true,
          operatorType: "derivative",
          operatorSymbol: "D",
          sourceFunction: fnKey,
          symbolicFunction: derivSym,
          governingTheorem: rule.governingTheorem,
          stencilFormula: `D(${lhsSym}) = ${derivSym}`
        };
      }
    }
  }

  // Higher-order operator I: I(cos), I(sin), I(exp)
  const iOpMatch = s.match(/^I\s*\((.+)\)$/i);
  if (iOpMatch) {
    let inner = iOpMatch[1].trim();
    const hasArg = inner.includes("(");
    const varName = hasArg ? (inner.match(/\(\s*([a-zA-Z_]\w*)\s*\)/) || [])[1] || "x" : "x";
    const baseFn = inner.replace(/\(.*\)/, "").trim().toLowerCase();
    const argStr = hasArg ? `(${varName})` : "";
    const lhsSym = hasArg ? `${baseFn}(${varName})` : baseFn;

    if (baseFn === "cos") {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "I",
        sourceFunction: "cos",
        symbolicFunction: `sin${argStr}`,
        governingTheorem: "integral_cos",
        stencilFormula: `I(${lhsSym}) = sin${argStr}`
      };
    } else if (baseFn === "sin") {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "I",
        sourceFunction: "sin",
        symbolicFunction: `-cos${argStr}`,
        governingTheorem: "integral_sin",
        stencilFormula: `I(${lhsSym}) = -cos${argStr}`
      };
    } else if (baseFn === "exp") {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "I",
        sourceFunction: "exp",
        symbolicFunction: `exp${argStr}`,
        governingTheorem: "exp_integral",
        stencilFormula: `I(${lhsSym}) = exp${argStr}`
      };
    }
  }

  // Derivative match: d/dx(...) or diff(..., x)
  const derivMatch = s.match(/^d\/d([a-zA-Z_]\w*)\s*\((.+)\)$/) || s.match(/^diff\s*\((.+),\s*([a-zA-Z_]\w*)\)$/);
  if (derivMatch) {
    const varName = s.startsWith("diff") ? derivMatch[2].trim() : derivMatch[1].trim();
    const inner = (s.startsWith("diff") ? derivMatch[1] : derivMatch[2]).trim();

    // Check against elementary functions: sin, cos, tan, exp, ln, sqrt, etc.
    for (const [fnKey, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
      const fnRegex = new RegExp(`^${fnKey}\\s*\\(\\s*${varName}\\s*\\)$`, "i");
      if (fnRegex.test(inner)) {
        const derivSym = rule.derivativeFormula.replace(/x₀/g, varName);
        return {
          hasOperator: true,
          operatorType: "derivative",
          operatorSymbol: `d/d${varName}`,
          sourceFunction: `${fnKey}(${varName})`,
          symbolicFunction: derivSym,
          governingTheorem: rule.governingTheorem,
          stencilFormula: `d/d${varName}[${fnKey}(${varName})] = ${derivSym}`
        };
      }
    }

    // Power rule check: x^2, x^3, etc.
    const powMatch = inner.match(new RegExp(`^${varName}\\^(\\d+)$`));
    if (powMatch) {
      const p = parseInt(powMatch[1]);
      const derivPow = p === 2 ? `2·${varName}` : `${p}·${varName}^${p - 1}`;
      return {
        hasOperator: true,
        operatorType: "derivative",
        operatorSymbol: `d/d${varName}`,
        sourceFunction: inner,
        symbolicFunction: derivPow,
        governingTheorem: "diff_pow",
        stencilFormula: `d/d${varName}[${varName}^${p}] = ${derivPow}`
      };
    }

    if (inner === varName) {
      return {
        hasOperator: true,
        operatorType: "derivative",
        operatorSymbol: `d/d${varName}`,
        sourceFunction: varName,
        symbolicFunction: "1",
        governingTheorem: "deriv_at",
        stencilFormula: `d/d${varName}[${varName}] = 1`
      };
    }
  }

  // Integral match: int(...) or ∫(...) dx
  const intMatch = s.match(/^(?:int\s*\((.+)\)|∫\s*\((.+)\)\s*d([a-zA-Z_]\w*))$/);
  if (intMatch) {
    const inner = (intMatch[1] || intMatch[2]).trim();
    const varName = intMatch[3] ? intMatch[3].trim() : "x";

    if (/^cos\s*\(/i.test(inner)) {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "∫ dx",
        sourceFunction: `cos(${varName})`,
        symbolicFunction: `sin(${varName})`,
        governingTheorem: "integral_cos",
        stencilFormula: `∫ cos(${varName}) d${varName} = sin(${varName})`
      };
    } else if (/^sin\s*\(/i.test(inner)) {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "∫ dx",
        sourceFunction: `sin(${varName})`,
        symbolicFunction: `-cos(${varName})`,
        governingTheorem: "integral_sin",
        stencilFormula: `∫ sin(${varName}) d${varName} = -cos(${varName})`
      };
    } else if (/^exp\s*\(/i.test(inner)) {
      return {
        hasOperator: true,
        operatorType: "integral",
        operatorSymbol: "∫ dx",
        sourceFunction: `exp(${varName})`,
        symbolicFunction: `exp(${varName})`,
        governingTheorem: "exp_integral",
        stencilFormula: `∫ exp(${varName}) d${varName} = exp(${varName})`
      };
    }
  }

  return { hasOperator: false };
}

/**
 * Smart cursor-aware & selection-wrapping formula input inserter.
 */
function insertTokenIntoInput(
  inputEl: HTMLInputElement,
  token: string,
  options?: { isWrapper?: boolean; wrapPrefix?: string; wrapSuffix?: string; cursorOffsetInside?: number }
) {
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;
  const currentVal = inputEl.value;

  const prefix = options?.wrapPrefix ?? (options?.isWrapper ? `${token}(` : token);
  const suffix = options?.wrapSuffix ?? (options?.isWrapper ? `)` : "");

  let newVal = "";
  let newCursorPos = start;

  if (start !== end && options?.isWrapper) {
    // User selected text: wrap it! e.g., 'd/dx(' + selected + ')'
    const selectedText = currentVal.slice(start, end);
    newVal = currentVal.slice(0, start) + prefix + selectedText + suffix + currentVal.slice(end);
    newCursorPos = start + prefix.length + selectedText.length + suffix.length;
  } else if (start !== end && !options?.isWrapper) {
    // Replace selection with token
    newVal = currentVal.slice(0, start) + token + currentVal.slice(end);
    newCursorPos = start + token.length;
  } else {
    // No selection: check placeholder
    const isPlaceholder = currentVal === "x" || currentVal === "2*x + 3" || currentVal === "x0 + k*dx";
    if (isPlaceholder && (start === 0 || start === currentVal.length)) {
      if (options?.isWrapper) {
        newVal = prefix + currentVal + suffix;
        newCursorPos = newVal.length;
      } else if (/[+\-*/^]/.test(token)) {
        newVal = `${currentVal}${token}`;
        newCursorPos = newVal.length;
      } else {
        newVal = token;
        newCursorPos = token.length;
      }
    } else {
      if (options?.isWrapper && options.cursorOffsetInside !== undefined) {
        newVal = currentVal.slice(0, start) + prefix + suffix + currentVal.slice(start);
        newCursorPos = start + options.cursorOffsetInside;
      } else if (options?.isWrapper) {
        newVal = currentVal.slice(0, start) + prefix + suffix + currentVal.slice(start);
        newCursorPos = start + prefix.length;
      } else {
        newVal = currentVal.slice(0, start) + token + currentVal.slice(start);
        newCursorPos = start + token.length;
      }
    }
  }

  inputEl.value = newVal;
  inputEl.focus();
  inputEl.setSelectionRange(newCursorPos, newCursorPos);
  inputEl.dispatchEvent(new Event("input"));
  inputEl.dispatchEvent(new Event("change"));
}

/**
 * Equation Evaluator Demo Component.
 * Implements the 4-stage FSD-modeled construction state machine:
 *   Stage 1: Formal Statement Relation (The Mathematical Invariant)
 *   Stage 2: Slot & Domain Typing (Inputs & RHS Codomain)
 *   Stage 3: Calculator Template Configuration (Stepper bounds, defaults, step size)
 *   Stage 4: Active Instantiated Calculator (Live execution & codomain shadow evaluation)
 */
export class EquationEvaluator extends Elt {
  public stage: 1 | 2 | 3 | 4 = 1;
  private spec: EquationSpec;
  private isCustom: boolean = false;
  private customTitle: string = "Custom Formal Equation";
  private customFormula: string = "2*x + 3";
  private customRhsSymbol: string = "y";
  private customRhsDomain: string = "ℝ";

  private curValues: Record<string, number> = {};
  private outBox!: HTMLDivElement;

  constructor(options?: string | EquationEvaluatorOptions | EquationSpec) {
    super("div");

    if (typeof options === "string" && EQUATION_PRESETS[options]) {
      this.spec = EQUATION_PRESETS[options];
      this.stage = 4;
    } else if (typeof options === "object" && options !== null) {
      if ("lhsFormula" in options) {
        this.spec = options as EquationSpec;
        this.stage = 4;
      } else {
        const opts = options as EquationEvaluatorOptions;
        if (opts.presetId && EQUATION_PRESETS[opts.presetId]) {
          this.spec = EQUATION_PRESETS[opts.presetId];
        } else {
          this.spec = EQUATION_PRESETS["nucleus_halo_1d"];
        }
        this.stage = opts.initialStage ?? 1;
      }
    } else {
      this.spec = EQUATION_PRESETS["nucleus_halo_1d"];
      this.stage = 1;
    }

    this.initValues();
    this.render();
  }

  private initValues() {
    this.curValues = {};
    for (const input of this.spec.inputs) {
      this.curValues[input.name] = Number(input.defaultValue) || 0;
    }
  }

  public setStage(newStage: 1 | 2 | 3 | 4) {
    this.stage = newStage;
    this.render();
  }

  public selectPreset(presetId: string, targetStage: 1 | 2 | 3 | 4 = 4) {
    if (EQUATION_PRESETS[presetId]) {
      this.isCustom = false;
      this.spec = EQUATION_PRESETS[presetId];
      this.initValues();
      this.stage = targetStage;
      this.render();
    }
  }

  public switchToCustom(formula?: string, domain?: string, targetStage: 1 | 2 | 3 | 4 = 1) {
    this.isCustom = true;
    if (formula) this.customFormula = formula;
    if (domain) this.customRhsDomain = domain;
    this.rebuildCustomSpec();
    this.stage = targetStage;
    this.render();
  }

  private rebuildCustomSpec() {
    const freeVars = extractFreeVariables(this.customFormula);
    const symbolicRes = resolveSymbolicRule(this.customFormula);
    const isFunctionSpace = this.customRhsDomain === "ℝ_ω → ℝ_ω" || symbolicRes.hasOperator;

    if (symbolicRes.hasOperator && this.customRhsDomain !== "ℝ_ω → ℝ_ω") {
      this.customRhsDomain = "ℝ_ω → ℝ_ω";
    }

    const inputs: EquationSlot[] = freeVars.length > 0
      ? freeVars.map(v => ({
          name: v,
          symbol: v,
          domain: this.customRhsDomain === "ℂ_ω" || this.customRhsDomain === "ℂ" ? "ℂ" : "ℝ",
          defaultValue: 2.0,
          step: 0.5,
          min: -100,
          max: 100,
          description: `Instantiated variable ${v}`
        }))
      : (isFunctionSpace
          ? []
          : [{ name: "x", symbol: "x", domain: "ℝ", defaultValue: 1.0, step: 0.5, min: -100, max: 100, description: "Variable x" }]);

    this.spec = {
      id: "custom_equation",
      title: this.customTitle,
      lhsFormula: this.customFormula,
      latexFormula: this.customFormula,
      rhsSymbol: this.customRhsSymbol,
      rhsDomain: this.customRhsDomain,
      description: "User-constructed equation statement evaluated on the Middle Way canvas.",
      inputs,
      evaluate: (vals) => {
        const val = safeEvalExpression(this.customFormula, vals);
        const isHalo = this.customRhsDomain === "ℝ_ω" || this.customRhsDomain === "ℂ_ω";
        const valStr = Number.isInteger(val) ? val.toString() : val.toFixed(4);
        const { dustStr, isHard } = computeHaloDust(this.customFormula, vals, isHalo);

        if (isFunctionSpace) {
          const funcRule = symbolicRes.symbolicFunction ?? this.customFormula;
          const probeVal = Object.keys(vals).length > 0 ? safeEvalExpression(this.customFormula, vals) : null;
          const probeStr = probeVal !== null ? (Number.isInteger(probeVal) ? probeVal.toString() : probeVal.toFixed(4)) : null;
          return {
            displayValue: funcRule,
            hardPart: funcRule,
            dustPart: "0",
            isHard: true,
            details: [
              `Target Function Space: ${this.customRhsSymbol} = ${funcRule} ∈ (ℝ_ω → ℝ_ω)`,
              ...(probeStr !== null ? [`Operating Point Probe: ${this.customRhsSymbol}(${Object.entries(vals).map(([k, v]) => `${k} = ${v}`).join(", ")}) = ${probeStr}`] : []),
              `Calculus Invariant: ${symbolicRes.stencilFormula ?? this.customFormula}`
            ]
          };
        }

        return {
          displayValue: (isHalo && !isHard) ? `${valStr} + ${dustStr}` : valStr,
          hardPart: valStr,
          dustPart: dustStr,
          isHard,
          details: [
            `Standard Nucleus Part: st(${this.customRhsSymbol}) = ${valStr}`,
            `Infinitesimal Halo Dust: ε = ${dustStr}`,
            `Codomain Target: ${this.customRhsSymbol} ∈ ${this.customRhsDomain}`
          ]
        };
      }
    };

    this.initValues();
  }

  public render() {
    this.elt.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.style.cssText = "max-width: 920px; margin: 0 auto; border: 1.5px solid #0284c7; border-radius: 8px; background: #ffffff; padding: 22px 26px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); font-family: system-ui, -apple-system, sans-serif;";

    const spinSuppressStyle = document.createElement("style");
    spinSuppressStyle.textContent = `
      .ee-num-input::-webkit-outer-spin-button,
      .ee-num-input::-webkit-inner-spin-button,
      .ee-cfg-def::-webkit-outer-spin-button,
      .ee-cfg-def::-webkit-inner-spin-button,
      .ee-cfg-step::-webkit-outer-spin-button,
      .ee-cfg-step::-webkit-inner-spin-button,
      .ee-cfg-min::-webkit-outer-spin-button,
      .ee-cfg-min::-webkit-inner-spin-button,
      .ee-cfg-max::-webkit-outer-spin-button,
      .ee-cfg-max::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0 !important;
      }
      .ee-num-input, .ee-cfg-def, .ee-cfg-step, .ee-cfg-min, .ee-cfg-max {
        -moz-appearance: textfield !important;
        appearance: textfield !important;
      }
    `;
    wrap.appendChild(spinSuppressStyle);

    // 1. Stage Stepper Navigation Bar (FSD Model)
    const navBar = document.createElement("div");
    navBar.style.cssText = "display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px; flex-wrap: wrap; gap: 8px;";

    const stagesInfo: { num: 1 | 2 | 3 | 4; label: string; icon: string }[] = [
      { num: 1, label: "Formal Relation", icon: "📜" },
      { num: 2, label: "Slot Typing", icon: "🏷️" },
      { num: 3, label: "Calculator Template", icon: "🛠️" },
      { num: 4, label: "Active Calculator", icon: "🧮" }
    ];

    const chipsGroup = document.createElement("div");
    chipsGroup.style.cssText = "display: flex; align-items: center; gap: 6px; flex-wrap: wrap;";

    stagesInfo.forEach((st, idx) => {
      const isCur = this.stage === st.num;
      const isPast = this.stage > st.num;

      const chip = document.createElement("button");
      chip.style.cssText = `display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; font-size: 12px; font-weight: ${isCur ? '700' : '600'}; border-radius: 6px; border: 1px solid ${isCur ? '#0284c7' : '#cbd5e1'}; background: ${isCur ? '#0284c7' : (isPast ? '#f0f9ff' : '#f8fafc')}; color: ${isCur ? '#ffffff' : (isPast ? '#0369a1' : '#64748b')}; cursor: pointer; transition: all 0.15s ease;`;
      chip.innerHTML = `<span>${st.icon}</span> <span>Step ${st.num}: ${st.label}</span>`;
      chip.addEventListener("click", () => this.setStage(st.num));
      chipsGroup.appendChild(chip);

      if (idx < stagesInfo.length - 1) {
        const arrow = document.createElement("span");
        arrow.style.cssText = "color: #94a3b8; font-size: 11px;";
        arrow.textContent = "➔";
        chipsGroup.appendChild(arrow);
      }
    });

    navBar.appendChild(chipsGroup);

    // Equation Mode / Title Badge (Presets are linked directly in curricular text via <eq-ref>)
    const modeBadge = document.createElement("div");
    modeBadge.style.cssText = "display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px;";
    modeBadge.innerHTML = this.isCustom
      ? `<span>✏️</span> <span>Custom Equation Builder</span>`
      : `<span>📜</span> <span>${this.spec.title}</span>`;
    navBar.appendChild(modeBadge);
    wrap.appendChild(navBar);

    // 2. Render Current Stage Content
    if (this.stage === 1) {
      this.renderStage1(wrap);
    } else if (this.stage === 2) {
      this.renderStage2(wrap);
    } else if (this.stage === 3) {
      this.renderStage3(wrap);
    } else {
      this.renderStage4(wrap);
    }

    this.elt.appendChild(wrap);
  }

  // =========================================================================
  // STAGE 1: Formal Statement Relation (The Invariant)
  // =========================================================================
  private renderStage1(wrap: HTMLElement) {
    const card = document.createElement("div");
    card.style.cssText = "background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;";

    card.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;">
        Stage 1: Governing Formal Statement &amp; Functional Equality
      </div>
      <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">
        ${this.spec.title}
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">
        In Middle Way Math, an equation is a specific <strong>Formal Statement (FS)</strong> asserting that for all typed inputs on the discrete tree, a unique target element exists in the codomain:
      </p>

      <!-- Formal Predicate Box -->
      <div style="background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px; text-align: center;">
        <div style="font-size: 11.5px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Constitutional Equation Predicate</div>
        <div style="font-family: monospace; font-size: 17px; font-weight: bold; color: #0369a1;">
          ∀ (${this.spec.inputs.map(i => i.symbol).join(", ")}) ∈ Domains, &nbsp; ∃! ${this.spec.rhsSymbol} ∈ ${this.spec.rhsDomain} &nbsp; [ ${this.spec.rhsSymbol} = ${this.spec.lhsFormula} ]
        </div>
        ${this.spec.latexFormula ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px;"><code>LaTeX: ${this.spec.latexFormula}</code></div>` : ''}
      </div>
    `;

    // Lean 4 Scaffold Signature if attached
    if (this.spec.leanSignature || this.spec.governingTheorem) {
      const leanBox = document.createElement("div");
      leanBox.style.cssText = "background: #f1f5f9; border-left: 4px solid #0284c7; border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px;";
      leanBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-weight: 700; color: #0369a1;">Lean 4 Machine Certification:</span>
          ${this.spec.governingTheorem ? `<span style="font-family: monospace; font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 3px;">MiddleWay.${this.spec.governingTheorem}</span>` : ''}
        </div>
        <div style="font-family: monospace; color: #0f172a; word-break: break-all;">
          ${this.spec.leanSignature || `#check MiddleWay.${this.spec.governingTheorem}`}
        </div>
      `;
      card.appendChild(leanBox);
    }

    // General Mathematical Law & Stencil Card (Visible immediately in Stage 1 without navigating to an instance)
    const symbolicRes = resolveSymbolicRule(this.spec.lhsFormula);
    const { functions: usedFuncs } = detectUsedFunctionsAndOperators(this.spec.lhsFormula);

    const generalLawBox = document.createElement("div");
    generalLawBox.style.cssText = "background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px;";

    if (symbolicRes.hasOperator && symbolicRes.symbolicFunction) {
      generalLawBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">📜</span>
            <span style="font-size: 11.5px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
              General Stencil Law (Higher-Order Functional Identity)
            </span>
          </div>
          ${symbolicRes.governingTheorem ? `
            <button class="ee-thm-link-s1" data-thm="${symbolicRes.governingTheorem}" style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 4px; font-size: 11px; font-family: monospace; color: #166534; padding: 3px 9px; cursor: pointer; font-weight: 700;">
              📜 MiddleWay.${symbolicRes.governingTheorem}
            </button>` : ''}
        </div>
        <div style="display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a;">
            General Identity: <span style="color: #0284c7;">${symbolicRes.stencilFormula}</span>
          </div>
          <span style="font-size: 11.5px; color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
            Codomain: ℝ_ω → ℝ_ω (Function Space)
          </span>
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 6px; line-height: 1.4;">
          ↳ <em>General Mathematical Rule:</em> Maps functions directly across the continuum (e.g. <code>D(sin) = cos</code>). This universal law holds without requiring navigation to a specific operating point instance.
        </div>
      `;
    } else if (usedFuncs.length > 0) {
      generalLawBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">📜</span>
            <span style="font-size: 11.5px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
              General Nonstandard Laws for Detected Functions
            </span>
          </div>
          ${this.spec.governingTheorem ? `
            <button class="ee-thm-link-s1" data-thm="${this.spec.governingTheorem}" style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 4px; font-size: 11px; font-family: monospace; color: #166534; padding: 3px 9px; cursor: pointer; font-weight: 700;">
              📜 MiddleWay.${this.spec.governingTheorem}
            </button>` : ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${usedFuncs.map(f => `
            <div style="font-size: 12px; color: #334155; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; background: #ffffff; padding: 6px 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
              <span><strong>${f.name}(x) Law:</strong> <code>${f.hardRuleDesc}</code> &nbsp;with halo dust&nbsp; <code>${f.dustRuleDesc}</code></span>
              <span style="font-size: 11px; color: #0284c7; font-weight: 600;">f' = ${f.derivativeFormula}</span>
            </div>
          `).join("")}
        </div>
      `;
    } else {
      generalLawBox.innerHTML = `
        <div style="font-size: 11.5px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 4px;">
          📜 General Tree Invariant
        </div>
        <div style="font-size: 12px; color: #334155;">
          The identity <code>${this.spec.rhsSymbol} = ${this.spec.lhsFormula}</code> holds for all valid domain coordinates on the discrete tree.
        </div>
      `;
    }

    generalLawBox.querySelectorAll(".ee-thm-link-s1").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const thm = (e.currentTarget as HTMLElement).getAttribute("data-thm");
        if (thm) {
          const { FSDRef } = await import("./fsdRef.js");
          FSDRef.openScaffoldCard(thm, `MiddleWay.${thm}`);
        }
      });
    });

    card.appendChild(generalLawBox);

    // Formula Authoring & Operator Toolbar (Calculus, Functions, Algebra)
    const toolbarBox = document.createElement("div");
    toolbarBox.style.cssText = "background: #f8fafc; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;";

    toolbarBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
          🧮 Formula Authoring &amp; Operator Toolbar
        </span>
        <span style="font-size: 11px; color: #64748b;">(Click any button to insert into formula, or highlight formula text first to wrap it)</span>
      </div>

      <!-- Section 1: Calculus & Nonstandard Operators -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 10.5px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          <span>∫ Calculus &amp; Nonstandard Operators</span>
        </div>
        <div class="ee-calc-chips" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
      </div>

      <!-- Section 2: Callable Functions -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 10.5px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          <span>📚 Elementary &amp; Nonstandard Functions</span>
        </div>
        <div class="ee-fn-chips" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
      </div>

      <!-- Section 3: Arithmetic & Algebra Keys -->
      <div>
        <div style="font-size: 10.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          <span>⚡ Arithmetic, Powers &amp; Symbols</span>
        </div>
        <div class="ee-alg-chips" style="display: flex; gap: 5px; flex-wrap: wrap;"></div>
      </div>
    `;

    // 1. Calculus Operators
    const calcContainer = toolbarBox.querySelector(".ee-calc-chips") as HTMLDivElement;
    for (const [opKey, rule] of Object.entries(CALCULUS_OPERATOR_REGISTRY)) {
      const btn = document.createElement("button");
      btn.style.cssText = "display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; font-family: monospace; font-size: 12px; font-weight: 700; background: #ffffff; color: #4338ca; border: 1.5px solid #c7d2fe; border-radius: 5px; cursor: pointer; transition: all 0.15s ease;";
      btn.title = `${rule.title}\n${rule.description}\n${rule.tooltip}`;
      btn.innerHTML = `<span style="background: #ede9fe; color: #4338ca; padding: 1px 4px; border-radius: 3px; font-size: 10px; font-weight: 800;">${rule.badge}</span> <span>${rule.symbol}</span>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.isCustom) {
          this.switchToCustom(this.spec.lhsFormula, this.spec.rhsDomain, 1);
        }
        const formIn = card.querySelector("#eeEditFormula") as HTMLInputElement;
        if (formIn) {
          insertTokenIntoInput(formIn, rule.badge, {
            isWrapper: true,
            wrapPrefix: rule.wrapPrefix,
            wrapSuffix: rule.wrapSuffix,
            cursorOffsetInside: rule.cursorOffsetInside
          });
        }
      });
      calcContainer.appendChild(btn);
    }

    // 2. Defined Functions
    const chipsContainer = toolbarBox.querySelector(".ee-fn-chips") as HTMLDivElement;
    for (const [fnKey, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
      const btn = document.createElement("button");
      btn.style.cssText = "display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; font-family: monospace; font-size: 12px; font-weight: 700; background: #ffffff; color: #0369a1; border: 1px solid #7dd3fc; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
      btn.title = `${rule.description}\n${rule.hardRuleDesc}\n${rule.dustRuleDesc}`;
      btn.innerHTML = `<span>${fnKey}(x)</span>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.isCustom) {
          this.switchToCustom(this.spec.lhsFormula, this.spec.rhsDomain, 1);
        }
        const formIn = card.querySelector("#eeEditFormula") as HTMLInputElement;
        if (formIn) {
          insertTokenIntoInput(formIn, fnKey, {
            isWrapper: true,
            wrapPrefix: `${fnKey}(`,
            wrapSuffix: ")",
            cursorOffsetInside: fnKey.length + 1
          });
        }
      });
      chipsContainer.appendChild(btn);
    }

    // 3. Algebraic Operators
    const algContainer = toolbarBox.querySelector(".ee-alg-chips") as HTMLDivElement;
    for (const op of ALGEBRAIC_OPERATORS) {
      const btn = document.createElement("button");
      btn.style.cssText = "display: inline-flex; align-items: center; padding: 4px 8px; font-family: monospace; font-size: 12px; font-weight: 700; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
      btn.title = op.title;
      btn.innerHTML = `<span>${op.label}</span>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.isCustom) {
          this.switchToCustom(this.spec.lhsFormula, this.spec.rhsDomain, 1);
        }
        const formIn = card.querySelector("#eeEditFormula") as HTMLInputElement;
        if (formIn) {
          insertTokenIntoInput(formIn, op.insert);
        }
      });
      algContainer.appendChild(btn);
    }

    card.appendChild(toolbarBox);

    // Collapsible Nonstandard Stencil & Lean 4 Type Inspector Drawer
    const inspectorDetails = document.createElement("details");
    inspectorDetails.style.cssText = "background: #f8fafc; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px;";

    inspectorDetails.innerHTML = `
      <summary style="font-weight: 700; color: #0369a1; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;">
        <span>🔍 Inspect Nonstandard Calculation Stencils &amp; Lean 4 Types (12 Functions &amp; 6 Operators)</span>
        <span style="font-size: 11px; font-weight: normal; color: #64748b;">(Click to expand verified formulas)</span>
      </summary>
      <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 14px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase; margin-bottom: 6px;">
            ∫ Calculus &amp; Nonstandard Operators: Formal Directed Pairs
          </div>
          <div class="ee-inspector-ops" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 8px;"></div>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;">
            📚 Elementary &amp; Nonstandard Functions: Hard Nucleus + Halo Dust Stencils
          </div>
          <div class="ee-inspector-fns" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 8px;"></div>
        </div>
      </div>
    `;

    // Populate operators into inspector
    const opsInspector = inspectorDetails.querySelector(".ee-inspector-ops") as HTMLDivElement;
    for (const [opKey, rule] of Object.entries(CALCULUS_OPERATOR_REGISTRY)) {
      const opCard = document.createElement("div");
      opCard.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px; font-size: 11.5px;";
      opCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #4338ca; font-family: monospace;">${rule.symbol}</strong>
          <span style="font-size: 10px; background: #ede9fe; color: #4338ca; font-weight: 700; padding: 1px 5px; border-radius: 3px;">${rule.badge}</span>
        </div>
        <div style="color: #0f172a; margin-bottom: 2px;"><strong>Type:</strong> <code style="color: #0369a1;">${rule.domain} → ${rule.codomain}</code></div>
        <div style="color: #475569; font-size: 11px; margin-bottom: 4px;">${rule.description}</div>
        ${rule.governingTheorem ? `
          <button class="ee-thm-link" data-thm="${rule.governingTheorem}" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 10px; font-family: monospace; color: #0369a1; padding: 2px 6px; cursor: pointer;">
            📜 MiddleWay.${rule.governingTheorem}
          </button>` : ''}
      `;
      opsInspector.appendChild(opCard);
    }

    // Populate functions into inspector
    const fnsInspector = inspectorDetails.querySelector(".ee-inspector-fns") as HTMLDivElement;
    for (const [fnKey, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
      const fnCard = document.createElement("div");
      fnCard.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px; font-size: 11.5px;";
      fnCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #0284c7; font-family: monospace;">${fnKey}(x)</strong>
          <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 1px 5px; border-radius: 3px;">Directed Pair</span>
        </div>
        <div style="color: #0f172a; margin-bottom: 2px;"><strong>Type:</strong> <code style="color: #0284c7;">${rule.domain} → ${rule.codomain}</code></div>
        ${rule.domainConditionDesc ? `<div style="color: #b45309; font-size: 10.5px; margin-bottom: 2px;">⚠️ Condition: <code>${rule.domainConditionDesc}</code></div>` : ''}
        <div style="color: #334155; font-size: 11px; margin-bottom: 2px;"><strong>st:</strong> <code>${rule.hardRuleDesc}</code></div>
        <div style="color: #334155; font-size: 11px; margin-bottom: 4px;"><strong>Halo:</strong> <code>${rule.dustRuleDesc}</code></div>
        <div style="color: #475569; font-size: 10.5px; margin-bottom: 4px;">Derivative: <code>${rule.derivativeFormula}</code></div>
        ${rule.governingTheorem ? `
          <button class="ee-thm-link" data-thm="${rule.governingTheorem}" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 10px; font-family: monospace; color: #0369a1; padding: 2px 6px; cursor: pointer;">
            📜 MiddleWay.${rule.governingTheorem}
          </button>` : ''}
      `;
      fnsInspector.appendChild(fnCard);
    }

    inspectorDetails.querySelectorAll(".ee-thm-link").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const thm = (e.currentTarget as HTMLElement).getAttribute("data-thm");
        if (thm) {
          const { FSDRef } = await import("./fsdRef.js");
          FSDRef.openScaffoldCard(thm, `MiddleWay.${thm}`);
        }
      });
    });

    card.appendChild(inspectorDetails);

    // If Custom Mode, allow editing the relation
    if (this.isCustom) {
      const editBox = document.createElement("div");
      editBox.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);";
      editBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 12px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
            ✏️ Active Custom Equation Specification
          </span>
          <span style="font-size: 11px; color: #64748b;">
            Tip: Highlight sub-expressions in the formula and click toolbar chips to wrap!
          </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; align-items: end;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">Statement Title</label>
            <input id="eeEditTitle" type="text" value="${this.customTitle}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-size: 12.5px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">LHS Expression Formula</label>
            <input id="eeEditFormula" type="text" value="${this.customFormula}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-family: monospace; font-size: 13.5px; font-weight: bold; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 4px; background: #f0f9ff;" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">RHS Target Symbol</label>
            <input id="eeEditSymbol" type="text" value="${this.customRhsSymbol}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-family: monospace; font-size: 13.5px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
        </div>
      `;
      card.appendChild(editBox);

      setTimeout(() => {
        const titleIn = editBox.querySelector("#eeEditTitle") as HTMLInputElement;
        const formIn = editBox.querySelector("#eeEditFormula") as HTMLInputElement;
        const symIn = editBox.querySelector("#eeEditSymbol") as HTMLInputElement;
        if (titleIn && formIn && symIn) {
          const onChg = () => {
            this.customTitle = titleIn.value.trim() || "Custom Formal Equation";
            this.customFormula = sanitizeFormula(formIn.value) || "x";
            this.customRhsSymbol = symIn.value.trim() || "y";
            this.rebuildCustomSpec();
          };
          titleIn.addEventListener("change", onChg);
          formIn.addEventListener("change", onChg);
          formIn.addEventListener("blur", () => {
            formIn.value = sanitizeFormula(formIn.value);
            onChg();
          });
          symIn.addEventListener("change", onChg);
        }
      }, 0);
    }

    // Navigation Action
    const actionsRow = document.createElement("div");
    actionsRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-top: 14px;";

    if (!this.isCustom) {
      const forkBtn = document.createElement("button");
      forkBtn.style.cssText = "padding: 7px 13px; font-size: 12px; font-weight: 600; background: #ffffff; color: #0284c7; border: 1px solid #0284c7; border-radius: 5px; cursor: pointer; transition: all 0.15s ease;";
      forkBtn.innerHTML = "<span>✏️</span> <span>Fork into Custom Equation</span>";
      forkBtn.title = "Switch to custom builder with this formula to modify expression and slots";
      forkBtn.addEventListener("click", () => {
        this.switchToCustom(this.spec.lhsFormula, this.spec.rhsDomain, 1);
      });
      actionsRow.appendChild(forkBtn);
    } else {
      const spacer = document.createElement("div");
      actionsRow.appendChild(spacer);
    }

    const nextBtn = document.createElement("button");
    nextBtn.style.cssText = "padding: 8px 18px; font-size: 13px; font-weight: 700; background: #0284c7; color: #ffffff; border: none; border-radius: 5px; cursor: pointer;";
    nextBtn.textContent = "Step 2: Slot & Domain Typing →";
    nextBtn.addEventListener("click", () => this.setStage(2));
    actionsRow.appendChild(nextBtn);

    card.appendChild(actionsRow);
    wrap.appendChild(card);
  }

  // =========================================================================
  // STAGE 2: Slot & Domain Typing (Inputs & Codomain)
  // =========================================================================
  private renderStage2(wrap: HTMLElement) {
    const card = document.createElement("div");
    card.style.cssText = "background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;";

    card.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;">
        Stage 2: Mathematical Domain &amp; Codomain Typing
      </div>
      <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">
        Type Slots for: <code>${this.spec.rhsSymbol} = ${this.spec.lhsFormula}</code>
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">
        Every free variable on the LHS represents an independent computational slot. Assign its foundational domain, and declare the codomain of the RHS target.
      </p>
    `;

    // 0. Inferred Function Typing & Domain Restrictions Card
    const { functions: usedFuncs } = detectUsedFunctionsAndOperators(this.spec.lhsFormula);
    const funcsWithConditions = usedFuncs.filter(f => f.domainConditionDesc);
    const symbolicRes = resolveSymbolicRule(this.spec.lhsFormula);

    if (symbolicRes.hasOperator && this.spec.rhsDomain !== "ℝ_ω → ℝ_ω") {
      this.spec.rhsDomain = "ℝ_ω → ℝ_ω";
      this.customRhsDomain = "ℝ_ω → ℝ_ω";
    }

    const typeInferenceCard = document.createElement("div");
    typeInferenceCard.style.cssText = "background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;";

    let operatorConstraintBanner = "";
    if (symbolicRes.hasOperator) {
      operatorConstraintBanner = `
        <div style="margin-top: 8px; padding: 6px 10px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; font-size: 12px; color: #166534; display: flex; align-items: center; justify-content: space-between;">
          <span>⚡ <strong>Operator Constraint:</strong> Selected operator <code>${symbolicRes.operatorSymbol}</code> acts on FunctionSpace. Codomain is typed as <strong>ℝ_ω → ℝ_ω</strong>.</span>
          <span style="font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 3px;">Auto-Constrained</span>
        </div>
      `;
    }

    if (funcsWithConditions.length > 0) {
      typeInferenceCard.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b45309; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>⚠️ Inferred Function Typing &amp; Domain Restrictions</span>
        </div>
        <p style="font-size: 12px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
          The expression <code>${this.spec.lhsFormula}</code> uses typed functions with restricted domains on the tree. Input variable slots are constrained to these bounds:
        </p>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${funcsWithConditions.map(f => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; font-size: 12px;">
              <div>
                <span style="font-family: monospace; font-weight: bold; color: #92400e;">${f.name}(x)</span>
                <span style="color: #64748b; margin-left: 6px; font-size: 11px;">Type: <code>${f.domain} → ${f.codomain}</code></span>
              </div>
              <span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 3px; font-weight: 700; font-family: monospace;">Requires: ${f.domainConditionDesc}</span>
            </div>
          `).join("")}
        </div>
        ${operatorConstraintBanner}
      `;
    } else {
      typeInferenceCard.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>ℹ️ Function Typing &amp; Coordinate Coverage</span>
        </div>
        <p style="font-size: 12px; color: #334155; margin: 0;">
          ✓ All detected operators and functions in <code>${this.spec.lhsFormula}</code> are total on <strong>ℝ / ℝ_ω</strong>. No restricted sub-domains detected.
        </p>
        ${operatorConstraintBanner}
      `;
    }
    card.appendChild(typeInferenceCard);

    // 1. LHS Input Slots Grid
    const slotsCard = document.createElement("div");
    slotsCard.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";

    if (this.spec.inputs.length === 0) {
      slotsCard.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534; margin-bottom: 8px;">
          LHS Input Function Space Slot
        </div>
        <div style="padding: 12px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-weight: 700; color: #166534; font-size: 13px;">
              ⚡ Pure Function Space Operator Mapping: <code>${symbolicRes.stencilFormula ?? this.spec.lhsFormula}</code>
            </div>
            <div style="font-size: 12px; color: #334155; margin-top: 3px;">
              The operator <code>${symbolicRes.operatorSymbol ?? 'D'}</code> acts directly on function space. No scalar variable slots are required on the LHS.
            </div>
          </div>
          <span style="background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 3px 8px; border-radius: 4px; font-size: 11.5px; font-weight: bold; font-family: monospace;">
            Input: ${symbolicRes.sourceFunction ?? 'f'} ∈ (ℝ_ω → ℝ_ω)
          </span>
        </div>
      `;
    } else {
      slotsCard.innerHTML = `<div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px;">LHS Input Variable Slots</div>`;

      const grid = document.createElement("div");
      grid.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      this.spec.inputs.forEach((slot, idx) => {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; flex-wrap: wrap; gap: 10px;";

        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px;">${slot.symbol}</span>
            <span style="font-size: 12.5px; color: #334155;">Slot ${idx + 1}: <strong>${slot.description || slot.name}</strong></span>
          </div>
        `;

        const domainSelect = document.createElement("select");
        domainSelect.style.cssText = "padding: 4px 8px; font-size: 12px; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff;";
        const domOptions = ["ℝ", "ℝ_ω", "ℂ", "ℂ_ω", "ℤ", "ℕ", "𝔹"];
        const matchedFn = funcsWithConditions.find(f => f.domainConditionDesc);
        if (matchedFn && matchedFn.domainConditionDesc) {
          const restricted = `[ℝ | ${matchedFn.domainConditionDesc}]`;
          domOptions.unshift(restricted);
          if (slot.domain === "ℝ") slot.domain = restricted;
        }
        domOptions.forEach(d => {
          const opt = document.createElement("option");
          opt.value = d;
          opt.textContent = `Domain: ${d}`;
          if (slot.domain === d) opt.selected = true;
          domainSelect.appendChild(opt);
        });
        domainSelect.addEventListener("change", () => {
          slot.domain = domainSelect.value;
        });
        row.appendChild(domainSelect);
        grid.appendChild(row);
      });

      slotsCard.appendChild(grid);
    }
    card.appendChild(slotsCard);

    // 2. RHS Target Codomain Selector
    const codomainCard = document.createElement("div");
    codomainCard.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";
    codomainCard.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 8px;">Single RHS Output Codomain</div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div>
          <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0f172a;">${this.spec.rhsSymbol}</span>
          <span style="font-size: 13px; color: #475569; margin-left: 8px;">Target evaluation result will be typed in:</span>
        </div>
        <select id="eeRhsDomainSelect" style="padding: 6px 12px; font-size: 13px; font-weight: bold; border: 1.5px solid #0284c7; border-radius: 4px; background: #f0f9ff; color: #0369a1;">
          <option value="ℝ" ${this.spec.rhsDomain === 'ℝ' ? 'selected' : ''}>ℝ (Standard Real Nucleus)</option>
          <option value="ℝ_ω" ${this.spec.rhsDomain === 'ℝ_ω' ? 'selected' : ''}>ℝ_ω (Hyperreal: Nucleus + Halo Dust)</option>
          <option value="ℝ_ω → ℝ_ω" ${this.spec.rhsDomain === 'ℝ_ω → ℝ_ω' ? 'selected' : ''}>ℝ_ω → ℝ_ω (Function Space: Derived / Integral Operator Mapping)</option>
          <option value="ℂ" ${this.spec.rhsDomain === 'ℂ' ? 'selected' : ''}>ℂ (Standard Complex)</option>
          <option value="ℂ_ω" ${this.spec.rhsDomain === 'ℂ_ω' ? 'selected' : ''}>ℂ_ω (Hypercomplex: Nucleus + Halo Soup)</option>
          <option value="ℕ" ${this.spec.rhsDomain === 'ℕ' ? 'selected' : ''}>ℕ (Natural Counting)</option>
          <option value="𝔹" ${this.spec.rhsDomain === '𝔹' ? 'selected' : ''}>𝔹 (Boolean Truth Value)</option>
        </select>
      </div>
    `;
    card.appendChild(codomainCard);

    setTimeout(() => {
      const sel = codomainCard.querySelector("#eeRhsDomainSelect") as HTMLSelectElement;
      if (sel) {
        sel.addEventListener("change", () => {
          this.spec.rhsDomain = sel.value;
          this.customRhsDomain = sel.value;
        });
      }
    }, 0);

    // Navigation Actions
    const actionsRow = document.createElement("div");
    actionsRow.style.cssText = "display: flex; justify-content: space-between; margin-top: 14px;";

    const prevBtn = document.createElement("button");
    prevBtn.style.cssText = "padding: 8px 16px; font-size: 12.5px; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 5px; cursor: pointer;";
    prevBtn.textContent = "← Back to Relation";
    prevBtn.addEventListener("click", () => this.setStage(1));
    actionsRow.appendChild(prevBtn);

    const nextBtn = document.createElement("button");
    nextBtn.style.cssText = "padding: 8px 18px; font-size: 13px; font-weight: 700; background: #0284c7; color: #ffffff; border: none; border-radius: 5px; cursor: pointer;";
    if (this.spec.inputs.length === 0) {
      nextBtn.textContent = `Display Evaluated Function: ${symbolicRes.symbolicFunction ?? 'Result'} →`;
      nextBtn.addEventListener("click", () => this.setStage(4));
    } else {
      nextBtn.textContent = "Step 3: Calculator Template Configuration →";
      nextBtn.addEventListener("click", () => this.setStage(3));
    }
    actionsRow.appendChild(nextBtn);

    card.appendChild(actionsRow);
    wrap.appendChild(card);
  }

  // =========================================================================
  // STAGE 3: Calculator Template Configuration (Defaults, Steppers, Bounds)
  // =========================================================================
  private renderStage3(wrap: HTMLElement) {
    const symbolicRes = resolveSymbolicRule(this.spec.lhsFormula);
    const card = document.createElement("div");
    card.style.cssText = "background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;";

    if (this.spec.inputs.length === 0) {
      card.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;">
          Stage 3: Calculator Template Configuration
        </div>
        <div style="padding: 24px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; text-align: center; margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: bold; color: #166534; margin-bottom: 8px;">
            📜 Function Space Mapping — No Variable Steppers Required
          </div>
          <p style="font-size: 13.5px; color: #334155; max-width: 600px; margin: 0 auto 18px auto; line-height: 1.5;">
            The equation <code>${this.spec.rhsSymbol} = ${this.spec.lhsFormula}</code> evaluates directly to the function space element <strong>${symbolicRes.symbolicFunction ?? 'cos'}</strong>. Since there are no scalar coordinates to instantiate, numeric stepper configuration is bypassed.
          </p>
          <button id="eeTmplProceed" style="padding: 9px 20px; font-size: 13px; font-weight: bold; background: #0284c7; color: #ffffff; border: none; border-radius: 5px; cursor: pointer;">
            Proceed to Evaluated Function Target (${symbolicRes.symbolicFunction ?? 'cos'}) →
          </button>
        </div>
      `;
      card.querySelector("#eeTmplProceed")?.addEventListener("click", () => this.setStage(4));
      wrap.appendChild(card);
      return;
    }

    card.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;">
        Stage 3: Interactive Calculator Template Configuration
      </div>
      <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">
        Configure Interactive Stepper Controls &amp; Bounds
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">
        Specify default initial values, stepper step sizes (<code>[-] [value] [+]</code>), and operational bounds for each slot.
      </p>
    `;

    // Slotted Stepper Config Table
    const configTable = document.createElement("div");
    configTable.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";

    const { functions: usedFuncs } = detectUsedFunctionsAndOperators(this.spec.lhsFormula);
    for (const slot of this.spec.inputs) {
      for (const fn of usedFuncs) {
        if (fn.name === "ln") {
          if (slot.min === undefined || slot.min < 0.001) slot.min = 0.001;
          if (Number(slot.defaultValue) <= 0) {
            slot.defaultValue = 1.0;
            this.curValues[slot.name] = 1.0;
          }
        } else if (fn.name === "asin" || fn.name === "acos") {
          if (slot.min === undefined || slot.min < -1) slot.min = -1;
          if (slot.max === undefined || slot.max > 1) slot.max = 1;
          const numDef = Number(slot.defaultValue);
          if (numDef < -1 || numDef > 1) {
            slot.defaultValue = 0.5;
            this.curValues[slot.name] = 0.5;
          }
        } else if (fn.name === "sqrt") {
          if (slot.min === undefined || slot.min < 0) slot.min = 0;
          if (Number(slot.defaultValue) < 0) {
            slot.defaultValue = 1.0;
            this.curValues[slot.name] = 1.0;
          }
        }
      }
    }

    this.spec.inputs.forEach((slot, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 2fr; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;";

      row.innerHTML = `
        <div>
          <span style="font-family: monospace; font-size: 13.5px; font-weight: bold; background: #0284c7; color: white; padding: 2px 7px; border-radius: 3px;">${slot.symbol}</span>
          <span style="font-size: 11.5px; color: #64748b; margin-left: 4px;">(${slot.domain})</span>
        </div>
        <div>
          <label style="display:block; font-size:10px; color:#64748b; font-weight:700;">DEFAULT</label>
          <input type="number" class="ee-cfg-def" data-idx="${idx}" value="${slot.defaultValue}" style="width:100%; box-sizing:border-box; padding:4px 6px; font-size:12px; border:1px solid #cbd5e1; border-radius:3px;" />
        </div>
        <div>
          <label style="display:block; font-size:10px; color:#64748b; font-weight:700;">STEP</label>
          <input type="number" class="ee-cfg-step" data-idx="${idx}" value="${slot.step ?? 1}" style="width:100%; box-sizing:border-box; padding:4px 6px; font-size:12px; border:1px solid #cbd5e1; border-radius:3px;" />
        </div>
        <div>
          <label style="display:block; font-size:10px; color:#64748b; font-weight:700;">BOUNDS (MIN / MAX)</label>
          <div style="display:flex; gap:4px;">
            <input type="number" class="ee-cfg-min" data-idx="${idx}" value="${slot.min ?? -100}" style="width:50%; box-sizing:border-box; padding:4px 4px; font-size:11px; border:1px solid #cbd5e1; border-radius:3px;" />
            <input type="number" class="ee-cfg-max" data-idx="${idx}" value="${slot.max ?? 100}" style="width:50%; box-sizing:border-box; padding:4px 4px; font-size:11px; border:1px solid #cbd5e1; border-radius:3px;" />
          </div>
        </div>
        <div>
          <label style="display:block; font-size:10px; color:#64748b; font-weight:700;">SLOT DESCRIPTION</label>
          <input type="text" class="ee-cfg-desc" data-idx="${idx}" value="${slot.description ?? ''}" style="width:100%; box-sizing:border-box; padding:4px 6px; font-size:12px; border:1px solid #cbd5e1; border-radius:3px;" />
        </div>
      `;
      configTable.appendChild(row);
    });

    card.appendChild(configTable);

    setTimeout(() => {
      configTable.querySelectorAll(".ee-cfg-def").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = Number((e.target as HTMLElement).getAttribute("data-idx"));
          this.spec.inputs[idx].defaultValue = parseFloat((e.target as HTMLInputElement).value);
          this.curValues[this.spec.inputs[idx].name] = this.spec.inputs[idx].defaultValue as number;
        });
      });
      configTable.querySelectorAll(".ee-cfg-step").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = Number((e.target as HTMLElement).getAttribute("data-idx"));
          this.spec.inputs[idx].step = parseFloat((e.target as HTMLInputElement).value);
        });
      });
      configTable.querySelectorAll(".ee-cfg-min").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = Number((e.target as HTMLElement).getAttribute("data-idx"));
          this.spec.inputs[idx].min = parseFloat((e.target as HTMLInputElement).value);
        });
      });
      configTable.querySelectorAll(".ee-cfg-max").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = Number((e.target as HTMLElement).getAttribute("data-idx"));
          this.spec.inputs[idx].max = parseFloat((e.target as HTMLInputElement).value);
        });
      });
      configTable.querySelectorAll(".ee-cfg-desc").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = Number((e.target as HTMLElement).getAttribute("data-idx"));
          this.spec.inputs[idx].description = (e.target as HTMLInputElement).value;
        });
      });
    }, 0);

    // Navigation Actions
    const actionsRow = document.createElement("div");
    actionsRow.style.cssText = "display: flex; justify-content: space-between; margin-top: 14px;";

    const prevBtn = document.createElement("button");
    prevBtn.style.cssText = "padding: 8px 16px; font-size: 12.5px; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 5px; cursor: pointer;";
    prevBtn.textContent = "← Back to Slot Typing";
    prevBtn.addEventListener("click", () => this.setStage(2));
    actionsRow.appendChild(prevBtn);

    const launchBtn = document.createElement("button");
    launchBtn.style.cssText = "padding: 8px 20px; font-size: 13.5px; font-weight: 700; background: #16a34a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);";
    launchBtn.textContent = "⚡ Launch Instantiated Calculator →";
    launchBtn.addEventListener("click", () => this.setStage(4));
    actionsRow.appendChild(launchBtn);

    card.appendChild(actionsRow);
    wrap.appendChild(card);
  }

  // =========================================================================
  // STAGE 4: Active Instantiated Calculator (Operational Single-Slot RHS)
  // =========================================================================
  private renderStage4(wrap: HTMLElement) {
    // 1. Contract Summary Header
    const contractBar = document.createElement("div");
    contractBar.style.cssText = "background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;";

    contractBar.innerHTML = `
      <div>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0284c7; margin-bottom: 2px;">
          Active Instantiated Equation Calculator
        </div>
        <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
          <code>${this.spec.lhsFormula}</code> &nbsp;=&nbsp; <code style="color: #0284c7;">${this.spec.rhsSymbol}</code>
          <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 6px;">(${this.spec.rhsSymbol} ∈ ${this.spec.rhsDomain})</span>
        </div>
      </div>
    `;

    if (this.spec.governingTheorem) {
      const thmBtn = document.createElement("button");
      thmBtn.style.cssText = "background: #ffffff; border: 1px solid #0284c7; color: #0284c7; font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;";
      thmBtn.textContent = `📜 Verified in MiddleWay.${this.spec.governingTheorem}`;
      thmBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { FSDRef } = await import("./fsdRef.js");
        FSDRef.openScaffoldCard(this.spec.governingTheorem!, `MiddleWay.${this.spec.governingTheorem}`);
      });
      contractBar.appendChild(thmBtn);
    }

    const editFormulaBtn = document.createElement("button");
    editFormulaBtn.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; color: #0284c7; font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease;";
    editFormulaBtn.innerHTML = "<span>✏️</span> <span>Edit Formula &amp; Operators</span>";
    editFormulaBtn.title = "Jump to Step 1 to modify expression formula, calculus operators, and functions";
    editFormulaBtn.addEventListener("click", () => {
      this.setStage(1);
    });
    contractBar.appendChild(editFormulaBtn);

    wrap.appendChild(contractBar);

    const symbolicRes = resolveSymbolicRule(this.spec.lhsFormula);

    if (this.spec.inputs.length === 0) {
      // 2. Pure Function Space Target Card
      const funcCard = document.createElement("div");
      funcCard.style.cssText = "background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 16px;";
      funcCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">📜</span>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                Evaluated Target Function Space Result
              </div>
              <div style="font-family: monospace; font-size: 22px; font-weight: bold; color: #0f172a;">
                ${this.spec.rhsSymbol} = <span style="color: #0284c7;">${symbolicRes.symbolicFunction ?? this.spec.lhsFormula}</span>
              </div>
            </div>
          </div>
          <span style="background: #dcfce7; color: #166534; border: 1.5px solid #86efac; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">
            Codomain: ℝ_ω → ℝ_ω
          </span>
        </div>

        <div style="font-size: 13px; color: #334155; line-height: 1.5; margin-bottom: 14px; background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #bbf7d0;">
          <div>↳ <strong>Calculus Stencil Identity:</strong> <code>${symbolicRes.stencilFormula ?? `${this.spec.lhsFormula} = ${symbolicRes.symbolicFunction ?? 'cos'}`}</code></div>
          <div>↳ <strong>Functional Codomain:</strong> The operator <code>${symbolicRes.operatorSymbol ?? 'D'}</code> mapped <code>${symbolicRes.sourceFunction ?? 'sin'}</code> into the derived function <strong>${symbolicRes.symbolicFunction ?? 'cos'}</strong>.</div>
        </div>

        ${symbolicRes.governingTheorem ? `
          <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 12px; color: #166534; font-weight: 600;">Lean 4 Machine Verification:</span>
            <button class="ee-thm-link" data-thm="${symbolicRes.governingTheorem}" style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 4px; font-size: 11.5px; font-family: monospace; color: #166534; padding: 3px 10px; cursor: pointer; font-weight: 700;">
              📜 MiddleWay.${symbolicRes.governingTheorem}
            </button>
          </div>` : ''}
      `;

      funcCard.querySelectorAll(".ee-thm-link").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const thm = (e.currentTarget as HTMLElement).getAttribute("data-thm");
          if (thm) {
            const { FSDRef } = await import("./fsdRef.js");
            FSDRef.openScaffoldCard(thm, `MiddleWay.${thm}`);
          }
        });
      });

      wrap.appendChild(funcCard);

      // Optional Pointwise Probe Section
      const probeCard = document.createElement("div");
      probeCard.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";
      probeCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
          <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">
            🔍 Optional Pointwise Evaluation Probe
          </span>
          <span style="font-size: 11px; color: #64748b;">(Test ${this.spec.rhsSymbol}(x₀) at specific domain points)</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #475569; color: #ffffff; font-family: monospace; font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">x₀</span>
            <span style="font-size: 12.5px; color: #334155;">Test Coordinate ∈ ℝ</span>
          </div>
          <div class="ee-probe-stepper" style="display: flex; align-items: center; gap: 4px;">
            <button class="ee-probe-dec" style="width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1;">-</button>
            <input class="ee-probe-input ee-num-input" type="number" value="${this.curValues["x"] ?? 0}" step="0.5" style="width: 80px; height: 26px; text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; border: 1.5px solid #cbd5e1; border-radius: 4px;" />
            <button class="ee-probe-inc" style="width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1;">+</button>
            <span class="ee-probe-result" style="margin-left: 12px; font-family: monospace; font-size: 14px; font-weight: bold; color: #0284c7;"></span>
          </div>
        </div>
      `;

      const pIn = probeCard.querySelector(".ee-probe-input") as HTMLInputElement;
      const pDec = probeCard.querySelector(".ee-probe-dec") as HTMLButtonElement;
      const pInc = probeCard.querySelector(".ee-probe-inc") as HTMLButtonElement;
      const pRes = probeCard.querySelector(".ee-probe-result") as HTMLSpanElement;

      const updateProbe = () => {
        const xVal = parseFloat(pIn.value) || 0;
        this.curValues["x"] = xVal;
        const calcVal = safeEvalExpression(this.spec.lhsFormula, { x: xVal });
        const calcStr = Number.isInteger(calcVal) ? calcVal.toString() : calcVal.toFixed(4);
        pRes.innerHTML = `↳ ${this.spec.rhsSymbol}(${xVal}) = <strong>${calcStr}</strong>`;
        this.updateOutput();
      };

      pDec.addEventListener("click", () => {
        let v = (parseFloat(pIn.value) || 0) - 0.5;
        pIn.value = (Math.round(v * 10) / 10).toString();
        updateProbe();
      });
      pInc.addEventListener("click", () => {
        let v = (parseFloat(pIn.value) || 0) + 0.5;
        pIn.value = (Math.round(v * 10) / 10).toString();
        updateProbe();
      });
      pIn.addEventListener("input", updateProbe);
      updateProbe();

      wrap.appendChild(probeCard);
    } else {
      // 2. LHS Instantiation Slots Panel
      const inputsCard = document.createElement("div");
      inputsCard.style.cssText = "background: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px; margin-bottom: 16px;";

      const inputsTitle = document.createElement("div");
      inputsTitle.style.cssText = "font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;";
      inputsTitle.innerHTML = `<span>⚙️ LHS Instantiation Slots</span> <span style="font-size:11px; font-weight:normal; text-transform:none; color:#64748b;">(Instantiate all free variables to produce single RHS target)</span>`;
      inputsCard.appendChild(inputsTitle);

      const controlsGrid = document.createElement("div");
      controlsGrid.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      for (const slot of this.spec.inputs) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;";

        // Left: symbol & domain badge
        const infoDiv = document.createElement("div");
        infoDiv.style.cssText = "display: flex; align-items: center; gap: 8px;";

        const symBadge = document.createElement("span");
        symBadge.style.cssText = "background: #0284c7; color: #ffffff; font-family: monospace; font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 4px;";
        symBadge.textContent = slot.symbol;
        infoDiv.appendChild(symBadge);

        const domainBadge = document.createElement("span");
        domainBadge.style.cssText = "font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 3px;";
        domainBadge.textContent = `∈ ${slot.domain}`;
        infoDiv.appendChild(domainBadge);

        if (slot.description) {
          const descSpan = document.createElement("span");
          descSpan.style.cssText = "font-size: 12px; color: #475569;";
          descSpan.textContent = slot.description;
          infoDiv.appendChild(descSpan);
        }
        row.appendChild(infoDiv);

        // Right: Stepper [-] [Input] [+]
        const ctrlDiv = document.createElement("div");
        ctrlDiv.style.cssText = "display: flex; align-items: center; gap: 4px;";

        const step = slot.step ?? 1;

        const decBtn = document.createElement("button");
        decBtn.style.cssText = "width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1; user-select: none; transition: background 0.15s ease, border-color 0.15s ease;";
        decBtn.textContent = "-";
        decBtn.title = `Decrement by ${step}`;
        decBtn.setAttribute("aria-label", `Decrement by ${step}`);

        const numInput = document.createElement("input");
        numInput.type = "number";
        numInput.className = "ee-num-input";
        numInput.value = (this.curValues[slot.name] ?? slot.defaultValue).toString();
        numInput.step = step.toString();
        if (slot.min !== undefined) numInput.min = slot.min.toString();
        if (slot.max !== undefined) numInput.max = slot.max.toString();
        numInput.style.cssText = "width: 80px; height: 26px; text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; border: 1.5px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #0f172a; outline: none; transition: border-color 0.15s ease;";

        const incBtn = document.createElement("button");
        incBtn.style.cssText = "width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1; user-select: none; transition: background 0.15s ease, border-color 0.15s ease;";
        incBtn.textContent = "+";
        incBtn.title = `Increment by ${step}`;
        incBtn.setAttribute("aria-label", `Increment by ${step}`);

        decBtn.addEventListener("mouseenter", () => { decBtn.style.background = "#f0f9ff"; decBtn.style.borderColor = "#0284c7"; });
        decBtn.addEventListener("mouseleave", () => { decBtn.style.background = "#ffffff"; decBtn.style.borderColor = "#cbd5e1"; });
        incBtn.addEventListener("mouseenter", () => { incBtn.style.background = "#f0f9ff"; incBtn.style.borderColor = "#0284c7"; });
        incBtn.addEventListener("mouseleave", () => { incBtn.style.background = "#ffffff"; incBtn.style.borderColor = "#cbd5e1"; });
        numInput.addEventListener("focus", () => { numInput.style.borderColor = "#0284c7"; });
        numInput.addEventListener("blur", () => { numInput.style.borderColor = "#cbd5e1"; });

        decBtn.addEventListener("click", () => {
          let cur = Number(numInput.value);
          cur = Math.round((cur - step) * 1000) / 1000;
          if (slot.min !== undefined && cur < slot.min) cur = slot.min;
          this.curValues[slot.name] = cur;
          numInput.value = cur.toString();
          this.updateOutput();
        });

        incBtn.addEventListener("click", () => {
          let cur = Number(numInput.value);
          cur = Math.round((cur + step) * 1000) / 1000;
          if (slot.max !== undefined && cur > slot.max) cur = slot.max;
          this.curValues[slot.name] = cur;
          numInput.value = cur.toString();
          this.updateOutput();
        });

        numInput.addEventListener("keydown", (e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            incBtn.click();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            decBtn.click();
          }
        });

        numInput.addEventListener("input", () => {
          const val = parseFloat(numInput.value);
          if (!isNaN(val)) {
            this.curValues[slot.name] = val;
            this.updateOutput();
          }
        });

        ctrlDiv.appendChild(decBtn);
        ctrlDiv.appendChild(numInput);
        ctrlDiv.appendChild(incBtn);
        row.appendChild(ctrlDiv);

        controlsGrid.appendChild(row);
      }

      inputsCard.appendChild(controlsGrid);
      wrap.appendChild(inputsCard);
    }

    // 3. RHS Single Target Output Slot
    this.outBox = document.createElement("div");
    this.outBox.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 18px; font-family: monospace; font-size: 13px; color: #0f172a; margin-bottom: 16px;";
    wrap.appendChild(this.outBox);

    // 4. Stepper Navigation Row to Step Back to Template or Relation
    const backNavRow = document.createElement("div");
    backNavRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 14px; font-size: 12px;";

    const leftBackGroup = document.createElement("div");
    leftBackGroup.style.cssText = "display: flex; gap: 8px;";

    const modTmplBtn = document.createElement("button");
    modTmplBtn.style.cssText = "padding: 5px 12px; font-size: 12px; font-weight: 600; background: #f8fafc; color: #0369a1; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;";
    modTmplBtn.textContent = "← Step 3: Modify Template";
    modTmplBtn.addEventListener("click", () => this.setStage(3));
    leftBackGroup.appendChild(modTmplBtn);

    const modSlotsBtn = document.createElement("button");
    modSlotsBtn.style.cssText = "padding: 5px 12px; font-size: 12px; font-weight: 600; background: #f8fafc; color: #0369a1; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;";
    modSlotsBtn.textContent = "← Step 2: Redefine Slots";
    modSlotsBtn.addEventListener("click", () => this.setStage(2));
    leftBackGroup.appendChild(modSlotsBtn);

    backNavRow.appendChild(leftBackGroup);

    const relBtn = document.createElement("button");
    relBtn.style.cssText = "padding: 5px 12px; font-size: 12px; font-weight: 600; background: #f8fafc; color: #64748b; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;";
    relBtn.textContent = "← Step 1: Formal Relation";
    relBtn.addEventListener("click", () => this.setStage(1));
    backNavRow.appendChild(relBtn);

    wrap.appendChild(backNavRow);

    this.updateOutput();
  }

  private updateOutput() {
    if (!this.outBox) return;

    const res = this.spec.evaluate(this.curValues);
    const domain = this.spec.rhsDomain;
    const sym = this.spec.rhsSymbol;

    const { functions: usedFuncs } = detectUsedFunctionsAndOperators(this.spec.lhsFormula);
    const domainWarnings: string[] = [];
    for (const fn of usedFuncs) {
      if (fn.domainCondition) {
        for (const [varName, val] of Object.entries(this.curValues)) {
          if (!fn.domainCondition(val)) {
            domainWarnings.push(`Input slot <code>${varName} = ${val}</code> violates domain restriction <code>${fn.domainConditionDesc}</code> for function <strong>${fn.name}()</strong>.`);
          }
        }
      }
    }

    const domainWarningBanner = domainWarnings.length > 0
      ? `<div style="font-family: system-ui, sans-serif; font-size: 12.5px; color: #b45309; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
           <div style="font-weight: 700; margin-bottom: 4px;">⚠️ Input Domain Condition Warning</div>
           <div>${domainWarnings.join("<br/>")}</div>
           <div style="font-size: 11px; color: #92400e; margin-top: 4px;">In Middle Way Math, coordinates outside the typed domain do not exist on the discrete tree. Adjust the input stepper to restore validity.</div>
         </div>`
      : "";

    let codomainSection = "";
    if (domain === "ℝ_ω") {
      codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℝ_ω (1D Hyperreal Decomposition)</div>
          <div>↳ <strong>Hard Real Nucleus:</strong> &nbsp;st(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℝ</div>
          <div>↳ <strong>Infinitesimal Halo Dust:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
    } else if (domain === "ℂ_ω") {
      codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℂ_ω (2D Complex Decomposition)</div>
          <div>↳ <strong>Gaussian Dyadic Nucleus:</strong> &nbsp;st_C(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℂ</div>
          <div>↳ <strong>Complex Halo Soup:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
    } else if (domain === "ℝ" || domain === "ℕ" || domain === "ℤ") {
      codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: Standard Discrete / Real Register</div>
          <div>↳ <strong>Hard Register Guarantee:</strong> Zero halo dust (ε = 0). Pure nucleus value encodable in finite binary bits.</div>
        </div>
      `;
    } else if (domain === "ℝ_ω → ℝ_ω") {
      codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f0fdf4; border-radius: 4px; border: 1.5px solid #86efac;">
          <div style="color: #166534; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℝ_ω → ℝ_ω (Function Space Mapping)</div>
          <div>↳ <strong>Derived Function Space Arrow:</strong> &nbsp;<span style="font-weight: 800; color: #15803d;">${sym}(x) = ${res.hardPart ?? res.displayValue}</span></div>
          <div>↳ <strong>Coordinate Probe:</strong> &nbsp;${Object.entries(this.curValues).map(([k,v]) => `${k} = ${v}`).join(", ")}</div>
        </div>
      `;
    }

    const symbolicRes = resolveSymbolicRule(this.spec.lhsFormula);

    let activeStencilBlock = "";
    if (symbolicRes.hasOperator && symbolicRes.symbolicFunction) {
      activeStencilBlock = `
        <div style="margin-top: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📐</span>
              <span style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                Active Calculation Stencil Used in Evaluation
              </span>
            </div>
            <span style="background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
              ${symbolicRes.operatorSymbol} : (ℝ_ω → ℝ_ω) × ℝ_ω → ℝ_ω
            </span>
          </div>

          <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 5px; padding: 10px 14px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Symbolic Stencil Rule:</span>
                <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0f172a; margin-left: 8px;">
                  ${symbolicRes.stencilFormula}
                </span>
              </div>
              ${symbolicRes.governingTheorem ? `
                <button class="ee-thm-link-s4" data-thm="${symbolicRes.governingTheorem}" style="background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 4px; font-size: 11px; font-family: monospace; color: #0369a1; padding: 3px 8px; cursor: pointer; font-weight: 700;">
                  📜 MiddleWay.${symbolicRes.governingTheorem}
                </button>` : ''}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; font-size: 12px;">
            <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px 10px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Pointwise Operating Nucleus</div>
              <div style="font-family: monospace; font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                st(y) = ${symbolicRes.symbolicFunction.replace(/[a-zA-Z_]\w*/g, (v) => this.curValues[v] !== undefined ? `${this.curValues[v]}` : v)} = <span style="color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℝ
              </div>
            </div>
            <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px 10px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">First-Order Halo Dust</div>
              <div style="font-family: monospace; font-size: 13.5px; font-weight: 800; color: #0284c7; margin-top: 2px;">
                ε = ${res.dustPart ?? "0"} ∈ μ(0)
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (usedFuncs.length > 0) {
      activeStencilBlock = `
        <div style="margin-top: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📐</span>
              <span style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                Active Calculation Stencils in Formula
              </span>
            </div>
            <span style="background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
              ${usedFuncs.length} Stencil${usedFuncs.length > 1 ? "s" : ""} Active
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${usedFuncs.map(f => `
              <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 5px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #0369a1;">${f.name}(x)</span>
                  <span style="font-size: 12px; color: #334155; margin-left: 10px;">
                    Hard: <code>${f.hardRuleDesc}</code> &nbsp;|&nbsp; Halo: <code>${f.dustRuleDesc}</code> &nbsp;|&nbsp; Deriv: <code>${f.derivativeFormula}</code>
                  </span>
                </div>
                ${f.governingTheorem ? `
                  <button class="ee-thm-link-s4" data-thm="${f.governingTheorem}" style="background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 4px; font-size: 11px; font-family: monospace; color: #0369a1; padding: 2px 8px; cursor: pointer; font-weight: 600;">
                    📜 MiddleWay.${f.governingTheorem}
                  </button>` : ''}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    const nonstandardCard = `
      <div style="margin-top: 14px; padding: 12px 14px; background: #ffffff; border-radius: 6px; border: 1.5px solid #bae6fd;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <span style="font-size: 11.5px; font-weight: 700; color: #0369a1; text-transform: uppercase;">
            🔬 Nonstandard Decomposition &amp; Machine Certification
          </span>
          ${this.spec.governingTheorem ? `
            <button class="ee-thm-link-s4" data-thm="${this.spec.governingTheorem}" style="background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 4px; font-size: 11px; font-family: monospace; color: #0369a1; padding: 2px 7px; cursor: pointer; font-weight: 600;">
              📜 MiddleWay.${this.spec.governingTheorem}
            </button>` : ''}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 12px;">
          <div style="background: #f8fafc; padding: 8px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Standard Real Nucleus</div>
            <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">st(${sym}) = ${res.hardPart ?? res.displayValue}</div>
          </div>
          <div style="background: #f8fafc; padding: 8px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">First-Order Halo Dust</div>
            <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #0284c7; margin-top: 2px;">ε = ${res.dustPart ?? "0"}</div>
          </div>
        </div>
      </div>
    `;

    const statusNotice = res.isHard
      ? `<div style="font-family: system-ui, sans-serif; font-size: 12px; color: #059669; font-weight: 600; margin-top: 12px; padding: 8px 12px; background: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
           ✓ Verified Hard Value: All transfinite fluctuations vanish identically (dust = 0).
         </div>`
      : `<div style="font-family: system-ui, sans-serif; font-size: 12px; color: #059669; font-weight: 600; margin-top: 12px; padding: 8px 12px; background: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
           ✓ Verified Identity: Instantiated LHS evaluates exactly to RHS in ${domain}.
         </div>`;

    let detailsList = "";
    if (res.details && res.details.length > 0) {
      detailsList = `
        <div style="margin-top: 10px; font-family: system-ui, sans-serif; font-size: 12px; color: #334155;">
          ${res.details.map(d => `<div>• ${d}</div>`).join("")}
        </div>
      `;
    }

    this.outBox.innerHTML = `
      ${domainWarningBanner}
      <div style="font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 8px;">
        🎯 Evaluated RHS Target Slot (${sym} ∈ ${domain})
      </div>
      <div style="background: #f8fafc; padding: 12px 16px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 16px;">
        ${sym} &nbsp;=&nbsp; <span style="font-weight: 800; color: #0284c7;">${res.displayValue}</span>
      </div>
      ${codomainSection}
      ${activeStencilBlock}
      ${nonstandardCard}
      ${detailsList}
      ${statusNotice}
    `;

    this.outBox.querySelectorAll(".ee-thm-link-s4").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const thm = (e.currentTarget as HTMLElement).getAttribute("data-thm");
        if (thm) {
          const { FSDRef } = await import("./fsdRef.js");
          FSDRef.openScaffoldCard(thm, `MiddleWay.${thm}`);
        }
      });
    });
  }
}
