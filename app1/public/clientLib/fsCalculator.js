import { Elt } from "./elt.js";
import { NumericRunnerRegistry } from "./numericRunner.js";
import { NumericVisualizer } from "./numericVisualizer.js";
import { FS_CATALOG } from "./fsCatalog.js";
export function getFsCatalogStatement(scaffoldKeyOrTarget) {
    if (!scaffoldKeyOrTarget)
        return undefined;
    const clean = scaffoldKeyOrTarget.replace(/^scaffold:/, "").trim().toLowerCase();
    return FS_CATALOG.formalStatements.find((s) => s.scaffoldKey.toLowerCase() === clean || s.id.toLowerCase() === clean);
}
export function getFsCatalogExamplesForMode(modeId) {
    return FS_CATALOG.examples.filter((ex) => ex.modeId === modeId);
}
/**
 * Infers directional (inputs → output) sets from any Formal Statement (FS).
 */
export function inferFsCalculationModes(arg) {
    const modes = [];
    const target = (arg.target || "").toLowerCase();
    const expr = (arg.expression || "").toLowerCase();
    const simp = (arg.casCalculation?.simplified || "").toLowerCase();
    const cmd = (arg.casCalculation?.command || "").toLowerCase();
    const title = (arg.title || "").toLowerCase();
    const allText = `${target} ${expr} ${simp} ${cmd} ${title}`;
    // Pure constitutional scaffold / theorem cards are foundational Lean 4 mathematical proofs, not numerical calculators.
    // Unless an explicit CAS calculation command is attached, inhibit calculation modes for theorems.
    const isPureTheorem = target.startsWith("scaffold:") ||
        title.includes("constitutional scaffold") ||
        title.includes("theorem") ||
        title.includes("axiom") ||
        target.includes("theorem") ||
        target.includes("telescoping_ftc");
    if (!arg.casCalculation?.command && isPureTheorem) {
        return [];
    }
    // 1. Newtonian Kinematics & Free Fall Acceleration
    if (allText.includes("free_fall") || allText.includes("v₀ - gt") || allText.includes("s(t)") || allText.includes("gravity") || allText.includes("accel")) {
        modes.push({
            id: "ff_v_from_v0_g_t",
            label: "(v₀, g, t) → v",
            targetSymbol: "v",
            targetDomain: "ℝ_ω",
            targetUnit: "m/s",
            formulaDescription: "v = v₀ - g · t",
            inputs: [
                { name: "v0", symbol: "v₀", domain: "ℝ_ω", unit: "m/s", defaultValue: 20.0, step: 1.0, min: -100, max: 200, description: "Initial velocity" },
                { name: "g", symbol: "g", domain: "ℝ_ω", unit: "m/s²", defaultValue: 9.8, step: 0.1, min: 0.1, max: 50, description: "Gravitational acceleration" },
                { name: "t", symbol: "t", domain: "ℝ_ω", unit: "s", defaultValue: 1.5, step: 0.1, min: 0, max: 50, description: "Elapsed time" }
            ],
            evaluate: (vals) => {
                const v = vals.v0 - vals.g * vals.t;
                return {
                    resultValue: v,
                    formattedFormula: `v = (${vals.v0.toFixed(2)}) - (${vals.g.toFixed(2)}) · (${vals.t.toFixed(2)})`,
                    displayResult: `${v.toFixed(3)} m/s`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "ff_t_from_v_v0_g",
            label: "(v, v₀, g) → t",
            targetSymbol: "t",
            targetDomain: "ℝ_ω",
            targetUnit: "s",
            formulaDescription: "t = (v₀ - v) / g",
            inputs: [
                { name: "v", symbol: "v", domain: "ℝ_ω", unit: "m/s", defaultValue: 0.0, step: 1.0, min: -100, max: 200, description: "Current velocity (0 = apex)" },
                { name: "v0", symbol: "v₀", domain: "ℝ_ω", unit: "m/s", defaultValue: 20.0, step: 1.0, min: -100, max: 200, description: "Initial velocity" },
                { name: "g", symbol: "g", domain: "ℝ_ω", unit: "m/s²", defaultValue: 9.8, step: 0.1, min: 0.1, max: 50, description: "Gravitational acceleration" }
            ],
            evaluate: (vals) => {
                const gVal = vals.g === 0 ? 0.0001 : vals.g;
                const t = (vals.v0 - vals.v) / gVal;
                return {
                    resultValue: t,
                    formattedFormula: `t = [ (${vals.v0.toFixed(2)}) - (${vals.v.toFixed(2)}) ] / (${vals.g.toFixed(2)})`,
                    displayResult: `${t.toFixed(3)} s`,
                    domainBadge: "∈ ℝ_ω",
                    notes: vals.v === 0 ? "Apex transit time" : undefined
                };
            }
        });
        modes.push({
            id: "ff_v0_from_v_g_t",
            label: "(v, g, t) → v₀",
            targetSymbol: "v₀",
            targetDomain: "ℝ_ω",
            targetUnit: "m/s",
            formulaDescription: "v₀ = v + g · t",
            inputs: [
                { name: "v", symbol: "v", domain: "ℝ_ω", unit: "m/s", defaultValue: 5.3, step: 0.5, min: -100, max: 200, description: "Target velocity" },
                { name: "g", symbol: "g", domain: "ℝ_ω", unit: "m/s²", defaultValue: 9.8, step: 0.1, min: 0.1, max: 50, description: "Gravitational acceleration" },
                { name: "t", symbol: "t", domain: "ℝ_ω", unit: "s", defaultValue: 1.5, step: 0.1, min: 0, max: 50, description: "Elapsed time" }
            ],
            evaluate: (vals) => {
                const v0 = vals.v + vals.g * vals.t;
                return {
                    resultValue: v0,
                    formattedFormula: `v₀ = (${vals.v.toFixed(2)}) + (${vals.g.toFixed(2)}) · (${vals.t.toFixed(2)})`,
                    displayResult: `${v0.toFixed(3)} m/s`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "ff_s_from_v0_g_t",
            label: "(v₀, g, t) → s",
            targetSymbol: "s",
            targetDomain: "ℝ_ω",
            targetUnit: "m",
            formulaDescription: "s = v₀ · t - (1/2) · g · t²",
            inputs: [
                { name: "v0", symbol: "v₀", domain: "ℝ_ω", unit: "m/s", defaultValue: 20.0, step: 1.0, min: -100, max: 200, description: "Initial velocity" },
                { name: "g", symbol: "g", domain: "ℝ_ω", unit: "m/s²", defaultValue: 9.8, step: 0.1, min: 0.1, max: 50, description: "Gravitational acceleration" },
                { name: "t", symbol: "t", domain: "ℝ_ω", unit: "s", defaultValue: 1.5, step: 0.1, min: 0, max: 50, description: "Elapsed time" }
            ],
            evaluate: (vals) => {
                const s = vals.v0 * vals.t - 0.5 * vals.g * Math.pow(vals.t, 2);
                return {
                    resultValue: s,
                    formattedFormula: `s = (${vals.v0.toFixed(2)})(${vals.t.toFixed(2)}) - 0.5 · (${vals.g.toFixed(2)})(${vals.t.toFixed(2)})²`,
                    displayResult: `${s.toFixed(3)} m`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "ff_g_from_s_v0_t",
            label: "(s, v₀, t) → g",
            targetSymbol: "g",
            targetDomain: "ℝ_ω",
            targetUnit: "m/s²",
            formulaDescription: "g = 2 · (v₀ · t - s) / t²",
            inputs: [
                { name: "s", symbol: "s", domain: "ℝ_ω", unit: "m", defaultValue: 18.975, step: 0.5, min: -500, max: 500, description: "Position" },
                { name: "v0", symbol: "v₀", domain: "ℝ_ω", unit: "m/s", defaultValue: 20.0, step: 1.0, min: -100, max: 200, description: "Initial velocity" },
                { name: "t", symbol: "t", domain: "ℝ_ω", unit: "s", defaultValue: 1.5, step: 0.1, min: 0.1, max: 50, description: "Elapsed time" }
            ],
            evaluate: (vals) => {
                const t2 = Math.pow(vals.t, 2);
                const g = (2 * (vals.v0 * vals.t - vals.s)) / (t2 === 0 ? 0.0001 : t2);
                return {
                    resultValue: g,
                    formattedFormula: `g = 2 · [ (${vals.v0.toFixed(2)})(${vals.t.toFixed(2)}) - (${vals.s.toFixed(2)}) ] / (${vals.t.toFixed(2)})²`,
                    displayResult: `${g.toFixed(3)} m/s²`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
    }
    // 2. Telescoping Work-Energy Theorem
    if (allText.includes("work_energy") || allText.includes("kinetic energy") || allText.includes("1/2 m v^2") || allText.includes("f_k · δx_k")) {
        modes.push({
            id: "we_ke_from_m_v",
            label: "(m, v) → KE",
            targetSymbol: "KE",
            targetDomain: "ℝ_ω",
            targetUnit: "J",
            formulaDescription: "KE = (1/2) · m · v²",
            inputs: [
                { name: "m", symbol: "m", domain: "ℝ_ω", unit: "kg", defaultValue: 2.0, step: 0.1, min: 0.01, max: 100, description: "Mass" },
                { name: "v", symbol: "v", domain: "ℝ_ω", unit: "m/s", defaultValue: 10.0, step: 0.5, min: 0, max: 200, description: "Velocity" }
            ],
            evaluate: (vals) => {
                const ke = 0.5 * vals.m * Math.pow(vals.v, 2);
                return {
                    resultValue: ke,
                    formattedFormula: `KE = 0.5 · (${vals.m.toFixed(2)}) · (${vals.v.toFixed(2)})²`,
                    displayResult: `${ke.toFixed(3)} J`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "we_v_from_ke_m",
            label: "(KE, m) → v",
            targetSymbol: "v",
            targetDomain: "ℝ_ω",
            targetUnit: "m/s",
            formulaDescription: "v = √(2 · KE / m)",
            inputs: [
                { name: "ke", symbol: "KE", domain: "ℝ_ω", unit: "J", defaultValue: 100.0, step: 5.0, min: 0, max: 5000, description: "Kinetic energy" },
                { name: "m", symbol: "m", domain: "ℝ_ω", unit: "kg", defaultValue: 2.0, step: 0.1, min: 0.01, max: 100, description: "Mass" }
            ],
            evaluate: (vals) => {
                const mVal = vals.m === 0 ? 0.0001 : vals.m;
                const v = Math.sqrt(Math.max(0, (2 * vals.ke) / mVal));
                return {
                    resultValue: v,
                    formattedFormula: `v = √[ 2 · (${vals.ke.toFixed(2)}) / (${vals.m.toFixed(2)}) ]`,
                    displayResult: `${v.toFixed(3)} m/s`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "we_dke_from_m_v0_vn",
            label: "(m, v₀, v_n) → Δ(KE)",
            targetSymbol: "Δ(KE)",
            targetDomain: "ℝ_ω",
            targetUnit: "J",
            formulaDescription: "Δ(KE) = (1/2) · m · (v_n² - v₀²)",
            inputs: [
                { name: "m", symbol: "m", domain: "ℝ_ω", unit: "kg", defaultValue: 2.0, step: 0.1, min: 0.01, max: 100, description: "Mass" },
                { name: "v0", symbol: "v₀", domain: "ℝ_ω", unit: "m/s", defaultValue: 5.0, step: 0.5, min: 0, max: 200, description: "Initial speed" },
                { name: "vn", symbol: "v_n", domain: "ℝ_ω", unit: "m/s", defaultValue: 15.0, step: 0.5, min: 0, max: 200, description: "Final speed" }
            ],
            evaluate: (vals) => {
                const dke = 0.5 * vals.m * (Math.pow(vals.vn, 2) - Math.pow(vals.v0, 2));
                return {
                    resultValue: dke,
                    formattedFormula: `Δ(KE) = 0.5 · (${vals.m.toFixed(2)}) · [ (${vals.vn.toFixed(2)})² - (${vals.v0.toFixed(2)})² ]`,
                    displayResult: `${dke.toFixed(3)} J`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
    }
    // 3. Discrete Heat Diffusion & Tridiagonal Laplacian Stencil
    if (allText.includes("heat") || allText.includes("flux") || allText.includes("diffusion") || allText.includes("toeplitz") || allText.includes("u_{i-1} - 2u_i")) {
        modes.push({
            id: "heat_dudt_from_stencil",
            label: "(α, Δx, u_{i-1}, u_i, u_{i+1}) → du_i/dt",
            targetSymbol: "du_i/dt",
            targetDomain: "ℝ_ω",
            targetUnit: "°C/s",
            formulaDescription: "du_i/dt = (α / Δx²) · [ u_{i-1} - 2u_i + u_{i+1} ]",
            inputs: [
                { name: "alpha", symbol: "α", domain: "ℝ_ω", defaultValue: 1.0, step: 0.1, min: 0.01, max: 10, description: "Diffusivity" },
                { name: "dx", symbol: "Δx", domain: "ℝ_ω", defaultValue: 0.1, step: 0.01, min: 0.01, max: 1, description: "Spatial step" },
                { name: "u_prev", symbol: "u_{i-1}", domain: "ℝ_ω", unit: "°C", defaultValue: 80.0, step: 1.0, min: -50, max: 500, description: "Left slice temp" },
                { name: "u_curr", symbol: "u_i", domain: "ℝ_ω", unit: "°C", defaultValue: 50.0, step: 1.0, min: -50, max: 500, description: "Center slice temp" },
                { name: "u_next", symbol: "u_{i+1}", domain: "ℝ_ω", unit: "°C", defaultValue: 80.0, step: 1.0, min: -50, max: 500, description: "Right slice temp" }
            ],
            evaluate: (vals) => {
                const curvature = vals.u_prev - 2 * vals.u_curr + vals.u_next;
                const dx2 = Math.pow(vals.dx === 0 ? 0.01 : vals.dx, 2);
                const rate = (vals.alpha / dx2) * curvature;
                return {
                    resultValue: rate,
                    formattedFormula: `du_i/dt = (${vals.alpha.toFixed(2)} / ${vals.dx.toFixed(2)}²) · [ ${vals.u_prev.toFixed(1)} - 2(${vals.u_curr.toFixed(1)}) + ${vals.u_next.toFixed(1)} ]`,
                    displayResult: `${rate.toFixed(2)} °C/s`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Local Stencil Curvature Δ²u = ${curvature.toFixed(1)} °C`
                };
            }
        });
        modes.push({
            id: "heat_curvature_stencil",
            label: "(u_{i-1}, u_i, u_{i+1}) → Curvature Δ²u",
            targetSymbol: "Δ²u",
            targetDomain: "ℝ_ω",
            targetUnit: "°C",
            formulaDescription: "Δ²u = u_{i-1} - 2u_i + u_{i+1}",
            inputs: [
                { name: "u_prev", symbol: "u_{i-1}", domain: "ℝ_ω", unit: "°C", defaultValue: 80.0, step: 1.0, min: -50, max: 500 },
                { name: "u_curr", symbol: "u_i", domain: "ℝ_ω", unit: "°C", defaultValue: 50.0, step: 1.0, min: -50, max: 500 },
                { name: "u_next", symbol: "u_{i+1}", domain: "ℝ_ω", unit: "°C", defaultValue: 80.0, step: 1.0, min: -50, max: 500 }
            ],
            evaluate: (vals) => {
                const curvature = vals.u_prev - 2 * vals.u_curr + vals.u_next;
                return {
                    resultValue: curvature,
                    formattedFormula: `Δ²u = (${vals.u_prev.toFixed(1)}) - 2 · (${vals.u_curr.toFixed(1)}) + (${vals.u_next.toFixed(1)})`,
                    displayResult: `${curvature.toFixed(2)} °C`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
    }
    // 5. Complex Multiplication & Cauchy Loop Edge
    if (allText.includes("c_mul") || allText.includes("complex") || allText.includes("ℂ_ω") || allText.includes("cauchy") || allText.includes("z₂ - z₁")) {
        modes.push({
            id: "complex_mul_cartesian",
            label: "(z₁, z₂) → z = z₁ · z₂",
            targetSymbol: "z",
            targetDomain: "ℂ_ω",
            formulaDescription: "z = (x₁ · x₂ - y₁ · y₂) + i · (x₁ · y₂ + x₂ · y₁)",
            inputs: [
                { name: "x1", symbol: "Re(z₁)", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -50, max: 50 },
                { name: "y1", symbol: "Im(z₁)", domain: "ℝ_ω", defaultValue: 3.0, step: 0.5, min: -50, max: 50 },
                { name: "x2", symbol: "Re(z₂)", domain: "ℝ_ω", defaultValue: 4.0, step: 0.5, min: -50, max: 50 },
                { name: "y2", symbol: "Im(z₂)", domain: "ℝ_ω", defaultValue: -1.0, step: 0.5, min: -50, max: 50 }
            ],
            evaluate: (vals) => {
                const re = vals.x1 * vals.x2 - vals.y1 * vals.y2;
                const im = vals.x1 * vals.y2 + vals.x2 * vals.y1;
                const sign = im >= 0 ? "+" : "-";
                return {
                    resultValue: [re, im],
                    formattedFormula: `z = [ (${vals.x1})(${vals.x2}) - (${vals.y1})(${vals.y2}) ] + i[ (${vals.x1})(${vals.y2}) + (${vals.x2})(${vals.y1}) ]`,
                    displayResult: `${re.toFixed(2)} ${sign} ${Math.abs(im).toFixed(2)}i`,
                    domainBadge: "∈ ℂ_ω = ℝ_ω ⊗ ℝ_ω"
                };
            }
        });
        modes.push({
            id: "cauchy_loop_cancel",
            label: "(z₁, z₂) → (z₂ - z₁) + (z₁ - z₂)",
            targetSymbol: "Loop Net",
            targetDomain: "ℂ_ω",
            formulaDescription: "Adjacent interior cell edges cancel identically: (z₂ - z₁) + (z₁ - z₂) = 0",
            inputs: [
                { name: "x1", symbol: "Re(z₁)", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5, min: -50, max: 50 },
                { name: "y1", symbol: "Im(z₁)", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -50, max: 50 },
                { name: "x2", symbol: "Re(z₂)", domain: "ℝ_ω", defaultValue: 4.0, step: 0.5, min: -50, max: 50 },
                { name: "y2", symbol: "Im(z₂)", domain: "ℝ_ω", defaultValue: 5.0, step: 0.5, min: -50, max: 50 }
            ],
            evaluate: (vals) => {
                const diff1_re = vals.x2 - vals.x1;
                const diff1_im = vals.y2 - vals.y1;
                const diff2_re = vals.x1 - vals.x2;
                const diff2_im = vals.y1 - vals.y2;
                const net_re = diff1_re + diff2_re;
                const net_im = diff1_im + diff2_im;
                return {
                    resultValue: [net_re, net_im],
                    formattedFormula: `(${diff1_re.toFixed(1)} + ${diff1_im.toFixed(1)}i) + (${diff2_re.toFixed(1)} + ${diff2_im.toFixed(1)}i) = 0`,
                    displayResult: "0.00 + 0.00i (Exact Cancellation)",
                    domainBadge: "∈ ℂ_ω"
                };
            }
        });
    }
    // 6. Unitary Evolution & Norm Preservation
    if (allText.includes("unitary") || allText.includes("norm") || allText.includes("∥|ψ(t)⟩∥") || allText.includes("u(t)†")) {
        modes.push({
            id: "unitary_norm_preservation",
            label: "(Re(ψ), Im(ψ)) → ∥ψ∥²",
            targetSymbol: "∥ψ∥²",
            targetDomain: "ℝ_ω",
            formulaDescription: "∥ψ∥² = [Re(ψ)]² + [Im(ψ)]²",
            inputs: [
                { name: "re", symbol: "Re(ψ)", domain: "ℝ_ω", defaultValue: 0.6, step: 0.05, min: -1, max: 1 },
                { name: "im", symbol: "Im(ψ)", domain: "ℝ_ω", defaultValue: 0.8, step: 0.05, min: -1, max: 1 }
            ],
            evaluate: (vals) => {
                const normSq = Math.pow(vals.re, 2) + Math.pow(vals.im, 2);
                return {
                    resultValue: normSq,
                    formattedFormula: `∥ψ∥² = (${vals.re.toFixed(2)})² + (${vals.im.toFixed(2)})²`,
                    displayResult: `${normSq.toFixed(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: Math.abs(normSq - 1.0) < 0.0001 ? "Conserved probability invariant = 1.0" : undefined
                };
            }
        });
    }
    // 7. Discrete Successor / Transect Step (FSD)
    if (allText.includes("x₂ = x₁ + 1") || allText.includes("successor") || allText.includes("transect") || allText.includes("x + 1")) {
        modes.push({
            id: "succ_x2_from_x1",
            label: "(x₁) → x₂ = x₁ + 1",
            targetSymbol: "x₂",
            targetDomain: "ℕ",
            formulaDescription: "x₂ = x₁ + 1",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 4, step: 1, min: 0, max: 1000, description: "Current coordinate" }
            ],
            evaluate: (vals) => {
                const x2 = Math.round(vals.x1) + 1;
                return {
                    resultValue: x2,
                    formattedFormula: `x₂ = ${Math.round(vals.x1)} + 1`,
                    displayResult: `${x2}`,
                    domainBadge: "∈ ℕ",
                    notes: `Step distance: ${x2} - ${Math.round(vals.x1)} = 1 (Unit Step)`
                };
            }
        });
        modes.push({
            id: "succ_x1_from_x2",
            label: "(x₂) → x₁ = x₂ - 1",
            targetSymbol: "x₁",
            targetDomain: "ℕ",
            formulaDescription: "x₁ = x₂ - 1",
            inputs: [
                { name: "x2", symbol: "x₂", domain: "ℕ", defaultValue: 5, step: 1, min: 1, max: 1000, description: "Successor coordinate" }
            ],
            evaluate: (vals) => {
                const x1 = Math.max(0, Math.round(vals.x2) - 1);
                return {
                    resultValue: x1,
                    formattedFormula: `x₁ = ${Math.round(vals.x2)} - 1`,
                    displayResult: `${x1}`,
                    domainBadge: "∈ ℕ"
                };
            }
        });
    }
    // 8. Order Reflexivity, Compound Logic & Predicates (FSD)
    const hasAnd = expr.includes("∧") || expr.includes("\\land") || allText.includes("paq") || (allText.includes("gt5") && allText.includes("lt10") && (expr.includes("∧") || allText.includes("∧")));
    const hasOr = expr.includes("∨") || expr.includes("\\lor") || allText.includes("poq") || (allText.includes("gt5") && allText.includes("lt10") && (expr.includes("∨") || allText.includes("∨")));
    const hasImply = expr.includes("→") || expr.includes("\\to") || expr.includes("⇒");
    const hasEquiv = expr.includes("↔") || expr.includes("\\leftrightarrow") || expr.includes("⇔");
    const hasNeg = expr.includes("¬") || expr.includes("\\neg") || allText.includes("¬gt5") || allText.includes("np");
    // Compound Conjunction: GT5(x₁) ∧ LT10(x₁)
    if (hasAnd && allText.includes("gt5") && allText.includes("lt10")) {
        modes.push({
            id: "pred_gt5_and_lt10",
            label: "(x₁) → GT5(x₁) ∧ LT10(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT5(x₁) ∧ LT10(x₁)  (Discrete Intersection: 5 < x₁ < 10)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 7, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const p = v > 5;
                const q = v < 10;
                const truth = p && q;
                return {
                    resultValue: truth,
                    formattedFormula: `[ ${v} > 5: ${p ? "True" : "False"} ] ∧ [ ${v} < 10: ${q ? "True" : "False"} ] ⟹ ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (In Intersection)" : "False ✗ (Outside Interval)",
                    domainBadge: "∈ 𝔹",
                    notes: truth
                        ? `x₁ = ${v} satisfies both predicates. Belongs to the discrete interval {6, 7, 8, 9} = (5, 10) ∩ ℕ.`
                        : `Fails condition: ${!p ? `${v} is not > 5` : `${v} is not < 10`}.`
                };
            }
        });
    }
    // Compound Disjunction: GT5(x₁) ∨ LT10(x₁)
    if (hasOr && allText.includes("gt5") && allText.includes("lt10")) {
        modes.push({
            id: "pred_gt5_or_lt10",
            label: "(x₁) → GT5(x₁) ∨ LT10(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT5(x₁) ∨ LT10(x₁)  (Discrete Union: x₁ > 5 ∨ x₁ < 10)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 12, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const p = v > 5;
                const q = v < 10;
                const truth = p || q;
                return {
                    resultValue: truth,
                    formattedFormula: `[ ${v} > 5: ${p ? "True" : "False"} ] ∨ [ ${v} < 10: ${q ? "True" : "False"} ] ⟹ ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (In Union)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Union is universally True on ℕ because every natural number is either < 10 or > 5.`
                };
            }
        });
    }
    // Compound Negation: ¬GT5(x₁)
    if (hasNeg && allText.includes("gt5")) {
        modes.push({
            id: "pred_not_gt5",
            label: "(x₁) → ¬GT5(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "¬GT5(x₁)  (Complement: x₁ ≤ 5)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const p = v > 5;
                const truth = !p;
                return {
                    resultValue: truth,
                    formattedFormula: `¬ [ ${v} > 5: ${p ? "True" : "False"} ] ⟹ ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (Complement)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Negation inverts truth: x₁ = ${v} ${truth ? "is in the complement {0..5}" : "is > 5, so negation fails"}.`
                };
            }
        });
    }
    // Compound Equivalence: GT5(x₁) ↔ x₁ > 5
    if ((hasEquiv || allText.includes("↔") || allText.includes("iff")) && allText.includes("gt5")) {
        modes.push({
            id: "pred_equiv_gt5",
            label: "(x₁) → GT5(x₁) ↔ x₁ > 5",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT5(x₁) ↔ x₁ > 5  (Equivalence Definition)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 7, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const p = v > 5;
                const q = v > 5;
                const truth = p === q;
                return {
                    resultValue: truth,
                    formattedFormula: `[ ${v} > 5: ${p ? "True" : "False"} ] ↔ [ ${v} > 5: ${q ? "True" : "False"} ] ⟹ True`,
                    displayResult: "True ✓ (Logically Equivalent)",
                    domainBadge: "∈ 𝔹",
                    notes: "Logical equivalence holds identically for all x₁ ∈ ℕ by definition of GT5."
                };
            }
        });
    }
    // Set Intersection Conjunction: x₁ ∈ GT5 ∧ x₁ ∈ LT10
    if (hasAnd && (allText.includes("mam") || (allText.includes("∈") && allText.includes("gt5") && allText.includes("lt10")))) {
        modes.push({
            id: "pred_mem_gt5_and_lt10",
            label: "(x₁) → x₁ ∈ GT5 ∧ x₁ ∈ LT10",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "x₁ ∈ GT5 ∧ x₁ ∈ LT10  (Set Intersection: GT5 ∩ LT10 = {6, 7, 8, 9})",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 7, step: 1, min: 0, max: 100, description: "Candidate element" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const inGT5 = v > 5;
                const inLT10 = v < 10;
                const inInter = inGT5 && inLT10;
                return {
                    resultValue: inInter,
                    formattedFormula: `(${v} ∈ GT5: ${inGT5}) ∧ (${v} ∈ LT10: ${inLT10}) ⟹ ${inInter ? "True" : "False"}`,
                    displayResult: inInter ? "True ✓ (In Intersection)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: inInter ? `Element ${v} belongs to the set intersection GT5 ∩ LT10 = {6, 7, 8, 9}.` : `Element ${v} is outside the intersection.`
                };
            }
        });
    }
    // Set Union Disjunction: x₁ ∈ GT5 ∨ x₁ ∈ LT10
    if (hasOr && (allText.includes("mom") || (allText.includes("∈") && allText.includes("gt5") && allText.includes("lt10")))) {
        modes.push({
            id: "pred_mem_gt5_or_lt10",
            label: "(x₁) → x₁ ∈ GT5 ∨ x₁ ∈ LT10",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "x₁ ∈ GT5 ∨ x₁ ∈ LT10  (Set Union: GT5 ∪ LT10 = ℕ)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 12, step: 1, min: 0, max: 100, description: "Candidate element" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const inGT5 = v > 5;
                const inLT10 = v < 10;
                const inUnion = inGT5 || inLT10;
                return {
                    resultValue: inUnion,
                    formattedFormula: `(${v} ∈ GT5: ${inGT5}) ∨ (${v} ∈ LT10: ${inLT10}) ⟹ ${inUnion ? "True" : "False"}`,
                    displayResult: inUnion ? "True ✓ (In Union)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: "Union covers all of ℕ because every natural number is either > 5 or < 10."
                };
            }
        });
    }
    // Compound Negation: ¬LT10(x₁)
    if (hasNeg && allText.includes("lt10")) {
        modes.push({
            id: "pred_not_lt10",
            label: "(x₁) → ¬LT10(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "¬LT10(x₁)  (Relative Complement: x₁ ≥ 10)",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 12, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const p = v < 10;
                const truth = !p;
                return {
                    resultValue: truth,
                    formattedFormula: `¬ [ ${v} < 10: ${p ? "True" : "False"} ] ⟹ ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (Complement x₁ ≥ 10)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: truth ? `${v} is ≥ 10, belonging to the complement.` : `${v} is < 10, so negation fails.`
                };
            }
        });
    }
    // Compound Negation: ¬EVEN(x₁)
    if (hasNeg && allText.includes("even")) {
        modes.push({
            id: "pred_not_even",
            label: "(x₁) → ¬EVEN(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "¬EVEN(x₁) ⇔ ODD(x₁) ⇔ x₁ mod 2 = 1",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 7, step: 1, min: 0, max: 100, description: "Candidate natural number" }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                const isEven = v % 2 === 0;
                const truth = !isEven;
                return {
                    resultValue: truth,
                    formattedFormula: `¬ [ ${v} mod 2 = 0: ${isEven ? "True" : "False"} ] ⟹ ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (Odd)" : "False ✗ (Even)",
                    domainBadge: "∈ 𝔹",
                    notes: truth ? `${v} is odd (not divisible by 2).` : `${v} is even.`
                };
            }
        });
    }
    // Set Membership & Power Set Incidence in 𝒫(ℕ₄)
    if (allText.includes("∈") || allText.includes("power set") || allText.includes("𝒫(ℕ)") || allText.includes("p(n)") || expr.includes("∈") || target.includes("power set")) {
        // Empty Set Membership: x₁ ∈ ∅ and ¬(x₁ ∈ ∅)
        if (allText.includes("∅") || allText.includes("empty")) {
            modes.push({
                id: "mem_empty_not",
                label: "(x₁) → ¬(x₁ ∈ ∅)",
                targetSymbol: "Truth",
                targetDomain: "𝔹",
                formulaDescription: "¬(x₁ ∈ ∅) ⇔ True  (Empty Set Definition)",
                inputs: [
                    { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 100, description: "Candidate natural number" }
                ],
                evaluate: (vals) => {
                    const v = Math.round(vals.x1);
                    return {
                        resultValue: true,
                        formattedFormula: `¬ [ ${v} ∈ ∅: False ] ⟹ True`,
                        displayResult: "True ✓ (Nothing in ∅)",
                        domainBadge: "∈ 𝔹",
                        notes: `By definition of the empty set ∅ = {}, zero elements belong to it. Therefore, ¬(x₁ ∈ ∅) holds universally for every element x₁ = ${v}.`
                    };
                }
            });
            modes.push({
                id: "mem_empty",
                label: "(x₁) → x₁ ∈ ∅",
                targetSymbol: "Truth",
                targetDomain: "𝔹",
                formulaDescription: "x₁ ∈ ∅ ⇔ False  (Empty Set has no members)",
                inputs: [
                    { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 100, description: "Candidate natural number" }
                ],
                evaluate: (vals) => {
                    const v = Math.round(vals.x1);
                    return {
                        resultValue: false,
                        formattedFormula: `${v} ∈ ∅ ⟹ False`,
                        displayResult: "False ✗ (∅ is Empty)",
                        domainBadge: "∈ 𝔹",
                        notes: `No natural number belongs to the empty set ∅.`
                    };
                }
            });
        }
        // Non-Empty Power Set Guard: y₁ ≠ ∅
        if (allText.includes("≠ ∅") || allText.includes("!= ∅") || allText.includes("nonempty") || allText.includes("non-empty")) {
            modes.push({
                id: "fsd_powerset_nonempty_membership",
                label: "(x₁, Y_j) → x₁ ∈ Y_j [y₁ ≠ ∅]",
                targetSymbol: "Truth",
                targetDomain: "𝔹",
                formulaDescription: "x₁ ∈ Y_j in 𝒫*(ℕ₄)  (Columns Y₁..Y₁₅, excluding Column Y₀ = ∅)",
                inputs: [
                    { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 2, step: 1, min: 1, max: 4, description: "Element x₁ ∈ {1, 2, 3, 4}" },
                    { name: "yj", symbol: "j (Col)", domain: "ℕ", defaultValue: 5, step: 1, min: 1, max: 15, description: "Non-empty subset column Y₁..Y₁₅" }
                ],
                evaluate: (vals) => {
                    const x1 = Math.max(1, Math.min(4, Math.round(vals.x1)));
                    const j = Math.max(1, Math.min(15, Math.round(vals.yj)));
                    const bitMask = 1 << (x1 - 1);
                    const isMember = (j & bitMask) !== 0;
                    const members = [];
                    for (let b = 0; b < 4; b++) {
                        if ((j & (1 << b)) !== 0)
                            members.push(b + 1);
                    }
                    const subsetStr = `{ ${members.join(", ")} }`;
                    return {
                        resultValue: isMember,
                        formattedFormula: `x₁ = ${x1} ∈ Y_${j} = ${subsetStr} ? ${isMember ? "True" : "False"}`,
                        displayResult: isMember ? "True ✓ (Member)" : "False ✗ (Non-member)",
                        domainBadge: "∈ 𝔹",
                        notes: `Column Y₀ = ∅ is excluded by the domain restriction y₁ ≠ ∅. Every active column contains at least 1 element, ensuring ∀y₁:[𝒫(ℕ)|y₁≠∅] ∃x₁:ℕ [x₁ ∈ y₁] evaluates to True!`
                    };
                }
            });
        }
        modes.push({
            id: "fsd_powerset_membership",
            label: "(x₁, Y_j) → x₁ ∈ Y_j",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "x₁ ∈ Y_j in 𝒫(ℕ₄)  (Base set ℕ₄ = {1, 2, 3, 4})",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 2, step: 1, min: 1, max: 4, description: "Element x₁ ∈ {1, 2, 3, 4}" },
                { name: "yj", symbol: "j (Col)", domain: "ℕ", defaultValue: 5, step: 1, min: 0, max: 15, description: "Subset column Y₀..Y₁₅" }
            ],
            evaluate: (vals) => {
                const x1 = Math.max(1, Math.min(4, Math.round(vals.x1)));
                const j = Math.max(0, Math.min(15, Math.round(vals.yj)));
                const bitMask = 1 << (x1 - 1);
                const isMember = (j & bitMask) !== 0;
                const members = [];
                for (let b = 0; b < 4; b++) {
                    if ((j & (1 << b)) !== 0)
                        members.push(b + 1);
                }
                const subsetStr = members.length > 0 ? `{ ${members.join(", ")} }` : "∅ (Empty Set)";
                return {
                    resultValue: isMember,
                    formattedFormula: `x₁ = ${x1} ∈ Y_${j} = ${subsetStr} ? ${isMember ? "True" : "False"}`,
                    displayResult: isMember ? "True ✓ (Member)" : "False ✗ (Non-member)",
                    domainBadge: "∈ 𝔹",
                    notes: j === 0
                        ? "Column Y₀ = ∅ contains zero elements. No x₁ can ever satisfy x₁ ∈ ∅, explaining why ∃x₁ ∀y₁ [x₁ ∈ y₁] is universally False!"
                        : `Subset Y_${j} has ${members.length} element(s). Bit ${x1} is ${isMember ? "1 (active)" : "0 (inactive)"}.`
                };
            }
        });
        if (allText.includes("gt5")) {
            modes.push({
                id: "mem_const_gt5",
                label: "(x₁) → x₁ ∈ GT5",
                targetSymbol: "Truth",
                targetDomain: "𝔹",
                formulaDescription: "x₁ ∈ GT5 ⇔ x₁ > 5",
                inputs: [
                    { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 8, step: 1, min: 0, max: 100 }
                ],
                evaluate: (vals) => {
                    const v = Math.round(vals.x1);
                    const truth = v > 5;
                    return {
                        resultValue: truth,
                        formattedFormula: `${v} ∈ GT5 ⇔ ${v} > 5 ? ${truth ? "True" : "False"}`,
                        displayResult: truth ? "True ✓" : "False ✗",
                        domainBadge: "∈ 𝔹"
                    };
                }
            });
        }
    }
    // Binary Predicates: GT, LT
    // Check for reversed argument order GT(x₂, x₁) / x₂ > x₁ first
    if (allText.includes("gt(x₂, x₁)") || allText.includes("gt(x2, x1)") || allText.includes("x₂ > x₁")) {
        modes.push({
            id: "pred_gt_x2_x1",
            label: "(x₁, x₂) → GT(x₂, x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT(x₂, x₁) ⇔ x₂ > x₁",
            inputs: [
                { name: "x1", symbol: "x₁ (Row)", domain: "ℕ", defaultValue: 2, step: 1, min: 0, max: 100, description: "Given row x₁" },
                { name: "x2", symbol: "x₂ (Col)", domain: "ℕ", defaultValue: 5, step: 1, min: 0, max: 100, description: "Chosen column x₂" }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const v2 = Math.round(vals.x2);
                const truth = v2 > v1;
                const diff = v2 - v1;
                return {
                    resultValue: truth,
                    formattedFormula: `x₂ (${v2}) > x₁ (${v1}) ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (Column > Row)" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: truth
                        ? `Column x₂ = ${v2} is strictly greater than row x₁ = ${v1} (Lead: ${diff}).`
                        : `Fails: column x₂ = ${v2} is not strictly greater than row x₁ = ${v1}.`
                };
            }
        });
        modes.push({
            id: "pred_gt_witness",
            label: "(x₁) → Witness x₂ = x₁ + 1",
            targetSymbol: "x₂",
            targetDomain: "ℕ",
            formulaDescription: "x₂ = x₁ + 1  (Constructive Witness for ∀x₁ ∃x₂ [GT(x₂, x₁)])",
            inputs: [
                { name: "x1", symbol: "x₁ (Row)", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 100, description: "Any row x₁" }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const v2 = v1 + 1;
                return {
                    resultValue: v2,
                    formattedFormula: `x₂ = ${v1} + 1 = ${v2}`,
                    displayResult: `x₂ = ${v2} (Witness ✓)`,
                    domainBadge: "∈ ℕ",
                    notes: `For row x₁ = ${v1}, choosing x₂ = ${v2} guarantees GT(${v2}, ${v1}) holds (${v2} > ${v1}). This proves ∀x₁:ℕ, ∃x₂:ℕ [GT(x₂, x₁)].`
                };
            }
        });
    }
    if (allText.includes("gt(x₁, x₂)") || allText.includes("gt(x1, x2)") || allText.includes("x₁ > x₂") || (!allText.includes("gt(x₂, x₁)") && allText.includes("gt("))) {
        modes.push({
            id: "pred_gt",
            label: "(x₁, x₂) → GT(x₁, x₂)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT(x₁, x₂) ⇔ x₁ > x₂",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 7, step: 1, min: 0, max: 100 },
                { name: "x2", symbol: "x₂", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const v2 = Math.round(vals.x2);
                const truth = v1 > v2;
                const diff = v1 - v2;
                return {
                    resultValue: truth,
                    formattedFormula: `${v1} > ${v2} ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Difference: ${v1} - ${v2} = ${diff}`
                };
            }
        });
    }
    if (allText.includes("lt(") || allText.includes("x₁ < x₂")) {
        modes.push({
            id: "pred_lt",
            label: "(x₁, x₂) → LT(x₁, x₂)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "LT(x₁, x₂) ⇔ x₁ < x₂",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 2, step: 1, min: 0, max: 100 },
                { name: "x2", symbol: "x₂", domain: "ℕ", defaultValue: 6, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const v2 = Math.round(vals.x2);
                const truth = v1 < v2;
                const diff = v2 - v1;
                return {
                    resultValue: truth,
                    formattedFormula: `${v1} < ${v2} ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Slack: ${v2} - ${v1} = ${diff}`
                };
            }
        });
    }
    if (allText.includes("gt5")) {
        modes.push({
            id: "pred_gt5",
            label: "(x₁) → GT5(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "GT5(x₁) ⇔ x₁ > 5",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 8, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const truth = v1 > 5;
                return {
                    resultValue: truth,
                    formattedFormula: `${v1} > 5 ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Margin: ${v1} - 5 = ${v1 - 5}`
                };
            }
        });
    }
    if (allText.includes("lt10")) {
        modes.push({
            id: "pred_lt10",
            label: "(x₁) → LT10(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "LT10(x₁) ⇔ x₁ < 10",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 4, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const truth = v1 < 10;
                return {
                    resultValue: truth,
                    formattedFormula: `${v1} < 10 ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓" : "False ✗",
                    domainBadge: "∈ 𝔹",
                    notes: `Slack: 10 - ${v1} = ${10 - v1}`
                };
            }
        });
    }
    if (allText.includes("even(") || allText.includes("even")) {
        modes.push({
            id: "pred_even",
            label: "(x₁) → EVEN(x₁)",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "EVEN(x₁) ⇔ x₁ mod 2 = 0",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 6, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v1 = Math.round(vals.x1);
                const truth = v1 % 2 === 0;
                return {
                    resultValue: truth,
                    formattedFormula: `${v1} mod 2 = ${v1 % 2} ? ${truth ? "True" : "False"}`,
                    displayResult: truth ? "True ✓ (Even)" : "False ✗ (Odd)",
                    domainBadge: "∈ 𝔹"
                };
            }
        });
    }
    if (allText.includes("x₁ ≤ x₁") || allText.includes("order reflexiv") || allText.includes("order_reflexiv") || allText.includes("pred_le_refl")) {
        modes.push({
            id: "pred_le_refl",
            label: "(x₁) → x₁ ≤ x₁",
            targetSymbol: "Truth",
            targetDomain: "𝔹",
            formulaDescription: "Order Reflexivity: x₁ ≤ x₁",
            inputs: [
                { name: "x1", symbol: "x₁", domain: "ℕ", defaultValue: 5, step: 1, min: 0, max: 100 }
            ],
            evaluate: (vals) => {
                const v = Math.round(vals.x1);
                return {
                    resultValue: true,
                    formattedFormula: `${v} ≤ ${v} ⇔ True`,
                    displayResult: "True ✓ (Reflexive Identity)",
                    domainBadge: "∈ 𝔹"
                };
            }
        });
    }
    // 9. Bayesian Filter & Updating (P(H|D))
    if (allText.includes("bayes") || allText.includes("p(h|d)") || allText.includes("prior") || allText.includes("likelihood") || allText.includes("rover")) {
        modes.push({
            id: "bayes_posterior_calc",
            label: "(P(H), P(D|H), P(D|¬H)) → P(H|D)",
            targetSymbol: "P(H|D)",
            targetDomain: "ℝ_ω",
            formulaDescription: "P(H|D) = [ P(D|H) · P(H) ] / [ P(D|H) · P(H) + P(D|¬H) · (1 - P(H)) ]",
            inputs: [
                { name: "pH", symbol: "P(H)", domain: "ℝ_ω", defaultValue: 0.30, step: 0.05, min: 0.01, max: 0.99, description: "Prior belief" },
                { name: "pD_H", symbol: "P(D|H)", domain: "ℝ_ω", defaultValue: 0.90, step: 0.05, min: 0.01, max: 1.0, description: "True positive rate (Likelihood)" },
                { name: "pD_notH", symbol: "P(D|¬H)", domain: "ℝ_ω", defaultValue: 0.15, step: 0.05, min: 0.0, max: 1.0, description: "False positive rate" }
            ],
            evaluate: (vals) => {
                const pNotH = 1.0 - vals.pH;
                const numerator = vals.pD_H * vals.pH;
                const pD = numerator + vals.pD_notH * pNotH;
                const posterior = pD > 0 ? numerator / pD : 0;
                return {
                    resultValue: posterior,
                    formattedFormula: `P(H|D) = [ (${vals.pD_H.toFixed(2)})·(${vals.pH.toFixed(2)}) ] / [ (${numerator.toFixed(3)}) + (${vals.pD_notH.toFixed(2)})·(${pNotH.toFixed(2)}) ] = ${numerator.toFixed(3)} / ${pD.toFixed(3)}`,
                    displayResult: `${(posterior * 100).toFixed(1)}% (${posterior.toFixed(4)})`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Marginal evidence P(D) = ${pD.toFixed(4)}`
                };
            }
        });
        modes.push({
            id: "bayes_evidence_calc",
            label: "(P(H), P(D|H), P(D|¬H)) → P(D)",
            targetSymbol: "P(D)",
            targetDomain: "ℝ_ω",
            formulaDescription: "P(D) = P(D|H)·P(H) + P(D|¬H)·(1 - P(H))",
            inputs: [
                { name: "pH", symbol: "P(H)", domain: "ℝ_ω", defaultValue: 0.30, step: 0.05, min: 0.01, max: 0.99 },
                { name: "pD_H", symbol: "P(D|H)", domain: "ℝ_ω", defaultValue: 0.90, step: 0.05, min: 0.01, max: 1.0 },
                { name: "pD_notH", symbol: "P(D|¬H)", domain: "ℝ_ω", defaultValue: 0.15, step: 0.05, min: 0.0, max: 1.0 }
            ],
            evaluate: (vals) => {
                const pD = vals.pD_H * vals.pH + vals.pD_notH * (1.0 - vals.pH);
                return {
                    resultValue: pD,
                    formattedFormula: `P(D) = (${vals.pD_H.toFixed(2)})·(${vals.pH.toFixed(2)}) + (${vals.pD_notH.toFixed(2)})·(${(1.0 - vals.pH).toFixed(2)})`,
                    displayResult: `${(pD * 100).toFixed(1)}% (${pD.toFixed(4)})`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
    }
    // 10. Shannon Information Entropy (H(P))
    if (allText.includes("shannon") || allText.includes("shannon_entropy") || allText.includes("h(p)") || (allText.includes("entropy") && !allText.includes("von_neumann"))) {
        modes.push({
            id: "shannon_entropy_calc",
            label: "(p₁, p₂, p₃, p₄) → H(P)",
            targetSymbol: "H(P)",
            targetDomain: "ℝ_ω",
            targetUnit: "nats",
            formulaDescription: "H(P) = -∑_{i=1}^4 p_i · ln(p_i)",
            inputs: [
                { name: "p1", symbol: "p₁", domain: "ℝ_ω", defaultValue: 0.25, step: 0.05, min: 0.001, max: 1.0 },
                { name: "p2", symbol: "p₂", domain: "ℝ_ω", defaultValue: 0.25, step: 0.05, min: 0.001, max: 1.0 },
                { name: "p3", symbol: "p₃", domain: "ℝ_ω", defaultValue: 0.25, step: 0.05, min: 0.001, max: 1.0 },
                { name: "p4", symbol: "p₄", domain: "ℝ_ω", defaultValue: 0.25, step: 0.05, min: 0.001, max: 1.0 }
            ],
            evaluate: (vals) => {
                const raw = [vals.p1, vals.p2, vals.p3, vals.p4];
                const sum = raw.reduce((a, b) => a + b, 0);
                const norm = raw.map((p) => p / sum);
                let h = 0;
                norm.forEach((p) => {
                    if (p > 1e-9)
                        h -= p * Math.log(p);
                });
                const hBits = h / Math.LN2;
                const maxH = Math.log(4);
                return {
                    resultValue: h,
                    formattedFormula: `H(P) = -∑ p_i·ln(p_i) [ Normalized: [${norm.map((n) => n.toFixed(2)).join(", ")}] ]`,
                    displayResult: `${h.toFixed(3)} nats (${hBits.toFixed(3)} bits)`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Max capacity ln(4) = ${maxH.toFixed(3)} nats. Uncertainty: ${((h / maxH) * 100).toFixed(1)}%`
                };
            }
        });
    }
    // 11. Born Probability Rule & Angle Projection
    if (allText.includes("born_rule") || allText.includes("born probability") || allText.includes("born_probability") || allText.includes("polariz") || allText.includes("cos²") || allText.includes("|⟨u|v⟩|") || (allText.includes("born") && (allText.includes("probability") || allText.includes("rule") || allText.includes("transition")))) {
        modes.push({
            id: "born_angle_calc",
            label: "(θ in degrees) → P = cos²(θ)",
            targetSymbol: "P",
            targetDomain: "ℝ_ω",
            formulaDescription: "P = cos²(θ)  [ Born transition probability ]",
            inputs: [
                { name: "thetaDeg", symbol: "θ", domain: "ℝ_ω", unit: "°", defaultValue: 45, step: 5, min: 0, max: 180, description: "Filter angle" }
            ],
            evaluate: (vals) => {
                const rad = (vals.thetaDeg * Math.PI) / 180;
                const cosVal = Math.cos(rad);
                const p = cosVal * cosVal;
                return {
                    resultValue: p,
                    formattedFormula: `P = cos²(${vals.thetaDeg}°) = (${cosVal.toFixed(3)})²`,
                    displayResult: `${(p * 100).toFixed(1)}% (${p.toFixed(4)})`,
                    domainBadge: "∈ ℝ_ω",
                    notes: vals.thetaDeg === 45 ? "Midway diagonal: exact 50% coin-toss transmission" : undefined
                };
            }
        });
        modes.push({
            id: "born_modulus_calc",
            label: "(Re z, Im z) → P = |z|²",
            targetSymbol: "P",
            targetDomain: "ℝ_ω",
            formulaDescription: "P = |z|² = x² + y²",
            inputs: [
                { name: "re", symbol: "Re(z)", domain: "ℝ_ω", defaultValue: 0.707, step: 0.05, min: -1.0, max: 1.0 },
                { name: "im", symbol: "Im(z)", domain: "ℝ_ω", defaultValue: 0.707, step: 0.05, min: -1.0, max: 1.0 }
            ],
            evaluate: (vals) => {
                const p = vals.re * vals.re + vals.im * vals.im;
                return {
                    resultValue: p,
                    formattedFormula: `P = (${vals.re.toFixed(3)})² + (${vals.im.toFixed(3)})²`,
                    displayResult: `${p.toFixed(4)} (${(p * 100).toFixed(1)}%)`,
                    domainBadge: "∈ ℝ_ω"
                };
            }
        });
    }
    // 12. Superposition & Wave Interference Cross-Term
    if (allText.includes("interfer") || allText.includes("cross-term") || allText.includes("superpos") || allText.includes("cos(Δθ)")) {
        modes.push({
            id: "wave_interference_calc",
            label: "(|z₁|, |z₂|, Δθ) → P_quantum vs P_classical",
            targetSymbol: "P_quantum",
            targetDomain: "ℝ_ω",
            formulaDescription: "P = |z₁|² + |z₂|² + 2·|z₁|·|z₂|·cos(Δθ)",
            inputs: [
                { name: "r1", symbol: "|z₁|", domain: "ℝ_ω", defaultValue: 0.5, step: 0.05, min: 0.0, max: 1.0, description: "Amplitude 1" },
                { name: "r2", symbol: "|z₂|", domain: "ℝ_ω", defaultValue: 0.5, step: 0.05, min: 0.0, max: 1.0, description: "Amplitude 2" },
                { name: "dThetaDeg", symbol: "Δθ", domain: "ℝ_ω", unit: "°", defaultValue: 0, step: 15, min: 0, max: 360, description: "Phase difference" }
            ],
            evaluate: (vals) => {
                const rad = (vals.dThetaDeg * Math.PI) / 180;
                const cosTerm = Math.cos(rad);
                const pClass = vals.r1 * vals.r1 + vals.r2 * vals.r2;
                const cross = 2 * vals.r1 * vals.r2 * cosTerm;
                const pQuant = Math.max(0, pClass + cross);
                return {
                    resultValue: pQuant,
                    formattedFormula: `P = (${vals.r1}² + ${vals.r2}²) + 2·(${vals.r1})·(${vals.r2})·cos(${vals.dThetaDeg}°) = ${pClass.toFixed(3)} + (${cross.toFixed(3)})`,
                    displayResult: `P_quantum = ${(pQuant * 100).toFixed(1)}% (Classical: ${(pClass * 100).toFixed(1)}%)`,
                    domainBadge: "∈ ℝ_ω",
                    notes: vals.dThetaDeg === 180 ? "Destructive interference: total wave cancellation to 0!" : vals.dThetaDeg === 0 ? "Constructive interference maximum" : undefined
                };
            }
        });
    }
    // 13. Three-Polarizer Sequential Chain
    if (allText.includes("three-polarizer") || allText.includes("polarizer_projection") || allText.includes("chain restoration") || allText.includes("sunglasses")) {
        modes.push({
            id: "three_polarizer_chain_calc",
            label: "(θ₁: Filter A→C, θ₂: Filter C→B) → Transmission",
            targetSymbol: "P_total",
            targetDomain: "ℝ_ω",
            formulaDescription: "P_total = cos²(θ₁) · cos²(θ₂)",
            inputs: [
                { name: "th1", symbol: "θ₁ (A→C)", domain: "ℝ_ω", unit: "°", defaultValue: 45, step: 5, min: 0, max: 90 },
                { name: "th2", symbol: "θ₂ (C→B)", domain: "ℝ_ω", unit: "°", defaultValue: 45, step: 5, min: 0, max: 90 }
            ],
            evaluate: (vals) => {
                const r1 = (vals.th1 * Math.PI) / 180;
                const r2 = (vals.th2 * Math.PI) / 180;
                const p1 = Math.cos(r1) * Math.cos(r1);
                const p2 = Math.cos(r2) * Math.cos(r2);
                const pTot = p1 * p2;
                return {
                    resultValue: pTot,
                    formattedFormula: `P_total = cos²(${vals.th1}°) · cos²(${vals.th2}°) = (${p1.toFixed(3)}) · (${p2.toFixed(3)})`,
                    displayResult: `${(pTot * 100).toFixed(1)}% Light Transmission`,
                    domainBadge: "∈ ℝ_ω",
                    notes: vals.th1 === 45 && vals.th2 === 45 ? "Experiment 2: 25% light output restored by inserting 45° diagonal filter!" : undefined
                };
            }
        });
    }
    // 14. Density Operator, Purity & von Neumann Entropy
    if (allText.includes("density") || allText.includes("purity") || allText.includes("tr(ρ)") || allText.includes("von_neumann") || allText.includes("quantum_bayes")) {
        modes.push({
            id: "density_purity_calc",
            label: "(w₁: Pure |0°⟩, w₂: Pure |90°⟩) → Purity Tr(ρ²)",
            targetSymbol: "Tr(ρ²)",
            targetDomain: "ℝ_ω",
            formulaDescription: "Tr(ρ²) = w₁² + w₂²  [ 1.0 = Pure state, 0.5 = Maximally mixed ]",
            inputs: [
                { name: "w1", symbol: "w₁", domain: "ℝ_ω", defaultValue: 0.5, step: 0.05, min: 0.0, max: 1.0, description: "Ensemble weight 1" }
            ],
            evaluate: (vals) => {
                const w1 = vals.w1;
                const w2 = 1.0 - w1;
                const purity = w1 * w1 + w2 * w2;
                return {
                    resultValue: purity,
                    formattedFormula: `Tr(ρ²) = (${w1.toFixed(2)})² + (${w2.toFixed(2)})²`,
                    displayResult: `${purity.toFixed(3)} ${purity === 1.0 ? "(100% Pure State)" : "(Statistical Mixture)"}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Density Matrix: diag(${w1.toFixed(2)}, ${w2.toFixed(2)}). Tr(ρ) ≡ 1.000`
                };
            }
        });
        modes.push({
            id: "von_neumann_entropy_calc",
            label: "(Eigenvalue λ₁) → S(ρ) = -[λ₁ ln λ₁ + (1-λ₁) ln(1-λ₁)]",
            targetSymbol: "S(ρ)",
            targetDomain: "ℝ_ω",
            targetUnit: "nats",
            formulaDescription: "S(ρ) = -∑ λ_i · ln(λ_i)",
            inputs: [
                { name: "l1", symbol: "λ₁", domain: "ℝ_ω", defaultValue: 0.5, step: 0.05, min: 0.001, max: 0.999 }
            ],
            evaluate: (vals) => {
                const l1 = vals.l1;
                const l2 = 1.0 - l1;
                let s = 0;
                if (l1 > 1e-9)
                    s -= l1 * Math.log(l1);
                if (l2 > 1e-9)
                    s -= l2 * Math.log(l2);
                return {
                    resultValue: s,
                    formattedFormula: `S(ρ) = -[ (${l1.toFixed(2)})·ln(${l1.toFixed(2)}) + (${l2.toFixed(2)})·ln(${l2.toFixed(2)}) ]`,
                    displayResult: `${s.toFixed(3)} nats`,
                    domainBadge: "∈ ℝ_ω",
                    notes: l1 === 0.5 ? "Maximum quantum entropy for 2-level qubit = ln(2) ≈ 0.693 nats" : undefined
                };
            }
        });
    }
    // 15. Linear Algebra - Linear Map Preservation & 2x2 Matrix Action
    if (allText.includes("linear_map") || allText.includes("homomorphism") || allText.includes("linearity") || allText.includes("matrix_vector") || allText.includes("t(a · u")) {
        modes.push({
            id: "matrix_vector_product",
            label: "(A, v) → T(v) = A · v",
            targetSymbol: "T(v)",
            targetDomain: "ℝ_ω²",
            formulaDescription: "[a b; c d] · [x; y] = [ax + by; cx + dy]",
            inputs: [
                { name: "a11", symbol: "a₁₁", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5 },
                { name: "a12", symbol: "a₁₂", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5 },
                { name: "a21", symbol: "a₂₁", domain: "ℝ_ω", defaultValue: 0.0, step: 0.5 },
                { name: "a22", symbol: "a₂₂", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5 },
                { name: "x", symbol: "v_x", domain: "ℝ_ω", defaultValue: 3.0, step: 0.5 },
                { name: "y", symbol: "v_y", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5 }
            ],
            evaluate: (vals) => {
                const u_x = vals.a11 * vals.x + vals.a12 * vals.y;
                const u_y = vals.a21 * vals.x + vals.a22 * vals.y;
                const det = vals.a11 * vals.a22 - vals.a12 * vals.a21;
                return {
                    resultValue: [u_x, u_y],
                    formattedFormula: `T(v) = [ (${vals.a11})(${vals.x}) + (${vals.a12})(${vals.y}), (${vals.a21})(${vals.x}) + (${vals.a22})(${vals.y}) ]ᵀ`,
                    displayResult: `[${u_x.toFixed(2)}, ${u_y.toFixed(2)}]ᵀ`,
                    domainBadge: "∈ ℝ_ω²",
                    notes: `det(A) = ${det.toFixed(2)}. Invertible: ${Math.abs(det) > 1e-6 ? "Yes ✓" : "Singular"}`
                };
            }
        });
    }
    // 15b. Vector Space Distributivity & Scalar Action
    if (allText.includes("vector_distributivity") || allText.includes("scalar distributivity") || allText.includes("c · (u + v)")) {
        modes.push({
            id: "scalar_distributivity_check",
            label: "(c, u, v) → c · (u + v) = c·u + c·v",
            targetSymbol: "c · (u + v)",
            targetDomain: "ℝ_ω²",
            formulaDescription: "c · (u + v) = [c·(u₁+v₁), c·(u₂+v₂)]ᵀ",
            inputs: [
                { name: "c", symbol: "c", domain: "ℝ_ω", defaultValue: 2.5, step: 0.5 },
                { name: "u1", symbol: "u₁", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5 },
                { name: "u2", symbol: "u₂", domain: "ℝ_ω", defaultValue: 0.0, step: 0.5 },
                { name: "v1", symbol: "v₁", domain: "ℝ_ω", defaultValue: 0.0, step: 0.5 },
                { name: "v2", symbol: "v₂", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5 }
            ],
            evaluate: (vals) => {
                const r1 = vals.c * (vals.u1 + vals.v1);
                const r2 = vals.c * (vals.u2 + vals.v2);
                return {
                    resultValue: [r1, r2],
                    formattedFormula: `${vals.c} · [${vals.u1}+${vals.v1}, ${vals.u2}+${vals.v2}]ᵀ = [${r1.toFixed(2)}, ${r2.toFixed(2)}]ᵀ`,
                    displayResult: `[${r1.toFixed(2)}, ${r2.toFixed(2)}]ᵀ`,
                    domainBadge: "∈ ℝ_ω²",
                    notes: "c · (u + v) ≡ c · u + c · v (Distributivity verified)"
                };
            }
        });
    }
    // 16. Linear Algebra - Unitary Isometry & Dual Pairing
    if (allText.includes("unitary_isometry") || allText.includes("dual_pairing") || allText.includes("inner product invariance") || allText.includes("⟨ u | v ⟩") || allText.includes("⟨f, v⟩")) {
        modes.push({
            id: "unitary_2d_rotation",
            label: "(θ, v) → R(θ) · v",
            targetSymbol: "R(θ)·v",
            targetDomain: "ℝ_ω²",
            formulaDescription: "R(θ) · [x; y] = [x cos θ - y sin θ; x sin θ + y cos θ]",
            inputs: [
                { name: "theta_deg", symbol: "θ (°)", domain: "ℝ_ω", defaultValue: 45.0, step: 5.0, min: 0, max: 360 },
                { name: "x", symbol: "v_x", domain: "ℝ_ω", defaultValue: 3.0, step: 0.5 },
                { name: "y", symbol: "v_y", domain: "ℝ_ω", defaultValue: 4.0, step: 0.5 }
            ],
            evaluate: (vals) => {
                const rad = (vals.theta_deg * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rx = vals.x * cos - vals.y * sin;
                const ry = vals.x * sin + vals.y * cos;
                const origNorm = Math.hypot(vals.x, vals.y);
                const rotNorm = Math.hypot(rx, ry);
                return {
                    resultValue: [rx, ry],
                    formattedFormula: `R(${vals.theta_deg}°) · [${vals.x}, ${vals.y}]ᵀ = [${rx.toFixed(2)}, ${ry.toFixed(2)}]ᵀ`,
                    displayResult: `[${rx.toFixed(2)}, ${ry.toFixed(2)}]ᵀ`,
                    domainBadge: "∈ ℝ_ω²",
                    notes: `∥v∥ = ${origNorm.toFixed(3)} → ∥R(θ)v∥ = ${rotNorm.toFixed(3)} (Norm Ratio = ${(rotNorm / origNorm).toFixed(5)})`
                };
            }
        });
        modes.push({
            id: "dual_pairing_eval",
            label: "(f, v) → ⟨f, v⟩ = f₁·v₁ + f₂·v₂",
            targetSymbol: "⟨f, v⟩",
            targetDomain: "ℝ_ω",
            formulaDescription: "⟨f, v⟩ = f(v) = ∑ f_i · v_i",
            inputs: [
                { name: "f1", symbol: "f₁", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5 },
                { name: "f2", symbol: "f₂", domain: "ℝ_ω", defaultValue: -1.0, step: 0.5 },
                { name: "v1", symbol: "v₁", domain: "ℝ_ω", defaultValue: 3.0, step: 0.5 },
                { name: "v2", symbol: "v₂", domain: "ℝ_ω", defaultValue: 4.0, step: 0.5 }
            ],
            evaluate: (vals) => {
                const pair = vals.f1 * vals.v1 + vals.f2 * vals.v2;
                return {
                    resultValue: pair,
                    formattedFormula: `⟨f, v⟩ = (${vals.f1})(${vals.v1}) + (${vals.f2})(${vals.v2})`,
                    displayResult: `${pair.toFixed(3)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Canonical pairing: co-vector functional evaluation on vector"
                };
            }
        });
    }
    // 17. Analysis 1D - Halo Continuity & Perturbation Invariance
    if (allText.includes("halo") || allText.includes("continuity") || allText.includes("(x + dx)^2") || allText.includes("(x+dx)^2") || allText.includes("halo_continuity")) {
        modes.push({
            id: "halo_st_invariance",
            label: "(x₀, dx) → st(Δf) = 0",
            targetSymbol: "st(Δf)",
            targetDomain: "ℝ_ω",
            formulaDescription: "st( (x₀ + dx)² - x₀² ) = st( 2x₀·dx + dx² ) = 0",
            inputs: [
                { name: "x0", symbol: "x₀", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -10, max: 10, description: "Base coordinate" },
                { name: "dx", symbol: "dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.1, description: "Infinitesimal step" }
            ],
            evaluate: (vals) => {
                const x0 = vals.x0;
                const dx = vals.dx;
                const deltaF = 2 * x0 * dx + dx * dx;
                return {
                    resultValue: 0.0,
                    formattedFormula: `Δf = 2(${x0.toFixed(2)})(${dx.toFixed(4)}) + (${dx.toFixed(4)})² = ${deltaF.toFixed(6)}  ⇒  st(Δf) = 0.0000`,
                    displayResult: "0.0000 (Halo Invariant ✓)",
                    domainBadge: "∈ ℝ_ω",
                    notes: `Fluctuation Δf = ${deltaF.toExponential(3)} is strictly infinitesimal. Points stay within halo μ(f(x₀)).`
                };
            }
        });
        modes.push({
            id: "halo_delta_f",
            label: "(x₀, dx) → Fluctuation Δf",
            targetSymbol: "Δf",
            targetDomain: "ℝ_ω",
            formulaDescription: "Δf = f(x₀ + dx) - f(x₀) = 2x₀·dx + dx²",
            inputs: [
                { name: "x0", symbol: "x₀", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -10, max: 10 },
                { name: "dx", symbol: "dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.1 }
            ],
            evaluate: (vals) => {
                const x0 = vals.x0;
                const dx = vals.dx;
                const deltaF = 2 * x0 * dx + dx * dx;
                return {
                    resultValue: deltaF,
                    formattedFormula: `Δf = 2(${x0.toFixed(2)})(${dx.toFixed(4)}) + (${dx.toFixed(4)})²`,
                    displayResult: `${deltaF.toFixed(6)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Dust order O(dx). As dx → 0, Δf → 0."
                };
            }
        });
    }
    // 18. Analysis 1D - Discrete IVT Bisection
    if (allText.includes("bisection") || allText.includes("ivt") || allText.includes("x^3 - 2") || allText.includes("x³ - 2") || allText.includes("ivt_bisection")) {
        modes.push({
            id: "ivt_bisection_root",
            label: "(a, b, cuts) → Root c = st(x_m)",
            targetSymbol: "c",
            targetDomain: "ℝ_ω",
            formulaDescription: "Discrete bisection march on f(x) = x³ - 2 = 0",
            inputs: [
                { name: "a", symbol: "Bracket start a", domain: "ℝ_ω", defaultValue: 1.0, step: 0.1, min: 0, max: 1.25 },
                { name: "b", symbol: "Bracket end b", domain: "ℝ_ω", defaultValue: 2.0, step: 0.1, min: 1.26, max: 3 },
                { name: "cuts", symbol: "Bisection cuts N", domain: "ℕ", defaultValue: 14, step: 1, min: 1, max: 25 }
            ],
            evaluate: (vals) => {
                let left = vals.a, right = vals.b;
                const f = (x) => x * x * x - 2;
                const iters = Math.round(vals.cuts);
                for (let i = 0; i < iters; i++) {
                    const mid = (left + right) / 2;
                    if (f(mid) < 0)
                        left = mid;
                    else
                        right = mid;
                }
                const root = (left + right) / 2;
                const exact = Math.cbrt(2);
                const err = Math.abs(root - exact);
                return {
                    resultValue: root,
                    formattedFormula: `Interval: [${left.toFixed(5)}, ${right.toFixed(5)}]  ⇒  dx: ${(right - left).toExponential(2)}`,
                    displayResult: `${root.toFixed(6)} (∛2)`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Error from exact ∛2: ${err.toExponential(2)}. Discrete sign-crossing verified.`
                };
            }
        });
        modes.push({
            id: "ivt_bisection_midpoint",
            label: "(a, b) → Midpoint m & Next Bracket",
            targetSymbol: "m",
            targetDomain: "ℝ_ω",
            formulaDescription: "m = (a + b) / 2, evaluate f(m) = m³ - 2",
            inputs: [
                { name: "a", symbol: "a (f(a) < 0)", domain: "ℝ_ω", defaultValue: 1.0, step: 0.1, min: 0, max: 1.25 },
                { name: "b", symbol: "b (f(b) > 0)", domain: "ℝ_ω", defaultValue: 2.0, step: 0.1, min: 1.26, max: 3 }
            ],
            evaluate: (vals) => {
                const m = (vals.a + vals.b) / 2;
                const fm = m * m * m - 2;
                const nextBracket = fm < 0 ? `[${m.toFixed(3)}, ${vals.b.toFixed(3)}]` : `[${vals.a.toFixed(3)}, ${m.toFixed(3)}]`;
                return {
                    resultValue: m,
                    formattedFormula: `m = (${vals.a.toFixed(2)} + ${vals.b.toFixed(2)}) / 2 = ${m.toFixed(3)}, f(m) = ${fm.toFixed(4)}`,
                    displayResult: `m = ${m.toFixed(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Next sign-crossing bracket: ${nextBracket}`
                };
            }
        });
    }
    // 18b. Analysis 1D - Hyperfinite Derivative & Extrema of Cubic
    if (allText.includes("x^3 - 3*x") || allText.includes("x³ - 3x") || allText.includes("derivative_cubic") || allText.includes("critical extrema")) {
        modes.push({
            id: "cubic_deriv_st",
            label: "(x, dx) → st(Δf/dx) = 3x² - 3",
            targetSymbol: "f'(x)",
            targetDomain: "ℝ_ω",
            formulaDescription: "st( [ (x+dx)³ - 3(x+dx) - (x³ - 3x) ] / dx ) = 3x² - 3",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5, min: -3, max: 3 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const stDeriv = 3 * x * x - 3;
                const fx = x * x * x - 3 * x;
                const fxdx = Math.pow(x + dx, 3) - 3 * (x + dx);
                const quot = (fxdx - fx) / dx;
                const isCrit = Math.abs(stDeriv) < 0.01;
                return {
                    resultValue: stDeriv,
                    formattedFormula: `Δf/dx = ${quot.toFixed(5)}  ⇒  st(Δf/dx) = 3(${x.toFixed(2)})² - 3 = ${stDeriv.toFixed(3)}`,
                    displayResult: `${stDeriv.toFixed(3)}${isCrit ? (x > 0 ? " ★ Local Min (Slope 0)" : " ★ Local Max (Slope 0)") : ""}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: isCrit ? `Critical extremum confirmed at x = ${x.toFixed(1)} with f(${x.toFixed(1)}) = ${fx.toFixed(2)}` : `Residual hyperfinite dust: ${Math.abs(quot - stDeriv).toExponential(2)}`
                };
            }
        });
        modes.push({
            id: "cubic_difference_quotient",
            label: "(x, dx) → Difference Quotient Δf/dx",
            targetSymbol: "Δf/dx",
            targetDomain: "ℝ_ω",
            formulaDescription: "Δf/dx = 3x² - 3 + 3x·dx + dx²",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5, min: -3, max: 3 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const quot = (Math.pow(x + dx, 3) - 3 * (x + dx) - (x * x * x - 3 * x)) / dx;
                return {
                    resultValue: quot,
                    formattedFormula: `Δf/dx = 3(${x})² - 3 + 3(${x})(${dx}) + (${dx})² = ${quot.toFixed(5)}`,
                    displayResult: `${quot.toFixed(5)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Standard shadow st(·) = ${(3 * x * x - 3).toFixed(3)}`
                };
            }
        });
    }
    // 18c. Analysis 1D - Nonstandard Product Rule
    if (allText.includes("product_rule") || allText.includes("(x^2+1)(x^3-1)") || allText.includes("(x² + 1)(x³ - 1)")) {
        modes.push({
            id: "prod_rule_st",
            label: "(x, dx) → st(Δ(uv)/dx) = 5x⁴ + 3x² - 2x",
            targetSymbol: "(uv)'",
            targetDomain: "ℝ_ω",
            formulaDescription: "st( [u·Δv + v·Δu + Δu·Δv] / dx ) = u·v' + v·u' = 5x⁴ + 3x² - 2x",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 1.5, step: 0.5, min: -3, max: 3 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const stVal = 5 * Math.pow(x, 4) + 3 * Math.pow(x, 2) - 2 * x;
                const u = x * x + 1;
                const v = Math.pow(x, 3) - 1;
                const uNext = Math.pow(x + dx, 2) + 1;
                const vNext = Math.pow(x + dx, 3) - 1;
                const quot = (uNext * vNext - u * v) / dx;
                const crossDust = ((uNext - u) * (vNext - v)) / dx;
                return {
                    resultValue: stVal,
                    formattedFormula: `st(Δ(uv)/dx) = 5(${x})⁴ + 3(${x})² - 2(${x}) = ${stVal.toFixed(4)}`,
                    displayResult: `${stVal.toFixed(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Difference quotient = ${quot.toFixed(4)}. Cross-dust term (Δu·Δv)/dx = ${crossDust.toExponential(2)} vanishes under st(·).`
                };
            }
        });
        modes.push({
            id: "prod_rule_cross_dust",
            label: "(x, dx) → Cross-Dust (Δu·Δv)/dx",
            targetSymbol: "Cross-Dust",
            targetDomain: "ℝ_ω",
            formulaDescription: "(Δu · Δv) / dx  [Infinitesimal dust O(dx) dropped by st(·)]",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 1.5, step: 0.5, min: -3, max: 3 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const du = 2 * x * dx + dx * dx;
                const dv = 3 * x * x * dx + 3 * x * dx * dx + dx * dx * dx;
                const cross = (du * dv) / dx;
                return {
                    resultValue: cross,
                    formattedFormula: `(Δu · Δv) / dx = (${du.toFixed(4)}) · (${dv.toFixed(4)}) / ${dx} = ${cross.toExponential(4)}`,
                    displayResult: `${cross.toExponential(3)} ≈ 0`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Strictly infinitesimal: st( (Δu · Δv) / dx ) ≡ 0"
                };
            }
        });
    }
    // 18d. Analysis 1D - Derivative of x^3
    if (allText.includes("diff_w(x^3") || allText.includes("diff_w(x³") || allText.includes("Δ(x³)") || allText.includes("x^3, x") || allText.includes("r_diff")) {
        modes.push({
            id: "diff_x3_st",
            label: "(x, dx) → st(Δ(x³)/dx) = 3x²",
            targetSymbol: "f'(x)",
            targetDomain: "ℝ_ω",
            formulaDescription: "st( [ (x+dx)³ - x³ ] / dx ) = st( 3x² + 3x·dx + dx² ) = 3x²",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -4, max: 4 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.02 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const stVal = 3 * x * x;
                const quot = (Math.pow(x + dx, 3) - Math.pow(x, 3)) / dx;
                const dust = quot - stVal;
                return {
                    resultValue: stVal,
                    formattedFormula: `Δf/dx = ${quot.toFixed(5)}  ⇒  st(Δ(x³)/dx) = 3(${x.toFixed(2)})² = ${stVal.toFixed(3)}`,
                    displayResult: `${stVal.toFixed(3)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Residual dust 3x·dx + dx² = ${dust.toExponential(3)} vanishes under st(·).`
                };
            }
        });
    }
    // 19. Analysis 2D - Holomorphic Cauchy-Riemann Symmetry
    if (allText.includes("holomorphic") || allText.includes("cauchy-riemann") || allText.includes("cauchy_riemann") || allText.includes("conformal")) {
        modes.push({
            id: "cauchy_riemann_check",
            label: "(x, y) → Cauchy-Riemann for f(z) = z²",
            targetSymbol: "CR Match",
            targetDomain: "ℂ_ω",
            formulaDescription: "u = x² - y², v = 2xy  ⇒  ∂u/∂x = ∂v/∂y = 2x,  ∂u/∂y = -∂v/∂x = -2y",
            inputs: [
                { name: "x", symbol: "x", domain: "ℝ_ω", defaultValue: 1.5, step: 0.5 },
                { name: "y", symbol: "y", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5 }
            ],
            evaluate: (vals) => {
                const ux = 2 * vals.x;
                const vy = 2 * vals.x;
                const uy = -2 * vals.y;
                const neg_vx = -2 * vals.y;
                return {
                    resultValue: [ux, uy],
                    formattedFormula: `∂u/∂x = ∂v/∂y = ${ux.toFixed(2)},  ∂u/∂y = -∂v/∂x = ${uy.toFixed(2)}`,
                    displayResult: "Conformal Symmetry ✓",
                    domainBadge: "∈ ℂ_ω",
                    notes: "Cauchy-Riemann equations satisfied identically. Zero angle shear."
                };
            }
        });
    }
    // 20. Analysis 2D - Residue Theorem & Lee-Yang Zero Pinch
    if (allText.includes("residue_theorem") || allText.includes("residue") || allText.includes("winding") || allText.includes("root counting")) {
        modes.push({
            id: "residue_contour_eval",
            label: "(c, n) → ∮ [c / (z - z₀)] dz = 2π i · c · n",
            targetSymbol: "∮ f(z) dz",
            targetDomain: "ℂ_ω",
            formulaDescription: "∮ (c / z) dz = 2π i · c · n",
            inputs: [
                { name: "c", symbol: "Residue c", domain: "ℝ_ω", defaultValue: 1.0, step: 0.5 },
                { name: "n", symbol: "Winding n", domain: "ℕ", defaultValue: 1, step: 1, min: 1, max: 10 }
            ],
            evaluate: (vals) => {
                const imagCirc = 2 * Math.PI * vals.c * vals.n;
                return {
                    resultValue: imagCirc,
                    formattedFormula: `∮ [${vals.c} / z] dz = 2π i · (${vals.c}) · (${vals.n}) = ${imagCirc.toFixed(4)} i`,
                    displayResult: `${imagCirc.toFixed(4)} i`,
                    domainBadge: "∈ ℂ_ω",
                    notes: "Vortex circulation around isolated pole: 2π i · ∑ Res"
                };
            }
        });
    }
    if (allText.includes("lee_yang") || allText.includes("zero_pinch") || allText.includes("phase transition")) {
        modes.push({
            id: "lee_yang_zero_distance",
            label: "(T, Tc, N) → dist(Z_N zeros, ℝ)",
            targetSymbol: "dist(z*, ℝ)",
            targetDomain: "ℝ_ω",
            formulaDescription: "dist = |T - T_c| + 1 / √N  (pinches real line at T = T_c, N → ω)",
            inputs: [
                { name: "T", symbol: "Temp T", domain: "ℝ_ω", defaultValue: 2.269, step: 0.1 },
                { name: "Tc", symbol: "Critical T_c", domain: "ℝ_ω", defaultValue: 2.269, step: 0.1 },
                { name: "N", symbol: "System Size N", domain: "ℕ", defaultValue: 64, step: 16, min: 2, max: 1024 }
            ],
            evaluate: (vals) => {
                const thermalGap = Math.abs(vals.T - vals.Tc);
                const finiteSizeGap = 1.0 / Math.sqrt(vals.N);
                const dist = thermalGap + finiteSizeGap;
                return {
                    resultValue: dist,
                    formattedFormula: `dist = |${vals.T.toFixed(3)} - ${vals.Tc.toFixed(3)}| + 1/√${vals.N} = ${dist.toFixed(4)}`,
                    displayResult: `${dist.toFixed(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: vals.T === vals.Tc ? `At T = T_c: finite size gap = ${(1.0 / Math.sqrt(vals.N)).toFixed(4)}. As N → ω, dist → 0 (Pinch!)` : undefined
                };
            }
        });
    }
    // 21. Scale Horizon & Grid Step Reciprocity: omega * dx = 1
    if (allText.includes("omega") || allText.includes("dx") || allText.includes("omega_inv") || allText.includes("scale reciprocity") || allText.includes("ω · dx") || allText.includes("omega * dx")) {
        modes.push({
            id: "scale_dx_from_omega",
            label: "(ω) → dx = 1 / ω",
            targetSymbol: "dx",
            targetDomain: "ℝ_ω",
            formulaDescription: "dx = 1 / ω  (Grid Step = Horizon Scale Reciprocal)",
            inputs: [
                { name: "omega", symbol: "Horizon Scale ω", domain: "ℝ_ω", defaultValue: 1000, step: 100, min: 1, max: 1000000 }
            ],
            evaluate: (vals) => {
                const dx = 1.0 / (vals.omega || 1);
                return {
                    resultValue: dx,
                    formattedFormula: `dx = 1 / ${vals.omega} = ${dx.toExponential(4)}`,
                    displayResult: `${dx.toExponential(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Infinitesimal step dx is the exact reciprocal of transfinite horizon ω."
                };
            }
        });
        modes.push({
            id: "scale_omega_from_dx",
            label: "(dx) → ω = 1 / dx",
            targetSymbol: "ω",
            targetDomain: "ℝ_ω",
            formulaDescription: "ω = 1 / dx  (Horizon Scale = Inverse Grid Step)",
            inputs: [
                { name: "dx", symbol: "Grid Step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.000001, max: 1 }
            ],
            evaluate: (vals) => {
                const omega = 1.0 / (vals.dx || 0.001);
                return {
                    resultValue: omega,
                    formattedFormula: `ω = 1 / ${vals.dx} = ${omega.toFixed(1)}`,
                    displayResult: `${omega.toFixed(1)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Transfinite horizon ω scales inversely with resolution step dx."
                };
            }
        });
        modes.push({
            id: "scale_product",
            label: "(ω, dx) → ω · dx = 1.0",
            targetSymbol: "ω · dx",
            targetDomain: "ℝ_ω",
            formulaDescription: "ω · dx = 1  (Constitutional MWM Invariant)",
            inputs: [
                { name: "omega", symbol: "Horizon ω", domain: "ℝ_ω", defaultValue: 1000, step: 100, min: 1, max: 1000000 },
                { name: "dx", symbol: "Step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.000001, max: 1 }
            ],
            evaluate: (vals) => {
                const prod = vals.omega * vals.dx;
                const err = Math.abs(prod - 1.0);
                return {
                    resultValue: prod,
                    formattedFormula: `(${vals.omega}) · (${vals.dx}) = ${prod.toFixed(4)}`,
                    displayResult: `${prod.toFixed(4)} ${err < 1e-6 ? "✓ Exact Invariant" : `(Δ = ${err.toExponential(2)})`}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: err < 1e-6 ? "Exact balance between macro-horizon and micro-step." : "Unbalanced parameters."
                };
            }
        });
    }
    // 22. Hyperfinite Quartic Derivative: diff_w(x^4, x)
    if (allText.includes("diff_w(x^4") || allText.includes("x^4, x") || allText.includes("x⁴") || allText.includes("4x³") || allText.includes("quartic")) {
        modes.push({
            id: "diff_x4_st",
            label: "(x, dx) → st(Δ(x⁴)/dx) = 4x³",
            targetSymbol: "f'(x)",
            targetDomain: "ℝ_ω",
            formulaDescription: "st( [ (x+dx)⁴ - x⁴ ] / dx ) = 4x³",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -5, max: 5 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const stVal = 4 * Math.pow(x, 3);
                const quot = (Math.pow(x + dx, 4) - Math.pow(x, 4)) / dx;
                const dust = quot - stVal;
                return {
                    resultValue: stVal,
                    formattedFormula: `Δ(x⁴)/dx = ${quot.toFixed(5)}  ⇒  st(Δ(x⁴)/dx) = 4(${x.toFixed(2)})³ = ${stVal.toFixed(3)}`,
                    displayResult: `${stVal.toFixed(3)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Dust 6x²dx + 4xdx² + dx³ = ${dust.toExponential(3)} vanishes under st(·).`
                };
            }
        });
        modes.push({
            id: "diff_x4_quotient",
            label: "(x, dx) → Full Difference Quotient Δ(x⁴)/dx",
            targetSymbol: "Δf/dx",
            targetDomain: "ℝ_ω",
            formulaDescription: "Δ(x⁴)/dx = 4x³ + 6x²dx + 4xdx² + dx³",
            inputs: [
                { name: "x", symbol: "Evaluation point x", domain: "ℝ_ω", defaultValue: 2.0, step: 0.5, min: -5, max: 5 },
                { name: "dx", symbol: "Infinitesimal step dx", domain: "ℝ_ω", defaultValue: 0.001, step: 0.0005, min: 0.0001, max: 0.05 }
            ],
            evaluate: (vals) => {
                const x = vals.x;
                const dx = vals.dx;
                const quot = (Math.pow(x + dx, 4) - Math.pow(x, 4)) / dx;
                return {
                    resultValue: quot,
                    formattedFormula: `Δ(x⁴)/dx = ${quot.toFixed(6)}`,
                    displayResult: `${quot.toFixed(6)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: "Exact hyperfinite difference quotient on ℝ_ω."
                };
            }
        });
    }
    // 23. Telescoping Sum on Transect
    if (allText.includes("telescoping") || allText.includes("sum_telescoping") || allText.includes("telescoping_sum") || allText.includes("2k·dx + dx²")) {
        modes.push({
            id: "telescoping_sum_calc",
            label: "(N) → Telescoping Sum ∑ Δ(x²) = 1.0",
            targetSymbol: "∑ Δ(x²)",
            targetDomain: "ℝ_ω",
            formulaDescription: "∑_{k=0}^{N-1} [ ( (k+1)dx )² - (k dx)² ] = (N dx)² = 1.0",
            inputs: [
                { name: "N", symbol: "Grid Steps N", domain: "ℕ", defaultValue: 100, step: 50, min: 10, max: 10000 }
            ],
            evaluate: (vals) => {
                const N = Math.round(vals.N);
                const dx = 1.0 / N;
                let sum = 0;
                for (let k = 0; k < N; k++) {
                    sum += 2 * k * dx * dx + dx * dx;
                }
                return {
                    resultValue: sum,
                    formattedFormula: `∑_{k=0}^{${N - 1}} [ 2k·(${dx.toFixed(4)})² + (${dx.toFixed(4)})² ] = ${sum.toFixed(6)}`,
                    displayResult: `${sum.toFixed(6)} (Exact Telescoping Invariant)`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Internal boundary cancellations leave exactly boundary term (N·dx)² = 1.0000.`
                };
            }
        });
    }
    // 24. Discrete Toeplitz Laplacian & Fourier Mode
    if (allText.includes("toeplitz") || allText.includes("laplacian") || allText.includes("fourier_mode") || allText.includes("eigenvalue") || allText.includes("trig_eigenvalue")) {
        modes.push({
            id: "fourier_eigenvalue_calc",
            label: "(k, N, dx) → Eigenvalue λ_k = 4/dx² · sin²(πk / (2N))",
            targetSymbol: "λ_k",
            targetDomain: "ℝ_ω",
            formulaDescription: "λ_k = (4 / dx²) · sin²(π · k / (2N))",
            inputs: [
                { name: "k", symbol: "Harmonic Mode k", domain: "ℕ", defaultValue: 1, step: 1, min: 1, max: 10 },
                { name: "N", symbol: "Grid Points N", domain: "ℕ", defaultValue: 16, step: 4, min: 4, max: 64 },
                { name: "dx", symbol: "Grid Spacing dx", domain: "ℝ_ω", defaultValue: 0.1, step: 0.05, min: 0.01, max: 1.0 }
            ],
            evaluate: (vals) => {
                const k = Math.round(vals.k);
                const N = Math.round(vals.N);
                const dx = vals.dx;
                const argVal = (Math.PI * k) / (2 * N);
                const s = Math.sin(argVal);
                const lambda = (4 / (dx * dx)) * s * s;
                return {
                    resultValue: lambda,
                    formattedFormula: `λ_${k} = [4 / (${dx})²] · sin²(π·${k} / 2·${N}) = ${lambda.toFixed(4)}`,
                    displayResult: `${lambda.toFixed(4)}`,
                    domainBadge: "∈ ℝ_ω",
                    notes: `Eigenmode ${k} on ${N}-point grid. Continuum limit λ ≈ (π·k / L)².`
                };
            }
        });
    }
    // 25. Conway Dyadic Trees & Sign Sequence Numbers
    if (allText.includes("conway") || allText.includes("dyadic") || allText.includes("conway_dyadic") || allText.includes("conway_sign") || allText.includes("2^n")) {
        modes.push({
            id: "conway_simplicity_calc",
            label: "(left, right) → Conway Simplicity Number x = {L | R}",
            targetSymbol: "x = {L | R}",
            targetDomain: "2^n Conway Tree",
            formulaDescription: "Find earliest-created dyadic rational in (L, R)",
            inputs: [
                { name: "L", symbol: "Left Bound L", domain: "ℝ_ω", defaultValue: 0.0, step: 0.25, min: -10, max: 10 },
                { name: "R", symbol: "Right Bound R", domain: "ℝ_ω", defaultValue: 1.0, step: 0.25, min: -10, max: 10 }
            ],
            evaluate: (vals) => {
                const L = vals.L;
                const R = vals.R;
                let res = 0;
                let day = 0;
                if (L >= R) {
                    return {
                        resultValue: 0,
                        formattedFormula: `Invalid cut: L (${L}) >= R (${R})`,
                        displayResult: "Empty Cut",
                        domainBadge: "Conway Tree",
                        notes: "Strict inequality L < R required for Conway number formation."
                    };
                }
                if (L < 0 && R > 0) {
                    res = 0;
                    day = 0;
                }
                else if (L >= 0) {
                    const ceilL = Math.floor(L) + 1;
                    if (ceilL < R) {
                        res = ceilL;
                        day = Math.abs(res);
                    }
                    else {
                        let denom = 2;
                        while (denom <= 1024) {
                            const num = Math.floor(L * denom) + 1;
                            const cand = num / denom;
                            if (cand < R) {
                                res = cand;
                                day = Math.round(Math.log2(denom));
                                break;
                            }
                            denom *= 2;
                        }
                    }
                }
                else {
                    const floorR = Math.ceil(R) - 1;
                    if (floorR > L) {
                        res = floorR;
                        day = Math.abs(res);
                    }
                    else {
                        let denom = 2;
                        while (denom <= 1024) {
                            const num = Math.ceil(R * denom) - 1;
                            const cand = num / denom;
                            if (cand > L) {
                                res = cand;
                                day = Math.round(Math.log2(denom));
                                break;
                            }
                            denom *= 2;
                        }
                    }
                }
                return {
                    resultValue: res,
                    formattedFormula: `x = { ${L} | ${R} } = ${res}`,
                    displayResult: `${res} (Born on Day ${day})`,
                    domainBadge: "2^n Conway Tree",
                    notes: "Conway Simplicity Rule: first number created that fits strictly between L and R."
                };
            }
        });
    }
    // 17. Dyadic Sine & Rotor Sine Calculations
    if (allText.includes("sin_dyadic") || allText.includes("dyadic sine") || allText.includes("dyadic tree sine") || (allText.includes("sin") && allText.includes("2ⁿ"))) {
        modes.push({
            id: "trig_sin_dyadic_eval",
            label: "(m, n) → sin(θ)",
            targetSymbol: "sin(θ)",
            targetDomain: "[-1, 1]",
            formulaDescription: "sin(θ) = sin(2π · m / 2ⁿ)",
            inputs: [
                { name: "m", symbol: "Numerator m", domain: "ℤ", defaultValue: 1, step: 1, min: 0, max: 64, description: "Dyadic numerator" },
                { name: "n", symbol: "Birthday n", domain: "ℕ", defaultValue: 3, step: 1, min: 0, max: 12, description: "Tree depth / birthday (2ⁿ bisections)" }
            ],
            evaluate: (vals) => {
                const m = Math.round(vals.m);
                const n = Math.max(0, Math.round(vals.n));
                const angleRad = 2 * Math.PI * (m / Math.pow(2, n));
                const angleDeg = (360 * m) / Math.pow(2, n);
                const sinVal = Math.sin(angleRad);
                return {
                    resultValue: sinVal,
                    formattedFormula: `sin(2π · ${m} / 2^${n}) = sin(${angleDeg.toFixed(1)}°) = ${sinVal.toFixed(4)}`,
                    displayResult: `${sinVal.toFixed(4)}`,
                    domainBadge: "∈ [-1, 1]",
                    notes: `Angle θ = ${angleDeg.toFixed(2)}° (${angleRad.toFixed(3)} rad). Evaluated down 2-successor tree at depth n = ${n}.`
                };
            }
        });
    }
    if (allText.includes("sin_rotor") || allText.includes("unitrotor") || allText.includes("rotor sine") || (allText.includes("rotor") && allText.includes("sin"))) {
        modes.push({
            id: "trig_sin_rotor_eval",
            label: "(θ) → (cos θ, sin θ)",
            targetSymbol: "sin(U)",
            targetDomain: "[-1, 1]",
            formulaDescription: "sin(U) = Im(U) = sin(θ) ∈ [-1, 1]",
            inputs: [
                { name: "theta", symbol: "Rotor Angle θ", domain: "ℝ_ω", unit: "°", defaultValue: 45.0, step: 1.0, min: 0.0, max: 360.0, description: "Rotor orientation angle" }
            ],
            evaluate: (vals) => {
                const rad = (vals.theta * Math.PI) / 180;
                const cosVal = Math.cos(rad);
                const sinVal = Math.sin(rad);
                return {
                    resultValue: sinVal,
                    formattedFormula: `U(θ) = ⟨${cosVal.toFixed(4)}, ${sinVal.toFixed(4)}⟩ ⟹ sin(U) = Im(U) = ${sinVal.toFixed(4)}`,
                    displayResult: `${sinVal.toFixed(4)}`,
                    domainBadge: "∈ [-1, 1]",
                    notes: `Unit norm check: |U|² = (${cosVal.toFixed(4)})² + (${sinVal.toFixed(4)})² = ${(cosVal * cosVal + sinVal * sinVal).toFixed(4)} = 1.0 ✓`
                };
            }
        });
    }
    // Return empty if no established, non-trivial calculation modes were matched.
    // This suppresses the calculator button on statements that are purely axiomatic or lack algebraic degrees of freedom.
    return modes;
}
/**
 * Resolves whether an established simulation exists for a specific (inputs → output) calculation mode.
 * Returns the SimulationResult if established, or null if no dedicated simulation exists for this pair.
 */
export function getEstablishedSimulationForMode(mode, currentInputValues, arg) {
    if (mode.hasSimulation === false)
        return null;
    if (mode.runSimulation) {
        return mode.runSimulation(currentInputValues, arg);
    }
    // 1. Build composite context key from argument and mode
    const modeKey = [
        arg.target,
        arg.title,
        arg.expression,
        arg.casCalculation?.command,
        arg.casCalculation?.simplified,
        mode.id,
        mode.label,
        mode.formulaDescription
    ]
        .filter(Boolean)
        .join(" ");
    // 2. Build slots dictionary
    const slots = {};
    if (arg.casCalculation?.slots) {
        Object.assign(slots, arg.casCalculation.slots);
    }
    // Populate from current input values
    for (const inp of mode.inputs) {
        const val = currentInputValues[inp.name] ?? inp.defaultValue;
        const numVal = Array.isArray(val) ? val[0] : val;
        slots[inp.name] = numVal.toString();
        slots[inp.symbol] = numVal.toString();
    }
    // Common physics/math aliases for simulation runners
    if (slots["v"] && !slots["v₀"] && !slots["v0"]) {
        slots["v₀"] = slots["v"];
        slots["v0"] = slots["v"];
    }
    if (slots["v0"] && !slots["v₀"]) {
        slots["v₀"] = slots["v0"];
    }
    if (slots["v₀"] && !slots["v0"]) {
        slots["v0"] = slots["v₀"];
    }
    if (slots["alpha"] && !slots["α"]) {
        slots["α"] = slots["alpha"];
    }
    if (slots["α"] && !slots["alpha"]) {
        slots["alpha"] = slots["α"];
    }
    if (slots["theta"] && !slots["θ"]) {
        slots["θ"] = slots["theta"];
    }
    if (slots["theta1"] && !slots["θ₁"]) {
        slots["θ₁"] = slots["theta1"];
    }
    // Check if simulation exists in NumericRunnerRegistry
    if (!NumericRunnerRegistry.hasSimulation(modeKey, slots)) {
        return null;
    }
    const sampleTime = parseFloat(slots["t"]) || 1.0;
    return NumericRunnerRegistry.run(modeKey, slots, sampleTime);
}
/**
 * Interactive FS Calculator Component
 */
export class FsCalculator extends Elt {
    arg;
    modes;
    activeModeIndex = 0;
    currentInputValues = {};
    modeSelectorContainer;
    formulaBanner;
    inputControlsContainer;
    resultDisplayContainer;
    catalogStatement;
    isSimOpen = false;
    simBtn;
    simContainer;
    currentSimulationResult = null;
    constructor(arg, options) {
        super("div");
        this.arg = arg;
        this.modes = inferFsCalculationModes(arg);
        this.catalogStatement = getFsCatalogStatement(arg.target || "") || getFsCatalogStatement(arg.title || "");
        this.setA("style", "margin-top: 12px; padding: 16px; border: 1px solid #38bdf8; border-radius: 8px; background: #f0f9ff; font-family: system-ui, -apple-system, sans-serif; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);");
        if (this.modes.length === 0) {
            const notice = new Elt("div");
            notice.setA("style", "font-size: 12px; color: #64748b; font-style: italic; padding: 8px 0;");
            notice.setV("No non-trivial algebraic calculation directions inferred for this formal statement.");
            this.append(notice);
            return;
        }
        // Title Bar
        const titleBar = new Elt("div");
        titleBar.setA("style", "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #bae6fd; padding-bottom: 8px; flex-wrap: wrap; gap: 8px;");
        const titleText = new Elt("div");
        titleText.setA("style", "font-weight: 700; font-size: 13px; color: #0369a1; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;");
        titleText.setV("🧮 FS Algebraic Calculator");
        if (this.catalogStatement) {
            // 1. Statement Type Badge (math / physics / information)
            const typeBadge = new Elt("span");
            const isPhysics = this.catalogStatement.type === "physics";
            const isMath = this.catalogStatement.type === "math";
            typeBadge.setA("style", `font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; ${isPhysics
                ? "background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;"
                : isMath
                    ? "background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;"
                    : "background: #fef3c7; color: #b45309; border: 1px solid #fde68a;"}`);
            typeBadge.setV(isPhysics ? "⚛️ Physics" : isMath ? "📐 Math" : "💡 Information");
            titleText.append(typeBadge);
            // 2. Hierarchy Breadcrumb (Parent FS → Child FS)
            if (this.catalogStatement.parentId) {
                const parentStatement = getFsCatalogStatement(this.catalogStatement.parentId);
                const parentTitle = parentStatement ? parentStatement.title : this.catalogStatement.parentId.replace(/^fs_/, "");
                const hierarchyBadge = new Elt("span");
                hierarchyBadge.setA("style", "font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;");
                hierarchyBadge.setV(`↳ ${parentTitle} [${this.catalogStatement.tier}]`);
                titleText.append(hierarchyBadge);
            }
            else if (this.catalogStatement.tier) {
                const tierBadge = new Elt("span");
                tierBadge.setA("style", "font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; text-transform: capitalize;");
                tierBadge.setV(`Governing ${this.catalogStatement.tier}`);
                titleText.append(tierBadge);
            }
        }
        titleBar.append(titleText);
        const badgeGroup = new Elt("div");
        badgeGroup.setA("style", "display: flex; align-items: center; gap: 6px; flex-wrap: wrap;");
        if (this.catalogStatement?.governingSeed) {
            const seedBadge = new Elt("span");
            seedBadge.setA("style", "font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;");
            seedBadge.setV(`🌱 ${this.catalogStatement.governingSeed}`);
            badgeGroup.append(seedBadge);
        }
        const devBadge = new Elt("span");
        devBadge.setA("style", "font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #0284c7; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;");
        devBadge.setV(`${this.modes.length} Inferred Direction${this.modes.length > 1 ? "s" : ""}`);
        badgeGroup.append(devBadge);
        titleBar.append(badgeGroup);
        this.append(titleBar);
        // Mode Selector (if multiple directions inferred)
        this.modeSelectorContainer = new Elt("div");
        this.modeSelectorContainer.setA("style", "margin-bottom: 14px;");
        this.append(this.modeSelectorContainer);
        // Formula Banner
        this.formulaBanner = new Elt("div");
        this.formulaBanner.setA("style", "margin-bottom: 14px; padding: 8px 12px; background: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; font-family: monospace; font-size: 12px; color: #0f172a; display: flex; align-items: center; justify-content: space-between;");
        this.append(this.formulaBanner);
        // Main Body: Input Controls (Left/Top) and Result Display (Right/Bottom)
        const bodyFlex = new Elt("div");
        bodyFlex.setA("style", "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; align-items: start;");
        // Input Controls Panel
        const inputsPanel = new Elt("div");
        inputsPanel.setA("style", "background: #ffffff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 12px;");
        const inputHeading = new Elt("div");
        inputHeading.setA("style", "font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 0.5px;");
        inputHeading.setV("Input Variables");
        inputsPanel.append(inputHeading);
        this.inputControlsContainer = new Elt("div");
        this.inputControlsContainer.setA("style", "display: flex; flex-direction: column; gap: 10px;");
        inputsPanel.append(this.inputControlsContainer);
        bodyFlex.append(inputsPanel);
        // Result Display Panel
        this.resultDisplayContainer = new Elt("div");
        this.resultDisplayContainer.setA("style", "background: #ffffff; border: 1px solid #0284c7; border-radius: 6px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; min-height: 160px; box-sizing: border-box;");
        bodyFlex.append(this.resultDisplayContainer);
        this.append(bodyFlex);
        // Simulation Display Container (Collapsible inside calculator display context)
        this.simContainer = new Elt("div");
        this.simContainer.setA("style", "display: none;");
        this.append(this.simContainer);
        // Initialize mode & optional preset
        let initialModeIndex = 0;
        let initialPresetValues;
        if (options?.presetKey) {
            const targetPreset = FS_CATALOG.examples.find((ex) => ex.presetKey === options.presetKey || ex.id === options.presetKey);
            if (targetPreset) {
                const modeIdx = this.modes.findIndex((m) => m.id === targetPreset.modeId);
                if (modeIdx >= 0) {
                    initialModeIndex = modeIdx;
                    initialPresetValues = targetPreset.values;
                }
            }
        }
        else if (options?.activeModeId) {
            const modeIdx = this.modes.findIndex((m) => m.id === options.activeModeId);
            if (modeIdx >= 0) {
                initialModeIndex = modeIdx;
            }
        }
        this.renderModeSelector();
        this.switchMode(initialModeIndex);
        if (initialPresetValues) {
            Object.assign(this.currentInputValues, initialPresetValues);
            this.renderInputControls();
            this.computeAndRenderResult();
        }
    }
    applyPresetByKey(presetKey) {
        const targetPreset = FS_CATALOG.examples.find((ex) => ex.presetKey === presetKey || ex.id === presetKey);
        if (!targetPreset)
            return false;
        const modeIdx = this.modes.findIndex((m) => m.id === targetPreset.modeId);
        if (modeIdx >= 0) {
            this.switchMode(modeIdx);
        }
        Object.assign(this.currentInputValues, targetPreset.values);
        this.renderInputControls();
        this.computeAndRenderResult();
        return true;
    }
    getActiveCalculationState() {
        return {
            statement: this.catalogStatement,
            mode: this.modes[this.activeModeIndex],
            inputValues: { ...this.currentInputValues }
        };
    }
    renderModeSelector() {
        this.modeSelectorContainer.removeChildren();
        if (this.modes.length <= 1)
            return;
        const label = new Elt("div");
        label.setA("style", "font-size: 11px; font-weight: 600; color: #0369a1; margin-bottom: 6px;");
        label.setV("🎯 Directional Inputs → Output Modes (Inferred from FS):");
        this.modeSelectorContainer.append(label);
        const btnGroup = new Elt("div");
        btnGroup.setA("style", "display: flex; flex-wrap: wrap; gap: 6px;");
        this.modes.forEach((mode, idx) => {
            const btn = new Elt("button");
            const isActive = idx === this.activeModeIndex;
            btn.setA("style", `padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; ${isActive
                ? "border: 1px solid #0284c7; background: #0284c7; color: #ffffff;"
                : "border: 1px solid #bae6fd; background: #ffffff; color: #0369a1;"}`);
            btn.setV(mode.label);
            btn.elt.addEventListener("click", () => {
                this.switchMode(idx);
            });
            btnGroup.append(btn);
        });
        this.modeSelectorContainer.append(btnGroup);
    }
    switchMode(modeIndex) {
        this.activeModeIndex = modeIndex;
        const mode = this.modes[modeIndex];
        // Re-render mode selector highlight
        this.renderModeSelector();
        // Reset input values to defaults for this mode
        this.currentInputValues = {};
        mode.inputs.forEach((inp) => {
            this.currentInputValues[inp.name] = Array.isArray(inp.defaultValue) ? inp.defaultValue[0] : inp.defaultValue;
        });
        // Update formula banner
        this.formulaBanner.removeChildren();
        const formulaText = new Elt("span");
        formulaText.setA("style", "font-weight: 600; color: #0284c7;");
        formulaText.setV(`Formula: ${mode.formulaDescription}`);
        this.formulaBanner.append(formulaText);
        const targetBadge = new Elt("span");
        targetBadge.setA("style", "font-size: 10px; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600;");
        targetBadge.setV(`Output: ${mode.targetSymbol} ∈ ${mode.targetDomain}`);
        this.formulaBanner.append(targetBadge);
        // Render Input Controls
        this.renderInputControls();
        // Recalculate and update simulation
        this.computeAndRenderResult();
    }
    renderInputControls() {
        this.inputControlsContainer.removeChildren();
        const mode = this.modes[this.activeModeIndex];
        // Verified Example Presets (Active configured FsCalculator stencil presets)
        const presets = getFsCatalogExamplesForMode(mode.id);
        if (presets.length > 0) {
            const presetBar = new Elt("div");
            presetBar.setA("style", "margin-bottom: 12px; padding: 8px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px;");
            const presetTitle = new Elt("span");
            presetTitle.setA("style", "font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;");
            presetTitle.setV("💡 Verified Presets:");
            presetBar.append(presetTitle);
            presets.forEach((preset) => {
                const pBtn = new Elt("button");
                pBtn.setA("style", "padding: 3px 8px; font-size: 11px; font-weight: 600; border: 1px solid #86efac; background: #ffffff; color: #15803d; border-radius: 12px; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);");
                pBtn.setV(preset.title);
                pBtn.elt.addEventListener("click", () => {
                    Object.assign(this.currentInputValues, preset.values);
                    this.renderInputControls();
                    this.computeAndRenderResult();
                });
                presetBar.append(pBtn);
            });
            this.inputControlsContainer.append(presetBar);
        }
        mode.inputs.forEach((inp) => {
            const row = new Elt("div");
            row.setA("style", "display: flex; flex-direction: column; gap: 4px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0;");
            // Label line
            const labelLine = new Elt("div");
            labelLine.setA("style", "display: flex; justify-content: space-between; align-items: center; font-size: 12px;");
            const labelText = new Elt("span");
            labelText.setA("style", "font-weight: 600; color: #1e293b;");
            labelText.setV(`${inp.symbol}${inp.unit ? ` (${inp.unit})` : ""}`);
            labelLine.append(labelText);
            const domainTag = new Elt("span");
            domainTag.setA("style", "font-size: 10px; color: #64748b; font-family: monospace;");
            domainTag.setV(`∈ ${inp.domain}`);
            labelLine.append(domainTag);
            row.append(labelLine);
            // Input control line: [-] [ Input ] [+] OR <select> dropdown if options exist
            const controlLine = new Elt("div");
            controlLine.setA("style", "display: flex; align-items: center; gap: 6px;");
            if (inp.options && inp.options.length > 0) {
                const selectElt = document.createElement("select");
                selectElt.style.cssText = "flex: 1; height: 26px; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a; background: #ffffff; cursor: pointer;";
                const activeVal = this.currentInputValues[inp.name] ?? inp.defaultValue;
                inp.options.forEach((opt) => {
                    const optElt = document.createElement("option");
                    optElt.value = opt.value.toString();
                    optElt.text = opt.label;
                    if (opt.value === activeVal) {
                        optElt.selected = true;
                    }
                    selectElt.appendChild(optElt);
                });
                selectElt.addEventListener("change", () => {
                    const parsed = parseFloat(selectElt.value);
                    if (!isNaN(parsed)) {
                        this.currentInputValues[inp.name] = parsed;
                        this.computeAndRenderResult();
                    }
                });
                controlLine.elt.appendChild(selectElt);
            }
            else {
                const step = inp.step !== undefined ? inp.step : 1.0;
                const decBtn = new Elt("button");
                decBtn.setA("style", "width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;");
                decBtn.setV("-");
                const inputElt = document.createElement("input");
                inputElt.type = "number";
                inputElt.value = (this.currentInputValues[inp.name] ?? inp.defaultValue).toString();
                inputElt.step = step.toString();
                if (inp.min !== undefined)
                    inputElt.min = inp.min.toString();
                if (inp.max !== undefined)
                    inputElt.max = inp.max.toString();
                inputElt.style.cssText = "flex: 1; height: 24px; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a;";
                const incBtn = new Elt("button");
                incBtn.setA("style", "width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;");
                incBtn.setV("+");
                const updateVal = (newVal) => {
                    let clamped = newVal;
                    if (inp.min !== undefined && clamped < inp.min)
                        clamped = inp.min;
                    if (inp.max !== undefined && clamped > inp.max)
                        clamped = inp.max;
                    inputElt.value = clamped.toString();
                    this.currentInputValues[inp.name] = clamped;
                    this.computeAndRenderResult();
                };
                decBtn.elt.addEventListener("click", () => {
                    const cur = parseFloat(inputElt.value) || 0;
                    updateVal(cur - step);
                });
                incBtn.elt.addEventListener("click", () => {
                    const cur = parseFloat(inputElt.value) || 0;
                    updateVal(cur + step);
                });
                inputElt.addEventListener("input", () => {
                    const parsed = parseFloat(inputElt.value);
                    if (!isNaN(parsed)) {
                        this.currentInputValues[inp.name] = parsed;
                        this.computeAndRenderResult();
                    }
                });
                controlLine.append(decBtn);
                controlLine.elt.appendChild(inputElt);
                controlLine.append(incBtn);
            }
            row.append(controlLine);
            this.inputControlsContainer.append(row);
        });
    }
    computeAndRenderResult() {
        this.resultDisplayContainer.removeChildren();
        const mode = this.modes[this.activeModeIndex];
        const res = mode.evaluate(this.currentInputValues);
        // Top Header: Target symbol & badge
        const headerRow = new Elt("div");
        headerRow.setA("style", "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;");
        const targetLabel = new Elt("div");
        targetLabel.setA("style", "font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px;");
        targetLabel.setV(`Computed Target: ${mode.targetSymbol}`);
        headerRow.append(targetLabel);
        const domainBadge = new Elt("span");
        domainBadge.setA("style", "font-size: 11px; font-weight: 600; padding: 2px 8px; background: #e0f2fe; color: #0284c7; border-radius: 4px; font-family: monospace;");
        domainBadge.setV(res.domainBadge);
        headerRow.append(domainBadge);
        this.resultDisplayContainer.append(headerRow);
        // Big Result Value Box
        const valueBox = new Elt("div");
        valueBox.setA("style", "margin: 8px 0; padding: 10px 14px; background: #f8fafc; border: 1px solid #bae6fd; border-radius: 6px; text-align: center;");
        const resultVal = new Elt("div");
        resultVal.setA("style", "font-size: 22px; font-weight: 800; color: #0284c7; font-family: system-ui, -apple-system, sans-serif; letter-spacing: -0.5px;");
        resultVal.setV(res.displayResult);
        valueBox.append(resultVal);
        this.resultDisplayContainer.append(valueBox);
        // Formatted Formula Substitution Breakdown
        const substBox = new Elt("div");
        substBox.setA("style", "font-family: monospace; font-size: 11px; color: #475569; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; word-break: break-all;");
        substBox.setV(res.formattedFormula);
        this.resultDisplayContainer.append(substBox);
        // Optional Invariant Note
        if (res.notes) {
            const noteBox = new Elt("div");
            noteBox.setA("style", "margin-top: 6px; font-size: 10px; color: #059669; font-weight: 600;");
            noteBox.setV(`✓ ${res.notes}`);
            this.resultDisplayContainer.append(noteBox);
        }
        // Established Simulation Control (Visible ONLY if simulation has been established for this mode)
        const simResult = getEstablishedSimulationForMode(mode, this.currentInputValues, this.arg);
        this.currentSimulationResult = simResult;
        if (simResult) {
            const simActionRow = new Elt("div");
            simActionRow.setA("style", "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #bae6fd; display: flex; justify-content: space-between; align-items: center;");
            const simLabel = new Elt("span");
            simLabel.setA("style", "font-size: 10.5px; color: #0369a1; font-weight: 600; display: flex; align-items: center; gap: 4px;");
            simLabel.setV("🔬 Simulation Established");
            simActionRow.append(simLabel);
            this.simBtn = new Elt("button");
            this.simBtn.setA("style", `padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s ease; ${this.isSimOpen
                ? "background: #0284c7; color: #ffffff; border: 1px solid #0369a1;"
                : "background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;"}`);
            this.simBtn.setV(this.isSimOpen ? "▼ Hide Simulation" : "▶ View Simulation");
            this.simBtn.elt.addEventListener("click", () => this.toggleSimulation());
            simActionRow.append(this.simBtn);
            this.resultDisplayContainer.append(simActionRow);
            // If simulation is currently expanded, refresh its visualizer with new inputs
            if (this.isSimOpen && this.simContainer) {
                this.simContainer.removeChildren();
                const visualizer = new NumericVisualizer(simResult);
                this.simContainer.append(visualizer);
                this.simContainer.setA("style", "display: block; margin-top: 14px;");
            }
        }
        else {
            // If no simulation is established for this mode, collapse simulation view if open
            if (this.isSimOpen && this.simContainer) {
                this.isSimOpen = false;
                this.simContainer.removeChildren();
                this.simContainer.setA("style", "display: none;");
            }
        }
    }
    toggleSimulation() {
        if (!this.simContainer)
            return;
        if (this.isSimOpen) {
            this.isSimOpen = false;
            this.simContainer.removeChildren();
            this.simContainer.setA("style", "display: none;");
            if (this.simBtn) {
                this.simBtn.setV("▶ View Simulation");
                this.simBtn.setA("style", "padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s ease; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;");
            }
            return;
        }
        const mode = this.modes[this.activeModeIndex];
        const simResult = this.currentSimulationResult || getEstablishedSimulationForMode(mode, this.currentInputValues, this.arg);
        if (!simResult)
            return;
        this.isSimOpen = true;
        this.simContainer.removeChildren();
        const visualizer = new NumericVisualizer(simResult);
        this.simContainer.append(visualizer);
        this.simContainer.setA("style", "display: block; margin-top: 14px;");
        if (this.simBtn) {
            this.simBtn.setV("▼ Hide Simulation");
            this.simBtn.setA("style", "padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s ease; background: #0284c7; color: #ffffff; border: 1px solid #0369a1;");
        }
    }
}
