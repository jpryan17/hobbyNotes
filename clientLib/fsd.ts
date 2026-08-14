import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent, TreeNode } from "./pxe.js";
import { ttd } from "./ttd.js";
import { PredicateRegistry, PredicateDef } from "./predicateRegistry.js";

export type DomainType = "ℕ" | "𝒫(ℕ)";

export interface SlotInfo {
  predCode: string; // 'p'|'q'|'r'|'s'|'m'|'v'
  predName: string; // 'GT5'|'LT10'|'GT'|'LT'|'∈'|'EVEN'
  slotIndex: number; // 0, 1, ...
  domainType: DomainType; // 'ℕ' (element) or '𝒫(ℕ)' (subset)
  assignedVar?: string; // 'x₁', 'x₂', 'y₁', 'GT5', 'LT10', etc.
}

export interface QuantifierBinding {
  quantifier: "∀" | "∃";
  variable: string; // 'x₁', 'y₁', etc.
  domainType: DomainType; // 'ℕ' or '𝒫(ℕ)'
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

  // Stage 2 State: Variables & Slots
  elementVars: string[] = ["x₁", "x₂"];
  setVars: string[] = ["y₁", "y₂", "GT5", "LT10"];
  availableVars: string[] = ["x₁", "x₂", "y₁", "y₂", "GT5", "LT10"];
  selectedVar: string = "x₁";
  slots: SlotInfo[] = [];

  // Dynamic Stage Controls
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
      "x", x, "y", this.foY, "style", "overflow:visible;"
    ]);

    this.renderStageControls();
  }

  layoutEditor() {
    const fow = Nav.foWidth || (window.innerWidth - 250);
    const foh = Nav.foHeight || (window.innerHeight - 80);
    this.setAA(["width", fow, "height", foh, "style", "display:block;"]);
    this.editorFrame.setAA(["width", fow, "height", foh]);
    this.controlsFrame.setA("width", fow - 2 * this.sideMargin);
    this.pxe.setAA(["width", fow - 2 * this.sideMargin]);
    this.pxe.layout();

    const foW = fow - 2 * this.sideMargin;
    const foH = foh - this.foY - this.vertMargin;
    this.fo.setAA(["width", foW, "height", Math.max(100, foH)]);

    this.renderStageControls();
    this.updatePXEText();

    if (this.stage === 4) {
      this.renderStage4Table();
    }
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

    this.layoutStageControls();
    this.setButtonStates();
  }

  buildStage1Controls() {
    this.predButtons = PredicateRegistry.getPredicates().map((p) => {
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
          .filter((v) => v && v !== "GT5" && v !== "LT10")
      )
    );
    const unquantifiedVars = uniqueVars.filter(
      (v) => !this.quantifierBindings.some((q) => q.variable === v)
    );

    const hasUnquantified = unquantifiedVars.length > 0;

    if (hasUnquantified) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      const slot = this.slots.find((s) => s.assignedVar === targetVar);
      const dType: DomainType = slot ? slot.domainType : (targetVar.startsWith("y") ? "𝒫(ℕ)" : "ℕ");

      const varChip = new SVGSelectableText(
        () => {
          this.selectedQuantifierVarIndex = (this.selectedQuantifierVarIndex + 1) % unquantifiedVars.length;
          this.renderStageControls();
          this.updatePXEText();
        },
        `Var: ${targetVar}:${dType}`,
        true,
        undefined,
        { std: "darkred", over: "fuchsia", disabled: "grey", selected: "darkred" }
      );
      this.stageControls.push(varChip);
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
  }

  clear() {
    this.stage = 1;
    this.elementVars = ["x₁", "x₂"];
    this.setVars = ["y₁", "y₂", "GT5", "LT10"];
    this.availableVars = ["x₁", "x₂", "y₁", "y₂", "GT5", "LT10"];
    this.selectedVar = "x₁";
    this.slots = [];
    this.quantifierBindings = [];
    this.matrixVisible = false;
    this.selectedColIndex = -1;
    this.selectedSlotIndex = 0;
    this.selectedQuantifierVarIndex = 0;
    this.fo.removeChildren();
    this.fo.setV("");
    this.pxe.exp = "";
    this.pxe.nl = 0;
    this.pxe.caret.setA("visibility", "visible");
    this.renderStageControls();
    this.pxe.displayText();
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
      this.fo.removeChildren();
      this.fo.setV("");
      this.renderStageControls();
      this.updatePXEText();
    }
  }

  resetStage2() {
    this.slots.forEach((s) => (s.assignedVar = undefined));
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
  }

  selectedSlotIndex: number = 0;
  selectedQuantifierVarIndex: number = 0;

  // --- STAGE 2: Variable Slot Binding ---
  setupStage2() {
    this.stage = 2;
    this.slots = [];
    this.elementVars = ["x₁", "x₂"];
    this.setVars = ["y₁", "y₂", "GT5", "LT10"];
    this.availableVars = ["x₁", "x₂", "y₁", "y₂", "GT5", "LT10"];
    this.selectedSlotIndex = 0;

    // Extract all predicate tokens from pxe.exp
    for (let i = 0; i < this.pxe.exp.length; i++) {
      const ch = this.pxe.exp[i];
      const pred = PredicateRegistry.getPredicate(ch);
      if (pred) {
        pred.signature.forEach((sigDomain, slotIdx) => {
          const domainType: DomainType = sigDomain === "P_N" ? "𝒫(ℕ)" : "ℕ";
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
      const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && v !== "GT5" && v !== "LT10")));
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
      if (s.assignedVar && s.assignedVar !== "GT5" && s.assignedVar !== "LT10") {
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
    const uniqueVars = Array.from(new Set(this.slots.map((s) => s.assignedVar!).filter((v) => v && v !== "GT5" && v !== "LT10")));
    const unquantifiedVars = uniqueVars.filter(
      (v) => !this.quantifierBindings.some((q) => q.variable === v)
    );

    if (unquantifiedVars.length > 0) {
      const targetVar = unquantifiedVars[this.selectedQuantifierVarIndex % unquantifiedVars.length];
      if (targetVar) {
        const slot = this.slots.find((s) => s.assignedVar === targetVar);
        const dType: DomainType = slot ? slot.domainType : (targetVar.startsWith("y") ? "𝒫(ℕ)" : "ℕ");
        this.quantifierBindings.push({
          quantifier: qSymbol,
          variable: targetVar,
          domainType: dType,
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
    container.setA("style", "width: 100%; height: 100%; max-height: 100%; overflow-y: auto; overflow-x: hidden; background-color: white; padding: 15px; box-sizing: border-box; font-family: Arial, sans-serif;");
    this.fo.append(container);

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

    // Interactive Boolean Matrix Visualizer for selected predicate column
    if (this.selectedColIndex !== -1 && predCodes[this.selectedColIndex]) {
      const selCode = predCodes[this.selectedColIndex];
      const selPred = predMap[selCode];
      this.renderMatrixVisualizer(container, selPred.val, selPred.name);
    }
  }

  evaluatePredicate(predName: string): boolean {
    const pred = PredicateRegistry.getPredicate(predName);
    if (!pred) return true;

    const boundSlots = this.slots
      .filter((s) => s.predName === pred.symbol || s.predCode === pred.code)
      .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));

    if (pred.symbol === "∈") {
      const mSlot = this.slots.find((s) => s.predName === "∈" && s.slotIndex === 1);
      if (mSlot && (mSlot.assignedVar === "GT5" || mSlot.assignedVar === "LT10")) {
        // Membership with constant subset
        const xBinding = this.quantifierBindings.find((q) => q.domainType === "ℕ");
        const xQuant = xBinding ? xBinding.quantifier : "∃";
        const N = 16;
        const matches: boolean[] = [];
        for (let x = 1; x <= N; x++) {
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

      const xBinding = this.quantifierBindings.find((q) => q.domainType === "ℕ");
      const yBinding = this.quantifierBindings.find((q) => q.domainType === "𝒫(ℕ)");

      const xQuant = xBinding ? xBinding.quantifier : "∃";
      const yQuant = yBinding ? yBinding.quantifier : "∀";

      const xFirst = xBinding && yBinding
        ? this.quantifierBindings.indexOf(xBinding) < this.quantifierBindings.indexOf(yBinding)
        : true;

      if (xFirst) {
        // Order: Qx x:ℕ, Qy y:𝒫(ℕ)
        if (xQuant === "∃" && yQuant === "∀") {
          return grid.some((row) => row.every((val) => val));
        } else if (xQuant === "∀" && yQuant === "∃") {
          return grid.every((row) => row.some((val) => val));
        } else if (xQuant === "∀" && yQuant === "∀") {
          return grid.every((row) => row.every((val) => val));
        } else {
          return grid.some((row) => row.some((val) => val));
        }
      } else {
        // Order: Qy y:𝒫(ℕ), Qx x:ℕ
        if (yQuant === "∀" && xQuant === "∃") {
          for (let j = 0; j < numSubsets; j++) {
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
          for (let j = 0; j < numSubsets; j++) {
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
          return grid.every((row) => row.every((val) => val));
        } else {
          return grid.some((row) => row.some((val) => val));
        }
      }
    }

    const N = this.gridResolution;
    const grid: boolean[][] = [];

    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const x1 = i + 1; // 1..16 on ℕ
      for (let j = 0; j < N; j++) {
        const x2 = j + 1; // 1..16 on ℕ
        row.push(PredicateRegistry.evaluateAt(pred.id, boundSlots, { "x₁": x1, "x₂": x2 }));
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
      return grid.every((row) => row.every((val) => val));
    }

    return grid.some((row) => row.some((val) => val));
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
    const N = this.gridResolution;
    const isSingleVar = !this.pxe.exp.includes("r") && !this.pxe.exp.includes("s") && this.slots.every(s => s.assignedVar === "x₁" || s.assignedVar === "GT5" || s.assignedVar === "LT10");

    if (isSingleVar) {
      const q = this.quantifierBindings[0]?.quantifier || "∃";
      const rowResults: boolean[] = [];
      for (let x = 1; x <= N; x++) {
        const localPreds: { [code: string]: boolean } = {
          p: x > 5,
          q: x < 10,
          r: false,
          s: false,
          m: true
        };
        // Check constant subset for m
        const mSlot = this.slots.find(s => s.predName === "∈" && s.slotIndex === 1);
        if (mSlot) {
          localPreds.m = mSlot.assignedVar === "GT5" ? x > 5 : mSlot.assignedVar === "LT10" ? x < 10 : true;
        }

        const cols = this.evaluateExpCols(this.pxe.exp, localPreds);
        const mainVal = cols.length > 0 ? cols[cols.length - 1].val : true;
        rowResults.push(mainVal);
      }
      return q === "∀" ? rowResults.every(Boolean) : rowResults.some(Boolean);
    }

    // 2-variable domain evaluation on ℕ × ℕ
    const q1 = this.quantifierBindings[0]?.quantifier || "∃";
    const q2 = this.quantifierBindings[1]?.quantifier || "∃";
    const grid: boolean[][] = [];

    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const x1 = i + 1;
      for (let j = 0; j < N; j++) {
        const x2 = j + 1;
        const localPreds: { [code: string]: boolean } = {
          p: x1 > 5,
          q: x1 < 10,
          r: x1 > x2,
          s: x1 < x2,
          m: true
        };
        const cols = this.evaluateExpCols(this.pxe.exp, localPreds);
        const mainVal = cols.length > 0 ? cols[cols.length - 1].val : true;
        row.push(mainVal);
      }
      grid.push(row);
    }

    if (q1 === "∀" && q2 === "∀") return grid.every(r => r.every(Boolean));
    if (q1 === "∃" && q2 === "∃") return grid.some(r => r.some(Boolean));
    if (q1 === "∀" && q2 === "∃") return grid.every(r => r.some(Boolean));
    if (q1 === "∃" && q2 === "∀") return grid.some(r => r.every(Boolean));

    return grid.some(r => r.some(Boolean));
  }

  renderMatrixVisualizer(container: Elt, evalResult: boolean, colLabel: string) {
    const matrixBox = new Elt("div");
    matrixBox.setA("style", "margin-top: 15px; border: 1px solid #17a2b8; border-radius: 6px; padding: 14px; background: #fdfdfd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);");
    container.append(matrixBox);

    // Header title for Matrix Visualizer
    const titleBox = new Elt("div");
    titleBox.setA("style", "font-weight: bold; font-size: 14px; color: #0056b3; margin-bottom: 8px;");
    titleBox.setV(colLabel === "∈" ? "Power Set Incidence Matrix for Membership Predicate: ∈(x, y)" : `Boolean Matrix Structure on ℕ for Predicate: ${colLabel}`);
    matrixBox.append(titleBox);

    if (colLabel === "∈") {
      const mSlot = this.slots.find(s => s.predName === "∈" && s.slotIndex === 1);
      if (!mSlot || mSlot.assignedVar?.startsWith("y")) {
        // Power Set Incidence Matrix Display
        const numElem = 4;
        const numSubsets = 16;
        const cellSize = 22;
        const width = numSubsets * cellSize + 55;
        const height = numElem * cellSize + 40;

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
        const subsetLabels = [
          "∅", "{1}", "{2}", "{1,2}", "{3}", "{1,3}", "{2,3}", "{1..3}",
          "{4}", "{1,4}", "{2,4}", "{1..4}", "{3,4}", "{1,3,4}", "{2,3,4}", "ℕ₄"
        ];

        for (let j = 0; j < numSubsets; j++) {
          const colText = new SVGText();
          colText.setV(`Y${j}`);
          colText.setAA(["x", 52 + j * cellSize + 2, "y", 16, "font-size", "9", "fill", "#555"]);
          svg.append(colText);
        }

        // Grid Cells
        for (let i = 0; i < numElem; i++) {
          for (let j = 0; j < numSubsets; j++) {
            const isMember = (j & (1 << i)) !== 0;
            const rect = new SVGElt("rect");
            rect.setAA([
              "x", 50 + j * cellSize,
              "y", 24 + i * cellSize,
              "width", cellSize - 2,
              "height", cellSize - 2,
              "fill", isMember ? "#007bff" : "#e9ecef",
              "stroke", "#ced4da"
            ]);
            svg.append(rect);

            const cellText = new SVGText();
            cellText.setV(isMember ? "1" : "0");
            cellText.setAA([
              "x", 50 + j * cellSize + 6,
              "y", 24 + i * cellSize + 14,
              "font-size", "10",
              "fill", isMember ? "#ffffff" : "#6c757d",
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
          • Cell value <b>1 (Blue)</b> if element xᵢ ∈ subset Yⱼ; <b>0 (Grey)</b> if xᵢ ∉ Yⱼ.<br>
          • Predicate Evaluated Truth: <b style="color:${evalResult ? '#155724' : '#721c24'}; background:${evalResult ? '#d4edda' : '#f8d7da'}; padding:2px 6px; border-radius:3px;">${evalResult ? 'True (T)' : 'False (F)'}</b>
        `);
        svgWrap.append(info);

        matrixBox.append(svgWrap);
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
    const width = N * cellSize;
    const height = N * cellSize;

    const svgWrap = new Elt("div");
    svgWrap.setA("style", "display: flex; gap: 20px; align-items: flex-start; margin-top: 10px; flex-wrap: wrap;");

    const svg = new SVGElt("svg");
    svg.setAA(["width", width + 45, "height", height + 35, "style", "background: #ffffff; border: 1px solid #ccc; border-radius: 3px; display: block; flex-shrink: 0;"]);

    const labelX = new SVGText();
    labelX.setV("x₁ (row) →");
    labelX.setAA(["x", 5, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelX);

    const labelY = new SVGText();
    labelY.setV("x₂ (col) ↓");
    labelY.setAA(["x", width - 35, "y", 14, "font-size", "11", "fill", "#333", "font-weight", "bold"]);
    svg.append(labelY);

    const boundSlots = this.slots
      .filter((s) => s.predName === colLabel)
      .map((s) => s.assignedVar || (s.slotIndex === 0 ? "x₁" : "x₂"));

    for (let i = 0; i < N; i++) {
      const x1 = i + 1;
      for (let j = 0; j < N; j++) {
        const x2 = j + 1;
        const isTrue = PredicateRegistry.evaluateAt(colLabel, boundSlots, { "x₁": x1, "x₂": x2 });

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
      • Domain: <b>ℕ × ℕ</b> (1..${N})<br>
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
