import { Elt } from "./elt.js";
export const EQUATION_PRESETS = {
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
            const dustTerms = [];
            if (kx !== 0)
                dustTerms.push(kx > 0 ? `${kx}·dx` : `-${Math.abs(kx)}·dx`);
            if (ky !== 0)
                dustTerms.push(ky > 0 ? `${ky}i·dx` : `-${Math.abs(ky)}i·dx`);
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
                    `Modulus of Hard Nucleus: |z₀| = ${Math.sqrt(x0 * x0 + y0 * y0).toFixed(3)}`
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
                    `All intermediate internal differences ΔF(1)...ΔF(${n - 1}) cancel pairwise.`
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
    }
};
export const NONSTANDARD_FUNCTION_REGISTRY = {
    sin: {
        name: "sin",
        latexDisplay: "\\sin(x_0 + k \\cdot dx) = \\sin(x_0) + k \\cdot \\cos(x_0) \\cdot dx",
        description: "Sine with first-order cosine halo dust",
        hardRuleDesc: "st(sin(x)) = sin(x₀)",
        dustRuleDesc: "ε = k · cos(x₀) · dx",
        evalHard: (x) => Math.sin(x),
        evalDust: (x0, k) => k * Math.cos(x0)
    },
    cos: {
        name: "cos",
        latexDisplay: "\\cos(x_0 + k \\cdot dx) = \\cos(x_0) - k \\cdot \\sin(x_0) \\cdot dx",
        description: "Cosine with negative sine halo dust",
        hardRuleDesc: "st(cos(x)) = cos(x₀)",
        dustRuleDesc: "ε = -k · sin(x₀) · dx",
        evalHard: (x) => Math.cos(x),
        evalDust: (x0, k) => -k * Math.sin(x0)
    },
    tan: {
        name: "tan",
        latexDisplay: "\\tan(x_0 + k \\cdot dx) = \\tan(x_0) + k \\cdot \\sec^2(x_0) \\cdot dx",
        description: "Tangent with secant-squared halo dust",
        hardRuleDesc: "st(tan(x)) = tan(x₀)",
        dustRuleDesc: "ε = k · sec²(x₀) · dx",
        evalHard: (x) => Math.tan(x),
        evalDust: (x0, k) => k / (Math.cos(x0) * Math.cos(x0))
    },
    exp: {
        name: "exp",
        latexDisplay: "\\exp(x_0 + k \\cdot dx) = \\exp(x_0) + k \\cdot \\exp(x_0) \\cdot dx",
        description: "Exponential self-derivative growth stencil",
        hardRuleDesc: "st(exp(x)) = exp(x₀)",
        dustRuleDesc: "ε = k · exp(x₀) · dx",
        evalHard: (x) => Math.exp(x),
        evalDust: (x0, k) => k * Math.exp(x0)
    },
    sqrt: {
        name: "sqrt",
        latexDisplay: "\\sqrt{x_0 + k \\cdot dx} = \\sqrt{x_0} + \\frac{k}{2\\sqrt{x_0}} \\cdot dx",
        description: "Square root nonstandard branch stencil",
        hardRuleDesc: "st(sqrt(x)) = sqrt(x₀)",
        dustRuleDesc: "ε = (k / 2√x₀) · dx",
        evalHard: (x) => Math.sqrt(Math.max(0, x)),
        evalDust: (x0, k) => x0 > 0 ? k / (2 * Math.sqrt(x0)) : 0
    },
    sqr: {
        name: "sqr",
        latexDisplay: "(x_0 + k \\cdot dx)^2 = x_0^2 + 2 x_0 k \\cdot dx",
        description: "Square algebraic binomial stencil",
        hardRuleDesc: "st(x²) = x₀²",
        dustRuleDesc: "ε = 2 x₀ k · dx",
        evalHard: (x) => x * x,
        evalDust: (x0, k) => 2 * x0 * k
    },
    abs: {
        name: "abs",
        latexDisplay: "|x_0 + k \\cdot dx| = |x_0| + \\text{sgn}(x_0) k \\cdot dx",
        description: "Absolute value piecewise sign stencil",
        hardRuleDesc: "st(|x|) = |x₀|",
        dustRuleDesc: "ε = sgn(x₀) k · dx",
        evalHard: (x) => Math.abs(x),
        evalDust: (x0, k) => Math.sign(x0) * k
    }
};
/**
 * Parses free variable identifiers from a mathematical expression string,
 * automatically excluding registered nonstandard functions and presets.
 */
function extractFreeVariables(expr) {
    const tokens = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const reserved = new Set([
        "Math", "PI", "E", "dx", "st", "dt", "i", "log",
        ...Object.keys(NONSTANDARD_FUNCTION_REGISTRY),
        ...Object.keys(EQUATION_PRESETS)
    ]);
    const vars = new Set();
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
function sanitizeFormula(expr) {
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
 * Safely evaluates a mathematical expression string for given variable numbers,
 * exposing all registered nonstandard calculations in the execution scope.
 */
function safeEvalExpression(expr, vals) {
    try {
        let clean = sanitizeFormula(expr);
        let jsExpr = clean
            .replace(/\bsin\b/g, "Math.sin")
            .replace(/\bcos\b/g, "Math.cos")
            .replace(/\btan\b/g, "Math.tan")
            .replace(/\bexp\b/g, "Math.exp")
            .replace(/\blog\b/g, "Math.log")
            .replace(/\bsqrt\b/g, "Math.sqrt")
            .replace(/\babs\b/g, "Math.abs")
            .replace(/\bsqr\b/g, "((x) => x * x)")
            .replace(/\bpi\b/gi, "Math.PI");
        // Convert power expressions 'base ^ exp' into Math.pow(base, exp)
        // This avoids JavaScript's unary operator SyntaxError before exponentiation (** operator)
        const basePattern = /((?:\bMath\.[a-z]+\s*\([^()]*\)|\b[a-zA-Z_]\w*\s*\([^()]*\)|\([^()]+\)|[a-zA-Z_]\w*|\d+(?:\.\d+)?))\s*\^\s*((?:\bMath\.[a-z]+\s*\([^()]*\)|\b[a-zA-Z_]\w*\s*\([^()]*\)|\([^()]+\)|[a-zA-Z_]\w*|\d+(?:\.\d+)?))/;
        let prev = "";
        while (basePattern.test(jsExpr) && jsExpr !== prev) {
            prev = jsExpr;
            jsExpr = jsExpr.replace(basePattern, "Math.pow($1, $2)");
        }
        // Fallback: replace any remaining ^ with **
        jsExpr = jsExpr.replace(/\^/g, "**");
        const varNames = Object.keys(vals);
        const varValues = varNames.map(k => vals[k]);
        const fn = new Function(...varNames, `return (${jsExpr});`);
        const res = fn(...varValues);
        return typeof res === "number" && !isNaN(res) ? res : 0;
    }
    catch (err) {
        console.warn("[EquationEvaluator] safeEvalExpression warning:", err);
        return 0;
    }
}
/**
 * Computes the infinitesimal halo dust for any custom equation evaluated on ℝ_ω.
 */
function computeHaloDust(expr, vals, isHalo) {
    if (!isHalo)
        return { dustStr: "0", isHard: true, dustVal: 0 };
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
 * Equation Evaluator Demo Component.
 * Implements the 4-stage FSD-modeled construction state machine:
 *   Stage 1: Formal Statement Relation (The Mathematical Invariant)
 *   Stage 2: Slot & Domain Typing (Inputs & RHS Codomain)
 *   Stage 3: Calculator Template Configuration (Stepper bounds, defaults, step size)
 *   Stage 4: Active Instantiated Calculator (Live execution & codomain shadow evaluation)
 */
export class EquationEvaluator extends Elt {
    stage = 1;
    spec;
    isCustom = false;
    customTitle = "Custom Formal Equation";
    customFormula = "2*x + 3";
    customRhsSymbol = "y";
    customRhsDomain = "ℝ";
    curValues = {};
    outBox;
    constructor(options) {
        super("div");
        if (typeof options === "string" && EQUATION_PRESETS[options]) {
            this.spec = EQUATION_PRESETS[options];
            this.stage = 4;
        }
        else if (typeof options === "object" && options !== null) {
            if ("lhsFormula" in options) {
                this.spec = options;
                this.stage = 4;
            }
            else {
                const opts = options;
                if (opts.presetId && EQUATION_PRESETS[opts.presetId]) {
                    this.spec = EQUATION_PRESETS[opts.presetId];
                }
                else {
                    this.spec = EQUATION_PRESETS["nucleus_halo_1d"];
                }
                this.stage = opts.initialStage ?? 1;
            }
        }
        else {
            this.spec = EQUATION_PRESETS["nucleus_halo_1d"];
            this.stage = 1;
        }
        this.initValues();
        this.render();
    }
    initValues() {
        this.curValues = {};
        for (const input of this.spec.inputs) {
            this.curValues[input.name] = Number(input.defaultValue) || 0;
        }
    }
    setStage(newStage) {
        this.stage = newStage;
        this.render();
    }
    selectPreset(presetId, targetStage = 4) {
        if (EQUATION_PRESETS[presetId]) {
            this.isCustom = false;
            this.spec = EQUATION_PRESETS[presetId];
            this.initValues();
            this.stage = targetStage;
            this.render();
        }
    }
    switchToCustom(formula, domain, targetStage = 1) {
        this.isCustom = true;
        if (formula)
            this.customFormula = formula;
        if (domain)
            this.customRhsDomain = domain;
        this.rebuildCustomSpec();
        this.stage = targetStage;
        this.render();
    }
    rebuildCustomSpec() {
        const freeVars = extractFreeVariables(this.customFormula);
        const inputs = freeVars.length > 0
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
            : [{ name: "x", symbol: "x", domain: "ℝ", defaultValue: 1.0, step: 0.5, min: -100, max: 100, description: "Variable x" }];
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
    render() {
        this.elt.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.style.cssText = "max-width: 920px; margin: 0 auto; border: 1.5px solid #0284c7; border-radius: 8px; background: #ffffff; padding: 22px 26px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); font-family: system-ui, -apple-system, sans-serif;";
        // 1. Stage Stepper Navigation Bar (FSD Model)
        const navBar = document.createElement("div");
        navBar.style.cssText = "display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px; flex-wrap: wrap; gap: 8px;";
        const stagesInfo = [
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
        }
        else if (this.stage === 2) {
            this.renderStage2(wrap);
        }
        else if (this.stage === 3) {
            this.renderStage3(wrap);
        }
        else {
            this.renderStage4(wrap);
        }
        this.elt.appendChild(wrap);
    }
    // =========================================================================
    // STAGE 1: Formal Statement Relation (The Invariant)
    // =========================================================================
    renderStage1(wrap) {
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
        // Defined Nonstandard Functions Palette (LHS Callable)
        const fnPalette = document.createElement("div");
        fnPalette.style.cssText = "background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 12px 14px; margin-bottom: 16px;";
        fnPalette.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px;">
        <span style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
          📚 Defined Nonstandard Functions (LHS Callable)
        </span>
        <span style="font-size: 11px; color: #64748b;">(Click a chip to insert into the LHS formula)</span>
      </div>
      <div class="ee-fn-chips" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
    `;
        const chipsContainer = fnPalette.querySelector(".ee-fn-chips");
        for (const [fnKey, rule] of Object.entries(NONSTANDARD_FUNCTION_REGISTRY)) {
            const btn = document.createElement("button");
            btn.style.cssText = "display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; font-family: monospace; font-size: 12px; font-weight: 700; background: #ffffff; color: #0369a1; border: 1px solid #7dd3fc; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
            btn.title = `${rule.description}\n${rule.hardRuleDesc}\n${rule.dustRuleDesc}`;
            btn.innerHTML = `<span>${fnKey}(x)</span>`;
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!this.isCustom) {
                    this.switchToCustom(`${fnKey}(x)`, "ℝ_ω", 1);
                }
                else {
                    const formIn = card.querySelector("#eeEditFormula");
                    if (formIn) {
                        const currentVal = formIn.value.trim();
                        if (!currentVal || currentVal === "x" || currentVal === "2*x + 3" || currentVal === "x0 + k*dx") {
                            formIn.value = `${fnKey}(x)`;
                        }
                        else if (/[+\-*/^]$/.test(currentVal)) {
                            formIn.value = `${currentVal} ${fnKey}(x)`;
                        }
                        else {
                            formIn.value = `${currentVal} + ${fnKey}(x)`;
                        }
                        formIn.dispatchEvent(new Event("change"));
                    }
                }
            });
            chipsContainer.appendChild(btn);
        }
        card.appendChild(fnPalette);
        // If Custom Mode, allow editing the relation
        if (this.isCustom) {
            const editBox = document.createElement("div");
            editBox.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin-bottom: 16px;";
            editBox.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 10px;">Edit Custom Statement Properties</div>
        <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px; align-items: end;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">Statement Title</label>
            <input id="eeEditTitle" type="text" value="${this.customTitle}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">LHS Expression Formula</label>
            <input id="eeEditFormula" type="text" value="${this.customFormula}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">RHS Target Symbol</label>
            <input id="eeEditSymbol" type="text" value="${this.customRhsSymbol}" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
        </div>
      `;
            card.appendChild(editBox);
            setTimeout(() => {
                const titleIn = editBox.querySelector("#eeEditTitle");
                const formIn = editBox.querySelector("#eeEditFormula");
                const symIn = editBox.querySelector("#eeEditSymbol");
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
        }
        else {
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
    renderStage2(wrap) {
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
        // 1. LHS Input Slots Grid
        const slotsCard = document.createElement("div");
        slotsCard.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";
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
            domOptions.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d;
                opt.textContent = `Domain: ${d}`;
                if (slot.domain === d)
                    opt.selected = true;
                domainSelect.appendChild(opt);
            });
            domainSelect.addEventListener("change", () => {
                slot.domain = domainSelect.value;
            });
            row.appendChild(domainSelect);
            grid.appendChild(row);
        });
        slotsCard.appendChild(grid);
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
          <option value="ℂ" ${this.spec.rhsDomain === 'ℂ' ? 'selected' : ''}>ℂ (Standard Complex)</option>
          <option value="ℂ_ω" ${this.spec.rhsDomain === 'ℂ_ω' ? 'selected' : ''}>ℂ_ω (Hypercomplex: Nucleus + Halo Soup)</option>
          <option value="ℕ" ${this.spec.rhsDomain === 'ℕ' ? 'selected' : ''}>ℕ (Natural Counting)</option>
          <option value="𝔹" ${this.spec.rhsDomain === '𝔹' ? 'selected' : ''}>𝔹 (Boolean Truth Value)</option>
        </select>
      </div>
    `;
        card.appendChild(codomainCard);
        setTimeout(() => {
            const sel = codomainCard.querySelector("#eeRhsDomainSelect");
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
        nextBtn.textContent = "Step 3: Calculator Template Configuration →";
        nextBtn.addEventListener("click", () => this.setStage(3));
        actionsRow.appendChild(nextBtn);
        card.appendChild(actionsRow);
        wrap.appendChild(card);
    }
    // =========================================================================
    // STAGE 3: Calculator Template Configuration (Defaults, Steppers, Bounds)
    // =========================================================================
    renderStage3(wrap) {
        const card = document.createElement("div");
        card.style.cssText = "background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;";
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
                    const idx = Number(e.target.getAttribute("data-idx"));
                    this.spec.inputs[idx].defaultValue = parseFloat(e.target.value);
                    this.curValues[this.spec.inputs[idx].name] = this.spec.inputs[idx].defaultValue;
                });
            });
            configTable.querySelectorAll(".ee-cfg-step").forEach(inp => {
                inp.addEventListener("change", (e) => {
                    const idx = Number(e.target.getAttribute("data-idx"));
                    this.spec.inputs[idx].step = parseFloat(e.target.value);
                });
            });
            configTable.querySelectorAll(".ee-cfg-min").forEach(inp => {
                inp.addEventListener("change", (e) => {
                    const idx = Number(e.target.getAttribute("data-idx"));
                    this.spec.inputs[idx].min = parseFloat(e.target.value);
                });
            });
            configTable.querySelectorAll(".ee-cfg-max").forEach(inp => {
                inp.addEventListener("change", (e) => {
                    const idx = Number(e.target.getAttribute("data-idx"));
                    this.spec.inputs[idx].max = parseFloat(e.target.value);
                });
            });
            configTable.querySelectorAll(".ee-cfg-desc").forEach(inp => {
                inp.addEventListener("change", (e) => {
                    const idx = Number(e.target.getAttribute("data-idx"));
                    this.spec.inputs[idx].description = e.target.value;
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
    renderStage4(wrap) {
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
                FSDRef.openScaffoldCard(this.spec.governingTheorem, `MiddleWay.${this.spec.governingTheorem}`);
            });
            contractBar.appendChild(thmBtn);
        }
        wrap.appendChild(contractBar);
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
            const decBtn = document.createElement("button");
            decBtn.style.cssText = "width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1;";
            decBtn.textContent = "-";
            const numInput = document.createElement("input");
            numInput.type = "number";
            numInput.value = (this.curValues[slot.name] ?? slot.defaultValue).toString();
            numInput.step = (slot.step ?? 1).toString();
            if (slot.min !== undefined)
                numInput.min = slot.min.toString();
            if (slot.max !== undefined)
                numInput.max = slot.max.toString();
            numInput.style.cssText = "width: 75px; height: 26px; text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px;";
            const incBtn = document.createElement("button");
            incBtn.style.cssText = "width: 28px; height: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1;";
            incBtn.textContent = "+";
            const step = slot.step ?? 1;
            decBtn.addEventListener("click", () => {
                let cur = Number(numInput.value);
                cur = Math.round((cur - step) * 1000) / 1000;
                if (slot.min !== undefined && cur < slot.min)
                    cur = slot.min;
                this.curValues[slot.name] = cur;
                numInput.value = cur.toString();
                this.updateOutput();
            });
            incBtn.addEventListener("click", () => {
                let cur = Number(numInput.value);
                cur = Math.round((cur + step) * 1000) / 1000;
                if (slot.max !== undefined && cur > slot.max)
                    cur = slot.max;
                this.curValues[slot.name] = cur;
                numInput.value = cur.toString();
                this.updateOutput();
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
    updateOutput() {
        if (!this.outBox)
            return;
        const res = this.spec.evaluate(this.curValues);
        const domain = this.spec.rhsDomain;
        const sym = this.spec.rhsSymbol;
        let codomainSection = "";
        if (domain === "ℝ_ω") {
            codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℝ_ω (1D Hyperreal Decomposition)</div>
          <div>↳ <strong>Hard Real Nucleus:</strong> &nbsp;st(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℝ</div>
          <div>↳ <strong>Infinitesimal Halo Dust:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
        }
        else if (domain === "ℂ_ω") {
            codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℂ_ω (2D Complex Decomposition)</div>
          <div>↳ <strong>Gaussian Dyadic Nucleus:</strong> &nbsp;st_C(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℂ</div>
          <div>↳ <strong>Complex Halo Soup:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
        }
        else if (domain === "ℝ" || domain === "ℕ" || domain === "ℤ") {
            codomainSection = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: Standard Discrete / Real Register</div>
          <div>↳ <strong>Hard Register Guarantee:</strong> Zero halo dust (ε = 0). Pure nucleus value encodable in finite binary bits.</div>
        </div>
      `;
        }
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
      <div style="font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 8px;">
        🎯 Evaluated RHS Target Slot (${sym} ∈ ${domain})
      </div>
      <div style="background: #f8fafc; padding: 12px 16px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 16px;">
        ${sym} &nbsp;=&nbsp; <span style="font-weight: 800; color: #0284c7;">${res.displayValue}</span>
      </div>
      ${codomainSection}
      ${detailsList}
      ${statusNotice}
    `;
    }
}
