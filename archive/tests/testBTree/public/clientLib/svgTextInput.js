import { SVGElt, SVGText, SVGGrpElt } from './svgElt.js';
//
let that;
export class SVGTextInput extends SVGGrpElt {
    maxTextLength;
    blinkId = 0;
    blinkState = 'visible';
    exp = '';
    frame;
    txtFrame;
    txt;
    caret;
    clearButton;
    txtX = 0;
    caretY1 = 0;
    caretY2 = 0;
    //
    fontSize = 18;
    fontPadding = 4;
    fontColor = 'black';
    frameBG = 'beige';
    txtFrameBG = 'ivory';
    margin = 4;
    activeC = 'blue';
    disabledC = 'grey';
    overC = 'purple';
    constructor(maxTextLength, headerTxt = '', currentText = '') {
        super();
        this.maxTextLength = maxTextLength;
        that = this;
        this.frame = new SVGElt('rect');
        this.txtFrame = new SVGElt('rect');
        this.txt = new SVGText();
        this.caret = new SVGElt('line');
        this.clearButton = new SVGText();
        this.append(this.frame);
        this.append(this.txtFrame);
        this.append(this.txt);
        this.append(this.caret);
        this.append(this.clearButton);
        //
        const textRectHeight = this.fontSize + 2 * this.fontPadding;
        const rectHeight = textRectHeight + 2 * this.margin;
        let x = this.margin;
        const y = this.margin + 2 / 3 * textRectHeight;
        if (headerTxt.length > 0) {
            const header = new SVGText();
            this.append(header);
            header.setV(headerTxt);
            header.setAA(['x', x, 'y', y, 'font-size', this.fontSize, 'stroke', this.fontColor]);
            const headerWidth = header.getTextWidth();
            x = x + headerWidth + this.fontPadding;
        }
        const txtFrameX = x;
        x = x + this.fontPadding + 1;
        this.txtX = x;
        this.txt.setAA(['x', x, 'y', y, 'font-size', this.fontSize, 'stroke', this.fontColor]);
        const maxWidth = this.txt.getEstimatedMaxWidth(30);
        this.txt.setV(currentText);
        x = txtFrameX + maxWidth + 2 * this.fontPadding + 1;
        //
        this.clearButton.setAA(['x', x, 'y', y, 'font-size', this.fontSize]);
        this.clearButton.setV('clear');
        const clearWidth = this.clearButton.getTextWidth();
        const rectWidth = x + clearWidth + this.fontPadding + this.margin + 2;
        //
        this.frame.setAA(['x', 0, 'y', 0, 'width', rectWidth, 'height', rectHeight,
            'fill', this.frameBG, 'stroke', 'purple']);
        this.setFrameHandlers();
        this.txtFrame.setAA(['x', txtFrameX, 'y', this.margin, 'width', maxWidth, 'height', textRectHeight,
            'fill', this.txtFrameBG]);
        this.caret.setA('stroke', 'red');
        this.caretY1 = this.margin + this.fontPadding;
        this.caretY2 = this.caretY1 + textRectHeight - 2 * this.fontPadding;
        this.setFrameHandlers();
        this.setClearButtonHandlers();
        this.displayText();
    }
    layout() { }
    static handleInput(e) { that.handleInput(e); }
    handleInput(e) {
        const key = e.key;
        //console.log(`key ${key}`)
        if (key == 'Backspace') {
            if (this.exp.length > 0) {
                this.exp = this.exp.substring(0, this.exp.length - 1);
                this.displayText();
            }
        }
        else if (this.exp.length < this.maxTextLength && !['Shift'].includes(key)) {
            this.exp = this.exp.concat(key);
            this.displayText();
        }
    }
    displayText() {
        this.txt.setV(this.exp);
        this.placeCaret();
        this.setClearButtonState();
    }
    placeCaret() {
        const txtWidth = this.txt.getBB().width;
        const x = this.txtX + txtWidth + 2;
        this.caret.setAA(['x1', x, 'y1', this.caretY1, 'x2', x, 'y2', this.caretY2]);
    }
    static blinkCaret() { that.blinkCaret(); }
    blinkCaret() {
        this.blinkState = (this.blinkState == 'visible') ? 'hidden' : 'visible';
        this.caret.setA('visibility', this.blinkState);
    }
    setFrameHandlers() {
        this.txtFrame.elt.addEventListener('mouseover', () => {
            document.addEventListener("keyup", SVGTextInput.handleInput);
            if (this.blinkId != 0) {
                window.clearInterval(this.blinkId);
            }
            this.blinkId = window.setInterval(SVGTextInput.blinkCaret, 500);
        });
        this.txtFrame.elt.addEventListener('mouseout', () => {
            document.removeEventListener("keyup", SVGTextInput.handleInput);
            window.clearInterval(this.blinkId);
            this.blinkId = 0;
        });
    }
    setClearButtonHandlers() {
        this.clearButton.elt.addEventListener('mouseover', ev => {
            this.clearButton.setA('stroke', this.overC);
        });
        this.clearButton.elt.addEventListener('mouseout', ev => {
            //this.clearButton.setA('stroke',this.activeC)
            this.setClearButtonState();
        });
        this.clearButton.elt.addEventListener('click', ev => {
            this.exp = '';
            this.displayText();
        });
    }
    setClearButtonState() {
        const [bs, bc] = (this.exp.length > 0) ? ['all', this.activeC] : ['none', this.disabledC];
        this.clearButton.setAA(['pointer-events', bs, 'stroke', bc]);
    }
}
