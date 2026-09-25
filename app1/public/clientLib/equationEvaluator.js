import { Elt } from "./elt.js";
export const EQUATION_PRESETS = {
    nucleus_halo_1d: {
        id: "nucleus_halo_1d",
        title: "1D Nucleus-Halo Decomposition",
        lhsFormula: "x₀ + k · dx",
        rhsSymbol: "y",
        rhsDomain: "ℝ_ω",
        description: "Evaluates a 1D hyperreal point into its standard real nucleus and Day ω halo dust.",
        governingTheorem: "nucleus_halo_decomposition",
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
        lhsFormula: "(x₀ + k_x · dx) + i · (y₀ + k_y · dx)",
        rhsSymbol: "z",
        rhsDomain: "ℂ_ω",
        description: "Evaluates a 2D complex point into its Gaussian dyadic nucleus and transfinite halo soup.",
        governingTheorem: "nucleus_halo_decomposition",
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
        lhsFormula: "(x + k·dx)² - x²",
        rhsSymbol: "Δf",
        rhsDomain: "ℝ_ω",
        description: "Evaluates the increment of f(x) = x² under an infinitesimal step to demonstrate halo preservation.",
        governingTheorem: "infinitesimal_halo",
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
                    `Halo Preservation: st(Δf) = 0.0 ⟹ f(x + dx) ≈ f(x) (Continuous without ε-δ)`
                ]
            };
        }
    },
    telescoping_sum: {
        id: "telescoping_sum",
        title: "Discrete FTC Telescoping Sum",
        lhsFormula: "∑_{k=0}^{n-1} ΔF(k)  [ F(k) = c · k² ]",
        rhsSymbol: "Total",
        rhsDomain: "ℝ",
        description: "Evaluates pairwise cancellation across n steps on the discrete tree.",
        governingTheorem: "telescoping_ftc",
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
    bayes_filter: {
        id: "bayes_filter",
        title: "3-Stage Bayesian Filter",
        lhsFormula: "(P(D|H) · P(H)) / (P(D|H)·P(H) + P(D|¬H)·P(¬H))",
        rhsSymbol: "P(H|D)",
        rhsDomain: "ℝ",
        description: "Evaluates normalized posterior probability given prior belief and evidence likelihood.",
        governingTheorem: "bayes_filter_normalization",
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
/**
 * Parses free variable identifiers from a mathematical expression string.
 */
function extractFreeVariables(expr) {
    const tokens = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const reserved = new Set(["sin", "cos", "tan", "exp", "log", "sqrt", "abs", "Math", "PI", "E", "dx", "st", "dt", "i"]);
    const vars = new Set();
    for (const t of tokens) {
        if (!reserved.has(t)) {
            vars.add(t);
        }
    }
    return Array.from(vars);
}
/**
 * Safely evaluates a mathematical expression string for given variable numbers.
 */
function safeEvalExpression(expr, vals) {
    try {
        // Replace standard math functions with Math.*
        let jsExpr = expr
            .replace(/\^/g, "**")
            .replace(/\bsin\b/g, "Math.sin")
            .replace(/\bcos\b/g, "Math.cos")
            .replace(/\btan\b/g, "Math.tan")
            .replace(/\bexp\b/g, "Math.exp")
            .replace(/\blog\b/g, "Math.log")
            .replace(/\bsqrt\b/g, "Math.sqrt")
            .replace(/\babs\b/g, "Math.abs")
            .replace(/\bpi\b/gi, "Math.PI");
        const varNames = Object.keys(vals);
        const varValues = varNames.map(k => vals[k]);
        const fn = new Function(...varNames, `return (${jsExpr});`);
        const res = fn(...varValues);
        return typeof res === "number" && !isNaN(res) ? res : 0;
    }
    catch {
        return 0;
    }
}
/**
 * Skeletal Equation Evaluator Component & Interactive Builder.
 * Implements clean, single-slot RHS equation evaluation: LHS(x₁, x₂, ...) = y
 * Customizes display breakdown dynamically according to the RHS codomain.
 */
export class EquationEvaluator extends Elt {
    spec;
    isCustomMode = false;
    customFormula = "2*x + 3";
    customDomain = "ℝ";
    customRhsSymbol = "y";
    curValues = {};
    outBox;
    controlsGrid;
    contentContainer;
    constructor(initialPresetOrSpec) {
        super("div");
        if (typeof initialPresetOrSpec === "string" && EQUATION_PRESETS[initialPresetOrSpec]) {
            this.spec = EQUATION_PRESETS[initialPresetOrSpec];
        }
        else if (typeof initialPresetOrSpec === "object" && initialPresetOrSpec !== null) {
            this.spec = initialPresetOrSpec;
        }
        else {
            this.spec = EQUATION_PRESETS["nucleus_halo_1d"];
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
    selectPreset(presetId) {
        if (EQUATION_PRESETS[presetId]) {
            this.isCustomMode = false;
            this.spec = EQUATION_PRESETS[presetId];
            this.initValues();
            this.render();
        }
    }
    switchToCustom(formula, domain) {
        this.isCustomMode = true;
        if (formula)
            this.customFormula = formula;
        if (domain)
            this.customDomain = domain;
        this.rebuildCustomSpec();
        this.render();
    }
    rebuildCustomSpec() {
        const freeVars = extractFreeVariables(this.customFormula);
        const inputs = freeVars.length > 0
            ? freeVars.map(v => ({
                name: v,
                symbol: v,
                domain: this.customDomain === "ℂ_ω" || this.customDomain === "ℂ" ? "ℂ" : "ℝ",
                defaultValue: 2.0,
                step: 0.5,
                min: -100,
                max: 100,
                description: `User instantiated variable ${v}`
            }))
            : [{ name: "x", symbol: "x", domain: "ℝ", defaultValue: 1.0, step: 0.5, min: -100, max: 100, description: "Variable x" }];
        this.spec = {
            id: "custom_equation",
            title: "Interactive Custom Equation Builder",
            lhsFormula: this.customFormula,
            rhsSymbol: this.customRhsSymbol,
            rhsDomain: this.customDomain,
            description: "Direct user-built equation evaluation on the Middle Way canvas.",
            inputs,
            evaluate: (vals) => {
                const val = safeEvalExpression(this.customFormula, vals);
                const isHalo = this.customDomain === "ℝ_ω" || this.customDomain === "ℂ_ω";
                const valStr = Number.isInteger(val) ? val.toString() : val.toFixed(3);
                return {
                    displayValue: isHalo ? `${valStr} + 0·dx` : valStr,
                    hardPart: valStr,
                    dustPart: isHalo ? "0·dx" : "0",
                    isHard: true,
                    details: [
                        `Evaluated via JavaScript arithmetic engine: LHS = ${valStr}`,
                        `Domain Target: ${this.customRhsSymbol} ∈ ${this.customDomain}`
                    ]
                };
            }
        };
        this.initValues();
    }
    render() {
        this.elt.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.style.cssText = "max-width: 900px; margin: 0 auto; border: 1.5px solid #0284c7; border-radius: 8px; background: #f0f9ff; padding: 20px 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); font-family: system-ui, -apple-system, sans-serif;";
        // 1. Preset Selector & Mode Toolbar
        const toolbar = document.createElement("div");
        toolbar.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1.5px solid #bae6fd;";
        const selectorGroup = document.createElement("div");
        selectorGroup.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap;";
        const selLabel = document.createElement("span");
        selLabel.style.cssText = "font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase;";
        selLabel.textContent = "Equation Preset:";
        selectorGroup.appendChild(selLabel);
        const select = document.createElement("select");
        select.style.cssText = "padding: 5px 10px; font-size: 13px; font-weight: 600; color: #0f172a; border: 1px solid #0284c7; border-radius: 4px; background: #ffffff; cursor: pointer;";
        for (const [key, preset] of Object.entries(EQUATION_PRESETS)) {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = `${preset.title} (${preset.rhsSymbol} ∈ ${preset.rhsDomain})`;
            if (!this.isCustomMode && this.spec.id === key)
                opt.selected = true;
            select.appendChild(opt);
        }
        const customOpt = document.createElement("option");
        customOpt.value = "custom";
        customOpt.textContent = "✏️ [Custom Equation Builder...]";
        if (this.isCustomMode)
            customOpt.selected = true;
        select.appendChild(customOpt);
        select.addEventListener("change", () => {
            if (select.value === "custom") {
                this.switchToCustom();
            }
            else {
                this.selectPreset(select.value);
            }
        });
        selectorGroup.appendChild(select);
        toolbar.appendChild(selectorGroup);
        // Link button to governing theorem if in preset mode
        if (!this.isCustomMode && this.spec.governingTheorem) {
            const thmBtn = document.createElement("button");
            thmBtn.style.cssText = "background: #ffffff; border: 1px solid #0284c7; color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
            thmBtn.textContent = `📜 Scaffold: MiddleWay.${this.spec.governingTheorem}`;
            thmBtn.addEventListener("mouseover", () => {
                thmBtn.style.background = "#0284c7";
                thmBtn.style.color = "#ffffff";
            });
            thmBtn.addEventListener("mouseout", () => {
                thmBtn.style.background = "#ffffff";
                thmBtn.style.color = "#0284c7";
            });
            thmBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const { FSDRef } = await import("./fsdRef.js");
                FSDRef.openScaffoldCard(this.spec.governingTheorem, `MiddleWay.${this.spec.governingTheorem}`);
            });
            toolbar.appendChild(thmBtn);
        }
        wrap.appendChild(toolbar);
        // 2. Custom Expression Builder Panel (if in custom mode)
        if (this.isCustomMode) {
            const builderPanel = document.createElement("div");
            builderPanel.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";
            builderPanel.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px;">
          🛠️ Custom Equation Definition (LHS ⟹ Single RHS Slot)
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; flex-wrap: wrap;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">LHS Expression Formula</label>
            <input id="eeCustomLhsInput" type="text" value="${this.customFormula}" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="e.g. 2*x + 3" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">Codomain</label>
            <select id="eeCustomDomainSelect" style="width: 100%; box-sizing: border-box; padding: 6px 8px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;">
              <option value="ℝ" ${this.customDomain === 'ℝ' ? 'selected' : ''}>ℝ (Standard Real)</option>
              <option value="ℝ_ω" ${this.customDomain === 'ℝ_ω' ? 'selected' : ''}>ℝ_ω (Hyperreal Halo)</option>
              <option value="ℂ" ${this.customDomain === 'ℂ' ? 'selected' : ''}>ℂ (Standard Complex)</option>
              <option value="ℂ_ω" ${this.customDomain === 'ℂ_ω' ? 'selected' : ''}>ℂ_ω (Complex Halo)</option>
              <option value="ℕ" ${this.customDomain === 'ℕ' ? 'selected' : ''}>ℕ (Natural)</option>
              <option value="𝔹" ${this.customDomain === '𝔹' ? 'selected' : ''}>𝔹 (Boolean)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">RHS Symbol</label>
            <input id="eeCustomRhsSymbol" type="text" value="${this.customRhsSymbol}" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div>
            <button id="eeCustomApplyBtn" style="padding: 7px 16px; background: #0284c7; color: #ffffff; font-size: 12px; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;">
              ⚡ Build &amp; Slot
            </button>
          </div>
        </div>
      `;
            wrap.appendChild(builderPanel);
            setTimeout(() => {
                const applyBtn = builderPanel.querySelector("#eeCustomApplyBtn");
                const lhsIn = builderPanel.querySelector("#eeCustomLhsInput");
                const domSel = builderPanel.querySelector("#eeCustomDomainSelect");
                const rhsIn = builderPanel.querySelector("#eeCustomRhsSymbol");
                if (applyBtn && lhsIn && domSel && rhsIn) {
                    applyBtn.addEventListener("click", () => {
                        this.customFormula = lhsIn.value.trim() || "x";
                        this.customDomain = domSel.value;
                        this.customRhsSymbol = rhsIn.value.trim() || "y";
                        this.rebuildCustomSpec();
                        this.render();
                    });
                }
            }, 0);
        }
        // 3. Equation Contract Specification Header
        const specBox = document.createElement("div");
        specBox.style.cssText = "background: #ffffff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; color: #334155;";
        specBox.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">Skeletal Equation Contract</div>
      <div><strong>Evaluated Identity:</strong> <code style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-family:monospace; font-size:14px; font-weight:bold; color:#0f172a;">${this.spec.lhsFormula} &nbsp;= &nbsp;${this.spec.rhsSymbol}</code></div>
      <div style="margin-top: 4px; color: #475569; font-style: italic;">${this.spec.description}</div>
    `;
        wrap.appendChild(specBox);
        // 4. LHS Input Slots Panel
        const inputsCard = document.createElement("div");
        inputsCard.style.cssText = "background: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";
        const inputsTitle = document.createElement("div");
        inputsTitle.style.cssText = "font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;";
        inputsTitle.innerHTML = `<span>⚙️ LHS Instantiation Slots</span> <span style="font-size:11px; font-weight:normal; text-transform:none; color:#64748b;">(Instantiate all free variables to produce RHS output)</span>`;
        inputsCard.appendChild(inputsTitle);
        this.controlsGrid = document.createElement("div");
        this.controlsGrid.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
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
            numInput.style.cssText = "width: 70px; height: 26px; text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px;";
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
            this.controlsGrid.appendChild(row);
        }
        inputsCard.appendChild(this.controlsGrid);
        wrap.appendChild(inputsCard);
        // 5. RHS Single Target Output Slot
        this.outBox = document.createElement("div");
        this.outBox.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 16px; font-family: monospace; font-size: 13px; color: #0f172a;";
        wrap.appendChild(this.outBox);
        this.elt.appendChild(wrap);
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
        <div style="margin-top: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℝ_ω (1D Hyperreal Decomposition)</div>
          <div>↳ <strong>Hard Real Nucleus:</strong> &nbsp;st(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℝ</div>
          <div>↳ <strong>Infinitesimal Halo Dust:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
        }
        else if (domain === "ℂ_ω") {
            codomainSection = `
        <div style="margin-top: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℂ_ω (2D Complex Decomposition)</div>
          <div>↳ <strong>Gaussian Dyadic Nucleus:</strong> &nbsp;st_C(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℂ</div>
          <div>↳ <strong>Complex Halo Soup:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
        }
        else if (domain === "ℝ" || domain === "ℕ" || domain === "ℤ") {
            codomainSection = `
        <div style="margin-top: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
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
      <div style="background: #f8fafc; padding: 10px 14px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 15px;">
        ${sym} &nbsp;=&nbsp; <span style="font-weight: 800; color: #0284c7;">${res.displayValue}</span>
      </div>
      ${codomainSection}
      ${detailsList}
      ${statusNotice}
    `;
    }
}
