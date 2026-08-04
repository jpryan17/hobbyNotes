// support for app segment editing 
import { Nav } from './navFW.js';
import { Elt } from './elt.js';
import { SVGTSpan, textWidth } from './svgElt.js';
import { SI } from './serverInterface.js';
export class Sed {
    //
    static editControlsWidth;
    static editControls;
    static editControlsActiveStatus = true;
    static savedContent;
    static controls = ['[E]', ' ', '[R]', ' ', '[L]'];
    static colors;
    //
    constructor(navColors) {
        Sed.colors = [navColors.std, navColors.active, navColors.over, navColors.busy, 'red'];
        const [stdC, activeC, overC, busyC, alertC] = Sed.colors;
        Sed.editControls = new SVGTSpan(Nav.lineBlock);
        Sed.controls.forEach(header => {
            const widget = new SVGTSpan(Sed.editControls);
            widget.setAA(['font-size', Nav.fontSize, 'stroke', stdC, 'pointer-events', 'none']);
            widget.setV(header);
            if (header != ' ') {
                widget.elt.addEventListener('mouseover', (ev) => {
                    const cc = widget.getS('stroke');
                    if (cc != busyC && cc != alertC) {
                        widget.setA('stroke', overC);
                    }
                });
                widget.elt.addEventListener('mouseout', () => {
                    const cc = widget.getS('stroke');
                    if (cc != busyC && cc != alertC) {
                        widget.setA('stroke', activeC);
                    }
                });
                //
                if (header == '[E]') {
                    widget.elt.addEventListener('click', (ev) => { Sed.segEditHandler(ev); });
                }
                else if (header == '[R]') {
                    widget.elt.addEventListener('click', (ev) => { Sed.segReplaceHandler(ev); });
                }
                else if (header == '[L]') {
                    widget.elt.addEventListener('click', (ev) => { Sed.logViewHandler(ev); });
                }
            }
        });
        Sed.editControlsWidth = textWidth('[E] [R] [L]', Nav.fontSize);
        Sed.setEditControlStatus(false);
        SI.logInit();
    }
    //
    static setEditControlsPos(lineWidth) {
        Sed.editControls.setA('x', lineWidth - Sed.editControlsWidth);
    }
    static setEditControlStatus(status) {
        const [stdC, activeC] = [Nav.color.std, Nav.color.active];
        if (status) {
            if (!Sed.editControlsActiveStatus) {
                Sed.editControlsActiveStatus = true;
                // activate controls
                Sed.editControls.children().forEach(control => {
                    control.setAA(['pointer-events', 'auto', 'stroke', activeC]);
                });
            }
        }
        else if (Sed.editControlsActiveStatus) {
            Sed.editControlsActiveStatus = false;
            //de-activate controls
            Sed.editControls.children().forEach(control => {
                control.setAA(['pointer-events', 'none', 'stroke', stdC]);
            });
        }
    }
    static setTargetColor(ev, color) {
        const target = ev.target;
        const control = Elt.wrapper(target);
        control.setA('stroke', color);
    }
    static getTargetColor(ev) {
        const target = ev.target;
        const control = Elt.wrapper(target);
        return control.getA('stroke');
    }
    //control handlers
    static segEditHandler(ev) {
        const [_, activeC, __, busyC,] = Sed.colors;
        Sed.setTargetColor(ev, busyC);
        SI.requestSegEdit(Nav.segId);
        Sed.setTargetColor(ev, activeC);
    }
    static async segReplaceHandler(ev) {
        const [_, activeC, __, busyC, alertC] = Sed.colors;
        const target = ev.target;
        const control = Elt.wrapper(target);
        const color = Sed.getTargetColor(ev);
        if (color != alertC) {
            Sed.setTargetColor(ev, busyC);
            await SI.setSegMap(true, Nav.segId);
            if (SI.errorFlag != 0) {
                Sed.setTargetColor(ev, alertC);
            }
            else {
                Nav.loadSegment();
            }
        }
        Sed.setTargetColor(ev, activeC);
    }
    static logViewHandler(ev) {
        const [_, activeC, __, busyC, ___] = Sed.colors;
        const target = ev.target;
        const control = Elt.wrapper(target);
        if (Sed.logDisplayed(control)) {
            // restore segment
            Nav.fo.removeChildren();
            Nav.fo.append(Sed.savedContent);
            Nav.setSegPos();
            control.setAA(['stroke', activeC, 'pointer-events', 'auto']);
        }
        else {
            control.setAA(['stroke', busyC]);
            Nav.setLastVisit();
            Sed.savedContent = Nav.fo.child();
            Nav.fo.removeChildren();
            Nav.fo.elt.append(SI.logged.elt);
            Nav.display();
        }
    }
    static logDisplayed(control) {
        const color = control.getA('stroke');
        return (color == Nav.color.busy);
    }
}
