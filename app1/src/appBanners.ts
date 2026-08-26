import { Banner } from '../../clientLib/banner.js'

let outlineBanner: Banner
let propLogicBanner: Banner
let realsBanner: Banner
let predLogicBanner: Banner

export function initOutlineBanner() {
    outlineBanner = new Banner([
        { text: 'mathematics and the middle way', fontSize: 44, fontWeight: 'bold', color: '#0f172a' },
        { text: 'nonstandard analysis & quantum inference', fontSize: 30, fontStyle: 'italic', color: '#1e3a8a' },
        { text: '— from first principles of logic to physical reality', fontSize: 24, fontStyle: 'italic', color: '#64748b' }
    ], {
        fontSize: 44,
        space: 20,
        updateDate: 'August 2026',
        dateCorner: 'BR'
    })
    return outlineBanner
}
export function layoutOutlineBanner() {
    outlineBanner.layout()
}
export function initPropLogicBanner() {
    propLogicBanner = new Banner(['introduction to', 'propositional logic'], 45, 30)
    return propLogicBanner
}
export function layoutPropLogicBanner() {
    propLogicBanner.layout()
}
export function initRealsBanner() {
    realsBanner = new Banner(['the real numbers,', 'a condensed review',
        'via construction'], 45, 30)
    return realsBanner
}
export function layoutRealsBanner() {
    realsBanner.layout()
}
export function initPredLogicBanner() {
    predLogicBanner = new Banner(['introduction to', 'predicate logic'], 45, 30)
    return predLogicBanner
}
export function layoutPredLogicBanner() {
    predLogicBanner.layout()
}
