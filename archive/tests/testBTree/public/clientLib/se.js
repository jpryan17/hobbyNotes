import { SVGElt, SVGText, SVGGrpElt, SVGSelectableText, SVGTSpan } from './svgElt.js';
//
const forAll = String.fromCodePoint(0x2200);
const exists = String.fromCodePoint(0x2203);
const and = String.fromCodePoint(0x2227);
const or = String.fromCodePoint(0x2228);
const imply = String.fromCodePoint(0x2192);
const equiv = String.fromCodePoint(0x2194);
const neg = String.fromCodePoint(0x00ac);
const noSpace = '';
const hairSpace = '\u200a';
const thinSpace = '\u2009';
const medSpace = '\u205f';
const largeSpace = '\u205f\u205f';
const InTypeDescList = [
    { type: 'A', key: 'A', id: true, output: noSpace.concat(forAll, hairSpace, '(') },
    { type: 'E', key: 'E', id: true, output: noSpace.concat(exists, hairSpace, '(') },
    //{type:'P',key:'p',id:true,output:thinSpace.concat('P')},
    //{type:'Q',key:'q',id:true,output:thinSpace.concat('Q')},
    //{type:'R',key:'r',id:true,output:thinSpace.concat('R')},
    //{type:'S',key:'s',id:true,output:thinSpace.concat('S')},
    { type: '[', key: '[', id: false, output: noSpace.concat('[') },
    { type: ']', key: ']', id: false, output: noSpace.concat(']') },
    { type: 'a', key: 'a', id: false, output: medSpace.concat(and, hairSpace) },
    { type: 'o', key: 'o', id: false, output: medSpace.concat(or, hairSpace) },
    { type: 'i', key: 'i', id: false, output: medSpace.concat(imply, medSpace) },
    { type: 'e', key: 'e', id: false, output: largeSpace.concat(equiv, largeSpace) },
    { type: 'n', key: 'n', id: false, output: medSpace.concat(neg) },
    //{type:'C',key:'c',id:true,output:noSpace.concat('c')},
    //{type:'F',key:'f',id:true,output:thinSpace.concat('f')},
    //{type:'G',key:'g',id:true,output:thinSpace.concat('g')},
    //{type:'H',key:'h',id:true,output:thinSpace.concat('h')},
    //{type:'X',key:'x',id:true,output:thinSpace.concat('x')},
    //{type:'Y',key:'y',id:true,output:thinSpace.concat('y')},
    //{type:'Z',key:'z',id:true,output:thinSpace.concat('z')},
    { type: '(', key: '(', id: false, output: thinSpace.concat('(') },
    { type: ')', key: ')', id: false, output: thinSpace.concat(')') }
];
const vars = [];
const fcns = [];
const preds = [];
const quants = ['A', 'E'];
const args = vars.concat(fcns);
//
export class SE extends SVGGrpElt {
    parent;
    editorFrame;
    txt;
    txtFrame;
    caret;
    statusFrame;
    clearButton;
    status;
    //
    static sideMargin = 12;
    static vertMargin = 8;
    static fontSize = 20;
    static fontPadding = 3;
    static ssFontSize = 12;
    static that;
    //
    blinkId = 0;
    blinkState = 'visible';
    xc = 0;
    pc = 0;
    cc = 0;
    fc = 0;
    cn = 0;
    cm = 1;
    logicNest = 0;
    argNest = 0;
    key = '';
    inputMode = 'L';
    expSide = 'Front';
    inList = [];
    inScope = [];
    //
    constructor(parent) {
        super();
        this.parent = parent;
        SE.that = this;
        this.editorFrame = new SVGElt('rect');
        this.txtFrame = new SVGElt('rect');
        this.txt = new SVGText();
        this.caret = new SVGElt('line');
        this.statusFrame = new SVGElt('rect');
        this.clearButton = new SVGSelectableText(SE.clear, 'clear', false);
        this.status = new SVGText();
        parent.append(this);
        this.append(this.editorFrame);
        this.append(this.txtFrame);
        this.append(this.txt);
        this.append(this.caret);
        this.append(this.statusFrame);
        this.append(this.clearButton);
        this.append(this.status);
        this.editorFrame.setAA(['x', 0, 'y', 0, 'borderWidth', 2, 'stroke', 'darkblue', 'fill', 'lightgrey']);
        this.txtFrame.setAA(['x', SE.sideMargin, 'y', SE.vertMargin, 'fill', 'aliceblue']);
        this.statusFrame.setA('fill', 'azure');
        this.txt.setAA(['stroke', 'black', 'font-size', SE.fontSize]);
        this.caret.setA('stroke', 'red');
        this.status.setA('stroke', 'black');
        this.txtFrame.elt.addEventListener('mouseover', () => {
            document.addEventListener("keyup", SE.handleInput);
            this.blinkId = window.setInterval(SE.blinkCaret, 500);
        });
        this.txtFrame.elt.addEventListener('mouseout', () => {
            document.removeEventListener("keyup", SE.handleInput);
            window.clearInterval(this.blinkId);
        });
        this.clear();
    }
    layout() {
        const [width, height] = this.parent.getAA(['width', 'height']);
        this.editorFrame.setAA(['width', width, 'height', height]);
        const w = +width - 2 * SE.sideMargin;
        const h = SE.fontSize + 2 * SE.fontPadding;
        let x = SE.sideMargin;
        let y = SE.vertMargin;
        this.txtFrame.setAA(['width', w, 'height', h]);
        this.txt.setAA(['x', x + SE.fontPadding,
            'y', y + SE.fontPadding + 2 / 3 * SE.fontSize]);
        y = 2 * y + h;
        this.statusFrame.setAA(['x', x, 'y', y, 'width', w, 'height', h]);
        this.clearButton.setAA(['x', x, 'y', y + SE.fontPadding + 2 / 3 * SE.fontSize]);
        x = x + this.clearButton.getBB().width + 30 + SE.fontPadding;
        this.status.setAA(['x', x + SE.fontPadding,
            'y', y + SE.fontPadding + 2 / 3 * SE.fontSize]);
    }
    static clear() { SE.that.clear(); }
    clear() {
        this.xc = 0;
        this.pc = 0;
        this.cc = 0;
        this.fc = 0;
        this.inputMode = 'L';
        this.expSide = 'Front';
        this.logicNest = 0;
        this.argNest = 0;
        this.inList = [];
        this.inScope = [];
        this.display();
    }
    backup() {
        const ex = this.inList[this.inList.length - 1];
        const isDig = !isNaN(+ex);
        let side = 'Front';
        if (ex == ']') {
            side = 'Back';
            this.logicNest++;
            this.addBackToScopeCheck();
        }
        else if (['[', 'A', 'E'].includes(ex)) {
            this.logicNest--;
        }
        else if (ex == ')') {
            this.argNest++;
        }
        else if (ex == '(') {
            this.argNest--;
        }
        this.inList.pop();
        if (this.inList.length > 0) {
            const ep = this.inList[this.inList.length - 1];
            this.setState(side);
        }
    }
    addBackToScopeCheck() {
        const parent = this.getMatchingParenParent(true);
        console.log(`in addBack parent ${parent}`);
        if (parent == ')') {
            const pp = this.getMatchingParenParentPos(true);
            const vv = this.getVariable(pp - 1);
            console.log(`var ${vv}`);
            this.inScope.push({ var: vv, lev: this.logicNest });
        }
    }
    setState(side) {
        this.inputMode = 'L';
        this.expSide = side;
        const lv = this.firstNonDigit();
        if (lv == 'P') {
            this.inputMode = 'P';
            this.expSide = 'Back';
        }
        else if (quants.includes(lv)) {
            this.inputMode = 'Q';
        }
        else if (['('].concat(vars, fcns).includes(lv)) {
            this.inputMode = 'A';
        }
        else if (lv == ')') {
            const v = this.getMatchingParenParent();
            if (v == 'P') {
                this.inputMode = 'P';
                this.expSide = 'Back';
            }
            else {
                this.inputMode = 'A';
            }
        }
    }
    static handleInput(ev) { SE.that.handleInput(ev); }
    handleInput(ev) {
        this.key = ev.key;
        //console.log(`processing ${this.key} mode ${this.inputMode} side ${this.expSide}`)  
        if (!(this.key == 'Shift')) {
            if (this.key == 'Backspace') {
                if (this.inList.length > 0) {
                    this.backup();
                }
            }
            else if (this.isDigit(this.key)) {
                if (this.canBeDigit()) {
                    this.inList.push(this.key);
                }
            }
            else if (InTypeDescList.find(e => this.key == e.key)) {
                this.processKey();
            }
            if (this.inList.length > 0) {
                this.display();
            }
            else {
                this.clear();
            }
        }
    }
    processKey() {
        const desc = InTypeDescList.find(e => this.key == e.key);
        //console.log(`key ${this.key} mode ${this.inputMode} side ${this.expSide} type ${desc.type}`)
        if (this.inputMode == 'L') {
            if (this.expSide == 'Front') {
                if (['A', 'E', 'n', '['].concat(preds).includes(desc.type)) {
                    const exp = desc.type;
                    this.inList.push(exp);
                    if (preds.includes(desc.type)) {
                        this.inputMode = 'P';
                        this.expSide = 'Back';
                    }
                    if (quants.includes(desc.type)) {
                        this.inputMode = 'Q';
                    }
                    if (['A', 'E', '['].includes(desc.type)) {
                        this.logicNest++;
                    }
                }
            }
            else { // at back side of statement
                if (['a', 'o', 'i', 'e'].includes(desc.type)) {
                    const exp = desc.type;
                    this.inList.push(exp);
                    this.expSide = 'Front';
                }
                else if (desc.type == ']' && this.logicNest > 0) {
                    if (this.inScope.some(e => e.lev = this.logicNest)) {
                        this.inScope.pop();
                    }
                    this.inList.push(desc.type);
                    this.logicNest--;
                }
            }
        }
        else if (this.inputMode == 'P') {
            if (desc.type == '(') {
                this.inputMode = 'A';
                const exp = desc.type;
                this.inList.push(exp);
                this.argNest = 1;
            }
            else {
                this.inputMode = 'L';
                this.expSide = 'Back';
                this.processKey();
            }
        }
        else if (this.inputMode == 'Q') {
            if (vars.includes(desc.type)) {
                this.inList.push(desc.type);
                this.inputMode = 'B';
                this.expSide = 'Front';
            }
        }
        else if (this.inputMode == 'B') {
            if (desc.type == ')') {
                const v = this.getVariable();
                this.inScope.push({ var: v, lev: this.logicNest });
                this.inList.push(desc.type);
                this.inList.push('[');
                this.inputMode = 'L';
                this.expSide = 'Front';
            }
        }
        else if (this.inputMode == 'A') {
            const prev = this.firstNonDigit();
            const isV = vars.includes(prev);
            const pv = (isV) ? this.getVariable() : undefined;
            if (pv == undefined || this.inScope.some(e => e.var == pv)) {
                if (desc.type == ')') {
                    const exp = desc.type;
                    this.inList.push(exp);
                    this.argNest--;
                    if (this.argNest == 0) {
                        this.inputMode = 'L';
                        this.expSide = 'Back';
                    }
                }
                else if (fcns.includes(desc.type)) {
                    this.inList.push(desc.type);
                }
                else if (vars.includes(desc.type)) {
                    if (this.inScope.some(e => e.var[0] == desc.type)) {
                        this.inList.push(desc.type);
                    }
                }
            }
        }
        else if (desc.type == '(') {
            this.inList.push(desc.type);
            this.argNest++;
        }
    }
    display() {
        this.displayText();
    }
    displayText() {
        this.fmt();
        this.placeCaret();
        this.clearButton.setAble(this.inList.length > 0);
    }
    placeCaret() {
        const txtWidth = this.txt.getBB().width;
        const x = SE.sideMargin + SE.fontPadding + txtWidth + 3;
        const y1 = SE.vertMargin + 3;
        const y2 = SE.vertMargin + SE.fontSize;
        this.caret.setAA(['x1', x, 'y1', y1, 'x2', x, 'y2', y2]);
    }
    static blinkCaret() {
        SE.that.blinkCaret();
    }
    blinkCaret() {
        this.blinkState = (this.blinkState == 'visible') ? 'hidden' : 'visible';
        this.caret.setA('visibility', this.blinkState);
    }
    getVariable(from) {
        const start = (from) ? from : this.inList.length - 1;
        let digits = [];
        for (let i = start; i >= 0; i--) {
            if (this.isDigit(this.inList[i])) {
                digits.push(this.inList[i]);
            }
            else {
                break;
            }
        }
        return this.inList[start - digits.length].concat(digits.reverse().join(''));
    }
    firstNonDigitPos(from) {
        let start = this.inList.length - 1;
        if (from != undefined) {
            start = from;
        }
        for (let i = start; i >= 0; i--) {
            if (isNaN(+this.inList[i]))
                return i;
        }
        return -1;
    }
    firstNonDigit(from) {
        const pos = this.firstNonDigitPos(from);
        return (pos != -1) ? this.inList[pos] : '';
    }
    getMatchingParenParentPos(brackets = false) {
        const [f, b] = (brackets) ? ['[', ']'] : ['(', ')'];
        let others = 0;
        console.log(`f ${f} b ${b}`);
        for (let i = this.inList.length - 2; i >= 0; i--) {
            const v = this.inList[i];
            if (v == b) {
                others++;
            }
            else if (v == f) {
                if (others == 0) {
                    return this.firstNonDigitPos(i - 1);
                }
                else {
                    others--;
                }
            }
        }
        return -1;
    }
    getMatchingParenParent(brackets = false) {
        const pos = this.getMatchingParenParentPos(brackets);
        return (pos != -1) ? this.inList[pos] : '';
    }
    canBeDigit() {
        if (this.inList.length > 0) {
            let digits = [];
            let np = 1;
            while (this.inList.length - np > 0 && this.isDigit(this.inList[this.inList.length - np])) {
                digits.push(this.inList[this.inList.length - np]);
                np++;
            }
            const prev = this.inList[this.inList.length - np];
            const desc = InTypeDescList.find(e => e.type == prev);
            if (vars.includes(desc.type)) {
                const pp = this.inList[this.inList.length - np - 1];
                const ppDesc = InTypeDescList.find(e => e.type == pp);
                if (!ppDesc || !quants.includes(ppDesc.type)) {
                    const vp = desc.type.concat(digits.reverse().join(''), this.key);
                    return this.inScope.some(e => e.var.substring(0, vp.length) == vp);
                }
                else {
                    return desc.id;
                }
            }
            else {
                return desc.id;
            }
            return false;
        }
    }
    isDigit(c) {
        return !isNaN(+c);
    }
    fmt() {
        this.txt.removeChildren();
        let x = SE.sideMargin + SE.fontPadding;
        for (let i = 0; i < this.inList.length; i++) {
            const ex = this.inList[i];
            if (this.isDigit(ex)) {
                const ss = this.setSubscriptVal(i);
                i += ss.length - 1;
                this.setSubscriptSpan(ss, x);
            }
            else {
                const desc = InTypeDescList.find(e => e.type == ex);
                let tok = desc.output;
                if (args.includes(ex)) {
                    const prev = this.firstNonDigit(i - 1);
                    if (args.includes(prev)) {
                        tok = ','.concat(tok);
                    }
                }
                this.setSpan(tok, x);
            }
            const tw = this.txt.getBB().width;
            x = SE.sideMargin + SE.fontPadding + tw;
        }
    }
    setSubscriptVal(pos) {
        let digits = [];
        let ssl = 0;
        while (this.isDigit(this.inList[pos + ssl])) {
            digits.push(this.inList[pos + ssl]);
            ssl++;
        }
        return digits.join('');
    }
    setSubscriptSpan(val, x) {
        const ts = new SVGTSpan(this.txt, x);
        ts.setAA(['font-size', SE.ssFontSize, 'baseline-shift', 'sub']);
        ts.setV(val);
    }
    setSpan(val, x) {
        const ts = new SVGTSpan(this.txt, x);
        ts.setV(val);
    }
}
