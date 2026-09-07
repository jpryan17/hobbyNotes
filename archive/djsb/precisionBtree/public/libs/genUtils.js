// wrapper for HTML/SVG Elements
const SVGns = 'http://www.w3.org/2000/svg';
const HTMLns = 'http://www.w3.org/1999/xhtml';
export class Elt {
    constructor({ nsi = 'H', qname = 'div', elt = undefined, id = undefined, slot = 'main-slot' }) {
        this.root = document.getElementById(slot);
        let useId;
        if (elt != undefined) {
            useId = elt.getAttributeNS(null, 'id');
            this.elt = elt;
        }
        else {
            let ns = (nsi == 'H') ? HTMLns : SVGns;
            this.elt = document.createElementNS(ns, qname);
            if (id != undefined)
                useId = id;
            else
                useId = `ID${Elt.idc++}`;
            this.elt.setAttributeNS(null, "id", useId);
        }
        new MathTypeset();
    }
    static eltAppend(elt, slotName = 'main-slot') {
        const div = document.getElementById(slotName);
        div.appendChild(elt.elt);
    }
    static clearRootContent(slotName = 'main-slot') {
        const slot = document.getElementById(slotName);
        slot.innerHTML = '';
    }
    static setRootContent(segmentName, slotName = 'main-slot') {
        const root = document.getElementById(slotName);
        const seg = document.getElementById(segmentName);
        const innerComment = seg.innerHTML;
        const innerContent = innerComment.substring(8, innerComment.length - 8);
        root.innerHTML = innerContent;
        MathTypeset.force();
    }
    setV(val) { this.elt.innerHTML = val; }
    getV() { return this.elt.innerHTML; }
    setA(name, val) { this.elt.setAttributeNS(null, name, val.toString()); }
    setAA(avPairs) {
        for (let i = 0; i < avPairs.length - 1; i += 2) {
            if (avPairs[i + 1] == '-2')
                log(this.elt.getAttributeNS(null, 'id'));
            this.elt.setAttributeNS(null, avPairs[i].toString(), avPairs[i + 1].toString());
        }
    }
    getA(name) { return this.elt.getAttributeNS(null, name); }
    getAA(names) {
        return names.map(e => this.elt.getAttributeNS(null, e));
    }
}
Elt.idc = 0;
// simple logger
let useSimpleLogger;
let simpleLoggerDiv;
export function initLog(logger) {
    useSimpleLogger = (logger == undefined || !logger) ? false : true;
    if (useSimpleLogger) {
        let elt = document.getElementById('log-slot');
        simpleLoggerDiv = new Elt({ elt: elt });
    }
}
export function log(msg) {
    if (useSimpleLogger) {
        const currentLog = simpleLoggerDiv.getV();
        const newLog = currentLog.concat('<br>', `${msg}`);
        simpleLoggerDiv.setV(newLog);
        simpleLoggerDiv.elt.innerHTML = newLog;
    }
    else
        console.log(msg);
}
export function getProfile() {
    const stored = window.localStorage.getItem('profile');
    if (stored) {
        const values = stored.split(';');
        return { userLevel: +values[0], gameLevel: +values[1] };
        //gameControlSettings:{},bestScores:[]}
    }
    return null;
}
export function setProfile(profile) {
    let item = `${profile.userLevel};${profile.gameLevel}`;
    window.localStorage.setItem('profile', item);
}
export function clearProfile() {
    window.localStorage.clear();
}
export function handleOverrides(c, overrides) {
    if (overrides) {
        overrides.forEach(ov => {
            let obj = c;
            for (let i = 0; i < ov.length - 2; i++) {
                obj = Reflect.get(obj, ov[i]);
            }
            Reflect.set(obj, ov[ov.length - 2], ov[ov.length - 1]);
        });
    }
}
export class MathTypeset {
    constructor() {
        MathTypeset.sillyDiv = document.createElement('div');
        MathTypeset.sillyDiv.setAttribute('display', 'none');
        MathTypeset.sillyDiv.setAttribute('id', 'silly-div');
    }
    static force() {
        const ms = document.getElementById('main-slot');
        const sd = document.getElementById('silly-div');
        if (sd) {
            const pe = sd.parentElement;
            ms.removeChild(sd);
        }
        else {
            ms.appendChild(MathTypeset.sillyDiv);
        }
    }
}
//# sourceMappingURL=genUtils.js.map