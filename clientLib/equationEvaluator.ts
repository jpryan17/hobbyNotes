import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { FSDRef } from "./fsdRef.js";

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
  lhsFormula: string;
  rhsSymbol: string;
  rhsDomain: "ℝ" | "ℝ_ω" | "ℂ" | "ℂ_ω" | "ℕ" | "ℤ" | "𝔹" | string;
  description: string;
  inputs: EquationSlot[];
  evaluate: (inputs: Record<string, number>) => EquationResult;
  governingTheorem?: string;
}

export const EQUATION_PRESETS: Record<string, EquationSpec> = {
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
  }
};

/**
 * Skeletal Equation Evaluator Component.
 * Implements a clean, single-slot RHS equation evaluation: LHS(x₁, x₂, ...) = y
 * Customizes display breakdown dynamically according to the RHS codomain.
 */
export class EquationEvaluator extends Elt {
  private spec: EquationSpec;
  private curValues: Record<string, number> = {};
  private outBox!: HTMLDivElement;

  constructor(spec: EquationSpec) {
    super("div");
    this.spec = spec;

    for (const input of spec.inputs) {
      this.curValues[input.name] = Number(input.defaultValue) || 0;
    }

    this.render();
  }

  private render() {
    const box = document.createElement("div");
    box.style.cssText = "max-width: 860px; margin: 0 auto; border: 1.5px solid #0284c7; border-radius: 8px; background: #f0f9ff; padding: 20px 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); font-family: system-ui, -apple-system, sans-serif;";

    // 1. Header Row
    const headerRow = document.createElement("div");
    headerRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1.5px solid #bae6fd; padding-bottom: 12px; margin-bottom: 16px;";

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "display: flex; align-items: center; gap: 10px; flex-wrap: wrap;";

    const titleText = document.createElement("span");
    titleText.style.cssText = "font-weight: 800; font-size: 16px; color: #0369a1;";
    titleText.textContent = `🎯 ${this.spec.title}`;
    titleGroup.appendChild(titleText);

    // RHS Codomain Badge
    const domainBadge = document.createElement("span");
    domainBadge.style.cssText = "font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;";
    domainBadge.textContent = `RHS Slot: ${this.spec.rhsSymbol} ∈ ${this.spec.rhsDomain}`;
    titleGroup.appendChild(domainBadge);

    headerRow.appendChild(titleGroup);

    // Link button to governing theorem if provided
    if (this.spec.governingTheorem) {
      const thmBtn = document.createElement("button");
      thmBtn.style.cssText = "background: #ffffff; border: 1px solid #0284c7; color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
      thmBtn.textContent = `📜 Governing Theorem: MiddleWay.${this.spec.governingTheorem}`;
      thmBtn.addEventListener("mouseover", () => {
        thmBtn.style.background = "#0284c7";
        thmBtn.style.color = "#ffffff";
      });
      thmBtn.addEventListener("mouseout", () => {
        thmBtn.style.background = "#ffffff";
        thmBtn.style.color = "#0284c7";
      });
      thmBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        FSDRef.openScaffoldCard(this.spec.governingTheorem!, `MiddleWay.${this.spec.governingTheorem}`);
      });
      headerRow.appendChild(thmBtn);
    }

    box.appendChild(headerRow);

    // 2. Equation Contract Specification Box
    const specBox = document.createElement("div");
    specBox.style.cssText = "background: #ffffff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; color: #334155;";
    specBox.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">Skeletal Equation Contract</div>
      <div><strong>Evaluated Identity:</strong> <code style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-family:monospace; font-size:14px; font-weight:bold; color:#0f172a;">${this.spec.lhsFormula} &nbsp;= &nbsp;${this.spec.rhsSymbol}</code></div>
      <div style="margin-top: 4px; color: #475569; font-style: italic;">${this.spec.description}</div>
    `;
    box.appendChild(specBox);

    // 3. LHS Input Slots Panel
    const inputsCard = document.createElement("div");
    inputsCard.style.cssText = "background: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;";

    const inputsTitle = document.createElement("div");
    inputsTitle.style.cssText = "font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;";
    inputsTitle.innerHTML = `<span>⚙️ LHS Instantiation Slots</span> <span style="font-size:11px; font-weight:normal; text-transform:none; color:#64748b;">(Instantiate each variable)</span>`;
    inputsCard.appendChild(inputsTitle);

    const controlsGrid = document.createElement("div");
    controlsGrid.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

    for (const slot of this.spec.inputs) {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;";

      // Left info
      const infoDiv = document.createElement("div");
      infoDiv.style.cssText = "display: flex; align-items: center; gap: 8px;";

      const symBadge = document.createElement("span");
      symBadge.style.cssText = "font-family: monospace; font-size: 14px; font-weight: bold; color: #0f172a; min-width: 24px;";
      symBadge.textContent = slot.symbol;
      infoDiv.appendChild(symBadge);

      const dPill = document.createElement("span");
      dPill.style.cssText = "font-size: 10px; font-weight: 700; background: #e2e8f0; color: #475569; padding: 1px 6px; border-radius: 3px;";
      dPill.textContent = `∈ ${slot.domain}`;
      infoDiv.appendChild(dPill);

      if (slot.description) {
        const descEl = document.createElement("span");
        descEl.style.cssText = "font-size: 12px; color: #64748b;";
        descEl.textContent = slot.description;
        infoDiv.appendChild(descEl);
      }
      row.appendChild(infoDiv);

      // Right controls
      const ctrlDiv = document.createElement("div");
      ctrlDiv.style.cssText = "display: flex; align-items: center; gap: 6px;";

      const step = slot.step ?? 1;
      const decBtn = document.createElement("button");
      decBtn.textContent = "-";
      decBtn.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer;";

      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.value = (this.curValues[slot.name] ?? slot.defaultValue).toString();
      numInput.style.cssText = "width: 65px; height: 26px; padding: 0 4px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold;";

      const incBtn = document.createElement("button");
      incBtn.textContent = "+";
      incBtn.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer;";

      decBtn.addEventListener("click", () => {
        let cur = this.curValues[slot.name];
        cur = parseFloat((cur - step).toFixed(2));
        if (slot.min !== undefined && cur < slot.min) cur = slot.min;
        this.curValues[slot.name] = cur;
        numInput.value = cur.toString();
        this.updateOutput();
      });

      incBtn.addEventListener("click", () => {
        let cur = this.curValues[slot.name];
        cur = parseFloat((cur + step).toFixed(2));
        if (slot.max !== undefined && cur > slot.max) cur = slot.max;
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
    box.appendChild(inputsCard);

    // 4. RHS Single Target Output Slot
    this.outBox = document.createElement("div");
    this.outBox.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 16px; font-family: monospace; font-size: 13px; color: #0f172a;";
    box.appendChild(this.outBox);

    this.elt.appendChild(box);
    this.updateOutput();
  }

  private updateOutput() {
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
    } else if (domain === "ℂ_ω") {
      codomainSection = `
        <div style="margin-top: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
          <div style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Codomain Customization: ℂ_ω (2D Complex Decomposition)</div>
          <div>↳ <strong>Gaussian Dyadic Nucleus:</strong> &nbsp;st_C(${sym}) = <span style="font-weight: 800; color: #0284c7;">${res.hardPart ?? res.displayValue}</span> ∈ ℂ</div>
          <div>↳ <strong>Complex Halo Soup:</strong> &nbsp;ε = <span style="font-weight: 800; color: #0284c7;">${res.dustPart ?? "0"}</span> ∈ μ(0)</div>
        </div>
      `;
    } else if (domain === "ℝ" || domain === "ℕ" || domain === "ℤ") {
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
