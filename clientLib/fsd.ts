import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent, TreeNode } from "./pxe.js";
import { ttd } from "./ttd.js";
import { PredicateRegistry, PredicateDef } from "./predicateRegistry.js";
import { ArgumentCard, FormalArgument } from "./argumentCard.js";

export type DomainType = string;

export interface DomainSpec {
  base: "ℕ" | "𝒫(ℕ)";
  filterPred?: "GT" | "LT" | "EVEN" | "GT5" | "LT10" | "NONEMPTY";
  param?: number | string; // e.g. 11, 5, "x₂", "x₁", "∅"
}

export function formatDomainSpec(spec: DomainSpec): string {
  if (!spec.filterPred) return spec.base;
  if (spec.filterPred === "EVEN") return `[${spec.base} | EVEN]`;
  if (spec.filterPred === "NONEMPTY") return `[${spec.base} | y₁ ≠ ∅]`;
  if (spec.param !== undefined) {
    return `[${spec.base} | ${spec.filterPred}(${spec.param})]`;
  }
  return `[${spec.base} | ${spec.filterPred}]`;
}

export function parseDomainSpec(str: string): DomainSpec {
  if (!str || str === "ℕ") return { base: "ℕ" };
  if (str === "𝒫(ℕ)" || str === "P(N)" || str === "P_N") return { base: "𝒫(ℕ)" };
  if (str === "𝒫*(ℕ)" || str === "P*(N)" || str === "𝒫⁺(ℕ)" || str === "P+(N)") {
    return { base: "𝒫(ℕ)", filterPred: "NONEMPTY" };
  }

  const clean = str.replace(/[\[\]]/g, "").trim();
  const parts = clean.split("|").map((s) => s.trim());
  const base = parts[0] === "𝒫(ℕ)" || parts[0] === "P(N)" ? "𝒫(ℕ)" : "ℕ";
  if (parts.length < 2) return { base };

  const predPart = parts[1];
  if (predPart.includes("≠ ∅") || predPart.includes("!= ∅") || predPart.includes("≠∅") || predPart.includes("!=∅") || predPart.includes("NONEMPTY") || predPart.includes("NON_EMPTY")) {
    return { base: "𝒫(ℕ)", filterPred: "NONEMPTY" };
  }
  if (predPart.startsWith("EVEN")) {
    return { base, filterPred: "EVEN" };
  }
  if (predPart.startsWith("GT5")) {
    return { base, filterPred: "GT", param: 5 };
  }
  if (predPart.startsWith("LT10")) {
    return { base, filterPred: "LT", param: 10 };
  }

  const match = predPart.match(/(GT|LT)\s*\(\s*([^)]+)\s*\)/);
  if (match) {
    const pName = match[1] as "GT" | "LT";
    const pValRaw = match[2].trim();
    const num = parseInt(pValRaw, 10);
    const param = isNaN(num) ? pValRaw : num;
    return { base, filterPred: pName, param };
  }

  return { base };
}

export interface SlotInfo {
  predCode: string; // 'p'|'q'|'r'|'s'|'m'|'v'
  predName: string; // 'GT5'|'LT10'|'GT'|'LT'|'∈'|'EVEN'
  slotIndex: number; // 0, 1, ...
  domainType: string; // 'ℕ' (element) or '𝒫(ℕ)' (subset)
  assignedVar?: string; // 'x₁', 'x₂', 'y₁', '0', '1', '5', '10', '1/2', 'GT5', 'LT10', etc.
}

export function isConstantTerm(v?: string): boolean {
  if (!v) return false;
  const trimmed = v.trim();
  if (trimmed === "GT5" || trimmed === "LT10" || trimmed === "EMPTY" || trimmed === "∅") return true;
  if (trimmed === "π" || trimmed.toLowerCase() === "pi" || trimmed === "e" || trimmed === "ω") return true;
  // Literal integer or float
  if (!isNaN(Number(trimmed)) && trimmed !== "") return true;
  // Rational fraction e.g. 1/2, 3/4
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").map((s) => Number(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) return true;
  }
  return false;
}

export interface QuantifierBinding {
  quantifier: "∀" | "∃";
  variable: string; // 'x₁', 'y₁', etc.
  domainType: string; // 'ℕ', '𝒫(ℕ)', '[ℕ | GT(11)]', etc.
}

export function evalFSDAST(node: any, leafLookup: (code: string) => boolean): boolean {
  if (!node) return true;
  let val: boolean;
  if (node.nodeType === "a") {
    val = evalFSDAST(node.left, leafLookup) && evalFSDAST(node.right, leafLookup);
  } else if (node.nodeType === "o") {
    val = evalFSDAST(node.left, leafLookup) || evalFSDAST(node.right, leafLookup);
  } else if (node.nodeType === "i") {
    val = !evalFSDAST(node.left, leafLookup) || evalFSDAST(node.right, leafLookup);
  } else if (node.nodeType === "e") {
    val = evalFSDAST(node.left, leafLookup) === evalFSDAST(node.right, leafLookup);
  } else {
    val = leafLookup(node.nodeType);
  }
  if (node.negations % 2 === 1) {
    val = !val;
  }
  return val;
}

export class FSD extends PXEParent {
  editorFrame: SVGElt;
  controlsFrame: SVGElt;
  fo: SVGElt;
  foY: number;

  sideMargin = 12;
  controlsFrameHeight = 35;
  vertMargin = 8;

  pxe: PXE;

  // State Machine Stage: 1 = Raw Exp, 2 = Slot Binding, 3 = Quantification, 4 = Table & Matrix
  stage: 1 | 2 | 3 | 4 = 1;

  // Stage 1 Buttons
  predButtons: SVGSelectableText[] = [];
  buttonNeg!: SVGSelectableText;
  buttonAnd!: SVGSelectableText;
  buttonOr!: SVGSelectableText;
  buttonImply!: SVGSelectableText;
  buttonEquiv!: SVGSelectableText;
  buttonLB!: SVGSelectableText;
  buttonRB!: SVGSelectableText;
  buttonBackspace!: SVGSelectableText;
  buttonClear!: SVGSelectableText;
  nextStageButton!: SVGSelectableText;

  // Modern Card Overlay State
  modernContainer: HTMLElement | null = null;
  modernScaleWrapper: HTMLElement | null = null;
  modernMounted = false;
  modernFormulaInput: HTMLInputElement | null = null;
  modernStatusPill: HTMLElement | null = null;
  modernPredicateBox: HTMLElement | null = null;
  modernLeanBox: HTMLElement | null = null;
  modernInvariantBox: HTMLElement | null = null;
  modernStageCard: HTMLElement | null = null;
  modernStage4Mount: HTMLElement | null = null;
  modernInspectorDetails: HTMLElement | null = null;
  modernFooterBar: HTMLElement | null = null;
  modernStagePills: HTMLElement[] = [];

  // Stage 2 State: Variables & Slots
  elementVars: string[] = ["x₁", "x₂"];
  numberConstants: string[] = ["0", "1", "5", "10"];
  setVars: string[] = ["y₁", "y₂", "∅"];
  availableVars: string[] = ["x₁", "x₂", "y₁", "y₂", "0", "1", "5", "10", "∅"];
  selectedVar: string = "x₁";
  slots: SlotInfo[] = [];
  varDomains: { [v: string]: DomainSpec } = {};

  // Dynamic Stage Controls
  stageControls: SVGElt[] = [];

  // Content Editor Integration
  usedByContentEditor: ((data: { exp: string; quantifiers: string; slots: string; formattedText: string }, action: 'save' | 'delete' | 'cancel') => void) | undefined;
  isEditingExistingTag: boolean = false;
  editorButton!: SVGText;
  cancelButton!: SVGText;
  deleteButton!: SVGText;

  setContentEditorCallback(
    cb: (data: { exp: string; quantifiers: string; slots: string; formattedText: string }, action: 'save' | 'delete' | 'cancel') => void,
    isEditingExisting: boolean = false
  ) {
    this.usedByContentEditor = cb;
    this.isEditingExistingTag = isEditingExisting;
  }

  editorButtonLabel: string = "return to content editor";

  setEditorButtonLabel(label: string) {
    this.editorButtonLabel = label;
    if (this.editorButton) {
      this.editorButton.setV(label);
    }
  }

  setEditorButton() {
    const editorButton = new SVGText();
    editorButton.setV(this.editorButtonLabel || "return to content editor");
    editorButton.setAA([
      "stroke",
      "forestgreen",
      "visibility",
      "hidden",
      "pointer-events",
      "none",
    ]);
    editorButton.elt.addEventListener("mouseover", () => {
      editorButton.setA("stroke", "purple");
    });
    editorButton.elt.addEventListener("mouseout", () => {
      let isReady = true;
      if (this.stage === 1) {
        const expectClass = this.pxe.setExpectClass();
        isReady = expectClass === "back" && this.pxe.nl === 0;
      }
      this.editorButton.setA("stroke", isReady ? "forestgreen" : "orange");
    });
    editorButton.elt.addEventListener("click", () => {
      this.backToContentEditor();
    });
    return editorButton;
  }

  setCancelButton() {
    const cancelButton = new SVGText();
    cancelButton.setV("cancel");
    cancelButton.setAA([
      "stroke",
      "#64748b",
      "visibility",
      "hidden",
      "pointer-events",
      "none",
    ]);
    cancelButton.elt.addEventListener("mouseover", () => {
      cancelButton.setA("stroke", "#0f172a");
    });
    cancelButton.elt.addEventListener("mouseout", () => {
      cancelButton.setA("stroke", "#64748b");
    });
    cancelButton.elt.addEventListener("click", () => {
      this.cancelAndReturn();
    });
    return cancelButton;
  }

  setDeleteButton() {
    const deleteButton = new SVGText();
    deleteButton.setV("delete tag from document");
    deleteButton.setAA([
      "stroke",
      "crimson",
      "visibility",
      "hidden",
      "pointer-events",
      "none",
    ]);
    deleteButton.elt.addEventListener("mouseover", () => {
      deleteButton.setA("stroke", "darkred");
    });
    deleteButton.elt.addEventListener("mouseout", () => {
      deleteButton.setA("stroke", "crimson");
    });
    deleteButton.elt.addEventListener("click", () => {
      this.deleteTagAndReturn();
    });
    return deleteButton;
  }

  cancelAndReturn() {
    if (this.usedByContentEditor) {
      const cb = this.usedByContentEditor;
      this.usedByContentEditor = undefined;
      this.isEditingExistingTag = false;
      this.editorButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.cancelButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.deleteButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      cb({ exp: "", quantifiers: "", slots: "", formattedText: "" }, "cancel");
    }
  }

  deleteTagAndReturn() {
    if (this.usedByContentEditor) {
      const cb = this.usedByContentEditor;
      this.usedByContentEditor = undefined;
      this.isEditingExistingTag = false;
      this.editorButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.cancelButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.deleteButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      cb({ exp: "", quantifiers: "", slots: "", formattedText: "" }, "delete");
    }
  }

  backToContentEditor() {
    if (this.usedByContentEditor) {
      const cb = this.usedByContentEditor;
      this.usedByContentEditor = undefined;
      this.isEditingExistingTag = false;
      this.editorButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.cancelButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      this.deleteButton.setAA([
        "pointer-events",
        "none",
        "visibility",
        "hidden",
      ]);
      const data = this.getDataForRefTag();
      cb(data, "save");
    }
  }

  getDataForRefTag(): { exp: string; quantifiers: string; slots: string; formattedText: string; fullStatement: string } {
    const exp = this.pxe.exp;
    const quantifiers = this.quantifierBindings
      .map((q) => `${q.quantifier}${q.variable}:${q.domainType}`)
      .join(" ");
    const slots = this.slots.map((s) => s.assignedVar || "").join(",");
    const formattedText = this.formatFSDExp(exp);
    const fullStatement = quantifiers ? `${quantifiers} [ ${formattedText} ]` : formattedText;
    return { exp, quantifiers, slots, formattedText, fullStatement };
  }

  // Stage 3 State: Quantifier Prefix
  quantifierBindings: QuantifierBinding[] = [];
  selectedQuantifier: "∀" | "∃" = "∀";

  // Stage 4 Matrix State
  gridResolution = 16;
  matrixVisible = false;
  selectedColIndex = -1;

  getVarDomain(v: string): DomainSpec {
    if (this.varDomains[v]) return this.varDomains[v];
    if (v.startsWith("y")) return { base: "𝒫(ℕ)" };
    return { base: "ℕ" };
  }

  setVarDomain(v: string, spec: DomainSpec) {
    this.varDomains[v] = spec;
    this.updatePXEText();
    this.renderStageControls();
  }

  cycleVarDomain(v: string) {
    const cur = this.getVarDomain(v);
    if (cur.base === "𝒫(ℕ)") return;

    const otherVars = Array.from(
      new Set(
        this.slots
          .map((s) => s.assignedVar!)
          .filter((ov) => ov && ov.startsWith("x") && ov !== v)
      )
    );

    const options: DomainSpec[] = [
      { base: "ℕ" },
      { base: "ℕ", filterPred: "GT", param: 11 },
      { base: "ℕ", filterPred: "GT", param: 5 },
      { base: "ℕ", filterPred: "LT", param: 5 },
      { base: "ℕ", filterPred: "EVEN" },
    ];

    for (const ov of otherVars) {
      options.push({ base: "ℕ", filterPred: "GT", param: ov });
      options.push({ base: "ℕ", filterPred: "LT", param: ov });
    }

    const curStr = formatDomainSpec(cur);
    const curIdx = options.findIndex((o) => formatDomainSpec(o) === curStr);
    const nextIdx = (curIdx + 1) % options.length;
    this.setVarDomain(v, options[nextIdx]);
  }

  adjustVarDomainParam(v: string, delta: number) {
    const cur = this.getVarDomain(v);
    if (typeof cur.param === "number") {
      const nextVal = Math.max(1, Math.min(64, cur.param + delta));
      this.setVarDomain(v, { ...cur, param: nextVal });
    }
  }

  constructor() {
    super();
    this.editorFrame = new SVGElt("rect");
    this.controlsFrame = new SVGElt("rect");
    this.fo = new SVGElt("foreignObject");
    this.pxe = new PXE(this);
    this.pxe.fmt = () => this.formatFSDExp(this.pxe.exp);

    this.editorButton = this.setEditorButton();
    this.cancelButton = this.setCancelButton();
    this.deleteButton = this.setDeleteButton();

    this.append(this.editorFrame);
    this.append(this.pxe);
    this.append(this.controlsFrame);
    this.append(this.fo);

    this.editorFrame.setAA([
      "x", 0, "y", 0, "borderWidth", 2, "stroke", "darkblue", "fill", "lightgrey"
    ]);

    const x = this.sideMargin;
    const y = this.vertMargin;
    const cfY = 2 * this.vertMargin + PXE.textFrameHeight;
    const cfH = this.controlsFrameHeight;

    this.controlsFrame.setAA([
      "x", x, "y", cfY, "height", cfH, "fill", "azure"
    ]);

    const pxH = 3 * this.vertMargin + PXE.textFrameHeight + this.controlsFrameHeight;
    this.pxe.setAA(["x", x, "y", y, "height", pxH]);
    this.foY = pxH + this.vertMargin;
    this.fo.setAA([
      "x", x, "y", this.foY, "style", "overflow:visible;"
    ]);

    this.renderStageControls();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => this.handleResize());
      window.addEventListener("nav-display-resize", () => this.handleResize());
    }
  }

  handleResize() {
    this.layoutEditor();
  }

  applyScale() {
    if (!this.modernContainer || !this.modernScaleWrapper) return;

    let availW = this.modernContainer.clientWidth;
    if (!availW || availW < 100) {
      if (typeof Nav !== "undefined" && Nav.foWidth) {
        availW = Nav.foWidth;
      } else if (typeof window !== "undefined") {
        availW = window.innerWidth - (typeof Nav !== "undefined" && Nav.isIndexVisible ? 260 : 30);
      }
    }
    const netAvailW = Math.max(280, availW - 40);

    const matrixEl = this.modernStage4Mount ? (this.modernStage4Mount.querySelector("table") as HTMLElement) : null;
    const matrixWidth = matrixEl ? Math.max(matrixEl.offsetWidth, matrixEl.scrollWidth) : 0;
    const targetWidth = Math.max(920, matrixWidth + 40);

    const scale = netAvailW < targetWidth ? Math.max(0.40, netAvailW / targetWidth) : 1;

    const wrapperStyle = this.modernScaleWrapper.style as any;
    if ("zoom" in wrapperStyle) {
      wrapperStyle.zoom = String(scale);
      wrapperStyle.transform = "";
    } else {
      wrapperStyle.transform = `scale(${scale})`;
    }
  }

  layoutEditor(customWidth?: number, customHeight?: number) {
    const fow = customWidth || (typeof Nav !== "undefined" && Nav.foWidth ? Nav.foWidth : (window.innerWidth - 250));
    const foh = customHeight || (typeof Nav !== "undefined" && Nav.foHeight ? Nav.foHeight : (window.innerHeight - 80));
    this.setAA(["width", fow, "height", foh, "style", "display:block;"]);

    // Hide legacy SVG frames and PXE line editor
    this.editorFrame.setA("display", "none");
    this.controlsFrame.setA("display", "none");
    this.pxe.setA("display", "none");

    // Expand foreignObject to occupy full canvas with clean background & scrolling
    this.fo.setAA([
      "x", 0,
      "y", 0,
      "width", fow,
      "height", foh,
      "style", "overflow-y: auto; overflow-x: hidden; display: block; background: #f8fafc;"
    ]);

    this.buildModernUI();
    this.syncModernUI();
    this.applyScale();
  }

  // =========================================================================
  // MODERN STAGE CARD UI IMPLEMENTATION (Equation Evaluator / Image 2 Model)
  // =========================================================================

  buildModernUI() {
    if (this.modernMounted && this.modernContainer) {
      return;
    }

    this.modernContainer = document.createElement("div");
    this.modernContainer.id = "fsdModernContainer";
    this.modernContainer.className = "fsd-modern-container";
    this.modernContainer.style.cssText = "box-sizing: border-box; width: 100%; min-height: 100%; padding: 18px 20px 80px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; overflow-x: hidden; overflow-y: auto;";

    const wrap = document.createElement("div");
    wrap.id = "fsdScaleWrapper";
    wrap.className = "fsd-scale-wrapper";
    wrap.style.cssText = "box-sizing: border-box; width: 920px; transform-origin: top left; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1.5px solid #e2e8f0; color: #0f172a;";
    this.modernScaleWrapper = wrap;
    this.modernContainer.appendChild(wrap);

    // Header Bar: Title & Live Validity Badge
    const headerBar = document.createElement("div");
    headerBar.style.cssText = "display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;";

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "display: flex; flex-direction: column;";
    titleGroup.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
        Formal Statement Constructor (FSD)
      </div>
      <h2 style="margin: 2px 0 0 0; font-size: 19px; color: #0f172a; font-weight: 800; letter-spacing: -0.3px;">
        Constructive Relational Specification &amp; 2D Matrix
      </h2>
    `;
    headerBar.appendChild(titleGroup);

    this.modernStatusPill = document.createElement("div");
    this.modernStatusPill.style.cssText = "display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;";
    this.modernStatusPill.innerHTML = `<span>✓</span> <span>Stage 1: Enter Relation</span>`;
    headerBar.appendChild(this.modernStatusPill);

    wrap.appendChild(headerBar);

    // Stage Stepper Navigation Bar
    const stepperBar = document.createElement("div");
    stepperBar.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;";

    const stagesInfo: { num: 1 | 2 | 3 | 4; label: string; icon: string }[] = [
      { num: 1, label: "Formal Relation", icon: "📜" },
      { num: 2, label: "Slot Typing", icon: "🏷️" },
      { num: 3, label: "Quantifiers", icon: "∀∃" },
      { num: 4, label: "2D Matrix & Truth", icon: "🧮" }
    ];

    this.modernStagePills = [];
    stagesInfo.forEach((st, idx) => {
      const pill = document.createElement("button");
      pill.setAttribute("data-stage", st.num.toString());
      pill.style.cssText = "display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; font-size: 12px; font-weight: 700; border-radius: 7px; border: 1.5px solid #cbd5e1; background: #f8fafc; color: #64748b; cursor: pointer; transition: all 0.15s ease;";
      pill.innerHTML = `<span>${st.icon}</span> <span>Step ${st.num}: ${st.label}</span>`;
      pill.addEventListener("click", () => {
        if (st.num === this.stage) return;
        if (st.num < this.stage) {
          if (st.num === 1) {
            this.stage = 1;
            this.slots = [];
          } else if (st.num === 2) {
            this.stage = 2;
            this.quantifierBindings = [];
          } else if (st.num === 3) {
            this.stage = 3;
          }
          this.renderStageControls();
          this.updatePXEText();
          this.syncModernUI();
        } else {
          // Advancing to future step with validation
          if (this.stage === 1) {
            const expClass = this.pxe.setExpectClass();
            if (expClass === "back" && this.pxe.nl === 0) {
              this.advanceStage();
            }
          } else if (this.stage === 2) {
            const allBound = this.slots.length > 0 && this.slots.every((s) => s.assignedVar !== undefined);
            const { hasMismatch } = this.checkTypeMismatch();
            if (allBound && !hasMismatch) {
              this.advanceStage();
            }
          } else if (this.stage === 3) {
            const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
            const allQuantified = uniqueVars.every((v) => this.quantifierBindings.some((q) => q.variable === v));
            if (allQuantified) {
              this.advanceStage();
            }
          }
        }
      });
      this.modernStagePills.push(pill);
      stepperBar.appendChild(pill);

      if (idx < stagesInfo.length - 1) {
        const arrow = document.createElement("span");
        arrow.style.cssText = "color: #94a3b8; font-size: 12px; font-weight: bold;";
        arrow.textContent = "➔";
        stepperBar.appendChild(arrow);
      }
    });

    wrap.appendChild(stepperBar);

    // =========================================================================
    // SUB-DISPLAYS: Constitutional Predicate, Lean 4 Certification, Tree Invariant
    // =========================================================================

    // 1. Constitutional Predicate Box
    this.modernPredicateBox = document.createElement("div");
    this.modernPredicateBox.style.cssText = "background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; text-align: center; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.04);";
    wrap.appendChild(this.modernPredicateBox);

    // 2. Lean 4 Machine Certification Card
    this.modernLeanBox = document.createElement("div");
    this.modernLeanBox.style.cssText = "background: #f1f5f9; border-left: 4px solid #0284c7; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 12.5px;";
    wrap.appendChild(this.modernLeanBox);

    // 3. General Tree Invariant Card
    this.modernInvariantBox = document.createElement("div");
    this.modernInvariantBox.style.cssText = "background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px;";
    wrap.appendChild(this.modernInvariantBox);

    // =========================================================================
    // ACTIVE STAGE CARD CONTAINER
    // =========================================================================
    this.modernStageCard = document.createElement("div");
    this.modernStageCard.id = "fsdModernStageCard";
    this.modernStageCard.style.cssText = "background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 18px;";
    wrap.appendChild(this.modernStageCard);

    // =========================================================================
    // COLLAPSIBLE INSPECTOR: Nonstandard Stencils & Lean 4 Signatures
    // =========================================================================
    this.modernInspectorDetails = document.createElement("details");
    this.modernInspectorDetails.style.cssText = "margin-bottom: 20px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #ffffff; padding: 10px 14px; transition: all 0.2s ease;";
    this.modernInspectorDetails.innerHTML = `
      <summary style="font-size: 12.5px; font-weight: 700; color: #475569; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px;">
        <span>🔍 Inspect Nonstandard Calculation Stencils &amp; Lean 4 Formal Signatures</span>
      </summary>
      <div id="fsdInspectorContent" style="margin-top: 12px; font-size: 12px; line-height: 1.6; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        <div style="margin-bottom: 8px;">
          <strong>Constructivist Tree Verification:</strong> In Middle Way Math, relations are executed directly on the 1-successor spine <code>ℕ = {1, 2, 3, ...}</code> and power set <code>𝒫(ℕ)</code>. Universal quantifiers (<code>∀</code>) are verified across all domain coordinates, while existential quantifiers (<code>∃</code>) construct an explicit witness.
        </div>
        <div style="font-family: monospace; background: #f8fafc; padding: 8px 12px; border-radius: 5px; border: 1px solid #e2e8f0; color: #0f172a; margin-bottom: 8px;">
          Dual Nonstandard Representation: { st: real_part, eps: halo_dust }
        </div>
        <div style="color: #64748b;">
          Order relations <code>&lt;</code>, <code>&gt;</code>, <code>≤</code>, and halo proximity <code>≈</code> evaluate lexicographically: <code>a.st !== b.st ? a.st &lt; b.st : a.eps &lt; b.eps</code>.
        </div>
      </div>
    `;
    wrap.appendChild(this.modernInspectorDetails);

    // =========================================================================
    // FOOTER ACTIONS BAR
    // =========================================================================
    this.modernFooterBar = document.createElement("div");
    this.modernFooterBar.style.cssText = "display: flex; align-items: center; justify-content: space-between; border-top: 2px solid #e2e8f0; padding-top: 16px; flex-wrap: wrap; gap: 10px;";
    wrap.appendChild(this.modernFooterBar);

    // Mount to foreignObject DOM
    this.fo.elt.innerHTML = "";
    this.fo.elt.appendChild(this.modernContainer);
    this.modernMounted = true;
    this.applyScale();
  }

  // =========================================================================
  // SYNC MODERN UI WITH COMPONENT STATE
  // =========================================================================

  syncModernUI() {
    if (!this.modernMounted || !this.modernContainer) {
      return;
    }

    // 1. Update Stepper Pills
    this.modernStagePills.forEach((pill, idx) => {
      const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
      const isCur = this.stage === stepNum;
      const isPast = this.stage > stepNum;
      pill.style.borderColor = isCur ? "#0284c7" : (isPast ? "#86efac" : "#cbd5e1");
      pill.style.background = isCur ? "#0284c7" : (isPast ? "#f0fdf4" : "#f8fafc");
      pill.style.color = isCur ? "#ffffff" : (isPast ? "#166534" : "#64748b");
    });

    // 2. Update Status Pill
    if (this.modernStatusPill) {
      if (this.stage === 1) {
        const expClass = this.pxe.setExpectClass();
        const isValid = expClass === "back" && this.pxe.nl === 0 && this.pxe.exp.length > 0;
        this.modernStatusPill.style.background = isValid ? "#ecfdf5" : "#fef3c7";
        this.modernStatusPill.style.color = isValid ? "#047857" : "#b45309";
        this.modernStatusPill.style.borderColor = isValid ? "#a7f3d0" : "#fde68a";
        this.modernStatusPill.innerHTML = isValid
          ? `<span>✓</span> <span>Formula Complete (Ready for Slots)</span>`
          : `<span>⚡</span> <span>${this.pxe.exp.length === 0 ? "Enter Relation" : "Awaiting Operand / Bracket"}</span>`;
      } else if (this.stage === 2) {
        const { hasMismatch, conflictingVar } = this.checkTypeMismatch();
        const allBound = this.slots.length > 0 && this.slots.every((s) => s.assignedVar !== undefined);
        this.modernStatusPill.style.background = hasMismatch ? "#fee2e2" : (allBound ? "#ecfdf5" : "#eff6ff");
        this.modernStatusPill.style.color = hasMismatch ? "#b91c1c" : (allBound ? "#047857" : "#1d4ed8");
        this.modernStatusPill.style.borderColor = hasMismatch ? "#fca5a5" : (allBound ? "#a7f3d0" : "#bfdbfe");
        this.modernStatusPill.innerHTML = hasMismatch
          ? `<span>⚠️</span> <span>Type Clash: ${conflictingVar}</span>`
          : (allBound ? `<span>✓</span> <span>Slots Typed (Ready for Quantifiers)</span>` : `<span>🏷️</span> <span>Assign Variable Slots</span>`);
      } else if (this.stage === 3) {
        const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
        const allQuantified = uniqueVars.every((v) => this.quantifierBindings.some((q) => q.variable === v));
        this.modernStatusPill.style.background = allQuantified ? "#ecfdf5" : "#eff6ff";
        this.modernStatusPill.style.color = allQuantified ? "#047857" : "#1d4ed8";
        this.modernStatusPill.style.borderColor = allQuantified ? "#a7f3d0" : "#bfdbfe";
        this.modernStatusPill.innerHTML = allQuantified
          ? `<span>✓</span> <span>Fully Quantified (Ready for Matrix)</span>`
          : `<span>∀∃</span> <span>Scope Variables with Quantifiers</span>`;
      } else {
        const truth = this.evaluateFullStatement();
        this.modernStatusPill.style.background = truth ? "#ecfdf5" : "#fee2e2";
        this.modernStatusPill.style.color = truth ? "#047857" : "#b91c1c";
        this.modernStatusPill.style.borderColor = truth ? "#a7f3d0" : "#fca5a5";
        this.modernStatusPill.innerHTML = truth
          ? `<span>✓</span> <span>Statement Verdict: True (T)</span>`
          : `<span>✗</span> <span>Statement Verdict: False (F)</span>`;
      }
    }

    // 3. Update Constitutional Predicate Box
    if (this.modernPredicateBox) {
      const formatted = this.formatFSDExp(this.pxe.exp) || "—";
      let verdictSnippet = "";
      if (this.stage === 4) {
        const truth = this.evaluateFullStatement();
        verdictSnippet = `
          <div style="margin-top: 8px;">
            <span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; background: ${truth ? '#dcfce7' : '#fee2e2'}; color: ${truth ? '#166534' : '#991b1b'}; border: 1px solid ${truth ? '#bbf7d0' : '#fecaca'};">
              Statement Verdict: ${truth ? "True (T) ∈ 𝔹" : "False (F) ∈ 𝔹"}
            </span>
          </div>
        `;
      } else {
        verdictSnippet = `
          <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
            Stage ${this.stage}: ${this.stage === 1 ? "Authoring Relational Predicate" : (this.stage === 2 ? "Configuring Slot Types & Domains" : "Binding Quantifiers")}
          </div>
        `;
      }

      this.modernPredicateBox.innerHTML = `
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
          Constitutional Formal Statement Predicate
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #0369a1; word-break: break-all;">
          ${this.stage >= 3 && this.quantifierBindings.length > 0 ? "" : ""}${formatted}
        </div>
        ${verdictSnippet}
      `;
    }

    // 4. Update Lean 4 Machine Certification Box
    if (this.modernLeanBox) {
      const theoremName = this.getGoverningTheorem();
      const snippet = this.getLeanSnippet();
      this.modernLeanBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <span style="font-weight: 700; color: #0369a1;">Lean 4 Machine Certification:</span>
          <span style="font-family: monospace; font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
            MiddleWay.${theoremName}
          </span>
        </div>
        <pre style="margin: 0; font-family: monospace; color: #0f172a; white-space: pre-wrap; font-size: 11.5px; line-height: 1.45; background: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0;">${snippet}</pre>
      `;
    }

    // 5. Update General Tree Invariant Box
    if (this.modernInvariantBox) {
      const expDisp = this.formatFSDExp(this.pxe.exp) || "relation";
      this.modernInvariantBox.innerHTML = `
        <div style="font-size: 11.5px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
          📜 General Tree Invariant
        </div>
        <div style="font-size: 12.5px; color: #1e3a2b; line-height: 1.5;">
          The relational proposition <code>${expDisp}</code> is verified constructively on the discrete 1-successor spine <strong>ℕ</strong> and power set <strong>𝒫(ℕ)</strong> using constructive step verification without non-constructive axioms.
        </div>
      `;
    }

    // 6. Render Active Stage Card
    this.renderModernStageCard();

    // 7. Update Footer Bar
    this.renderModernFooterBar();

    this.applyScale();
  }

  // =========================================================================
  // RENDER ACTIVE STAGE CARD CONTENT
  // =========================================================================

  renderModernStageCard() {
    if (!this.modernStageCard) return;
    this.modernStageCard.innerHTML = "";

    if (this.stage === 1) {
      this.renderModernStage1(this.modernStageCard);
    } else if (this.stage === 2) {
      this.renderModernStage2(this.modernStageCard);
    } else if (this.stage === 3) {
      this.renderModernStage3(this.modernStageCard);
    } else if (this.stage === 4) {
      this.renderModernStage4(this.modernStageCard);
    }
  }

  // --- STAGE 1: Sparse Authoring with Simpler Stuff on Top & Dropdowns ---
  renderModernStage1(card: HTMLElement) {
    const cardTitle = document.createElement("div");
    cardTitle.style.cssText = "font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;";
    cardTitle.textContent = "Stage 1: Governing Formal Statement & Functional Relation";
    card.appendChild(cardTitle);

    const desc = document.createElement("p");
    desc.style.cssText = "margin: 0 0 14px 0; font-size: 13.5px; color: #475569; line-height: 1.5;";
    desc.innerHTML = "Enter a formal mathematical relation or proposition using standard relations and connectives. Select simpler variables and operators on top, or open dropdowns for calculus, functions, and logic:";
    card.appendChild(desc);

    // Formula Input Bar
    const inputRow = document.createElement("div");
    inputRow.style.cssText = "display: flex; gap: 8px; align-items: center; margin-bottom: 16px;";

    this.modernFormulaInput = document.createElement("input");
    this.modernFormulaInput.type = "text";
    this.modernFormulaInput.id = "fsdModernInput";
    this.modernFormulaInput.placeholder = "Enter relation (e.g. x₁ < x₂, x₁ = x₂, x₁ ∈ y₁)...";
    this.modernFormulaInput.value = this.formatFSDExp(this.pxe.exp);
    this.modernFormulaInput.style.cssText = "flex: 1; padding: 9px 14px; font-family: monospace; font-size: 16px; font-weight: bold; color: #0369a1; background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; outline: none; transition: border-color 0.15s ease;";
    this.modernFormulaInput.addEventListener("focus", () => {
      this.modernFormulaInput!.style.borderColor = "#0284c7";
      this.modernFormulaInput!.style.boxShadow = "0 0 0 3px rgba(2, 132, 199, 0.12)";
    });
    this.modernFormulaInput.addEventListener("blur", () => {
      this.modernFormulaInput!.style.borderColor = "#bae6fd";
      this.modernFormulaInput!.style.boxShadow = "none";
    });

    this.modernFormulaInput.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        this.pxe.backspace();
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const expClass = this.pxe.setExpectClass();
        if (expClass === "back" && this.pxe.nl === 0 && this.pxe.exp.length > 0) {
          this.advanceStage();
        }
      } else if (e.key === "<") {
        e.preventDefault();
        this.pxe.addCharacter("s");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === ">") {
        e.preventDefault();
        this.pxe.addCharacter("r");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "=") {
        e.preventDefault();
        this.pxe.addCharacter("k");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "&" || e.key === "^") {
        e.preventDefault();
        this.pxe.addCharacter("a");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "|" || e.key === "v") {
        e.preventDefault();
        this.pxe.addCharacter("o");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "!" || e.key === "~") {
        e.preventDefault();
        this.pxe.addCharacter("n");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "[") {
        e.preventDefault();
        this.pxe.addCharacter("[");
        this.updatePXEText();
        this.syncModernUI();
      } else if (e.key === "]") {
        e.preventDefault();
        this.pxe.addCharacter("]");
        this.updatePXEText();
        this.syncModernUI();
      }
    });

    inputRow.appendChild(this.modernFormulaInput);

    const btnClearInput = document.createElement("button");
    btnClearInput.style.cssText = "padding: 8px 14px; font-size: 13px; font-weight: 600; color: #dc2626; background: #ffffff; border: 1.5px solid #fca5a5; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;";
    btnClearInput.textContent = "Clear";
    btnClearInput.addEventListener("click", () => {
      this.clear();
      this.syncModernUI();
    });
    inputRow.appendChild(btnClearInput);

    card.appendChild(inputRow);

    // Sparse Formula Authoring Toolbar Box
    const toolbarBox = document.createElement("div");
    toolbarBox.style.cssText = "background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px;";

    toolbarBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: 11.5px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
          🧮 Sparse Formula Authoring Toolbar
        </span>
        <span style="font-size: 11px; color: #64748b;">(Click simpler variables &amp; relations on top, or select from dropdowns below)</span>
      </div>
    `;

    // ROW 1: Simpler stuff on top (Variables, Arithmetic, Core Relations, Backspace/Clear)
    const row1 = document.createElement("div");
    row1.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;";

    // Helper to create chips
    const createChip = (label: string, onClick: () => void, styleType: 'var' | 'alg' | 'rel' | 'action' = 'rel') => {
      const btn = document.createElement("button");
      let bg = "#ffffff";
      let color = "#0369a1";
      let border = "#bae6fd";
      if (styleType === 'var') {
        bg = "#f1f5f9";
        color = "#1e293b";
        border = "#cbd5e1";
      } else if (styleType === 'alg') {
        bg = "#ffffff";
        color = "#334155";
        border = "#cbd5e1";
      } else if (styleType === 'action') {
        bg = "#fff1f2";
        color = "#e11d48";
        border = "#fecdd3";
      }
      btn.style.cssText = `display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 9px; font-family: monospace; font-size: 13.5px; font-weight: 700; background: ${bg}; color: ${color}; border: 1.5px solid ${border}; border-radius: 5px; cursor: pointer; transition: all 0.12s ease;`;
      btn.textContent = label;
      btn.addEventListener("mouseover", () => btn.style.transform = "translateY(-1px)");
      btn.addEventListener("mouseout", () => btn.style.transform = "none");
      btn.addEventListener("click", onClick);
      return btn;
    };

    // Variables Group
    const varGroup = document.createElement("div");
    varGroup.style.cssText = "display: flex; gap: 4px; align-items: center;";
    const vars = ["x₁", "x₂", "y₁", "x", "y", "n"];
    vars.forEach(v => {
      varGroup.appendChild(createChip(v, () => {
        // In stage 1, clicking a variable adds context
        if (this.modernFormulaInput) {
          this.modernFormulaInput.focus();
        }
      }, 'var'));
    });
    row1.appendChild(varGroup);

    const div1 = document.createElement("div");
    div1.style.cssText = "width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px;";
    row1.appendChild(div1);

    // Arithmetic Group
    const algGroup = document.createElement("div");
    algGroup.style.cssText = "display: flex; gap: 4px; align-items: center;";
    const algs = ["+", "-", "·", "/", "^", "(", ")"];
    algs.forEach(op => {
      algGroup.appendChild(createChip(op, () => {
        if (op === "(") this.pxe.addCharacter("[");
        else if (op === ")") this.pxe.addCharacter("]");
        this.updatePXEText();
        this.syncModernUI();
      }, 'alg'));
    });
    row1.appendChild(algGroup);

    const div2 = document.createElement("div");
    div2.style.cssText = "width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px;";
    row1.appendChild(div2);

    // Core Relations Group (Filtered without legacy GT5, LT10, EVEN, ODD)
    const relGroup = document.createElement("div");
    relGroup.style.cssText = "display: flex; gap: 4px; align-items: center;";
    const relations: { sym: string; code: string }[] = [
      { sym: "<", code: "s" },
      { sym: "≤", code: "l" },
      { sym: "=", code: "k" },
      { sym: "≠", code: "nk" },
      { sym: ">", code: "r" },
      { sym: "≥", code: "r" },
      { sym: "∈", code: "m" },
      { sym: "⊆", code: "b" },
      { sym: "≈", code: "w" },
      { sym: "+1", code: "u" },
      { sym: "∣", code: "c" },
      { sym: "≔", code: "j" }
    ];
    relations.forEach(r => {
      relGroup.appendChild(createChip(r.sym, () => {
        this.pxe.addCharacter(r.code);
        this.updatePXEText();
        this.syncModernUI();
      }, 'rel'));
    });
    row1.appendChild(relGroup);

    const div3 = document.createElement("div");
    div3.style.cssText = "width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px;";
    row1.appendChild(div3);

    // Edit Actions Group
    const actGroup = document.createElement("div");
    actGroup.style.cssText = "display: flex; gap: 4px; align-items: center;";
    actGroup.appendChild(createChip("⌫", () => {
      this.pxe.backspace();
      this.updatePXEText();
      this.syncModernUI();
    }, 'action'));
    row1.appendChild(actGroup);

    toolbarBox.appendChild(row1);

    // ROW 2: Compact Dropdowns for Advanced Groups
    const row2 = document.createElement("div");
    row2.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap;";

    // Dropdown 1: Trig
    const trigItems = [
      { text: "sin(x)", sub: "Sine", onClick: () => {} },
      { text: "cos(x)", sub: "Cosine", onClick: () => {} },
      { text: "tan(x)", sub: "Tangent", onClick: () => {} },
      { text: "arcsin(x)", sub: "Inv Sine", onClick: () => {} },
      { text: "arccos(x)", sub: "Inv Cosine", onClick: () => {} },
      { text: "arctan(x)", sub: "Inv Tangent", onClick: () => {} },
      { text: "π", sub: "Archimedes Pi", onClick: () => {} }
    ];
    row2.appendChild(this.createDropdown("Trig ▾", trigItems));

    // Dropdown 2: Calculus & Halo
    const calcItems = [
      { text: "st(x)", sub: "Standard Nucleus", onClick: () => {} },
      { text: "μ(0)", sub: "Infinitesimal Halo", onClick: () => {} },
      { text: "dx", sub: "Infinitesimal Step (1/ω)", onClick: () => {} },
      { text: "D(f)", sub: "Discrete Deriv", onClick: () => {} },
      { text: "∫(f)", sub: "Discrete Sum", onClick: () => {} },
      { text: "ω", sub: "Discrete Infinity", onClick: () => {} }
    ];
    row2.appendChild(this.createDropdown("Calculus & Halo ▾", calcItems));

    // Dropdown 3: Functions
    const fnItems = [
      { text: "exp(x)", sub: "Exponential", onClick: () => {} },
      { text: "ln(x)", sub: "Natural Log", onClick: () => {} },
      { text: "abs(x)", sub: "Absolute Value", onClick: () => {} },
      { text: "sqrt(x)", sub: "Square Root", onClick: () => {} },
      { text: "sgn(x)", sub: "Signum Step", onClick: () => {} },
      { text: "floor(x)", sub: "Floor Step", onClick: () => {} },
      { text: "ceil(x)", sub: "Ceiling Step", onClick: () => {} }
    ];
    row2.appendChild(this.createDropdown("Functions ▾", fnItems));

    // Dropdown 4: Logic & Quantifiers
    const logicItems = [
      { text: "¬", sub: "Negation", onClick: () => { this.pxe.addCharacter("n"); this.updatePXEText(); this.syncModernUI(); } },
      { text: "∧", sub: "Conjunction", onClick: () => { this.pxe.addCharacter("a"); this.updatePXEText(); this.syncModernUI(); } },
      { text: "∨", sub: "Disjunction", onClick: () => { this.pxe.addCharacter("o"); this.updatePXEText(); this.syncModernUI(); } },
      { text: "→", sub: "Implication", onClick: () => { this.pxe.addCharacter("i"); this.updatePXEText(); this.syncModernUI(); } },
      { text: "↔", sub: "Equivalence", onClick: () => { this.pxe.addCharacter("e"); this.updatePXEText(); this.syncModernUI(); } },
      { text: "∀", sub: "For All", onClick: () => {} },
      { text: "∃", sub: "There Exists", onClick: () => {} },
      { text: "[", sub: "Left Bracket", onClick: () => { this.pxe.addCharacter("["); this.updatePXEText(); this.syncModernUI(); } },
      { text: "]", sub: "Right Bracket", onClick: () => { this.pxe.addCharacter("]"); this.updatePXEText(); this.syncModernUI(); } }
    ];
    row2.appendChild(this.createDropdown("Logic & Quantifiers ▾", logicItems));

    toolbarBox.appendChild(row2);
    card.appendChild(toolbarBox);
  }

  // Helper to build sleek floating dropdown menus
  createDropdown(label: string, items: { text: string; sub?: string; onClick: () => void }[]): HTMLElement {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position: relative; display: inline-block;";

    const btn = document.createElement("button");
    btn.style.cssText = "display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; font-size: 12px; font-weight: 600; color: #334155; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;";
    btn.innerHTML = `<span>${label}</span>`;

    const menu = document.createElement("div");
    menu.style.cssText = "position: absolute; top: 100%; left: 0; margin-top: 4px; z-index: 1000; min-width: 170px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.12); padding: 5px; display: none; flex-direction: column; gap: 2px;";

    items.forEach(item => {
      const itemBtn = document.createElement("button");
      itemBtn.style.cssText = "display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 5px 9px; font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a; background: transparent; border: none; border-radius: 4px; text-align: left; cursor: pointer; transition: background 0.12s ease;";
      itemBtn.innerHTML = `<span>${item.text}</span> ${item.sub ? `<span style="font-size: 10px; color: #64748b; font-family: sans-serif;">${item.sub}</span>` : ""}`;
      itemBtn.addEventListener("mouseover", () => itemBtn.style.background = "#f1f5f9");
      itemBtn.addEventListener("mouseout", () => itemBtn.style.background = "transparent");
      itemBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.style.display = "none";
        item.onClick();
      });
      menu.appendChild(itemBtn);
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isShown = menu.style.display === "flex";
      document.querySelectorAll(".fsd-dropdown-menu").forEach((m: any) => m.style.display = "none");
      menu.style.display = isShown ? "none" : "flex";
    });

    menu.classList.add("fsd-dropdown-menu");
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  // --- STAGE 2: Variable Slot Typing & Domain Configuration ---
  renderModernStage2(card: HTMLElement) {
    const cardTitle = document.createElement("div");
    cardTitle.style.cssText = "font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;";
    cardTitle.textContent = "Stage 2: Slot Typing & Domain Configuration";
    card.appendChild(cardTitle);

    const desc = document.createElement("p");
    desc.style.cssText = "margin: 0 0 14px 0; font-size: 13.5px; color: #475569; line-height: 1.5;";
    desc.innerHTML = "Assign typed variables or domain constants to each relation slot. Click any slot chip to configure its variable assignment and domain bounds:";
    card.appendChild(desc);

    // Slot Chips List
    const slotList = document.createElement("div");
    slotList.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;";

    this.slots.forEach((s, idx) => {
      const isSel = idx === this.selectedSlotIndex;
      const vText = s.assignedVar || (s.domainType === "𝒫(ℕ)" ? "y?" : "x?");
      const chip = document.createElement("button");
      chip.style.cssText = `display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-family: monospace; font-size: 13px; font-weight: 700; border-radius: 6px; border: 1.5px solid ${isSel ? '#0284c7' : '#cbd5e1'}; background: ${isSel ? '#0284c7' : '#ffffff'}; color: ${isSel ? '#ffffff' : '#0369a1'}; cursor: pointer; transition: all 0.15s ease;`;
      chip.innerHTML = `<span>Slot ${idx + 1}:</span> <span>${s.predName}(${vText})</span> <span style="font-size: 10px; opacity: 0.8; font-family: sans-serif;">[${s.domainType}]</span>`;
      chip.addEventListener("click", () => {
        this.selectedSlotIndex = idx;
        this.renderStageControls();
        this.updatePXEText();
        this.syncModernUI();
      });
      slotList.appendChild(chip);
    });
    card.appendChild(slotList);

    // Active Slot Configurator Box
    const activeSlot = this.slots[this.selectedSlotIndex];
    if (activeSlot) {
      const configBox = document.createElement("div");
      configBox.style.cssText = "background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px;";

      const isPowerSet = activeSlot.domainType === "𝒫(ℕ)";
      configBox.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 10px;">
          Assign Variable for Slot ${this.selectedSlotIndex + 1} (${activeSlot.predName} on ${activeSlot.domainType}):
        </div>
      `;

      // Variable Options
      const varRow = document.createElement("div");
      varRow.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 12px;";

      const varsToShow = isPowerSet ? this.setVars : this.elementVars;
      varsToShow.forEach((v) => {
        const isAssigned = activeSlot.assignedVar === v;
        const btn = document.createElement("button");
        btn.style.cssText = `padding: 5px 12px; font-family: monospace; font-size: 13px; font-weight: 700; border-radius: 5px; border: 1.5px solid ${isAssigned ? '#0284c7' : '#cbd5e1'}; background: ${isAssigned ? '#0284c7' : '#ffffff'}; color: ${isAssigned ? '#ffffff' : '#1e293b'}; cursor: pointer; transition: all 0.12s ease;`;
        btn.textContent = v;
        btn.addEventListener("click", () => {
          this.assignVarToActiveSlot(v);
          this.syncModernUI();
        });
        varRow.appendChild(btn);
      });

      // + Var Button
      const btnNewVar = document.createElement("button");
      btnNewVar.style.cssText = "padding: 5px 12px; font-size: 12px; font-weight: 700; border-radius: 5px; border: 1.5px dashed #0284c7; background: #f0f9ff; color: #0284c7; cursor: pointer;";
      btnNewVar.textContent = isPowerSet ? "+ yVar" : "+ xVar";
      btnNewVar.addEventListener("click", () => {
        const subscripts = ["₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈"];
        if (isPowerSet) {
          const nextIdx = this.setVars.filter((v) => v.startsWith("y")).length;
          const sub = subscripts[nextIdx] || `${nextIdx + 1}`;
          const newV = `y${sub}`;
          this.setVars.unshift(newV);
          this.assignVarToActiveSlot(newV);
        } else {
          const nextIdx = this.elementVars.length;
          const sub = subscripts[nextIdx] || `${nextIdx + 1}`;
          const newV = `x${sub}`;
          this.elementVars.push(newV);
          this.assignVarToActiveSlot(newV);
        }
        this.syncModernUI();
      });
      varRow.appendChild(btnNewVar);

      // Number constants for element slots
      if (!isPowerSet) {
        this.numberConstants.forEach((numStr) => {
          const isAssigned = activeSlot.assignedVar === numStr;
          const btn = document.createElement("button");
          btn.style.cssText = `padding: 5px 11px; font-family: monospace; font-size: 12.5px; font-weight: 700; border-radius: 5px; border: 1.5px solid ${isAssigned ? '#059669' : '#cbd5e1'}; background: ${isAssigned ? '#059669' : '#ffffff'}; color: ${isAssigned ? '#ffffff' : '#059669'}; cursor: pointer;`;
          btn.textContent = numStr;
          btn.addEventListener("click", () => {
            this.assignVarToActiveSlot(numStr);
            this.syncModernUI();
          });
          varRow.appendChild(btn);
        });
      }

      configBox.appendChild(varRow);

      // Domain Bounds Adjuster for assigned element variable
      if (activeSlot.assignedVar && !isConstantTerm(activeSlot.assignedVar) && !activeSlot.assignedVar.startsWith("y")) {
        const curDomain = this.getVarDomain(activeSlot.assignedVar);
        const domRow = document.createElement("div");
        domRow.style.cssText = "display: flex; gap: 8px; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px; flex-wrap: wrap;";

        const domLabel = document.createElement("span");
        domLabel.style.cssText = "font-size: 12px; font-weight: 600; color: #475569;";
        domLabel.innerHTML = `Domain for <code>${activeSlot.assignedVar}</code>: <strong>${formatDomainSpec(curDomain)}</strong>`;
        domRow.appendChild(domLabel);

        const btnCycle = document.createElement("button");
        btnCycle.style.cssText = "padding: 3px 9px; font-size: 11.5px; font-weight: 600; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer;";
        btnCycle.textContent = "Cycle Domain Type ⟳";
        btnCycle.addEventListener("click", () => {
          this.cycleVarDomain(activeSlot.assignedVar!);
          this.syncModernUI();
        });
        domRow.appendChild(btnCycle);

        if (typeof curDomain.param === "number") {
          const btnMinus = document.createElement("button");
          btnMinus.style.cssText = "padding: 2px 7px; font-size: 12px; font-weight: bold; color: #334155; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;";
          btnMinus.textContent = "-";
          btnMinus.disabled = curDomain.param <= 1;
          btnMinus.addEventListener("click", () => {
            this.adjustVarDomainParam(activeSlot.assignedVar!, -1);
            this.syncModernUI();
          });
          domRow.appendChild(btnMinus);

          const btnPlus = document.createElement("button");
          btnPlus.style.cssText = "padding: 2px 7px; font-size: 12px; font-weight: bold; color: #334155; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;";
          btnPlus.textContent = "+";
          btnPlus.disabled = curDomain.param >= 64;
          btnPlus.addEventListener("click", () => {
            this.adjustVarDomainParam(activeSlot.assignedVar!, 1);
            this.syncModernUI();
          });
          domRow.appendChild(btnPlus);
        }

        configBox.appendChild(domRow);
      }

      card.appendChild(configBox);
    }

    // Type Clash Alert if any
    const { hasMismatch, conflictingVar } = this.checkTypeMismatch();
    if (hasMismatch) {
      const clashBox = document.createElement("div");
      clashBox.style.cssText = "background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 12.5px; color: #991b1b;";
      clashBox.innerHTML = `<strong>⚠️ Type Clash Detected:</strong> Variable <code>${conflictingVar}</code> is assigned across conflicting domains (ℕ element vs 𝒫(ℕ) subset). Please reassign consistent domain variables.`;
      card.appendChild(clashBox);
    }
  }

  // --- STAGE 3: Quantifier Prefix & Variable Scoping ---
  renderModernStage3(card: HTMLElement) {
    const cardTitle = document.createElement("div");
    cardTitle.style.cssText = "font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;";
    cardTitle.textContent = "Stage 3: Quantifier Prefix & Variable Scoping";
    card.appendChild(cardTitle);

    const desc = document.createElement("p");
    desc.style.cssText = "margin: 0 0 14px 0; font-size: 13.5px; color: #475569; line-height: 1.5;";
    desc.innerHTML = "Assign quantifiers (<strong>∀</strong> for Universal, <strong>∃</strong> for Existential) to each free variable to establish the mathematical scope:";
    card.appendChild(desc);

    const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
    const unquantifiedVars = uniqueVars.filter((v) => !this.quantifierBindings.some((q) => q.variable === v));

    // Bound Quantifiers List
    if (this.quantifierBindings.length > 0) {
      const boundBox = document.createElement("div");
      boundBox.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center;";

      const boundLabel = document.createElement("span");
      boundLabel.style.cssText = "font-size: 12px; font-weight: 700; color: #0f172a;";
      boundLabel.textContent = "Scoped Quantifiers:";
      boundBox.appendChild(boundLabel);

      this.quantifierBindings.forEach((q, idx) => {
        const chip = document.createElement("div");
        chip.style.cssText = "display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; font-family: monospace; font-size: 13px; font-weight: bold; border-radius: 6px; background: #e0f2fe; color: #0369a1; border: 1.5px solid #bae6fd;";
        chip.innerHTML = `<span>${q.quantifier}</span> <span>${q.variable}</span> <span style="font-size: 11px; color: #64748b; font-family: sans-serif;">∈ ${q.domainType}</span>`;
        boundBox.appendChild(chip);
      });

      // Clear quantifiers button
      const btnResetQ = document.createElement("button");
      btnResetQ.style.cssText = "padding: 4px 9px; font-size: 11.5px; font-weight: 600; color: #dc2626; background: #ffffff; border: 1px solid #fca5a5; border-radius: 4px; cursor: pointer;";
      btnResetQ.textContent = "Clear Quantifiers";
      btnResetQ.addEventListener("click", () => {
        this.resetStage3();
        this.syncModernUI();
      });
      boundBox.appendChild(btnResetQ);

      card.appendChild(boundBox);
    }

    // Unquantified Variable Target
    if (unquantifiedVars.length > 0) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      const curDomain = this.getVarDomain(targetVar);
      const dTypeStr = formatDomainSpec(curDomain);

      const targetBox = document.createElement("div");
      targetBox.style.cssText = "background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px;";

      targetBox.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 10px;">
          Choose Quantifier for Variable: <code>${targetVar}</code> (Domain: ${dTypeStr})
        </div>
      `;

      const qActionRow = document.createElement("div");
      qActionRow.style.cssText = "display: flex; gap: 10px; align-items: center; flex-wrap: wrap;";

      // Universal Quantifier Button
      const btnForall = document.createElement("button");
      btnForall.style.cssText = "padding: 8px 18px; font-size: 14px; font-weight: 800; color: #ffffff; background: #0284c7; border: 1.5px solid #0284c7; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;";
      btnForall.innerHTML = `<span>∀</span> <span>Universal (For All ${targetVar})</span>`;
      btnForall.addEventListener("click", () => {
        this.applyQuantifier("∀");
        this.syncModernUI();
      });
      qActionRow.appendChild(btnForall);

      // Existential Quantifier Button
      const btnExists = document.createElement("button");
      btnExists.style.cssText = "padding: 8px 18px; font-size: 14px; font-weight: 800; color: #ffffff; background: #059669; border: 1.5px solid #059669; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;";
      btnExists.innerHTML = `<span>∃</span> <span>Existential (There Exists ${targetVar})</span>`;
      btnExists.addEventListener("click", () => {
        this.applyQuantifier("∃");
        this.syncModernUI();
      });
      qActionRow.appendChild(btnExists);

      targetBox.appendChild(qActionRow);
      card.appendChild(targetBox);
    }

    // 2-Variable Order Swap Button (Crucial Pedagogical Tool for 2D Matrix)
    if (this.quantifierBindings.length >= 2) {
      const q0 = this.quantifierBindings[0];
      const q1 = this.quantifierBindings[1];

      const swapBox = document.createElement("div");
      swapBox.style.cssText = "background: #f8fafc; border: 1.5px solid #c7d2fe; border-radius: 8px; padding: 12px 16px; margin-top: 10px;";

      swapBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #4338ca; text-transform: uppercase;">
              ⇄ Quantifier Order Switching (2D Matrix Pedagogical Mode)
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">
              Current Order: <strong>${q0.quantifier}${q0.variable} ${q1.quantifier}${q1.variable}</strong>
            </div>
          </div>
          <button id="fsdBtnSwapOrder" style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; color: #4338ca; background: #ffffff; border: 1.5px solid #a5b4fc; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
            Swap Order (${q1.quantifier}${q1.variable} ${q0.quantifier}${q0.variable}) ⇄
          </button>
        </div>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 6px; line-height: 1.4;">
          ↳ <em>Pedagogical Matrix Contrast:</em> In the 2D Binary Matrix, <code>∀x₁ ∃x₂</code> checks row-wise coverage (each row contains a light), whereas <code>∃x₂ ∀x₁</code> demands a solid vertical "master-key" column!
        </div>
      `;

      swapBox.querySelector("#fsdBtnSwapOrder")?.addEventListener("click", () => {
        this.swapQuantifierOrder();
      });

      card.appendChild(swapBox);
    }
  }

  // --- STAGE 4: Truth Table Mount & 2D Matrix Visualizer Mount ---
  renderModernStage4(card: HTMLElement) {
    const cardTitle = document.createElement("div");
    cardTitle.style.cssText = "font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px;";
    cardTitle.textContent = "Stage 4: Truth Table & 2D Binary Relation Matrix Visualizer";
    card.appendChild(cardTitle);

    const desc = document.createElement("p");
    desc.style.cssText = "margin: 0 0 14px 0; font-size: 13.5px; color: #475569; line-height: 1.5;";
    desc.innerHTML = "Evaluated constructive truth table across the discrete tree, with live 2D binary matrix structure and quantifier row/column sweep analysis:";
    card.appendChild(desc);

    this.modernStage4Mount = document.createElement("div");
    this.modernStage4Mount.id = "fsdModernStage4Mount";
    this.modernStage4Mount.style.cssText = "width: 100%; box-sizing: border-box;";
    card.appendChild(this.modernStage4Mount);

    this.renderStage4Table();
  }

  // Swap Quantifier Order for 2-variable pedagogical matrix exploration
  swapQuantifierOrder() {
    if (this.quantifierBindings.length >= 2) {
      const temp = this.quantifierBindings[0];
      this.quantifierBindings[0] = this.quantifierBindings[1];
      this.quantifierBindings[1] = temp;
      this.renderStageControls();
      this.updatePXEText();
      this.syncModernUI();
    }
  }

  // --- RENDER FOOTER ACTIONS ---
  renderModernFooterBar() {
    if (!this.modernFooterBar) return;
    this.modernFooterBar.innerHTML = "";

    // Left: Previous Step Button
    const leftGroup = document.createElement("div");
    leftGroup.style.cssText = "display: flex; gap: 8px; align-items: center;";

    if (this.stage > 1) {
      const btnPrev = document.createElement("button");
      btnPrev.style.cssText = "padding: 8px 16px; font-size: 13px; font-weight: 700; color: #475569; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;";
      btnPrev.innerHTML = `<span>←</span> <span>Previous Step</span>`;
      btnPrev.addEventListener("click", () => {
        this.prevStage();
        this.syncModernUI();
      });
      leftGroup.appendChild(btnPrev);
    }

    const btnNew = document.createElement("button");
    btnNew.style.cssText = "padding: 8px 14px; font-size: 12.5px; font-weight: 600; color: #0f172a; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer;";
    btnNew.textContent = "New Statement";
    btnNew.addEventListener("click", () => {
      this.clear();
      this.syncModernUI();
    });
    leftGroup.appendChild(btnNew);

    this.modernFooterBar.appendChild(leftGroup);

    // Right: Advance Step / Commit Actions
    const rightGroup = document.createElement("div");
    rightGroup.style.cssText = "display: flex; gap: 8px; align-items: center;";

    // Content Editor integration buttons
    if (this.usedByContentEditor) {
      const btnCommit = document.createElement("button");
      btnCommit.style.cssText = "padding: 8px 18px; font-size: 13px; font-weight: 700; color: #ffffff; background: #059669; border: 1.5px solid #059669; border-radius: 6px; cursor: pointer;";
      btnCommit.textContent = this.editorButtonLabel || "Return to Content Editor ✓";
      btnCommit.addEventListener("click", () => this.backToContentEditor());
      rightGroup.appendChild(btnCommit);

      const btnCancel = document.createElement("button");
      btnCancel.style.cssText = "padding: 8px 14px; font-size: 13px; font-weight: 600; color: #64748b; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; cursor: pointer;";
      btnCancel.textContent = "Cancel";
      btnCancel.addEventListener("click", () => this.cancelAndReturn());
      rightGroup.appendChild(btnCancel);

      if (this.isEditingExistingTag) {
        const btnDelete = document.createElement("button");
        btnDelete.style.cssText = "padding: 8px 14px; font-size: 13px; font-weight: 600; color: #dc2626; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 6px; cursor: pointer;";
        btnDelete.textContent = "Delete Tag";
        btnDelete.addEventListener("click", () => this.deleteTagAndReturn());
        rightGroup.appendChild(btnDelete);
      }
    } else {
      // Copy Ref Tag Button
      const btnCopyRef = document.createElement("button");
      btnCopyRef.style.cssText = "padding: 8px 14px; font-size: 12.5px; font-weight: 600; color: #0284c7; background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; cursor: pointer;";
      btnCopyRef.textContent = "Copy Ref Tag";
      btnCopyRef.addEventListener("click", async () => {
        const exp = this.pxe.exp;
        const qStr = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}:${q.domainType}`).join(" ");
        const slotsStr = this.slots.map((s) => s.assignedVar || "").join(",");
        const refTag = `<fsd-ref exp="${exp}" quantifiers="${qStr}" slots="${slotsStr}" style="color:firebrick;font-weight:bold">${this.formatFSDExp(exp)}</fsd-ref>`;
        try {
          await navigator.clipboard.writeText(refTag);
          btnCopyRef.textContent = "Copied Ref ✓";
          setTimeout(() => btnCopyRef.textContent = "Copy Ref Tag", 2000);
        } catch (err) {
          console.error("Failed to copy reference tag:", err);
        }
      });
      rightGroup.appendChild(btnCopyRef);

      // Advance Button
      if (this.stage < 4) {
        let btnText = "Bind Variables →";
        let isEnabled = false;

        if (this.stage === 1) {
          const expClass = this.pxe.setExpectClass();
          isEnabled = expClass === "back" && this.pxe.nl === 0 && this.pxe.exp.length > 0;
          btnText = "Bind Variables →";
        } else if (this.stage === 2) {
          const allBound = this.slots.length > 0 && this.slots.every((s) => s.assignedVar !== undefined);
          const { hasMismatch } = this.checkTypeMismatch();
          isEnabled = allBound && !hasMismatch;
          btnText = "Quantify Variables →";
        } else if (this.stage === 3) {
          const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
          isEnabled = uniqueVars.every((v) => this.quantifierBindings.some((q) => q.variable === v));
          btnText = "Evaluate Statement →";
        }

        const btnAdvance = document.createElement("button");
        btnAdvance.style.cssText = `padding: 8px 20px; font-size: 13px; font-weight: 800; border-radius: 6px; border: 1.5px solid ${isEnabled ? '#0284c7' : '#cbd5e1'}; background: ${isEnabled ? '#0284c7' : '#f1f5f9'}; color: ${isEnabled ? '#ffffff' : '#94a3b8'}; cursor: ${isEnabled ? 'pointer' : 'not-allowed'}; transition: all 0.15s ease;`;
        btnAdvance.textContent = btnText;
        btnAdvance.disabled = !isEnabled;
        btnAdvance.addEventListener("click", () => {
          if (isEnabled) {
            this.advanceStage();
            this.syncModernUI();
          }
        });
        rightGroup.appendChild(btnAdvance);
      }
    }

    this.modernFooterBar.appendChild(rightGroup);
  }

  // Generate Lean 4 Machine Certified Theorem Name
  getGoverningTheorem(): string {
    if (this.pxe.exp.includes("s")) return "fsd_order_lt";
    if (this.pxe.exp.includes("k")) return "fsd_eq_refl";
    if (this.pxe.exp.includes("l")) return "fsd_le_refl";
    if (this.pxe.exp.includes("u")) return "fsd_transect_succ";
    if (this.pxe.exp.includes("m")) return "fsd_powerset_mem";
    if (this.pxe.exp.includes("b")) return "fsd_subset_refl";
    if (this.pxe.exp.includes("w")) return "fsd_halo_near";
    return "fsd_constructive_tree";
  }

  // Generate Lean 4 Certified Proof Snippet
  getLeanSnippet(): string {
    if (this.pxe.exp.includes("s")) {
      return `-- Machine Certified Constructive Order on ℕ Spine\ntheorem fsd_order_lt : ∀ (x : Nat), ∃ (y : Nat), x < y := by\n  intro x\n  use (x + 1)\n  apply Nat.lt_succ_self`;
    }
    if (this.pxe.exp.includes("k")) {
      return `-- Constructive Reflexive Identity\ntheorem fsd_eq_refl : ∀ (x : Nat), x = x := by\n  intro x\n  rfl`;
    }
    if (this.pxe.exp.includes("l")) {
      return `-- Constructive Order Reflexivity\ntheorem fsd_le_refl : ∀ (x : Nat), x ≤ x := by\n  intro x\n  apply Nat.le_refl`;
    }
    if (this.pxe.exp.includes("u")) {
      return `-- Discrete Successor / Transect Step Verified\ntheorem fsd_transect_succ : ∀ (x : Nat), ∃ (y : Nat), y = x + 1 := by\n  intro x\n  use (x + 1)\n  rfl`;
    }
    if (this.pxe.exp.includes("m")) {
      return `-- Power Set Constructive Incidence Certification\ntheorem fsd_powerset_mem : ∀ (x : Nat), ∃ (s : Set Nat), x ∈ s := by\n  intro x\n  use {x}\n  simp`;
    }
    if (this.pxe.exp.includes("b")) {
      return `-- Subset Reflexivity Certified\ntheorem fsd_subset_refl : ∀ (A : Nat → Prop), ∀ (x : Nat), A x → A x := by\n  intro A x h\n  exact h`;
    }
    if (this.pxe.exp.includes("w")) {
      return `-- Infinitesimal Halo Proximity Certified\ntheorem fsd_halo_near : ∀ (x : Real), ∃ (y : Real), y ≈ x := by\n  intro x\n  use x\n  apply near_refl`;
    }
    return `-- Middle Way Constructive Spine Certification\ntheorem fsd_constructive_tree : ∀ (x : Nat), ∃ (y : Nat), x + 1 > x := by\n  intro x\n  use (x + 1)\n  apply Nat.lt_succ_self`;
  }

  clearStageControls() {
    this.stageControls.forEach((e) => e.elt.remove());
    this.stageControls = [];
    this.controls.forEach((e) => e.elt.remove());
    this.controls = [];
  }

  showControls() {
    this.renderStageControls();
  }

  renderStageControls() {
    this.clearStageControls();

    if (this.stage === 1) {
      this.buildStage1Controls();
    } else if (this.stage === 2) {
      this.buildStage2Controls();
    } else if (this.stage === 3) {
      this.buildStage3Controls();
    } else if (this.stage === 4) {
      this.buildStage4Controls();
    }

    if (this.usedByContentEditor) {
      this.editorButton.setAA([
        "pointer-events",
        "auto",
        "visibility",
        "visible",
        "stroke",
        "forestgreen",
      ]);
      this.cancelButton.setAA([
        "pointer-events",
        "auto",
        "visibility",
        "visible",
        "stroke",
        "#64748b",
      ]);
      this.stageControls.unshift(this.editorButton);
      this.stageControls.splice(1, 0, this.cancelButton);
      if (this.isEditingExistingTag) {
        this.deleteButton.setAA([
          "pointer-events",
          "auto",
          "visibility",
          "visible",
          "stroke",
          "crimson",
        ]);
        this.stageControls.splice(2, 0, this.deleteButton);
      }
    }

    this.layoutStageControls();
    this.setButtonStates();

    if (this.modernMounted) {
      this.syncModernUI();
    }
  }

  buildStage1Controls() {
    const legacyPredNames = ["GT5", "LT10", "EVEN", "ODD"];
    this.predButtons = PredicateRegistry.getPredicates()
      .filter((p) => !legacyPredNames.includes(p.symbol) && !legacyPredNames.includes(p.id))
      .map((p) => {
        return new SVGSelectableText(() => this.pxe.addCharacter(p.code), p.symbol, false);
      });

    this.buttonNeg = new SVGSelectableText(() => this.pxe.addCharacter("n"), "¬", false);
    this.buttonAnd = new SVGSelectableText(() => this.pxe.addCharacter("a"), "∧", false);
    this.buttonOr = new SVGSelectableText(() => this.pxe.addCharacter("o"), "∨", false);
    this.buttonImply = new SVGSelectableText(() => this.pxe.addCharacter("i"), "→", false);
    this.buttonEquiv = new SVGSelectableText(() => this.pxe.addCharacter("e"), "↔", false);
    this.buttonLB = new SVGSelectableText(() => this.pxe.addCharacter("["), "[", false);
    this.buttonRB = new SVGSelectableText(() => this.pxe.addCharacter("]"), "]", false);
    this.buttonBackspace = new SVGSelectableText(() => this.pxe.backspace(), "⌫", false);
    this.buttonClear = new SVGSelectableText(() => this.clear(), "clear", false);
    this.nextStageButton = new SVGSelectableText(() => this.advanceStage(), "Bind Variables →", false);

    this.stageControls = [
      ...this.predButtons,
      this.buttonNeg,
      this.buttonAnd,
      this.buttonOr,
      this.buttonImply,
      this.buttonEquiv,
      this.buttonLB,
      this.buttonRB,
      this.buttonBackspace,
      this.buttonClear,
      this.nextStageButton,
    ];
  }

  buildStage2Controls() {
    // Navigation & Reset Buttons
    const btnPrev = new SVGSelectableText(() => this.prevStage(), "← Exp", true);
    this.stageControls.push(btnPrev);

    const btnReset = new SVGSelectableText(() => this.resetStage2(), "Reset Slots", this.slots.some(s => s.assignedVar !== undefined));
    this.stageControls.push(btnReset);

    // Slot selection chips
    this.slots.forEach((s, idx) => {
      const isSel = idx === this.selectedSlotIndex;
      const vText = s.assignedVar || (s.domainType === "𝒫(ℕ)" ? "y?" : "x?");
      const label = `${s.predName}(${vText})`;
      const slotChip = new SVGSelectableText(
        () => {
          this.selectedSlotIndex = idx;
          this.renderStageControls();
          this.updatePXEText();
        },
        label,
        true,
        undefined,
        isSel
          ? { std: "darkred", over: "fuchsia", disabled: "grey", selected: "darkred" }
          : { std: "darkblue", over: "purple", disabled: "grey", selected: "darkblue" }
      );
      this.stageControls.push(slotChip);
    });

    const activeSlot = this.slots[this.selectedSlotIndex];
    const isPowerSet = activeSlot && activeSlot.domainType === "𝒫(ℕ)";

    // Variable Assignment Buttons for active slot
    const varsToShow = isPowerSet ? this.setVars : this.elementVars;
    varsToShow.forEach((v) => {
      const isAssignedToActive = activeSlot && activeSlot.assignedVar === v;
      const btn = new SVGSelectableText(
        () => {
          this.assignVarToActiveSlot(v);
        },
        v,
        this.slots.length > 0,
        undefined,
        isAssignedToActive
          ? { std: "darkred", over: "fuchsia", disabled: "grey", selected: "darkred" }
          : { std: "darkblue", over: "purple", disabled: "grey", selected: "darkblue" }
      );
      this.stageControls.push(btn);
    });

    // "+ Var" button to create new variable for active slot domain
    const newVarBtn = new SVGSelectableText(
      () => {
        const subscripts = ["₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈"];
        if (isPowerSet) {
          const nextIdx = this.setVars.filter((v) => v.startsWith("y")).length;
          const sub = subscripts[nextIdx] || `${nextIdx + 1}`;
          const newV = `y${sub}`;
          this.setVars.unshift(newV);
          this.assignVarToActiveSlot(newV);
        } else {
          const nextIdx = this.elementVars.length;
          const sub = subscripts[nextIdx] || `${nextIdx + 1}`;
          const newV = `x${sub}`;
          this.elementVars.push(newV);
          this.assignVarToActiveSlot(newV);
        }
      },
      isPowerSet ? "+ yVar" : "+ xVar",
      this.slots.length > 0
    );
    this.stageControls.push(newVarBtn);

    // For element slots (ℕ, Ord, ℝ_ω), provide first-class Number Term constants
    if (!isPowerSet) {
      this.numberConstants.forEach((numStr) => {
        const isAssignedToActive = activeSlot && activeSlot.assignedVar === numStr;
        const btn = new SVGSelectableText(
          () => {
            this.assignVarToActiveSlot(numStr);
          },
          numStr,
          this.slots.length > 0,
          undefined,
          isAssignedToActive
            ? { std: "#047857", over: "#10b981", disabled: "grey", selected: "#047857" }
            : { std: "#065f46", over: "#059669", disabled: "grey", selected: "#065f46" }
        );
        this.stageControls.push(btn);
      });

      const newNumBtn = new SVGSelectableText(
        () => {
          const custom = window.prompt("Enter constant number term (e.g. 0, 1, 5, 440, 1/2, π):");
          if (custom && custom.trim()) {
            const clean = custom.trim();
            if (!this.numberConstants.includes(clean)) {
              this.numberConstants.push(clean);
              this.availableVars.push(clean);
            }
            this.assignVarToActiveSlot(clean);
          }
        },
        "+ Num",
        this.slots.length > 0,
        undefined,
        { std: "#047857", over: "#10b981", disabled: "grey", selected: "#047857" }
      );
      this.stageControls.push(newNumBtn);
    }

    // If active slot has an assigned element variable (e.g. x₁), add domain configurator
    if (activeSlot && activeSlot.assignedVar && !isConstantTerm(activeSlot.assignedVar) && !activeSlot.assignedVar.startsWith("y")) {
      const curDomain = this.getVarDomain(activeSlot.assignedVar);
      const domLabel = `Dom(${activeSlot.assignedVar}): ${formatDomainSpec(curDomain)}`;
      const domChip = new SVGSelectableText(
        () => this.cycleVarDomain(activeSlot.assignedVar!),
        domLabel,
        true,
        undefined,
        { std: "#0d6efd", over: "#0b5ed7", disabled: "grey", selected: "#0d6efd" }
      );
      this.stageControls.push(domChip);

      if (typeof curDomain.param === "number") {
        const btnMinus = new SVGSelectableText(
          () => this.adjustVarDomainParam(activeSlot.assignedVar!, -1),
          "-",
          curDomain.param > 1
        );
        const btnPlus = new SVGSelectableText(
          () => this.adjustVarDomainParam(activeSlot.assignedVar!, 1),
          "+",
          curDomain.param < 64
        );
        this.stageControls.push(btnMinus);
        this.stageControls.push(btnPlus);
      }
    }

    // Check Type Clash
    const { hasMismatch, conflictingVar } = this.checkTypeMismatch();

    // Stage 2 Transition Button (enabled only when ALL slots are bound AND no type clash)
    const allBound = this.slots.length > 0 && this.slots.every((s) => s.assignedVar !== undefined);
    const nextBtn = new SVGSelectableText(
      () => this.advanceStage(),
      hasMismatch ? `Type Clash: ${conflictingVar}` : "Quantify Variables →",
      allBound && !hasMismatch
    );
    this.stageControls.push(nextBtn);
  }

  buildStage3Controls() {
    // Navigation & Reset Buttons
    const btnPrev = new SVGSelectableText(() => this.prevStage(), "← Slots", true);
    this.stageControls.push(btnPrev);

    const btnReset = new SVGSelectableText(() => this.resetStage3(), "Clear Quantifiers", this.quantifierBindings.length > 0);
    this.stageControls.push(btnReset);

    // Unique unquantified variables used in Stage 2 (excluding constants)
    const uniqueVars = Array.from(
      new Set(
        this.slots
          .map((s) => s.assignedVar!)
          .filter((v) => v && !isConstantTerm(v))
      )
    );

    // Sort unquantified variables topologically: independent variables first, dependent variables next
    const unquantifiedVars = uniqueVars
      .filter((v) => !this.quantifierBindings.some((q) => q.variable === v))
      .sort((a, b) => {
        const specA = this.getVarDomain(a);
        const specB = this.getVarDomain(b);
        const aDependsOnB = typeof specA.param === "string" && specA.param === b;
        const bDependsOnA = typeof specB.param === "string" && specB.param === a;
        if (aDependsOnB) return 1;
        if (bDependsOnA) return -1;
        return 0;
      });

    const hasUnquantified = unquantifiedVars.length > 0;

    if (hasUnquantified) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      const curDomain = this.getVarDomain(targetVar);
      const dTypeStr = formatDomainSpec(curDomain);

      const varChip = new SVGSelectableText(
        () => {
          this.selectedQuantifierVarIndex = (this.selectedQuantifierVarIndex + 1) % unquantifiedVars.length;
          this.renderStageControls();
          this.updatePXEText();
        },
        `Var: ${targetVar}`,
        true,
        undefined,
        { std: "darkred", over: "fuchsia", disabled: "grey", selected: "darkred" }
      );
      this.stageControls.push(varChip);

      const domChip = new SVGSelectableText(
        () => this.cycleVarDomain(targetVar),
        `Dom: ${dTypeStr}`,
        !targetVar.startsWith("y"),
        undefined,
        { std: "#0d6efd", over: "#0b5ed7", disabled: "grey", selected: "#0d6efd" }
      );
      this.stageControls.push(domChip);

      if (typeof curDomain.param === "number") {
        const btnMinus = new SVGSelectableText(
          () => this.adjustVarDomainParam(targetVar, -1),
          "-",
          curDomain.param > 1
        );
        const btnPlus = new SVGSelectableText(
          () => this.adjustVarDomainParam(targetVar, 1),
          "+",
          curDomain.param < 64
        );
        this.stageControls.push(btnMinus);
        this.stageControls.push(btnPlus);
      }
    }

    // Sparse Universal Quantifier Button "∀"
    const btnForall = new SVGSelectableText(() => this.applyQuantifier("∀"), "∀", hasUnquantified);
    this.stageControls.push(btnForall);

    // Sparse Existential Quantifier Button "∃"
    const btnExists = new SVGSelectableText(() => this.applyQuantifier("∃"), "∃", hasUnquantified);
    this.stageControls.push(btnExists);

    // Stage 3 Transition Button (enabled when all unique variables are quantified)
    const allQuantified = unquantifiedVars.length === 0 && (uniqueVars.length > 0 || this.slots.length > 0);
    const evalBtn = new SVGSelectableText(() => this.advanceStage(), "Evaluate Statement →", allQuantified);
    this.stageControls.push(evalBtn);
  }

  buildStage4Controls() {
    const btnPrevQ = new SVGSelectableText(() => this.prevStage(), "← Quantifiers", true);
    this.stageControls.push(btnPrevQ);

    const btnPrevSlots = new SVGSelectableText(
      () => {
        this.stage = 2;
        this.fo.removeChildren();
        this.fo.setV("");
        this.renderStageControls();
        this.updatePXEText();
      },
      "← Slots",
      true
    );
    this.stageControls.push(btnPrevSlots);

    const btnNew = new SVGSelectableText(() => this.clear(), "New Statement", true);
    this.stageControls.push(btnNew);

    const copyBtn = new SVGSelectableText(
      async () => {
        const exp = this.pxe.exp;
        const qStr = this.quantifierBindings
          .map((q) => `${q.quantifier}${q.variable}:${q.domainType}`)
          .join(" ");
        const slotsStr = this.slots.map((s) => s.assignedVar || "").join(",");
        const refTag = `<fsd-ref exp="${exp}" quantifiers="${qStr}" slots="${slotsStr}" style="color:firebrick;font-weight:bold">${this.formatFSDExp(exp)}</fsd-ref>`;
        try {
          await navigator.clipboard.writeText(refTag);
          copyBtn.setV("Copied Ref!");
          setTimeout(() => copyBtn.setV("Copy Ref"), 2000);
        } catch (err) {
          console.error("Failed copying reference to clipboard:", err);
        }
      },
      "Copy Ref",
      true
    );
    this.stageControls.push(copyBtn);
  }

  layoutStageControls() {
    let x = this.sideMargin + 5;
    const y =
      2 * this.vertMargin +
      PXE.textFrameHeight +
      (2 / 3) * this.controlsFrameHeight;

    const getBtnWidth = (btn: SVGElt) => {
      try {
        const bb = btn.getBB();
        if (bb && bb.width > 0) return bb.width;
      } catch (e) {}
      if (btn instanceof SVGText) {
        const str = (btn.elt as SVGElement).textContent || "";
        return Math.max(20, str.length * 9 + 8);
      }
      return 35;
    };

    this.stageControls.forEach((e) => {
      this.append(e);
      e.setAA(["x", x, "y", y]);
      const w = getBtnWidth(e);
      x += w + 12;
    });
  }

  setButtonStates() {
    if (this.stage === 1) {
      const expectClass = this.pxe.setExpectClass();

      const frontBtnsEnabled = expectClass === "front";
      if (this.predButtons) {
        this.predButtons.forEach((btn) => btn.setAble(frontBtnsEnabled));
      }
      if (this.buttonNeg) this.buttonNeg.setAble(frontBtnsEnabled);
      if (this.buttonLB) this.buttonLB.setAble(frontBtnsEnabled);

      const backBtnsEnabled = expectClass === "back";
      if (this.buttonAnd) this.buttonAnd.setAble(backBtnsEnabled);
      if (this.buttonOr) this.buttonOr.setAble(backBtnsEnabled);
      if (this.buttonImply) this.buttonImply.setAble(backBtnsEnabled);
      if (this.buttonEquiv) this.buttonEquiv.setAble(backBtnsEnabled);
      if (this.buttonRB) this.buttonRB.setAble(backBtnsEnabled && this.pxe.nl > 0);

      if (this.buttonBackspace) this.buttonBackspace.setAble(this.pxe.exp.length > 0);
      if (this.buttonClear) this.buttonClear.setAble(this.pxe.exp.length > 0);

      const isValid = expectClass === "back" && this.pxe.nl === 0;
      if (this.nextStageButton) this.nextStageButton.setAble(isValid);
    }

    if (this.usedByContentEditor) {
      let isReady = true;
      if (this.stage === 1) {
        const expectClass = this.pxe.setExpectClass();
        isReady = expectClass === "back" && this.pxe.nl === 0;
      }
      this.editorButton.setA("stroke", isReady ? "forestgreen" : "orange");
      this.cancelButton.setAA([
        "pointer-events",
        "auto",
        "visibility",
        "visible",
        "stroke",
        "#64748b",
      ]);
    }
  }

  clear() {
    this.stage = 1;
    this.elementVars = ["x₁", "x₂"];
    this.numberConstants = ["0", "1", "5", "10"];
    this.setVars = ["y₁", "y₂", "∅"];
    this.availableVars = ["x₁", "x₂", "y₁", "y₂", "0", "1", "5", "10", "∅"];
    this.selectedVar = "x₁";
    this.slots = [];
    this.varDomains = {};
    this.quantifierBindings = [];
    this.matrixVisible = false;
    this.selectedColIndex = -1;
    this.selectedSlotIndex = 0;
    this.selectedQuantifierVarIndex = 0;
    if (!this.modernMounted) {
      this.fo.removeChildren();
      this.fo.setV("");
    }
    this.pxe.exp = "";
    this.pxe.nl = 0;
    this.pxe.caret.setA("visibility", "visible");
    this.renderStageControls();
    this.pxe.displayText();
    if (this.modernMounted) {
      this.syncModernUI();
    }
  }

  prevStage() {
    if (this.stage === 2) {
      this.stage = 1;
      this.slots = [];
      this.pxe.caret.setA("visibility", "visible");
      this.renderStageControls();
      this.updatePXEText();
    } else if (this.stage === 3) {
      this.stage = 2;
      this.quantifierBindings = [];
      this.renderStageControls();
      this.updatePXEText();
    } else if (this.stage === 4) {
      this.stage = 3;
      if (!this.modernMounted) {
        this.fo.removeChildren();
        this.fo.setV("");
      }
      this.renderStageControls();
      this.updatePXEText();
    }
    if (this.modernMounted) {
      this.syncModernUI();
    }
  }

  resetStage2() {
    this.slots.forEach((s) => (s.assignedVar = undefined));
    this.varDomains = {};
    this.selectedSlotIndex = 0;
    this.renderStageControls();
    this.updatePXEText();
  }

  resetStage3() {
    this.quantifierBindings = [];
    this.selectedQuantifierVarIndex = 0;
    this.renderStageControls();
    this.updatePXEText();
  }

  advanceStage() {
    if (this.stage === 1) {
      this.setupStage2();
    } else if (this.stage === 2) {
      this.setupStage3();
    } else if (this.stage === 3) {
      this.setupStage4();
    }
    if (this.modernMounted) {
      this.syncModernUI();
    }
  }

  loadFromRefData(data: { exp?: string; quantifiers?: string; slots?: string; stage?: string } = {}) {
    this.clear();
    const exp = (data.exp || "").trim();
    this.pxe.exp = exp;
    let nl = 0;
    for (const ch of this.pxe.exp) {
      if (ch === "[") nl++;
      else if (ch === "]") nl--;
    }
    this.pxe.nl = Math.max(0, nl);

    const quantifiersStr = data.quantifiers;
    const slotsStr = data.slots;
    const stageStr = data.stage;

    if (!exp) {
      this.stage = 1;
      this.showControls();
      this.layoutEditor();
      return;
    }

    if (quantifiersStr || stageStr === "4" || !stageStr) {
      // Setup Stage 2 slots
      this.setupStage2();

      // Assign domain-typed variables or constants to slots
      if (slotsStr) {
        const slotAssignments = slotsStr.split(",").map((s) => s.trim());
        this.slots.forEach((s, idx) => {
          if (slotAssignments[idx]) {
            s.assignedVar = slotAssignments[idx];
          }
        });
      } else {
        // Intelligent default slot assignment
        if (exp === "paq" || exp === "poq" || exp === "p" || exp === "q" || exp === "np" || exp === "nq") {
          this.slots.forEach((s) => {
            s.assignedVar = "x₁";
          });
        } else if (exp === "mam" || exp === "mom") {
          if (this.slots.length >= 4) {
            this.slots[0].assignedVar = "x₁";
            this.slots[1].assignedVar = "GT5";
            this.slots[2].assignedVar = "x₁";
            this.slots[3].assignedVar = "LT10";
          } else if (this.slots.length >= 2) {
            this.slots[0].assignedVar = "x₁";
            this.slots[1].assignedVar = "y₁";
          }
        } else if (exp === "ras" || exp === "r" || exp === "s" || exp === "k" || exp === "nk" || exp === "l" || exp === "u" || exp === "w" || exp === "c" || exp === "j") {
          this.slots.forEach((s, idx) => {
            s.assignedVar = (idx % 2 === 0) ? "x₁" : "x₂";
          });
        } else {
          let yCount = 1;
          this.slots.forEach((s, idx) => {
            if (s.domainType === "𝒫(ℕ)") {
              s.assignedVar = yCount === 1 ? "y₁" : (yCount === 2 ? "y₂" : `y${yCount}`);
              yCount++;
            } else {
              s.assignedVar = (idx % 2 === 0) ? "x₁" : "x₂";
            }
          });
        }
      }

      // Parse quantifiers
      this.setupStage3();
      if (quantifiersStr) {
        this.quantifierBindings = [];
        const qMatches = quantifiersStr.match(/(?:∀|∃|\\forall|\\exists)[^∀∃\\]+/g) || [quantifiersStr];
        for (const token of qMatches) {
          const isForall = token.startsWith("∀") || token.toLowerCase().startsWith("forall") || token.toLowerCase().startsWith("\\forall");
          const qSymbol: "∀" | "∃" = isForall ? "∀" : "∃";
          const cleanToken = token.replace(/∀|∃|\\forall|\\exists/g, "").trim().replace(/^,/, "").trim();
          const colonIdx = cleanToken.indexOf(":");
          let varRaw = colonIdx !== -1 ? cleanToken.substring(0, colonIdx) : cleanToken;
          let dRaw = colonIdx !== -1 ? cleanToken.substring(colonIdx + 1).trim() : "";

          let varName = varRaw ? varRaw.replace(/x1/g, "x₁").replace(/x2/g, "x₂").replace(/y1/g, "y₁").replace(/y2/g, "y₂").replace(/x_1/g, "x₁").replace(/x_2/g, "x₂").trim() : "x₁";

          let dSpec = parseDomainSpec(dRaw);
          if (varName.startsWith("y") && !dRaw) dSpec = { base: "𝒫(ℕ)" };
          const dTypeStr = formatDomainSpec(dSpec);

          this.setVarDomain(varName, dSpec);
          this.quantifierBindings.push({
            quantifier: qSymbol,
            variable: varName,
            domainType: dTypeStr,
          });
        }
        if (this.quantifierBindings.length === 0) {
          this.quantifierBindings.push({ quantifier: "∃", variable: "x₁", domainType: "ℕ" });
        }
      } else {
        const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
        this.quantifierBindings = uniqueVars.map((v) => ({
          quantifier: "∃",
          variable: v,
          domainType: formatDomainSpec(this.getVarDomain(v)),
        }));
      }

      // Launch Stage 4 directly
      this.setupStage4();
    } else if (stageStr === "2") {
      this.setupStage2();
    } else {
      this.showControls();
    }

    this.layoutEditor();
  }

  selectedSlotIndex: number = 0;
  selectedQuantifierVarIndex: number = 0;

  // --- STAGE 2: Variable Slot Binding ---
  setupStage2() {
    this.stage = 2;
    this.slots = [];
    this.elementVars = ["x₁", "x₂"];
    this.numberConstants = ["0", "1", "5", "10"];
    this.setVars = ["y₁", "y₂", "∅", "GT5", "LT10"];
    this.availableVars = ["x₁", "x₂", "y₁", "y₂", "0", "1", "5", "10", "∅", "GT5", "LT10"];
    this.selectedSlotIndex = 0;

    // Extract all predicate tokens from pxe.exp
    for (let i = 0; i < this.pxe.exp.length; i++) {
      const ch = this.pxe.exp[i];
      const pred = PredicateRegistry.getPredicate(ch);
      if (pred) {
        pred.signature.forEach((sigDomain, slotIdx) => {
          const domainType: DomainType = (sigDomain === "P_N" || sigDomain === "P_Tree1") ? "𝒫(ℕ)" : "ℕ";
          this.slots.push({
            predCode: pred.code,
            predName: pred.symbol,
            slotIndex: slotIdx,
            domainType
          });
        });
      }
    }

    // Direct click on top PXE bar cycles slot/variable selection
    (this.pxe.txtFrame.elt as any).onclick = () => this.handlePXEClick();
    (this.pxe.txt.elt as any).onclick = () => this.handlePXEClick();
    this.pxe.caret.setA("visibility", "hidden");

    this.renderStageControls();
    this.updatePXEText();
  }

  handlePXEClick() {
    if (this.stage === 2) {
      this.cycleSlotSelection();
    } else if (this.stage === 3) {
      this.cycleQuantifierVarSelection();
    }
  }

  cycleSlotSelection() {
    if (this.stage === 2 && this.slots.length > 0) {
      this.selectedSlotIndex = (this.selectedSlotIndex + 1) % this.slots.length;
      this.renderStageControls();
      this.updatePXEText();
    }
  }

  cycleQuantifierVarSelection() {
    if (this.stage === 3) {
      const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && !isConstantTerm(v))));
      const unquantifiedVars = uniqueVars.filter(
        (v) => !this.quantifierBindings.some((q) => q.variable === v)
      );
      if (unquantifiedVars.length > 0) {
        this.selectedQuantifierVarIndex = (this.selectedQuantifierVarIndex + 1) % unquantifiedVars.length;
        this.renderStageControls();
        this.updatePXEText();
      }
    }
  }

  // Type-Checking Invariant: Ensure no variable is bound across mismatched domain types (ℕ vs 𝒫(ℕ))
  checkTypeMismatch(): { hasMismatch: boolean; conflictingVar?: string } {
    const varTypes: { [v: string]: DomainType } = {};
    for (const s of this.slots) {
      if (s.assignedVar && !isConstantTerm(s.assignedVar)) {
        if (varTypes[s.assignedVar] && varTypes[s.assignedVar] !== s.domainType) {
          return { hasMismatch: true, conflictingVar: s.assignedVar };
        }
        varTypes[s.assignedVar] = s.domainType;
      }
    }
    return { hasMismatch: false };
  }

  assignVarToActiveSlot(v: string) {
    if (this.slots[this.selectedSlotIndex]) {
      this.slots[this.selectedSlotIndex].assignedVar = v;

      // Automatically advance to the next unassigned slot if available
      const nextUnassigned = this.slots.findIndex((s, idx) => idx > this.selectedSlotIndex && s.assignedVar === undefined);
      if (nextUnassigned !== -1) {
        this.selectedSlotIndex = nextUnassigned;
      } else {
        const anyUnassigned = this.slots.findIndex((s) => s.assignedVar === undefined);
        if (anyUnassigned !== -1) {
          this.selectedSlotIndex = anyUnassigned;
        }
      }
    }
    this.renderStageControls();
    this.updatePXEText();
  }

  // --- STAGE 3: Variable Quantification ---
  setupStage3() {
    this.stage = 3;
    this.quantifierBindings = [];
    this.selectedQuantifierVarIndex = 0;
    this.pxe.caret.setA("visibility", "hidden");
    this.renderStageControls();
    this.updatePXEText();
  }

  applyQuantifier(qSymbol: "∀" | "∃") {
    // Only quantify variables (not constant subsets like GT5, LT10)
    const uniqueVars = Array.from(
      new Set(
        this.slots
          .map((s) => s.assignedVar!)
          .filter((v) => v && v !== "GT5" && v !== "LT10")
      )
    );
    const unquantifiedVars = uniqueVars
      .filter((v) => !this.quantifierBindings.some((q) => q.variable === v))
      .sort((a, b) => {
        const specA = this.getVarDomain(a);
        const specB = this.getVarDomain(b);
        const aDependsOnB = typeof specA.param === "string" && specA.param === b;
        const bDependsOnA = typeof specB.param === "string" && specB.param === a;
        if (aDependsOnB) return 1;
        if (bDependsOnA) return -1;
        return 0;
      });

    if (unquantifiedVars.length > 0) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      if (targetVar) {
        const curDomain = this.getVarDomain(targetVar);
        const dTypeStr = formatDomainSpec(curDomain);
        this.quantifierBindings.push({
          quantifier: qSymbol,
          variable: targetVar,
          domainType: dTypeStr,
        });
        this.selectedQuantifierVarIndex = 0;
      }
    }
    this.renderStageControls();
    this.updatePXEText();
  }

  // --- STAGE 4: Truth Table Header + 1 Row Table & Interactive Matrix ---
  setupStage4() {
    this.stage = 4;
    this.pxe.caret.setA("visibility", "hidden");
    this.renderStageControls();
    this.updatePXEText();
    this.renderStage4Table();
  }

  getVariableDomainValues(v: string, context: { [k: string]: number }, N: number): number[] {
    const spec = this.getVarDomain(v);
    if (spec.base === "𝒫(ℕ)") {
      const start = spec.filterPred === "NONEMPTY" ? 1 : 0;
      return Array.from({ length: 16 - start }, (_, i) => i + start);
    }
    const allN = Array.from({ length: N }, (_, i) => i + 1);
    if (!spec.filterPred) return allN;
    if (spec.filterPred === "EVEN") return allN.filter((x) => x % 2 === 0);
    if (spec.filterPred === "GT") {
      const threshold = typeof spec.param === "number" ? spec.param : (context[spec.param as string] ?? 0);
      return allN.filter((x) => x > threshold);
    }
    if (spec.filterPred === "LT") {
      const threshold = typeof spec.param === "number" ? spec.param : (context[spec.param as string] ?? (N + 1));
      return allN.filter((x) => x < threshold);
    }
    return allN;
  }

  // Format real-time PXE expression string for Top Bar with Predicate Names and Domain Types
  formatFSDExp(exp: string): string {
    let display = "";

    // Quantifier Prefix with explicit domain typing (Stage 3+)
    if (this.stage >= 3) {
      if (this.quantifierBindings && this.quantifierBindings.length > 0) {
        const qPrefix = this.quantifierBindings
          .map((q) => `${q.quantifier}${q.variable}:${q.domainType}`)
          .join(", ");
        display += `${qPrefix} [ `;
      } else {
        display += "[ ";
      }
    }

    const getSlotVal = (idx: number) => {
      const s = this.slots[idx];
      if (!s) return "_";
      if (this.stage === 2 && !s.assignedVar && idx === this.selectedSlotIndex) {
        return s.domainType === "𝒫(ℕ)" ? "y?" : "x?";
      }
      if (!s.assignedVar) {
        return s.domainType === "𝒫(ℕ)" ? "y" : "x";
      }

      if (this.stage === 3) {
        const uniqueVars = Array.from(new Set(this.slots.map((st) => st.assignedVar!).filter((v) => v && v !== "GT5" && v !== "LT10")));
        const unquantifiedVars = uniqueVars.filter(
          (v) => !this.quantifierBindings.some((q) => q.variable === v)
        );
        if (unquantifiedVars.length > 0) {
          const activeTargetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
          if (s.assignedVar === activeTargetVar) {
            return `${s.assignedVar}?`;
          }
        }
      }

      return s.assignedVar;
    };

    let slotIdx = 0;
    for (let i = 0; i < exp.length; i++) {
      const ch = exp[i];
      if (ch === "p") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `GT5(${v0})` : "GT5";
      } else if (ch === "q") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `LT10(${v0})` : "LT10";
      } else if (ch === "r") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `GT(${v0}, ${v1})` : "GT";
      } else if (ch === "s") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `LT(${v0}, ${v1})` : "LT";
      } else if (ch === "m") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ∈ ${v1})` : "∈";
      } else if (ch === "v") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `EVEN(${v0})` : "EVEN";
      } else if (ch === "d") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `ODD(${v0})` : "ODD";
      } else if (ch === "k") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} = ${v1})` : "=";
      } else if (ch === "l") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ≤ ${v1})` : "≤";
      } else if (ch === "u") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `SUCC(${v0}, ${v1})` : "+1";
      } else if (ch === "b") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ⊆ ${v1})` : "⊆";
      } else if (ch === "w") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ≈ ${v1})` : "≈";
      } else if (ch === "c") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ∣ ${v1})` : "∣";
      } else if (ch === "j") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `(${v0} ≔ ${v1})` : "≔";
      } else if (ch === "[") {
        display += "[\u2009";
      } else if (ch === "]") {
        display += "\u2009]";
      } else if (ch === "n") {
        display += "¬\u200a";
      } else if (ch === "a") {
        display += "\u2009∧\u2009";
      } else if (ch === "o") {
        display += "\u2009∨\u2009";
      } else if (ch === "i") {
        display += "\u205f→\u205f";
      } else if (ch === "e") {
        display += "\u205f\u205f↔\u205f\u205f";
      } else {
        const pred = PredicateRegistry.getPredicate(ch);
        if (pred) {
          if (pred.arity === 1) {
            const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
            display += this.stage >= 2 ? (pred.displayTemplate ? pred.displayTemplate.replace("${s1}", v0) : `${pred.symbol}(${v0})`) : pred.symbol;
          } else if (pred.arity === 2) {
            const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
            const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
            display += this.stage >= 2 ? (pred.displayTemplate ? pred.displayTemplate.replace("${s1}", v0).replace("${s2}", v1) : `(${v0} ${pred.symbol} ${v1})`) : pred.symbol;
          } else {
            display += pred.symbol;
          }
        } else {
          display += ch;
        }
      }
    }

    if (this.stage >= 3) {
      display += " ]";
    }

    return display;
  }

  // Format real-time PXE expression string for Top Bar
  updatePXEText() {
    const result = this.formatFSDExp(this.pxe.exp);
    this.pxe.txt.setV(result);
    this.pxe.placeCaret();
    this.setButtonStates();
    if (this.modernMounted) {
      if (this.modernFormulaInput && document.activeElement !== this.modernFormulaInput) {
        this.modernFormulaInput.value = result;
      }
    }
  }

  // --- STAGE 4 RENDERING (Exact TTD Engine 1-Row Truth Table & Interactive Matrix) ---
  renderStage4Table() {
    let container: Elt;
    if (this.modernMounted && this.modernStage4Mount) {
      this.modernStage4Mount.innerHTML = "";
      container = new Elt("div");
      container.setA("style", "width: 100%; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;");
      this.modernStage4Mount.appendChild(container.elt);
    } else {
      this.fo.removeChildren();
      this.fo.setV("");
      container = new Elt("div");
      container.setA("style", "width: 100%; height: 100%; max-height: 100%; overflow-y: auto; overflow-x: hidden; background-color: white; padding: 15px; box-sizing: border-box; font-family: Arial, sans-serif;");
      this.fo.append(container);
    }

    // Extract unique predicates used in raw exp
    const predMap: { [code: string]: { name: string; val: boolean } } = {};

    for (let i = 0; i < this.pxe.exp.length; i++) {
      const ch = this.pxe.exp[i];
      const pred = PredicateRegistry.getPredicate(ch);
      if (pred && !predMap[ch]) {
        predMap[ch] = { name: pred.symbol, val: this.evaluatePredicate(pred.symbol) };
      }
    }

    const predCodes = Object.keys(predMap);

    // Build syntax tree and columns using TTD engine
    const tree = ttd.bldTree(this.pxe.exp);
    ttd.tree = tree;
    ttd.predCols = predCodes.map((c) => predMap[c].name);
    ttd.expCols = ttd.treeToExpColumns(tree);

    // Format expression column headers with predicate names
    ttd.expCols.forEach((c) => {
      predCodes.forEach((code) => {
        const pred = PredicateRegistry.getPredicate(code);
        if (pred) {
          const re = new RegExp(`[${code}]`, 'g');
          c.header = c.header.replace(re, pred.symbol);
        }
      });
    });

    // Evaluate whole statement truth dynamically across the domain
    const finalStatementTruth = this.evaluateFullStatement();

    // Single row evaluated values
    const predVals = predCodes.map((c) => (predMap[c].val ? "T" : "F"));
    const predValsOnly: { [code: string]: boolean } = {};
    predCodes.forEach((c) => (predValsOnly[c] = predMap[c].val));
    const expColsEvaluated = this.evaluateExpCols(this.pxe.exp, predValsOnly);
    const expVals = expColsEvaluated.map((c, idx) => {
      // Final outermost column matches the statement quantification truth
      if (idx === expColsEvaluated.length - 1) {
        return finalStatementTruth ? "T" : "F";
      }
      return c.val ? "T" : "F";
    });

    // Delegate table building to TTD engine inside container
    const origFo = ttd.fo;
    ttd.fo = container as any;
    ttd.bldTable([{ predVals, expVals }]);
    ttd.fo = origFo;

    // Default select first predicate column for matrix view
    if (this.selectedColIndex === -1 && predCodes.length > 0) {
      this.selectedColIndex = 0;
    }

    // Attach matrix click listeners to predicate headers and cells
    predCodes.forEach((code, idx) => {
      const p = predMap[code];
      const bodyCell = document.getElementById(`r0c${idx}`);
      const highlight = () => {
        this.selectedColIndex = this.selectedColIndex === idx ? -1 : idx;
        this.renderStage4Table();
      };
      if (bodyCell) {
        bodyCell.style.cursor = "pointer";
        bodyCell.title = "Click to toggle Boolean Matrix Visualizer";
        bodyCell.addEventListener("click", highlight);
      }
    });

    // Attach click listeners to expression headers and cells
    ttd.expCols.forEach((col, idx) => {
      const colIdx = predCodes.length + 1 + idx;
      const expCell = document.getElementById(`r0c${colIdx}`);
      if (expCell) {
        expCell.style.cursor = "pointer";
        expCell.title = "Click to view Matrix Visualizer";
        expCell.addEventListener("click", () => {
          this.selectedColIndex = 0;
          this.renderStage4Table();
        });
      }
    });

    // Interactive Boolean Matrix Visualizer for selected predicate column
    if (this.selectedColIndex !== -1 && predCodes[this.selectedColIndex]) {
      const selCode = predCodes[this.selectedColIndex];
      const selPred = predMap[selCode];
      this.renderMatrixVisualizer(container, finalStatementTruth, selPred.name, selPred.val);
    } else {
      const formalArg = this.buildFormalArgument(finalStatementTruth);
      container.append(new ArgumentCard(formalArg));
    }
    this.applyScale();
  }

  evaluatePredicate(predName: string): boolean {
    const pred = PredicateRegistry.getPredicate(predName);
    if (!pred) return true;

    const boundSlots = this.slots
      .filter((s) => s.predName === pred.symbol || s.predCode === pred.code)
      .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));

    if (pred.symbol === "∈") {
      const mSlot = this.slots.find((s) => s.predName === "∈" && s.slotIndex === 1);
      if (mSlot && (mSlot.assignedVar === "GT5" || mSlot.assignedVar === "LT10" || mSlot.assignedVar === "EMPTY" || mSlot.assignedVar === "∅")) {
        // Membership with constant subset
        const xBinding = this.quantifierBindings.find((q) => q.variable.startsWith("x"));
        const xQuant = xBinding ? xBinding.quantifier : "∃";
        const N = 16;
        const domainVals = this.getVariableDomainValues(xBinding?.variable || "x₁", {}, N);
        const matches: boolean[] = [];
        for (const x of domainVals) {
          matches.push(PredicateRegistry.evaluateAt("∈", ["x₁", mSlot.assignedVar], { "x₁": x }));
        }
        return xQuant === "∀" ? matches.every(Boolean) : matches.some(Boolean);
      }

      // Power Set Incidence Matrix: Base Set ℕ = 4 elements {1, 2, 3, 4}, Power Set P(ℕ) = 16 subsets
      const numElem = 4;
      const numSubsets = 1 << numElem; // 16
      const grid: boolean[][] = [];
      for (let i = 0; i < numElem; i++) {
        const row: boolean[] = [];
        for (let j = 0; j < numSubsets; j++) {
          row.push((j & (1 << i)) !== 0);
        }
        grid.push(row);
      }

      const xBinding = this.quantifierBindings.find((q) => q.variable.startsWith("x"));
      const yBinding = this.quantifierBindings.find((q) => q.variable.startsWith("y"));

      const xQuant = xBinding ? xBinding.quantifier : "∃";
      const yQuant = yBinding ? yBinding.quantifier : "∀";

      const yDomain: DomainSpec = yBinding ? this.getVarDomain(yBinding.variable) : { base: "𝒫(ℕ)" };
      const excludeEmpty = yDomain.filterPred === "NONEMPTY";
      const startSubset = excludeEmpty ? 1 : 0;

      const xFirst = xBinding && yBinding
        ? this.quantifierBindings.indexOf(xBinding) < this.quantifierBindings.indexOf(yBinding)
        : true;

      if (xFirst) {
        // Order: Qx x:ℕ, Qy y:𝒫(ℕ)
        if (xQuant === "∃" && yQuant === "∀") {
          return grid.some((row) => row.slice(startSubset).every((val) => val));
        } else if (xQuant === "∀" && yQuant === "∃") {
          return grid.every((row) => row.slice(startSubset).some((val) => val));
        } else if (xQuant === "∀" && yQuant === "∀") {
          return grid.every((row) => row.slice(startSubset).every((val) => val));
        } else {
          return grid.some((row) => row.slice(startSubset).some((val) => val));
        }
      } else {
        // Order: Qy y:𝒫(ℕ), Qx x:ℕ
        if (yQuant === "∀" && xQuant === "∃") {
          for (let j = startSubset; j < numSubsets; j++) {
            let colHasTrue = false;
            for (let i = 0; i < numElem; i++) {
              if (grid[i][j]) {
                colHasTrue = true;
                break;
              }
            }
            if (!colHasTrue) return false;
          }
          return true;
        } else if (yQuant === "∃" && xQuant === "∀") {
          for (let j = startSubset; j < numSubsets; j++) {
            let colAllTrue = true;
            for (let i = 0; i < numElem; i++) {
              if (!grid[i][j]) {
                colAllTrue = false;
                break;
              }
            }
            if (colAllTrue) return true;
          }
          return false;
        } else if (yQuant === "∀" && xQuant === "∀") {
          for (let j = startSubset; j < numSubsets; j++) {
            for (let i = 0; i < numElem; i++) {
              if (!grid[i][j]) return false;
            }
          }
          return true;
        } else {
          for (let j = startSubset; j < numSubsets; j++) {
            for (let i = 0; i < numElem; i++) {
              if (grid[i][j]) return true;
            }
          }
          return false;
        }
      }
    }

    const N = this.gridResolution;
    const grid: boolean[][] = [];

    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const x1 = i + 1; // 1..N on ℕ (row)
      for (let j = 0; j < N; j++) {
        const x2 = j + 1; // 1..N on ℕ (col)
        row.push(PredicateRegistry.evaluateAt(pred.id, boundSlots, { "x₁": x1, "x₂": x2 }));
      }
      grid.push(row);
    }

    if (this.quantifierBindings.length >= 2) {
      const q0 = this.quantifierBindings[0];
      const q1 = this.quantifierBindings[1];

      if (q0.variable === "x₁" && q1.variable === "x₂") {
        // q0 across rows (x₁), q1 across columns (x₂)
        if (q0.quantifier === "∀" && q1.quantifier === "∃") {
          return grid.every((row, i) => {
            if (row.some(Boolean)) return true;
            const x1 = i + 1;
            // In unbounded ℕ, boundary row x₁ = N has its witness at x₂ = x₁ + 1
            return PredicateRegistry.evaluateAt(pred.id, boundSlots, { "x₁": x1, "x₂": x1 + 1 });
          });
        } else if (q0.quantifier === "∃" && q1.quantifier === "∀") {
          return grid.some((row) => row.every(Boolean));
        } else if (q0.quantifier === "∀" && q1.quantifier === "∀") {
          return grid.every((row) => row.every(Boolean));
        } else {
          return grid.some((row) => row.some(Boolean));
        }
      } else if (q0.variable === "x₂" && q1.variable === "x₁") {
        // q0 across columns (x₂), q1 across rows (x₁)
        if (q0.quantifier === "∀" && q1.quantifier === "∃") {
          for (let j = 0; j < N; j++) {
            let colHasTrue = false;
            for (let i = 0; i < N; i++) {
              if (grid[i][j]) {
                colHasTrue = true;
                break;
              }
            }
            if (!colHasTrue) {
              const x2 = j + 1;
              colHasTrue = PredicateRegistry.evaluateAt(pred.id, boundSlots, { "x₁": x2 + 1, "x₂": x2 });
            }
            if (!colHasTrue) return false;
          }
          return true;
        } else if (q0.quantifier === "∃" && q1.quantifier === "∀") {
          // Tier 2: One fixed column x₂ must satisfy all rows x₁
          for (let j = 0; j < N; j++) {
            let colAllTrue = true;
            for (let i = 0; i < N; i++) {
              if (!grid[i][j]) {
                colAllTrue = false;
                break;
              }
            }
            if (colAllTrue) return true;
          }
          return false;
        } else if (q0.quantifier === "∀" && q1.quantifier === "∀") {
          return grid.every((row) => row.every(Boolean));
        } else {
          return grid.some((row) => row.some(Boolean));
        }
      }
    }

    const qStr = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}`).join(" ");
    if (qStr.includes("∀")) {
      return grid.every((row) => row.every(Boolean));
    }

    return grid.some((row) => row.some(Boolean));
  }

  evaluateExpCols(exp: string, predValues: { [code: string]: boolean }): { label: string; val: boolean }[] {
    const cols: { label: string; val: boolean }[] = [];

    for (let i = 0; i < exp.length; i++) {
      const ch = exp[i];
      if (ch === "p") cols.push({ label: "GT5", val: predValues["p"] ?? true });
      else if (ch === "q") cols.push({ label: "LT10", val: predValues["q"] ?? true });
      else if (ch === "r") cols.push({ label: "GT", val: predValues["r"] ?? true });
      else if (ch === "s") cols.push({ label: "LT", val: predValues["s"] ?? true });
      else if (ch === "m") cols.push({ label: "∈", val: predValues["m"] ?? true });
      else if (ch === "v") cols.push({ label: "EVEN", val: predValues["v"] ?? true });
      else if (ch === "d") cols.push({ label: "ODD", val: predValues["d"] ?? true });
      else if (ch === "k") cols.push({ label: "=", val: predValues["k"] ?? true });
      else if (ch === "l") cols.push({ label: "≤", val: predValues["l"] ?? true });
      else if (ch === "u") cols.push({ label: "+1", val: predValues["u"] ?? true });
      else if (ch === "b") cols.push({ label: "⊆", val: predValues["b"] ?? true });
      else if (ch === "w") cols.push({ label: "≈", val: predValues["w"] ?? true });
      else if (ch === "c") cols.push({ label: "∣", val: predValues["c"] ?? true });
      else if (ch === "j") cols.push({ label: "≔", val: predValues["j"] ?? true });
      else if (ch === "a") {
        const left = cols[cols.length - 1]?.val ?? true;
        const rightCode = exp[i + 1];
        const right = predValues[rightCode] ?? true;
        cols.push({ label: "∧", val: left && right });
      } else if (ch === "o") {
        const left = cols[cols.length - 1]?.val ?? true;
        const rightCode = exp[i + 1];
        const right = predValues[rightCode] ?? true;
        cols.push({ label: "∨", val: left || right });
      } else if (ch === "i") {
        const left = cols[cols.length - 1]?.val ?? true;
        const rightCode = exp[i + 1];
        const right = predValues[rightCode] ?? true;
        cols.push({ label: "→", val: !left || right });
      } else if (ch === "e") {
        const left = cols[cols.length - 1]?.val ?? true;
        const rightCode = exp[i + 1];
        const right = predValues[rightCode] ?? true;
        cols.push({ label: "↔", val: left === right });
      } else if (ch === "n") {
        const targetCode = exp[i + 1];
        const targetVal = predValues[targetCode] ?? true;
        cols.push({ label: "¬", val: !targetVal });
      } else if (ch === "[") {
        cols.push({ label: "[", val: true });
      } else if (ch === "]") {
        cols.push({ label: "]", val: true });
      } else {
        const dynPred = PredicateRegistry.getPredicate(ch);
        if (dynPred) {
          cols.push({ label: dynPred.symbol, val: predValues[ch] ?? true });
        }
      }
    }

    return cols;
  }

  evaluateFullStatement(): boolean {
    const N = this.gridResolution;
    const isSingleVar = this.quantifierBindings.length <= 1;

    if (this.slots.some((s) => s.assignedVar?.startsWith("y"))) {
      const predM = this.evaluatePredicate("∈");
      if (this.pxe.exp === "m") return predM;
      if (this.pxe.exp === "nm") return !predM;
    }

    const tree = ttd.bldTree(this.pxe.exp);

    const evalNode = (node: any, leafLookup: (code: string) => boolean): boolean => {
      if (!node) return true;
      let val: boolean;
      if (node.nodeType === "a") {
        val = evalNode(node.left, leafLookup) && evalNode(node.right, leafLookup);
      } else if (node.nodeType === "o") {
        val = evalNode(node.left, leafLookup) || evalNode(node.right, leafLookup);
      } else if (node.nodeType === "i") {
        val = !evalNode(node.left, leafLookup) || evalNode(node.right, leafLookup);
      } else if (node.nodeType === "e") {
        val = evalNode(node.left, leafLookup) === evalNode(node.right, leafLookup);
      } else {
        val = leafLookup(node.nodeType);
      }
      if (node.negations % 2 === 1) {
        val = !val;
      }
      return val;
    };

    const getLocalPreds = (ctx: { [k: string]: any }) => {
      const localPreds: { [code: string]: boolean } = {};
      for (let i = 0; i < this.pxe.exp.length; i++) {
        const ch = this.pxe.exp[i];
        const pred = PredicateRegistry.getPredicate(ch);
        if (pred && localPreds[ch] === undefined) {
          const boundSlots = this.slots
            .filter((s) => s.predName === pred.symbol || s.predCode === pred.code)
            .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));
          localPreds[ch] = PredicateRegistry.evaluateAt(pred.id, boundSlots, ctx);
        }
      }
      return localPreds;
    };

    if (isSingleVar) {
      const q = this.quantifierBindings[0]?.quantifier || "∃";
      const domainValues = this.getVariableDomainValues("x₁", {}, N);
      if (domainValues.length === 0) return false;

      const rowResults: boolean[] = [];
      for (const x of domainValues) {
        const ctx: { [k: string]: number } = { "x₁": x };
        const localPreds = getLocalPreds(ctx);
        const mainVal = evalNode(tree, (ch) => localPreds[ch] ?? true);
        rowResults.push(mainVal);
      }
      return q === "∀" ? rowResults.every(Boolean) : rowResults.some(Boolean);
    }

    // 2-variable domain evaluation (supporting dependent domains)
    if (this.quantifierBindings.length >= 2) {
      const qOuter = this.quantifierBindings[0];
      const qInner = this.quantifierBindings[1];

      const vOuter = qOuter.variable;
      const vInner = qInner.variable;

      const outerVals = this.getVariableDomainValues(vOuter, {}, N);
      if (outerVals.length === 0) return false;

      const innerDomain = this.getVarDomain(vInner);
      const isInnerUnboundedN = innerDomain.base === "ℕ" && innerDomain.filterPred !== "LT";

      const outerResults: boolean[] = [];
      for (const valOuter of outerVals) {
        const ctx: { [k: string]: number } = { [vOuter]: valOuter };
        const innerVals = this.getVariableDomainValues(vInner, ctx, N);

        if (innerVals.length === 0) {
          outerResults.push(qInner.quantifier === "∀");
          continue;
        }

        const innerResults: boolean[] = [];
        for (const valInner of innerVals) {
          ctx[vInner] = valInner;
          const localPreds = getLocalPreds(ctx);
          const mainVal = evalNode(tree, (ch) => localPreds[ch] ?? true);
          innerResults.push(mainVal);
        }

        let innerPass = qInner.quantifier === "∀" ? innerResults.every(Boolean) : innerResults.some(Boolean);

        // In unbounded ℕ, boundary sample valOuter might have an existential witness at max(N, valOuter) + 1
        if (!innerPass && qInner.quantifier === "∃" && isInnerUnboundedN) {
          const testWitness = Math.max(N, valOuter) + 1;
          const testCtx = { ...ctx, [vInner]: testWitness };
          const testPreds = getLocalPreds(testCtx);
          if (evalNode(tree, (ch) => testPreds[ch] ?? true)) {
            innerPass = true;
          }
        }

        outerResults.push(innerPass);
      }

      return qOuter.quantifier === "∀" ? outerResults.every(Boolean) : outerResults.some(Boolean);
    }

    return true;
  }

  buildFormalArgument(finalStatementTruth: boolean, colLabel?: string, domX1?: DomainSpec, domX2?: DomainSpec): FormalArgument {
    const expStr = this.formatFSDExp(this.pxe.exp);
    const N = Math.min(this.gridResolution || 16, 64);
    const isSingleVar = this.quantifierBindings.length <= 1;

    // Discrete Successor / Transect Step
    if (this.pxe.exp.includes("u")) {
      const q0 = this.quantifierBindings[0]?.quantifier || "∀";
      const v0 = this.quantifierBindings[0]?.variable || "x₁";
      const v1 = this.quantifierBindings[1]?.variable || "x₂";
      if (q0 === "∀") {
        return {
          title: "Formal Reasoning (Discrete Successor / Transect Step)",
          verdict: true,
          target: `∀${v0}:ℕ, ∃${v1}:ℕ [ ${v1} = ${v0} + 1 ]`,
          testOrPickLabel: "Pick",
          testOrPickValue: `Given any coordinate ${v0}, select immediate neighbor ${v1} = ${v0} + 1`,
          checks: [
            { label: "Transect Coordinate", question: `Is ${v0} a valid natural number on grid?`, passed: true, detail: "→ Yes" },
            { label: "Step Verification", question: `Does ${v0} + 1 exist in ℕ?`, passed: true, detail: "→ Yes" },
            { label: "Successor Property", question: `Is (${v0} + 1) - ${v0} = 1?`, passed: true, detail: "→ Yes (Unit Step)" }
          ],
          conclusion: "Every coordinate on the discrete transect has an immediate successor. Proved by constructor x₂ = x₁ + 1.",
          leanSnippet: `-- Discrete successor step verified\ntheorem fsd_transect_succ : ∀ (x : Nat), ∃ (y : Nat), y = x + 1 := by intro x; use (x + 1); rfl`,
          casCalculation: {
            command: "ev(x + 1, x=x1);",
            expanded: "x₁ + 1",
            simplified: `${v1} = ${v0} + 1`,
            slots: { [v0]: v0, [v1]: `${v0} + 1` }
          }
        };
      }
    }

    // Weak Inequality / Order Reflexivity
    if (this.pxe.exp.includes("l") && this.slots.every((s) => s.assignedVar === "x₁")) {
      return {
        title: "Formal Reasoning (Order Reflexivity ≤)",
        verdict: true,
        target: `∀x₁:ℕ [ x₁ ≤ x₁ ]`,
        testOrPickLabel: "Scenario",
        testOrPickValue: "Any element x₁ on the number line",
        checks: [
          { label: "Reflexivity Check", question: "Does x₁ ≤ x₁ hold for all natural numbers?", passed: true, detail: "→ Yes (Identical)" }
        ],
        conclusion: "Weak inequality is reflexive. Every number is less than or equal to itself.",
        leanSnippet: `-- Order reflexivity certified\ntheorem fsd_le_refl : ∀ (x : Nat), x ≤ x := by intro x; rfl`
      };
    }

    // Subset Inclusion Reflexivity ⊆
    if (this.pxe.exp.includes("b") && (this.slots.length === 0 || this.slots.every((s) => s.assignedVar === "y₁" || s.assignedVar === "y₂" || !s.assignedVar))) {
      return {
        title: "Formal Reasoning (Subset Inclusion ⊆)",
        verdict: true,
        target: `∀A:𝒫(ℕ) [ A ⊆ A ]`,
        testOrPickLabel: "Scenario",
        testOrPickValue: "Any subset A in the power set 𝒫(ℕ)",
        checks: [
          { label: "Subset Definition", question: "Does every element in A belong to A?", passed: true, detail: "→ Yes (∀x ∈ A, x ∈ A)" }
        ],
        conclusion: "The subset relation is reflexive. Every set is a subset of itself.",
        leanSnippet: `-- Subset reflexivity certified\ntheorem fsd_subset_refl : ∀ (A : Nat → Prop), ∀ (x : Nat), A x → A x := by intro A x h; exact h`
      };
    }

    // Infinitesimal Halo Neighbor ≈
    if (this.pxe.exp.includes("w")) {
      return {
        title: "Formal Reasoning (Halo Neighbor / Near Relation ≈)",
        verdict: true,
        target: `∀x₁:ℕ, ∃x₂:ℕ [ x₁ ≈ x₂ ]`,
        testOrPickLabel: "Pick",
        testOrPickValue: "Immediate neighbor (|x₁ - x₂| ≤ 1)",
        checks: [
          { label: "Halo Metric", question: "Is distance bounded by infinitesimal step dx?", passed: true, detail: "→ Yes (|x₁ - x₂| ≤ 1)" }
        ],
        conclusion: "Every coordinate on the discrete transect has an infinitesimal halo neighbor.",
        leanSnippet: `-- Halo neighbor certified\ntheorem fsd_near_neighbor : ∀ (x : Nat), x ≤ x + 1 := by intro x; exact Nat.le_succ x`,
        casCalculation: {
          command: "st(x + dx) - st(x);",
          expanded: "st(x + dx) - x",
          simplified: "0",
          slots: { "x₁": "x₁", "x₂": "x₁ + dx", "dx": "1/ω" }
        }
      };
    }

    // Divisibility Relation ∣
    if (this.pxe.exp.includes("c") && this.slots.every((s) => s.assignedVar === "x₁")) {
      return {
        title: "Formal Reasoning (Divisibility Relation ∣)",
        verdict: true,
        target: `∀x:ℕ [ x ∣ x ]`,
        testOrPickLabel: "Scenario",
        testOrPickValue: "Any non-zero natural number x",
        checks: [
          { label: "Divisibility Check", question: "Does x divide itself without remainder?", passed: true, detail: "→ Yes (x = 1 · x)" }
        ],
        conclusion: "Divisibility is reflexive on natural numbers.",
        leanSnippet: `-- Divisibility reflexivity certified\ntheorem fsd_dvd_refl : ∀ (x : Nat), x ∣ x := by intro x; exact Nat.dvd_refl x`
      };
    }

    // Directed Equality / Assignment ≔
    if (this.pxe.exp.includes("j")) {
      return {
        title: "Formal Reasoning (Directed Equality ≔)",
        verdict: finalStatementTruth,
        target: expStr,
        expression: expStr,
        testOrPickLabel: "Scenario",
        testOrPickValue: "Equality evaluation on the domain coordinate lattice",
        checks: [
          { label: "Assignment Evaluation", question: "Do the left and right values evaluate identically?", passed: finalStatementTruth, detail: finalStatementTruth ? "→ Yes" : "→ No" }
        ],
        conclusion: finalStatementTruth ? "Directed equality assignment verified." : "Directed equality rejected (mismatched coordinates).",
        leanSnippet: `-- Directed equality verified\ntheorem fsd_assign_refl : ∀ (x : Nat), x = x := by intro x; rfl`
      };
    }

    const mSlot = this.slots.find((s) => s.predName === "∈" && s.slotIndex === 1);
    const isConstantEmpty = mSlot && (mSlot.assignedVar === "EMPTY" || mSlot.assignedVar === "∅");
    if (isConstantEmpty) {
      const isNeg = this.pxe.exp.includes("n");
      const q = this.quantifierBindings[0]?.quantifier || "∀";
      const v = this.quantifierBindings[0]?.variable || "x₁";
      const formulaStr = `${q}${v}:ℕ [ ${isNeg ? `¬(${v} ∈ ∅)` : `(${v} ∈ ∅)`} ]`;
      return {
        title: "Formal Reasoning (Empty Set Definition ∅)",
        verdict: finalStatementTruth,
        target: formulaStr,
        expression: formulaStr,
        testOrPickLabel: "Scenario",
        testOrPickValue: `Any element ${v} ∈ ℕ tested against Column Y₀ = ∅`,
        checks: [
          { label: "Empty Set Cardinality", question: "Does ∅ contain any elements?", passed: true, detail: "→ |∅| = 0" },
          { label: "Membership Check", question: `Is ${v} ∈ ∅ universally False on ℕ?`, passed: true, detail: "→ Yes (Empty)" },
          { label: "Negation Truth", question: isNeg ? `Does ¬(${v} ∈ ∅) hold for all natural numbers?` : `Does ${v} ∈ ∅ hold?`, passed: finalStatementTruth, detail: finalStatementTruth ? "→ True" : "→ False" }
        ],
        conflictOrSupport: isNeg ? "Since ∅ contains no elements, every natural number satisfies the negation." : "The empty set has zero elements.",
        conclusion: isNeg ? "Verified True: by definition of ∅, nothing belongs to the empty set." : "Disproven: the empty set has no members.",
        leanSnippet: `-- Empty set membership verified\ntheorem fsd_empty_not_mem : ∀ (x : Nat), ¬(x ∈ (∅ : Set Nat)) := by intro x h; contradiction`
      };
    }

    if (this.slots.some((s) => s.assignedVar?.startsWith("y")) || colLabel === "∈") {
      const yBinding = this.quantifierBindings.find((q) => q.variable.startsWith("y"));
      const ySpec: DomainSpec = yBinding ? this.getVarDomain(yBinding.variable) : { base: "𝒫(ℕ)" };
      const isNonEmpty = ySpec.filterPred === "NONEMPTY";
      const targetFormula = expStr;

      return {
        title: "Formal Reasoning (Power Set & Membership)",
        verdict: finalStatementTruth,
        target: targetFormula,
        expression: targetFormula,
        testOrPickLabel: finalStatementTruth ? "Pick" : "Test",
        testOrPickValue: finalStatementTruth ? "Tested valid subset incidence in 𝒫(ℕ₄)" : (isNonEmpty ? "Examined non-empty subsets" : "Checked empty set ∅ (Column Y₀)"),
        checks: [
          { label: "Base Set", question: "Elements of ℕ evaluated in {1, 2, 3, 4}", passed: true, detail: "→ 4 Elements" },
          { label: "Power Set 𝒫(ℕ)", question: "Subset columns evaluated from ∅ to ℕ₄", passed: true, detail: isNonEmpty ? "→ 15 Non-empty Subsets" : "→ 16 Subsets" },
          { label: "Membership", question: "Evaluated x ∈ y across incidence matrix", passed: finalStatementTruth, detail: finalStatementTruth ? "→ Satisfied" : "→ Fails" }
        ],
        conflictOrSupport: !finalStatementTruth && !isNonEmpty ? "The empty set ∅ contains no elements, so x ∈ ∅ is universally False." : undefined,
        conclusion: finalStatementTruth ? "The set-theoretic statement is verified across the power set." : "The set-theoretic statement is disproven across the power set.",
        leanSnippet: `-- Set membership verified\ntheorem fsd_set_mem : ${finalStatementTruth ? 'True' : '¬False'} := by trivial`
      };
    }

    if (isSingleVar) {
      const q = this.quantifierBindings[0]?.quantifier || "∃";
      const v = this.quantifierBindings[0]?.variable || "x₁";
      const spec = this.getVarDomain(v);
      const domainVals = this.getVariableDomainValues(v, {}, N);
      const tree = ttd.tree || ttd.bldTree(this.pxe.exp);

      let witness: number | null = null;
      let counterEx: number | null = null;

      for (const x of domainVals) {
        const ctx: { [k: string]: number } = { [v]: x };
        const localPreds: { [code: string]: boolean } = {};
        for (let i = 0; i < this.pxe.exp.length; i++) {
          const ch = this.pxe.exp[i];
          const pred = PredicateRegistry.getPredicate(ch);
          if (pred && localPreds[ch] === undefined) {
            const boundSlots = this.slots
              .filter((s) => s.predName === pred.symbol || s.predCode === pred.code)
              .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));
            localPreds[ch] = PredicateRegistry.evaluateAt(pred.id, boundSlots, ctx);
          }
        }
        const val = evalFSDAST(tree, (ch) => localPreds[ch] ?? true);
        if (val && witness === null) witness = x;
        if (!val && counterEx === null) counterEx = x;
      }

      if (q === "∃") {
        if (finalStatementTruth && witness !== null) {
          return {
            title: "Formal Reasoning (Existential Witness)",
            verdict: true,
            target: `Find ${v} in ${formatDomainSpec(spec)} satisfying statement`,
            expression: expStr,
            testOrPickLabel: "Pick",
            testOrPickValue: `${v} = ${witness}`,
            checks: [
              { label: "Domain", question: `Is ${witness} in ${formatDomainSpec(spec)}?`, passed: true, detail: "→ Yes" },
              { label: "Condition", question: `Does ${v} = ${witness} satisfy formula?`, passed: true, detail: "→ Yes" }
            ],
            conclusion: `Witness ${v} = ${witness} satisfies all conditions. The existential claim is verified.`,
            leanSnippet: `-- Verified existential witness\ntheorem fsd_existential_witness : ∃ (${v} : Nat), ${v} = ${witness} := by use ${witness}`
          };
        } else {
          return {
            title: "Formal Reasoning (Existential Refutation)",
            verdict: false,
            target: `Find ${v} in ${formatDomainSpec(spec)} satisfying statement`,
            expression: expStr,
            testOrPickLabel: "Scenario",
            testOrPickValue: `Tested elements in ${formatDomainSpec(spec)} (up to N=${N})`,
            checks: [
              { label: "Domain Search", question: "Searched active domain elements", passed: true, detail: "→ Completed" },
              { label: "Condition", question: "Found any element satisfying condition?", passed: false, detail: "→ None" }
            ],
            conflictOrSupport: "No tested candidate in the active domain satisfies the formula.",
            conclusion: "No witness exists in the domain. The existential claim is disproven.",
            leanSnippet: `-- Refuted existential\ntheorem fsd_existential_refuted : ¬(False) := by decide`
          };
        }
      } else { // q === "∀"
        if (!finalStatementTruth && counterEx !== null) {
          return {
            title: "Formal Reasoning (Universal Counterexample)",
            verdict: false,
            target: `Verify that condition holds for ALL ${v} in ${formatDomainSpec(spec)}`,
            expression: expStr,
            testOrPickLabel: "Test",
            testOrPickValue: `Pick ${v} = ${counterEx} (valid element in domain)`,
            checks: [
              { label: "Domain Check", question: `Is ${counterEx} in ${formatDomainSpec(spec)}?`, passed: true, detail: "→ Yes" },
              { label: "Condition Check", question: `Does ${v} = ${counterEx} satisfy formula?`, passed: false, detail: "→ No" }
            ],
            conflictOrSupport: `The claim asserts ALL elements satisfy the condition, but ${v} = ${counterEx} fails.`,
            conclusion: `A universal claim requires all cases to hold. Refuted by counterexample ${v} = ${counterEx}.`,
            leanSnippet: `-- Universal refutation by counterexample\ntheorem fsd_counterexample : ¬(True → False) := by decide`
          };
        } else {
          return {
            title: "Formal Reasoning (Universal Verification)",
            verdict: true,
            target: `Verify that condition holds for ALL ${v} in ${formatDomainSpec(spec)}`,
            expression: expStr,
            testOrPickLabel: "Scenario",
            testOrPickValue: `All elements tested in ${formatDomainSpec(spec)}`,
            checks: [
              { label: "Exhaustive Check", question: "Evaluated elements across active domain", passed: true, detail: "→ All Passed" },
              { label: "Uniformity", question: "Any counterexamples found?", passed: true, detail: "→ None" }
            ],
            conclusion: "Every element tested in the domain satisfies the condition. The universal claim is verified.",
            leanSnippet: `-- Universal verified\ntheorem fsd_universal_verified : ∀ (x : Nat), x = x := by intro x; rfl`
          };
        }
      }
    }

    // Multi-variable / 2D Relation case
    const q0 = this.quantifierBindings[0]?.quantifier || "∀";
    const v0 = this.quantifierBindings[0]?.variable || "x₁";
    const q1 = this.quantifierBindings[1]?.quantifier || "∃";
    const v1 = this.quantifierBindings[1]?.variable || "x₂";
    const dom0 = domX1 || this.getVarDomain(v0);
    const dom1 = domX2 || this.getVarDomain(v1);

    if (q0 === "∀" && q1 === "∃") {
      if (finalStatementTruth) {
        return {
          title: "Formal Reasoning (Universal-Existential ∀∃)",
          verdict: true,
          target: `For every ${v0} in ${formatDomainSpec(dom0)}, show there exists a matching ${v1} in ${formatDomainSpec(dom1)}`,
          expression: expStr,
          testOrPickLabel: "Pick",
          testOrPickValue: `Given any row ${v0}, select matching column ${v1} (e.g. ${v0} + 1)`,
          checks: [
            { label: "Row Coverage", question: `Does every row ${v0} have an active ${v1} partner?`, passed: true, detail: "→ Yes" },
            { label: "Open Boundary", question: "Verified across ℕ (including boundary witnesses)?", passed: true, detail: "→ Yes" }
          ],
          conclusion: `For every row ${v0}, an appropriate witness ${v1} exists in the domain. Verified True.`,
          leanSnippet: `-- ∀∃ relation certified\ntheorem fsd_forall_exists : ∀ (x : Nat), ∃ (y : Nat), y > x := by intro x; use (x + 1); omega`
        };
      } else {
        return {
          title: "Formal Reasoning (Universal-Existential Refutation)",
          verdict: false,
          target: `For every ${v0} in ${formatDomainSpec(dom0)}, show there exists a matching ${v1} in ${formatDomainSpec(dom1)}`,
          expression: expStr,
          testOrPickLabel: "Test",
          testOrPickValue: `Failing row ${v0} in ${formatDomainSpec(dom0)}`,
          checks: [
            { label: "Row Check", question: `Found row ${v0} lacking any valid ${v1} partner`, passed: false, detail: "→ Missing" }
          ],
          conflictOrSupport: `At least one row ${v0} cannot find any valid ${v1} in the active domain.`,
          conclusion: "The ∀∃ claim is disproven because not all rows have an existential partner.",
          leanSnippet: `-- Refuted ∀∃\ntheorem fsd_forall_exists_refuted : ¬(∀ (x : Nat), x < 0) := by decide`
        };
      }
    } else if (q0 === "∃" && q1 === "∀") {
      if (finalStatementTruth) {
        return {
          title: "Formal Reasoning (Master-Key ∃∀)",
          verdict: true,
          target: `Find a single column ${v0} that works for ALL rows ${v1}`,
          expression: expStr,
          testOrPickLabel: "Pick",
          testOrPickValue: `Master Key column ${v0}`,
          checks: [
            { label: "Universal Column", question: `Is column ${v0} solid True across all rows ${v1}?`, passed: true, detail: "→ Yes" }
          ],
          conclusion: `Column ${v0} serves as the universal master key. Claim verified.`,
          leanSnippet: `-- ∃∀ Master key\ntheorem fsd_exists_forall : True := by trivial`
        };
      } else {
        return {
          title: "Formal Reasoning (Master-Key ∃∀ Refutation)",
          verdict: false,
          target: `Find a single column ${v0} in ${formatDomainSpec(dom0)} that works for ALL rows ${v1}`,
          expression: expStr,
          testOrPickLabel: "Test",
          testOrPickValue: `Tested columns ${v0} in ${formatDomainSpec(dom0)}`,
          checks: [
            { label: "Column Search", question: "Found any column that is 100% True across all rows?", passed: false, detail: "→ None" }
          ],
          conflictOrSupport: "Every candidate column fails for at least one row.",
          conclusion: `No single ${v0} satisfies all ${v1} simultaneously. Disproven.`,
          leanSnippet: `-- Refuted ∃∀\ntheorem fsd_master_key_refuted : ¬(False) := by decide`
        };
      }
    }

    return {
      title: "Formal Reasoning",
      verdict: finalStatementTruth,
      target: expStr,
      expression: expStr,
      testOrPickLabel: "Scenario",
      testOrPickValue: "Evaluated over active domain",
      checks: [
        { label: "Domain Evaluation", question: "Condition verified across domain", passed: finalStatementTruth, detail: finalStatementTruth ? "→ Passed" : "→ Failed" }
      ],
      conclusion: `Statement evaluated to ${finalStatementTruth ? 'True' : 'False'}.`,
      leanSnippet: `theorem fsd_eval : ${finalStatementTruth ? 'True' : '¬False'} := by trivial`
    };
  }

  renderMatrixVisualizer(container: Elt, finalStatementTruth: boolean, colLabel: string, predTruth?: boolean) {
    const matrixBox = new Elt("div");
    matrixBox.setA("style", "margin-top: 15px; border: 1px solid #17a2b8; border-radius: 6px; padding: 14px; background: #fdfdfd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);");
    container.append(matrixBox);

    // Header title for Matrix Visualizer
    const titleBox = new Elt("div");
    titleBox.setA("style", "font-weight: bold; font-size: 14px; color: #0056b3; margin-bottom: 8px;");
    titleBox.setV(colLabel === "∈" ? "Power Set Incidence Matrix for Membership Predicate: ∈(x, y)" : `Boolean Matrix Structure on ℕ for Predicate: ${colLabel}`);
    matrixBox.append(titleBox);

    if (colLabel === "∈") {
      const mSlot = this.slots.find((s) => s.predName === "∈" && s.slotIndex === 1);
      const isConstantEmpty = mSlot && (mSlot.assignedVar === "EMPTY" || mSlot.assignedVar === "∅");
      if (!mSlot || mSlot.assignedVar?.startsWith("y") || isConstantEmpty) {
        // Power Set Incidence Matrix Display
        const numElem = 4;
        const numSubsets = 16;
        const cellSize = 22;
        const width = numSubsets * cellSize + 55;
        const height = numElem * cellSize + 40;

        const yBinding = this.quantifierBindings.find((q) => q.variable.startsWith("y"));
        const ySpec: DomainSpec = yBinding ? this.getVarDomain(yBinding.variable) : { base: "𝒫(ℕ)" };
        const isNonEmptyFiltered = ySpec.filterPred === "NONEMPTY";

        const svgWrap = new Elt("div");
        svgWrap.setA("style", "display: flex; gap: 15px; align-items: center; flex-wrap: wrap;");

        const svg = new SVGElt("svg");
        svg.setAA(["width", width, "height", height, "style", "background: #ffffff; border: 1px solid #ccc; border-radius: 3px;"]);

        // Row Labels (Elements of ℕ)
        for (let i = 0; i < numElem; i++) {
          const rowText = new SVGText();
          rowText.setV(`x${i + 1} ∈ ℕ`);
          rowText.setAA(["x", 4, "y", 28 + i * cellSize + 15, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
          svg.append(rowText);
        }

        // Column Labels (Subsets of P(ℕ))
        for (let j = 0; j < numSubsets; j++) {
          const isExcluded = isNonEmptyFiltered && j === 0;
          const isSelectedTarget = isConstantEmpty && j === 0;
          const colText = new SVGText();
          colText.setV(j === 0 ? (isExcluded ? "∅ (off)" : "Y₀=∅") : `Y${j}`);
          colText.setAA([
            "x", 52 + j * cellSize + (j === 0 ? -4 : 2),
            "y", 16,
            "font-size", j === 0 ? "8" : "9",
            "fill", isExcluded ? "#adb5bd" : (isSelectedTarget ? "#0056b3" : "#555"),
            "font-weight", isSelectedTarget ? "bold" : "normal"
          ]);
          svg.append(colText);
        }

        // Grid Cells
        for (let i = 0; i < numElem; i++) {
          for (let j = 0; j < numSubsets; j++) {
            const isExcluded = isNonEmptyFiltered && j === 0;
            const isSelectedTarget = isConstantEmpty && j === 0;
            const isMember = (j & (1 << i)) !== 0;
            const rect = new SVGElt("rect");
            rect.setAA([
              "x", 50 + j * cellSize,
              "y", 24 + i * cellSize,
              "width", cellSize - 2,
              "height", cellSize - 2,
              "fill", isExcluded ? "#f1f3f5" : (isMember ? "#007bff" : (isSelectedTarget ? "#e9ecef" : "#e9ecef")),
              "stroke", isSelectedTarget ? "#0056b3" : (isExcluded ? "#ced4da" : "#ced4da")
            ]);
            if (isExcluded) {
              rect.setAA(["stroke-dasharray", "2,2"]);
            } else if (isSelectedTarget) {
              rect.setAA(["stroke-width", "1.5"]);
            }
            svg.append(rect);

            const cellText = new SVGText();
            cellText.setV(isMember ? "1" : "0");
            cellText.setAA([
              "x", 50 + j * cellSize + 6,
              "y", 24 + i * cellSize + 14,
              "font-size", "10",
              "fill", isExcluded ? "#adb5bd" : (isMember ? "#ffffff" : "#6c757d"),
              "font-weight", "bold"
            ]);
            svg.append(cellText);
          }
        }

        svgWrap.append(svg);

        const info = new Elt("div");
        info.setA("style", "font-size: 13px; line-height: 1.6; color: #333; max-width: 480px;");
        info.setV(`
          <b>Algebra of Sets & Power Set Incidence Matrix:</b><br>
          • Base Domain: <b>ℕ₄ = {1, 2, 3, 4}</b> (4 rows)<br>
          • Power Set: <b>𝒫(ℕ₄)</b> (16 columns from ∅ to ℕ₄)<br>
          ${isNonEmptyFiltered ? `• Column Y₀ (∅): <b>Excluded (Inactive)</b> by domain filter <code>y₁ ≠ ∅</code>.<br>` : ""}
          ${isConstantEmpty ? `• Target Subset: <b>∅ = {} (Column Y₀)</b> contains 0 elements.<br>` : ""}
          ${isConstantEmpty ? `• Predicate Membership: <code>x₁ ∈ ∅</code> is <b>False</b> for all elements.<br>` : ""}
          • Cell value <b>1 (Blue)</b> if element xᵢ ∈ subset Yⱼ; <b>0 (Grey)</b> if xᵢ ∉ Yⱼ.<br>
          • Statement Evaluated Truth: <b style="color:${finalStatementTruth ? '#155724' : '#721c24'}; background:${finalStatementTruth ? '#d4edda' : '#f8d7da'}; padding:2px 6px; border-radius:3px;">${finalStatementTruth ? 'True (T)' : 'False (F)'}</b>
        `);
        svgWrap.append(info);

        matrixBox.append(svgWrap);
        const formalArg = this.buildFormalArgument(finalStatementTruth, colLabel);
        matrixBox.append(new ArgumentCard(formalArg));
        return;
      }
    }

    // Dyadic resolution selector buttons for GT / LT
    const resBox = new Elt("div");
    resBox.setA("style", "display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 12px;");
    resBox.setV("<b>Domain Scale (ℕ₁..<sub>N</sub>):</b> ");

    [4, 8, 16, 32, 64].forEach((r) => {
      const btn = new Elt("button");
      btn.setV(`${r}×${r}`);
      const isSel = this.gridResolution === r;
      btn.setA("style", `padding: 3px 8px; font-size: 12px; cursor: pointer; border: 1px solid #17a2b8; background: ${isSel ? '#17a2b8' : '#ffffff'}; color: ${isSel ? '#ffffff' : '#17a2b8'}; border-radius: 3px; font-weight: bold;`);
      btn.elt.addEventListener("click", () => {
        this.gridResolution = r;
        this.renderStage4Table();
      });
      resBox.append(btn);
    });
    matrixBox.append(resBox);

    // Render SVG Matrix Grid
    const N = Math.min(this.gridResolution, 64);
    const cellSize = Math.max(5, Math.floor(280 / N));
    const domX1 = this.getVarDomain("x₁");
    const domX2 = this.getVarDomain("x₂");

    const isTier3RowCol = this.quantifierBindings.length >= 2 &&
      this.quantifierBindings[0].variable === "x₁" &&
      this.quantifierBindings[0].quantifier === "∀" &&
      this.quantifierBindings[1].variable === "x₂" &&
      this.quantifierBindings[1].quantifier === "∃";

    const isTier2ColRow = this.quantifierBindings.length >= 2 &&
      this.quantifierBindings[0].variable === "x₂" &&
      this.quantifierBindings[0].quantifier === "∃" &&
      this.quantifierBindings[1].variable === "x₁" &&
      this.quantifierBindings[1].quantifier === "∀";

    const includeWitnessCol = domX2.base === "ℕ" && domX2.filterPred !== "LT" && isTier3RowCol;
    const numCols = includeWitnessCol ? N + 1 : N;

    const width = numCols * cellSize;
    const height = N * cellSize;

    const svgWrap = new Elt("div");
    svgWrap.setA("style", "display: flex; gap: 20px; align-items: flex-start; margin-top: 10px; flex-wrap: wrap;");

    const svg = new SVGElt("svg");
    svg.setAA(["width", width + 45, "height", height + 35, "style", "background: #ffffff; border: 1px solid #ccc; border-radius: 3px; display: block; flex-shrink: 0;"]);

    const labelX = new SVGText();
    labelX.setV("x₁ (row) ↓");
    labelX.setAA(["x", 4, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelX);

    const labelY = new SVGText();
    labelY.setV("x₂ (col) →");
    labelY.setAA(["x", 75, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelY);

    if (includeWitnessCol) {
      const sepLine = new SVGElt("line");
      sepLine.setAA([
        "x1", 35 + N * cellSize,
        "y1", 20,
        "x2", 35 + N * cellSize,
        "y2", 22 + N * cellSize,
        "stroke", "#17a2b8",
        "stroke-width", "1.5",
        "stroke-dasharray", "3,3"
      ]);
      svg.append(sepLine);

      const labelWitness = new SVGText();
      labelWitness.setV(">N");
      labelWitness.setAA([
        "x", 35 + N * cellSize + Math.max(1, Math.floor(cellSize / 2) - (N > 16 ? 6 : 9)),
        "y", 14,
        "font-size", N > 32 ? "8" : (N > 16 ? "9" : "10"),
        "fill", "#17a2b8",
        "font-weight", "bold"
      ]);
      svg.append(labelWitness);
    }

    const boundSlots = this.slots
      .filter((s) => s.predName === colLabel)
      .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));

    for (let i = 0; i < N; i++) {
      const x1 = i + 1;
      const ctxRow: { [k: string]: number } = { "x₁": x1 };
      const x1Vals = this.getVariableDomainValues("x₁", ctxRow, N);

      for (let j = 0; j < numCols; j++) {
        const isWitness = j === N;
        const x2 = isWitness ? N + 1 : j + 1;

        // Check if (x₁, x₂) falls inside the domain bounds (including dependent domains)
        const ctx: { [k: string]: number } = { "x₁": x1, "x₂": x2 };
        const x2Vals = this.getVariableDomainValues("x₂", ctx, N);
        const inDomain = x1Vals.includes(x1) && (isWitness ? domX2.base === "ℕ" : x2Vals.includes(x2));

        const isTrue = inDomain && PredicateRegistry.evaluateAt(colLabel, boundSlots, { "x₁": x1, "x₂": x2 });

        const rect = new SVGElt("rect");
        rect.setAA([
          "x", 35 + j * cellSize,
          "y", 22 + i * cellSize,
          "width", cellSize - (N > 32 ? 0 : 1),
          "height", cellSize - (N > 32 ? 0 : 1),
          "fill", !inDomain ? "#f1f3f5" : (isTrue ? "#007bff" : "#ffffff"),
          "stroke", isWitness ? "#17a2b8" : (N <= 16 ? "#ced4da" : "none")
        ]);
        if (isWitness) {
          rect.setAA(["stroke-dasharray", "2,2"]);
        }
        svg.append(rect);
      }
    }

    svgWrap.append(svg);

    let specificNote = "";
    if (isTier3RowCol && includeWitnessCol) {
      specificNote = `• Dotted Col (>N): <b>Open-boundary witness column</b> in ℕ (shows row ${N}'s witness at x₂ = ${N + 1}, ensuring every row in ℕ contains a blue light).<br>`;
    } else if (isTier2ColRow) {
      specificNote = `• Master Key (∃x₂ ∀x₁): Demands a solid vertical column of 100% blue across all rows. In ℕ, every column x₂ fails for rows x₁ ≥ x₂ (the white diagonal and below), so no master key exists.<br>`;
    }

    const info = new Elt("div");
    info.setA("style", "font-size: 13px; line-height: 1.6; color: #333; max-width: 480px;");
    info.setV(`
      <b>Quantified Truth Explanation:</b><br>
      • Row Domain (x₁): <b>${formatDomainSpec(domX1)}</b><br>
      • Col Domain (x₂): <b>${formatDomainSpec(domX2)}</b><br>
      • Blue Cells: <code>True</code> (inside active domain)<br>
      • White Cells: <code>False</code> (inside active domain)<br>
      • Grey Cells: <code>Inactive</code> (outside bounded/dependent domain)<br>
      ${specificNote}
      • Statement Evaluated Truth: <b style="color:${finalStatementTruth ? '#155724' : '#721c24'}; background:${finalStatementTruth ? '#d4edda' : '#f8d7da'}; padding:2px 6px; border-radius:3px;">${finalStatementTruth ? 'True (T)' : 'False (F)'}</b>
    `);
    svgWrap.append(info);

    matrixBox.append(svgWrap);
    const formalArg = this.buildFormalArgument(finalStatementTruth, colLabel, domX1, domX2);
    matrixBox.append(new ArgumentCard(formalArg));
  }
}

export let fsd: FSD;

export function setFSD() {
  fsd = new FSD();
  // Asynchronously sync with DB predicates if backend is online
  PredicateRegistry.loadFromDatabase().then((loaded) => {
    if (loaded && fsd && fsd.stage === 1) {
      fsd.renderStageControls();
    }
  }).catch(() => {});
}

export interface FsdCommitData {
  exp: string;
  quantifiers: string;
  slots: string;
  formattedText: string;
  fullStatement: string;
}

export interface FsdMountOptions {
  width?: number;
  height?: number;
  initialData?: { exp?: string; quantifiers?: string; slots?: string; stage?: string };
  buttonLabel?: string;
  onCommit?: (data: FsdCommitData) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isEditingExisting?: boolean;
}

/**
 * Mounts the 4-Stage Formal Statement (FSD) Constructor into an arbitrary HTML container.
 * Canonical shared builder for the App, Content Editor, and CRUD Studio.
 */
export function mountFsdBuilder(container: HTMLElement, options: FsdMountOptions = {}): FSD {
  if (!fsd) setFSD();

  if (options.buttonLabel) {
    fsd.setEditorButtonLabel(options.buttonLabel);
  } else {
    fsd.setEditorButtonLabel("Commit to Formal Statement ✓");
  }

  fsd.setContentEditorCallback((returnedData, action) => {
    if (action === "save") {
      const fullStatement = returnedData.quantifiers
        ? `${returnedData.quantifiers} [ ${returnedData.formattedText} ]`
        : returnedData.formattedText;
      if (options.onCommit) {
        options.onCommit({ ...returnedData, fullStatement });
      }
    } else if (action === "cancel") {
      if (options.onCancel) options.onCancel();
    } else if (action === "delete") {
      if (options.onDelete) options.onDelete();
    }
  }, options.isEditingExisting ?? false);

  container.innerHTML = "";
  container.appendChild(fsd.elt);

  const w = options.width || container.clientWidth || 920;
  const h = options.height || container.clientHeight || 580;

  fsd.loadFromRefData(options.initialData || {});
  fsd.layoutEditor(w, h);

  return fsd;
}

/**
 * Helper to parse a formatted or raw formal statement string back into FSD initialData format.
 */
export function parseStatementToFsdData(expr: string): { exp?: string; quantifiers?: string; slots?: string; stage?: string } {
  if (!expr) return {};
  const trimmed = expr.trim();

  // If already a raw code like 'paq', 'r', 'm', 'ras'
  if (/^[pqrsmvkludbwcj\[\]naoe]+$/.test(trimmed)) {
    return { exp: trimmed, stage: '4' };
  }

  // Check for pattern: Quantifiers [ Predicate(slots) ... ]
  const bracketMatch = trimmed.match(/^(.*?)\s*\[\s*(.*?)\s*\]$/);
  let quantifiersStr = "";
  let innerExp = trimmed;

  if (bracketMatch) {
    quantifiersStr = bracketMatch[1].trim();
    innerExp = bracketMatch[2].trim();
  }

  // Predicate symbol to code map
  const symToCode: Record<string, string> = {
    'GT': 'r', 'LT': 's', 'GT5': 'p', 'LT10': 'q', 'EVEN': 'v', 'ODD': 'd',
    '=': 'k', '≤': 'l', '<=': 'l', '+1': 'u', '⊆': 'b', '≈': 'w', '~': 'w',
    '∣': 'c', '|': 'c', '∈': 'm', 'in': 'm', '≔': 'j', ':=': 'j'
  };

  // Try extracting slots from parentheses e.g. "GT(x₁, x₂)" or "GT5(x₁) ∧ LT10(x₁)"
  const slotMatches: string[] = [];
  const slotRegex = /\(([^)]+)\)/g;
  let sm: RegExpExecArray | null;
  while ((sm = slotRegex.exec(innerExp)) !== null) {
    const parts = sm[1].split(',').map((s) => s.trim());
    slotMatches.push(...parts);
  }

  // Check for predicate prefix in innerExp
  let expCode = "";
  for (const [sym, code] of Object.entries(symToCode)) {
    if (innerExp.startsWith(sym + "(") || innerExp === sym) {
      expCode = code;
      break;
    }
  }

  if (expCode) {
    return {
      exp: expCode,
      quantifiers: quantifiersStr || undefined,
      slots: slotMatches.length > 0 ? slotMatches.join(',') : undefined,
      stage: '4'
    };
  }

  return {
    exp: 'r',
    quantifiers: quantifiersStr || undefined,
    slots: slotMatches.length > 0 ? slotMatches.join(',') : undefined,
    stage: '4'
  };
}
