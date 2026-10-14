/**
 * Curricular Stencils & Formal Statements Catalog Generator (Backward-Compatibility Shim)
 *
 * This file has been superseded by nodeUtils/buildCatalog.ts.
 * It delegates all execution directly to buildCatalog.ts.
 */

import { buildCurricularCatalog, writeCatalogFiles, FsCatalog } from './buildCatalog.js';

export * from './buildCatalog.js';

export function harvestCurricularStencils(): FsCatalog {
  return buildCurricularCatalog();
}

if (require.main === module) {
  writeCatalogFiles();
}
