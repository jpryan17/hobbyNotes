import { Banner } from '../../clientLib/banner.js';
let outlineBanner;
export function initOutlineBanner() {
    outlineBanner = new Banner([
        { text: 'toward a direct conceptual foundation:', fontSize: 36, color: '#475569' },
        { text: 'liberal arts mathematics', fontSize: 48, fontWeight: 'bold', color: '#0f172a' },
        { text: '— solidifying the theoretical foundations', fontSize: 28, fontStyle: 'italic', color: '#64748b' }
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
