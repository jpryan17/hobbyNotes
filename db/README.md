# HobbyNotes PostgreSQL Database (Iteration 2: Monolithic Studio Ecosystem)

This directory contains the production DDL schema and seed files for the `hobbynotes` PostgreSQL database.

---

## 1. Relational Architecture & Visual Blueprint

The schema models the entire Middle Way Mathematics & HobbyNotes ecosystem across five functional clusters:

1. **Curriculum & Narrative**: `apps`, `curriculum_tracks`, `segments` (52 chapters), `segment_references` (embedded `<fsd-ref>` and `<cas-ref>` links), `segment_prerequisites` (pedagogical progression DAG).
2. **Subject Matter & Formalisms**: `situations` (invariant physical/mathematical phenomena), `formalisms` (`mwm`, `standard_analysis`, `discrete_symplectic`), `formal_statements` (the intersection with parent-child hierarchies and Lean signatures).
3. **Computational Stencils & Presets**: `calculation_modes` (directional $Inputs \to Output$ stencils), `mode_slots` (parameter ranges, symbols, units), `verified_presets` (concrete grounding examples).
4. **Verification Proof Caches**: `lean_verifications` (Lean 4 proof verdicts and summaries), `maxima_verifications` (CAS reduction sessions and matrix steps).
5. **Automated Solvers & Parameter Exploration**: `parameter_mining_jobs` (automated Maxima search jobs for discovering clean presets).

---

## 2. Quick Setup in DBeaver

### Step A: Connect to PostgreSQL
1. Open **DBeaver** (`C:\Users\jprya\AppData\Local\DBeaver\dbeaver.exe`).
2. Connect to `localhost:5432` with username `postgres`.

### Step B: Create / Select Database `hobbynotes`
In DBeaver's SQL Editor:
```sql
CREATE DATABASE hobbynotes;
```
Set your active connection/database in DBeaver to **`hobbynotes`**.

### Step C: Execute Schema & Seed
1. Open and execute [`db/schema_v2.sql`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/db/schema_v2.sql) (`Alt + X` or Execute Script).
2. Open and execute [`db/seed_v2.sql`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/db/seed_v2.sql).

---

## 3. Viewing the Visual ER Diagram in DBeaver

One of the greatest benefits of DBeaver is its automatic **Entity-Relationship (ER) Diagram** generator:

1. In the DBeaver **Database Navigator** pane (left sidebar), expand:
   `PostgreSQL - localhost` → `Databases` → `hobbynotes` → `Schemas` → `public`.
2. Double-click on **`public`** (or right-click `public` → **View Diagram**).
3. Switch to the **ER Diagram** tab.
4. You will see every table with all foreign-key connecting arrows:
   * See `segments` connecting to `curriculum_tracks` and `apps`.
   * See `segment_references` linking segments to `formal_statements` and `calculation_modes`.
   * See `formal_statements` linking to `situations` and `formalisms`.
   * See self-referential arrows on `formal_statements.parent_id` for theorem hierarchies!

---

## 4. Regenerating Seeds from Live Codebase

Whenever you update segments, `FS_CATALOG`, or proof caches in the repo, re-run:
```bash
npm run db:seed
```
This re-scans `app1/segs/segsFile.json`, `clientLib/fsCatalog.json`, and proof caches, and updates [`db/seed_v2.sql`](file:///c:/Users/jprya/OneDrive/Documents/hobbyNotes/db/seed_v2.sql) automatically.

---

## 5. Sample Exploration Queries in DBeaver

### A. Curriculum Overview: Tracks, Segments & Reference Density
```sql
SELECT 
    t.title AS track,
    s.sequence_order,
    s.id AS segment_id,
    s.title AS chapter_title,
    count(r.id) AS formal_references_count
FROM segments s
JOIN curriculum_tracks t ON s.track_id = t.id
LEFT JOIN segment_references r ON r.segment_id = s.id
GROUP BY t.title, s.sequence_order, s.id, s.title
ORDER BY t.sequence_order, s.sequence_order;
```

### B. The Core Delineation: Subject Matter Viewed Across Formalisms
```sql
SELECT 
    sit.id AS situation_id,
    sit.title AS situation_title,
    sit.domain_category,
    f.name AS formalism,
    fs.id AS statement_id,
    fs.tier,
    fs.expression,
    cm.label AS calculation_mode
FROM situations sit
JOIN formal_statements fs ON fs.situation_id = sit.id
JOIN formalisms f ON fs.formalism_id = f.id
LEFT JOIN calculation_modes cm ON cm.statement_id = fs.id
ORDER BY sit.domain_category, sit.title;
```

### C. Formal Statement Coverage: Which Chapters Reference Which Theorems?
```sql
SELECT 
    fs.title AS formal_statement,
    fs.expression,
    s.id AS segment_id,
    s.title AS referenced_in_chapter,
    r.ref_type,
    r.anchor_text
FROM formal_statements fs
JOIN segment_references r ON r.statement_id = fs.id
JOIN segments s ON r.segment_id = s.id
ORDER BY fs.title, s.sequence_order;
```

### D. Pedagogical Prerequisites Graph (Learning Flow)
```sql
SELECT 
    s.title AS target_chapter,
    p.prerequisite_type,
    dep.title AS required_prior_chapter
FROM segment_prerequisites p
JOIN segments s ON p.segment_id = s.id
JOIN segments dep ON p.depends_on_segment_id = dep.id
ORDER BY s.sequence_order;
```

### E. Automated Parameter Mining & Lean Verifications
```sql
SELECT 
    pmj.job_key,
    fs.statement_key,
    cm.mode_key,
    pmj.target_symbol,
    pmj.status,
    pmj.require_integer_outputs
FROM parameter_mining_jobs pmj
JOIN formal_statements fs ON pmj.statement_id = fs.id
JOIN calculation_modes cm ON pmj.mode_id = cm.id;
```

