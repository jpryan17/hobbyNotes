"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHtmlSegmentIds = extractHtmlSegmentIds;
exports.loadAppMainIndex = loadAppMainIndex;
exports.getRequiredSegIds = getRequiredSegIds;
const path_1 = require("path");
const url_1 = require("url");
function extractHtmlSegmentIds(items, segmentIds = new Set()) {
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
async function loadAppMainIndex(app) {
    const indexPath = (0, path_1.resolve)(__dirname, `../../${app}/public/${app}/src/indices.js`);
    const module = await import((0, url_1.pathToFileURL)(indexPath).href);
    if (!module.mainIndex) {
        throw new Error(`mainIndex not exported in ${indexPath}`);
    }
    return module.mainIndex;
}
async function getRequiredSegIds(app) {
    const mainIndex = await loadAppMainIndex(app);
    const segIdSet = extractHtmlSegmentIds(mainIndex);
    return Array.from(segIdSet);
}
