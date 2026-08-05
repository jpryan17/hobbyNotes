import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent, TreeNode } from "./pxe.js";
import { ttd } from "./ttd.js";

export interface SlotInfo {
  predCode: string; // 'p'|'q'|'r'|'s'
  predName: string; // 'PG5'|'PL10'|'PG'|'PL'
  slotIndex: number; // 0 or 1
  assignedVar?: string; // 'x₁', 'x₂', etc.
}

export interface QuantifierBinding {
  quantifier: "∀" | "∃";
  variable: string; // 'x₁', 'x₂', etc.
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
  buttonPG5: SVGSelectableText;
  buttonPL10: SVGSelectableText;
  buttonPG: SVGSelectableText;
  buttonPL: SVGSelectableText;
  buttonNeg: SVGSelectableText;
  buttonAnd: SVGSelectableText;
  buttonOr: SVGSelectableText;
  buttonImply: SVGSelectableText;
  buttonEquiv: SVGSelectableText;
  buttonLB: SVGSelectableText;
  buttonRB: SVGSelectableText;
  buttonBackspace: SVGSelectableText;
  nextStageButton: SVGSelectableText;

  // Stage 2 State: Variables & Slots
  availableVars: string[] = ["x₁"];
  selectedVar: string = "x₁";
  slots: SlotInfo[] = [];

  // Dynamic Stage 2 & 3 Controls
  stageControls: SVGElt[] = [];

  // Stage 3 State: Quantifier Prefix
  quantifierBindings: QuantifierBinding[] = [];
  selectedQuantifier: "∀" | "∃" = "∀";

  // Stage 4 Matrix State
  gridResolution = 16;
  matrixVisible = false;
  selectedColIndex = -1;

  constructor() {
    super();
    this.editorFrame = new SVGElt("rect");
    this.controlsFrame = new SVGElt("rect");
    this.fo = new SVGElt("foreignObject");
    this.pxe = new PXE(this);
    this.pxe.fmt = () => this.formatFSDExp(this.pxe.exp);

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
      "x", x, "y", this.foY, "style", "background-color:white;padding:15px;overflow:auto"
    ]);

    // Stage 1 Buttons
    this.buttonPG5 = new SVGSelectableText(() => this.pxe.addCharacter("p"), "PG5", false);
    this.buttonPL10 = new SVGSelectableText(() => this.pxe.addCharacter("q"), "PL10", false);
    this.buttonPG = new SVGSelectableText(() => this.pxe.addCharacter("r"), "PG", false);
    this.buttonPL = new SVGSelectableText(() => this.pxe.addCharacter("s"), "PL", false);

    this.buttonNeg = new SVGSelectableText(() => this.pxe.addCharacter("n"), "¬", false);
    this.buttonAnd = new SVGSelectableText(() => this.pxe.addCharacter("a"), "∧", false);
    this.buttonOr = new SVGSelectableText(() => this.pxe.addCharacter("o"), "∨", false);
    this.buttonImply = new SVGSelectableText(() => this.pxe.addCharacter("i"), "→", false);
    this.buttonEquiv = new SVGSelectableText(() => this.pxe.addCharacter("e"), "↔", false);
    this.buttonLB = new SVGSelectableText(() => this.pxe.addCharacter("["), "[", false);
    this.buttonRB = new SVGSelectableText(() => this.pxe.addCharacter("]"), "]", false);
    this.buttonBackspace = new SVGSelectableText(() => this.pxe.backspace(), "⌫", false);

    this.nextStageButton = new SVGSelectableText(() => this.advanceStage(), "Bind Variables →", false);

    this.initStage1Controls();
  }

  initStage1Controls() {
    this.controls = [
      this.buttonPG5,
      this.buttonPL10,
      this.buttonPG,
      this.buttonPL,
      this.buttonNeg,
      this.buttonAnd,
      this.buttonOr,
      this.buttonImply,
      this.buttonEquiv,
      this.buttonLB,
      this.buttonRB,
      this.buttonBackspace,
      this.nextStageButton,
    ];
  }

  layoutEditor() {
    const [fow, foh] = [Nav.foWidth, Nav.foHeight];
    this.setAA(["width", fow, "height", foh]);
    this.editorFrame.setAA(["width", fow, "height", foh]);
    this.controlsFrame.setA("width", fow - 2 * this.sideMargin);

    this.pxe.layout();

    const foW = fow - 2 * this.sideMargin;
    const foH = foh - this.foY - 2 * this.vertMargin;
    this.fo.setAA(["width", foW, "height", foH]);

    this.showControls();
  }

  clearStageControls() {
    this.stageControls.forEach((c) => {
      if (c.elt && c.elt.parentElement) {
        c.elt.parentElement.removeChild(c.elt);
      }
    });
    this.stageControls = [];
  }

  showControls() {
    // Clear old SVG controls from parent SVG
    this.controls.forEach(c => {
      if (c.elt && c.elt.parentElement) c.elt.parentElement.removeChild(c.elt);
    });
    this.stageControls.forEach(c => {
      if (c.elt && c.elt.parentElement) c.elt.parentElement.removeChild(c.elt);
    });

    const y = 2 * this.vertMargin + PXE.textFrameHeight + (2 / 3) * this.controlsFrameHeight;
    let x = this.sideMargin + 5;

    const getBtnWidth = (e: SVGElt) => {
      let w = 0;
      try {
        w = e.getBB().width;
      } catch (err) {
        w = 0;
      }
      if (w <= 0) {
        const textVal = e.getV ? e.getV() : "";
        w = textVal.length * 10 + 6;
      }
      return Math.max(w, 20);
    };

    if (this.stage === 1) {
      this.controls.forEach((e) => {
        this.append(e);
        e.setAA(["x", x, "y", y]);
        x += getBtnWidth(e) + 12;
      });
    } else if (this.stage === 2 || this.stage === 3) {
      this.stageControls.forEach((e) => {
        this.append(e);
        e.setAA(["x", x, "y", y]);
        x += getBtnWidth(e) + 12;
      });
    }
  }

  setButtonStates() {
    if (this.stage === 1) {
      const expectClass = this.pxe.setExpectClass();

      const frontBtnsEnabled = expectClass === "front";
      this.buttonPG5.setAble(frontBtnsEnabled);
      this.buttonPL10.setAble(frontBtnsEnabled);
      this.buttonPG.setAble(frontBtnsEnabled);
      this.buttonPL.setAble(frontBtnsEnabled);
      this.buttonNeg.setAble(frontBtnsEnabled);
      this.buttonLB.setAble(frontBtnsEnabled);

      const backBtnsEnabled = expectClass === "back";
      this.buttonAnd.setAble(backBtnsEnabled);
      this.buttonOr.setAble(backBtnsEnabled);
      this.buttonImply.setAble(backBtnsEnabled);
      this.buttonEquiv.setAble(backBtnsEnabled);
      this.buttonRB.setAble(backBtnsEnabled && this.pxe.nl > 0);

      this.buttonBackspace.setAble(this.pxe.exp.length > 0);

      const isValid = expectClass === "back" && this.pxe.nl === 0;
      this.nextStageButton.setAble(isValid);
    }
  }

  clear() {
    this.stage = 1;
    this.availableVars = ["x₁"];
    this.selectedVar = "x₁";
    this.slots = [];
    this.quantifierBindings = [];
    this.matrixVisible = false;
    this.selectedColIndex = -1;
    this.clearStageControls();
    this.initStage1Controls();
    this.fo.removeChildren();
    this.fo.setV("");
    this.showControls();
    this.pxe.exp = "";
    this.pxe.nl = 0;
    this.pxe.displayText();
  }

  prevStage() {
    this.clearStageControls();
    if (this.stage === 2) {
      this.stage = 1;
      this.initStage1Controls();
      this.showControls();
      this.updatePXEText();
    } else if (this.stage === 3) {
      this.stage = 2;
      this.renderStage2Controls();
      this.updatePXEText();
    } else if (this.stage === 4) {
      this.stage = 3;
      this.fo.removeChildren();
      this.fo.setV("");
      this.renderStage3Controls();
      this.updatePXEText();
    }
  }

  resetStage2() {
    this.slots.forEach((s) => (s.assignedVar = undefined));
    this.availableVars = ["x₁"];
    this.selectedVar = "x₁";
    this.selectedSlotIndex = 0;
    this.updatePXEText();
    this.renderStage2Controls();
  }

  resetStage3() {
    this.quantifierBindings = [];
    this.selectedQuantifier = "∀";
    this.updatePXEText();
    this.renderStage3Controls();
  }

  advanceStage() {
    this.clearStageControls();
    if (this.stage === 1) {
      this.setupStage2();
    } else if (this.stage === 2) {
      this.setupStage3();
    } else if (this.stage === 3) {
      this.setupStage4();
    }
  }

  selectedSlotIndex: number = 0;
  selectedQuantifierVarIndex: number = 0;

  // --- STAGE 2: Variable Slot Binding ---
  setupStage2() {
    this.stage = 2;
    this.slots = [];
    this.availableVars = ["x₁"];
    this.selectedVar = "x₁";
    this.selectedSlotIndex = 0;
    this.clearStageControls();

    // Extract all predicate tokens from pxe.exp
    for (let i = 0; i < this.pxe.exp.length; i++) {
      const ch = this.pxe.exp[i];
      if (ch === "p") {
        this.slots.push({ predCode: "p", predName: "PG5", slotIndex: 0 });
      } else if (ch === "q") {
        this.slots.push({ predCode: "q", predName: "PL10", slotIndex: 0 });
      } else if (ch === "r") {
        this.slots.push({ predCode: "r", predName: "PG", slotIndex: 0 });
        this.slots.push({ predCode: "r", predName: "PG", slotIndex: 1 });
      } else if (ch === "s") {
        this.slots.push({ predCode: "s", predName: "PL", slotIndex: 0 });
        this.slots.push({ predCode: "s", predName: "PL", slotIndex: 1 });
      }
    }

    // Direct click on top PXE bar cycles slot/variable selection
    this.pxe.txtFrame.elt.addEventListener("click", () => this.handlePXEClick());
    this.pxe.txt.elt.addEventListener("click", () => this.handlePXEClick());

    this.renderStage2Controls();
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
      this.updatePXEText();
      this.renderStage2Controls();
    }
  }

  cycleQuantifierVarSelection() {
    if (this.stage === 3) {
      const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter(Boolean)));
      const unquantifiedVars = uniqueVars.filter(
        (v) => !this.quantifierBindings.some((q) => q.variable === v)
      );
      if (unquantifiedVars.length > 0) {
        this.selectedQuantifierVarIndex = (this.selectedQuantifierVarIndex + 1) % unquantifiedVars.length;
        this.updatePXEText();
        this.renderStage3Controls();
      }
    }
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
    this.updatePXEText();
    this.renderStage2Controls();
  }

  renderStage2Controls() {
    this.clearStageControls();

    // Stage 2 Navigation & Reset Buttons
    const btnPrev = new SVGSelectableText(() => this.prevStage(), "← Exp", false);
    btnPrev.setAble(true);
    this.stageControls.push(btnPrev);

    const btnReset = new SVGSelectableText(() => this.resetStage2(), "Reset Slots", false);
    btnReset.setAble(this.slots.some((s) => s.assignedVar !== undefined));
    this.stageControls.push(btnReset);

    // Variable Assignment Buttons for active slot (x₁, x₂, etc.)
    this.availableVars.forEach((v) => {
      const btn = new SVGSelectableText(() => {
        this.assignVarToActiveSlot(v);
      }, v, false);
      btn.setAble(this.slots.length > 0);
      this.stageControls.push(btn);
    });

    // "+ Var" button to create x₂, x₃, etc. and assign to active slot
    const newVarBtn = new SVGSelectableText(() => {
      const subscripts = ["₁", "₂", "₃", "₄", "₅", "₆"];
      const nextIdx = this.availableVars.length;
      const sub = subscripts[nextIdx] || `${nextIdx + 1}`;
      const newV = `x${sub}`;
      this.availableVars.push(newV);
      this.assignVarToActiveSlot(newV);
    }, "+ Var", false);
    newVarBtn.setAble(this.slots.length > 0);
    this.stageControls.push(newVarBtn);

    // Stage 2 Transition Button (enabled only when ALL slots are bound)
    const allBound = this.slots.length > 0 && this.slots.every((s) => s.assignedVar !== undefined);
    const nextBtn = new SVGSelectableText(() => this.advanceStage(), "Quantify Variables →", false);
    nextBtn.setAble(allBound);
    this.stageControls.push(nextBtn);

    this.showControls();
  }

  // --- STAGE 3: Variable Quantification ---
  setupStage3() {
    this.stage = 3;
    this.quantifierBindings = [];
    this.selectedQuantifierVarIndex = 0;
    this.clearStageControls();
    this.renderStage3Controls();
    this.updatePXEText();
  }

  applyQuantifier(qSymbol: "∀" | "∃") {
    const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter(Boolean)));
    const unquantifiedVars = uniqueVars.filter(
      (v) => !this.quantifierBindings.some((q) => q.variable === v)
    );

    if (unquantifiedVars.length > 0) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      if (targetVar) {
        this.quantifierBindings.push({
          quantifier: qSymbol,
          variable: targetVar,
        });
        this.selectedQuantifierVarIndex = 0;
      }
    }
    this.updatePXEText();
    this.renderStage3Controls();
  }

  renderStage3Controls() {
    this.clearStageControls();

    // Stage 3 Navigation & Reset Buttons
    const btnPrev = new SVGSelectableText(() => this.prevStage(), "← Slots", false);
    btnPrev.setAble(true);
    this.stageControls.push(btnPrev);

    const btnReset = new SVGSelectableText(() => this.resetStage3(), "Clear Quantifiers", false);
    btnReset.setAble(this.quantifierBindings.length > 0);
    this.stageControls.push(btnReset);

    // Unique unquantified variables used in Stage 2
    const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter(Boolean)));
    const unquantifiedVars = uniqueVars.filter(
      (v) => !this.quantifierBindings.some((q) => q.variable === v)
    );

    const hasUnquantified = unquantifiedVars.length > 0;

    // Sparse Universal Quantifier Button "∀"
    const btnForall = new SVGSelectableText(() => this.applyQuantifier("∀"), "∀", false);
    btnForall.setAble(hasUnquantified);
    this.stageControls.push(btnForall);

    // Sparse Existential Quantifier Button "∃"
    const btnExists = new SVGSelectableText(() => this.applyQuantifier("∃"), "∃", false);
    btnExists.setAble(hasUnquantified);
    this.stageControls.push(btnExists);

    // Stage 3 Transition Button (enabled when all unique variables are quantified)
    const allQuantified = unquantifiedVars.length === 0 && uniqueVars.length > 0;
    const evalBtn = new SVGSelectableText(() => this.advanceStage(), "Evaluate Statement →", false);
    evalBtn.setAble(allQuantified);
    this.stageControls.push(evalBtn);

    this.showControls();
  }

  // --- STAGE 4: Truth Table Header + 1 Row Table & Interactive Matrix ---
  setupStage4() {
    this.stage = 4;
    this.stageControls = [];
    this.showControls();
    this.renderStage4Table();
  }

  // Format real-time PXE expression string for Top Bar with Predicate Names
  formatFSDExp(exp: string): string {
    let display = "";

    // Quantifier Prefix (Stage 3+)
    if (this.stage >= 3) {
      if (this.quantifierBindings && this.quantifierBindings.length > 0) {
        const qPrefix = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}`).join(" ");
        display += `${qPrefix} [ `;
      } else {
        display += "[ ";
      }
    }

    const getSlotVal = (idx: number) => {
      const s = this.slots[idx];
      if (!s) return "_";
      if (this.stage === 2 && !s.assignedVar && idx === this.selectedSlotIndex) return "?";
      if (!s.assignedVar) return "_";

      if (this.stage === 3) {
        const uniqueVars = Array.from(new Set(this.slots.map((st) => st.assignedVar!).filter(Boolean)));
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
        display += this.stage >= 2 ? `PG5(${v0})` : "PG5";
      } else if (ch === "q") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `PL10(${v0})` : "PL10";
      } else if (ch === "r") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `PG(${v0}, ${v1})` : "PG";
      } else if (ch === "s") {
        const v0 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        const v1 = this.stage >= 2 ? getSlotVal(slotIdx++) : "";
        display += this.stage >= 2 ? `PL(${v0}, ${v1})` : "PL";
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
        display += ch;
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
  }

  // --- STAGE 4 RENDERING (Exact TTD Engine 1-Row Truth Table & Interactive Matrix) ---
  renderStage4Table() {
    this.fo.removeChildren();
    this.fo.setV("");

    const container = new Elt("div");
    container.setA("style", "font-family: Arial, sans-serif; padding: 10px; max-width: 98%; margin: 0 auto;");
    this.fo.append(container);

    // Extract unique predicates used in raw exp
    const predMap: { [code: string]: { name: string; val: boolean } } = {};

    if (this.pxe.exp.includes("p")) predMap["p"] = { name: "PG5", val: this.evaluatePredicate("PG5") };
    if (this.pxe.exp.includes("q")) predMap["q"] = { name: "PL10", val: this.evaluatePredicate("PL10") };
    if (this.pxe.exp.includes("r")) predMap["r"] = { name: "PG", val: this.evaluatePredicate("PG") };
    if (this.pxe.exp.includes("s")) predMap["s"] = { name: "PL", val: this.evaluatePredicate("PL") };

    const predCodes = Object.keys(predMap);

    // Build syntax tree and columns using TTD engine
    const tree = ttd.bldTree(this.pxe.exp);
    ttd.tree = tree;
    ttd.predCols = predCodes.map((c) => predMap[c].name);
    ttd.expCols = ttd.treeToExpColumns(tree);

    // Format expression column headers with predicate names
    ttd.expCols.forEach((c) => {
      if (c.header.includes("p")) c.header = c.header.replace(/p/g, "PG5");
      if (c.header.includes("q")) c.header = c.header.replace(/q/g, "PL10");
      if (c.header.includes("r")) c.header = c.header.replace(/r/g, "PG");
      if (c.header.includes("s")) c.header = c.header.replace(/s/g, "PL");
    });

    // Single row evaluated values
    const predVals = predCodes.map((c) => (predMap[c].val ? "T" : "F"));
    const predValsOnly: { [code: string]: boolean } = {};
    predCodes.forEach((c) => (predValsOnly[c] = predMap[c].val));
    const expColsEvaluated = this.evaluateExpCols(this.pxe.exp, predValsOnly);
    const expVals = expColsEvaluated.map((c) => (c.val ? "T" : "F"));

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

    // Interactive Boolean Matrix Visualizer for selected predicate column
    if (this.selectedColIndex !== -1 && predCodes[this.selectedColIndex]) {
      const selCode = predCodes[this.selectedColIndex];
      const selPred = predMap[selCode];
      this.renderMatrixVisualizer(container, selPred.val, selPred.name);
    }
  }

  evaluatePredicate(predName: string): boolean {
    const N = this.gridResolution;
    const grid: boolean[][] = [];

    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const x1 = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const x2 = (j + 1) / N;
        if (predName === "PG") row.push(x1 > x2);
        else if (predName === "PL") row.push(x1 < x2);
        else if (predName === "PG5") row.push(x1 > 0.5);
        else if (predName === "PL10") row.push(x1 < 1.0);
        else row.push(true);
      }
      grid.push(row);
    }

    const qStr = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}`).join(" ");

    if (qStr.includes("∀x₁") && qStr.includes("∃x₂")) {
      if (qStr.indexOf("∀x₁") < qStr.indexOf("∃x₂")) {
        return grid.every((row) => row.some((val) => val));
      } else {
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
      }
    }

    if (qStr.includes("∀")) {
      return grid.every((row) => row.some((val) => val));
    }

    return grid.some((row) => row.some((val) => val));
  }

  evaluateExpCols(exp: string, predValues: { [code: string]: boolean }): { label: string; val: boolean }[] {
    const cols: { label: string; val: boolean }[] = [];

    for (let i = 0; i < exp.length; i++) {
      const ch = exp[i];
      if (ch === "p") cols.push({ label: "PG5", val: predValues["p"] ?? true });
      else if (ch === "q") cols.push({ label: "PL10", val: predValues["q"] ?? true });
      else if (ch === "r") cols.push({ label: "PG", val: predValues["r"] ?? true });
      else if (ch === "s") cols.push({ label: "PL", val: predValues["s"] ?? true });
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
      }
    }

    return cols;
  }

  evaluateFullStatement(): boolean {
    const predMap: { [code: string]: boolean } = {
      p: this.evaluatePredicate("PG5"),
      q: this.evaluatePredicate("PL10"),
      r: this.evaluatePredicate("PG"),
      s: this.evaluatePredicate("PL"),
    };
    const cols = this.evaluateExpCols(this.pxe.exp, predMap);
    const mainOp = cols.find((c) => ["∧", "∨", "→", "↔", "¬"].includes(c.label));
    return mainOp ? mainOp.val : (cols[0]?.val ?? true);
  }

  renderMatrixVisualizer(container: Elt, evalResult: boolean, colLabel: string) {
    const matrixBox = new Elt("div");
    matrixBox.setA("style", "margin-top: 15px; border: 1px solid #17a2b8; border-radius: 6px; padding: 14px; background: #fdfdfd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);");
    container.append(matrixBox);

    // Header title for Matrix Visualizer
    const titleBox = new Elt("div");
    titleBox.setA("style", "font-weight: bold; font-size: 14px; color: #0056b3; margin-bottom: 8px;");
    titleBox.setV(`Boolean Matrix Structure for Predicate: ${colLabel}`);
    matrixBox.append(titleBox);

    // Dyadic resolution selector buttons
    const resBox = new Elt("div");
    resBox.setA("style", "display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 12px;");
    resBox.setV("<b>Dyadic Grid Scale (1/2<sup>k</sup>):</b> ");

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
    const width = N * cellSize;
    const height = N * cellSize;

    const svgWrap = new Elt("div");
    svgWrap.setA("style", "display: flex; gap: 15px; align-items: center;");

    const svg = new SVGElt("svg");
    svg.setAA(["width", width + 45, "height", height + 35, "style", "background: #ffffff; border: 1px solid #ccc; border-radius: 3px;"]);

    const labelX = new SVGText();
    labelX.setV("x₁ (row) →");
    labelX.setAA(["x", 5, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelX);

    const labelY = new SVGText();
    labelY.setV("x₂ (col) ↓");
    labelY.setAA(["x", width - 35, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelY);

    for (let i = 0; i < N; i++) {
      const x1 = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const x2 = (j + 1) / N;
        const isTrue = colLabel === "PL" ? x1 < x2 : colLabel === "PG5" ? x1 > 0.5 : colLabel === "PL10" ? x1 < 1.0 : x1 > x2;

        const rect = new SVGElt("rect");
        rect.setAA([
          "x", 35 + j * cellSize,
          "y", 22 + i * cellSize,
          "width", cellSize - (N > 32 ? 0 : 1),
          "height", cellSize - (N > 32 ? 0 : 1),
          "fill", isTrue ? "#007bff" : "#e9ecef",
          "stroke", N <= 16 ? "#ced4da" : "none"
        ]);
        svg.append(rect);
      }
    }

    svgWrap.append(svg);

    const info = new Elt("div");
    info.setA("style", "font-size: 13px; line-height: 1.6; color: #333;");
    info.setV(`
      <b>Quantified Truth Explanation:</b><br>
      • Domain: ℂ<sub>ω</sub> × ℂ<sub>ω</sub> [0,1]<br>
      • Blue Cells: <code>True</code><br>
      • Grey Cells: <code>False</code><br>
      • Predicate Evaluated Truth: <b style="color:${evalResult ? '#155724' : '#721c24'}; background:${evalResult ? '#d4edda' : '#f8d7da'}; padding:2px 6px; border-radius:3px;">${evalResult ? 'True (T)' : 'False (F)'}</b>
    `);
    svgWrap.append(info);

    matrixBox.append(svgWrap);
  }
}

export let fsd: FSD;

export function setFSD() {
  fsd = new FSD();
}
