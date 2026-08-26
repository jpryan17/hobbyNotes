import { Banner } from '../../clientLib/banner.js';
let outlineBanner;
let propLogicBanner;
let realsBanner;
let predLogicBanner;
export function initOutlineBanner() {
    outlineBanner = new Banner([
        { text: 'mathematics and the middle way', fontSize: 44, fontWeight: 'bold', color: '#0f172a' },
        { text: 'foundational science & nonstandard analysis', fontSize: 30, fontStyle: 'italic', color: '#1e3a8a' },
        { text: '— a sequential journey from logic to quantum reality', fontSize: 24, fontStyle: 'italic', color: '#64748b' }
    ], {
        fontSize: 44,
        space: 20,
        updateDate: 'August 2026',
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
