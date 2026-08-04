import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent } from "./pxe.js";

export interface FSDPredicateSlot {
  predicate: string; // 'PG5' | 'PL10' | 'PG' | 'PL'
  slots: string[];   // ['x'] or ['x', 'y']
}

export class FSD extends PXEParent {
  editorFrame: SVGElt;
  controlsFrame: SVGElt;
  fo: SVGElt;
  foY: number;

  // Visual dimensions
  sideMargin = 12;
  controlsFrameHeight = 30;
  vertMargin = 8;

  // Title & instructions label
  statusLabel: SVGText;

  // Step 1 Controls (Predicate expression building)
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
  displayButton: SVGSelectableText;

  // Quantifier sequence state
  quantifierList: string[] = ["∀x", "∃y"]; // default prefix
  boundVars: Record<string, string[]> = {
    PG5: ["x"],
    PL10: ["x"],
    PG: ["x", "y"],
    PL: ["x", "y"],
  };

  // Dyadic grid resolution: 4, 8, 16, 32, 64, 128, 256
  gridResolution = 16;
  matrixVisible = false;
  selectedPredicate = "PG";

  pxe: PXE;

  constructor() {
    super();
    this.editorFrame = new SVGElt("rect");
    this.controlsFrame = new SVGElt("rect");
    this.fo = new SVGElt("foreignObject");
    this.pxe = new PXE(this);

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

    this.statusLabel = new SVGText();
    this.statusLabel.setV("Formal Statement Demo");
    this.statusLabel.setA("stroke", "darkslategray");
    this.controls.push(this.statusLabel);

    // Expression Builder buttons
    this.buttonPG5 = new SVGSelectableText(() => this.addPred("PG5"), "PG5", false);
    this.buttonPL10 = new SVGSelectableText(() => this.addPred("PL10"), "PL10", false);
    this.buttonPG = new SVGSelectableText(() => this.addPred("PG"), "PG", false);
    this.buttonPL = new SVGSelectableText(() => this.addPred("PL"), "PL", false);

    this.buttonNeg = new SVGSelectableText(() => this.pxe.addCharacter("n"), "¬", false);
    this.buttonAnd = new SVGSelectableText(() => this.pxe.addCharacter("a"), "∧", false);
    this.buttonOr = new SVGSelectableText(() => this.pxe.addCharacter("o"), "∨", false);
    this.buttonImply = new SVGSelectableText(() => this.pxe.addCharacter("i"), "→", false);
    this.buttonEquiv = new SVGSelectableText(() => this.pxe.addCharacter("e"), "↔", false);
    this.buttonLB = new SVGSelectableText(() => this.pxe.addCharacter("["), "[", false);
    this.buttonRB = new SVGSelectableText(() => this.pxe.addCharacter("]"), "]", false);
    this.buttonBackspace = new SVGSelectableText(() => this.pxe.backspace(), "⌫", false);

    this.displayButton = new SVGSelectableText(() => this.displayTable(), "Evaluate Statement", false);

    this.controls.push(this.buttonPG5);
    this.controls.push(this.buttonPL10);
    this.controls.push(this.buttonPG);
    this.controls.push(this.buttonPL);
    this.controls.push(this.buttonNeg);
    this.controls.push(this.buttonAnd);
    this.controls.push(this.buttonOr);
    this.controls.push(this.buttonImply);
    this.controls.push(this.buttonEquiv);
    this.controls.push(this.buttonLB);
    this.controls.push(this.buttonRB);
    this.controls.push(this.buttonBackspace);
    this.controls.push(this.displayButton);
  }

  addPred(pred: string) {
    // Map predicate name into PXE internal symbol (e.g. p, q, r, s)
    if (pred === "PG5") this.pxe.addCharacter("p");
    else if (pred === "PL10") this.pxe.addCharacter("q");
    else if (pred === "PG") this.pxe.addCharacter("r");
    else if (pred === "PL") this.pxe.addCharacter("s");
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

  showControls() {
    const y = 2 * this.vertMargin + PXE.textFrameHeight + (2 / 3) * this.controlsFrameHeight;
    let x = this.sideMargin + 5;
    this.controls.forEach((e) => {
      this.append(e);
      e.setAA(["x", x, "y", y]);
      x = x + e.getBB().width + 8;
    });
  }

  setButtonStates() {
    this.displayButton.setAble(this.pxe.displayState === "Valid");
  }

  clear() {
    this.fo.removeChildren();
    this.fo.setV("");
  }

  // 3-Step Setup & Table Display
  displayTable() {
    this.fo.removeChildren();
    this.fo.setV("");

    const container = new Elt("div");
    container.setA("style", "font-family: sans-serif; padding: 10px;");
    this.fo.append(container);

    // Section 1: Statement Configuration (Step 2 & 3 Controls)
    const configCard = new Elt("div");
    configCard.setA("style", "background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 12px; margin-bottom: 16px;");
    container.append(configCard);

    const title = new Elt("h4", "cfgTitle");
    title.setV("Formal Statement Configuration");
    title.setA("style", "margin: 0 0 10px 0; color: #2b3a42;");
    configCard.append(title);

    // Step 2 UI: Slot Binding controls
    const step2Box = new Elt("div");
    step2Box.setA("style", "margin-bottom: 10px; font-size: 14px;");
    step2Box.setV("<b>Step 2 - Variable Slot Bindings:</b> PG(x,y) where x, y ∈ ℂ<sub>ω</sub> [0,1]");
    configCard.append(step2Box);

    // Step 3 UI: Quantifier Sequence Picker
    const step3Box = new Elt("div");
    step3Box.setA("style", "display: flex; align-items: center; gap: 12px; font-size: 14px;");
    const qLabel = new Elt("span");
    qLabel.setV("<b>Step 3 - Quantifier Order:</b> ");
    step3Box.append(qLabel);

    const qOptions = ["∀x ∃y", "∃y ∀x", "∀x ∀y", "∃x ∃y"];
    qOptions.forEach(opt => {
      const btn = new Elt("button");
      btn.setV(opt);
      const isSel = this.quantifierList.join(" ") === opt;
      btn.setA("style", `padding: 4px 10px; border-radius: 4px; cursor: pointer; border: 1px solid #0056b3; background: ${isSel ? '#0056b3' : '#ffffff'}; color: ${isSel ? '#ffffff' : '#0056b3'}; font-weight: bold;`);
      btn.elt.addEventListener("click", () => {
        this.quantifierList = opt.split(" ");
        this.displayTable();
      });
      step3Box.append(btn);
    });
    configCard.append(step3Box);

    // Section 2: Summary Row (Truth Table Display)
    const evalResult = this.evaluateQuantifiedStatement();

    const summaryCard = new Elt("div");
    summaryCard.setA("style", "border: 2px solid #2b3a42; border-radius: 6px; padding: 12px; background: #ffffff; margin-bottom: 16px;");
    container.append(summaryCard);

    const sumTitle = new Elt("div");
    sumTitle.setV("<b>Quantified Predicate Truth Row</b> <i>(Click predicate cell to inspect Boolean Matrix Grid)</i>");
    sumTitle.setA("style", "font-size: 13px; color: #555; margin-bottom: 8px;");
    summaryCard.append(sumTitle);

    const table = new Elt("table");
    table.setA("style", "border-collapse: collapse; width: 100%; text-align: center; font-size: 16px;");
    summaryCard.append(table);

    const thead = new Elt("thead");
    const trHead = new Elt("tr");
    trHead.setA("style", "background: #e9ecef;");

    const thStmt = new Elt("th");
    thStmt.setV("Quantified Statement");
    thStmt.setA("style", "border: 1px solid #ced4da; padding: 8px;");
    trHead.append(thStmt);

    const thPred = new Elt("th");
    thPred.setV("Predicate (Click to Inspect)");
    thPred.setA("style", "border: 1px solid #ced4da; padding: 8px; cursor: pointer; color: firebrick; font-weight: bold;");
    trHead.append(thPred);

    const thValue = new Elt("th");
    thValue.setV("Overall Truth Value");
    thValue.setA("style", "border: 1px solid #ced4da; padding: 8px;");
    trHead.append(thValue);

    thead.append(trHead);
    table.append(thead);

    const tbody = new Elt("tbody");
    const trBody = new Elt("tr");

    const tdStmt = new Elt("td");
    tdStmt.setV(`${this.quantifierList.join(" ")} [ PG(x, y) ]`);
    tdStmt.setA("style", "border: 1px solid #ced4da; padding: 10px; font-weight: bold;");
    trBody.append(tdStmt);

    const tdPred = new Elt("td");
    tdPred.setV("PG(x, y)  🔍");
    tdPred.setA("style", `border: 1px solid #ced4da; padding: 10px; cursor: pointer; background-color: ${this.matrixVisible ? '#d1ecf1' : '#f8f9fa'}; color: firebrick; font-weight: bold;`);
    tdPred.elt.addEventListener("click", () => {
      this.matrixVisible = !this.matrixVisible;
      this.displayTable();
    });
    trBody.append(tdPred);

    const tdVal = new Elt("td");
    tdVal.setV(evalResult ? "T" : "F");
    tdVal.setA("style", `border: 1px solid #ced4da; padding: 10px; font-weight: bold; font-size: 18px; color: ${evalResult ? 'green' : 'red'}; background: ${evalResult ? '#d4edda' : '#f8d7da'};`);
    trBody.append(tdVal);

    tbody.append(trBody);
    table.append(tbody);

    // Section 3: Interactive Boolean Matrix Visualizer
    if (this.matrixVisible) {
      this.renderBooleanMatrix(container, evalResult);
    }
  }

  evaluateQuantifiedStatement(): boolean {
    const N = this.gridResolution;
    const qSeq = this.quantifierList.join(" ");

    // Evaluate PG(x,y): x > y on dyadic grid points x_i = i/N, y_j = j/N for i,j in 1..N
    const grid: boolean[][] = [];
    for (let i = 0; i < N; i++) {
      const row: boolean[] = [];
      const xVal = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const yVal = (j + 1) / N;
        row.push(xVal > yVal); // PG(x,y)
      }
      grid.push(row);
    }

    if (qSeq === "∀x ∃y") {
      // For every row i, is there at least one column j where grid[i][j] is True?
      return grid.every(row => row.some(val => val));
    } else if (qSeq === "∃y ∀x") {
      // Is there at least one column j such that for all rows i, grid[i][j] is True?
      for (let j = 0; j < N; j++) {
        let allTrueInCol = true;
        for (let i = 0; i < N; i++) {
          if (!grid[i][j]) {
            allTrueInCol = false;
            break;
          }
        }
        if (allTrueInCol) return true;
      }
      return false;
    } else if (qSeq === "∀x ∀y") {
      return grid.every(row => row.every(val => val));
    } else if (qSeq === "∃x ∃y") {
      return grid.some(row => row.some(val => val));
    }
    return false;
  }

  renderBooleanMatrix(container: Elt, evalResult: boolean) {
    const card = new Elt("div");
    card.setA("style", "border: 1px solid #17a2b8; border-radius: 6px; padding: 16px; background: #f0f4f8; margin-top: 10px;");
    container.append(card);

    const mTitle = new Elt("h4");
    mTitle.setV(`Boolean Matrix Grid Inspection for PG(x, y) — Domain ℂ<sub>ω</sub> × ℂ<sub>ω</sub>`);
    mTitle.setA("style", "margin: 0 0 8px 0; color: #17a2b8;");
    card.append(mTitle);

    // Dyadic resolution slider
    const resBox = new Elt("div");
    resBox.setA("style", "display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px;");
    resBox.setV(`<b>Dyadic Grid Resolution (1/2<sup>k</sup>):</b> Step size 1/${this.gridResolution} (${this.gridResolution} × ${this.gridResolution} grid) `);

    const resolutions = [4, 8, 16, 32, 64, 128];
    resolutions.forEach(r => {
      const btn = new Elt("button");
      btn.setV(`${r}×${r}`);
      const isSel = this.gridResolution === r;
      btn.setA("style", `padding: 3px 8px; font-size: 12px; border-radius: 3px; cursor: pointer; border: 1px solid #17a2b8; background: ${isSel ? '#17a2b8' : '#ffffff'}; color: ${isSel ? '#ffffff' : '#17a2b8'};`);
      btn.elt.addEventListener("click", () => {
        this.gridResolution = r;
        this.displayTable();
      });
      resBox.append(btn);
    });
    card.append(resBox);

    const explain = new Elt("p");
    explain.setA("style", "font-size: 13px; color: #495057; margin: 0 0 12px 0;");
    explain.setV(`<b>Quantifier Scan Explanation (${this.quantifierList.join(" ")}):</b> Blue cells indicate <code>PG(x,y) = True</code> (where x > y). ` +
      (this.quantifierList.join(" ") === "∀x ∃y" 
        ? "For <b>∀x ∃y</b>, we scan row-by-row (x). Each row must contain at least 1 blue cell. Result is <b>True</b>."
        : "For <b>∃y ∀x</b>, we scan column-by-column (y). At least 1 column must be <i>entirely blue</i> from top to bottom. No such column exists. Result is <b>False</b>!"));
    card.append(explain);

    // Render Canvas / SVG Grid
    const N = Math.min(this.gridResolution, 64); // render up to 64x64 cleanly on screen
    const cellSize = Math.max(4, Math.floor(320 / N));
    const width = N * cellSize;
    const height = N * cellSize;

    const svgWrap = new Elt("div");
    svgWrap.setA("style", "display: flex; gap: 20px; align-items: flex-start;");

    const svg = new SVGElt("svg");
    svg.setAA(["width", width + 40, "height", height + 40, "style", "background: #ffffff; border: 1px solid #ccc; border-radius: 4px;"]);

    // Axis Labels
    const labelX = new SVGText();
    labelX.setV("x (row) →");
    labelX.setAA(["x", 5, "y", 15, "font-size", "12", "fill", "#555"]);
    svg.append(labelX);

    const labelY = new SVGText();
    labelY.setV("y (col) ↓");
    labelY.setAA(["x", width - 40, "y", 15, "font-size", "12", "fill", "#555"]);
    svg.append(labelY);

    for (let i = 0; i < N; i++) {
      const xVal = (i + 1) / N;
      for (let j = 0; j < N; j++) {
        const yVal = (j + 1) / N;
        const isTrue = xVal > yVal;

        const rect = new SVGElt("rect");
        rect.setAA([
          "x", 30 + j * cellSize,
          "y", 25 + i * cellSize,
          "width", cellSize - (N > 32 ? 0 : 1),
          "height", cellSize - (N > 32 ? 0 : 1),
          "fill", isTrue ? "#007bff" : "#e9ecef",
          "stroke", N <= 16 ? "#ced4da" : "none"
        ]);
        svg.append(rect);
      }
    }

    svgWrap.append(svg);

    // Legend & Info
    const legend = new Elt("div");
    legend.setA("style", "font-size: 13px; line-height: 1.6;");
    legend.setV(`
      <b>Grid Properties:</b><br>
      • Domain: ℂ<sub>ω</sub> × ℂ<sub>ω</sub> [0,1] × [0,1]<br>
      • Resolution: ${N} × ${N} dyadic cells<br>
      • Blue Cell: <code>x > y (True)</code><br>
      • Grey Cell: <code>x ≤ y (False)</code><br>
      • Statement Truth Value: <b style="color: ${evalResult ? 'green' : 'red'};">${evalResult ? 'True' : 'False'}</b>
    `);
    svgWrap.append(legend);

    card.append(svgWrap);
  }
}

export let fsd: FSD;

export function setFSD() {
  fsd = new FSD();
}
