import { Elt } from "./elt.js";
import { SlotParam, SlotOption, CalculationDomain } from "./directedEquality.js";

export interface SlotControllerOptions {
  /** "row" for horizontal table/bar layout, "stacked" for 2-tier layout with separate label line. Default: "row" */
  layout?: "row" | "stacked";
  /** Current value override if different from param.defaultValue */
  initialValue?: number;
  /** Callback fired whenever the value changes via stepper, keyboard, slider, or dropdown */
  onChange?: (value: number, param: SlotParam) => void;
  /** Show domain tag e.g. "∈ ℝ_ω". Default: true */
  showDomain?: boolean;
  /** Show description text if present in param. Default: true */
  showDescription?: boolean;
  /** Show range slider in addition to stepper if min and max are specified. Default: false */
  showSlider?: boolean;
  /** Custom CSS classes for the number input (e.g. "ee-num-input") */
  inputClassName?: string;
}

/**
 * SlotController — Middle Way Mathematics
 *
 * Universal parameter slot control widget consolidating UI across:
 * - EquationEvaluator (EED: Stage 4 LHS Instantiation Slots)
 * - FsCalculator (FSD: Formal Statement Instantiation Steppers)
 *
 * Provides:
 * - Coordinated stepper buttons ([-] / [+]) with arrow-key keyboard support
 * - Direct numeric input with real-time clamping (min/max) and floating-point rounding
 * - Discrete dropdown (<select>) fallback when options are defined
 * - Optional synchronized range slider
 * - Domain type pill (∈ ℝ, ∈ ℝ_ω, ∈ 𝔻, ∈ 𝔹, etc.)
 */
export class SlotController extends Elt {
  public readonly param: SlotParam;
  private currentValue: number;
  private numInput: HTMLInputElement | null = null;
  private selectElt: HTMLSelectElement | null = null;
  private sliderElt: HTMLInputElement | null = null;
  private decBtn: HTMLButtonElement | null = null;
  private incBtn: HTMLButtonElement | null = null;
  private changeCallbacks: ((val: number, param: SlotParam) => void)[] = [];

  constructor(param: SlotParam, options: SlotControllerOptions = {}) {
    super("div");
    this.param = param;

    // Resolve initial numeric value
    if (typeof options.initialValue === "number" && !isNaN(options.initialValue)) {
      this.currentValue = options.initialValue;
    } else if (typeof param.defaultValue === "number") {
      this.currentValue = param.defaultValue;
    } else {
      const parsed = parseFloat(String(param.defaultValue));
      this.currentValue = isNaN(parsed) ? 0 : parsed;
    }

    if (options.onChange) {
      this.changeCallbacks.push(options.onChange);
    }

    const layout = options.layout ?? "row";
    const showDomain = options.showDomain ?? true;
    const showDescription = options.showDescription ?? true;
    const showSlider = options.showSlider ?? false;
    const inputClass = options.inputClassName ?? "ee-num-input";
    const step = param.step ?? 1;

    if (layout === "stacked") {
      this.renderStacked(step, showDomain, showSlider, inputClass);
    } else {
      this.renderRow(step, showDomain, showDescription, showSlider, inputClass);
    }
  }

  /**
   * Horizontal row layout (EquationEvaluator Stage 4 style).
   */
  private renderRow(
    step: number,
    showDomain: boolean,
    showDescription: boolean,
    showSlider: boolean,
    inputClass: string
  ) {
    this.setA(
      "style",
      "display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; box-sizing: border-box;"
    );

    // Left info side: Symbol badge + Domain badge + Description
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap;";

    const symBadge = document.createElement("span");
    symBadge.style.cssText =
      "background: #0284c7; color: #ffffff; font-family: monospace; font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 4px; user-select: none;";
    symBadge.textContent = this.param.symbol;
    infoDiv.appendChild(symBadge);

    if (showDomain) {
      const domainBadge = document.createElement("span");
      domainBadge.style.cssText =
        "font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;";
      domainBadge.textContent = `∈ ${this.param.domain}`;
      infoDiv.appendChild(domainBadge);
    }

    if (this.param.unit) {
      const unitSpan = document.createElement("span");
      unitSpan.style.cssText = "font-size: 11px; color: #475569; font-style: italic;";
      unitSpan.textContent = `(${this.param.unit})`;
      infoDiv.appendChild(unitSpan);
    }

    if (showDescription && this.param.description) {
      const descSpan = document.createElement("span");
      descSpan.style.cssText = "font-size: 12px; color: #475569;";
      descSpan.textContent = this.param.description;
      infoDiv.appendChild(descSpan);
    }
    this.elt.appendChild(infoDiv);

    // Right control side: Dropdown OR Stepper [-] [Input] [+]
    const ctrlDiv = document.createElement("div");
    ctrlDiv.style.cssText = "display: flex; align-items: center; gap: 6px;";

    if (this.param.options && this.param.options.length > 0) {
      this.buildSelectElement(ctrlDiv);
    } else {
      this.buildStepperElements(ctrlDiv, step, inputClass, "80px", "26px");

      if (showSlider && this.param.min !== undefined && this.param.max !== undefined) {
        this.buildSliderElement(ctrlDiv, step, "90px");
      }
    }

    this.elt.appendChild(ctrlDiv);
  }

  /**
   * 2-Tier Stacked layout (FsCalculator style).
   */
  private renderStacked(
    step: number,
    showDomain: boolean,
    showSlider: boolean,
    inputClass: string
  ) {
    this.setA(
      "style",
      "display: flex; flex-direction: column; gap: 4px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; box-sizing: border-box;"
    );

    // Top Label line: Symbol & unit on left, domain tag on right
    const labelLine = document.createElement("div");
    labelLine.style.cssText = "display: flex; justify-content: space-between; align-items: center; font-size: 12px;";

    const labelText = document.createElement("span");
    labelText.style.cssText = "font-weight: 600; color: #1e293b;";
    labelText.textContent = `${this.param.symbol}${this.param.unit ? ` (${this.param.unit})` : ""}`;
    labelLine.appendChild(labelText);

    if (showDomain) {
      const domainTag = document.createElement("span");
      domainTag.style.cssText = "font-size: 10px; color: #64748b; font-family: monospace;";
      domainTag.textContent = `∈ ${this.param.domain}`;
      labelLine.appendChild(domainTag);
    }
    this.elt.appendChild(labelLine);

    // Bottom Control line: Dropdown OR [-] [Input] [+]
    const controlLine = document.createElement("div");
    controlLine.style.cssText = "display: flex; align-items: center; gap: 6px;";

    if (this.param.options && this.param.options.length > 0) {
      this.buildSelectElement(controlLine, true);
    } else {
      this.buildStepperElements(controlLine, step, inputClass, "100%", "24px", true);

      if (showSlider && this.param.min !== undefined && this.param.max !== undefined) {
        this.buildSliderElement(controlLine, step, "80px");
      }
    }

    this.elt.appendChild(controlLine);
  }

  /**
   * Helper to construct discrete option dropdown.
   */
  private buildSelectElement(container: HTMLElement, fullWidth = false) {
    const sel = document.createElement("select");
    sel.style.cssText = `${
      fullWidth ? "flex: 1;" : ""
    } height: 26px; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a; background: #ffffff; cursor: pointer;`;

    for (const opt of this.param.options!) {
      const optElt = document.createElement("option");
      optElt.value = opt.value.toString();
      optElt.text = opt.label;
      if (opt.value === this.currentValue) {
        optElt.selected = true;
      }
      sel.appendChild(optElt);
    }

    sel.addEventListener("change", () => {
      const parsed = parseFloat(sel.value);
      if (!isNaN(parsed)) {
        this.updateValue(parsed, true);
      }
    });

    this.selectElt = sel;
    container.appendChild(sel);
  }

  /**
   * Helper to construct synchronized stepper buttons and numeric input box.
   */
  private buildStepperElements(
    container: HTMLElement,
    step: number,
    inputClass: string,
    inputWidth: string,
    inputHeight: string,
    isFlex = false
  ) {
    // Decrement Button
    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.style.cssText =
      "width: 26px; height: 26px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1; user-select: none; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: background 0.15s ease, border-color 0.15s ease;";
    decBtn.textContent = "-";
    decBtn.title = `Decrement by ${step}`;
    decBtn.setAttribute("aria-label", `Decrement by ${step}`);

    decBtn.addEventListener("mouseenter", () => {
      decBtn.style.background = "#f0f9ff";
      decBtn.style.borderColor = "#0284c7";
    });
    decBtn.addEventListener("mouseleave", () => {
      decBtn.style.background = "#ffffff";
      decBtn.style.borderColor = "#cbd5e1";
    });

    // Numeric Input
    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.className = inputClass;
    numInput.value = this.currentValue.toString();
    numInput.step = step.toString();
    if (this.param.min !== undefined) numInput.min = this.param.min.toString();
    if (this.param.max !== undefined) numInput.max = this.param.max.toString();
    numInput.style.cssText = `${
      isFlex ? "flex: 1;" : `width: ${inputWidth};`
    } height: ${inputHeight}; text-align: center; font-family: monospace; font-size: 12.5px; font-weight: bold; border: 1.5px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #0f172a; outline: none; transition: border-color 0.15s ease; box-sizing: border-box;`;

    numInput.addEventListener("focus", () => {
      numInput.style.borderColor = "#0284c7";
    });
    numInput.addEventListener("blur", () => {
      numInput.style.borderColor = "#cbd5e1";
      const parsed = parseFloat(numInput.value);
      this.updateValue(isNaN(parsed) ? this.currentValue : parsed, true);
    });

    // Increment Button
    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.style.cssText =
      "width: 26px; height: 26px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; cursor: pointer; color: #0369a1; user-select: none; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: background 0.15s ease, border-color 0.15s ease;";
    incBtn.textContent = "+";
    incBtn.title = `Increment by ${step}`;
    incBtn.setAttribute("aria-label", `Increment by ${step}`);

    incBtn.addEventListener("mouseenter", () => {
      incBtn.style.background = "#f0f9ff";
      incBtn.style.borderColor = "#0284c7";
    });
    incBtn.addEventListener("mouseleave", () => {
      incBtn.style.background = "#ffffff";
      incBtn.style.borderColor = "#cbd5e1";
    });

    // Event Wiring
    decBtn.addEventListener("click", () => {
      this.updateValue(this.currentValue - step, true);
    });

    incBtn.addEventListener("click", () => {
      this.updateValue(this.currentValue + step, true);
    });

    numInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        incBtn.click();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        decBtn.click();
      }
    });

    numInput.addEventListener("input", () => {
      const parsed = parseFloat(numInput.value);
      if (!isNaN(parsed)) {
        this.updateValue(parsed, true, false); // do not overwrite numInput.value while user types
      }
    });

    this.decBtn = decBtn;
    this.incBtn = incBtn;
    this.numInput = numInput;

    container.appendChild(decBtn);
    container.appendChild(numInput);
    container.appendChild(incBtn);
  }

  /**
   * Helper to construct synchronized range slider.
   */
  private buildSliderElement(container: HTMLElement, step: number, sliderWidth: string) {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = (this.param.min ?? 0).toString();
    slider.max = (this.param.max ?? 100).toString();
    slider.step = step.toString();
    slider.value = this.currentValue.toString();
    slider.style.cssText = `width: ${sliderWidth}; cursor: pointer; accent-color: #0284c7;`;

    slider.addEventListener("input", () => {
      const parsed = parseFloat(slider.value);
      if (!isNaN(parsed)) {
        this.updateValue(parsed, true);
      }
    });

    this.sliderElt = slider;
    container.appendChild(slider);
  }

  /**
   * Unified value mutator with precision rounding, clamping, and event emission.
   */
  private updateValue(rawVal: number, emit: boolean, syncInput = true) {
    let clamped = rawVal;
    if (this.param.min !== undefined && clamped < this.param.min) clamped = this.param.min;
    if (this.param.max !== undefined && clamped > this.param.max) clamped = this.param.max;

    // Floating-point clean rounding to 4 decimal places
    clamped = Math.round(clamped * 10000) / 10000;
    this.currentValue = clamped;

    if (this.numInput && syncInput) {
      this.numInput.value = clamped.toString();
    }
    if (this.sliderElt) {
      this.sliderElt.value = clamped.toString();
    }
    if (this.selectElt) {
      this.selectElt.value = clamped.toString();
    }

    if (emit) {
      for (const cb of this.changeCallbacks) {
        cb(this.currentValue, this.param);
      }
    }
  }

  /**
   * Get the current numeric parameter value.
   */
  public getValue(): number {
    return this.currentValue;
  }

  /**
   * Programmatically set the parameter value.
   */
  public setValue(val: number, emit = true): void {
    this.updateValue(val, emit, true);
  }

  /**
   * Register a value change listener.
   */
  public onValueChange(cb: (val: number, param: SlotParam) => void): void {
    this.changeCallbacks.push(cb);
  }

  /**
   * Enable or disable the controls.
   */
  public setDisabled(disabled: boolean): void {
    if (this.numInput) this.numInput.disabled = disabled;
    if (this.selectElt) this.selectElt.disabled = disabled;
    if (this.sliderElt) this.sliderElt.disabled = disabled;
    if (this.decBtn) this.decBtn.disabled = disabled;
    if (this.incBtn) this.incBtn.disabled = disabled;
  }
}
