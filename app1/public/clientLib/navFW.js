import { Elt } from './elt.js';
import { SVGElt, SVGText, SVGTSpan, textWidth } from './svgElt.js';
import { Index } from './navIndex.js';
import { Sed } from './editor.js';
import { initAnyDJSI, displayAnyDJSI } from './ida.js';
export class Nav {
    static app;
    static parent;
    static cb;
    static segDiv;
    static frame;
    static line;
    static lineRect;
    static lineBlock;
    static lineArrowButton;
    static lineTopics;
    static textSizeControl;
    static feedbackControl;
    static returnControl;
    static index;
    static indexRect;
    static foRect;
    static fo;
    static indices = [];
    static currentIndex = -1;
    static indexWidth;
    static segId;
    static segMap = new Map();
    static lastVisits = new Map();
    static editMode;
    static marginLeft;
    static marginTop;
    static color = { bg: 'beige', std: 'black', active: 'blue', over: 'purple', busy: 'orange' };
    static margin = { start: 15, init: 75, std: 25, line: 30 };
    static foWidth;
    static foHeight;
    static foPadding = 10;
    static foBgColor = 'whitesmoke';
    static width;
    static fontSize = 20;
    static sideFontSize = 14;
    static lineHeight = 40;
    static offset = 30;
    static frameMargin = 5;
    static upArrow = '\u2B9D';
    static dnArrow = '\u2B9F';
    static arrowSize = 30;
    static textFontSize = 16;
    static getTextStyle() {
        return `background-color:${Nav.foBgColor};box-sizing:border-box;width:100%;min-height:100%;padding:${Nav.foPadding}px ${Nav.foPadding + 5}px 50px ${Nav.foPadding + 5}px;font-size:${Nav.textFontSize}px;display:flow-root;`;
    }
    constructor(app, parent = null, editMode = false, cb = undefined, bgC = 'darkgoldenrod', lineC = 'beige', indexC = 'white', foC = 'aliceBlue') {
        const mainSlot = document.getElementById('main-slot');
        //
        Nav.app = app;
        Nav.parent = parent;
        Nav.cb = cb;
        Nav.segDiv = new Elt('div');
        Nav.segDiv.setA('style', Nav.getTextStyle());
        Nav.editMode = editMode;
        Nav.frame = new SVGElt('svg');
        Nav.line = new SVGElt('g');
        Nav.lineRect = new SVGElt('rect');
        Nav.lineBlock = new SVGText();
        Nav.lineArrowButton = new SVGTSpan(Nav.lineBlock);
        Nav.lineTopics = new SVGTSpan(Nav.lineBlock);
        Nav.textSizeControl = new SVGTSpan(Nav.lineBlock);
        Nav.textSizeControl.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        Nav.feedbackControl = new SVGTSpan(Nav.lineBlock);
        Nav.feedbackControl.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        Nav.returnControl = new SVGTSpan(Nav.lineBlock);
        Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        Nav.index = new SVGElt('svg');
        Nav.indexRect = new SVGElt('rect');
        Nav.foRect = new SVGElt('rect');
        Nav.fo = new SVGElt('foreignObject');
        //
        mainSlot.appendChild(Nav.frame.elt);
        Nav.frame.append(Nav.line);
        Nav.line.append(Nav.lineRect);
        Nav.line.append(Nav.lineBlock);
        Nav.frame.append(Nav.index);
        Nav.frame.append(Nav.foRect);
        Nav.frame.append(Nav.fo);
        //
        const fm = Nav.frameMargin;
        const h = Nav.lineHeight;
        const y = 2 * fm + h;
        const xp = Nav.margin.start;
        const yp = 1 / 2 * Nav.lineHeight + .6 * Nav.fontSize;
        Nav.frame.setA('style', `background-color:${bgC}`);
        Nav.line.setA('height', h);
        Nav.lineRect.setAA(['x', fm, 'y', fm, 'height', h, 'fill', `${lineC}`]);
        Nav.index.setAA(['x', 0, 'y', y]);
        Nav.indexRect.setAA(['x', 0, 'y', 0, 'fill', `${indexC}`]);
        Nav.foRect.setAA(['y', y, 'fill', `${Nav.foBgColor}`]);
        Nav.fo.setAA(['y', y, 'style', `overflow-y:auto;overflow-x:hidden;`]);
        Nav.lineArrowButton.setAA(['x', xp, 'y', yp, 'stroke', Nav.color.std, 'font-size', Nav.arrowSize]);
        Nav.lineArrowButton.setV(Nav.dnArrow);
        Nav.lineArrowButton.elt.addEventListener('click', () => { Nav.lineArrowButtonPressed(); });
        Nav.lineArrowButton.elt.addEventListener('mouseover', () => { Nav.lineArrowButton.setA('stroke', Nav.color.over); });
        Nav.lineArrowButton.elt.addEventListener('mouseout', () => { Nav.lineArrowButton.setA('stroke', Nav.color.std); });
        //
        Nav.setTextSizeControl();
        Nav.setFeedbackControl();
        Nav.setReturnControl();
        if (Nav.editMode) {
            new Sed(Nav.color);
        }
        if (Nav.parent) {
            Nav.addNavLineIndexItem('Banner', Nav.toBanner);
        }
        //
        window.onresize = () => { Nav.display(); };
        Nav.display();
    }
    //
    static toBanner(e) {
        const mainSlot = document.getElementById('main-slot');
        mainSlot.innerHTML = '';
        const p = Nav.parent;
        mainSlot.appendChild(p.elt);
    }
    // text size control addition 
    static setTextSizeControl() {
        const controls = ['[\u2191]', 'A', '[\u2193]'];
        controls.forEach(header => {
            const widget = new SVGTSpan(Nav.textSizeControl);
            widget.setA('font-size', Nav.fontSize);
            widget.setV(header);
            if (header == 'A') {
                widget.setA('stroke', Nav.color.std);
            }
            else {
                widget.setA('stroke', Nav.color.active);
                widget.elt.addEventListener('mouseover', (ev) => {
                    widget.setA('stroke', Nav.color.over);
                });
                widget.elt.addEventListener('mouseout', () => {
                    widget.setA('stroke', Nav.color.active);
                });
                //
                if (header == '[\u2191]') {
                    widget.elt.addEventListener('click', () => { Nav.changeTextSize('+'); });
                }
                else if (header == '[\u2193]') {
                    widget.elt.addEventListener('click', () => { Nav.changeTextSize('-'); });
                }
            }
        });
    }
    static setFeedbackControl() {
        const widget = new SVGTSpan(Nav.feedbackControl);
        widget.setA('font-size', Nav.fontSize);
        widget.setV('[\uD83D\uDCAC Feedback]');
        widget.setAA(['stroke', Nav.color.active, 'pointer-events', 'auto']);
        widget.elt.addEventListener('mouseover', () => {
            widget.setA('stroke', Nav.color.over);
        });
        widget.elt.addEventListener('mouseout', () => {
            widget.setA('stroke', Nav.color.active);
        });
        widget.elt.addEventListener('click', () => {
            Nav.openFeedbackModal();
        });
    }
    static setReturnControl() {
        const widget = new SVGTSpan(Nav.returnControl);
        widget.setA('font-size', Nav.fontSize);
        widget.setV('> [\u21BA Return]');
        widget.setAA(['stroke', Nav.color.active, 'pointer-events', 'auto', 'visibility', 'hidden']);
        widget.elt.addEventListener('mouseover', () => {
            widget.setA('stroke', Nav.color.over);
        });
        widget.elt.addEventListener('mouseout', () => {
            widget.setA('stroke', Nav.color.active);
        });
        widget.elt.addEventListener('click', () => {
            Nav.scrollToLectureDialogue();
        });
    }
    static onFoScroll = () => {
        Nav.updateReturnControlVisibility();
    };
    static updateReturnControlVisibility() {
        if (!Nav.fo || !Nav.fo.elt)
            return;
        const scrollTop = Nav.fo.elt.scrollTop;
        const hasAnchor = document.getElementById('jillQuestionAnchor') !== null || document.querySelector('a[name="jillQuestionAnchor"]') !== null;
        if (scrollTop > 150 || (hasAnchor && scrollTop > 60)) {
            Nav.returnControl.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        }
        else {
            Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        }
    }
    static scrollToLectureDialogue() {
        const anchor = document.getElementById('jillQuestionAnchor') || document.querySelector('a[name="jillQuestionAnchor"]');
        if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        else if (Nav.fo && Nav.fo.elt) {
            Nav.fo.elt.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setTimeout(() => {
            Nav.updateReturnControlVisibility();
        }, 400);
    }
    static changeTextSize(whichWay) {
        Nav.textFontSize += (whichWay == '+') ? 1 : -1;
        Nav.segDiv.setA('style', Nav.getTextStyle());
    }
    static setTextSizeControlPos(lineWidth) {
        const controlWidth = textWidth('[\u2191]A[\u2193]', Nav.fontSize);
        const xp = lineWidth - controlWidth - 10;
        Nav.textSizeControl.setA('x', xp);
        Nav.textSizeControl.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        const feedbackText = '[\uD83D\uDCAC Feedback]';
        const feedbackWidth = textWidth(feedbackText, Nav.fontSize);
        const fbX = xp - feedbackWidth - 15;
        Nav.feedbackControl.setA('x', fbX);
        Nav.feedbackControl.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        return fbX - 20;
    }
    static getActiveTopicTitle() {
        if (Nav.currentIndex >= 0 && Nav.currentIndex < Nav.indices.length) {
            const index = Nav.indices[Nav.currentIndex];
            if (index && index.chosen >= 0 && index.chosen < index.choices.length) {
                const choice = index.choices[index.chosen];
                if (choice && choice[0]) {
                    return choice[0].topic || 'General Curriculum';
                }
            }
        }
        return 'General Curriculum';
    }
    static openFeedbackModal() {
        const topicTitle = Nav.getActiveTopicTitle();
        const appTitle = Nav.app === 'app2' ? 'LAM Blaster Curriculum' : 'Formal Science Curriculum';
        let modal = document.getElementById('feedback-modal-overlay');
        if (modal) {
            const topicSpan = document.getElementById('feedback-topic-name');
            if (topicSpan)
                topicSpan.textContent = topicTitle;
            const subjInput = document.querySelector('input[name="subject"]');
            if (subjInput)
                subjInput.value = `Reader Feedback on ${topicTitle} (${Nav.app})`;
            const topicInput = document.querySelector('input[name="topic"]');
            if (topicInput)
                topicInput.value = topicTitle;
            modal.style.display = 'flex';
            return;
        }
        modal = document.createElement('div');
        modal.id = 'feedback-modal-overlay';
        modal.setAttribute('style', `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        `);
        modal.innerHTML = `
            <div style="background: #ffffff; border-radius: 10px; width: 90%; max-width: 480px; padding: 22px 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1); border: 1px solid #cbd5e1; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 17px; color: #1e293b;">💬 Send Note to Authors</h3>
                    <button id="close-feedback-btn" style="background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer; padding: 0 4px;">&times;</button>
                </div>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 12.5px; color: #475569;">
                    <div><strong>App:</strong> ${appTitle}</div>
                    <div><strong>Topic:</strong> <span id="feedback-topic-name">${topicTitle}</span></div>
                </div>

                <form id="feedback-modal-form">
                    <input type="hidden" name="access_key" value="e2ad26d6-d392-48f7-814e-aad6e97a0fe5">
                    <input type="hidden" name="subject" value="Reader Feedback on ${topicTitle} (${Nav.app})">
                    <input type="hidden" name="topic" value="${topicTitle}">
                    <input type="hidden" name="app" value="${Nav.app}">

                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 4px;">Your Reflection or Question *</label>
                        <textarea name="message" required rows="4" placeholder="What are your thoughts, questions, or suggestions on this lecture?" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; font-family: inherit; resize: vertical;"></textarea>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Name / Nickname (Optional)</label>
                            <input type="text" name="from_name" placeholder="e.g. Fellow Student" style="width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 13px;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Email (Optional for replies)</label>
                            <input type="email" name="email" placeholder="your.email@example.com" style="width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 13px;">
                        </div>
                    </div>

                    <div id="feedback-status-msg" style="display: none; padding: 8px 10px; border-radius: 5px; font-size: 12.5px; margin-bottom: 12px;"></div>

                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" id="cancel-feedback-btn" style="padding: 7px 14px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;">Cancel</button>
                        <button type="submit" id="submit-feedback-btn" style="padding: 7px 16px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 600;">Send Note &rarr;</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        const closeModal = () => {
            if (modal)
                modal.style.display = 'none';
        };
        document.getElementById('close-feedback-btn')?.addEventListener('click', closeModal);
        document.getElementById('cancel-feedback-btn')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeModal();
        });
        const form = document.getElementById('feedback-modal-form');
        const statusMsg = document.getElementById('feedback-status-msg');
        const submitBtn = document.getElementById('submit-feedback-btn');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            statusMsg.style.display = 'block';
            statusMsg.style.background = '#f0f9ff';
            statusMsg.style.color = '#0369a1';
            statusMsg.style.border = '1px solid #bae6fd';
            statusMsg.textContent = 'Sending message to authors...';
            try {
                const formData = new FormData(form);
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    statusMsg.style.background = '#f0fdf4';
                    statusMsg.style.color = '#15803d';
                    statusMsg.style.border = '1px solid #bbf7d0';
                    statusMsg.textContent = '✓ Thank you! Your note has been delivered to Jane & Jack.';
                    form.reset();
                    setTimeout(() => {
                        closeModal();
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Note →';
                    }, 2200);
                }
                else {
                    throw new Error(data.message || 'Submission failed');
                }
            }
            catch (err) {
                statusMsg.style.background = '#fef2f2';
                statusMsg.style.color = '#b91c1c';
                statusMsg.style.border = '1px solid #fecaca';
                statusMsg.textContent = '⚠️ Could not send message. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Note →';
            }
        });
    }
    //
    static display() {
        const bw = window.innerWidth - Nav.offset;
        const bh = window.innerHeight - Nav.offset;
        const fm = Nav.frameMargin;
        const py = Nav.lineHeight + 2 * fm;
        //
        Nav.frame.setAA(['width', bw, 'height', bh]);
        Nav.line.setA('width', bw - 2 * fm);
        Nav.lineRect.setA('width', bw - 2 * fm);
        Nav.foHeight = bh - Nav.lineHeight - 3 * fm;
        //
        const textSizeControlSize = Nav.setTextSizeControlPos(bw - 2 * fm);
        if (Nav.editMode) {
            Sed.setEditControlsPos(textSizeControlSize);
        }
        //
        let indexWidth = 0;
        let layoutCB = this.cb;
        if (Nav.currentIndex != -1) {
            const index = Nav.indices[Nav.currentIndex];
            if (index.chosen != -1) {
                layoutCB = index.choices[index.chosen][0].layoutCB;
            }
            const indexVisible = Nav.lineArrowButton.getV() == Nav.dnArrow;
            if (indexVisible) {
                Nav.index.removeChildren();
                Nav.index.append(Nav.indexRect);
                Nav.index.append(index);
                indexWidth = index.getBB().width + 2 * Index.margin;
                Nav.indexRect.setAA(['width', indexWidth, 'height', Nav.foHeight]);
            }
        }
        const foX = (indexWidth > 0) ? 2 * fm + indexWidth : fm;
        Nav.foWidth = (indexWidth > 0) ? bw - 3 * fm - indexWidth : bw - 2 * fm;
        Nav.foRect.setAA(['x', `${foX}`, 'width', Nav.foWidth, 'height', Nav.foHeight]);
        Nav.fo.setAA(['x', `${foX}`, 'width', Nav.foWidth, 'height', Nav.foHeight]);
        displayAnyDJSI();
        if (layoutCB) {
            layoutCB();
        }
    }
    static addNavLineIndexItem(header, cb) {
        const widget = new SVGTSpan(Nav.lineTopics);
        const [stdC, activeC] = [Nav.color.std, Nav.color.active];
        widget.setAA(['font-size', Nav.fontSize, 'stroke', stdC, 'pointer-events', 'none']);
        widget.setV(header);
        widget.elt.addEventListener('mouseover', () => { widget.setA('stroke', Nav.color.over); });
        widget.elt.addEventListener('mouseout', () => {
            const color = (widget.getA('pointer-events') == 'none') ? stdC : activeC;
            widget.setA('stroke', color);
        });
        widget.elt.addEventListener('click', (ev) => {
            if (cb)
                cb(ev);
            else
                Nav.lineItemSelectionHandler(ev);
        });
        const lineElts = Nav.lineTopics.children();
        for (let i = 0; i < lineElts.length - 1; i++) {
            lineElts[i].setAA(['stroke', activeC, 'pointer-events', 'auto']);
        }
        if (cb)
            lineElts[0].setAA(['stroke', activeC, 'pointer-events', 'auto']);
        Nav.showNavLine();
    }
    static lineArrowButtonPressed() {
        const v = (Nav.lineArrowButton.getV() == Nav.dnArrow) ? Nav.upArrow : Nav.dnArrow;
        Nav.lineArrowButton.setV(v);
        Nav.display();
    }
    static loadIndex(header, indexDesc, initialSelection = 0) {
        let index = new Index(indexDesc, initialSelection);
        Nav.indices.push(index);
        Nav.currentIndex = Nav.indices.length - 1;
        //if(header){
        Nav.addNavLineIndexItem(header);
        //}
        index.setSelectedItem();
        Nav.processSelection();
    }
    //
    static processSelection() {
        Nav.textSizeControl.setAA(['visibility', 'hidden', 'pointer-events', 'none']);
        if (Nav.editMode) {
            Sed.setEditControlStatus(false);
        }
        const index = Nav.indices[Nav.currentIndex];
        const selected = index.choices[index.chosen];
        const [c, w] = selected; //[IndexItemDesc,SVGTSpan]
        const lineElts = Nav.lineTopics.children();
        Nav.fo.removeChildren();
        if (c.type == 'index') {
            Nav.loadNewIndex(c);
        }
        else {
            const len = lineElts.length;
            const widget = lineElts[len - 1];
            const val = widget.getV();
            if (['comments', 'back'].includes(val)) {
                Nav.lineTopics.elt.removeChild(widget.elt);
                Nav.showNavLine();
            }
            if (c.type == 'html') {
                Nav.segId = c.htmlSegmentId;
                Nav.loadSegment();
                initAnyDJSI();
                Nav.setSegPos();
                if (Nav.editMode) {
                    Sed.setEditControlStatus(true);
                }
            }
            else if (c.initCB) {
                const diagram = c.initCB();
                Nav.fo.append(diagram);
            }
        }
        Nav.display();
    }
    static setSegPos() {
        if (Nav.lastVisits.has(Nav.segId)) {
            Nav.fo.elt.scrollTop = Nav.lastVisits.get(Nav.segId);
        }
        else {
            Nav.fo.elt.scrollTop = 0;
        }
    }
    static setLastVisit() {
        const index = Nav.indices[Nav.currentIndex];
        const choice = index.choices[index.chosen][0];
        if (choice.type == 'html') {
            Nav.lastVisits.set(Nav.segId, Nav.fo.elt.scrollTop);
        }
    }
    static loadNewIndex(choice) {
        Nav.setLastVisit();
        const indexDesc = choice.indexDesc;
        Nav.loadIndex(choice.topic, indexDesc, choice.indexSelection);
    }
    static loadSegment() {
        Nav.textSizeControl.setAA(['visibility', 'visible', 'pointer-events', 'auto']);
        Nav.fo.setA('style', 'overflow-y:auto;overflow-x:hidden;');
        let seg = (Nav.editMode) ? Nav.segMap.get(Nav.segId)
            : Nav.embeddedSeg(Nav.segId);
        if (!seg && Nav.editMode) {
            seg = Nav.embeddedSeg(Nav.segId);
        }
        if (seg) {
            Nav.segDiv.elt.innerHTML = seg;
            Nav.fo.removeChildren();
            Nav.fo.append(Nav.segDiv);
        }
        if (Nav.fo && Nav.fo.elt) {
            Nav.fo.elt.removeEventListener('scroll', Nav.onFoScroll);
            Nav.fo.elt.addEventListener('scroll', Nav.onFoScroll);
            setTimeout(() => { Nav.updateReturnControlVisibility(); }, 100);
        }
    }
    static embeddedSeg(segId) {
        const seg = document.getElementById(segId);
        if (!seg)
            return '';
        if (seg.tagName.toLowerCase() === 'template') {
            return seg.innerHTML;
        }
        const inner = seg.innerHTML;
        if (inner.startsWith('<!--SEG') && inner.endsWith('SEG-->')) {
            return inner.substring(8, inner.length - 8);
        }
        return inner;
    }
    static addNavLineBackButton(header) {
        const widget = new SVGTSpan(Nav.lineTopics);
        const [stdC, activeC] = [Nav.color.std, Nav.color.active];
        widget.setAA(['font-size', Nav.fontSize, 'stroke', activeC, 'pointer-events', 'auto']);
        widget.setV(header);
        widget.elt.addEventListener('mouseover', () => { widget.setA('stroke', Nav.color.over); });
        widget.elt.addEventListener('mouseout', () => {
            const color = (widget.getA('pointer-events') == 'none') ? stdC : activeC;
            widget.setA('stroke', color);
        });
        widget.elt.addEventListener('click', (ev) => { Nav.backButtonSelectionHandler(ev); });
        Nav.showNavLine();
    }
    static lineItemSelectionHandler(ev) {
        const lineElts = Nav.lineTopics.children();
        const elt = ev.target;
        const widget = Elt.wrapper(elt);
        const widgetPos = lineElts.findIndex(w => w == widget);
        if (widgetPos != -1) {
            for (let i = lineElts.length - 1; i > widgetPos; i--) {
                Nav.lineTopics.elt.removeChild(lineElts[i].elt);
            }
            while (Nav.indices.length > widgetPos + 1) {
                Nav.indices.pop();
            }
            const [stdC, activeC] = [Nav.color.std, Nav.color.active];
            Nav.currentIndex = widgetPos;
            lineElts[widgetPos].setAA(['stroke', stdC, 'pointer-events', 'none']);
            for (let i = 0; i < widgetPos; i++) {
                lineElts[i].setAA(['stroke', activeC, 'pointer-events', 'auto']);
            }
        }
        Nav.setLastVisit();
        Nav.showNavLine();
        const index = Nav.indices[Nav.currentIndex];
        index.chosen = 0;
        index.setSelectedItem();
        Nav.processSelection();
    }
    static backButtonSelectionHandler(ev) {
        const lineElts = Nav.lineTopics.children();
        const len = lineElts.length;
        Nav.lineTopics.elt.removeChild(lineElts[len - 1].elt);
        Nav.showNavLine();
        Nav.processSelection();
    }
    static showNavLine() {
        let xp = Nav.margin.init;
        const yp = 1 / 2 * Nav.lineHeight + 1 / 4 * Nav.fontSize + Nav.frameMargin;
        const lineElts = Nav.lineTopics.children();
        lineElts.forEach(widget => {
            const svgElt = widget;
            const bb = svgElt.getBB();
            widget.setAA(['x', xp, 'y', yp]);
            xp += bb.width + Nav.margin.std;
        });
        if (Nav.returnControl) {
            Nav.returnControl.setAA(['x', xp, 'y', yp]);
        }
    }
    static clearNavLine() {
        Nav.lineTopics.removeChildren();
        Nav.showNavLine();
    }
}
