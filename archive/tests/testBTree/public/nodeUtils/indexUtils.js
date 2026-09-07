import { resolve } from 'path';
import { pathToFileURL } from 'url';
export function extractHtmlSegmentIds(items, segmentIds = new Set()) {
    for (const item of items) {
        if (item.type === 'html' && item.htmlSegmentId) {
            segmentIds.add(item.htmlSegmentId);
        }
        else if (item.type === 'index' && item.indexDesc) {
            extractHtmlSegmentIds(item.indexDesc, segmentIds);
        }
    }
    return segmentIds;
}
export async function loadAppMainIndex(app) {
    const indexPath = resolve(__dirname, `../../${app}/public/${app}/src/indices.js`);
    const module = await import(pathToFileURL(indexPath).href);
    if (!module.mainIndex) {
        throw new Error(`mainIndex not exported in ${indexPath}`);
    }
    return module.mainIndex;
}
export async function getRequiredSegIds(app) {
    const mainIndex = await loadAppMainIndex(app);
    const segIdSet = extractHtmlSegmentIds(mainIndex);
    return Array.from(segIdSet);
}
