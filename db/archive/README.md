# Database Archive: Legacy Seeding Bootstrap

This directory preserves the historical snapshot and bootstrap seed files used prior to the transition to direct PostgreSQL relational CRUD authoring.

## Archived Assets
- **`seed_legacy_bootstrap.sql`**: The last complete generated SQL seed file produced from `app1/segs/` and `clientLib/fsCatalog.json`.

## Current Architecture
- **PostgreSQL Database** is the live, authoritative single source of truth.
- **Relational Authoring**: Content, formal statements, calculation stencils, and parameter slots are created, edited, and linked via:
  - The **CRUD Studio** (`/crud`)
  - The **Studio Overlay & Content Editor**
  - The **4-Stage Formal Statement (FS) Constructor**
- **Lean 4 Grounding**: Grounded types and machine-checked theorems are dynamically ingested and linked into `lean_declarations` non-destructively using `npm run db:harvest-lean` (`nodeUtils/harvestLeanToDb.ts`).
- **Curricular Segments**: HTML files in `app1/segs/` are human-crafted and edited directly without automated batch rewriting.
