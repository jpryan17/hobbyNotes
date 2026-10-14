"use strict";
/**
 * Curricular Stencils & Formal Statements Catalog Generator (Backward-Compatibility Shim)
 *
 * This file has been superseded by nodeUtils/buildCatalog.ts.
 * It delegates all execution directly to buildCatalog.ts.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.harvestCurricularStencils = harvestCurricularStencils;
const buildCatalog_js_1 = require("./buildCatalog.js");
__exportStar(require("./buildCatalog.js"), exports);
function harvestCurricularStencils() {
    return (0, buildCatalog_js_1.buildCurricularCatalog)();
}
if (require.main === module) {
    (0, buildCatalog_js_1.writeCatalogFiles)();
}
