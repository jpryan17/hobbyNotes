import { Banner } from '../../clientLib/banner.js';
let outlineBanner;
let propLogicBanner;
let realsBanner;
let predLogicBanner;
export function initOutlineBanner() {
    outlineBanner = new Banner([
        'toward a theoretical maximum:',
        'formal science in basic education',
        ' - a shared hallucination'
    ], 45, 30);
    return outlineBanner;
}
export function layoutOutlineBanner() {
    outlineBanner.layout();
}
export function initPropLogicBanner() {
    propLogicBanner = new Banner(['introduction to', 'propositional logic'], 45, 30);
    return propLogicBanner;
}
export function layoutPropLogicBanner() {
    propLogicBanner.layout();
}
export function initRealsBanner() {
    realsBanner = new Banner(['the real numbers,', 'a condensed review',
        'via construction'], 45, 30);
    return realsBanner;
}
export function layoutRealsBanner() {
    realsBanner.layout();
}
export function initPredLogicBanner() {
    predLogicBanner = new Banner(['introduction to', 'predicate logic'], 45, 30);
    return predLogicBanner;
}
export function layoutPredLogicBanner() {
    predLogicBanner.layout();
}
