# Walkthrough: Unified FSD & CAS References with Studio Launchpad & Static Mode Separation

We unified the historically disjoint `<fsd-ref>` (Lean proof card) and `<cas-ref>` (CAS calculation reference) into a single cohesive Formal Statement surface (`ArgumentCard` + `FsCalculator` + `NumericVisualizer`). We also enforced the separation between **Static Mode** (fully self-contained stencil calculator) and **Dev Mode** (active `🛠️ Studio` and `⚡ Live Verify` authoring buttons).

---

## 1. Unified Reference Architecture

```
                 [ User clicks in Segment ]
                 /                         \
       <fsd-ref>                             <cas-ref>
  (Formal Statement link)               (Computational preset link)
                 \                         /
                  ▼                       ▼
      =======================================================
                        UNIFIED ARGUMENT CARD
      =======================================================
       • Title Bar: Domain Tag (⚛️ Physics / 📐 Math) +
                    Hierarchy Breadcrumb (↳ Parent FS [Tier])
       • Lean 4 Deductive Proof & Scaffold Verification
       • Symbolic CAS Reductions & Bounds
       • Directional Inverted Stencils (inputs → output)
       • Verified Examples & Presets (auto-focused on cas-ref)
       • Simulation Visualizer (plots, phase orbits, slabs)
       -------------------------------------------------------
       [Dev Mode Only] ⚡ Live Verify  |  🛠️ Studio Launcher
       [Static & Dev]  🧮 Calculator (100% Client-Side)
      =======================================================
```

---

## 2. Changes Made

### A. Unified Card & Studio Button: [`clientLib/argumentCard.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/argumentCard.ts)
- **`ArgumentCardOptions`**: Added `{ autoOpenCalculator?: boolean; presetKey?: string; activeModeId?: string; }`.
- **Static Mode Calculator**: `🧮 Calculator` is always available to all readers (public and local), executing pure client-side TypeScript functions with zero backend dependencies.
- **Dev-Only Studio Launchpad**: Added `🛠️ Studio` button to the card footer.
  - Automatically enabled when in dev mode (`isLocal || Nav.edit`).
  - Cleanly suppressed in static production builds.
  - Dispatches `open-fs-studio` event with `{ statementId, scaffoldKey, title, mode, inputValues }`.

### B. Upgraded CAS References: [`clientLib/casRef.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/casRef.ts)
- Clicking any `<cas-ref>` resolves `calc-id` against `FS_CATALOG.examples`, `FS_CATALOG.calculationModes`, and `FS_CATALOG.formalStatements`.
- Mounts the unified `ArgumentCard` in `Nav.fo` with `{ autoOpenCalculator: true, presetKey: calcId }`, immediately expanding the calculator and populating the verified preset values.
- Retains fallback to legacy `casDemo` for any unmapped calculations.

### C. Enhanced FSD References: [`clientLib/fsdRef.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/fsdRef.ts)
- Supports direct formal statement IDs from `FS_CATALOG.formalStatements` (e.g. `<fsd-ref id="fs_free_fall_accel">`).
- Supports optional attributes `open-calc`, `preset`, and `calc-mode`.

### D. Interactive Calculator Options: [`clientLib/fsCalculator.ts`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/clientLib/fsCalculator.ts)
- Added `presetKey` and `activeModeId` support in the `FsCalculator` constructor.
- Added public `applyPresetByKey(presetKey)` and `getActiveCalculationState()` methods for seamless synchronization with the card and future Studio.

---

## 3. Verification & Build Results

Executed full pipeline:
```bash
npm run build
```

Result:
- **`utilsC`**: 0 errors
- **`stencils`**: Emitted 16 formal statements (with hierarchy & types), 13 calculation modes, and 5 verified presets.
- **`leanCache`**: 132 keys verified
- **`maximaCache`**: Up-to-date
- **`compile`**: Clean TypeScript compilation (`cd ./app1 && npx tsc`)
- **`segs`**: 52 segments processed into `segsFile.json`
- **`index`**: Standalone bundle generated in `app1/dist/index.html`
- **Exit Code: `0`**
