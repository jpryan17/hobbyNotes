import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent, TreeNode } from "./pxe.js";

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

    // Direct click on top PXE bar cycles slot selection
    this.pxe.txtFrame.elt.addEventListener("click", () => this.cycleSlotSelection());
    this.pxe.txt.elt.addEventListener("click", () => this.cycleSlotSelection());

    this.renderStage2Controls();
    this.updatePXEText();
  }

  cycleSlotSelection() {
    if (this.stage === 2 && this.slots.length > 0) {
      this.selectedSlotIndex = (this.selectedSlotIndex + 1) % this.slots.length;
      this.updatePXEText();
      this.renderStage2Controls();
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
    this.selectedQuantifier = "∀";
    this.clearStageControls();
    this.renderStage3Controls();
    this.updatePXEText();
  }

  renderStage3Controls() {
    this.clearStageControls();

    // Stage 3 Navigation & Reset Buttons
    const btnPrev = new SVGSelectableText(() => this.prevStage(), "← Slots", false);
    btnPrev.setAble(true);
    this.stageControls.push(btnPrev);

    const btnReset = new SVGSelectableText(() => this.resetStage3(), "Reset Prefix", false);
    btnReset.setAble(this.quantifierBindings.length > 0);
    this.stageControls.push(btnReset);

    // Unique variables used in Stage 2
    const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter(Boolean)));
    const unquantifiedVars = uniqueVars.filter(
      (v) => !this.quantifierBindings.some((q) => q.variable === v)
    );

    // Quantifier Toggle (∀ vs ∃)
    const btnForall = new SVGSelectableText(() => {
      this.selectedQuantifier = "∀";
      this.renderStage3Controls();
    }, "∀ (For All)", false);
    btnForall.setAble(this.selectedQuantifier !== "∀");

    const btnExists = new SVGSelectableText(() => {
      this.selectedQuantifier = "∃";
      this.renderStage3Controls();
    }, "∃ (Exists)", false);
    btnExists.setAble(this.selectedQuantifier !== "∃");

    this.stageControls.push(btnForall);
    this.stageControls.push(btnExists);

    // Unquantified Variable Target Buttons
    unquantifiedVars.forEach((v) => {
      const btn = new SVGSelectableText(() => {
        this.quantifierBindings.push({
          quantifier: this.selectedQuantifier,
          variable: v,
        });
        this.updatePXEText();
        this.renderStage3Controls();
      }, `Bind ${this.selectedQuantifier}${v}`, false);
      this.stageControls.push(btn);
    });

    // Stage 3 Transition Button (when all unique variables are quantified)
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
    if (this.quantifierBindings && this.quantifierBindings.length > 0) {
      const qPrefix = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}`).join(" ");
      display += `${qPrefix} [ `;
    }

    const getSlotVal = (idx: number) => {
      const s = this.slots[idx];
      if (!s) return "_";
      if (s.assignedVar) return s.assignedVar;
      if (this.stage === 2 && idx === this.selectedSlotIndex) return "?";
      return "_";
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

    if (this.quantifierBindings && this.quantifierBindings.length > 0) {
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

  // --- STAGE 4 RENDERING (Clean 1-Row Truth Table & Click-Triggered Matrix) ---
  renderStage4Table() {
    this.fo.removeChildren();
    this.fo.setV("");

    const container = new Elt("div");
    container.setA("style", "font-family: sans-serif; padding: 5px;");
    this.fo.append(container);

    const statementStr = this.pxe.txt.getV();
    const evalResult = this.evaluateFullStatement();

    // Clean 1-Row Truth Table (Matching TTD Style)
    const table = new Elt("table");
    table.setA("style", "border-collapse: collapse; width: 100%; border: 1px solid black; text-align: center;");
    container.append(table);

    const thead = new Elt("thead");
    table.append(thead);

    const trHead1 = new Elt("tr");
    thead.append(trHead1);

    const thHeader = new Elt("th");
    thHeader.setAA([
      "colspan", "2",
      "style", "border: 1px solid black; background-color: lightgrey; padding: 6px; font-size: 14px;"
    ]);
    thHeader.setV("Quantified Formal Statement Evaluation");
    trHead1.append(thHeader);

    const trHead2 = new Elt("tr");
    thead.append(trHead2);

    const thCols = [
      { name: statementStr, isPred: false },
      { name: "PG(x₁, x₂)", isPred: true },
    ];

    thCols.forEach((col, idx) => {
      const th = new Elt("th");
      const isSelected = this.selectedColIndex === idx;
      th.setAA([
        "style",
        `border: 1px solid black; padding: 8px; font-weight: bold; cursor: pointer; background-color: ${
          isSelected ? "#d1ecf1" : "white"
        }; color: ${col.isPred ? "firebrick" : "black"};`
      ]);
      th.setV(col.name + (col.isPred ? " 🔍" : ""));
      th.elt.addEventListener("click", () => {
        this.selectedColIndex = this.selectedColIndex === idx ? -1 : idx;
        this.renderStage4Table();
      });
      trHead2.append(th);
    });

    const tbody = new Elt("tbody");
    table.append(tbody);

    const trBody = new Elt("tr");
    tbody.append(trBody);

    const tdVal1 = new Elt("td");
    tdVal1.setAA(["style", `border: 1px solid black; padding: 10px; font-weight: bold; font-size: 16px; color: ${evalResult ? "green" : "red"}; background-color: ${evalResult ? "#d4edda" : "#f8d7da"};`]);
    tdVal1.setV(evalResult ? "T" : "F");
    trBody.append(tdVal1);

    const tdVal2 = new Elt("td");
    tdVal2.setAA(["style", "border: 1px solid black; padding: 10px; font-weight: bold; font-size: 16px; color: firebrick; cursor: pointer;"]);
    tdVal2.setV("T/F Matrix 🔍");
    tdVal2.elt.addEventListener("click", () => {
      this.selectedColIndex = this.selectedColIndex === 1 ? -1 : 1;
      this.renderStage4Table();
    });
    trBody.append(tdVal2);

    // Interactive Boolean Matrix View if clicked
    if (this.selectedColIndex !== -1) {
      this.renderMatrixVisualizer(container, evalResult);
    }
  }

  evaluateFullStatement(): boolean {
    const N = this.gridResolution;
    const grid: boolean[][] = [];

    // Dyadic grid points over [0,1]
    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const x1 = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const x2 = (j + 1) / N;
        row.push(x1 > x2); // PG(x₁, x₂)
      }
      grid.push(row);
    }

    // Evaluate quantifier sequence (e.g. ∀x₁ ∃x₂)
    const qStr = this.quantifierBindings.map((q) => `${q.quantifier}${q.variable}`).join(" ");

    if (qStr.includes("∀x₁") && qStr.includes("∃x₂")) {
      if (qStr.indexOf("∀x₁") < qStr.indexOf("∃x₂")) {
        // ∀x₁ ∃x₂: Every row has at least one True cell
        return grid.every((row) => row.some((val) => val));
      } else {
        // ∃x₂ ∀x₁: At least one column is entirely True
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

    return grid.every((row) => row.some((val) => val));
  }

  renderMatrixVisualizer(container: Elt, evalResult: boolean) {
    const matrixBox = new Elt("div");
    matrixBox.setA("style", "margin-top: 15px; border: 1px solid #17a2b8; border-radius: 4px; padding: 12px; background: #fafafa;");
    container.append(matrixBox);

    // Dyadic resolution selector buttons
    const resBox = new Elt("div");
    resBox.setA("style", "display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 10px;");
    resBox.setV("<b>Dyadic Grid Scale (1/2<sup>k</sup>):</b> ");

    [4, 8, 16, 32, 64].forEach((r) => {
      const btn = new Elt("button");
      btn.setV(`${r}×${r}`);
      const isSel = this.gridResolution === r;
      btn.setA("style", `padding: 2px 6px; font-size: 11px; cursor: pointer; border: 1px solid #17a2b8; background: ${isSel ? '#17a2b8' : '#ffffff'}; color: ${isSel ? '#ffffff' : '#17a2b8'}; border-radius: 3px;`);
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
    svg.setAA(["width", width + 40, "height", height + 35, "style", "background: #ffffff; border: 1px solid #ccc;"]);

    const labelX = new SVGText();
    labelX.setV("x₁ (row) →");
    labelX.setAA(["x", 5, "y", 14, "font-size", "11", "fill", "#333"]);
    svg.append(labelX);

    const labelY = new SVGText();
    labelY.setV("x₂ (col) ↓");
    labelY.setAA(["x", width - 35, "y", 14, "font-size", "11", "fill", "#333"]);
    svg.append(labelY);

    for (let i = 0; i < N; i++) {
      const x1 = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const x2 = (j + 1) / N;
        const isTrue = x1 > x2;

        const rect = new SVGElt("rect");
        rect.setAA([
          "x", 30 + j * cellSize,
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
    info.setA("style", "font-size: 12px; line-height: 1.5; color: #333;");
    info.setV(`
      <b>Boolean Matrix Details:</b><br>
      • Domain: ℂ<sub>ω</sub> × ℂ<sub>ω</sub> [0,1]<br>
      • Blue: <code>PG(x₁, x₂) = True</code><br>
      • Grey: <code>PG(x₁, x₂) = False</code><br>
      • Overall Truth: <b style="color:${evalResult ? 'green' : 'red'};">${evalResult ? 'True' : 'False'}</b>
    `);
    svgWrap.append(info);

    matrixBox.append(svgWrap);
  }
}

export let fsd: FSD;

export function setFSD() {
  fsd = new FSD();
}
