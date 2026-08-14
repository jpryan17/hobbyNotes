import { Banner } from '../../clientLib/banner.js';
let outlineBanner;
let propLogicBanner;
let realsBanner;
let predLogicBanner;
export function initOutlineBanner() {
    outlineBanner = new Banner([
        { text: 'toward a theoretical maximum:', fontSize: 36, color: '#475569' },
        { text: 'formal science in basic education', fontSize: 48, fontWeight: 'bold', color: '#0f172a' },
        { text: '— a shared hallucination', fontSize: 30, fontStyle: 'italic', color: '#64748b' }
    ], {
        fontSize: 44,
        space: 20,
        updateDate: 'Draft updated: August 2026',
        dateCorner: 'BR'
    });
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
