import { SVGElt, SVGText, SVGGrpElt, SVGSelectableText } from "./svgElt.js";
export class PXEParent extends SVGElt {
    refTool = false;
    controlsFrameHeight = 0;
    controls = [];
    sideMargin = 0;
    vertMargin = 0;
    constructor() {
        super("svg");
    }
    clear() { }
    setButtonStates() { }
}
export class PXE extends SVGGrpElt {
    parent;
    static textFrameHeight = 30;
    static fontSize = 20;
    static fontPadding = 3;
    static predicateChars = "pqrsmvk";
    static negChar = "n";
    static andChar = "a";
    static orChar = "o";
    static implyChar = "i";
    static equivChar = "e";
    static connectorChars = this.andChar.concat(this.orChar);
    static binChars = this.connectorChars.concat(this.implyChar, this.equivChar);
    static lb = "[";
    static rb = "]";
    static charTokens = [
        ["p", 0x1d45d],
        ["q", 0x1d45e],
        ["r", 0x1d45f],
        ["s", 0x1d460],
        ["m", 0x2208],
        ["v", 0x1d463],
        ["k", 0x003d],
        ["[", 0x005b],
        ["]", 0x005d],
        ["n", 0x00ac],
        ["a", 0x2227],
        ["o", 0x2228],
        ["i", 0x2192],
        ["e", 0x2194],
    ];
    static charset = this.charTokens.map((e) => e[0]);
    static that;
    //
    initColHighlightPos = -1;
    blinkId = 0;
    blinkState = "visible";
    tree;
    exp = "";
    nl = 0;
    txt;
    txtFrame;
    caret;
    clearButton;
    displayState = "Building";
    constructor(parent) {
        super();
        this.parent = parent;
        PXE.that = this;
        this.txtFrame = new SVGElt("rect");
        this.txt = new SVGText();
        this.caret = new SVGElt("line");
        this.clearButton = new SVGSelectableText(() => this.clear(), "clear", false);
        this.parent.controls.push(this.clearButton);
        const x = parent.sideMargin;
        const y = parent.vertMargin;
        const tfH = PXE.textFrameHeight;
        this.txtFrame.setAA(["x", x, "y", y, "height", tfH, "fill", "aliceblue"]);
        const cfH = 3 * y + tfH + parent.controlsFrameHeight;
        this.txt.setA("stroke", "black");
        this.caret.setA("stroke", "red");
        // Keyboard input removed - using button input instead
        this.append(this.txtFrame);
        this.append(this.txt);
        this.append(this.caret);
    }
    layout() {
        const [width, height] = this.parent.getAA(["width", "height"]);
        this.txtFrame.setAA(["width", width, "height", height]);
        const w = +width - 2 * this.parent.sideMargin;
        const h = PXE.fontSize + 2 * PXE.fontPadding;
        let x = this.parent.sideMargin;
        let y = this.parent.vertMargin;
        this.txtFrame.setAA(["width", w, "height", h]);
        this.txt.setAA([
            "x",
            x + PXE.fontPadding,
            "y",
            y + PXE.fontPadding + (2 / 3) * PXE.fontSize,
        ]);
        this.displayText();
    }
    // Keyboard input handling removed - using button input instead
    //
    setExpectClass() {
        return PXE.predicateChars
            .concat(PXE.rb)
            .includes(this.exp[this.exp.length - 1])
            ? "back"
            : "front";
    }
    displayText() {
        const formattedExp = this.fmt();
        this.txt.setV(formattedExp);
        this.placeCaret();
        this.setButtonStates();
    }
    placeCaret() {
        const txtWidth = this.txt.getBB().width;
        const x = this.parent.sideMargin + PXE.fontPadding + txtWidth + 3;
        const y1 = this.parent.vertMargin + 3;
        const y2 = this.parent.vertMargin + PXE.fontSize;
        this.caret.setAA(["x1", x, "y1", y1, "x2", x, "y2", y2]);
    }
    setButtonStates() {
        const expect = this.setExpectClass();
        this.displayState = expect == "back" && this.nl == 0 ? "Valid" : "Building";
        this.parent.setButtonStates();
    }
    static clear() {
        PXE.that.clear();
    }
    clear() {
        this.exp = "";
        this.nl = 0;
        this.displayText();
        this.parent.clear();
    }
    static blinkCaret() { } // Blinking caret removed
    blinkCaret() {
        this.blinkState = this.blinkState == "visible" ? "hidden" : "visible";
        this.caret.setA("visibility", this.blinkState);
    }
    static setKeyCode(key) {
        const m = PXE.charTokens.find((e) => e[0] == key);
        return String.fromCodePoint(m[1]);
    }
    fmt() {
        return PXE.fmt(this.exp);
    }
    //
    static fmt(exp) {
        let displayExp = "";
        for (let i = 0; i < exp.length; i++) {
            const key = exp[i];
            const code = this.setKeyCode(key);
            if (key == this.lb) {
                displayExp = displayExp.concat(code, "\u2009");
            }
            else if (this.connectorChars.includes(key)) {
                displayExp = displayExp.concat("\u2009", code, "\u2009");
            }
            else if (key == this.implyChar) {
                displayExp = displayExp.concat("\u205f", code, "\u205f");
            }
            else if (key == this.equivChar) {
                displayExp = displayExp.concat("\u205f\u205f", code, "\u205f\u205f");
            }
            else if (key == this.rb) {
                displayExp = displayExp.concat("\u2009", code);
            }
            else if (key == this.negChar) {
                displayExp = displayExp.concat(code, "\u200a");
            }
            else {
                displayExp = displayExp.concat(code);
            }
        }
        return displayExp;
    }
    splitOrCnt(exp) {
        let best = [0, -1];
        let nl = 0;
        let negs = 0;
        for (let i = 0; i < exp.length; i++) {
            if (exp[i] == PXE.lb)
                nl++;
            if (exp[i] == PXE.rb)
                nl--;
            if (nl == 0) {
                if (exp[i] == PXE.negChar)
                    negs++;
                if (PXE.connectorChars.includes(exp[i]) && best[0] == 0) {
                    best = [1, i];
                }
                else if (exp[i] == PXE.implyChar && best[0] < 2) {
                    best = [2, i];
                }
                else if (exp[i] == PXE.equivChar) {
                    return ["split", i];
                }
            }
        }
        if (best[0] == 0) {
            return ["cnt", negs];
        }
        else {
            return ["split", best[1]];
        }
    }
    // Button input methods
    addCharacter(key) {
        const expectClass = this.setExpectClass();
        if (expectClass == "front") {
            if (PXE.predicateChars.concat(PXE.lb, PXE.negChar).includes(key)) {
                if (key == PXE.lb)
                    this.nl++;
                this.exp = this.exp.concat(key);
                this.displayText();
                return true;
            }
        }
        else {
            // expectClass == 'back'
            if ((key == PXE.rb && this.nl > 0) || PXE.binChars.includes(key)) {
                if (key == "]")
                    this.nl--;
                this.exp = this.exp.concat(key);
                this.displayText();
                return true;
            }
        }
        return false;
    }
    backspace() {
        if (this.exp.length > 0) {
            if (this.exp[this.exp.length - 1] == PXE.lb)
                this.nl--;
            if (this.exp[this.exp.length - 1] == PXE.rb)
                this.nl++;
            this.exp = this.exp.substring(0, this.exp.length - 1);
            this.displayText();
        }
    }
}
