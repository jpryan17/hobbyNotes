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
    //
    initColHighlightPos = -1;
    tree;
    predCols = [];
    expCols = [];
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
        this.controls.push(this.displayButton);
        this.controls.push(this.proofButton);
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
    }
    setRefTool() {
        console.log("in set ref tool");
        this.refButton = new SVGSelectableText(bldRef, "build reference", false);
        this.controls.push(this.refButton);
    }
    layoutEditor() {
        const [fow, foh] = [Nav.foWidth, Nav.foHeight];
        this.setAA(["width", fow, "height", foh]);
        this.editorFrame.setAA(["width", fow, "height", foh]);
        this.controlsFrame.setA("width", fow - 2 * this.sideMargin);
        //
        this.pxe.layout();
        //
        const foW = fow - 2 * this.sideMargin;
        const foH = foh - this.foY - 2 * this.vertMargin;
        this.fo.setAA(["width", foW, "height", foH]);
        if (this.usedByProofBuilderDemo) {
            this.proofButton.setAA([
                "pointer-events",
                "auto",
                "visibility",
                "visible",
                "stroke",
                "orange",
            ]);
        }
        else {
            this.proofButton.setAA([
                "pointer-events",
                "none",
                "visibility",
                "hidden",
            ]);
        }
        this.showControls();
        this.setColWidth();
    }
    async bldRef() {
        const text = `<ttd-ref exp="${this.pxe.exp}" 
            style="color:firebrick;font-weight:bold">${this.pxe.fmt()}</ttd-ref>`;
        try {
            await navigator.clipboard.writeText(text);
            const rb = this.refButton;
            rb.setA("stroke", "orange");
        }
        catch (err) {
            console.error("Failed to copy: ", err);
        }
    }
    showControls() {
        const y = 2 * this.vertMargin +
            PXE.textFrameHeight +
            (2 / 3) * this.controlsFrameHeight;
        let x = this.sideMargin + 5;
        this.controls.forEach((e) => {
            this.append(e);
            e.setAA(["x", x, "y", y]);
            x = x + e.getBB().width + 10;
        });
    }
    setColWidth() {
        const colCnt = this.predCols.length + this.expCols.length + 1;
        if (colCnt > 0) {
            const width = this.fo.getA("width");
            const available = (0.8 * +width) / colCnt;
            this.colWidth = Math.min(this.maxColWidth, available);
        }
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
        //
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
    setButtonStates() {
        const clearState = true;
        const clearButton = this.controls[0];
        clearButton.setAble(clearState);
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
        if (this.refButton) {
            this.refButton.setAble(this.pxe.displayState == "Valid");
        }
    }
    clear() {
        this.fo.removeChildren();
        this.fo.setV("");
    }
    displayTable() {
        this.tree = this.bldTree(this.pxe.exp);
        //this.printTree(this.tree)
        this.predCols = this.setPredCols();
        this.expCols = this.treeToExpColumns(this.tree);
        //console.log(`predCols ${this.predCols}`)
        //this.printExpCols(this.expCols)
        this.bldTable();
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
        this.fo.removeChildren();
        this.fo.setV("");
        this.setColWidth();
        const table = new Elt("table");
        this.fo.append(table);
        table.setA("style", "border: 1px solid black");
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
            "border: 1px solid black",
        ]);
        hr1a.setV("propositions");
        hr1.append(hr1a);
        const blankCol = new Elt("th");
        blankCol.setAA(["headers", "blank", "width", 10]);
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
            "border: 1px solid black",
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
                "width",
                this.colWidth,
                "style",
                "border: 1px solid black",
            ]);
            h.setV(c);
            hr2.append(h);
        });
        const blank = new Elt("th", "blank");
        blank.setA("scope", "col");
        hr2.append(blank);
        for (let i = 0; i < this.expCols.length; i++) {
            const c = this.expCols[i];
            const h = new Elt("th", `expCol-${i}`);
            c.widget = h;
            h.setAA([
                "scope",
                "col",
                "width",
                this.colWidth,
                "style",
                "border: 1px solid black",
            ]);
            h.setV(c.header);
            hr2.append(h);
        }
        this.setHeaderListeners();
        const hr3 = new Elt("tr");
        hr3.setA("height", 10);
        head.append(hr3);
        const body = new Elt("tbody");
        table.append(body);
        const rowCnt = customRows ? customRows.length : Math.pow(2, this.predCols.length);
        const colCnt = this.predCols.length + this.expCols.length + 1;
        for (let i = 0; i < rowCnt; i++) {
            const r = new Elt("tr", `${i}`);
            body.append(r);
            for (let j = 0; j < colCnt; j++) {
                const d = new Elt("td");
                if (j == this.predCols.length) {
                    if (i % 2 == 0) {
                        d.setA("style", "background-color:antiquewhite");
                    }
                }
                else if (i % 2 != 0) {
                    d.setAA([
                        "id",
                        `r${i}c${j}`,
                        "style",
                        "border: 1px solid black;text-align:center",
                    ]);
                }
                else {
                    d.setAA([
                        "id",
                        `r${i}c${j}`,
                        "style",
                        "border: 1px solid black;text-align:center;background-color:antiquewhite",
                    ]);
                }
                r.append(d);
            }
        }
        if (customRows) {
            for (let i = 0; i < rowCnt; i++) {
                const rowData = customRows[i];
                for (let p = 0; p < this.predCols.length; p++) {
                    this.setCellVal(i, p, rowData.predVals[p] || "T");
                }
                for (let e = 0; e < this.expCols.length; e++) {
                    const colIdx = this.predCols.length + 1 + e;
                    const cell = document.getElementById(`r${i}c${colIdx}`);
                    if (cell)
                        cell.innerText = rowData.expVals[e] || "T";
                }
            }
        }
        else {
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
        const col = this.expCols[colPos];
        const node = col.tree;
        const colW = this.expCols[colPos].widget;
        if (PXE.binChars.includes(node.nodeType)) {
            if (col.negations == 0) {
                // handle operator
                const nl = node.left;
                const nr = node.right;
                const leftColPos = this.expHeaderPos(nl);
                const rightColPos = this.expHeaderPos(nr);
                const leftColW = this.expCols[leftColPos].widget;
                const rightColW = this.expCols[rightColPos].widget;
                //
                if (type == "over") {
                    colW.setA("style", "background-color:lavender;border: 1px solid black");
                    leftColW.setA("style", "background-color:mistyrose;border: 1px solid black");
                    rightColW.setA("style", "background-color:mistyrose;border: 1px solid black");
                    const cc = [
                        [colPos, "lavender"],
                        [leftColPos, "mistyrose"],
                        [rightColPos, "mistyrose"],
                    ];
                    cc.forEach((c) => {
                        this.setColColor(c[0], c[1]);
                    });
                }
                else {
                    colW.setA("style", "background-color:white;border: 1px solid black");
                    leftColW.setA("style", "background-color:white;border: 1px solid black");
                    rightColW.setA("style", "background-color:white;border: 1px solid black");
                    const cc = [
                        [colPos, "antiquewhite"],
                        [leftColPos, "antiquewhite"],
                        [rightColPos, "antiquewhite"],
                    ];
                    cc.forEach((c) => {
                        this.setColColor(c[0], c[1]);
                    });
                }
            }
            else {
                //handle operator negation
                const opColPos = this.getMainColPos(col);
                const opColW = this.expCols[opColPos].widget;
                if (type == "over") {
                    colW.setA("style", "background-color:lavender;border: 1px solid black");
                    opColW.setA("style", "background-color:mistyrose;border: 1px solid black");
                    const cc = [
                        [colPos, "lavender"],
                        [opColPos, "mistyrose"],
                    ];
                    cc.forEach((c) => {
                        this.setColColor(c[0], c[1]);
                    });
                }
                else {
                    colW.setA("style", "background-color:white;border: 1px solid black");
                    opColW.setA("style", "background-color:white;border: 1px solid black");
                    const cc = [
                        [colPos, "antiquewhite"],
                        [opColPos, "antiquewhite"],
                    ];
                    cc.forEach((c) => {
                        this.setColColor(c[0], c[1]);
                    });
                }
            }
        }
        else if (node.nodeType == "n") {
            //handle predicate negation
            const nextColW = this.expCols[colPos + 1].widget;
            if (type == "over") {
                colW.setA("style", "background-color:lavender;border: 1px solid black");
                nextColW.setA("style", "background-color:mistyrose;border: 1px solid black");
                const cc = [
                    [colPos, "lavender"],
                    [colPos + 1, "mistyrose"],
                ];
                cc.forEach((c) => {
                    this.setColColor(c[0], c[1]);
                });
            }
            else {
                colW.setA("style", "background-color:white;border: 1px solid black");
                nextColW.setA("style", "background-color:white;border: 1px solid black");
                const cc = [
                    [colPos, "antiquewhite"],
                    [colPos + 1, "antiquewhite"],
                ];
                cc.forEach((c) => {
                    this.setColColor(c[0], c[1]);
                });
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
        const rowCnt = Math.pow(2, this.predCols.length);
        for (let rowPos = 0; rowPos < rowCnt; ++rowPos) {
            if (rowPos % 2 == 0) {
                const id = `r${rowPos}c${colPos}`;
                const cell = document.getElementById(id);
                Elt.sa(cell, "style", `background-color:${color};border: 1px solid black;text-align:center`);
            }
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
        return d.innerHTML;
    }
    setCellVal(r, c, val) {
        const d = document.getElementById(`r${r}c${c}`);
        d.innerHTML = val;
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
