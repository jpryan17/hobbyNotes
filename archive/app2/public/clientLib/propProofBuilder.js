import { Nav } from './navFW.js';
import { Elt } from './elt.js';
import { SVGElt, SVGGrpElt, SelectableTextList, SVGSelectableText, SVGText, textWidth, SVGTSpan } from './svgElt.js';
import { PXE } from './pxe.js';
import { ttd } from './ttd.js';
const baseColor = 'black';
const disabledColor = 'grey';
const notOp = '\u00AC';
const andOp = '\u2227';
const orOp = '\u2228';
const miOp = '\u2192';
const refOp = '\u2190';
const equivOp = '\u2194';
const ruleList = [andOp, miOp, equivOp, orOp, notOp, refOp];
const infersOP = '\u21D2';
const proofOp = '\u22A2';
const subi = '\u1D62';
const sube = '\u2091';
const subl = '\u2097';
const subr = '\u1D63';
const ilCnt = 70;
let pb;
export function initProofBuilder() {
    const width = 900;
    const height = 400;
    return new ProofBuilderDemo(width, height);
}
export function displayProofBuilder() {
    const [fow, foh] = [Nav.foWidth, Nav.foHeight];
    pb.frame.setAA(['width', fow - 2, 'height', foh - 2]);
    pb.setAA(['width', fow, 'height', foh]);
    const [sx, sy] = [fow / pb.width, foh / pb.height];
    pb.g.xscale(sx, sy);
}
const colors = { std: 'blue', over: 'purple', disabled: 'grey', selected: 'darkred' };
export class ProofBuilderDemo extends SVGElt {
    width;
    height;
    frame;
    g;
    statusLine;
    status;
    addGrp;
    clrGrp;
    chooseGrp;
    sideGrp;
    okGrp;
    tempHypSVG;
    propFor = '';
    htl;
    itl;
    hList = [];
    cVal;
    iList = [];
    conclusion;
    selectionTarget;
    opWidgets = { widgets: [], choice: -1 };
    eiWidgets = { widgets: [], choice: -1 };
    sideWidgets = { widgets: [], choice: -1 };
    inferenceOKButton;
    arg1;
    arg2;
    p1;
    p2;
    hypRef;
    hypCls;
    hypotheticals = [];
    closedHypotheticals = [];
    //
    //
    constructor(width, height) {
        super('svg', 'proofBuilder');
        this.width = width;
        this.height = height;
        pb = this;
        this.setAA(['width', this.width, 'height', this.height]);
        this.frame = new SVGElt('rect');
        this.frame.setAA(['x', 1, 'y', 1, 'fill', 'none', 'stroke', 'blue', 'stroke-width', 2]);
        this.append(this.frame);
        this.g = new SVGGrpElt();
        this.append(this.g);
        //
        // a clumsy manual build of proof build form. live and maybe learn, hey?
        //
        const title = new SVGText();
        title.setV('propositional logic proof build demo');
        title.setAA(['x', width / 2 - 1 / 2 * textWidth('demo propositional logic proof builder', 24),
            'y', 20, 'font-size', 16, 'stroke', 'black']);
        this.g.append(title);
        const statusRect = new SVGElt('rect');
        const srX = 10;
        const srY = 35;
        const srH = 24;
        statusRect.setAA(['x', srX, 'y', srY, 'width', width - 20, 'height', srH, 'fill', 'white']);
        this.g.append(statusRect);
        const sh = new SVGText();
        sh.setV('status');
        sh.setAA(['x', srX, 'y', srY - 3, 'font-size', 12, 'stroke', 'black']);
        this.g.append(sh);
        const statusHeader = new SVGText();
        this.statusLine = new SVGText();
        this.statusLine.setV('empty');
        this.statusLine.setAA(['x', srX + 5, 'y', srY + 17 / 18 * 20, 'font-size', 16, 'stroke', 'black']);
        this.g.append(this.statusLine);
        //
        const controlsRect = new SVGElt('rect');
        const crX = 45;
        const crY = 85;
        const crH = 48;
        controlsRect.setAA(['x', crX, 'y', crY, 'width', width - 80, 'height', crH, 'fill', 'white']);
        this.g.append(controlsRect);
        const cch = new SVGText();
        cch.setV('controls');
        cch.setAA(['x', crX, 'y', crY - 3, 'font-size', 12, 'stroke', 'black']);
        this.g.append(cch);
        let x = crX + 10;
        const y = crY + 18;
        //
        this.addGrp = new SVGGrpElt();
        this.g.append(this.addGrp);
        const addStart = this.setText('add [', this.addGrp);
        addStart.setAA(['x', x, 'y', y]);
        x += textWidth('add[', 18) + 7;
        const addH = this.setSelectableText(addHF, 'hypothesis', this.addGrp);
        addH.setAA(['x', x, 'y', y]);
        x += textWidth('hypothesis', 18) + 7;
        const addC = this.setSelectableText(addCF, 'conclusion', this.addGrp);
        addC.setAA(['x', x, 'y', y]);
        x += textWidth('conclusion', 18) + 7;
        const addEnd = this.setText(']', this.addGrp);
        addEnd.setAA(['x', x, 'y', y]);
        //
        this.clrGrp = new SVGGrpElt();
        this.g.append(this.clrGrp);
        const clrStart = this.setText('[', this.clrGrp);
        let cy = y + 25;
        let cx = crX + 10;
        clrStart.setAA(['x', crX + 10, 'y', cy]);
        const clr = this.setSelectableText(clrF, 'clear all', this.clrGrp);
        let cxc = cx + textWidth('[', 18) + 4;
        clr.setAA(['x', cxc, 'y', cy]);
        const clrEnd = this.setText(']', this.clrGrp);
        cxc += textWidth('clear all', 18) + 2;
        clrEnd.setAA(['x', cxc, 'y', cy]);
        //
        x += 50;
        cx = x;
        this.chooseGrp = new SVGGrpElt();
        this.g.append(this.chooseGrp);
        const opHeader = this.setText('choose rule logical operator [', this.chooseGrp);
        opHeader.setAA(['x', x, 'y', y]);
        this.opWidgets.widgets = [];
        const ops = [andOp, miOp, equivOp, orOp, notOp];
        ops.forEach(op => {
            const rb = this.setRB(this.opWidgets, op, this.chooseGrp);
            rb.setAA(['font-size', 18, 'stroke', 'blue']);
        });
        x += textWidth('choose rule logical operator [', 18) + 7;
        this.opWidgets.widgets.forEach((opw, p) => {
            opw.setAA(['x', x, 'y', y]);
            x += textWidth(ops[p], 18) + 11;
        });
        const opEnd = this.setText(']', this.chooseGrp);
        opEnd.setAA(['x', x, 'y', y, 'font-size']);
        const addEI = this.setText('& [', this.chooseGrp);
        addEI.setAA(['x', cx, 'y', cy]);
        const intro = this.setRB(this.eiWidgets, 'introduce', this.chooseGrp);
        let eix = cx + textWidth('& [', 18) + 4;
        intro.setAA(['x', eix, 'y', cy]);
        eix += textWidth('introduce', 18) + 4;
        const orEI = this.setText('or', this.chooseGrp);
        orEI.setAA(['x', eix, 'y', cy]);
        const elim = this.setRB(this.eiWidgets, 'eliminate', this.chooseGrp);
        eix += textWidth('or', 18) + 4;
        elim.setAA(['x', eix, 'y', cy]);
        eix += textWidth('eliminate', 18) + 4;
        const endEI = this.setText(']', this.chooseGrp);
        endEI.setAA(['x', eix, 'y', cy]);
        eix += textWidth(']', 18) + 15;
        //
        this.sideGrp = new SVGGrpElt();
        this.g.append(this.sideGrp);
        const sideStart = this.setText('side [', this.sideGrp);
        sideStart.setAA(['x', eix, 'y', cy]);
        eix += textWidth('side [', 18) + 4;
        const left = this.setRB(this.sideWidgets, 'left', this.sideGrp);
        left.setAA(['x', eix, 'y', cy]);
        eix += textWidth('left', 18) + 4;
        const orLR = this.setText('or', this.sideGrp);
        orLR.setAA(['x', eix, 'y', cy]);
        eix += textWidth('or', 18) + 4;
        const right = this.setRB(this.sideWidgets, 'right', this.sideGrp);
        right.setAA(['x', eix, 'y', cy]);
        eix += textWidth('right', 18) + 4;
        const endLR = this.setText(']', this.sideGrp);
        endLR.setAA(['x', eix, 'y', cy]);
        //
        this.okGrp = new SVGGrpElt();
        this.g.append(this.okGrp);
        const okStart = this.setText('[', this.okGrp);
        eix += 50;
        cy -= 15;
        okStart.setAA(['x', eix, 'y', cy]);
        this.inferenceOKButton = this.setSelectableText(inferenceOKF, 'OK', this.okGrp);
        eix += textWidth('[', 18) + 4;
        this.inferenceOKButton.setAA(['x', eix, 'y', cy]);
        const okEnd = this.setText(']', this.okGrp);
        eix += textWidth('OK', 18) + 2;
        okEnd.setAA(['x', eix, 'y', cy]);
        //
        // 
        //
        const proofRect = new SVGElt('rect');
        let prx = 10;
        let pry = 170;
        proofRect.setAA(['x', prx, 'y', pry - 25, 'width', width - 20, 'height', height - pry + 15, 'fill', 'white']);
        this.g.append(proofRect);
        const hh = new SVGText();
        hh.setV('hypotheses');
        hh.setAA(['x', prx + 5, 'y', pry + 5 - 5, 'font-size', 12, 'stroke', 'black']);
        this.g.append(hh);
        const listFontSize = 16;
        this.htl = new SelectableTextList(cbfF, { maxLineCharCnt: 45, fontSize: listFontSize, maxDisplayLines: 4, id: 'H' });
        this.g.append(this.htl);
        this.htl.setAA(['x', prx + 5, 'y', pry + 5]);
        this.g.append(this.htl);
        const ts = new SVGText();
        ts.setV(proofOp);
        const fw = this.htl.frame.getN('width');
        const fh = this.htl.frame.getN('height');
        ts.setAA(['x', prx + fw + 15, 'y', pry + 1 / 2 * fh + 15, 'font-size', 30, 'stroke', 'black']);
        this.g.append(ts);
        const ccX = prx + fw + 15 + textWidth(proofOp, 30) + 5;
        const ccY = pry + 1.6 * listFontSize + 5;
        const ccW = width - ccX - 80;
        const ccH = listFontSize + 8;
        const conclusionRect = new SVGElt('rect');
        const ch = new SVGText();
        ch.setV('conclusion');
        this.g.append(ch);
        ch.setAA(['x', ccX, 'y', ccY - 5, 'font-size', 12, 'stroke', 'black']);
        conclusionRect.setAA(['x', ccX, 'y', ccY, 'width', ccW, 'height', ccH,
            'stroke', 'black', 'stroke-width', 1, 'fill', 'none']);
        this.g.append(conclusionRect);
        this.conclusion = new SVGText();
        this.conclusion.setV('a conclusion');
        this.conclusion.setAA(['x', ccX + 7, 'y', ccY + 2 / 3 * listFontSize + 6,
            'font-size', listFontSize, 'stroke', 'black']);
        this.g.append(this.conclusion);
        //
        //
        const ih = new SVGText();
        this.g.append(ih);
        ih.setV('inferences');
        ih.setAA(['x', prx + 20, 'y', pry + fh + 35 - 5, 'font-size', 12, 'stroke', 'black']);
        this.itl = new SelectableTextList(cbfF, { maxLineCharCnt: 50, fontSize: listFontSize, maxDisplayLines: 6, id: 'I' });
        this.g.append(this.itl);
        this.itl.setAA(['x', prx + 20, 'y', pry + fh + 35]);
        //
        //
        const fs = 18;
        const fW = this.itl.getN('width');
        const fH = this.itl.getN('height');
        let hx = prx + 20 + fW + 30;
        let hy = pry + fh + 1 / 2 * fH;
        const hW = textWidth('temporary hypothesis', 12) + 10;
        const hH = 2 * fs + 50;
        this.tempHypSVG = new SVGElt('svg');
        this.g.append(this.tempHypSVG);
        this.tempHypSVG.setAA(['x', hx, 'y', hy, 'width', hW, 'height', hH]);
        hx = 1;
        hy = 10;
        const rH = 2 * fs + 10;
        const thh = new SVGText();
        this.tempHypSVG.append(thh);
        thh.setV('temporary hypothesis');
        thh.setAA(['x', hx, 'y', hy, 'font-size', 12, 'stroke', 'black']);
        const hypRect = new SVGElt('rect');
        this.tempHypSVG.append(hypRect);
        hy += 5;
        hypRect.setAA(['x', hx, 'y', hy, 'width', hW - 5, 'height', rH,
            'stroke', 'black', 'stroke-width', 1, 'fill', 'white']);
        hx += 7;
        hy += 2 / 3 * fs + 5;
        const hypRefStart = this.setText('[', this.tempHypSVG);
        hypRefStart.setAA(['x', hx, 'y', hy]);
        hx += textWidth('[', fs) + 4;
        this.hypRef = this.setSelectableText(this.hypRefer, 'refer to', this.tempHypSVG);
        this.hypRef.setAA(['x', hx, 'y', hy, 'pointer-events', 'none']);
        hx += textWidth('refer to', fs) + 4;
        const hyRefEnd = this.setText(']', this.tempHypSVG);
        hyRefEnd.setAA(['x', hx, 'y', hy]);
        hx = 6;
        hy += fs + 2;
        const hypCloseStart = this.setText('[', this.tempHypSVG);
        hypCloseStart.setAA(['x', hx, 'y', hy]);
        hx += textWidth('[', fs) + 4;
        this.hypCls = this.setSelectableText(this.hypClsBtnHandler, 'close', this.tempHypSVG);
        this.hypCls.setAA(['x', hx, 'y', hy, 'pointer-events', 'none']);
        this.hypCls.setAble(false);
        const hyEnd = this.setText(']', this.tempHypSVG);
        hx += textWidth('close', fs) + 4;
        hyEnd.setAA(['x', hx, 'y', hy]);
        this.clr();
    }
    hSetList() {
        const [boxX, boxW] = this.htl.box.getAN(['x', 'width']);
        const boxEnd = boxX + boxW;
        const sw = textWidth('&nbsp', this.htl.fontSize);
        const sc = Math.floor((boxW - 20) / sw);
        const endX = boxEnd - sw * 10;
        //console.log(`boxX ${boxX} boxW ${boxW} sw ${sw} sc ${sc} endX ${endX}`)
        const hl = this.hList.map((e, p) => {
            const txt = new SVGText();
            txt.setAA(['font-size', this.htl.fontSize, 'stroke', disabledColor, 'pointer-events', 'none']);
            txt.setV('&nbsp'.repeat(sc));
            const startTxt = new SVGTSpan(txt);
            startTxt.setV(e.expFmt);
            startTxt.setA('x', 10);
            const endTxt = new SVGTSpan(txt);
            const endTxtVal = `H${p + 1}`;
            endTxt.setV(endTxtVal);
            endTxt.setA('x', endX);
            return txt;
        });
        this.htl.setList(hl);
    }
    iSetList(inf) {
        this.iList.push(inf);
        const [boxX, boxW] = this.itl.box.getAN(['x', 'width']);
        const boxEnd = boxX + boxW;
        const sw = textWidth('&nbsp', this.itl.fontSize);
        const sc = Math.floor((boxW - 20) / sw);
        const endX = boxEnd - sw * 20;
        const ruleX = endX - sw * 20;
        //console.log(`boxX ${boxX} boxW ${boxW} sw ${sw} sc ${sc} endX ${endX}`)
        const il = this.iList.map((inf, p) => {
            const txt = new SVGText();
            txt.setAA(['font-size', this.itl.fontSize, 'stroke', disabledColor, 'pointer-events', 'none']);
            txt.setV('&nbsp'.repeat(sc));
            const startTxt = new SVGTSpan(txt);
            let startTxtVal = inf.expFmt;
            if (inf.oc == 'O') {
                startTxtVal = '[ '.concat(startTxtVal);
            }
            else if (inf.oc == 'C') {
                startTxtVal = '] '.concat(startTxtVal);
            }
            else if (inf.oc == 'A') {
                startTxtVal = startTxtVal.concat(' ]');
            }
            //console.log(`stv ${startTxtVal}`)
            startTxt.setV(startTxtVal);
            startTxt.setA('x', 10 + 5 * this.hypotheticals.length);
            const ruleTxt = new SVGTSpan(txt);
            const ruleTxtVal = this.ruleTxtValSet(inf);
            ruleTxt.setV(ruleTxtVal);
            ruleTxt.setA('x', ruleX);
            const endTxt = new SVGTSpan(txt);
            let endTxtVal = ` \u21D2 I${p + 1}`;
            endTxt.setV(endTxtVal);
            endTxt.setA('x', endX);
            return txt;
        });
        this.itl.setList(il);
    }
    inClosedHypothesis(p) {
        this.closedHypotheticals.forEach(ch => {
            if (p >= ch.s && p < ch.e)
                return true;
        });
        return false;
    }
    mainOp(prop) {
        const tree = ttd.bldTree(prop.exp);
        return 'aieo'.indexOf(tree.nodeType);
    }
    ruleTxtValSet(inf) {
        const opSym = ruleList[inf.op];
        const ieSym = (inf.op == 5) ? '' : (inf.ie == 0) ? subi : sube;
        const sideSym = (inf.side == 0) ? subl : (inf.side == 1) ? subr : '';
        let args = '';
        inf.args.forEach(arg => {
            args = args.concat(`&nbsp&nbsp${arg.source}${arg.pos + 1}`);
        });
        const rv = '['.concat(opSym, ieSym, sideSym, args, ']');
        return rv;
    }
    setText(text, grp) {
        const color = 'black';
        const fontSize = 18;
        const txt = new SVGText();
        if (grp) {
            grp.append(txt);
        }
        else {
            this.g.append(txt);
        }
        txt.setV(text);
        txt.setAA(['font-size', fontSize, 'stroke', color]);
        return txt;
    }
    setRB(rbset, text, grp) {
        const fontSize = 18;
        const rb = new SVGText();
        rb.setV(text);
        if (grp) {
            grp.append(rb);
        }
        else {
            this.g.append(rb);
        }
        rb.setAA(['font-size', fontSize, 'stroke', colors.std]);
        rb.elt.addEventListener('mouseover', (ev) => {
            const target = ev.target;
            const op = Elt.wrapper(target);
            op.setA('stroke', colors.over);
        });
        rb.elt.addEventListener('mouseout', (ev) => {
            if (rbset.choice == -1) {
                const target = ev.target;
                const sel = Elt.wrapper(target);
                sel.setA('stroke', colors.std);
            }
        });
        rb.elt.addEventListener('click', (ev) => {
            const target = ev.target;
            const sel = Elt.wrapper(target);
            rbset.widgets.forEach((rb, p) => {
                if (sel == rb) {
                    rbset.choice = p;
                    sel.setA('stroke', colors.selected);
                }
                else {
                    rb.setA('stroke', colors.std);
                }
            });
            this.choicesSet();
        });
        rbset.widgets.push(rb);
        return rb;
    }
    choicesSet() {
        if (this.opWidgets.choice > -1 && this.eiWidgets.choice > -1 && this.sideWidgets.choice > -1) {
            this.setGrpState(this.okGrp, true);
        }
        else if (this.opWidgets.choice > -1 && this.eiWidgets.choice > -1) {
            if ((this.opWidgets.choice == 0 && this.eiWidgets.choice == 1) ||
                (this.opWidgets.choice == 2 && this.eiWidgets.choice == 1) ||
                (this.opWidgets.choice == 3 && this.eiWidgets.choice == 0)) {
                this.setGrpState(this.sideGrp, true);
            }
            else {
                this.setGrpState(this.okGrp, true);
            }
        }
    }
    setSelectableText(fn, text, grp) {
        const fontSize = 18;
        const st = new SVGSelectableText(fn, text, true, undefined, colors);
        if (grp) {
            grp.append(st);
        }
        else {
            this.g.append(st);
        }
        st.setA('font-size', fontSize);
        return st;
    }
    startInf() {
        this.opWidgets.widgets.forEach(w => { w.setA('stroke', colors.std); });
        this.eiWidgets.widgets.forEach(w => { w.setA('stroke', colors.std); });
        this.sideWidgets.widgets.forEach(w => { w.setA('stroke', colors.std); });
        this.opWidgets.choice = -1;
        this.eiWidgets.choice = -1;
        this.sideWidgets.choice = -1;
        this.setGrpState(this.sideGrp, false);
        this.setGrpState(this.okGrp, false);
        this.setGrpState(this.chooseGrp, true);
        this.setTempHypState(false);
        this.inferenceOKButton.setAble(true);
    }
    clr() {
        console.log('clear called');
        this.status = 'empty';
        this.statusLine.setV('empty');
        this.statusLine.setA('stroke', 'black');
        this.hList = [];
        this.htl.setList([]);
        this.iList = [];
        this.itl.setList([]);
        this.hypotheticals = [];
        this.conclusion.setV('');
        this.setGrpState(this.addGrp, true);
        this.setGrpState(this.clrGrp, false);
        this.setGrpState(this.chooseGrp, false);
        this.setGrpState(this.sideGrp, false);
        this.setGrpState(this.okGrp, false);
        this.setTempHypState(false);
        this.inferenceOKButton.setAble(true);
    }
    clrInf() {
        console.log('clr inf');
        this.status = 'building';
        this.statusLine.setV('build underway');
        this.startInf();
    }
    endCk() {
        if (this.iList.length > 0) {
            const target = this.cVal.exp;
            console.log(`iList.len ${this.iList.length}`);
            const current = this.iList[this.iList.length - 1].exp;
            const targetCanonical = treeToExp(ttd.bldTree(target));
            const currentCanonical = treeToExp(ttd.bldTree(current));
            if (targetCanonical == currentCanonical) {
                this.status = 'proved';
                this.statusLine.setV('Proof Built \u220E');
                this.statusLine.setA('stroke', 'green');
                this.setGrpState(this.addGrp, false);
                this.setGrpState(this.chooseGrp, false);
                this.setGrpState(this.sideGrp, false);
                this.setGrpState(this.okGrp, false);
                this.setTempHypState(false);
            }
            else {
                this.clrInf();
            }
        }
    }
    addH() {
        this.propFor = 'H';
        this.addProp();
    }
    addC() {
        this.propFor = 'C';
        this.addProp();
    }
    disableSelections() {
        this.htl.list.forEach(e => {
            e.setAA(['stroke', disabledColor, 'pointer-events', 'none']);
        });
        this.itl.list.forEach(e => {
            e.setAA(['stroke', disabledColor, 'pointer-events', 'none']);
        });
    }
    initSelection(op) {
        let eflag = false;
        this.htl.list.forEach((e, p) => {
            if (op == undefined) {
                e.setAA(['stroke', baseColor, 'pointer-events', 'auto']);
                eflag = true;
            }
            else {
                const prop = this.hList[p];
                if (this.mainOp(prop) == op) {
                    e.setAA(['stroke', baseColor, 'pointer-events', 'auto']);
                    eflag = true;
                }
            }
        });
        this.itl.list.forEach((e, p) => {
            if (!this.inClosedHypothesis(p)) {
                if (op == undefined) {
                    e.setAA(['stroke', baseColor, 'pointer-events', 'auto']);
                    eflag = true;
                }
                else {
                    const inf = this.iList[p];
                    if (this.mainOp(inf) == op) {
                        e.setAA(['stroke', baseColor, 'pointer-events', 'auto']);
                        eflag = true;
                    }
                }
            }
        });
        return eflag;
    }
    inferenceOK() {
        this.inferenceOKButton.setAble(false);
        const opc = this.opWidgets.choice;
        const iec = this.eiWidgets.choice;
        const sc = this.sideWidgets.choice;
        //console.log(`opc ${opc} eic ${eic} sc ${sc}`)
        if (opc == 0) { // and rules
            if (iec == 0) { //introduction
                this.selectionTarget = { op: 0, ie: 0, arg: 0 };
                this.initSelection();
                this.statusLine.setV('choose a for a \u2227 b from hypotheses or inferences');
            }
            else { // and elimination
                this.selectionTarget = { op: 0, ie: 1, arg: 0 };
                if (this.initSelection(0)) {
                    this.statusLine.setV("choose a \u2227-proposition from hypotheses or inferences");
                }
                else {
                    this.statusLine.setV('no \u2227-proposition is available for selection');
                    this.clrInf();
                }
            }
        }
        else if (opc == 1) { // implication rules
            if (iec == 0) { // introduction
                this.selectionTarget = { op: 1, ie: 0, arg: 0 };
                this.propFor = 'HI';
                this.addProp();
            }
            else { // inplication elimination
                this.selectionTarget = { op: 1, ie: 1, arg: 0 };
                if (this.initSelection(1)) {
                    this.statusLine.setV("choose a \u2192-proposition from hypotheses or inferences");
                }
                else {
                    this.statusLine.setV('no \u2192-proposition is available for selection');
                    this.clrInf();
                }
            }
        }
        else if (opc == 2) { // equivalence rules
            if (iec == 0) { // introduction
                this.selectionTarget = { op: 2, ie: 0, arg: 0 };
                this.propFor = 'HI';
                this.addProp();
            }
            else { // equivalence elimination
                this.selectionTarget = { op: 2, ie: 1, arg: 0 };
                if (this.initSelection(1)) {
                    this.statusLine.setV("choose a \u2194-proposition from hypotheses or inferences");
                }
                else {
                    this.statusLine.setV('no \u2194-proposition is available for selection');
                    this.clrInf();
                }
            }
        }
        else if (opc == 3) // or rules
            if (iec == 0) { // introduction
                this.initSelection();
                this.statusLine.setV('choose a prop from hypotheses or inferences');
            }
            else { // or elimination
                this.selectionTarget = { op: 3, ie: 1, arg: 0 };
                if (this.initSelection(1)) {
                    this.statusLine.setV("choose a \u2228-proposition from hypotheses or inferences");
                }
                else {
                    this.statusLine.setV('no \u2228-proposition is available for selection');
                    this.clrInf();
                }
            }
        else { // not rules
            if (iec == 0) { // introduction
                this.selectionTarget = { op: 4, ie: 0, arg: 0 };
                this.propFor = 'HI';
                this.addProp();
            }
        }
        this.hypChks();
    }
    cbf(tl, pos) {
        //console.log(`source ${tl.id} pos ${pos}`)
        const opPos = this.selectionTarget.op;
        const iePos = this.selectionTarget.ie;
        const argPos = this.selectionTarget.arg;
        const prop = (tl.id == 'H') ? this.hList[pos] : this.iList[pos];
        const tree = ttd.bldTree(prop.exp);
        this.disableSelections();
        //console.log(`opPos ${opPos} iePos ${iePos} arg ${argPos} pos ${pos}`)
        if (opPos == 0) { // and rules
            if (iePos == 0) { // and intro rule
                if (argPos == 0) {
                    this.arg1 = { source: tl.id, pos };
                    this.p1 = this.bracketArgIfNeeded(this.arg1, tree);
                    this.initSelection();
                    this.statusLine.setV('choose b for a \u2227 b from hypotheses or inferences');
                    this.selectionTarget.arg = 1;
                }
                else if (argPos == 1) {
                    this.arg2 = { source: tl.id, pos };
                    this.p2 = this.bracketArgIfNeeded(this.arg2, tree);
                    const newExp = this.p1.concat(PXE.andChar, this.p2);
                    const fmt = PXE.fmt(newExp);
                    console.log(`p1 ${this.p1} p2 ${this.p2} exp ${newExp} fmt ${fmt}`);
                    const inf = { exp: newExp, expFmt: fmt, op: opPos, ie: iePos, args: [this.arg1, this.arg2] };
                    this.iSetList(inf);
                    this.endCk();
                }
            }
            else if (iePos == 1) { // and elim rule
                this.arg1 = { source: tl.id, pos };
                const sidePos = this.sideWidgets.choice;
                const subtree = (sidePos == 0) ? tree.left : tree.right;
                ttd.printTree(subtree);
                const exp = treeToExp(subtree);
                console.log(`exp ${exp} len ${exp.length} side ${sidePos} swp ${this.sideWidgets.choice}`);
                const fmt = PXE.fmt(exp);
                const inf = { exp: exp, expFmt: fmt, op: opPos, ie: iePos, side: sidePos, args: [this.arg1] };
                this.iSetList(inf);
                this.endCk();
            }
        }
        else if (opPos == 1 && iePos == 1) { // implication elimination rule
            const treeLeft = tree.left;
            const lexp = treeToExp(treeLeft);
            let args = [];
            let exp = '';
            this.hList.forEach((e, p) => {
                const hexp = treeToExp(ttd.bldTree(e.exp));
                if (hexp == lexp) {
                    exp = hexp;
                    args = [{ source: 'H', pos: p }, { source: 'I', pos: pos }];
                }
            });
            if (exp == '') {
                this.iList.forEach((e, p) => {
                    const iexp = treeToExp(ttd.bldTree(e.exp));
                    if (iexp == lexp) {
                        exp = iexp;
                        args = [{ source: 'I', pos: p }, { source: 'I', pos: pos }];
                    }
                });
            }
            if (exp != '') {
                const treeRight = tree.right;
                const rexp = treeToExp(treeRight);
                const rfmt = PXE.fmt(rexp);
                const inf = { exp: rexp, expFmt: rfmt, op: 1, ie: 1, args: args };
                this.iSetList(inf);
                this.endCk();
            }
            else {
                this.statusLine.setV('no hypothesis or inference matches implication premise');
                this.clrInf();
            }
        }
        else if (opPos == 2 && iePos == 1) { // equivalence elimination rule
            const sidePos = this.sideWidgets.choice;
            const treeSide = (sidePos == 0) ? tree.left : tree.right;
            const sexp = treeToExp(treeSide);
            let args = [];
            let exp = '';
            this.hList.forEach((e, p) => {
                const hexp = treeToExp(ttd.bldTree(e.exp));
                if (hexp == sexp) {
                    exp = hexp;
                    args = [{ source: 'H', pos: p }, { source: 'I', pos: pos }];
                }
            });
            if (exp == '') {
                this.iList.forEach((e, p) => {
                    const iexp = treeToExp(ttd.bldTree(e.exp));
                    if (iexp == sexp) {
                        exp = iexp;
                        args = [{ source: 'I', pos: p }, { source: 'I', pos: pos }];
                    }
                });
            }
            if (exp != '') {
                const treeOther = (sidePos == 0) ? tree.right : tree.left;
                const oexp = treeToExp(treeOther);
                const ofmt = PXE.fmt(oexp);
                const inf = { exp: oexp, expFmt: ofmt, op: 2, ie: 1, args: args };
                this.iSetList(inf);
                this.endCk();
            }
            else {
                const side = (sidePos == 0) ? 'left' : 'right';
                this.statusLine.setV(`no hypothesis or inference matches equyivalence ${side} side`);
                this.clrInf();
            }
        }
        else if (opPos == 3) { // or rules
            if (iePos == 0) { // introduction
                this.arg1 = { source: tl.id, pos };
                this.propFor = 'OR';
                this.addProp();
            }
            else { // or elimination
                const tl = tree.left;
                const h1 = treeToExp(tl);
                const fmt = PXE.fmt(h1);
                const inf = { exp: h1, expFmt: fmt, op: opPos, ie: iePos, args: [], oc: 'O' };
                this.iSetList(inf);
                const tr = tree.right;
                const hyp = { pos: this.iList.length, cycle: -1, h2: treeToExp(tr) };
                this.hypotheticals.push(hyp);
                this.handleHyp(hyp);
            }
        }
        else if (opPos == 7) { // reference
            const inf = { exp: prop.exp, expFmt: prop.expFmt, op: 5, ie: 0, args: [{ source: tl.id, pos }] };
            this.iSetList(inf);
            this.endCk();
        }
    }
    peReturn(f, exp, expFmt) {
        //console.log(`f ${f} exp ${exp} exp-fmt ${expFmt} propFor ${this.propFor}`)
        if (f) {
            const rv = { exp: exp, expFmt: expFmt };
            if (this.propFor == 'H') {
                this.hList.push(rv);
                this.hSetList();
            }
            else if (this.propFor == 'C') {
                this.cVal = rv;
                this.conclusion.setV(rv.expFmt);
            }
            else if (this.propFor == 'HI') {
                const opPos = this.selectionTarget.op;
                const iePos = this.selectionTarget.ie;
                const side = this.selectionTarget.side;
                if ([1, 2, 4].includes(opPos) && iePos == 0) {
                    const fmt = PXE.fmt(exp);
                    const inf = { exp: exp, expFmt: fmt, op: opPos, ie: iePos, args: [], oc: 'O' };
                    this.iSetList(inf);
                    const hyp = { pos: this.iList.length, cycle: -1 };
                    this.hypotheticals.push(hyp);
                    this.handleHyp(hyp);
                }
                return;
            }
            else if (this.propFor == 'OR') {
                const prop = this.argToProp(this.arg1);
                const orExp = treeToExp(ttd.bldTree(`[${prop}]o[${exp}]`));
                const fmt = PXE.fmt(orExp);
                const inf = { exp: orExp, expFmt: fmt, op: 3, ie: 0, args: [this.arg1] };
                this.iSetList(inf);
            }
            this.status = 'building';
            this.statusLine.setV('build underway');
            this.setGrpState(this.clrGrp, true);
            if (this.hList.length > 0 && this.conclusion.getV() != '') {
                this.startInf();
            }
        }
    }
    argToProp(arg) {
        const sl = (arg.source == 'H') ? this.hList : this.iList;
        return sl[arg.pos].exp;
    }
    addProp() {
        ttd.setProofBuilder(this);
        Nav.fo.removeChildren();
        Nav.fo.append(ttd);
        PXE.clear();
        ttd.layoutEditor();
        Nav.display();
    }
    hypRefer() {
        // hypothetical reference
        this.initSelection();
        this.selectionTarget = { op: 5, ie: 0, arg: 0 };
        this.statusLine.setV('select prop from hypotheses or inferences');
    }
    setTempHypState(state) {
        const vstate = (state) ? 'visible' : 'hidden';
        this.tempHypSVG.setA('visibility', vstate);
        const pstate = (state) ? 'none' : 'auto';
        this.hypRef.setA('pointer-events', pstate);
        this.hypCls.setA('pointer-events', pstate);
    }
    hypChks() {
        const hl = this.hypotheticals.length;
        if (hl > 0) {
            const hyp = this.hypotheticals[hl - 1];
            const hypInf = this.iList[hyp.pos];
            if (this.hypCls.getA('visibility') == 'visible' &&
                this.hypCls.getA('pointer-events') == 'none') {
                this.hypCls.setAble(true);
            }
            if (hyp.cycle > -1) {
                const inf = this.iList[this.iList.length - 1];
                const endCycleInf = this.iList[hyp.cycle];
                const eci = treeToExp(ttd.bldTree(endCycleInf.exp));
                const ci = treeToExp(ttd.bldTree(inf.exp));
                if (eci == ci) {
                    this.hypClose();
                }
            }
            if (hypInf.op == 4 && this.contradictoryState()) {
                this.hypClose();
            }
        }
    }
    contradictoryState() {
        const exp = this.iList[this.iList.length - 1].exp;
        this.hList.forEach(e => {
            if (this.contradiction(exp, e.exp)) {
                return true;
            }
        });
        this.iList.forEach(e => {
            if (this.contradiction(exp, e.exp)) {
                return true;
            }
        });
        return false;
    }
    contradiction(exp1, exp2) {
        const t1 = ttd.bldTree(exp1);
        const t2 = ttd.bldTree(exp2);
        if (t1.negations % 2 != t2.negations % 2) {
            const t3 = (t1.negations < t2.negations) ? t1 : t2;
            const t4 = (t1.negations < t2.negations) ? t2 : t1;
            t3.negations++;
            if (treeToExp(t3) == treeToExp(t4)) {
                return true;
            }
        }
        return false;
    }
    handleHyp(hyp) {
        this.setTempHypState(true);
        const hypInf = this.iList[hyp.pos];
        let visibility = 'hidden';
        let setable = false;
        if ((hypInf.op == 1 && hypInf.ie == 0) ||
            (hypInf.op == 2 && hypInf.ie == 0 && hyp.cycle == -1) ||
            (hypInf.op == 3 && hypInf.ie == 1 && hyp.cycle == -1)) {
            this.hypCls.setA('visibility', 'visible');
        }
        else {
            this.hypCls.setAA(['visibility', 'hidden']);
        }
        this.hypCls.setAble(false);
        this.hypRef.setAble(true);
    }
    hypClsBtnHandler() {
        const hyp = this.hypotheticals[this.hypotheticals.length];
        const hypInf = this.iList[hyp.pos];
        if (hypInf.op == 1) {
            this.hypClose();
        }
        else {
            hyp.cycle = this.iList.length;
            hypInf.oc = 'A';
            const exp = (hypInf.op == 2) ? this.iList[this.iList.length].exp : hyp.h2;
            const fmt = PXE.fmt(exp);
            const inf = { exp: exp, expFmt: fmt, op: hypInf.op, ie: hypInf.ie, args: [], oc: 'O' };
            this.iSetList(inf);
        }
    }
    hypClose() {
        const hyp = this.hypotheticals[this.hypotheticals.length];
        this.hypotheticals.pop();
        this.closedHypotheticals.push({ s: hyp.pos, e: this.iList.length });
        const hypInf = this.iList[hyp.pos];
        const inf = this.iList[this.iList.length - 1];
        let exp = '';
        if (hypInf.op == 1) {
            exp = this.getBinExp('i', hypInf.exp, inf.exp);
        }
        else if (hypInf.op == 2) {
            const cycInf = this.iList[hyp.cycle];
            exp = this.getBinExp('e', hypInf.exp, cycInf.exp);
        }
        else if (hypInf.op == 3) {
            exp = treeToExp(ttd.bldTree(inf.exp));
        }
        else if (hypInf.op == 4) {
            exp = treeToExp(ttd.bldTree(`n[${hypInf.exp}]`));
        }
        const fmt = PXE.fmt(exp);
        const newInf = { exp: exp, expFmt: fmt, op: hypInf.op, ie: hypInf.ie, args: [], oc: 'C' };
        this.iSetList(inf);
        this.setTempHypState(false);
    }
    getBinExp(op, exp1, exp2) {
        const rawExp = `[${exp1}]${op}[${exp2}]`;
        const tree = ttd.bldTree(rawExp);
        return treeToExp(tree);
    }
    bracketArgIfNeeded(arg, node) {
        let exp = (arg.source == 'H') ? this.hList[arg.pos].exp : this.iList[arg.pos].exp;
        console.log(`arg ${arg} exp ${exp}`);
        if (!['p', 'q', 'r', 's'].includes(node.nodeType)) {
            exp = '['.concat(exp, ']');
        }
        return exp;
    }
    setGrpState(grp, state) {
        const visibility = (state) ? 'visible' : 'hidden';
        const pointer = (state) ? 'auto' : 'none';
        grp.setAA(['visibility', visibility, 'pointer-events', pointer]);
    }
}
function clrF() { pb.clr(); }
function addHF() { pb.addH(); }
function addCF() { pb.addC(); }
function inferenceOKF() { pb.inferenceOK(); }
function cbfF(tl, pos) { pb.cbf(tl, pos); }
function treeToExp(tree) {
    const tt = tree.nodeType;
    const lb = PXE.setKeyCode(PXE.lb);
    const rb = PXE.setKeyCode(PXE.rb);
    const negSign = PXE.setKeyCode(PXE.negChar);
    let ls = (tree.left) ? treeToExp(tree.left) : '';
    let rs = (tree.right) ? treeToExp(tree.right) : '';
    let exp = tt;
    if (!['p', 'q', 'r', 's'].includes(tt)) {
        const wl = needToWrap(tree, 'L');
        const wr = needToWrap(tree, 'R');
        let lse = (wl) ? `[${ls}]` : ls;
        let rse = (wr) ? `[${rs}]` : rs;
        exp = lse.concat(exp, rse);
    }
    if (tree.negations % 2 != 0) {
        if (!['p', 'q', 'r', 's'].includes(tt)) {
            exp = `[${exp}]`;
        }
    }
    return exp;
}
function salience(node) {
    const nt = node.nodeType;
    let rv = 0;
    if (['a', 'o'].includes(nt)) {
        rv = 1;
    }
    else if (nt == 'i') {
        rv = 2;
    }
    else if (nt == 'e') {
        rv = 3;
    }
    return rv;
}
function maxSal(node, max = 0) {
    let rv = salience(node);
    rv = Math.max(rv, max);
    const ls = (node.left) ? maxSal(node.left, rv) : 0;
    const rs = (node.right) ? maxSal(node.right, rv) : 0;
    rv = Math.max(rv, ls, rs);
    return rv;
}
function needToWrap(node, sideIndicator) {
    let rv = false;
    const ns = salience(node);
    console.log(`node type ${node.nodeType} node salience ${ns}`);
    let side = (sideIndicator == 'L') ? node.left : node.right;
    if (!['p', 'q', 'r', 's'].includes(side.nodeType)) {
        const ms = maxSal(side);
        rv = (ms <= ns);
    }
    return rv;
}
