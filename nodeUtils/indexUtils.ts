import { resolve } from 'path';
import { pathToFileURL } from 'url';

export interface IndexItemDesc {
    type: 'html' | 'diagram' | 'index';
    topic: string;
    indents?: number;
    indexDesc?: IndexItemDesc[];
    indexSelection?: number;
    htmlSegmentId?: string;
    layoutCB?: Function;
    initCB?: Function;
}

export function extractHtmlSegmentIds(items: IndexItemDesc[], segmentIds: Set<string> = new Set()): Set<string> {
    for (const item of items) {
        if (item.type === 'html' && item.htmlSegmentId) {
            segmentIds.add(item.htmlSegmentId);
        } else if (item.type === 'index' && item.indexDesc) {
            extractHtmlSegmentIds(item.indexDesc, segmentIds);
        }
    }
    return segmentIds;
}

export async function loadAppMainIndex(app: string): Promise<IndexItemDesc[]> {
    const indexPath = resolve(__dirname, `../../${app}/public/${app}/src/indices.js`);
    const module = await import(pathToFileURL(indexPath).href);
    if (!module.mainIndex) {
        throw new Error(`mainIndex not exported in ${indexPath}`);
    }
    return module.mainIndex;
}

export async function getRequiredSegIds(app: string): Promise<string[]> {
    const mainIndex = await loadAppMainIndex(app);
    const segIdSet = extractHtmlSegmentIds(mainIndex);
    return Array.from(segIdSet);
}
