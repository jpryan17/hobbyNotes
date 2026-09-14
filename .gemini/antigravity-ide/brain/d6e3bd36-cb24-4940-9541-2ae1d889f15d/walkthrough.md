# Walkthrough: Unified FS Hierarchy & Typings (Replacing Disjoint Situations)

We refactored the data model and harvesting pipeline so that physical and mathematical "situations" are expressed purely through **Formal Statement (FS) hierarchy** (`parentId`) and **statement discipline typing** (`type: 'math' | 'physics' | 'information'`), eliminating the redundant, separate `Situation` entity table.

---

## 1. Cleaned Data Model

Instead of a separate `situations` catalog table, every node in the knowledge graph is now a first-class `FormalStatement`:

```typescript
export type FsStatementType = 'math' | 'physics' | 'information';

export interface FsCatalogStatement {
  id: string;
  parentId?: string; // Links child scenarios/corollaries to governing parent statements
  type: FsStatementType; // Disciplinary domain: 'math' | 'physics' | 'information'
  tier: 'constitutional' | 'axiom' | 'theorem' | 'scenario' | 'corollary' | 'law';
  title: string;
  description?: string;
  governingSeed?: 'conway_cut' | 'shadow_map' | 'boundary_law';
  scaffoldKey: string;
  expression: string;
  leanSignature?: string;
  leanSnippet?: string;
  referencedInSegments: string[];
}
```

The top-level catalog structure is now streamlined:
- **`formalStatements`**: The unified hierarchical statements graph.
- **`calculationModes`**: Inverted algebraic stencils `(inputs → output)` anchored directly to `statementId`.
- **`examples`**: Active verified presets configuring calculation slots for `(modeId, statementId)`.

---

## 2. FS Hierarchy Structure

| Discipline | Governing Parent FS | Child Scenario / Corollary (`parentId`) | Governing Seed |
| :--- | :--- | :--- | :--- |
| **Physics** | `fs_newtonian_mechanics` (Dynamics & Boundary Law) | `fs_free_fall_accel` (Free Fall Kinematics) | `boundary_law` |
| **Math → Physics** | `fs_telescoping_ftc` (Fundamental Theorem of Calculus) | `fs_work_energy` (Work-Energy Theorem)<br>`fs_heat_flux` (Thermal Flux Balance)<br>`fs_quartic_diff` (Quartic Difference Quotient) | `boundary_law`<br>`boundary_law`<br>`shadow_map` |
| **Math** | `fs_complex_arithmetic` (Hyperfinite ℂ_ω Algebra) | `fs_cauchy_riemann` (Conformal Symmetries)<br>`fs_residue_integral` (Residue Circulation)<br>`fs_lee_yang` (Critical Phase Transition) | `conway_cut`<br>`shadow_map`<br>`boundary_law` |
| **Physics** | `fs_unitary_isometry` (Unitary Norm Conservation) | `fs_three_polarizer` (Sequential Projection) | `boundary_law` |
| **Information** | `fs_probability_foundations` (Measure & Conditioning) | `fs_bayes_updating` (Bayesian Posterior Filter) | `shadow_map` |
| **Math** | `fs_scale_reciprocity` (Scale Horizon ω · dx = 1) | `fs_discrete_ivt` (Root Bisection on Transect) | `conway_cut` |

---

## 3. Changes Applied

### A. Harvester: [`nodeUtils/harvestStencils.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/nodeUtils/harvestStencils.ts)
- Removed `FsCatalogSituation` and the standalone `situations` list.
- Configured statements with `type: 'math' | 'physics' | 'information'` and `parentId`.
- Fixed segment regex to capture both `scaffold="..."` and `key="..."` attributes across all 52 segments (harvesting 34 unique scaffold keys).
- Emitted clean [`clientLib/fsCatalog.json`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/fsCatalog.json) and [`clientLib/fsCatalog.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/fsCatalog.ts).

### B. Interactive Calculator: [`clientLib/fsCalculator.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/fsCalculator.ts)
- Title Bar now displays:
  - **Discipline Badge**: `⚛️ Physics`, `📐 Math`, or `💡 Information`.
  - **Hierarchy Breadcrumb**: `↳ [Parent FS Title] [Tier]`.
  - **Governing Seed**: `🌱 boundary_law`, `🌱 shadow_map`, or `🌱 conway_cut`.
  - Directional modes count and verified presets pills (`💡 Verified Presets:`).

---

## 4. Verification

Ran full build:
```bash
npm run build
```
- `utilsC` (clean)
- `stencils` (emitted 16 formal statements with hierarchy and type, 13 calculation modes, 5 presets)
- `leanCache` (132 keys verified)
- `maximaCache` (verified)
- `compile` (clean)
- `segs` (52 segments compiled)
- `index` (standalone index.html bundled)
- **Exit Code: `0`**
