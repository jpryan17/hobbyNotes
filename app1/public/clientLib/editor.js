// support for app segment editing & studio overlay
import { Nav } from './navFW.js';
import { Elt } from './elt.js';
import { SI } from './serverInterface.js';
import { initAnyDJSI } from './ida.js';
import { StudioOverlay } from './studioOverlay.js';
export class Sed {
    //
    static editControlsWidth = 0;
    static editControls;
    static editControlsActiveStatus = true;
    static savedContent;
    static controls = ['[E]', ' ', '[R]', ' ', '[L]'];
    static colors;
    //
    constructor(navColors) {
        Sed.colors = [navColors.std, navColors.active, navColors.over, navColors.busy, 'red'];
        // Initialize modern Studio Overlay controls
        StudioOverlay.init(navColors);
        SI.logInit();
    }
    //
    static setEditControlsPos(lineWidth) {
        StudioOverlay.setPos(lineWidth);
    }
    static setEditControlStatus(status) {
        Sed.editControlsActiveStatus = status;
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
            Nav.setLastVisit();
            await SI.setSegMap(true, Nav.segId);
            if (SI.errorFlag != 0) {
                Sed.setTargetColor(ev, alertC);
            }
            else {
                Nav.loadSegment();
                initAnyDJSI();
                if (window.MathJax?.typesetPromise) {
                    window.MathJax.typesetPromise([Nav.segDiv.elt]).catch((err) => console.log('MathJax typeset error:', err));
                }
                Nav.setSegPos();
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
