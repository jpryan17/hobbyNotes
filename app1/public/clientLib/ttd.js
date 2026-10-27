// development of Truth Table Demo
import { Elt } from "./elt.js";
import { Nav } from "./navFW.js";
import { SVGElt, SVGSelectableText, SVGText } from "./svgElt.js";
import { PXE, PXEParent } from "./pxe.js";
//
export class TTD extends PXEParent {
    editorFrame;
    pxe;
    fo;
    foY;
    //
    fontPadding = 3;
    colWidth = 10;
    maxColWidth = 100;
    controlsFrame;
    displayButton;
    refButton;
    proofButton;
    editorButton;
    deleteButton;
    // Input label
    inputLabel;
    // Symbol input buttons
    buttonP;
    buttonQ;
    buttonR;
    buttonS;
    buttonNeg;
    buttonAnd;
    buttonOr;
    buttonImply;
    buttonEquiv;
    buttonLB;
    buttonRB;
    buttonBackspace;
    //
    usedByProofBuilderDemo;
    usedByContentEditor;
    isEditingExistingTag = false;
    cancelButton;
    //
    initColHighlightPos = -1;
    tree;
    predCols = [];
    expCols = [];
    // Modern DOM overlay elements
    modernContainer;
    modernScaleWrapper;
    modernInput;
    modernTableMount;
    modernContentEditorBar;
    modernProofBuilderBar;
    modernMounted = false;
    applyScale() {
        if (!this.modernContainer || !this.modernScaleWrapper)
            return;
        let availW = this.modernContainer.clientWidth;
        if (!availW || availW < 100) {
            if (typeof Nav !== "undefined" && Nav.foWidth) {
                availW = Nav.foWidth;
            }
            else if (typeof window !== "undefined") {
                availW = window.innerWidth - (typeof Nav !== "undefined" && Nav.isIndexVisible ? 260 : 30);
            }
        }
        // Net available width accounting for padding (20px each side = 40px)
        const netAvailW = Math.max(280, availW - 40);
        const tableEl = this.modernTableMount ? this.modernTableMount.querySelector("table") : null;
        const tableWidth = tableEl ? Math.max(tableEl.offsetWidth, tableEl.scrollWidth) : 0;
        const targetWidth = Math.max(840, tableWidth);
        // Take the UI as a whole and shrink it when necessary (< 1.0)
        const scale = netAvailW < targetWidth ? Math.max(0.45, netAvailW / targetWidth) : 1;
        // Apply zoom (with transform fallback)
        const wrapperStyle = this.modernScaleWrapper.style;
        if ("zoom" in wrapperStyle) {
            wrapperStyle.zoom = String(scale);
            wrapperStyle.width = `${targetWidth}px`;
        }
        else {
            wrapperStyle.transform = `scale(${scale})`;
            wrapperStyle.transformOrigin = "top left";
            wrapperStyle.width = `${targetWidth}px`;
            const scaledHeight = Math.ceil(this.modernScaleWrapper.offsetHeight * scale);
            this.modernContainer.style.minHeight = `${scaledHeight + 40}px`;
        }
    }
    handleResize() {
        const fow = typeof Nav !== "undefined" && Nav.foWidth ? Nav.foWidth : (window.innerWidth - (typeof Nav !== "undefined" && Nav.isIndexVisible ? 260 : 30));
        const foh = typeof Nav !== "undefined" && Nav.foHeight ? Nav.foHeight : (window.innerHeight - 80);
        this.setAA(["width", fow, "height", foh]);
        this.fo.setAA(["width", fow, "height", foh]);
        this.applyScale();
    }
    //
    constructor() {
        super();
        this.sideMargin = 12;
        this.controlsFrameHeight = 30;
        this.vertMargin = 8;
        this.editorFrame = new SVGElt("rect");
        this.controlsFrame = new SVGElt("rect");
        this.fo = new SVGElt("foreignObject");
        this.pxe = new PXE(this);
        this.append(this.editorFrame);
        this.append(this.pxe);
        this.append(this.controlsFrame);
        this.append(this.fo);
        this.editorFrame.setAA([
            "x",
            0,
            "y",
            0,
            "borderWidth",
            2,
            "stroke",
            "darkblue",
            "fill",
            "lightgrey",
        ]);
        const x = this.sideMargin;
        const y = this.vertMargin;
        const cfY = 2 * this.vertMargin + PXE.textFrameHeight;
        const cfH = this.controlsFrameHeight;
        this.controlsFrame.setAA([
            "x",
            x,
            "y",
            cfY,
            "height",
            cfH,
            "fill",
            "azure",
        ]);
        const pxH = 3 * this.vertMargin + PXE.textFrameHeight + this.controlsFrameHeight;
        this.pxe.setAA(["x", x, "y", y, "height", pxH]);
        this.foY = pxH + this.vertMargin;
        this.fo.setAA([
            "x",
            x,
            "y",
            this.foY,
            "style",
            "background-color:white;padding:15;overflow:auto",
        ]);
        //
        this.displayButton = new SVGSelectableText(displayTable, "display table", false);
        this.proofButton = this.setProofButton();
        this.editorButton = this.setEditorButton();
        this.cancelButton = this.setCancelButton();
        this.deleteButton = this.setDeleteButton();
        this.controls.push(this.displayButton);
        this.controls.push(this.proofButton);
        this.controls.push(this.editorButton);
        this.controls.push(this.cancelButton);
        this.controls.push(this.deleteButton);
        // Initialize input label
        this.inputLabel = new SVGText();
        this.inputLabel.setV("Input: ");
        this.inputLabel.setA("stroke", "darkslategray");
        this.controls.push(this.inputLabel);
        // Initialize symbol input buttons
        this.buttonP = new SVGSelectableText(addCharP, "p", false);
        this.buttonQ = new SVGSelectableText(addCharQ, "q", false);
        this.buttonR = new SVGSelectableText(addCharR, "r", false);
        this.buttonS = new SVGSelectableText(addCharS, "s", false);
        this.buttonNeg = new SVGSelectableText(addCharNeg, "¬", false);
        this.buttonAnd = new SVGSelectableText(addCharAnd, "∧", false);
        this.buttonOr = new SVGSelectableText(addCharOr, "∨", false);
        this.buttonImply = new SVGSelectableText(addCharImply, "→", false);
        this.buttonEquiv = new SVGSelectableText(addCharEquiv, "↔", false);
        this.buttonLB = new SVGSelectableText(addCharLB, "[", false);
        this.buttonRB = new SVGSelectableText(addCharRB, "]", false);
        this.buttonBackspace = new SVGSelectableText(addCharBackspace, "⌫", false);
        // Add symbol buttons to controls
        this.controls.push(this.buttonP);
        this.controls.push(this.buttonQ);
        this.controls.push(this.buttonR);
        this.controls.push(this.buttonS);
        this.controls.push(this.buttonNeg);
        this.controls.push(this.buttonAnd);
        this.controls.push(this.buttonOr);
        this.controls.push(this.buttonImply);
        this.controls.push(this.buttonEquiv);
        this.controls.push(this.buttonLB);
        this.controls.push(this.buttonRB);
        this.controls.push(this.buttonBackspace);
        if (Nav.editMode)
            this.setRefTool();
        this.buildModernUI();
        if (typeof window !== "undefined") {
            window.addEventListener("resize", () => this.handleResize());
            window.addEventListener("nav-display-resize", () => this.handleResize());
        }
    }
    buildModernUI() {
        this.modernContainer = document.createElement("div");
        this.modernContainer.className = "ttd-modern-container";
        this.modernContainer.style.cssText = "box-sizing: border-box; width: 100%; min-height: 100%; padding: 18px 20px 80px 20px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #1e293b; overflow-x: hidden; overflow-y: auto;";
        this.modernScaleWrapper = document.createElement("div");
        this.modernScaleWrapper.className = "ttd-scale-wrapper";
        this.modernScaleWrapper.style.cssText = "box-sizing: border-box; width: 840px; transform-origin: top left;";
        this.modernContainer.appendChild(this.modernScaleWrapper);
        // 1. Header with title
        const headerRow = document.createElement("div");
        headerRow.style.cssText = "margin-bottom: 16px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px;";
        const titleGroup = document.createElement("div");
        titleGroup.innerHTML = `
      <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #0f172a;">📐 Truth Table Demo (TTD)</h3>
      <div style="font-size: 13px; color: #64748b;">Propositional Logic, Deductive Certainty &amp; Formula Evaluation</div>
    `;
        headerRow.appendChild(titleGroup);
        this.modernScaleWrapper.appendChild(headerRow);
        // 2. Formula Input Box
        const inputCard = document.createElement("div");
        inputCard.style.cssText = "background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px;";
        const inputHeader = document.createElement("div");
        inputHeader.style.cssText = "font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between;";
        inputHeader.innerHTML = `
      <span>Propositional Formula</span>
      <span style="font-size: 11px; font-weight: 400; color: #94a3b8;">(Click buttons below or type directly on keyboard)</span>
    `;
        inputCard.appendChild(inputHeader);
        const inputFlex = document.createElement("div");
        inputFlex.style.cssText = "display: flex; align-items: center; gap: 10px;";
        this.modernInput = document.createElement("input");
        this.modernInput.type = "text";
        this.modernInput.id = "ttd-formula-input";
        this.modernInput.placeholder = "e.g. [p ∧ q] → r";
        this.modernInput.style.cssText = "flex: 1; font-family: monospace; font-size: 17px; font-weight: 700; color: #0f172a; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; outline: none; transition: border-color 0.15s, box-shadow 0.15s;";
        this.modernInput.addEventListener("focus", () => {
            this.modernInput.style.borderColor = "#0284c7";
            this.modernInput.style.boxShadow = "0 0 0 3px rgba(2, 132, 199, 0.15)";
        });
        this.modernInput.addEventListener("blur", () => {
            this.modernInput.style.borderColor = "#cbd5e1";
            this.modernInput.style.boxShadow = "none";
        });
        // Smart keyboard handling
        this.modernInput.addEventListener("keydown", (e) => {
            const k = e.key;
            if (k === "Enter") {
                e.preventDefault();
                this.displayTable();
                return;
            }
            if (k === "Backspace") {
                e.preventDefault();
                this.pxe.backspace();
                this.syncModernUI();
                return;
            }
            if (k === "Delete" || k === "Escape") {
                e.preventDefault();
                this.clear();
                return;
            }
            // Variable shortcuts
            if (["p", "q", "r", "s"].includes(k.toLowerCase())) {
                e.preventDefault();
                this.pxe.addCharacter(k.toLowerCase());
                this.syncModernUI();
                return;
            }
            // Connective shortcuts
            if (k === "&" || k === "^") {
                e.preventDefault();
                this.pxe.addCharacter("a");
                this.syncModernUI();
                return;
            }
            if (k === "|" || k === "v") {
                e.preventDefault();
                this.pxe.addCharacter("o");
                this.syncModernUI();
                return;
            }
            if (k === "!" || k === "~") {
                e.preventDefault();
                this.pxe.addCharacter("n");
                this.syncModernUI();
                return;
            }
            if (k === ">" || k === "i") {
                e.preventDefault();
                this.pxe.addCharacter("i");
                this.syncModernUI();
                return;
            }
            if (k === "=" || k === "e") {
                e.preventDefault();
                this.pxe.addCharacter("e");
                this.syncModernUI();
                return;
            }
            if (k === "[" || k === "(") {
                e.preventDefault();
                this.pxe.addCharacter("[");
                this.syncModernUI();
                return;
            }
            if (k === "]" || k === ")") {
                e.preventDefault();
                this.pxe.addCharacter("]");
                this.syncModernUI();
                return;
            }
        });
        const evalBtn = document.createElement("button");
        evalBtn.textContent = "Generate Truth Table →";
        evalBtn.style.cssText = "padding: 8px 18px; background: #0284c7; color: #ffffff; font-weight: 700; font-size: 13px; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; white-space: nowrap;";
        evalBtn.addEventListener("mouseover", () => {
            evalBtn.style.background = "#0369a1";
        });
        evalBtn.addEventListener("mouseout", () => {
            evalBtn.style.background = "#0284c7";
        });
        evalBtn.addEventListener("click", () => {
            this.displayTable();
        });
        inputFlex.appendChild(this.modernInput);
        inputFlex.appendChild(evalBtn);
        inputCard.appendChild(inputFlex);
        this.modernScaleWrapper.appendChild(inputCard);
        // 3. Modern Chip Toolbar
        const toolbar = document.createElement("div");
        toolbar.style.cssText = "display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 20px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;";
        const makeChip = (label, onClick, bg, textCol, borderCol, title) => {
            const btn = document.createElement("button");
            btn.textContent = label;
            if (title)
                btn.title = title;
            btn.style.cssText = `display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 10px; font-family: monospace; font-size: 14px; font-weight: 700; background: ${bg}; color: ${textCol}; border: 1px solid ${borderCol}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; user-select: none;`;
            btn.addEventListener("mouseover", () => {
                btn.style.filter = "brightness(0.92)";
                btn.style.transform = "translateY(-1px)";
            });
            btn.addEventListener("mouseout", () => {
                btn.style.filter = "none";
                btn.style.transform = "none";
            });
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                onClick();
                this.syncModernUI();
            });
            return btn;
        };
        const varLabel = document.createElement("span");
        varLabel.textContent = "Atoms:";
        varLabel.style.cssText = "font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-right: 2px;";
        toolbar.appendChild(varLabel);
        ["p", "q", "r", "s"].forEach((c) => {
            toolbar.appendChild(makeChip(c, () => this.pxe.addCharacter(c), "#e0e7ff", "#3730a3", "#c7d2fe", `Propositional atom ${c}`));
        });
        const sep1 = document.createElement("div");
        sep1.style.cssText = "width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;";
        toolbar.appendChild(sep1);
        const opLabel = document.createElement("span");
        opLabel.textContent = "Connectives:";
        opLabel.style.cssText = "font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-right: 2px;";
        toolbar.appendChild(opLabel);
        const ops = [
            ["¬", "n", "Negation (NOT)"],
            ["∧", "a", "Conjunction (AND)"],
            ["∨", "o", "Disjunction (OR)"],
            ["→", "i", "Implication (IF-THEN)"],
            ["↔", "e", "Equivalence (IFF)"],
        ];
        ops.forEach(([sym, code, desc]) => {
            toolbar.appendChild(makeChip(sym, () => this.pxe.addCharacter(code), "#ffffff", "#1e293b", "#cbd5e1", desc));
        });
        const sep2 = document.createElement("div");
        sep2.style.cssText = "width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;";
        toolbar.appendChild(sep2);
        toolbar.appendChild(makeChip("[", () => this.pxe.addCharacter("["), "#ffffff", "#475569", "#cbd5e1", "Left bracket"));
        toolbar.appendChild(makeChip("]", () => this.pxe.addCharacter("]"), "#ffffff", "#475569", "#cbd5e1", "Right bracket"));
        toolbar.appendChild(makeChip("⌫", () => this.pxe.backspace(), "#fee2e2", "#991b1b", "#fca5a5", "Backspace"));
        toolbar.appendChild(makeChip("Clear", () => this.clear(), "#f1f5f9", "#64748b", "#cbd5e1", "Clear expression"));
        // Content Editor bar (hidden by default)
        this.modernContentEditorBar = document.createElement("div");
        this.modernContentEditorBar.style.cssText = "display: none; margin-left: auto; gap: 8px; align-items: center;";
        const saveContentBtn = document.createElement("button");
        saveContentBtn.textContent = "Return to Content Editor ✓";
        saveContentBtn.style.cssText = "padding: 6px 12px; font-size: 12px; font-weight: 700; background: #16a34a; color: white; border: none; border-radius: 5px; cursor: pointer;";
        saveContentBtn.addEventListener("click", () => this.backToContentEditor());
        const cancelContentBtn = document.createElement("button");
        cancelContentBtn.textContent = "Cancel";
        cancelContentBtn.style.cssText = "padding: 6px 10px; font-size: 12px; font-weight: 600; background: #64748b; color: white; border: none; border-radius: 5px; cursor: pointer;";
        cancelContentBtn.addEventListener("click", () => this.cancelAndReturn());
        const deleteContentBtn = document.createElement("button");
        deleteContentBtn.id = "ttd-modern-delete-btn";
        deleteContentBtn.textContent = "Delete Tag";
        deleteContentBtn.style.cssText = "display: none; padding: 6px 10px; font-size: 12px; font-weight: 600; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;";
        deleteContentBtn.addEventListener("click", () => this.deleteTagAndReturn());
        this.modernContentEditorBar.appendChild(saveContentBtn);
        this.modernContentEditorBar.appendChild(cancelContentBtn);
        this.modernContentEditorBar.appendChild(deleteContentBtn);
        toolbar.appendChild(this.modernContentEditorBar);
        // Proof Builder bar (hidden by default)
        this.modernProofBuilderBar = document.createElement("div");
        this.modernProofBuilderBar.style.cssText = "display: none; margin-left: auto; align-items: center;";
        const returnProofBtn = document.createElement("button");
        returnProofBtn.textContent = "Back to Proof Builder →";
        returnProofBtn.style.cssText = "padding: 6px 12px; font-size: 12px; font-weight: 700; background: #d97706; color: white; border: none; border-radius: 5px; cursor: pointer;";
        returnProofBtn.addEventListener("click", () => this.backToProof());
        this.modernProofBuilderBar.appendChild(returnProofBtn);
        toolbar.appendChild(this.modernProofBuilderBar);
        this.modernScaleWrapper.appendChild(toolbar);
        // 4. Table Mount Area
        this.modernTableMount = document.createElement("div");
        this.modernTableMount.id = "ttd-table-mount";
        this.modernTableMount.style.cssText = "margin-top: 10px;";
        this.modernScaleWrapper.appendChild(this.modernTableMount);
        if (this.fo && this.fo.elt) {
            this.fo.elt.innerHTML = "";
            this.fo.elt.appendChild(this.modernContainer);
            this.modernMounted = true;
        }
        this.applyScale();
    }
    loadFormula(rawExp) {
        this.pxe.exp = rawExp;
        this.pxe.nl = 0;
        for (const ch of rawExp) {
            if (ch === "[")
                this.pxe.nl++;
            if (ch === "]")
                this.pxe.nl--;
        }
        this.pxe.displayText();
        this.syncModernUI();
        this.displayTable();
    }
    syncModernUI() {
        if (!this.modernInput)
            return;
        this.modernInput.value = this.pxe.fmt();
        if (this.usedByContentEditor) {
            this.modernContentEditorBar.style.display = "flex";
            const delBtn = this.modernContentEditorBar.querySelector("#ttd-modern-delete-btn");
            if (delBtn)
                delBtn.style.display = this.isEditingExistingTag ? "inline-block" : "none";
        }
        else {
            this.modernContentEditorBar.style.display = "none";
        }
        if (this.usedByProofBuilderDemo) {
            this.modernProofBuilderBar.style.display = "flex";
        }
        else {
            this.modernProofBuilderBar.style.display = "none";
        }
    }
    setRefTool() {
        console.log("in set ref tool");
        this.refButton = new SVGSelectableText(bldRef, "build reference", false);
        this.controls.push(this.refButton);
    }
    async bldRef() {
        const text = `<ttd-ref exp="${this.pxe.exp}" 
            style="color:firebrick;font-weight:bold">${this.pxe.fmt()}</ttd-ref>`;
        try {
            await navigator.clipboard.writeText(text);
            if (this.refButton) {
                const rb = this.refButton;
                rb.setA("stroke", "orange");
            }
        }
        catch (err) {
            console.error("Failed to copy: ", err);
        }
    }
    layoutEditor() {
        const fow = typeof Nav !== "undefined" && Nav.foWidth ? Nav.foWidth : (window.innerWidth - 250);
        const foh = typeof Nav !== "undefined" && Nav.foHeight ? Nav.foHeight : (window.innerHeight - 80);
        this.setAA(["width", fow, "height", foh, "style", "display:block;"]);
        this.editorFrame.setAA(["width", fow, "height", foh, "display", "none"]);
        this.controlsFrame.setAA(["display", "none"]);
        this.pxe.setAA(["display", "none"]);
        this.fo.setAA([
            "x", 0,
            "y", 0,
            "width", fow,
            "height", foh,
            "style", "overflow-y: auto; overflow-x: hidden; background: #ffffff; box-sizing: border-box; display: block;"
        ]);
        if (!this.modernContainer) {
            this.buildModernUI();
        }
        if (this.fo && this.fo.elt && this.modernContainer) {
            if (!this.fo.elt.contains(this.modernContainer)) {
                this.fo.elt.innerHTML = "";
                this.fo.elt.appendChild(this.modernContainer);
            }
            this.modernMounted = true;
        }
        const padX = Math.round(Math.max(16, Math.min(48, fow * 0.035)));
        const padY = Math.round(Math.max(12, Math.min(28, foh * 0.025)));
        if (this.modernContainer) {
            this.modernContainer.style.padding = `${padY}px ${padX}px 80px ${padX}px`;
        }
        this.showControls();
        if (!this.pxe.exp || this.pxe.exp.length === 0) {
            this.loadFormula("[paq]ip");
        }
        else {
            this.syncModernUI();
            this.displayTable();
        }
        this.setColWidth();
        this.applyScale();
    }
    showControls() {
        // Hide legacy SVG buttons
        this.controls.forEach((e) => {
            e.setAA(["display", "none", "visibility", "hidden", "pointer-events", "none"]);
        });
    }
    setColWidth() {
        this.colWidth = 90;
    }
    setProofBuilder(pb) {
        this.usedByProofBuilderDemo = pb;
    }
    setProofButton() {
        const proofButton = new SVGText();
        proofButton.setV("return to proof builder");
        proofButton.setAA([
            "stroke",
            "orange",
            "visibility",
            "hidden",
            "pointer-events",
            "none",
        ]);
        proofButton.elt.addEventListener("mouseover", () => {
            proofButton.setA("stroke", "purple");
        });
        proofButton.elt.addEventListener("mouseout", () => {
            const color = this.pxe.displayState == "Valid" ? "green" : "orange";
            this.proofButton.setA("stroke", color);
        });
        proofButton.elt.addEventListener("click", () => {
            this.backToProof();
        });
        return proofButton;
    }
    backToProof() {
        if (this.usedByProofBuilderDemo) {
            Nav.fo.removeChildren();
            const pb = this.usedByProofBuilderDemo;
            Nav.fo.append(pb);
            pb.peReturn(this.pxe.displayState == "Valid", this.pxe.exp, this.pxe.fmt());
            this.usedByProofBuilderDemo = undefined;
        }
    }
    setContentEditorCallback(cb, isEditingExisting = false) {
        this.usedByContentEditor = cb;
        this.isEditingExistingTag = isEditingExisting;
    }
    setEditorButton() {
        const editorButton = new SVGText();
        editorButton.setV("return to content editor");
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
            const color = this.pxe.displayState == "Valid" ? "forestgreen" : "orange";
            this.editorButton.setA("stroke", color);
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
            cb("", "", false, "cancel");
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
            cb("", "", false, "delete");
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
            const isValid = this.pxe.displayState === "Valid";
            cb(this.pxe.exp, this.pxe.fmt(), isValid, "save");
        }
    }
    setButtonStates() {
        this.syncModernUI();
        const clearState = this.pxe.exp.length > 0 || (this.expCols && this.expCols.length > 0);
        const clearButton = this.controls[0];
        if (clearButton && clearButton.setAble) {
            clearButton.setAble(clearState);
        }
        this.displayButton.setAble(this.pxe.displayState == "Valid");
        // Enable/disable symbol buttons based on expression state
        const expectClass = this.pxe.setExpectClass();
        // Front buttons: predicates, left bracket, negation
        const frontBtnsEnabled = expectClass == "front";
        this.buttonP.setAble(frontBtnsEnabled);
        this.buttonQ.setAble(frontBtnsEnabled);
        this.buttonR.setAble(frontBtnsEnabled);
        this.buttonS.setAble(frontBtnsEnabled);
        this.buttonNeg.setAble(frontBtnsEnabled);
        this.buttonLB.setAble(frontBtnsEnabled);
        // Back buttons: binary operators, right bracket
        const backBtnsEnabled = expectClass == "back";
        this.buttonAnd.setAble(backBtnsEnabled);
        this.buttonOr.setAble(backBtnsEnabled);
        this.buttonImply.setAble(backBtnsEnabled);
        this.buttonEquiv.setAble(backBtnsEnabled);
        this.buttonRB.setAble(backBtnsEnabled && this.pxe.nl > 0);
        // Backspace always enabled if there's content
        this.buttonBackspace.setAble(this.pxe.exp.length > 0);
        if (this.usedByProofBuilderDemo) {
            const color = this.pxe.displayState == "Valid" ? "green" : "orange";
            this.proofButton.setA("stroke", color);
        }
        if (this.usedByContentEditor) {
            const color = this.pxe.displayState == "Valid" ? "forestgreen" : "orange";
            this.editorButton.setA("stroke", color);
            this.cancelButton.setAA([
                "pointer-events",
                "auto",
                "visibility",
                "visible",
                "stroke",
                "#64748b",
            ]);
            if (this.isEditingExistingTag) {
                this.deleteButton.setAA([
                    "pointer-events",
                    "auto",
                    "visibility",
                    "visible",
                    "stroke",
                    "crimson",
                ]);
            }
        }
        if (this.refButton) {
            this.refButton.setAble(this.pxe.displayState == "Valid");
        }
    }
    clear() {
        this.tree = undefined;
        this.predCols = [];
        this.expCols = [];
        if (this.modernTableMount) {
            this.modernTableMount.innerHTML = "";
        }
        if (!this.modernMounted && this.fo) {
            this.fo.removeChildren();
        }
        this.pxe.exp = "";
        this.pxe.nl = 0;
        this.syncModernUI();
        this.setButtonStates();
    }
    displayTable() {
        if (!this.pxe.exp || this.pxe.exp.trim().length === 0) {
            return;
        }
        const expectClass = this.pxe.setExpectClass();
        if (expectClass !== "back" || this.pxe.nl !== 0) {
            if (this.modernInput) {
                this.modernInput.style.borderColor = "#ef4444";
                setTimeout(() => {
                    if (this.modernInput)
                        this.modernInput.style.borderColor = "#cbd5e1";
                }, 1200);
            }
            return;
        }
        this.tree = this.bldTree(this.pxe.exp);
        this.predCols = this.setPredCols();
        this.expCols = this.treeToExpColumns(this.tree);
        this.bldTable();
        this.syncModernUI();
    }
    bldTree(exp) {
        const [returnType, posOrCnt] = this.pxe.splitOrCnt(exp);
        let node = {
            nodeType: "",
            negations: 0,
            tf: false,
            val: "",
            left: undefined,
            right: undefined,
        };
        if (returnType == "split") {
            node = {
                nodeType: exp[posOrCnt],
                negations: 0,
                tf: false,
                val: "",
                left: undefined,
                right: undefined,
            };
            node.left = this.bldTree(exp.substring(0, posOrCnt));
            node.right = this.bldTree(exp.substring(posOrCnt + 1));
        }
        else {
            const nn = exp.substring(posOrCnt);
            if (nn[0] == PXE.lb) {
                node = this.bldTree(nn.substring(1, nn.length - 1));
                node.negations = node.negations + posOrCnt;
            }
            else {
                node = {
                    nodeType: nn,
                    negations: posOrCnt,
                    tf: false,
                    val: "",
                    left: undefined,
                    right: undefined,
                };
            }
        }
        return node;
    }
    setPredCols() {
        const predChars = Array.from(PXE.predicateChars);
        let cols = [];
        predChars.forEach((e) => {
            if (this.pxe.exp.includes(e)) {
                cols.push(PXE.setKeyCode(e));
            }
        });
        return cols;
    }
    treeToExpColumns(tree) {
        const tt = tree.nodeType;
        const lb = PXE.setKeyCode(PXE.lb);
        const rb = PXE.setKeyCode(PXE.rb);
        const negSign = PXE.setKeyCode(PXE.negChar);
        let ls = tree.left ? this.treeToExpColumns(tree.left) : [];
        let rs = tree.right ? this.treeToExpColumns(tree.right) : [];
        const cv = PXE.setKeyCode(tt);
        let cols = [{ header: cv, tree: tree, negations: 0 }];
        if (PXE.binChars.includes(tt)) {
            if (ls.length > 1) {
                let sp = 0;
                while (ls[sp].header == negSign) {
                    sp++;
                }
                ls[sp].header = lb.concat(ls[sp].header);
                ls[ls.length - 1].header = ls[ls.length - 1].header.concat(rb);
            }
            if (rs.length > 1) {
                let sp = 0;
                while (rs[sp].header == negSign) {
                    sp++;
                }
                rs[sp].header = lb.concat(rs[sp].header);
                rs[rs.length - 1].header = rs[rs.length - 1].header.concat(rb);
            }
            if (tree == this.tree && ls.length == 1 && rs.length == 1) {
                let sp = 0;
                while (rs[sp].header == negSign) {
                    sp++;
                }
                //ls[sp].header = lb.concat(ls[sp].header)
                //rs[rs.length-1].header = rs[rs.length-1].header.concat(rb)
            }
            cols = ls.concat(cols, rs);
        }
        return this.handleNegs(cols, tree);
    }
    handleNegs(cols, tree) {
        let negs = tree.negations;
        if (negs == 0)
            return cols;
        const negSign = PXE.setKeyCode(PXE.negChar);
        const tt = tree.nodeType;
        if (PXE.binChars.includes(tt)) {
            const ns = { header: negSign, tree: tree, negations: 1 };
            cols = [ns].concat(cols);
        }
        else {
            cols[0].header = negSign.concat(cols[0].header);
            cols[0].negations = 1;
        }
        while (negs > 1) {
            const cl = cols.length;
            const lb = PXE.setKeyCode(PXE.lb);
            const rb = PXE.setKeyCode(PXE.rb);
            cols[0].header = lb.concat(cols[0].header);
            cols[cl - 1].header = cols[cl - 1].header.concat(rb);
            cols = [{ header: negSign, tree: tree, negations: negs }].concat(cols);
            negs--;
        }
        return cols;
    }
    bldTable(customRows) {
        const isCustomContainer = this.fo && (!this.modernMounted || !this.modernTableMount);
        if (!isCustomContainer && this.modernTableMount) {
            this.modernTableMount.innerHTML = "";
        }
        else if (this.fo) {
            this.fo.removeChildren();
            this.fo.setV("");
        }
        this.setColWidth();
        const table = new Elt("table");
        if (!isCustomContainer && this.modernTableMount) {
            this.modernTableMount.appendChild(table.elt);
        }
        else {
            this.fo.append(table);
        }
        table.setA("style", "border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: system-ui, -apple-system, sans-serif; font-size: 14px; margin-top: 8px;");
        const head = new Elt("thead");
        table.append(head);
        const hr1 = new Elt("tr");
        head.append(hr1);
        const hr1a = new Elt("th");
        let headers = "";
        this.predCols.forEach((p) => {
            headers = headers.concat(p[0], " ");
        });
        hr1a.setAA([
            "colspan",
            this.predCols.length,
            "headers",
            headers,
            "style",
            "background: #eff6ff; color: #1e40af; font-weight: 800; padding: 8px 12px; border: 1px solid #bfdbfe; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; text-align: center;",
        ]);
        hr1a.setV("propositions");
        hr1.append(hr1a);
        const blankCol = new Elt("th");
        blankCol.setAA([
            "headers",
            "blank",
            "style",
            "width: 14px; min-width: 14px; background: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;",
        ]);
        hr1.append(blankCol);
        const hr1b = new Elt("th");
        headers = "";
        this.expCols.forEach((e) => {
            headers = headers.concat(e.header, " ");
        });
        hr1b.setAA([
            "colspan",
            this.expCols.length,
            "headers",
            headers,
            "style",
            "background: #f1f5f9; color: #334155; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; text-align: center;",
        ]);
        hr1b.setV("expression");
        hr1.append(hr1b);
        const hr2 = new Elt("tr");
        head.elt.appendChild(hr2.elt);
        this.predCols.forEach((c) => {
            const h = new Elt("th", `${c}`);
            h.setAA([
                "scope",
                "col",
                "style",
                "min-width: 55px; background: #f8fafc; color: #1e40af; font-family: monospace; font-size: 15px; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; box-sizing: border-box;",
            ]);
            h.setV(c);
            hr2.append(h);
        });
        const blank = new Elt("th", "blank");
        blank.setAA([
            "scope",
            "col",
            "style",
            "width: 14px; min-width: 14px; background: #f8fafc; border: 1px solid #cbd5e1; box-sizing: border-box;",
        ]);
        hr2.append(blank);
        for (let i = 0; i < this.expCols.length; i++) {
            const c = this.expCols[i];
            const h = new Elt("th", `expCol-${i}`);
            c.widget = h;
            const isMainResult = i === this.expCols.length - 1;
            h.setAA([
                "scope",
                "col",
                "title",
                c.header,
                "style",
                `min-width: 75px; background: ${isMainResult ? '#ecfdf5' : '#ffffff'}; color: ${isMainResult ? '#047857' : '#0f172a'}; font-family: monospace; font-size: 14px; font-weight: 700; padding: 8px 14px; border: 1px solid #cbd5e1; text-align: center; cursor: pointer; transition: background 0.15s; box-sizing: border-box; white-space: nowrap;`,
            ]);
            h.setV(c.header);
            hr2.append(h);
        }
        this.setHeaderListeners();
        const body = new Elt("tbody");
        table.append(body);
        const rowCnt = customRows ? customRows.length : Math.pow(2, this.predCols.length);
        const colCnt = this.predCols.length + this.expCols.length + 1;
        for (let i = 0; i < rowCnt; i++) {
            const r = new Elt("tr", `${i}`);
            body.append(r);
            for (let j = 0; j < colCnt; j++) {
                const d = new Elt("td");
                const cellId = `r${i}c${j}`;
                const isSep = j === this.predCols.length;
                const bg = isSep ? '#f8fafc' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
                d.setAA([
                    "id",
                    cellId,
                    "style",
                    `border: 1px solid #e2e8f0; text-align: center; padding: 7px 12px; font-family: monospace; font-size: 14px; background-color: ${bg}; box-sizing: border-box;`,
                ]);
                if (customRows) {
                    if (j < this.predCols.length) {
                        d.setV(customRows[i]?.predVals[j] || "T");
                    }
                    else if (j > this.predCols.length) {
                        const expIdx = j - this.predCols.length - 1;
                        d.setV(customRows[i]?.expVals[expIdx] || "T");
                    }
                }
                r.append(d);
            }
        }
        if (!customRows) {
            for (let i = 0; i < this.predCols.length; i++) {
                const pc = rowCnt / Math.pow(2, i + 1);
                let j = 0;
                let v = "T";
                while (j < rowCnt) {
                    for (let k = 0; k < pc; k++) {
                        this.setCellVal(j, i, v);
                        j++;
                    }
                    v = v == "T" ? "F" : "T";
                }
            }
            for (let i = 0; i < rowCnt; i++) {
                const tree = this.tree;
                this.setRowTruthVals(tree, i);
            }
        }
        const root = this.tree;
        if (root) {
            this.initColHighlightPos = this.expHeaderPos(root);
            this.colHighlight("over", this.initColHighlightPos);
        }
        this.applyScale();
    }
    setHeaderListeners() {
        this.expCols.forEach((c) => {
            if (PXE.binChars.includes(c.tree.nodeType) || c.negations > 1) {
                const w = c.widget;
                w.elt.addEventListener("mouseover", (ev) => {
                    this.handleEvent("over", ev.target);
                });
                w.elt.addEventListener("mouseout", (ev) => {
                    this.handleEvent("out", ev.target);
                });
            }
        });
    }
    handleEvent(type, target) {
        if (this.initColHighlightPos != -1) {
            this.colHighlight("out", this.initColHighlightPos);
        }
        if (!target)
            return;
        const w = target;
        const colPos = this.expCols.findIndex((c) => {
            const cw = c.widget;
            return cw.elt == w;
        });
        this.colHighlight(type, colPos);
        if (type == "out") {
            this.colHighlight("over", this.initColHighlightPos);
        }
    }
    colHighlight(type, colPos) {
        if (!this.expCols[colPos])
            return;
        const col = this.expCols[colPos];
        const node = col.tree;
        const colW = this.expCols[colPos].widget;
        if (!colW || !colW.elt)
            return;
        const setHeaderHighlight = (w, isHighlight, isMain, isOperand = false) => {
            if (!w || !w.elt)
                return;
            const el = w.elt;
            if (isHighlight) {
                el.style.backgroundColor = isOperand ? "#ffe4e6" : "#e0e7ff";
                el.style.color = isOperand ? "#9f1239" : "#3730a3";
                el.style.borderColor = isOperand ? "#f43f5e" : "#818cf8";
                el.style.fontWeight = "800";
            }
            else {
                el.style.backgroundColor = isMain ? "#ecfdf5" : "#ffffff";
                el.style.color = isMain ? "#047857" : "#0f172a";
                el.style.borderColor = "#cbd5e1";
                el.style.fontWeight = isMain ? "800" : "700";
            }
        };
        const isMain = colPos === this.expCols.length - 1;
        if (PXE.binChars.includes(node.nodeType)) {
            if (col.negations == 0) {
                // handle operator
                const nl = node.left;
                const nr = node.right;
                const leftColPos = this.expHeaderPos(nl);
                const rightColPos = this.expHeaderPos(nr);
                const leftColW = this.expCols[leftColPos]?.widget;
                const rightColW = this.expCols[rightColPos]?.widget;
                if (type == "over") {
                    setHeaderHighlight(colW, true, isMain, false);
                    if (leftColW)
                        setHeaderHighlight(leftColW, true, leftColPos === this.expCols.length - 1, true);
                    if (rightColW)
                        setHeaderHighlight(rightColW, true, rightColPos === this.expCols.length - 1, true);
                    this.setColColor(colPos, "#ede9fe");
                    if (leftColPos !== undefined)
                        this.setColColor(leftColPos, "#fff1f2");
                    if (rightColPos !== undefined)
                        this.setColColor(rightColPos, "#fff1f2");
                }
                else {
                    setHeaderHighlight(colW, false, isMain, false);
                    if (leftColW)
                        setHeaderHighlight(leftColW, false, leftColPos === this.expCols.length - 1, false);
                    if (rightColW)
                        setHeaderHighlight(rightColW, false, rightColPos === this.expCols.length - 1, false);
                    this.restoreColColor(colPos);
                    if (leftColPos !== undefined)
                        this.restoreColColor(leftColPos);
                    if (rightColPos !== undefined)
                        this.restoreColColor(rightColPos);
                }
            }
            else {
                // handle operator negation
                const opColPos = this.getMainColPos(col);
                const opColW = this.expCols[opColPos]?.widget;
                if (type == "over") {
                    setHeaderHighlight(colW, true, isMain, false);
                    if (opColW)
                        setHeaderHighlight(opColW, true, opColPos === this.expCols.length - 1, true);
                    this.setColColor(colPos, "#ede9fe");
                    if (opColPos !== -1)
                        this.setColColor(opColPos, "#fff1f2");
                }
                else {
                    setHeaderHighlight(colW, false, isMain, false);
                    if (opColW)
                        setHeaderHighlight(opColW, false, opColPos === this.expCols.length - 1, false);
                    this.restoreColColor(colPos);
                    if (opColPos !== -1)
                        this.restoreColColor(opColPos);
                }
            }
        }
        else if (node.nodeType == "n") {
            // handle predicate negation
            const nextColW = this.expCols[colPos + 1]?.widget;
            if (type == "over") {
                setHeaderHighlight(colW, true, isMain, false);
                if (nextColW)
                    setHeaderHighlight(nextColW, true, colPos + 1 === this.expCols.length - 1, true);
                this.setColColor(colPos, "#ede9fe");
                this.setColColor(colPos + 1, "#fff1f2");
            }
            else {
                setHeaderHighlight(colW, false, isMain, false);
                if (nextColW)
                    setHeaderHighlight(nextColW, false, colPos + 1 === this.expCols.length - 1, false);
                this.restoreColColor(colPos);
                this.restoreColColor(colPos + 1);
            }
        }
    }
    getMainColPos(col) {
        const tree = col.tree;
        const neg = col.negations;
        return this.expCols.findIndex((c) => c.tree == tree && c.negations == neg - 1);
    }
    setColColor(headerPos, color) {
        const colPos = headerPos + this.predCols.length + 1;
        let rowPos = 0;
        while (true) {
            const id = `r${rowPos}c${colPos}`;
            const cell = document.getElementById(id);
            if (!cell)
                break;
            cell.style.backgroundColor = color;
            rowPos++;
        }
    }
    restoreColColor(headerPos) {
        const isMain = headerPos === this.expCols.length - 1;
        const colPos = headerPos + this.predCols.length + 1;
        let rowPos = 0;
        while (true) {
            const id = `r${rowPos}c${colPos}`;
            const cell = document.getElementById(id);
            if (!cell)
                break;
            if (isMain) {
                const val = cell.innerText || cell.textContent || "";
                cell.style.backgroundColor = val === "T" ? "#dcfce7" : "#fee2e2";
            }
            else {
                cell.style.backgroundColor = rowPos % 2 === 0 ? "#ffffff" : "#f8fafc";
            }
            rowPos++;
        }
    }
    expHeaderPos(node, negState) {
        if (negState == undefined) {
            negState = node.negations;
        }
        for (let pos = 0; pos < this.expCols.length; pos++) {
            if (this.expCols[pos].tree == node &&
                this.expCols[pos].negations == negState) {
                return pos;
            }
        }
    }
    expColPos(node, negState) {
        const headerPos = this.expHeaderPos(node, negState);
        return headerPos + this.predCols.length + 1;
    }
    getCellVal(r, c) {
        const d = document.getElementById(`r${r}c${c}`);
        return d ? d.innerHTML : "T";
    }
    setCellVal(r, c, val) {
        const d = document.getElementById(`r${r}c${c}`);
        if (d) {
            d.innerHTML = val;
            const isTrue = val === "T";
            const isMain = c === (this.predCols.length + this.expCols.length);
            d.style.color = isTrue ? "#16a34a" : "#dc2626";
            d.style.fontWeight = isMain ? "800" : "700";
            if (isMain) {
                d.style.backgroundColor = isTrue ? "#dcfce7" : "#fee2e2";
            }
        }
    }
    predColPos(pred) {
        const pc = PXE.setKeyCode(pred);
        for (let i = 0; i < this.predCols.length; i++) {
            if (this.predCols[i] == pc) {
                return i;
            }
        }
    }
    setPredVal(node, row) {
        const col = this.predColPos(node.nodeType);
        const pv = this.getCellVal(row, col);
        return node.negations > 0 ? this.reverseVal(pv) : pv;
    }
    reverseVal(val) {
        return val == "T" ? "F" : "T";
    }
    setRowTruthVals(tree, row) {
        const tt = tree.nodeType;
        let col;
        let val;
        if (PXE.binChars.includes(tt)) {
            col = this.expColPos(tree, 0);
            const tl = tree.left;
            const tr = tree.right;
            const leftVal = this.setRowTruthVals(tl, row);
            const rightVal = this.setRowTruthVals(tr, row);
            const bv = this.setBinOp(tt, leftVal, rightVal);
            val = bv ? "T" : "F";
        }
        else {
            const nv = tree.negations > 0 ? 1 : 0;
            col = this.expColPos(tree, nv);
            val = this.setPredVal(tree, row);
        }
        this.setCellVal(row, col, val);
        return this.handleNegStuff(tree, row, val);
    }
    handleNegStuff(tree, row, val) {
        const tt = tree.nodeType;
        const negs = tree.negations;
        let negLev = PXE.binChars.includes(tt) ? 0 : 1;
        if (negs > negLev) {
            for (let i = PXE.binChars.includes(tt) ? 1 : 2; i <= negs; i++) {
                val = this.reverseVal(val);
                const col = this.expColPos(tree, i);
                this.setCellVal(row, col, val);
            }
        }
        return val == "T" ? true : false;
    }
    setBinOp(op, lv, rv) {
        if (op == PXE.andChar) {
            return lv && rv;
        }
        else if (op == PXE.orChar) {
            return lv || rv;
        }
        else if (op == PXE.implyChar) {
            return !(lv && !rv);
        }
        else if (op == PXE.equivChar) {
            return lv == rv;
        }
    }
    printExpCols(cols) {
        console.log("exp cols:");
        cols.forEach((c) => {
            console.log(`  ${c[0]} for ${c[1].nodeType} nc ${c[2]}`);
        });
    }
    printTree(tree, level = 0) {
        const padding = " ".repeat(level);
        if (tree) {
            console.log(`${padding}node type ${tree.nodeType} neg cnt ${tree.negations}`);
            if (tree.left) {
                console.log(`${padding} left`);
                this.printTree(tree.left, level + 5);
            }
            if (tree.right) {
                console.log(`${padding} right`);
                this.printTree(tree.right, level + 5);
            }
        }
    }
}
//
export let ttd;
export function setTTD() {
    ttd = new TTD();
}
function clear() {
    ttd.clear();
}
function displayTable() {
    ttd.displayTable();
}
function bldRef() {
    ttd.bldRef();
}
// Symbol input button callbacks
function addCharP() {
    ttd.pxe.addCharacter("p");
}
function addCharQ() {
    ttd.pxe.addCharacter("q");
}
function addCharR() {
    ttd.pxe.addCharacter("r");
}
function addCharS() {
    ttd.pxe.addCharacter("s");
}
function addCharNeg() {
    ttd.pxe.addCharacter("n");
}
function addCharAnd() {
    ttd.pxe.addCharacter("a");
}
function addCharOr() {
    ttd.pxe.addCharacter("o");
}
function addCharImply() {
    ttd.pxe.addCharacter("i");
}
function addCharEquiv() {
    ttd.pxe.addCharacter("e");
}
function addCharLB() {
    ttd.pxe.addCharacter("[");
}
function addCharRB() {
    ttd.pxe.addCharacter("]");
}
function addCharBackspace() {
    ttd.pxe.backspace();
}
