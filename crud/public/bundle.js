// clientLib/db/api.ts
var apiBaseUrl = typeof window !== "undefined" && window.location.port === "3000" ? "" : "http://localhost:3000";
async function executeSql(sql, params, transactionId = null) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params, transactionId })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: "error",
        message: `Server returned status ${response.status}`,
        error: errorText
      };
    }
    return await response.json();
  } catch (err) {
    console.error("[clientLib/db/api] executeSql error:", err);
    return {
      status: "error",
      message: "Could not connect to database bridge server. Is it running?",
      error: err?.message || String(err)
    };
  }
}
async function queryDatabase(sql, params) {
  const res = await executeSql(sql, params);
  if (res.status === "success" && res.data?.rows) {
    return res.data.rows;
  }
  if (res.status === "error") {
    console.warn(`[clientLib/db/api] Query failed: ${res.message}`, res.error);
  }
  return [];
}
async function getDatabaseHealth() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/health`);
    if (!response.ok) {
      return { status: "error", error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return {
      status: data.status === "connected" ? "connected" : "disconnected",
      database: data.database,
      user: data.user,
      error: data.error
    };
  } catch (err) {
    return { status: "error", error: err?.message || String(err) };
  }
}

// crud/src/crudConfig.ts
var tables = [
  // -------------------------------------------------------------------------
  // 1. Formal Axiomatic Statements & Proofs
  // -------------------------------------------------------------------------
  {
    table: "formal_statements",
    label: "Formal Statements & Axioms",
    singularLabel: "Formal Statement",
    columns: [
      { column: "statement_key", label: "Unique Key", canModify: true, len: 32 },
      { column: "scaffold_key", label: "Scaffold Key", canModify: true, len: 32 },
      { column: "title", label: "Statement Title", canModify: true, len: 45 },
      { column: "tier", label: "Epistemic Tier (Role)", canModify: true, len: 20 },
      { column: "type", label: "Subject Type", canModify: true, len: 18 },
      { column: "statement_kind", label: "Syntactic Kind (Form)", canModify: true, len: 20 },
      { column: "domain_category", label: "Domain Category", canModify: true, len: 24 },
      { column: "governing_seed", label: "Governing Seed", canModify: true, len: 20 },
      { column: "expression", label: "Mathematical Expression", canModify: true, len: 60, rows: 2 },
      { column: "description", label: "Conceptual Summary", canModify: true, len: 60, rows: 3, useHints: true },
      { column: "lean_signature", label: "Lean 4 Signature", canModify: true, len: 60, rows: 2 },
      { column: "lean_snippet", label: "Lean Code Snippet", canModify: true, len: 60, rows: 4 },
      { column: "lean_decl_id", label: "Governing Lean Declaration", canModify: true, len: 28 },
      { column: "status", label: "Editorial Status", canModify: true, len: 16 }
    ]
  },
  {
    table: "lean_declarations",
    label: "Lean 4 Formal Declarations",
    singularLabel: "Lean Declaration",
    columns: [
      { column: "name", label: "Declaration Name", canModify: true, len: 32 },
      { column: "kind", label: "Kind (inductive/def/theorem/structure)", canModify: true, len: 18 },
      { column: "signature", label: "Lean Signature", canModify: true, len: 60, rows: 2 },
      { column: "doc_comment", label: "Docstring / Commentary", canModify: true, len: 60, rows: 3 },
      { column: "line_no", label: "Line in Scaffold.lean", canModify: false, len: 10 },
      { column: "qed_status", label: "Q.E.D. Verified", canModify: true, len: 10 },
      { column: "decl_key", label: "Unique Identifier", canModify: true, len: 32 }
    ]
  },
  {
    table: "domains",
    label: "Mathematical & Physical Domains",
    singularLabel: "Domain",
    columns: [
      { column: "domain_key", label: "Domain Key", canModify: true, len: 24 },
      { column: "symbol", label: "Mathematical Symbol", canModify: true, len: 16 },
      { column: "name", label: "Domain Name", canModify: true, len: 36 },
      { column: "category", label: "Domain Category", canModify: true, len: 20 },
      { column: "lean_type", label: "Lean 4 Type Name", canModify: true, len: 28 },
      { column: "lean_decl_id", label: "Grounded Lean Declaration", canModify: true, len: 28 },
      { column: "base_unit", label: "Physical Base Unit", canModify: true, len: 16 },
      { column: "description", label: "Domain Description", canModify: true, len: 60, rows: 3 }
    ]
  },
  {
    table: "lean_verifications",
    label: "Lean Kernel Verifications",
    singularLabel: "Lean Verification",
    columns: [
      { column: "statement_id", label: "Governing Statement", canModify: false, len: 24 },
      { column: "theorem_name", label: "Lean Theorem Name", canModify: true, len: 32 },
      { column: "proof_status", label: "Proof Status", canModify: true, len: 20 },
      { column: "elapsed_ms", label: "Verification Elapsed (ms)", canModify: true, len: 12 },
      { column: "lean_code", label: "Verified Proof Code", canModify: true, len: 60, rows: 6 },
      { column: "diagnostics", label: "Compiler Output & Diagnostics", canModify: true, len: 60, rows: 4 }
    ]
  },
  // -------------------------------------------------------------------------
  // 2. Directed Equations, Slots, & Numerical Presets
  // -------------------------------------------------------------------------
  {
    table: "directed_equations",
    label: "Computational Stencils",
    singularLabel: "Computational Stencil",
    columns: [
      { column: "equation_key", label: "Equation Key", canModify: true, len: 32 },
      { column: "title", label: "Equation Title", canModify: true, len: 45 },
      { column: "label", label: "Short Label", canModify: true, len: 24 },
      { column: "formula_expr", label: "Formula Expression", canModify: true, len: 55, rows: 2 },
      { column: "target_symbol", label: "Target Output Symbol", canModify: true, len: 12 },
      { column: "target_domain", label: "Target Domain (e.g. \u211D_\u03C9, \u{1D539})", canModify: true, len: 16 },
      { column: "target_unit", label: "Target Unit", canModify: true, len: 16 },
      { column: "statement_id", label: "Governing Formal Statement", canModify: true, len: 30 },
      { column: "pseudo_algo_id", label: "Linked Pseudocode Algorithm", canModify: true, len: 30 },
      { column: "formula_description", label: "Formula Description", canModify: true, len: 60, rows: 3 },
      { column: "has_simulation", label: "Simulation Sandbox Ready", canModify: true, len: 10 }
    ]
  },
  {
    table: "mode_slots",
    label: "Equation Mode Slots",
    singularLabel: "Mode Slot",
    columns: [
      { column: "equation_id", label: "Parent Equation", canModify: false, len: 24 },
      { column: "slot_index", label: "Slot Index (#)", canModify: true, len: 8 },
      { column: "symbol", label: "Parameter Symbol", canModify: true, len: 12 },
      { column: "label", label: "Parameter Label", canModify: true, len: 24 },
      { column: "domain_set", label: "Parameter Domain", canModify: true, len: 16 },
      { column: "default_val", label: "Default Value", canModify: true, len: 16 },
      { column: "min_val", label: "Minimum Range", canModify: true, len: 14 },
      { column: "max_val", label: "Maximum Range", canModify: true, len: 14 },
      { column: "step_val", label: "Step Precision", canModify: true, len: 14 },
      { column: "unit", label: "Unit", canModify: true, len: 16 }
    ]
  },
  // -------------------------------------------------------------------------
  // 3. Curriculum, Outline Tree, & Modular Chapters
  // -------------------------------------------------------------------------
  {
    table: "apps",
    label: "Applications (Curricula)",
    singularLabel: "Application",
    columns: [
      { column: "app_code", label: "Application Code", canModify: true, len: 20 },
      { column: "name", label: "Application Title", canModify: true, len: 36 },
      { column: "domain", label: "Target Web Domain", canModify: true, len: 36 },
      { column: "description", label: "Description", canModify: true, len: 55, rows: 2 },
      { column: "is_active", label: "Is Active Publication", canModify: true, len: 10 }
    ]
  },
  {
    table: "curriculum_nav_items",
    label: "Curriculum Outline Tree",
    singularLabel: "Outline Item",
    columns: [
      { column: "nav_key", label: "Navigation Key", canModify: true, len: 32 },
      { column: "app_id", label: "Application", canModify: true, len: 20 },
      { column: "parent_id", label: "Parent Section (Outline Tree)", canModify: true, len: 24 },
      { column: "sequence_order", label: "Display Order (#)", canModify: true, len: 8 },
      { column: "item_type", label: "Item Type (html/section/diagram)", canModify: true, len: 16 },
      { column: "topic", label: "Course Topic / Title", canModify: true, len: 45 },
      { column: "nav_topic", label: "Short Nav Pill Label", canModify: true, len: 24 },
      { column: "segment_id", label: "Target Segment Chapter", canModify: true, len: 28 },
      { column: "diagram_key", label: "Attached Interactive Diagram", canModify: true, len: 28 }
    ]
  },
  {
    table: "segments",
    label: "Lecture Segments (Chapters)",
    singularLabel: "Segment Chapter",
    columns: [
      { column: "seg_key", label: "Segment Key", canModify: true, len: 32 },
      { column: "sequence_order", label: "Chapter Order (#)", canModify: true, len: 8 },
      { column: "title", label: "Lecture Title", canModify: true, len: 45 },
      { column: "slug", label: "URL Slug", canModify: true, len: 32 },
      { column: "summary", label: "Executive Chapter Summary", canModify: true, len: 60, rows: 3 },
      { column: "content_html", label: "Full HTML Lecture Body", canModify: true, len: 60, rows: 12 },
      { column: "status", label: "Editorial Status", canModify: true, len: 16 }
    ]
  },
  // -------------------------------------------------------------------------
  // 4. Algorithms & Interactive Demos
  // -------------------------------------------------------------------------
  {
    table: "pseudocode_algorithms",
    label: "Pseudocode Algorithms",
    singularLabel: "Algorithm",
    columns: [
      { column: "algo_key", label: "Algorithm Key", canModify: true, len: 32 },
      { column: "name", label: "Algorithm Name", canModify: true, len: 40 },
      { column: "func_name", label: "Internal Function Name", canModify: true, len: 28 },
      { column: "category", label: "Algorithmic Domain", canModify: true, len: 24 },
      { column: "algo_kind", label: "Kind (operation/predicate)", canModify: true, len: 20 },
      { column: "badge", label: "Display Badge", canModify: true, len: 20 },
      { column: "signature", label: "Formal Type Signature", canModify: true, len: 45 },
      { column: "scaffold_key", label: "Supporting FS Scaffold", canModify: true, len: 32 },
      { column: "summary", label: "Algorithmic Summary", canModify: true, len: 60, rows: 3 },
      { column: "code", label: "Pseudocode Definition", canModify: true, len: 60, rows: 8 },
      { column: "tree_complexity", label: "Tree Time Complexity", canModify: true, len: 20 },
      { column: "dyadic_complexity", label: "Dyadic Space Complexity", canModify: true, len: 20 }
    ]
  },
  {
    table: "interactive_demos",
    label: "Interactive Sandbox Demos",
    singularLabel: "Interactive Demo",
    columns: [
      { column: "title", label: "Demo Title", canModify: true, len: 45 },
      { column: "engine", label: "Engine Type", canModify: false, len: 16 },
      { column: "mode", label: "Canvas / Operational Mode", canModify: false, len: 24 },
      { column: "expression", label: "Proposition Formula / Expression", canModify: true, len: 45 },
      { column: "status", label: "Logical Status", canModify: true, len: 16, options: ["taut", "cont", "unsat"] },
      { column: "init_packet", label: "Initialization JSON / Expression Packet", canModify: true, len: 55, rows: 4 },
      { column: "description", label: "Instructional Description", canModify: true, len: 60, rows: 3 }
    ]
  },
  // -------------------------------------------------------------------------
  // 5. Cross-References & Prerequisites
  // -------------------------------------------------------------------------
  {
    table: "segment_references",
    label: "Segment Embedded Citations",
    singularLabel: "Segment Reference",
    columns: [
      { column: "segment_id", label: "Source Segment Chapter", canModify: false, len: 24 },
      { column: "ref_type", label: "Reference Tag Type (fs/stencil/ttd/demo/algo)", canModify: true, len: 18 },
      { column: "target_key", label: "Target Referenced Key", canModify: true, len: 32 },
      { column: "statement_id", label: "Linked Formal Statement", canModify: true, len: 24 },
      { column: "equation_id", label: "Linked Stencil Equation", canModify: true, len: 24 },
      { column: "demo_id", label: "Linked Interactive Demo / TTD", canModify: true, len: 24 },
      { column: "algo_id", label: "Linked Pseudocode Algorithm", canModify: true, len: 24 },
      { column: "anchor_text", label: "Embedded Anchor Text", canModify: true, len: 36 },
      { column: "occurrence_order", label: "Occurrence Order (#)", canModify: true, len: 8 }
    ]
  },
  {
    table: "segment_prerequisites",
    label: "Segment Prerequisites Graph",
    singularLabel: "Segment Prerequisite",
    columns: [
      { column: "segment_id", label: "Target Segment Chapter", canModify: false, len: 24 },
      { column: "prerequisite_segment_id", label: "Prerequisite Segment", canModify: true, len: 24 },
      { column: "prereq_type", label: "Prerequisite Dependency Kind", canModify: true, len: 20 },
      { column: "rationale", label: "Pedagogical Rationale", canModify: true, len: 55, rows: 2 }
    ]
  },
  {
    table: "domains",
    label: "Mathematical & Physical Domains",
    singularLabel: "Domain",
    columns: [
      { column: "domain_key", label: "Domain Key", canModify: true, len: 24 },
      { column: "symbol", label: "Unicode Symbol", canModify: true, len: 12 },
      { column: "name", label: "Domain Name", canModify: true, len: 36 },
      { column: "category", label: "Category", canModify: true, len: 20 },
      { column: "lean_type", label: "Lean 4 Type / Structure", canModify: true, len: 32 },
      { column: "lean_file", label: "Lean Source File", canModify: true, len: 45 },
      { column: "base_unit", label: "Base Unit", canModify: true, len: 16 },
      { column: "description", label: "Semantic Description", canModify: true, len: 60, rows: 3 }
    ]
  }
];
var dependents = [
  { table: "directed_equations", parent: "formal_statements", displayColumns: ["equation_key", "title"] },
  { table: "lean_verifications", parent: "formal_statements", displayColumns: ["theorem_name", "proof_status"] },
  { table: "mode_slots", parent: "directed_equations", displayColumns: ["slot_index", "symbol", "label"] },
  { table: "curriculum_nav_items", parent: "apps", displayColumns: ["sequence_order", "topic"] },
  { table: "segment_references", parent: "segments", displayColumns: ["ref_type", "target_key"] },
  { table: "segment_references", parent: "interactive_demos", displayColumns: ["ref_type", "segment_id"] },
  { table: "segment_prerequisites", parent: "segments", displayColumns: ["prerequisite_segment_id", "prereq_type"] }
];
var navigations = [
  {
    label: "\u{1F4DC} Axioms & Formal Statements",
    children: [
      { table: "formal_statements" },
      { table: "lean_verifications" }
    ]
  },
  {
    label: "\u{1F4D0} Computational Stencils",
    children: [
      { table: "directed_equations" },
      { table: "mode_slots" }
    ]
  },
  {
    label: "\u{1F332} Curriculum & Chapters",
    children: [
      { table: "apps" },
      { table: "curriculum_nav_items" },
      { table: "segments" }
    ]
  },
  {
    label: "\u{1F4BB} Algorithms & Demos",
    children: [
      { table: "pseudocode_algorithms" },
      { table: "interactive_demos" }
    ]
  },
  {
    label: "\u{1F517} Cross-References & Citations",
    children: [
      { table: "segment_references" },
      { table: "segment_prerequisites" }
    ]
  }
];

// crud/src/validation.ts
async function validateAndBuildMetadata() {
  console.log("[crudValidation] Starting configuration validation against PostgreSQL...");
  const [isConfigValid, configError] = validateInternalConfig();
  if (!isConfigValid) throw configError;
  const [dbTables, dbColumns, dbForeignKeys, dbEnums] = await Promise.all([
    fetchTables(),
    fetchColumns(),
    fetchForeignKeys(),
    fetchEnums()
  ]);
  const enumMap = {};
  for (const item of dbEnums) {
    if (!enumMap[item.enum_name]) {
      enumMap[item.enum_name] = [];
    }
    enumMap[item.enum_name].push(item.enum_value);
  }
  const enrichedMetadata = {};
  for (const tableConfig of tables) {
    const foundDbTable = dbTables.find((t) => t.tablename.toLowerCase() === tableConfig.table.toLowerCase());
    if (!foundDbTable) {
      console.warn(`[crudValidation] DB Schema Warning: Table '${tableConfig.table}' not found in active database.`);
      continue;
    }
    const columnsForThisTable = dbColumns.filter(
      (c) => c.table_name.toLowerCase() === tableConfig.table.toLowerCase()
    );
    const enrichedTable = {
      tableName: tableConfig.table,
      label: tableConfig.label,
      singularLabel: tableConfig.singularLabel || tableConfig.label,
      exclusiveFieldSets: tableConfig.exclusiveFieldSets,
      columns: {},
      dependents: dependents.filter((d) => d.parent === tableConfig.table)
    };
    for (const colConfig of tableConfig.columns) {
      const dbCol = columnsForThisTable.find(
        (c) => c.column_name.toLowerCase() === colConfig.column.toLowerCase()
      );
      if (!dbCol) {
        console.warn(`[crudValidation] DB Column Warning: Column '${colConfig.column}' on table '${tableConfig.table}' not in schema.`);
        continue;
      }
      const fkInfo = dbForeignKeys.find(
        (fk) => fk.source_table === tableConfig.table && fk.source_column === colConfig.column
      );
      const isExplicitOptions = Array.isArray(colConfig.options) && colConfig.options.length > 0;
      const isDbEnum = enumMap.hasOwnProperty(dbCol.udt_name);
      const isEnum = isExplicitOptions || isDbEnum;
      const enumValues = isExplicitOptions ? typeof colConfig.options[0] === "string" ? colConfig.options : colConfig.options.map((o) => o.value) : isDbEnum ? enumMap[dbCol.udt_name] : [];
      const enrichedCol = {
        ...colConfig,
        label: colConfig.label || colConfig.column,
        isPrimaryKey: colConfig.column === "id",
        isForeignKey: !!fkInfo,
        foreignKeyTable: fkInfo?.target_table,
        isEnum,
        enumValues,
        dbDataType: dbCol.data_type,
        isNullable: dbCol.is_nullable === "YES"
      };
      enrichedTable.columns[colConfig.column] = enrichedCol;
    }
    enrichedMetadata[tableConfig.table] = enrichedTable;
  }
  for (const fk of dbForeignKeys) {
    if (fk.source_table === fk.target_table && enrichedMetadata[fk.source_table]) {
      enrichedMetadata[fk.source_table].parentColumn = fk.source_column;
    }
  }
  console.log(`[crudValidation] Validation successful. Enriched ${Object.keys(enrichedMetadata).length} tables.`);
  return enrichedMetadata;
}
function validateInternalConfig() {
  const definedTableNames = new Set(tables.map((t) => t.table));
  for (const navPath of allNavPaths(navigations)) {
    if (!navPath.table && !navPath.label) {
      return [false, new Error(`Internal Config Error: A navigation node is missing both 'table' and 'label'.`)];
    }
    if (navPath.table && !definedTableNames.has(navPath.table)) {
      return [false, new Error(`Internal Config Error: Nav table '${navPath.table}' not defined in tables array.`)];
    }
  }
  for (const dep of dependents) {
    if (!definedTableNames.has(dep.table)) {
      return [false, new Error(`Internal Config Error: Dependent table '${dep.table}' not defined in tables array.`)];
    }
    if (!definedTableNames.has(dep.parent)) {
      return [false, new Error(`Internal Config Error: Dependent parent '${dep.parent}' not defined in tables array.`)];
    }
  }
  return [true, null];
}
function* allNavPaths(paths) {
  for (const path of paths) {
    yield path;
    if (path.children) {
      yield* allNavPaths(path.children);
    }
  }
}
async function fetchTables() {
  return queryDatabase("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
}
async function fetchColumns() {
  const sql = `
        SELECT table_name, column_name, data_type, udt_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    `;
  return queryDatabase(sql);
}
async function fetchForeignKeys() {
  const sql = `
        SELECT 
            kcu.table_name AS source_table, 
            kcu.column_name AS source_column, 
            ccu.table_name AS target_table
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu 
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
  return queryDatabase(sql);
}
async function fetchEnums() {
  const sql = `
        SELECT t.typname AS enum_name, e.enumlabel AS enum_value 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typtype = 'e';
    `;
  return queryDatabase(sql);
}

// crud/src/menuTree.ts
var navigationMenuTree = [
  // -------------------------------------------------------------------------
  // 1. Curriculum Outline Index Entries (The Course Tree Hierarchy)
  // -------------------------------------------------------------------------
  {
    label: "Index Entries",
    icon: "\u{1F332}",
    typeKey: "curriculum_nav_item",
    children: [
      {
        label: "Introduction & Overview",
        subject: "all",
        children: [
          { label: "Mission & Epistemology", typeKey: "curriculum_nav_item", instanceKey: "introduction", subject: "all" },
          { label: "The Three Architectural Models", typeKey: "curriculum_nav_item", instanceKey: "modelsOverview", subject: "all" },
          { label: "Conceptual History & Methodological Notes", typeKey: "curriculum_nav_item", instanceKey: "conceptualHistoryIntro", subject: "all" }
        ]
      },
      {
        label: "Level 1: Logic & Number",
        children: [
          { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "level1Overview", subject: "logic" },
          {
            label: "Propositional Logic",
            subject: "logic",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "propLogicIntro", subject: "logic" },
              { label: "Truth Tables & Paradoxes", typeKey: "curriculum_nav_item", instanceKey: "propLogicLecture", subject: "logic" }
            ]
          },
          {
            label: "Formal Statements",
            subject: "logic",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "formalStatementsIntro", subject: "logic" },
              { label: "Sets, Tuples & Constructors", typeKey: "curriculum_nav_item", instanceKey: "formalStatementsLecture1", subject: "logic" },
              { label: "Algebra of Sets", typeKey: "curriculum_nav_item", instanceKey: "formalStatementsLecture2", subject: "logic" }
            ]
          },
          {
            label: "Numbers & Conway Trees",
            subject: "numbers_trees",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "numbersIntro", subject: "numbers_trees" },
              { label: "Binary Sequences & Counting", typeKey: "curriculum_nav_item", instanceKey: "numbersLecture1", subject: "numbers_trees" },
              { label: "Surreal Number Line & Growth", typeKey: "curriculum_nav_item", instanceKey: "numbersLecture2", subject: "numbers_trees" },
              { label: "Infinitesimal Arithmetic & STEM Spaces", typeKey: "curriculum_nav_item", instanceKey: "numbersLecture3", subject: "numbers_trees" }
            ]
          }
        ]
      },
      {
        label: "Level 2: Algebraic Structure & Linearity",
        subject: "algebra",
        children: [
          { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "lamOverview", subject: "algebra" },
          { label: "Sequences & Progressions", typeKey: "curriculum_nav_item", instanceKey: "sequencesAndSums", subject: "algebra" },
          { label: "Vector Foundations Overview", typeKey: "curriculum_nav_item", instanceKey: "vectorFoundationsIntro", subject: "algebra" },
          {
            label: "Linear Algebra & Symmetries",
            subject: "algebra",
            children: [
              { label: "Emergent Groups & Fields", typeKey: "curriculum_nav_item", instanceKey: "vectorsLecture1", subject: "algebra" },
              { label: "Structure-Preserving Maps", typeKey: "curriculum_nav_item", instanceKey: "vectorsLecture2", subject: "algebra" },
              { label: "Vector Spaces & Duality", typeKey: "curriculum_nav_item", instanceKey: "vectorsLecture3", subject: "algebra" }
            ]
          }
        ]
      },
      {
        label: "Level 3: Continuum & Calculus",
        subject: "analysis",
        children: [
          { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "analysis1DIntro", subject: "analysis" },
          {
            label: "1D Analysis",
            subject: "analysis",
            children: [
              { label: "Continuum & Continuity", typeKey: "curriculum_nav_item", instanceKey: "analysis1DLecture1", subject: "analysis" },
              { label: "Derivatives & Linearity", typeKey: "curriculum_nav_item", instanceKey: "analysis1DLecture2", subject: "analysis" },
              { label: "Accumulation & Calculus", typeKey: "curriculum_nav_item", instanceKey: "analysis1DLecture3", subject: "analysis" }
            ]
          },
          {
            label: "2D Analysis",
            subject: "analysis",
            children: [
              { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "analysis2DIntro", subject: "analysis" },
              { label: "2D Grid & Conformal Maps", typeKey: "curriculum_nav_item", instanceKey: "analysis2DLecture1", subject: "analysis" },
              { label: "Contour Integrals & Residues", typeKey: "curriculum_nav_item", instanceKey: "analysis2DLecture2", subject: "analysis" },
              { label: "State Evolution & Phase", typeKey: "curriculum_nav_item", instanceKey: "analysis2DLecture3", subject: "analysis" }
            ]
          }
        ]
      },
      {
        label: "Level 4: Space & Growth",
        subject: "analysis",
        children: [
          { label: "Trigonometry & Rotor Foundations", typeKey: "curriculum_nav_item", instanceKey: "stemTrigFoundations", subject: "analysis" },
          {
            label: "Transcendental Engine",
            subject: "analysis",
            children: [
              { label: "Exponential & Logarithmic Foundations", typeKey: "curriculum_nav_item", instanceKey: "stemExpLogFoundations", subject: "analysis" },
              { label: "Circular Dynamics & Trigonometric Derivatives", typeKey: "curriculum_nav_item", instanceKey: "stemTrigDerivatives", subject: "analysis" }
            ]
          }
        ]
      },
      {
        label: "Level 5: Quantum & Information",
        subject: "information",
        children: [
          { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "level5Overview", subject: "information" },
          {
            label: "Bayesian Inference",
            subject: "information",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "bayesianInferenceIntro", subject: "information" },
              { label: "Normalized Probability Space", typeKey: "curriculum_nav_item", instanceKey: "bayesianInferenceLecture1", subject: "information" },
              { label: "Conditional Probability & Bayes Filter", typeKey: "curriculum_nav_item", instanceKey: "bayesianInferenceLecture2", subject: "information" },
              { label: "Sequential Updating & Evidence Streams", typeKey: "curriculum_nav_item", instanceKey: "bayesianInferenceLecture3", subject: "information" },
              { label: "State Spaces & Entropy", typeKey: "curriculum_nav_item", instanceKey: "bayesianInferenceLecture4", subject: "information" }
            ]
          },
          {
            label: "Quantum Logic",
            subject: "information",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "quantumLogicIntro", subject: "information" },
              { label: "Three Polarizers & Venn Failure", typeKey: "curriculum_nav_item", instanceKey: "quantumLogicLecture1", subject: "information" },
              { label: "Complex Amplitudes & Projection", typeKey: "curriculum_nav_item", instanceKey: "quantumLogicLecture2", subject: "information" },
              { label: "Orthomodular Lattice Geometry", typeKey: "curriculum_nav_item", instanceKey: "quantumLogicLecture3", subject: "information" }
            ]
          },
          {
            label: "Quantum Bayesian Inference",
            subject: "information",
            children: [
              { label: "Introduction", typeKey: "curriculum_nav_item", instanceKey: "quantumBayesianInferenceIntro", subject: "information" },
              { label: "Density Operators & L\xFCders Rule", typeKey: "curriculum_nav_item", instanceKey: "quantumBayesianInferenceLecture1", subject: "information" },
              { label: "Entanglement & Macroscopic Emergence", typeKey: "curriculum_nav_item", instanceKey: "quantumBayesianInferenceLecture2", subject: "information" }
            ]
          }
        ]
      },
      {
        label: "Level 6: Applied Seminars",
        children: [
          { label: "Overview", typeKey: "curriculum_nav_item", instanceKey: "satelliteSeminarsIntro", subject: "physics" },
          {
            label: "Applied Physics",
            subject: "physics",
            children: [
              { label: "Newtonian Kinematics & Conservation", typeKey: "curriculum_nav_item", instanceKey: "stemNewtonianBridge", subject: "physics" },
              { label: "1D Heat Diffusion", typeKey: "curriculum_nav_item", instanceKey: "stemHeatDiffusion", subject: "physics" }
            ]
          },
          {
            label: "Mini-Seminars",
            subject: "analysis",
            children: [
              { label: "Fourier Transforms", typeKey: "curriculum_nav_item", instanceKey: "fourierTransformSeminar", subject: "analysis" },
              { label: "Halo Soup & Cosmology", typeKey: "curriculum_nav_item", instanceKey: "haloSoupSeminar", subject: "analysis" },
              { label: "Holographic Principle & Boundary Codings", typeKey: "curriculum_nav_item", instanceKey: "holographicPrincipleSeminar", subject: "physics" },
              { label: "Higher Successors & Transfinite Hierarchies", typeKey: "curriculum_nav_item", instanceKey: "higherSuccessorsSeminar", subject: "numbers_trees" },
              { label: "Cosmology as Information", typeKey: "curriculum_nav_item", instanceKey: "cosmologyAsInformation", subject: "information" }
            ]
          },
          {
            label: "Satellite Masterclasses",
            subject: "physics",
            children: [
              { label: "Particle Zoo Logic", typeKey: "curriculum_nav_item", instanceKey: "particleZooSeminar", subject: "physics" },
              { label: "Quantum Entanglement & Tensor Networks", typeKey: "curriculum_nav_item", instanceKey: "quantumEntanglementSeminar", subject: "information" },
              { label: "Algebraic Geometry on Dyadic Rings", typeKey: "curriculum_nav_item", instanceKey: "algebraicGeometrySeminar", subject: "numbers_trees" }
            ]
          }
        ]
      },
      {
        label: "Research & Proposals",
        subject: "all",
        children: [
          { label: "Lean 4 General Education Curriculum", typeKey: "curriculum_nav_item", instanceKey: "lean4GenEdProposal", subject: "all" },
          { label: "Dual-Agent Academic Pair Programming", typeKey: "curriculum_nav_item", instanceKey: "dualAgentAcademicProposal", subject: "all" },
          { label: "Minimal Axiomatic Core for General Science", typeKey: "curriculum_nav_item", instanceKey: "minimalAxiomaticCoreProposal", subject: "all" }
        ]
      },
      { label: "Browse All Index Entries", typeKey: "curriculum_nav_item", subject: "all" }
    ]
  },
  // -------------------------------------------------------------------------
  // 2. Formal Axiomatic Statements (Tier 1: Declarative Statements & DE Rules)
  // -------------------------------------------------------------------------
  {
    label: "Formal Statements",
    icon: "\u{1F4D0}",
    typeKey: "formal_statement",
    children: [
      {
        label: "Axioms",
        typeKey: "axiom",
        filterKind: { column: "statement_kind", value: "axiom" },
        children: [
          { label: "Hyperfinite Probability Space", typeKey: "formal_statement", instanceKey: "fs_hyperfinite_probability", subject: "information" },
          { label: "Core Dyadic Isomorphism", typeKey: "formal_statement", instanceKey: "fs_dyadic_isomorphism", subject: "numbers_trees" },
          { label: "van den Dries\u2013Ehrlich Subfield", typeKey: "formal_statement", instanceKey: "fs_van_den_dries_ehrlich", subject: "numbers_trees" },
          { label: "Browse All Axioms", typeKey: "axiom", subject: "all" }
        ]
      },
      {
        label: "Theorems",
        typeKey: "theorem",
        filterKind: { column: "statement_kind", value: "theorem" },
        children: [
          { label: "Newtonian Dynamics & Acceleration", typeKey: "formal_statement", instanceKey: "fs_newtonian_mechanics", subject: "physics" },
          { label: "Telescoping FTC", typeKey: "formal_statement", instanceKey: "fs_telescoping_ftc", subject: "analysis" },
          { label: "Cauchy-Riemann Coordinate Symmetry", typeKey: "formal_statement", instanceKey: "fs_cauchy_riemann_symmetry", subject: "analysis" },
          { label: "Hyperfinite Cauchy-Goursat Loop Vanishing", typeKey: "formal_statement", instanceKey: "fs_contour_cauchy_goursat", subject: "analysis" },
          { label: "Lee-Yang Unit Circle Partition", typeKey: "formal_statement", instanceKey: "fs_lee_yang_circle", subject: "physics" },
          { label: "Total Ordering on Tree2", typeKey: "formal_statement", instanceKey: "fs_tree2_totally_ordered", subject: "numbers_trees" },
          { label: "Standard Part Ring Homomorphism", typeKey: "formal_statement", instanceKey: "fs_standard_part_homomorphism", subject: "analysis" },
          { label: "Discrete Cauchy-Schwarz Inequality", typeKey: "formal_statement", instanceKey: "fs_cauchy_schwarz_discrete", subject: "algebra" },
          { label: "Browse All Theorems", typeKey: "theorem", subject: "all" }
        ]
      },
      {
        label: "Directed Equalities",
        typeKey: "directed_equality",
        filterKind: { column: "statement_kind", value: "directed_equality" },
        children: [
          // Logic & Order Predicates (Codomain 𝔹)
          { label: "Definitional Assignment (:=)", typeKey: "formal_statement", instanceKey: "fs_pred_assign", subject: "logic" },
          { label: "Greater-Than (GT / >)", typeKey: "formal_statement", instanceKey: "fs_pred_gt", subject: "logic" },
          { label: "Less-Than (LT / <)", typeKey: "formal_statement", instanceKey: "fs_pred_lt", subject: "logic" },
          { label: "Identity / Equality (EQ / =)", typeKey: "formal_statement", instanceKey: "fs_pred_eq", subject: "logic" },
          { label: "Less-Than-or-Equal (LE / \u2264)", typeKey: "formal_statement", instanceKey: "fs_pred_le", subject: "logic" },
          { label: "Set Membership (MEM / \u2208)", typeKey: "formal_statement", instanceKey: "fs_pred_mem", subject: "logic" },
          { label: "Subset Inclusion (SUBSET / \u2286)", typeKey: "formal_statement", instanceKey: "fs_pred_subset", subject: "logic" },
          // Numbers, Trees & Arithmetic
          { label: "Conway Inductive Addition (+)", typeKey: "formal_statement", instanceKey: "fs_conway_addition", subject: "numbers_trees" },
          { label: "Conway Inductive Multiplication (\xB7)", typeKey: "formal_statement", instanceKey: "fs_conway_multiplication", subject: "numbers_trees" },
          { label: "Divisibility (DIV / \u2223)", typeKey: "formal_statement", instanceKey: "fs_pred_div", subject: "numbers_trees" },
          { label: "Even Parity (EVEN)", typeKey: "formal_statement", instanceKey: "fs_pred_even", subject: "numbers_trees" },
          { label: "Odd Parity (ODD)", typeKey: "formal_statement", instanceKey: "fs_pred_odd", subject: "numbers_trees" },
          { label: "Successor Step (SUCC / +1)", typeKey: "formal_statement", instanceKey: "fs_pred_succ", subject: "numbers_trees" },
          // Discrete Analysis & Continuum Stencils
          { label: "Hyperfinite Difference Quotient Derivative", typeKey: "formal_statement", instanceKey: "fs_hyperfinite_derivative", subject: "analysis" },
          { label: "2D Complex Step & Modulus Invariance", typeKey: "formal_statement", instanceKey: "fs_complex_step_invariance", subject: "analysis" },
          { label: "Infinitesimal Proximity (NEAR / \u2248)", typeKey: "formal_statement", instanceKey: "fs_pred_near", subject: "analysis" },
          { label: "Dyadic Ptolemaic Half-Angle Root Bisection", typeKey: "formal_statement", instanceKey: "fs_ptolemaic_half_angle", subject: "analysis" },
          { label: "Dyadic Polygonal Rim Chord Law", typeKey: "formal_statement", instanceKey: "fs_polygonal_rim_chord", subject: "analysis" },
          { label: "Euler Polar Rotor Decomposition", typeKey: "formal_statement", instanceKey: "fs_euler_identity_rotor", subject: "analysis" },
          { label: "Unit Rotor Sine & Cosine Projection", typeKey: "formal_statement", instanceKey: "fs_unit_rotor_projection", subject: "analysis" },
          // Physics & Dynamics Stencils
          { label: "Uniform Free Fall Kinematics", typeKey: "formal_statement", instanceKey: "fs_free_fall_accel", subject: "physics" },
          { label: "Telescoping Work-Energy Principle", typeKey: "formal_statement", instanceKey: "fs_work_energy", subject: "physics" },
          { label: "Discrete Thermal Diffusion Balance", typeKey: "formal_statement", instanceKey: "fs_heat_flux", subject: "physics" },
          { label: "Harmonic Leapfrog Phase Space Orbit", typeKey: "formal_statement", instanceKey: "fs_harmonic_oscillator", subject: "physics" },
          { label: "Three-Polarizer Geometric Transmission", typeKey: "formal_statement", instanceKey: "fs_three_polarizer_quantum", subject: "physics" },
          // Information & Signals
          { label: "Hyperfinite Bayesian Likelihood Inversion", typeKey: "formal_statement", instanceKey: "fs_bayes_updating", subject: "information" },
          { label: "Browse All Directed Equalities", typeKey: "directed_equality", subject: "all" }
        ]
      },
      { label: "Browse All Formal Statements", typeKey: "formal_statement", subject: "all" }
    ]
  },
  // -------------------------------------------------------------------------
  // 3. Demo Initializations (Tier 2: Interactive Sandbox Demos & Presets)
  // -------------------------------------------------------------------------
  {
    label: "Demo Initializations",
    icon: "\u{1F39B}\uFE0F",
    typeKey: "demo_initializations",
    children: [
      {
        label: "Truth Table Demo (TTD)",
        typeKey: "ttd",
        subject: "logic",
        children: [
          { label: "De Morgan's First Law", typeKey: "ttd", instanceId: 2, subject: "logic" },
          { label: "Modus Ponens (Detachment)", typeKey: "ttd", instanceId: 3, subject: "logic" },
          { label: "Law of Excluded Middle", typeKey: "ttd", instanceId: 4, subject: "logic" },
          { label: "Principle of Non-Contradiction", typeKey: "ttd", instanceId: 5, subject: "logic" },
          { label: "Material Implication (\u2192)", typeKey: "ttd", instanceId: 6, subject: "logic" },
          { label: "Material Equivalence (\u2194)", typeKey: "ttd", instanceId: 7, subject: "logic" },
          { label: "Hypothetical Syllogism", typeKey: "ttd", instanceId: 8, subject: "logic" },
          { label: "Browse All TTD Initializations", typeKey: "ttd", subject: "logic" }
        ]
      },
      {
        label: "Binary Tree Demo (BTD)",
        typeKey: "btd",
        subject: "numbers_trees",
        children: [
          { label: "Surreal Tree Total Order", typeKey: "btd", instanceId: 9, subject: "numbers_trees" },
          { label: "Conway Inductive Addition (+)", typeKey: "btd", instanceId: 10, subject: "numbers_trees" },
          { label: "Conway Inductive Multiplication (\xB7)", typeKey: "btd", instanceId: 11, subject: "numbers_trees" },
          { label: "Labeled Dyadic Sequences", typeKey: "btd", instanceId: 12, subject: "numbers_trees" },
          { label: "Browse All BTD Initializations", typeKey: "btd", subject: "numbers_trees" }
        ]
      },
      {
        label: "Binary Interval Demo (BID)",
        typeKey: "bid",
        subject: "analysis",
        children: [
          { label: "Dyadic Interval Subdivision", typeKey: "bid", instanceId: 13, subject: "analysis" },
          { label: "Unit Rotor Circle Projection", typeKey: "bid", instanceId: 14, subject: "analysis" },
          { label: "Browse All BID Initializations", typeKey: "bid", subject: "analysis" }
        ]
      },
      {
        label: "Formal Statements Demo (FSD)",
        typeKey: "fsd",
        subject: "all",
        children: [
          { label: "Formal Structure Stage Visualizer", typeKey: "fsd", instanceId: 15, subject: "all" },
          { label: "Browse All FSD Initializations", typeKey: "fsd", subject: "all" }
        ]
      },
      { label: "Browse All Demo Initializations", typeKey: "interactive_demos", subject: "all" }
    ]
  }
];
function getFilteredMenuTree(subject = "all") {
  if (!subject || subject === "all") {
    return navigationMenuTree;
  }
  function filterItem(item) {
    if (!item.children || item.children.length === 0) {
      if (!item.subject || item.subject === "all" || item.subject === subject) {
        return item;
      }
      return null;
    }
    const filteredChildren = item.children.map(filterItem).filter((c) => c !== null);
    if (filteredChildren.length > 0) {
      return {
        ...item,
        children: filteredChildren
      };
    }
    if (item.subject && (item.subject === subject || item.subject === "all")) {
      return {
        ...item,
        children: []
      };
    }
    return null;
  }
  return navigationMenuTree.map(filterItem).filter((c) => c !== null);
}
function renderMenuHierarchy(items) {
  return items.map((item) => {
    const hasChildren = item.children && item.children.length > 0;
    const iconHtml = item.icon ? `<span class="menu-icon">${item.icon}</span>` : "";
    const arrowHtml = hasChildren ? `<span class="submenu-arrow">\u25B8</span>` : "";
    const dataAttrs = [
      item.typeKey ? `data-type="${item.typeKey}"` : "",
      item.instanceKey ? `data-instance-key="${item.instanceKey}"` : "",
      item.instanceId !== void 0 ? `data-instance-id="${item.instanceId}"` : "",
      item.subject ? `data-subject="${item.subject}"` : "",
      `data-label="${item.label.replace(/"/g, "&quot;")}"`,
      hasChildren ? 'data-has-submenu="true"' : ""
    ].filter(Boolean).join(" ");
    if (hasChildren) {
      return `
                <div class="dropdown-item has-submenu" ${dataAttrs}>
                    <div class="item-label-content">
                        ${iconHtml}<span>${item.label}</span>
                    </div>
                    ${arrowHtml}
                    <div class="dropdown-submenu">
                        ${renderMenuHierarchy(item.children)}
                    </div>
                </div>
            `;
    } else {
      return `
                <div class="dropdown-item" ${dataAttrs}>
                    <div class="item-label-content">
                        ${iconHtml}<span>${item.label}</span>
                    </div>
                </div>
            `;
    }
  }).join("");
}

// clientLib/pxeEngine.ts
var PxeEngine = class {
  static predicateChars = "pqrs";
  static negChar = "n";
  static andChar = "a";
  static orChar = "o";
  static implyChar = "i";
  static equivChar = "e";
  static connectorChars = "ao";
  static binChars = "aoie";
  static lb = "[";
  static rb = "]";
  static charDisplayMap = {
    "p": "\u{1D45D}",
    "q": "\u{1D45E}",
    "r": "\u{1D45F}",
    "s": "\u{1D460}",
    "m": "\u2208",
    "v": "EVEN",
    "k": "=",
    "l": "\u2264",
    "u": "+1",
    "d": "ODD",
    "b": "\u2286",
    "w": "\u2248",
    "c": "\u2223",
    "j": "\u2254",
    "[": "(",
    "]": ")",
    "n": "\xAC",
    "a": "\u2227",
    "o": "\u2228",
    "i": "\u2192",
    "e": "\u2194"
  };
  /**
   * Format raw internal expression (e.g. "n[paq]e[nponq]") to typography string.
   */
  static fmt(exp) {
    if (!exp) return "";
    let displayExp = "";
    for (let i = 0; i < exp.length; i++) {
      const key = exp[i];
      const sym = this.charDisplayMap[key] || key;
      if (key === this.lb) {
        displayExp += sym + "\u2009";
      } else if (key === this.andChar || key === this.orChar) {
        displayExp += "\u2009" + sym + "\u2009";
      } else if (key === this.implyChar) {
        displayExp += "\u205F" + sym + "\u205F";
      } else if (key === this.equivChar) {
        displayExp += "\u205F\u205F" + sym + "\u205F\u205F";
      } else if (key === this.rb) {
        displayExp += "\u2009" + sym;
      } else if (key === this.negChar) {
        displayExp += sym + "\u200A";
      } else {
        displayExp += sym;
      }
    }
    return displayExp;
  }
  /**
   * Compute current grammar expectation:
   * - 'front': expects atom (p, q, r, s), opening bracket '[', or negation 'n'
   * - 'back': expects closing bracket ']' (if nl > 0) or binary operator (a, o, i, e)
   */
  static getExpectClass(exp) {
    if (!exp || exp.length === 0) return "front";
    const last = exp[exp.length - 1];
    return (this.predicateChars + this.rb).includes(last) ? "back" : "front";
  }
  /**
   * Compute bracket nesting level.
   */
  static getNestingLevel(exp) {
    let nl = 0;
    for (const ch of exp) {
      if (ch === this.lb) nl++;
      if (ch === this.rb) nl--;
    }
    return nl;
  }
  /**
   * Check if expression is syntactically complete and valid.
   */
  static isValid(exp) {
    if (!exp || exp.length === 0) return false;
    const expect = this.getExpectClass(exp);
    const nl = this.getNestingLevel(exp);
    return expect === "back" && nl === 0;
  }
  /**
   * Extract unique variable names from expression in alphabetical order.
   */
  static extractVariables(exp) {
    const found = /* @__PURE__ */ new Set();
    for (const ch of exp) {
      if (this.predicateChars.includes(ch)) {
        found.add(ch);
      }
    }
    return Array.from(found).sort();
  }
  /**
   * Try adding a character according to PXE grammar rules.
   */
  static canAddCharacter(exp, key) {
    const expect = this.getExpectClass(exp);
    const nl = this.getNestingLevel(exp);
    if (expect === "front") {
      return (this.predicateChars + this.lb + this.negChar).includes(key);
    } else {
      if (key === this.rb) {
        return nl > 0;
      }
      return this.binChars.includes(key);
    }
  }
  /**
   * Split expression at root operator or count top-level negations (PXE.splitOrCnt).
   */
  static splitOrCnt(exp) {
    let best = [0, -1];
    let nl = 0;
    let negs = 0;
    for (let i = 0; i < exp.length; i++) {
      if (exp[i] === this.lb) nl++;
      if (exp[i] === this.rb) nl--;
      if (nl === 0) {
        if (exp[i] === this.negChar) negs++;
        if (this.connectorChars.includes(exp[i]) && best[0] === 0) {
          best = [1, i];
        } else if (exp[i] === this.implyChar && best[0] < 2) {
          best = [2, i];
        } else if (exp[i] === this.equivChar) {
          return ["split", i];
        }
      }
    }
    if (best[0] === 0) {
      return ["cnt", negs];
    } else {
      return ["split", best[1]];
    }
  }
  /**
   * Build AST parse tree from internal expression (TTD.bldTree).
   */
  static bldTree(exp) {
    const [returnType, posOrCnt] = this.splitOrCnt(exp);
    if (returnType === "split") {
      const node = {
        nodeType: exp[posOrCnt],
        negations: 0,
        left: this.bldTree(exp.substring(0, posOrCnt)),
        right: this.bldTree(exp.substring(posOrCnt + 1))
      };
      return node;
    } else {
      const nn = exp.substring(posOrCnt);
      if (nn[0] === this.lb && nn[nn.length - 1] === this.rb) {
        const subNode = this.bldTree(nn.substring(1, nn.length - 1));
        subNode.negations = subNode.negations + posOrCnt;
        return subNode;
      } else {
        return {
          nodeType: nn,
          negations: posOrCnt
        };
      }
    }
  }
  /**
   * Recursively evaluate AST tree against boolean variable assignment.
   */
  static evalTree(node, env) {
    let rawVal = false;
    if (this.binChars.includes(node.nodeType)) {
      const leftVal = node.left ? this.evalTree(node.left, env) : false;
      const rightVal = node.right ? this.evalTree(node.right, env) : false;
      if (node.nodeType === this.andChar) {
        rawVal = leftVal && rightVal;
      } else if (node.nodeType === this.orChar) {
        rawVal = leftVal || rightVal;
      } else if (node.nodeType === this.implyChar) {
        rawVal = !leftVal || rightVal;
      } else if (node.nodeType === this.equivChar) {
        rawVal = leftVal === rightVal;
      }
    } else {
      rawVal = !!env[node.nodeType];
    }
    if (node.negations > 0) {
      const flips = node.negations % 2 !== 0;
      return flips ? !rawVal : rawVal;
    }
    return rawVal;
  }
  /**
   * Evaluate complete truth table over all 2^N variable assignments.
   */
  static evalTruthTable(exp) {
    if (!this.isValid(exp)) return null;
    try {
      const variables = this.extractVariables(exp);
      const tree = this.bldTree(exp);
      const totalRows = Math.pow(2, variables.length);
      const rows = [];
      let trueCount = 0;
      let falseCount = 0;
      for (let i = 0; i < totalRows; i++) {
        const env = {};
        for (let v = 0; v < variables.length; v++) {
          const shift = variables.length - 1 - v;
          const bit = i >> shift & 1;
          env[variables[v]] = bit === 0;
        }
        const result = this.evalTree(tree, env);
        if (result) trueCount++;
        else falseCount++;
        rows.push({ inputs: env, result });
      }
      return {
        variables,
        rows,
        isTautology: trueCount === totalRows,
        isContradiction: falseCount === totalRows,
        isContingent: trueCount > 0 && falseCount > 0
      };
    } catch (err) {
      console.warn("[PxeEngine] Truth table evaluation error:", err);
      return null;
    }
  }
  /**
   * Create standard TTD initialization packet for PostgreSQL storage.
   */
  static createInitPacket(exp) {
    if (!this.isValid(exp)) return null;
    const evalRes = this.evalTruthTable(exp);
    const status = evalRes?.isTautology ? "taut" : evalRes?.isContradiction ? "unsat" : "cont";
    return {
      exp,
      fmt: this.fmt(exp),
      variables: evalRes ? evalRes.variables : this.extractVariables(exp),
      status,
      isTautology: evalRes ? evalRes.isTautology : false
    };
  }
};
function mountPxeBuilderComponent(container, initialExp = "", onUpdate) {
  let currentExp = initialExp;
  container.innerHTML = `
        <div class="pxe-builder-card" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 8px 0 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                        \u2696\uFE0F Propositional Expression Builder (PXE)
                    </span>
                    <span id="pxe-badge-valid" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #fef3c7; color: #b45309;">
                        Building...
                    </span>
                    <span id="pxe-badge-tautology" style="display: none; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #ecfdf5; color: #047857;">
                        \u2713 Tautology
                    </span>
                </div>
            </div>

            <!-- Live Formatted Display Screen -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">
                    MATHEMATICAL TYPOGRAPHY (FMT)
                </div>
                <div id="pxe-display-fmt" style="font-size: 24px; font-weight: 700; color: firebrick; min-height: 36px; font-family: 'Cambria Math', 'Times New Roman', Georgia, serif; letter-spacing: 0.5px;">
                    \u2014
                </div>
                <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
                    Encoded Expression: <code id="pxe-code-display" style="font-family: monospace; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">\u2014</code>
                </div>
            </div>

            <!-- Expression Keypad Controls -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Row 1: Variables & Delimiters -->
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; width: 68px;">Variables:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="p" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">\u{1D45D}</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="q" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">\u{1D45E}</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="r" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">\u{1D45F}</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="s" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">\u{1D460}</button>
                    
                    <span style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;"></span>

                    <span style="font-size: 11px; font-weight: 700; color: #64748b;">Brackets:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="[" style="font-size: 14px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">(</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="]" style="font-size: 14px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">)</button>
                    
                    <span style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;"></span>

                    <button type="button" class="pxe-btn" id="pxe-btn-backspace" style="font-size: 12px; font-weight: 600; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; color: #b91c1c;">\u232B Backspace</button>
                    <button type="button" class="pxe-btn" id="pxe-btn-clear" style="font-size: 12px; font-weight: 600; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; color: #64748b;">\u2715 Clear</button>
                </div>

                <!-- Row 2: Connectives & Operators -->
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; width: 68px;">Connectives:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="n" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">\xAC Not</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="a" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">\u2227 And</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="o" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">\u2228 Or</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="i" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">\u2192 Implies</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="e" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">\u2194 Equiv</button>
                </div>
            </div>
        </div>
    `;
  const displayFmt = container.querySelector("#pxe-display-fmt");
  const codeDisplay = container.querySelector("#pxe-code-display");
  const badgeValid = container.querySelector("#pxe-badge-valid");
  const badgeTautology = container.querySelector("#pxe-badge-tautology");
  function updateUI() {
    const isValid = PxeEngine.isValid(currentExp);
    const nl = PxeEngine.getNestingLevel(currentExp);
    const formatted = PxeEngine.fmt(currentExp);
    displayFmt.textContent = formatted || "\u2014";
    codeDisplay.textContent = currentExp || "\u2014";
    if (isValid) {
      badgeValid.style.background = "#ecfdf5";
      badgeValid.style.color = "#047857";
      badgeValid.textContent = "\u2713 Valid Formula";
    } else {
      badgeValid.style.background = "#fef3c7";
      badgeValid.style.color = "#b45309";
      badgeValid.textContent = nl > 0 ? `Unclosed: ${nl}` : currentExp.length > 0 ? "Building..." : "Empty";
    }
    container.querySelectorAll(".pxe-key").forEach((btn) => {
      const key = btn.getAttribute("data-key");
      if (!key) return;
      const canAdd = PxeEngine.canAddCharacter(currentExp, key);
      btn.disabled = !canAdd;
      if (canAdd) {
        btn.removeAttribute("style_disabled");
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      } else {
        btn.style.opacity = "0.35";
        btn.style.cursor = "not-allowed";
      }
    });
    if (isValid) {
      const evalRes = PxeEngine.evalTruthTable(currentExp);
      if (evalRes) {
        badgeTautology.style.display = "inline-block";
        if (evalRes.isTautology) {
          badgeTautology.style.background = "#ecfdf5";
          badgeTautology.style.color = "#047857";
          badgeTautology.textContent = "\u2696\uFE0F Tautology [taut]";
        } else if (evalRes.isContradiction) {
          badgeTautology.style.background = "#fef2f2";
          badgeTautology.style.color = "#dc2626";
          badgeTautology.textContent = "\u26A0\uFE0F Contradiction [unsat]";
        } else {
          badgeTautology.style.background = "#f1f5f9";
          badgeTautology.style.color = "#475569";
          badgeTautology.textContent = "Contingent [cont]";
        }
      }
      const packet = PxeEngine.createInitPacket(currentExp);
      onUpdate(packet, currentExp);
    } else {
      badgeTautology.style.display = "none";
      onUpdate(null, currentExp);
    }
  }
  container.querySelectorAll(".pxe-key").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const key = btn.getAttribute("data-key");
      if (key && PxeEngine.canAddCharacter(currentExp, key)) {
        currentExp += key;
        updateUI();
      }
    });
  });
  container.querySelector("#pxe-btn-backspace")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentExp.length > 0) {
      currentExp = currentExp.substring(0, currentExp.length - 1);
      updateUI();
    }
  });
  container.querySelector("#pxe-btn-clear")?.addEventListener("click", (e) => {
    e.preventDefault();
    currentExp = "";
    updateUI();
  });
  updateUI();
  return {
    setExp: (exp) => {
      currentExp = exp;
      updateUI();
    },
    getExp: () => currentExp
  };
}

// crud/src/ui.ts
var typeMap = {
  segment: { table: "segments", label: "Segments" },
  segments: { table: "segments", label: "Segments" },
  axiom: { table: "formal_statements", filterKind: { column: "statement_kind", value: "axiom" }, label: "Formal Axiom" },
  axioms: { table: "formal_statements", filterKind: { column: "statement_kind", value: "axiom" }, label: "Formal Axioms" },
  theorem: { table: "formal_statements", filterKind: { column: "statement_kind", value: "theorem" }, label: "Formal Theorem" },
  theorems: { table: "formal_statements", filterKind: { column: "statement_kind", value: "theorem" }, label: "Formal Theorems" },
  directed_equality: { table: "formal_statements", filterKind: { column: "statement_kind", value: "directed_equality" }, label: "Directed Equality (Formal)" },
  directed_equalities: { table: "formal_statements", filterKind: { column: "statement_kind", value: "directed_equality" }, label: "Directed Equalities" },
  directed_equations: { table: "formal_statements", filterKind: { column: "statement_kind", value: "directed_equality" }, label: "Directed Equalities" },
  formal_statement: { table: "formal_statements", label: "All Formal Statements" },
  formal_statements: { table: "formal_statements", label: "All Formal Statements" },
  computational_stencil: { table: "directed_equations", label: "Computational Stencil" },
  computational_stencils: { table: "directed_equations", label: "Computational Stencils" },
  stencil: { table: "directed_equations", label: "Computational Stencil" },
  stencils: { table: "directed_equations", label: "Computational Stencils" },
  truth_table: { table: "interactive_demos", filterKind: { column: "engine", value: "ttd" }, label: "Truth Table Display (TTD)" },
  ttd: { table: "interactive_demos", filterKind: { column: "engine", value: "ttd" }, label: "Truth Table Demo (TTD)" },
  btd: { table: "interactive_demos", filterKind: { column: "engine", value: "btd" }, label: "Binary Tree Demo (BTD)" },
  bid: { table: "interactive_demos", filterKind: { column: "engine", value: "bid" }, label: "Binary Interval Demo (BID)" },
  fsd: { table: "interactive_demos", filterKind: { column: "engine", value: "fsd" }, label: "Formal Statements Demo (FSD)" },
  interactive_demo: { table: "interactive_demos", label: "Interactive Visual Demo" },
  interactive_demos: { table: "interactive_demos", label: "Interactive Demos" },
  demo_initialization: { table: "interactive_demos", label: "Demo Initialization" },
  demo_initializations: { table: "interactive_demos", label: "Demo Initializations" },
  pseudocode_algorithm: { table: "pseudocode_algorithms", label: "Pseudocode Algorithm" },
  pseudocode_algorithms: { table: "pseudocode_algorithms", label: "Pseudocode Algorithms" },
  algorithms: { table: "pseudocode_algorithms", label: "Pseudocode Algorithms" },
  symbols: { table: "symbols", label: "Symbols Glossary" },
  mode_slot: { table: "mode_slots", label: "Mode Slot" },
  mode_slots: { table: "mode_slots", label: "Mode Slots" },
  equation_statement_link: { table: "equation_statement_links", label: "Equation-Statement Link" },
  equation_statement_links: { table: "equation_statement_links", label: "Equation-Statement Links" },
  lean_verification: { table: "lean_verifications", label: "Lean Verification" },
  lean_verifications: { table: "lean_verifications", label: "Lean Verifications" },
  segment_reference: { table: "segment_references", label: "Segment Reference" },
  curriculum_nav_item: { table: "curriculum_nav_items", label: "Index Entry" },
  curriculum_nav_items: { table: "curriculum_nav_items", label: "Index Entries" },
  index_entry: { table: "curriculum_nav_items", label: "Index Entry" },
  index_entries: { table: "curriculum_nav_items", label: "Index Entries" },
  app_setting: { table: "apps", label: "App Setting" },
  apps: { table: "apps", label: "Apps" },
  domain: { table: "domains", label: "Mathematical Domain" },
  domains: { table: "domains", label: "Mathematical & Physical Domains" },
  lean_declaration: { table: "lean_declarations", label: "Lean Declaration" },
  lean_declarations: { table: "lean_declarations", label: "Lean 4 Formal Declarations" }
};
var appMetadata = {};
var navigations2 = [];
var dependents2 = [];
var currentMode = "read";
var currentTypeKey = null;
var currentSelectedId = null;
var currentTitle = "";
var navHistory = [];
var modeBtn = null;
var modeDropdownMenu = null;
var currentModeLabel = null;
var typeBtn = null;
var typeDropdownMenu = null;
var currentTypeLabel = null;
var subjectBtn = null;
var subjectDropdownMenu = null;
var currentSubjectLabel = null;
var currentSubject = "all";
var breadcrumbActiveType = null;
var navBackBtn = null;
var displayArea = null;
var statusMessage = null;
var statusTiming = null;
var mainModal = null;
var modalBody = null;
function getDisplayColumnName(tableName) {
  const tableInfo = appMetadata[tableName];
  if (!tableInfo) return "id";
  const cols = Object.keys(tableInfo.columns);
  if (cols.includes("title")) return "title";
  if (cols.includes("name")) return "name";
  if (cols.includes("topic")) return "topic";
  if (cols.includes("theorem_name")) return "theorem_name";
  if (cols.includes("statement_key")) return "statement_key";
  if (cols.includes("equation_key")) return "equation_key";
  if (cols.includes("algo_key")) return "algo_key";
  if (cols.includes("seg_key")) return "seg_key";
  if (cols.includes("label")) return "label";
  if (cols.includes("symbol")) return "symbol";
  if (cols.includes("preset_key")) return "preset_key";
  if (cols.includes("target_key")) return "target_key";
  if (cols.includes("app_code")) return "app_code";
  return cols[0] || "id";
}
function getRecordFriendlyName(tableName, record) {
  if (!record) return "";
  switch (tableName) {
    case "directed_equations":
      return `${record.title || record.label || "Equation"} (${record.equation_key || record.id})`;
    case "formal_statements":
      return `${record.title || record.expression || "Statement"} (${record.statement_key || record.id})`;
    case "pseudocode_algorithms":
      return `${record.title || record.name || "Algorithm"} (${record.algo_key || record.id})`;
    case "mode_slots":
      return `Slot #${record.slot_index}: ${record.symbol} (${record.label || record.unit || "parameter"})`;
    case "lean_verifications":
      return `Theorem ${record.theorem_name} [${record.proof_status || "status"}]`;
    case "curriculum_nav_items":
      return `#${record.sequence_order}: ${record.topic || record.nav_topic || "Nav Item"}`;
    case "segment_references":
      return `${record.ref_type}: ${record.target_key}${record.anchor_text ? ` ("${record.anchor_text}")` : ""}`;
    case "segment_prerequisites":
      return `Prerequisite Seg #${record.prerequisite_segment_id} (${record.prereq_type || "prereq"})`;
    case "segments":
      return `${record.title || record.slug || "Chapter"} (Seq: ${record.sequence_order || record.id})`;
    case "apps":
      return `${record.name || "App"} (${record.app_code || record.id})`;
    case "interactive_demos": {
      if (record.engine === "ttd") {
        let initObj = null;
        try {
          initObj = typeof record.init_packet === "object" ? record.init_packet : JSON.parse(record.init_packet || "{}");
        } catch (e) {
          initObj = {};
        }
        const exp = record.expression || initObj?.exp || "";
        const fmt = initObj?.fmt || (exp ? PxeEngine.fmt(exp) : "");
        let status = record.status || initObj?.status;
        if (!status && exp) {
          const evalRes = PxeEngine.evalTruthTable(exp);
          status = evalRes?.isTautology ? "taut" : evalRes?.isContradiction ? "unsat" : "cont";
        }
        const statusSuffix = status ? ` [${status}]` : "";
        return `${fmt || exp || record.title || "TTD"}${statusSuffix}`;
      }
      return `${record.title || "Demo #" + record.id} (${record.engine || "demo"}${record.mode ? ` - ${record.mode}` : ""})`;
    }
    default: {
      const col = getDisplayColumnName(tableName);
      const val = record[col];
      if (val && val !== record.id) {
        return `${val} (ID: ${record.id})`;
      }
      return record.name || record.title || record.label || record.key || `Record #${record.id}`;
    }
  }
}
function initializeUI(metadata, navs, deps) {
  appMetadata = metadata;
  navigations2 = navs;
  dependents2 = deps;
  modeBtn = document.getElementById("mode-btn");
  modeDropdownMenu = document.getElementById("mode-dropdown-menu");
  currentModeLabel = document.getElementById("current-mode-label");
  typeBtn = document.getElementById("type-btn");
  typeDropdownMenu = document.getElementById("type-dropdown-menu");
  currentTypeLabel = document.getElementById("current-type-label");
  subjectBtn = document.getElementById("subject-btn");
  subjectDropdownMenu = document.getElementById("subject-dropdown-menu");
  currentSubjectLabel = document.getElementById("current-subject-label");
  breadcrumbActiveType = document.getElementById("breadcrumb-active-type");
  navBackBtn = document.getElementById("nav-back-btn");
  displayArea = document.getElementById("display-area");
  statusMessage = document.getElementById("status-message");
  statusTiming = document.getElementById("status-timing");
  mainModal = document.getElementById("main-modal");
  modalBody = document.getElementById("modal-body");
  currentMode = "read";
  currentTypeKey = null;
  currentSelectedId = null;
  currentTitle = "";
  currentSubject = "all";
  if (currentModeLabel) currentModeLabel.textContent = "Read";
  if (currentTypeLabel) currentTypeLabel.textContent = "Select Type";
  if (currentSubjectLabel) currentSubjectLabel.textContent = "All";
  updateBreadcrumbs();
  setupControlListeners();
  renderCurrentView();
  setStatus("Ready \u2022 Mode: Read (default) \u2022 Select mode, type, or subject");
}
function setupControlListeners() {
  if (modeBtn && modeDropdownMenu) {
    modeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeDropdownMenu) typeDropdownMenu.classList.remove("show");
      modeDropdownMenu?.classList.toggle("show");
    });
    modeDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const mode = item.getAttribute("data-mode");
        if (mode) {
          setMode(mode);
          modeDropdownMenu?.classList.remove("show");
        }
      });
    });
  }
  if (typeDropdownMenu) {
    typeDropdownMenu.innerHTML = renderMenuHierarchy(navigationMenuTree);
  }
  if (typeBtn && typeDropdownMenu) {
    typeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (modeDropdownMenu) modeDropdownMenu.classList.remove("show");
      typeDropdownMenu?.classList.toggle("show");
    });
    typeDropdownMenu.addEventListener("click", async (e) => {
      const targetItem = e.target.closest(".dropdown-item");
      if (!targetItem) return;
      const hasSubmenu = targetItem.classList.contains("has-submenu");
      const typeKey = targetItem.getAttribute("data-type");
      const instanceKey = targetItem.getAttribute("data-instance-key");
      const instanceId = targetItem.getAttribute("data-instance-id");
      const label = targetItem.getAttribute("data-label") || "";
      if (instanceKey || instanceId) {
        e.stopPropagation();
        typeDropdownMenu?.classList.remove("show");
        typeDropdownMenu?.querySelectorAll(".open-submenu").forEach((el) => el.classList.remove("open-submenu"));
        await selectInstanceDirectly(typeKey || currentTypeKey, instanceKey || instanceId, label);
        return;
      }
      if (hasSubmenu) {
        e.stopPropagation();
        const isOpen = targetItem.classList.contains("open-submenu");
        targetItem.parentElement?.querySelectorAll(":scope > .dropdown-item.open-submenu").forEach((el) => {
          if (el !== targetItem) el.classList.remove("open-submenu");
        });
        if (isOpen) {
          targetItem.classList.remove("open-submenu");
        } else {
          targetItem.classList.add("open-submenu");
          positionSubmenu(targetItem);
        }
        return;
      }
      if (typeKey) {
        e.stopPropagation();
        typeDropdownMenu?.classList.remove("show");
        typeDropdownMenu?.querySelectorAll(".open-submenu").forEach((el) => el.classList.remove("open-submenu"));
        setType(typeKey);
        return;
      }
    });
    const positionSubmenu = (item) => {
      const submenu = item.querySelector(":scope > .dropdown-submenu");
      if (!submenu) return;
      submenu.style.left = "100%";
      submenu.style.right = "auto";
      submenu.style.top = "-4px";
      const rect = submenu.getBoundingClientRect();
      if (rect.right > window.innerWidth - 15) {
        submenu.style.left = "auto";
        submenu.style.right = "100%";
      }
      if (rect.bottom > window.innerHeight - 15) {
        const overflowY = rect.bottom - (window.innerHeight - 15);
        submenu.style.top = `${Math.max(-rect.height + 30, -4 - overflowY)}px`;
      }
    };
    typeDropdownMenu.querySelectorAll(".dropdown-item.has-submenu").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        positionSubmenu(item);
      });
    });
  }
  if (subjectBtn && subjectDropdownMenu) {
    subjectBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (modeDropdownMenu) modeDropdownMenu.classList.remove("show");
      if (typeDropdownMenu) typeDropdownMenu.classList.remove("show");
      subjectDropdownMenu?.classList.toggle("show");
    });
    subjectDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const subj = item.getAttribute("data-subject") || "all";
        setSubject(subj);
        subjectDropdownMenu?.classList.remove("show");
      });
    });
  }
  document.addEventListener("click", () => {
    if (modeDropdownMenu) modeDropdownMenu.classList.remove("show");
    if (typeDropdownMenu) {
      typeDropdownMenu.classList.remove("show");
      typeDropdownMenu.querySelectorAll(".open-submenu").forEach((el) => el.classList.remove("open-submenu"));
    }
    if (subjectDropdownMenu) subjectDropdownMenu.classList.remove("show");
  });
  if (navBackBtn) {
    navBackBtn.addEventListener("click", () => {
      navigateBack();
    });
  }
  const modalClose = document.getElementById("modal-close-button");
  if (modalClose && mainModal) {
    modalClose.addEventListener("click", closeModal);
  }
}
function matchesCurrentSubject(tableName, record) {
  if (!currentSubject || currentSubject === "all") return true;
  if (!record) return false;
  if (tableName === "formal_statements") {
    const cat = record.domain_category || "";
    const subj = record.subject_type || "";
    const key = record.statement_key || "";
    switch (currentSubject) {
      case "logic":
        return ["logic", "set_theory", "order_theory"].includes(cat) || key.startsWith("fs_pred_");
      case "numbers_trees":
        return cat === "arithmetic" || ["fs_tree2_totally_ordered", "fs_dyadic_isomorphism", "fs_van_den_dries_ehrlich", "fs_conway_addition", "fs_conway_multiplication"].includes(key);
      case "algebra":
        return ["fs_cauchy_schwarz_discrete", "fs_unit_rotor_projection", "fs_euler_identity_rotor"].includes(key) || cat === "linear_algebra";
      case "analysis":
        return cat === "discrete_analysis";
      case "physics":
        return subj === "physics" || cat === "kinematics_and_dynamics";
      case "information":
        return subj === "information" || cat === "information_and_signals";
      default:
        return true;
    }
  }
  if (tableName === "interactive_demos") {
    const engine = record.engine || "";
    switch (currentSubject) {
      case "logic":
        return engine === "ttd";
      case "numbers_trees":
        return engine === "btd";
      case "analysis":
        return engine === "bid" || engine === "fsd";
      case "physics":
        return false;
      case "information":
        return false;
      default:
        return true;
    }
  }
  return true;
}
function setSubject(subject) {
  currentSubject = subject;
  const labelMap = {
    all: "All",
    logic: "Logic & Set Theory",
    numbers_trees: "Numbers & Trees",
    algebra: "Vectors & Algebra",
    analysis: "Continuum Analysis",
    physics: "Applied Physics",
    information: "Quantum & Bayesian Info"
  };
  if (currentSubjectLabel) {
    currentSubjectLabel.textContent = labelMap[subject] || subject;
  }
  if (subjectDropdownMenu) {
    subjectDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      if (item.getAttribute("data-subject") === subject) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  if (typeDropdownMenu) {
    typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject));
  }
  renderCurrentView();
  setStatus(`Subject Scope: ${labelMap[subject] || subject}`);
}
function setMode(mode) {
  currentMode = mode;
  if (currentModeLabel) currentModeLabel.textContent = capitalize(mode);
  if (modeDropdownMenu) {
    modeDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      if (item.getAttribute("data-mode") === mode) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  currentTypeKey = null;
  currentSelectedId = null;
  currentTitle = "";
  if (currentTypeLabel) currentTypeLabel.textContent = "Select Type";
  if (typeDropdownMenu) {
    typeDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.classList.remove("active");
    });
  }
  updateBreadcrumbs();
  renderCurrentView();
  setStatus(`Mode: ${capitalize(mode)} \u2022 Select mode and instance`);
}
function setType(typeKey, clearSelection = true) {
  currentTypeKey = typeKey;
  const mapping = typeMap[typeKey] || { table: typeKey, label: typeKey };
  if (clearSelection) {
    currentSelectedId = null;
    currentTitle = mapping.label;
  }
  if (currentTypeLabel) currentTypeLabel.textContent = mapping.label;
  if (typeDropdownMenu) {
    typeDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      if (item.getAttribute("data-type") === typeKey) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  updateBreadcrumbs();
  renderCurrentView();
  setStatus(`Table: ${mapping.table} (${mapping.label})`);
}
function navigateToEntity(tableNameOrTypeKey, id, title) {
  const activeMapping = typeMap[currentTypeKey] || { table: currentTypeKey, label: currentTypeKey };
  navHistory.push({
    mode: currentMode,
    typeKey: currentTypeKey,
    tableName: activeMapping.table,
    id: currentSelectedId,
    title: currentTitle
  });
  let resolvedTypeKey = tableNameOrTypeKey;
  if (!typeMap[tableNameOrTypeKey]) {
    const found = Object.keys(typeMap).find((k) => typeMap[k].table === tableNameOrTypeKey);
    if (found) resolvedTypeKey = found;
    else {
      typeMap[tableNameOrTypeKey] = {
        table: tableNameOrTypeKey,
        label: appMetadata[tableNameOrTypeKey]?.label || tableNameOrTypeKey
      };
      resolvedTypeKey = tableNameOrTypeKey;
    }
  }
  currentTypeKey = resolvedTypeKey;
  currentSelectedId = id;
  currentTitle = title;
  const newMapping = typeMap[currentTypeKey];
  if (currentTypeLabel) currentTypeLabel.textContent = newMapping.label;
  updateBreadcrumbs();
  renderCurrentView();
  setStatus(`Traversed to ${newMapping.table} #${id}`);
}
function navigateBack() {
  const prev = navHistory.pop();
  if (!prev) return;
  currentMode = prev.mode;
  currentTypeKey = prev.typeKey;
  currentSelectedId = prev.id;
  currentTitle = prev.title;
  if (currentModeLabel) currentModeLabel.textContent = capitalize(currentMode);
  const mapping = typeMap[currentTypeKey] || { table: prev.tableName, label: prev.tableName };
  if (currentTypeLabel) currentTypeLabel.textContent = mapping.label;
  updateBreadcrumbs();
  renderCurrentView();
  setStatus(`Returned to ${mapping.table} #${currentSelectedId || "list"}`);
}
async function selectInstanceDirectly(typeKey, instanceKeyOrId, label) {
  let resolvedTypeKey = typeKey;
  const mapping = typeMap[typeKey] || { table: typeKey, label: typeKey };
  const tableName = mapping.table;
  let record = null;
  const strKey = String(instanceKeyOrId);
  const legacyDemoMap = {
    ttd_demorgan: 2,
    ttd_modus_ponens: 3,
    ttd_excluded_middle: 4,
    ttd_non_contradiction: 5,
    ttd_implication: 6,
    ttd_equivalence: 7,
    ttd_hypothetical_syllogism: 8,
    btd_order: 9,
    btd_addition: 10,
    btd_multiplication: 11,
    btd_labeled: 12,
    bid_euler: 13,
    bid_rotor: 14,
    fsd_stage: 15
  };
  if (/^\d+$/.test(strKey)) {
    record = await fetchRecordById(tableName, strKey);
  } else if (tableName === "interactive_demos" && legacyDemoMap[strKey]) {
    record = await fetchRecordById(tableName, legacyDemoMap[strKey].toString());
  }
  if (!record) {
    const tableCols = appMetadata[tableName] ? Object.keys(appMetadata[tableName].columns) : [];
    const candidateKeys = [
      "nav_key",
      "seg_key",
      "statement_key",
      "equation_key",
      "algo_key",
      "expression",
      "preset_key",
      "app_code",
      "symbol",
      "target_key",
      "slug",
      "name",
      "title"
    ];
    for (const col of candidateKeys) {
      if (tableCols.includes(col)) {
        try {
          const rows = await queryDatabase(
            `SELECT * FROM ${tableName} WHERE "${col}" = $1 LIMIT 1;`,
            [strKey]
          );
          if (rows && rows.length > 0) {
            record = rows[0];
            break;
          }
        } catch {
        }
      }
    }
    if (!record && tableName === "curriculum_nav_items") {
      try {
        const navRows = await queryDatabase(
          `SELECT cni.* FROM curriculum_nav_items cni 
                     JOIN segments s ON s.id = cni.segment_id 
                     WHERE s.seg_key = $1 OR s.slug = $1 LIMIT 1;`,
          [strKey]
        );
        if (navRows && navRows.length > 0) record = navRows[0];
      } catch {
      }
    }
  }
  if (!record) {
    console.warn(`[selectInstanceDirectly] Record not found in ${tableName} for key: ${instanceKeyOrId}`);
    setStatus(`Record '${instanceKeyOrId}' not found in ${tableName}`);
    setType(typeKey);
    return;
  }
  if (tableName === "formal_statements" && record.statement_kind) {
    resolvedTypeKey = record.statement_kind;
  } else if (tableName === "interactive_demos" && record.engine && typeMap[record.engine]) {
    resolvedTypeKey = record.engine;
  }
  currentTypeKey = resolvedTypeKey;
  const activeMapping = typeMap[currentTypeKey] || { table: tableName, label: capitalize(resolvedTypeKey) };
  if (currentTypeLabel) currentTypeLabel.textContent = activeMapping.label;
  currentSelectedId = record.id.toString();
  const displayCol = getDisplayColumnName(tableName);
  currentTitle = record[displayCol] || label || `ID: ${record.id}`;
  if (typeDropdownMenu) {
    typeDropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      const itemType = item.getAttribute("data-type");
      const itemInst = item.getAttribute("data-instance-key") || item.getAttribute("data-instance-id");
      if (itemInst === strKey || itemInst === currentSelectedId || itemType === currentTypeKey && !itemInst) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  updateBreadcrumbs();
  if (currentMode === "create") {
    renderRecordForm(tableName, null, true);
  } else if (currentMode === "update") {
    renderRecordForm(tableName, record, false);
  } else if (currentMode === "delete") {
    renderDeleteConfirmation(tableName, record);
  } else {
    await renderEntityInspectorView(tableName, activeMapping.filterKind);
  }
  setStatus(`Loaded ${activeMapping.label}: ${currentTitle} (#${record.id})`);
}
function updateBreadcrumbs() {
  const breadcrumbMode = document.getElementById("breadcrumb-mode");
  if (breadcrumbMode) {
    breadcrumbMode.textContent = `Mode: ${capitalize(currentMode)}`;
  }
  if (!currentTypeKey) {
    if (breadcrumbActiveType) {
      breadcrumbActiveType.innerHTML = `<span style="color: #64748b; font-style: italic;">Select Type</span>`;
    }
    if (navBackBtn) navBackBtn.style.display = "none";
    return;
  }
  const mapping = typeMap[currentTypeKey] || { table: currentTypeKey, label: currentTypeKey };
  if (breadcrumbActiveType) {
    if (currentSelectedId && currentTitle && currentTitle !== mapping.label) {
      breadcrumbActiveType.innerHTML = `
                <span>${escapeHtml(mapping.label)}</span>
                <span style="color: #cbd5e1; margin: 0 4px;">/</span>
                <span style="color: #0369a1; font-weight: 600;">${escapeHtml(currentTitle)}</span>
            `;
    } else {
      breadcrumbActiveType.textContent = mapping.label;
    }
  }
  if (navBackBtn) {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      navBackBtn.style.display = "inline-flex";
      navBackBtn.innerHTML = `<span>\u2190 Back to ${escapeHtml(last.title || last.tableName)}</span>`;
    } else {
      navBackBtn.style.display = "none";
    }
  }
}
function setStatus(msg) {
  if (statusMessage) statusMessage.textContent = msg;
  if (statusTiming) statusTiming.textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString();
}
function showModal(contentHtml) {
  if (modalBody && mainModal) {
    modalBody.innerHTML = contentHtml;
    mainModal.classList.add("open");
  }
}
function closeModal() {
  if (mainModal) {
    mainModal.classList.remove("open");
  }
}
function renderInitialDisplay() {
  if (!displayArea) return;
  displayArea.innerHTML = `
        <div class="empty-state-panel" style="padding: 72px 24px; text-align: center; color: #64748b; font-family: var(--font-sans);">
            <div style="font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                Select mode and instance.
            </div>
            <div style="font-size: 12.5px; color: #94a3b8;">
                Mode: <strong>${capitalize(currentMode)}</strong> &bull; Use toolbar controls above to initiate action.
            </div>
        </div>
    `;
}
async function renderEntityInstancePickerForAction(tableName, action, filterKind) {
  if (!displayArea) return;
  const tableInfo = appMetadata[tableName];
  if (!tableInfo) return;
  const displayCol = getDisplayColumnName(tableName);
  const actionVerb = action === "update" ? "Edit" : "Delete";
  const actionColor = action === "update" ? "#d97706" : "#dc2626";
  const actionIcon = action === "update" ? "\u270F\uFE0F" : "\u{1F5D1}\uFE0F";
  displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="inspector-container">
                <div class="instance-bar" style="background: ${action === "update" ? "#fffbeb" : "#fef2f2"}; border-color: ${action === "update" ? "#fde68a" : "#fecaca"};">
                    <div class="instance-select-group">
                        <span class="instance-select-label" style="color: ${actionColor}; font-weight: 700;">
                            ${actionIcon} Select ${tableInfo.singularLabel || tableInfo.label} to ${actionVerb}:
                        </span>
                        <select id="entity-instance-action-select" class="instance-select">
                            <option value="">Loading instances...</option>
                        </select>
                    </div>
                </div>
                <div id="inspector-action-target">
                    <div style="padding: 24px; color: #64748b;">Loading records...</div>
                </div>
            </div>
        </div>
    `;
  const selectEl = document.getElementById("entity-instance-action-select");
  const targetEl = document.getElementById("inspector-action-target");
  try {
    let sql = `SELECT * FROM ${tableName}`;
    const params = [];
    if (filterKind) {
      sql += ` WHERE "${filterKind.column}" = $1`;
      params.push(filterKind.value);
    }
    sql += ` ORDER BY "${displayCol}" ASC;`;
    const allRecords = await queryDatabase(sql, params) || [];
    const records = allRecords.filter((r) => matchesCurrentSubject(tableName, r));
    if (allRecords.length === 0) {
      selectEl.innerHTML = `<option value="">No records found in table ${tableName}</option>`;
      targetEl.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px;">
                    No records found in <strong>${tableName}</strong> to ${actionVerb.toLowerCase()}.
                </div>
            `;
      return;
    }
    if (records.length === 0) {
      selectEl.innerHTML = `<option value="">No records matching Subject '${currentSubject}' (${allRecords.length} total in table)</option>`;
      targetEl.innerHTML = `
                <div style="padding: 36px 24px; text-align: center; color: #64748b; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px;">
                    <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
                        No ${tableInfo.label} to ${actionVerb.toLowerCase()} matching Subject scope: <strong>${currentSubjectLabel?.textContent || currentSubject}</strong>
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
                        There are ${allRecords.length} records in this table under other subjects.
                    </div>
                    <button type="button" id="btn-reset-subject-scope-action" class="btn btn-sm" style="padding: 6px 14px; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                        \u{1F310} Clear Subject Filter (Show All)
                    </button>
                </div>
            `;
      document.getElementById("btn-reset-subject-scope-action")?.addEventListener("click", () => setSubject("all"));
      return;
    }
    selectEl.innerHTML = `
            <option value="">-- Select ${tableInfo.singularLabel || tableInfo.label} to ${actionVerb} (${records.length}${currentSubject !== "all" ? ` of ${allRecords.length}` : ""} available) --</option>
            ${records.map(
      (r) => `<option value="${r.id}">
                            ${escapeHtml(getRecordFriendlyName(tableName, r))} (ID: ${r.id})
                        </option>`
    ).join("")}
        `;
    const triggerActionOnRecord = async (record) => {
      currentSelectedId = record.id.toString();
      currentTitle = getRecordFriendlyName(tableName, record);
      updateBreadcrumbs();
      if (action === "update") {
        renderRecordForm(tableName, record, false);
      } else {
        renderDeleteConfirmation(tableName, record);
      }
    };
    const filterScopeBanner = currentSubject !== "all" ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px; margin-bottom: 14px;">
                <span style="font-size: 12.5px; font-weight: 600; color: #1d4ed8;">
                    Filtered by Subject: <strong>${escapeHtml(currentSubjectLabel?.textContent || currentSubject)}</strong> (${records.length} of ${allRecords.length} records)
                </span>
                <button type="button" id="btn-clear-active-filter-action" style="background: none; border: none; font-size: 12px; font-weight: 700; color: #2563eb; cursor: pointer;">
                    \u2715 Clear Scope
                </button>
            </div>
        ` : "";
    targetEl.innerHTML = `
            <div class="instance-menu-card">
                ${filterScopeBanner}
                <div class="instance-menu-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 style="color: ${actionColor};">${actionIcon} Select a Record to ${actionVerb} (${records.length}${currentSubject !== "all" ? ` filtered from ${allRecords.length}` : ""} Available)</h3>
                    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">
                        Click any item below or choose from the dropdown above to immediately initiate the ${actionVerb.toLowerCase()} workflow.
                    </p>
                </div>
                <div class="instance-menu-list">
                    ${records.map((r) => {
      const friendlyTitle = r[displayCol] || `ID: ${r.id}`;
      const key = r.equation_key || r.statement_key || r.algo_key || r.seg_key || r.symbol || r.preset_key || "";
      const desc = r.formula_description || r.description || r.summary || "";
      return `
                                <div class="instance-menu-item" data-id="${r.id}" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; background: #ffffff;">
                                    <div style="flex: 1;">
                                        <div class="instance-item-title" style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-weight: 600; color: #0f172a;">${escapeHtml(friendlyTitle)}</span>
                                            ${key ? `<code class="instance-key-badge">${escapeHtml(key)}</code>` : ""}
                                            <span class="instance-id-badge">#${r.id}</span>
                                        </div>
                                        ${desc ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(desc.slice(0, 120))}${desc.length > 120 ? "..." : ""}</div>` : ""}
                                    </div>
                                    <button class="btn btn-sm" style="background: ${actionColor}; color: #ffffff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer;">
                                        ${actionIcon} ${actionVerb}
                                    </button>
                                </div>
                            `;
    }).join("")}
                </div>
            </div>
        `;
    targetEl.querySelector("#btn-clear-active-filter-action")?.addEventListener("click", () => {
      setSubject("all");
    });
    targetEl.querySelectorAll(".instance-menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        const record = records.find((r) => r.id.toString() === id);
        if (record) {
          triggerActionOnRecord(record);
        }
      });
    });
    selectEl.addEventListener("change", () => {
      const id = selectEl.value;
      if (!id) return;
      const record = records.find((r) => r.id.toString() === id);
      if (record) {
        triggerActionOnRecord(record);
      }
    });
  } catch (err) {
    console.error(`[renderEntityInstancePickerForAction] Error:`, err);
    targetEl.innerHTML = `<div style="padding: 24px; color: #dc2626;">Error querying ${tableName}: ${err.message}</div>`;
  }
}
async function renderCurrentView() {
  if (!displayArea) return;
  if (!currentTypeKey) {
    renderInitialDisplay();
    return;
  }
  const mapping = typeMap[currentTypeKey] || { table: currentTypeKey, label: currentTypeKey };
  const tableName = mapping.table;
  const tableInfo = appMetadata[tableName];
  if (!tableInfo) {
    displayArea.innerHTML = `
            <div style="padding: 30px; color: #dc2626; font-size: 14px;">
                Configuration Error: Table '${tableName}' not found in active database metadata.
            </div>
        `;
    return;
  }
  if (currentMode === "create") {
    renderRecordForm(tableName, null, true);
    return;
  }
  if (currentMode === "update") {
    if (currentSelectedId) {
      const record = await fetchRecordById(tableName, currentSelectedId);
      if (record) {
        renderRecordForm(tableName, record, false);
        return;
      }
    }
    await renderEntityInstancePickerForAction(tableName, "update", mapping.filterKind);
    return;
  }
  if (currentMode === "delete") {
    if (currentSelectedId) {
      const record = await fetchRecordById(tableName, currentSelectedId);
      if (record) {
        renderDeleteConfirmation(tableName, record);
        return;
      }
    }
    await renderEntityInstancePickerForAction(tableName, "delete", mapping.filterKind);
    return;
  }
  await renderEntityInspectorView(tableName, mapping.filterKind);
}
async function renderEntityInspectorView(tableName, filterKind) {
  if (!displayArea) return;
  const tableInfo = appMetadata[tableName];
  const displayCol = getDisplayColumnName(tableName);
  displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="inspector-container">
                <div class="instance-bar">
                    <div class="instance-select-group">
                        <span class="instance-select-label">Select ${tableInfo.singularLabel || tableInfo.label}:</span>
                        <select id="entity-instance-select" class="instance-select">
                            <option value="">Loading instances...</option>
                        </select>
                    </div>
                </div>
                <div id="inspector-card-target">
                    <div style="padding: 24px; color: #64748b;">Loading record attributes...</div>
                </div>
            </div>
        </div>
    `;
  const selectEl = document.getElementById("entity-instance-select");
  const cardTarget = document.getElementById("inspector-card-target");
  try {
    let sql = `SELECT * FROM ${tableName}`;
    const params = [];
    if (filterKind) {
      sql += ` WHERE "${filterKind.column}" = $1`;
      params.push(filterKind.value);
    }
    sql += ` ORDER BY "${displayCol}" ASC;`;
    const allRecords = await queryDatabase(sql, params) || [];
    const records = allRecords.filter((r) => matchesCurrentSubject(tableName, r));
    if (allRecords.length === 0) {
      selectEl.innerHTML = `<option value="">No records found in table ${tableName}</option>`;
      cardTarget.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px;">
                    No records found in <strong>${tableName}</strong>.
                </div>
            `;
      return;
    }
    if (records.length === 0) {
      selectEl.innerHTML = `<option value="">No records matching Subject '${currentSubject}' (${allRecords.length} total in table)</option>`;
      cardTarget.innerHTML = `
                <div style="padding: 36px 24px; text-align: center; color: #64748b; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px;">
                    <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
                        No ${tableInfo.label} matching Subject scope: <strong>${currentSubjectLabel?.textContent || currentSubject}</strong>
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
                        There are ${allRecords.length} records in this table under other subjects.
                    </div>
                    <button type="button" id="btn-reset-subject-scope" class="btn btn-sm" style="padding: 6px 14px; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                        \u{1F310} Clear Subject Filter (Show All)
                    </button>
                </div>
            `;
      document.getElementById("btn-reset-subject-scope")?.addEventListener("click", () => setSubject("all"));
      return;
    }
    selectEl.innerHTML = `
            <option value="" ${!currentSelectedId ? "selected" : ""}>-- Select ${tableInfo.singularLabel || tableInfo.label} (${records.length}${currentSubject !== "all" ? ` of ${allRecords.length}` : ""} available) --</option>
            ${records.map(
      (r) => `<option value="${r.id}" ${currentSelectedId === r.id.toString() ? "selected" : ""}>
                            ${escapeHtml(getRecordFriendlyName(tableName, r))} (ID: ${r.id})
                        </option>`
    ).join("")}
        `;
    const showInstanceSelectionMenu = () => {
      currentSelectedId = null;
      selectEl.value = "";
      const mapping = typeMap[currentTypeKey] || { table: tableName, label: tableInfo.label };
      currentTitle = mapping.label;
      updateBreadcrumbs();
      const filterScopeBanner = currentSubject !== "all" ? `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px; margin-bottom: 14px;">
                    <span style="font-size: 12.5px; font-weight: 600; color: #1d4ed8;">
                        Filtered by Subject: <strong>${escapeHtml(currentSubjectLabel?.textContent || currentSubject)}</strong> (${records.length} of ${allRecords.length} records)
                    </span>
                    <button type="button" id="btn-clear-active-filter" style="background: none; border: none; font-size: 12px; font-weight: 700; color: #2563eb; cursor: pointer;">
                        \u2715 Clear Scope
                    </button>
                </div>
            ` : "";
      cardTarget.innerHTML = `
                <div class="instance-menu-card">
                    ${filterScopeBanner}
                    <div class="instance-menu-header">
                        <h3>Available ${tableInfo.label} (${records.length}${currentSubject !== "all" ? ` filtered from ${allRecords.length}` : ""})</h3>
                        <p>Select an instance below or from the dropdown menu above to inspect its complete database attributes.</p>
                    </div>
                    <div class="instance-menu-list">
                        ${records.map((r) => {
        const friendlyTitle = getRecordFriendlyName(tableName, r);
        const key = r.equation_key || r.statement_key || r.algo_key || r.seg_key || r.symbol || r.preset_key || "";
        const formula = r.formula_expr || r.expression || r.signature || "";
        const desc = r.formula_description || r.description || r.summary || "";
        return `
                                    <div class="instance-menu-item" data-id="${r.id}">
                                        <div style="flex: 1;">
                                            <div class="instance-item-title">
                                                <span>${escapeHtml(friendlyTitle)}</span>
                                                ${key ? `<code class="instance-key-badge">${escapeHtml(key)}</code>` : ""}
                                                ${r.statement_kind ? `<span class="kind-badge kind-${escapeHtml(r.statement_kind)}">${escapeHtml(r.statement_kind)}</span>` : ""}
                                                ${r.tier ? `<span class="tier-badge tier-${escapeHtml(r.tier)}">${escapeHtml(r.tier)}</span>` : ""}
                                                <span class="instance-id-badge">#${r.id}</span>
                                            </div>
                                            ${formula ? `<div class="instance-item-formula">${escapeHtml(formula)}</div>` : ""}
                                            ${desc ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">${escapeHtml(desc.slice(0, 140))}${desc.length > 140 ? "..." : ""}</div>` : ""}
                                        </div>
                                        <div style="color: var(--primary); font-size: 13px; font-weight: 700; margin-left: 12px;">
                                            Inspect \u2197
                                        </div>
                                    </div>
                                `;
      }).join("")}
                    </div>
                </div>
            `;
      cardTarget.querySelector("#btn-clear-active-filter")?.addEventListener("click", () => {
        setSubject("all");
      });
      cardTarget.querySelectorAll(".instance-menu-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-id");
          inspectInstance(id);
        });
      });
    };
    const inspectInstance = async (id) => {
      currentSelectedId = id;
      selectEl.value = id;
      const fullRecord = records.find((r) => r.id.toString() === id) || await fetchRecordById(tableName, id);
      if (fullRecord) {
        currentTitle = getRecordFriendlyName(tableName, fullRecord);
        updateBreadcrumbs();
        cardTarget.innerHTML = `
                    <button class="back-to-menu-btn" id="btn-back-to-menu">
                        <span>\u2039 Back to ${tableInfo.label} Selection Menu</span>
                    </button>
                `;
        const card = await renderAttributeCompleteCard(tableName, fullRecord);
        cardTarget.appendChild(card);
        document.getElementById("btn-back-to-menu")?.addEventListener("click", () => {
          showInstanceSelectionMenu();
        });
      }
    };
    if (currentSelectedId) {
      await inspectInstance(currentSelectedId);
    } else {
      showInstanceSelectionMenu();
    }
    selectEl.addEventListener("change", async () => {
      if (selectEl.value === "") {
        showInstanceSelectionMenu();
      } else {
        await inspectInstance(selectEl.value);
      }
    });
  } catch (err) {
    console.error(`[renderEntityInspectorView] Error loading ${tableName}:`, err);
    cardTarget.innerHTML = `<div style="padding: 24px; color: #dc2626;">Error querying table ${tableName}: ${err.message}</div>`;
  }
}
async function renderAttributeCompleteCard(tableName, record) {
  const tableInfo = appMetadata[tableName];
  const displayCol = getDisplayColumnName(tableName);
  const container = document.createElement("div");
  const card = document.createElement("div");
  card.className = "attribute-card";
  const titleVal = getRecordFriendlyName(tableName, record);
  card.innerHTML = `
        <div class="card-header-bar">
            <div>
                <h2 class="card-main-title">${escapeHtml(titleVal)}</h2>
                <div class="card-meta-line">
                    <span>Table: <strong style="font-family: var(--font-mono); color: var(--primary);">${tableName}</strong></span>
                    <span>\u2022</span>
                    <span>Primary Key: <strong>id = ${record.id}</strong></span>
                    <span>\u2022</span>
                    <span>Total Columns: <strong>${Object.keys(tableInfo.columns).length}</strong></span>
                </div>
            </div>
        </div>
    `;
  const table = document.createElement("table");
  table.className = "attr-table";
  table.innerHTML = `
        <thead>
            <tr>
                <th style="width: 220px;">DB Attribute (Column)</th>
                <th style="width: 170px;">Data Type & Constraint</th>
                <th>Database Value & Relationships</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
  const tbody = table.querySelector("tbody");
  for (const colName of Object.keys(tableInfo.columns)) {
    const colMeta = tableInfo.columns[colName];
    const rawVal = record[colName];
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.className = "attr-col-name";
    tdName.innerHTML = `
            <div>${escapeHtml(colName)}</div>
            ${colMeta.label && colMeta.label !== colName ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">${escapeHtml(colMeta.label)}</div>` : ""}
        `;
    tr.appendChild(tdName);
    const tdType = document.createElement("td");
    tdType.className = "attr-col-type";
    const flags = [];
    if (colMeta.isPrimaryKey) flags.push('<span style="color: var(--primary); font-weight: 700;">PK</span>');
    if (colMeta.isForeignKey) flags.push('<span style="color: #7c3aed; font-weight: 700;">FK</span>');
    if (!colMeta.isNullable) flags.push("NOT NULL");
    else flags.push("NULLABLE");
    if (colMeta.isEnum) flags.push("ENUM");
    tdType.innerHTML = `
            <div>${escapeHtml(colMeta.dbDataType.toUpperCase())}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${flags.join(" \u2022 ")}</div>
        `;
    tr.appendChild(tdType);
    const tdVal = document.createElement("td");
    tdVal.className = "attr-col-val";
    if (rawVal === null || rawVal === void 0) {
      tdVal.innerHTML = `<span class="null-badge">NULL</span>`;
    } else if (typeof rawVal === "boolean") {
      tdVal.innerHTML = rawVal ? `<span style="color: var(--emerald); font-weight: 700;">TRUE</span>` : `<span style="color: #64748b; font-weight: 700;">FALSE</span>`;
    } else if (colMeta.isForeignKey && rawVal) {
      const fkTable = colMeta.foreignKeyTable || "unknown";
      tdVal.innerHTML = `
                <span style="font-family: var(--font-mono); font-weight: 700;">${rawVal}</span>
                <button class="fk-goto-btn" data-fktable="${fkTable}" data-fkid="${rawVal}">
                    <span>\u2197 Go to ${fkTable} #${rawVal}</span>
                </button>
            `;
      const targetCol = getDisplayColumnName(fkTable);
      queryDatabase(`SELECT "${targetCol}" as name FROM ${fkTable} WHERE id = $1;`, [rawVal]).then((rows) => {
        if (rows && rows.length > 0) {
          const btn = tdVal.querySelector(".fk-goto-btn");
          if (btn) {
            btn.innerHTML = `<span>\u2197 Go to ${appMetadata[fkTable]?.singularLabel || fkTable}: ${escapeHtml(rows[0].name || "")} (#${rawVal})</span>`;
          }
        }
      }).catch(() => {
      });
    } else if (tableName === "interactive_demos" && colName === "expression") {
      const expStr = rawVal ? rawVal.toString() : "";
      const isFsd = record.engine === "fsd";
      if (isFsd) {
        let initObj = null;
        try {
          initObj = typeof record.init_packet === "object" ? record.init_packet : JSON.parse(record.init_packet || "{}");
        } catch (e) {
        }
        const quantifiers = initObj?.quantifiers || "";
        const slots = initObj?.slots ? `(${initObj.slots})` : "";
        const predSym = PxeEngine.charDisplayMap[expStr] || expStr;
        const innerPred = slots ? `${predSym}${slots}` : predSym;
        const displayFormula = quantifiers ? `${quantifiers} [ ${innerPred} ]` : innerPred;
        tdVal.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                            <code style="font-family: var(--font-mono); font-weight: 700; color: #7c3aed; background: #f5f3ff; padding: 4px 10px; border-radius: 4px; font-size: 13px;">Predicate: ${escapeHtml(expStr || "\u2014")}</code>
                            <span style="font-size: 20px; font-weight: 700; color: #1e3a8a; font-family: 'Cambria Math', Georgia, serif;">${escapeHtml(displayFormula)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #64748b;">
                            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                                Active: Stage ${escapeHtml(initObj?.stage || "4")} (Matrix Visualizer)
                            </span>
                            ${initObj?.slots ? `<span>Bound Slots: <strong style="color: #334155;">${escapeHtml(initObj.slots)}</strong></span>` : ""}
                        </div>
                    </div>
                `;
      } else {
        const fmtStr = expStr ? PxeEngine.fmt(expStr) : "";
        tdVal.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <code style="font-family: var(--font-mono); font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; font-size: 13px;">${escapeHtml(expStr || "\u2014")}</code>
                        <span style="font-size: 19px; font-weight: 700; color: firebrick; font-family: 'Cambria Math', Georgia, serif;">${escapeHtml(fmtStr)}</span>
                    </div>
                `;
      }
    } else if (tableName === "interactive_demos" && colName === "status") {
      const st = rawVal ? rawVal.toString() : "";
      let badgeBg = "#f1f5f9";
      let badgeColor = "#475569";
      let badgeLabel = st || "None";
      if (st === "taut") {
        badgeBg = "#ecfdf5";
        badgeColor = "#047857";
        badgeLabel = "\u2696\uFE0F Tautology [taut]";
      } else if (st === "unsat") {
        badgeBg = "#fef2f2";
        badgeColor = "#dc2626";
        badgeLabel = "\u26A0\uFE0F Unsatisfiable [unsat]";
      } else if (st === "cont") {
        badgeBg = "#f1f5f9";
        badgeColor = "#0284c7";
        badgeLabel = "Contingent [cont]";
      }
      tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; background: ${badgeBg}; color: ${badgeColor};">${escapeHtml(badgeLabel)}</span>`;
    } else if (tableName === "interactive_demos" && colName === "init_packet") {
      tdVal.innerHTML = `
                <details style="font-size: 11px; color: #64748b;">
                    <summary style="cursor: pointer; font-weight: 600;">View Raw JSON Packet</summary>
                    <pre class="raw-code-box" style="margin-top: 4px;">${escapeHtml(typeof rawVal === "object" ? JSON.stringify(rawVal, null, 2) : (rawVal || "").toString())}</pre>
                </details>
            `;
    } else if (typeof rawVal === "object") {
      tdVal.innerHTML = `<pre class="raw-code-box">${escapeHtml(JSON.stringify(rawVal, null, 2))}</pre>`;
    } else if (colName === "content_html") {
      tdVal.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 2px 0;">
                    <span style="font-size: 13px; font-weight: 600; color: #1e293b;">HTML Lecture Body</span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${(rawVal.length / 1024).toFixed(1)} KB (${rawVal.length.toLocaleString()} chars)
                    </span>
                    <button type="button" class="action-btn secondary btn-scroll-to-lecture-viewer" style="font-size: 11.5px; padding: 3px 10px; cursor: pointer;">
                        \u{1F4D6} View &amp; Inspect Lecture Content \u2193
                    </button>
                </div>
            `;
      tdVal.querySelector(".btn-scroll-to-lecture-viewer")?.addEventListener("click", () => {
        const viewerEl = card.querySelector(".lecture-content-viewer");
        if (viewerEl) {
          viewerEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    } else if (colMeta.rows && colMeta.rows > 1) {
      tdVal.innerHTML = `<pre class="raw-code-box">${escapeHtml(rawVal.toString())}</pre>`;
    } else {
      tdVal.textContent = rawVal.toString();
    }
    tr.appendChild(tdVal);
    tbody.appendChild(tr);
  }
  card.appendChild(table);
  const relContainer = document.createElement("div");
  relContainer.className = "connected-relations-container";
  relContainer.style.cssText = "margin: 20px 24px; padding: 18px 20px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);";
  let hasRelations = false;
  let relRowsHtml = "";
  if (tableName === "formal_statements") {
    try {
      const stencils = await queryDatabase(
        `SELECT de.id, de.equation_key, de.title, de.label
                 FROM directed_equations de
                 JOIN equation_statement_links esl ON esl.equation_id = de.id
                 WHERE esl.statement_id = $1
                 ORDER BY de.id ASC;`,
        [record.id]
      );
      if (stencils && stencils.length > 0) {
        hasRelations = true;
        if (stencils.length === 1) {
          const st = stencils[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Computational Stencil:</span>
                            <input type="text" readonly value="${escapeHtml(st.title)} (${escapeHtml(st.label)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-stencil" data-id="${st.id}" data-title="${escapeHtml(st.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Stencil \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Computational Stencils (${stencils.length}):</span>
                            <select id="select-rel-stencils" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${stencils.map((s) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.label)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-rel-stencil" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Stencil \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying stencils:", err);
    }
    try {
      let algoRecord = null;
      if (record.pseudo_algo_id) {
        algoRecord = await fetchRecordById("pseudocode_algorithms", record.pseudo_algo_id.toString());
      } else {
        const algos = await queryDatabase(
          `SELECT pa.id, pa.algo_key, pa.name, pa.title
                     FROM pseudocode_algorithms pa
                     JOIN directed_equations de ON de.pseudo_algo_id = pa.id
                     JOIN equation_statement_links esl ON esl.equation_id = de.id
                     WHERE esl.statement_id = $1 LIMIT 1;`,
          [record.id]
        );
        if (algos && algos.length > 0) algoRecord = algos[0];
      }
      if (algoRecord) {
        hasRelations = true;
        const algoTitle = algoRecord.title || algoRecord.name || algoRecord.algo_key;
        relRowsHtml += `
                    <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Pseudocode Algorithm:</span>
                        <input type="text" readonly value="${escapeHtml(algoTitle)} (${escapeHtml(algoRecord.algo_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                        <button type="button" class="btn btn-sm btn-nav-algo" data-id="${algoRecord.id}" data-title="${escapeHtml(algoTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #4f46e5; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                            Inspect Pseudocode \u2197
                        </button>
                    </div>
                `;
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying pseudocode:", err);
    }
    if (record.parent_id) {
      try {
        const parentStmt = await fetchRecordById("formal_statements", record.parent_id.toString());
        if (parentStmt) {
          hasRelations = true;
          const pTitle = parentStmt.title || parentStmt.expression || parentStmt.statement_key;
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Instantiates (Parent FS):</span>
                            <input type="text" readonly value="${escapeHtml(pTitle)} (${escapeHtml(parentStmt.statement_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-parent-fs" data-id="${parentStmt.id}" data-title="${escapeHtml(pTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent FS \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying parent formal statement:", err);
      }
    }
  }
  if (tableName === "directed_equations") {
    try {
      const parentStmts = await queryDatabase(
        `SELECT fs.id, fs.statement_key, fs.title
                 FROM formal_statements fs
                 JOIN equation_statement_links esl ON esl.statement_id = fs.id
                 WHERE esl.equation_id = $1
                 ORDER BY fs.id ASC;`,
        [record.id]
      );
      if (parentStmts && parentStmts.length > 0) {
        hasRelations = true;
        if (parentStmts.length === 1) {
          const pst = parentStmts[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Directed Equality:</span>
                            <input type="text" readonly value="${escapeHtml(pst.title)} (${escapeHtml(pst.statement_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-parent-fs" data-id="${pst.id}" data-title="${escapeHtml(pst.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Statements (${parentStmts.length}):</span>
                            <select id="select-parent-de" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${parentStmts.map((p) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.statement_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-parent-de" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying parent statements:", err);
    }
    if (record.pseudo_algo_id) {
      try {
        const algoRecord = await fetchRecordById("pseudocode_algorithms", record.pseudo_algo_id.toString());
        if (algoRecord) {
          hasRelations = true;
          const algoTitle = algoRecord.title || algoRecord.name || algoRecord.algo_key;
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Associated Pseudocode:</span>
                            <input type="text" readonly value="${escapeHtml(algoTitle)} (${escapeHtml(algoRecord.algo_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-algo" data-id="${algoRecord.id}" data-title="${escapeHtml(algoTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #4f46e5; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Pseudocode \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying stencil pseudocode:", err);
      }
    }
  }
  if (tableName === "pseudocode_algorithms") {
    try {
      const parentStmts = await queryDatabase(
        `SELECT fs.id, fs.statement_key, fs.title
                 FROM formal_statements fs
                 WHERE fs.pseudo_algo_id = $1
                    OR fs.id IN (
                        SELECT esl.statement_id 
                        FROM equation_statement_links esl 
                        JOIN directed_equations de ON de.id = esl.equation_id 
                        WHERE de.pseudo_algo_id = $1
                    )
                 LIMIT 5;`,
        [record.id]
      );
      if (parentStmts && parentStmts.length > 0) {
        hasRelations = true;
        if (parentStmts.length === 1) {
          const pst = parentStmts[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Directed Equality:</span>
                            <input type="text" readonly value="${escapeHtml(pst.title)} (${escapeHtml(pst.statement_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-parent-fs" data-id="${pst.id}" data-title="${escapeHtml(pst.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Statements (${parentStmts.length}):</span>
                            <select id="select-parent-de" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${parentStmts.map((p) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.statement_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-parent-de" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying parent statements for algorithm:", err);
    }
  }
  if (tableName === "curriculum_nav_items") {
    if (record.segment_id) {
      try {
        const segRecord = await fetchRecordById("segments", record.segment_id.toString());
        if (segRecord) {
          hasRelations = true;
          const segTitle = segRecord.title || segRecord.seg_key;
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Lecture Segment:</span>
                            <input type="text" readonly value="${escapeHtml(segTitle)} (${escapeHtml(segRecord.seg_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-segment" data-id="${segRecord.id}" data-title="${escapeHtml(segTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Segment \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying segment for nav item:", err);
      }
    }
    if (record.diagram_key) {
      try {
        const demos = await queryDatabase(
          `SELECT id, title, engine FROM interactive_demos WHERE engine = $1 LIMIT 1;`,
          [record.diagram_key]
        );
        if (demos && demos.length > 0) {
          hasRelations = true;
          const demo = demos[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Interactive Demo:</span>
                            <input type="text" readonly value="${escapeHtml(demo.title)} [${escapeHtml(demo.engine)}]" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-demo" data-id="${demo.id}" data-title="${escapeHtml(demo.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #059669; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Demo \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying demo for nav item:", err);
      }
    }
    if (record.parent_id) {
      try {
        const parentNav = await fetchRecordById("curriculum_nav_items", record.parent_id.toString());
        if (parentNav) {
          hasRelations = true;
          const pTitle = parentNav.topic || parentNav.nav_key;
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Index Entry:</span>
                            <input type="text" readonly value="${escapeHtml(pTitle)} (${escapeHtml(parentNav.nav_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-index-entry" data-id="${parentNav.id}" data-title="${escapeHtml(pTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent Entry \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying parent nav item:", err);
      }
    }
    try {
      const childNavs = await queryDatabase(
        `SELECT id, nav_key, topic, sequence_order FROM curriculum_nav_items WHERE parent_id = $1 ORDER BY sequence_order ASC, id ASC;`,
        [record.id]
      );
      if (childNavs && childNavs.length > 0) {
        hasRelations = true;
        if (childNavs.length === 1) {
          const c = childNavs[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Child Index Entry:</span>
                            <input type="text" readonly value="${escapeHtml(c.topic)} (${escapeHtml(c.nav_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-index-entry" data-id="${c.id}" data-title="${escapeHtml(c.topic)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Index Entry \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Child Index Entries (${childNavs.length}):</span>
                            <select id="select-child-navs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${childNavs.map((n) => `<option value="${n.id}" data-title="${escapeHtml(n.topic)}">${escapeHtml(n.topic)} (${escapeHtml(n.nav_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-child-nav" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying child nav items:", err);
    }
  }
  if (tableName === "segments") {
    try {
      const navItems = await queryDatabase(
        `SELECT id, nav_key, topic, sequence_order FROM curriculum_nav_items WHERE segment_id = $1 ORDER BY id ASC;`,
        [record.id]
      );
      if (navItems && navItems.length > 0) {
        hasRelations = true;
        if (navItems.length === 1) {
          const n = navItems[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Index Entry:</span>
                            <input type="text" readonly value="${escapeHtml(n.topic)} (${escapeHtml(n.nav_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-index-entry" data-id="${n.id}" data-title="${escapeHtml(n.topic)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Index Entry \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Index Entries (${navItems.length}):</span>
                            <select id="select-seg-navs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${navItems.map((n) => `<option value="${n.id}" data-title="${escapeHtml(n.topic)}">${escapeHtml(n.topic)} (${escapeHtml(n.nav_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-seg-nav" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying nav items for segment:", err);
    }
    try {
      const citedStmts = await queryDatabase(
        `SELECT DISTINCT fs.id, fs.statement_key, fs.title, fs.statement_kind
                 FROM segment_references sr
                 JOIN formal_statements fs ON fs.id = sr.statement_id
                 WHERE sr.segment_id = $1
                 ORDER BY fs.id ASC;`,
        [record.id]
      );
      if (citedStmts && citedStmts.length > 0) {
        hasRelations = true;
        if (citedStmts.length === 1) {
          const cs = citedStmts[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Formal Statement:</span>
                            <input type="text" readonly value="${escapeHtml(cs.title)} (${escapeHtml(cs.statement_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-parent-fs" data-id="${cs.id}" data-title="${escapeHtml(cs.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Statement \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Formal Statements (${citedStmts.length}):</span>
                            <select id="select-cited-stmts" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citedStmts.map((s) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-cited-stmt" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying cited statements for segment:", err);
    }
    try {
      const citedStencils = await queryDatabase(
        `SELECT DISTINCT de.id, de.equation_key, de.title, de.label
                 FROM segment_references sr
                 JOIN directed_equations de ON de.id = sr.equation_id
                 WHERE sr.segment_id = $1
                 ORDER BY de.id ASC;`,
        [record.id]
      );
      if (citedStencils && citedStencils.length > 0) {
        hasRelations = true;
        if (citedStencils.length === 1) {
          const cst = citedStencils[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Stencil:</span>
                            <input type="text" readonly value="${escapeHtml(cst.title)} (${escapeHtml(cst.label)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-stencil" data-id="${cst.id}" data-title="${escapeHtml(cst.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Stencil \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Stencils (${citedStencils.length}):</span>
                            <select id="select-cited-stencils" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citedStencils.map((s) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.label)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-cited-stencil" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying cited stencils for segment:", err);
    }
    try {
      const prereqs = await queryDatabase(
        `SELECT s.id, s.seg_key, s.title, sp.prerequisite_type
                 FROM segment_prerequisites sp
                 JOIN segments s ON s.id = sp.depends_on_segment_id
                 WHERE sp.segment_id = $1
                 ORDER BY s.sequence_order ASC, s.id ASC;`,
        [record.id]
      );
      if (prereqs && prereqs.length > 0) {
        hasRelations = true;
        if (prereqs.length === 1) {
          const pr = prereqs[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Prerequisite Chapter:</span>
                            <input type="text" readonly value="${escapeHtml(pr.title)} (${escapeHtml(pr.seg_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-segment" data-id="${pr.id}" data-title="${escapeHtml(pr.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Prerequisite \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Prerequisite Chapters (${prereqs.length}):</span>
                            <select id="select-prereqs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${prereqs.map((p) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.seg_key)}) [${escapeHtml(p.prerequisite_type)}]</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-prereq" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying prerequisites for segment:", err);
    }
  }
  if (tableName === "interactive_demos") {
    try {
      let exp = record.expression || "";
      if (!exp) {
        try {
          const initObj = typeof record.init_packet === "object" ? record.init_packet : JSON.parse(record.init_packet || "{}");
          exp = initObj?.exp || "";
        } catch (e) {
        }
      }
      let query = `
                SELECT DISTINCT s.id, s.seg_key, s.title
                FROM segments s
                LEFT JOIN segment_references sr ON sr.segment_id = s.id AND sr.demo_id = $1
                WHERE sr.id IS NOT NULL
                   OR s.content_html LIKE $2
                   OR s.content_html LIKE $3
            `;
      const params = [
        record.id,
        `%id="${record.id}"%`,
        `%demo-id="${record.id}"%`
      ];
      if (exp) {
        params.push(`%${exp}%`);
        query += ` OR s.content_html LIKE $${params.length}`;
      }
      query += ` ORDER BY s.id ASC;`;
      const citingSegs = await queryDatabase(query, params);
      if (citingSegs && citingSegs.length > 0) {
        hasRelations = true;
        if (citingSegs.length === 1) {
          const cseg = citingSegs[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Citing Chapter (Segment):</span>
                            <input type="text" readonly value="${escapeHtml(cseg.title || cseg.seg_key)} (${escapeHtml(cseg.seg_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-segment" data-id="${cseg.id}" data-title="${escapeHtml(cseg.title || cseg.seg_key)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Segment \u2197
                            </button>
                        </div>
                    `;
        } else {
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Citing Chapters (${citingSegs.length}):</span>
                            <select id="select-citing-segs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citingSegs.map((s) => `<option value="${s.id}" data-title="${escapeHtml(s.title || s.seg_key)}">${escapeHtml(s.title || s.seg_key)} (${escapeHtml(s.seg_key)})</option>`).join("")}
                            </select>
                            <button type="button" id="btn-nav-citing-seg" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected \u2197
                            </button>
                        </div>
                    `;
        }
      }
    } catch (err) {
      console.error("[renderAttributeCompleteCard] Error querying citing segments for demo:", err);
    }
    if (record.engine === "fsd") {
      try {
        let predKey = record.expression || "";
        if (!predKey) {
          try {
            const initObj = typeof record.init_packet === "object" ? record.init_packet : JSON.parse(record.init_packet || "{}");
            predKey = initObj?.exp || "";
          } catch (e) {
          }
        }
        const codeToEqMap = {
          "j": "eq_pred_assign",
          "r": "eq_pred_gt",
          "s": "eq_pred_lt",
          "k": "eq_pred_eq",
          "l": "eq_pred_le",
          "m": "eq_pred_mem",
          "b": "eq_pred_subset",
          "v": "eq_pred_even",
          "d": "eq_pred_odd",
          "u": "eq_pred_succ",
          "w": "eq_pred_near",
          "c": "eq_pred_div"
        };
        const mappedEqKey = codeToEqMap[predKey] || `eq_pred_${predKey}`;
        const predRows = await queryDatabase(
          `SELECT id, equation_key, title, formula_expr 
                     FROM directed_equations 
                     WHERE target_domain IN ('B_w', '\u{1D539}', 'B') 
                       AND (equation_key = $1 OR equation_key LIKE '%' || $2 OR target_symbol = $2)
                     LIMIT 1;`,
          [mappedEqKey, predKey]
        );
        if (predRows && predRows.length > 0) {
          hasRelations = true;
          const pde = predRows[0];
          relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Governing Predicate (DE):</span>
                            <input type="text" readonly value="${escapeHtml(pde.title)} (${escapeHtml(pde.equation_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-stencil" data-id="${pde.id}" data-title="${escapeHtml(pde.title)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #059669; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Predicate DE \u2197
                            </button>
                        </div>
                    `;
        }
      } catch (err) {
        console.error("[renderAttributeCompleteCard] Error querying predicate DE for FSD:", err);
      }
    }
  }
  const dependentsForTable = tableInfo.dependents || [];
  for (const dep of dependentsForTable) {
    if (tableName === "formal_statements" && dep.table === "directed_equations") continue;
    if (tableName === "curriculum_nav_items" && dep.table === "curriculum_nav_items") continue;
    if (tableName === "segments" && (dep.table === "segment_references" || dep.table === "segment_prerequisites" || dep.table === "curriculum_nav_items")) continue;
    const depTableMeta = appMetadata[dep.table];
    if (!depTableMeta) continue;
    const fkToParent = Object.values(depTableMeta.columns).find(
      (c) => c.isForeignKey && c.foreignKeyTable === tableName
    );
    if (fkToParent) {
      try {
        const childRows = await queryDatabase(
          `SELECT * FROM ${dep.table} WHERE "${fkToParent.column}" = $1 ORDER BY id ASC;`,
          [record.id]
        );
        if (childRows && childRows.length > 0) {
          hasRelations = true;
          const childSingular = depTableMeta.singularLabel || depTableMeta.label;
          const childPlural = depTableMeta.label;
          if (childRows.length === 1) {
            const child = childRows[0];
            const friendlyName = getRecordFriendlyName(dep.table, child);
            relRowsHtml += `
                            <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">${escapeHtml(childSingular)}:</span>
                                <input type="text" readonly value="${escapeHtml(friendlyName)}" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                                <button type="button" class="btn btn-sm btn-nav-dep-child" data-table="${dep.table}" data-id="${child.id}" data-title="${escapeHtml(friendlyName)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                    Inspect ${escapeHtml(childSingular)} \u2197
                                </button>
                            </div>
                        `;
          } else {
            const selectId = `select-dep-${dep.table}`;
            relRowsHtml += `
                            <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">${escapeHtml(childPlural)} (${childRows.length}):</span>
                                <select id="${selectId}" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                    ${childRows.map((r) => {
              const fname = getRecordFriendlyName(dep.table, r);
              return `<option value="${r.id}" data-title="${escapeHtml(fname)}">${escapeHtml(fname)}</option>`;
            }).join("")}
                                </select>
                                <button type="button" class="btn btn-sm btn-nav-dep-multi" data-select-id="${selectId}" data-table="${dep.table}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                    Inspect Selected \u2197
                                </button>
                            </div>
                        `;
          }
        }
      } catch (err) {
        console.error(`[renderAttributeCompleteCard] Error querying dependent ${dep.table}:`, err);
      }
    }
  }
  if (hasRelations) {
    relContainer.innerHTML = `
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                Connected Entities &amp; Child Relationships
            </div>
            <div>${relRowsHtml}</div>
        `;
    relContainer.querySelectorAll(".btn-nav-stencil").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-id");
        const stitle = btn.getAttribute("data-title");
        navigateToEntity("computational_stencil", sid, stitle);
      });
    });
    const btnNavRelStencil = relContainer.querySelector("#btn-nav-rel-stencil");
    if (btnNavRelStencil) {
      btnNavRelStencil.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-rel-stencils");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("computational_stencil", selectEl.value, opt?.getAttribute("data-title") || "Stencil");
        }
      });
    }
    relContainer.querySelectorAll(".btn-nav-algo").forEach((btn) => {
      btn.addEventListener("click", () => {
        const aid = btn.getAttribute("data-id");
        const atitle = btn.getAttribute("data-title");
        navigateToEntity("pseudocode_algorithms", aid, atitle);
      });
    });
    relContainer.querySelectorAll(".btn-nav-parent-fs").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-id");
        const ptitle = btn.getAttribute("data-title");
        navigateToEntity("formal_statement", pid, ptitle);
      });
    });
    const btnNavParentDe = relContainer.querySelector("#btn-nav-parent-de");
    if (btnNavParentDe) {
      btnNavParentDe.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-parent-de");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("formal_statement", selectEl.value, opt?.getAttribute("data-title") || "Formal Statement");
        }
      });
    }
    relContainer.querySelectorAll(".btn-nav-segment").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        navigateToEntity("segments", id, title);
      });
    });
    const btnNavCitingSeg = relContainer.querySelector("#btn-nav-citing-seg");
    if (btnNavCitingSeg) {
      btnNavCitingSeg.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-citing-segs");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("segments", selectEl.value, opt?.getAttribute("data-title") || "Segment");
        }
      });
    }
    relContainer.querySelectorAll(".btn-nav-index-entry").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        navigateToEntity("curriculum_nav_item", id, title);
      });
    });
    const btnNavChildNav = relContainer.querySelector("#btn-nav-child-nav");
    if (btnNavChildNav) {
      btnNavChildNav.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-child-navs");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("curriculum_nav_item", selectEl.value, opt?.getAttribute("data-title") || "Index Entry");
        }
      });
    }
    const btnNavSegNav = relContainer.querySelector("#btn-nav-seg-nav");
    if (btnNavSegNav) {
      btnNavSegNav.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-seg-navs");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("curriculum_nav_item", selectEl.value, opt?.getAttribute("data-title") || "Index Entry");
        }
      });
    }
    const btnNavCitedStmt = relContainer.querySelector("#btn-nav-cited-stmt");
    if (btnNavCitedStmt) {
      btnNavCitedStmt.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-cited-stmts");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("formal_statement", selectEl.value, opt?.getAttribute("data-title") || "Statement");
        }
      });
    }
    const btnNavCitedStencil = relContainer.querySelector("#btn-nav-cited-stencil");
    if (btnNavCitedStencil) {
      btnNavCitedStencil.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-cited-stencils");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("computational_stencil", selectEl.value, opt?.getAttribute("data-title") || "Stencil");
        }
      });
    }
    const btnNavPrereq = relContainer.querySelector("#btn-nav-prereq");
    if (btnNavPrereq) {
      btnNavPrereq.addEventListener("click", () => {
        const selectEl = relContainer.querySelector("#select-prereqs");
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          navigateToEntity("segments", selectEl.value, opt?.getAttribute("data-title") || "Prerequisite");
        }
      });
    }
    relContainer.querySelectorAll(".btn-nav-demo").forEach((btn) => {
      btn.addEventListener("click", () => {
        const did = btn.getAttribute("data-id");
        const dtitle = btn.getAttribute("data-title");
        navigateToEntity("interactive_demos", did, dtitle);
      });
    });
    relContainer.querySelectorAll(".btn-nav-dep-child").forEach((btn) => {
      btn.addEventListener("click", () => {
        const table2 = btn.getAttribute("data-table");
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        navigateToEntity(table2, id, title);
      });
    });
    relContainer.querySelectorAll(".btn-nav-dep-multi").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectId = btn.getAttribute("data-select-id");
        const table2 = btn.getAttribute("data-table");
        const selectEl = relContainer.querySelector(`#${selectId}`);
        if (selectEl && selectEl.value) {
          const opt = selectEl.selectedOptions[0];
          const title = opt?.getAttribute("data-title") || `${table2} #${selectEl.value}`;
          navigateToEntity(table2, selectEl.value, title);
        }
      });
    });
    card.appendChild(relContainer);
  }
  if (tableName === "segments" && record.content_html) {
    const viewer = document.createElement("div");
    viewer.className = "lecture-content-viewer";
    viewer.style.cssText = "margin: 20px 24px; padding: 18px 20px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);";
    viewer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        \u{1F4D6} Lecture Content &amp; HTML Viewer
                    </span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${(record.content_html.length / 1024).toFixed(1)} KB
                    </span>
                    <span style="font-size: 11px; color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 12px; font-weight: 600; border: 1px solid #a7f3d0;">
                        ${escapeHtml(record.status || "published")}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="btn btn-sm btn-lecture-tab-preview" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid var(--primary); background: var(--primary); color: #ffffff; cursor: pointer;">
                        \u{1F441}\uFE0F Rendered Preview
                    </button>
                    <button type="button" class="btn btn-sm btn-lecture-tab-source" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid var(--border-color); background: #ffffff; color: #475569; cursor: pointer;">
                        \u2039/\u203A Raw HTML Source
                    </button>
                </div>
            </div>
            <div class="lecture-tab-body-preview" style="padding: 22px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px; max-height: 600px; overflow-y: auto; line-height: 1.6; color: #1e293b;">
                ${record.content_html}
            </div>
            <div class="lecture-tab-body-source" style="display: none; max-height: 600px; overflow-y: auto;">
                <pre class="raw-code-box" style="margin: 0; max-height: 580px; overflow: auto; background: #f8fafc; border: 1px solid var(--border-color); padding: 14px; border-radius: 6px; font-family: var(--font-mono); font-size: 12px; line-height: 1.5; color: #0f172a;">${escapeHtml(record.content_html)}</pre>
            </div>
        `;
    const btnPreview = viewer.querySelector(".btn-lecture-tab-preview");
    const btnSource = viewer.querySelector(".btn-lecture-tab-source");
    const bodyPreview = viewer.querySelector(".lecture-tab-body-preview");
    const bodySource = viewer.querySelector(".lecture-tab-body-source");
    btnPreview?.addEventListener("click", () => {
      btnPreview.style.background = "var(--primary)";
      btnPreview.style.borderColor = "var(--primary)";
      btnPreview.style.color = "#ffffff";
      btnSource.style.background = "#ffffff";
      btnSource.style.borderColor = "var(--border-color)";
      btnSource.style.color = "#475569";
      bodyPreview.style.display = "block";
      bodySource.style.display = "none";
    });
    btnSource?.addEventListener("click", () => {
      btnSource.style.background = "var(--primary)";
      btnSource.style.borderColor = "var(--primary)";
      btnSource.style.color = "#ffffff";
      btnPreview.style.background = "#ffffff";
      btnPreview.style.borderColor = "var(--border-color)";
      btnPreview.style.color = "#475569";
      bodyPreview.style.display = "none";
      bodySource.style.display = "block";
    });
    card.appendChild(viewer);
  }
  container.appendChild(card);
  card.querySelectorAll(".fk-goto-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fkTable = btn.getAttribute("data-fktable");
      const fkId = btn.getAttribute("data-fkid");
      navigateToEntity(fkTable, fkId, `${fkTable} #${fkId}`);
    });
  });
  return container;
}
function renderRecordForm(tableName, record = null, isNew = false) {
  if (!displayArea) return;
  const tableInfo = appMetadata[tableName];
  const displayCol = getDisplayColumnName(tableName);
  const formTitle = isNew ? `Create New ${tableInfo.singularLabel || tableInfo.label}` : `Modify ${tableInfo.singularLabel || tableInfo.label}: ${record ? record[displayCol] || `ID: ${record.id}` : ""}`;
  displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="form-container">
                <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 6px;">${escapeHtml(formTitle)}</h2>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">
                    Table: <strong>${tableName}</strong> ${isNew ? "\u2022 Mode: INSERT" : `\u2022 Mode: UPDATE (id = ${record.id})`}
                </div>
                <form id="active-crud-form">
                    <div id="form-fields-target"></div>
                    <div class="form-actions-footer">
                        <button type="submit" class="action-btn primary" id="btn-save-record">
                            \u{1F4BE} ${isNew ? "Create Record" : "Save Changes"}
                        </button>
                        <button type="button" class="action-btn secondary" id="btn-cancel-edit">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
  const fieldsTarget = document.getElementById("form-fields-target");
  const form = document.getElementById("active-crud-form");
  for (const colName of Object.keys(tableInfo.columns)) {
    const colMeta = tableInfo.columns[colName];
    if (colMeta.isPrimaryKey && isNew) continue;
    let val = record ? record[colName] : "";
    if (isNew && tableName === "interactive_demos") {
      if (colName === "engine" && (currentTypeKey === "ttd" || currentTypeKey === "truth_table")) {
        val = "ttd";
      }
      if (colName === "mode" && (currentTypeKey === "ttd" || currentTypeKey === "truth_table")) {
        val = "propositional_logic";
      }
    }
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "form-field-group";
    fieldGroup.innerHTML = `
            <div class="form-field-header">
                <label class="form-field-label" for="field-${colName}">
                    ${escapeHtml(colMeta.label || colName)} ${!colMeta.isNullable ? '<span style="color: var(--danger);">*</span>' : ""}
                </label>
                <span class="form-field-type">
                    ${escapeHtml(colName)} \u2022 ${colMeta.dbDataType.toUpperCase()} ${colMeta.isPrimaryKey ? "(PK)" : ""}
                </span>
            </div>
        `;
    let inputElement;
    if (colMeta.isPrimaryKey || !colMeta.canModify) {
      const input = document.createElement("input");
      input.type = "text";
      input.id = `field-${colName}`;
      input.name = colName;
      input.value = val !== null && val !== void 0 ? val.toString() : "";
      input.readOnly = true;
      input.className = "form-input";
      input.style.backgroundColor = "#f1f5f9";
      input.style.color = "#64748b";
      input.style.cursor = "not-allowed";
      inputElement = input;
    } else if (colMeta.isEnum) {
      const select = document.createElement("select");
      select.id = `field-${colName}`;
      select.name = colName;
      select.className = "form-select";
      if (colMeta.isNullable) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "-- (None / NULL) --";
        select.appendChild(opt);
      }
      colMeta.enumValues.forEach((ev) => {
        const opt = document.createElement("option");
        opt.value = ev;
        let optLabel = ev;
        if (colName === "status" && tableName === "interactive_demos") {
          if (ev === "taut") optLabel = "taut (Tautology)";
          else if (ev === "unsat") optLabel = "unsat (Unsatisfiable / Contradiction)";
          else if (ev === "cont") optLabel = "cont (Contingent)";
        }
        opt.textContent = optLabel;
        if (val === ev) opt.selected = true;
        select.appendChild(opt);
      });
      inputElement = select;
    } else if (colMeta.dbDataType === "boolean") {
      const select = document.createElement("select");
      select.id = `field-${colName}`;
      select.name = colName;
      select.className = "form-select";
      const optTrue = document.createElement("option");
      optTrue.value = "true";
      optTrue.textContent = "TRUE";
      if (val === true || val === "true") optTrue.selected = true;
      const optFalse = document.createElement("option");
      optFalse.value = "false";
      optFalse.textContent = "FALSE";
      if (val === false || val === "false") optFalse.selected = true;
      select.appendChild(optTrue);
      select.appendChild(optFalse);
      inputElement = select;
    } else if (colName === "target_domain" || tableName === "mode_slots" && colName === "domain") {
      const select = document.createElement("select");
      select.id = `field-${colName}`;
      select.name = colName;
      select.className = "form-select";
      select.innerHTML = `<option value="">Loading MWM domains from database...</option>`;
      queryDatabase("SELECT domain_key, symbol, name, lean_type, base_unit FROM domains ORDER BY id ASC;").then((domainRows) => {
        if (domainRows && domainRows.length > 0) {
          select.innerHTML = `
                            <option value="">-- Select Valid MWM Domain (Lean-Anchored) --</option>
                            ${domainRows.map((d) => {
            const isSel = val === d.domain_key || val === d.symbol;
            const leanPart = d.lean_type ? ` [Lean: ${escapeHtml(d.lean_type)}]` : "";
            const unitPart = d.base_unit ? ` (${escapeHtml(d.base_unit)})` : "";
            return `<option value="${escapeHtml(d.domain_key)}" ${isSel ? "selected" : ""}>
                                        ${escapeHtml(d.symbol)} \u2014 ${escapeHtml(d.name)}${unitPart}${leanPart}
                                    </option>`;
          }).join("")}
                        `;
        }
      }).catch((err) => {
        console.error("[renderRecordForm] Error fetching domains:", err);
      });
      inputElement = select;
    } else if (tableName === "formal_statements" && colName === "parent_id") {
      const select = document.createElement("select");
      select.id = `field-${colName}`;
      select.name = colName;
      select.className = "form-select";
      select.innerHTML = `<option value="">-- None (Top-Level Formal Statement) --</option>`;
      queryDatabase("SELECT id, statement_key, title, statement_kind FROM formal_statements WHERE statement_kind IN ('axiom', 'theorem') ORDER BY id ASC;").then((stmts) => {
        if (stmts && stmts.length > 0) {
          select.innerHTML = `
                            <option value="">-- None (Top-Level Formal Statement) --</option>
                            ${stmts.map((s) => {
            const isSel = val && val.toString() === s.id.toString();
            return `<option value="${s.id}" ${isSel ? "selected" : ""}>
                                        [${escapeHtml(s.statement_kind.toUpperCase())}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})
                                    </option>`;
          }).join("")}
                        `;
        }
      }).catch((err) => {
        console.error("[renderRecordForm] Error fetching parent statements:", err);
      });
      inputElement = select;
    } else if (colName === "lean_decl_id") {
      const select = document.createElement("select");
      select.id = `field-${colName}`;
      select.name = colName;
      select.className = "form-select";
      select.innerHTML = `<option value="">-- None (Unlinked from Lean Kernel) --</option>`;
      queryDatabase("SELECT id, name, kind, signature, line_no FROM lean_declarations ORDER BY name ASC;").then((decls) => {
        if (decls && decls.length > 0) {
          select.innerHTML = `
                            <option value="">-- None (Unlinked from Lean Kernel) --</option>
                            ${decls.map((d) => {
            const isSel = val && val.toString() === d.id.toString();
            const sigPreview = d.signature ? d.signature.slice(0, 70) : "";
            return `<option value="${d.id}" ${isSel ? "selected" : ""}>
                                        [${escapeHtml(d.kind)}] ${escapeHtml(d.name)} : ${escapeHtml(sigPreview)} (line ${d.line_no})
                                    </option>`;
          }).join("")}
                        `;
        }
      }).catch((err) => {
        console.error("[renderRecordForm] Error fetching lean declarations:", err);
      });
      inputElement = select;
    } else if (colMeta.rows && colMeta.rows > 1) {
      const textarea = document.createElement("textarea");
      textarea.id = `field-${colName}`;
      textarea.name = colName;
      textarea.rows = colMeta.rows || 4;
      textarea.className = "form-textarea";
      textarea.value = val !== null && val !== void 0 ? typeof val === "object" ? JSON.stringify(val, null, 2) : val.toString() : "";
      inputElement = textarea;
      if (tableName === "interactive_demos" && colName === "init_packet") {
        const details = document.createElement("details");
        details.style.cssText = "margin-top: 4px; font-size: 12px; color: #64748b;";
        details.innerHTML = `<summary style="cursor: pointer; font-weight: 600; margin-bottom: 6px;">View / Direct Edit Raw JSON Packet</summary>`;
        details.appendChild(textarea);
        inputElement = details;
      }
      if (tableName === "segments" && colName === "content_html") {
        const paletteBar = document.createElement("div");
        paletteBar.style.cssText = "display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);";
        paletteBar.innerHTML = `
                    <span style="font-size: 11.5px; font-weight: 700; color: #475569; align-self: center; margin-right: 4px;">CUSTOM ELEMENTS:</span>
                    <button type="button" class="btn btn-sm btn-insert-fs" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        \u2795 Formal Statement Citation
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-stencil" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        \u2795 Stencil Calculation Mode
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-ttd" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid #fca5a5; color: #b91c1c; font-weight: 600; border-radius: 4px; cursor: pointer;">
                        \u2696\uFE0F Truth Table (TTD)
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-demo" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        \u2795 Interactive Visual Demo
                    </button>
                    <button type="button" class="btn btn-sm btn-review-elements" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid #cbd5e1; color: #475569; border-radius: 4px; cursor: pointer; margin-left: auto;">
                        \u{1F50D} Review / Remove Tags
                    </button>
                `;
        const insertAtCursor = (txt) => {
          const start = textarea.selectionStart || 0;
          const end = textarea.selectionEnd || 0;
          const current = textarea.value;
          textarea.value = current.substring(0, start) + txt + current.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + txt.length;
          textarea.focus();
        };
        paletteBar.querySelector(".btn-insert-fs")?.addEventListener("click", async () => {
          const stmts = await queryDatabase("SELECT id, statement_key, title, statement_kind FROM formal_statements ORDER BY id ASC;");
          showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Formal Statement Citation</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose a formal statement or directed equality to cite:</p>
                        <select id="modal-select-fs" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(stmts || []).map((s) => `<option value="${escapeHtml(s.statement_key)}">[${escapeHtml(s.statement_kind)}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})</option>`).join("")}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-fs">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
          document.getElementById("btn-modal-confirm-insert-fs")?.addEventListener("click", () => {
            const sel = document.getElementById("modal-select-fs");
            if (sel && sel.value) {
              insertAtCursor(`
<fs-ref statement-key="${sel.value}"></fs-ref>
`);
            }
            closeModal();
          });
        });
        paletteBar.querySelector(".btn-insert-stencil")?.addEventListener("click", async () => {
          const stencils = await queryDatabase("SELECT id, equation_key, title, label FROM directed_equations ORDER BY id ASC;");
          showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Stencil Calculation Mode</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose a computational stencil to embed:</p>
                        <select id="modal-select-stencil" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(stencils || []).map((st) => `<option value="${escapeHtml(st.equation_key)}">${escapeHtml(st.title)} (${escapeHtml(st.label)}) [${escapeHtml(st.equation_key)}]</option>`).join("")}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-stencil">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
          document.getElementById("btn-modal-confirm-insert-stencil")?.addEventListener("click", () => {
            const sel = document.getElementById("modal-select-stencil");
            if (sel && sel.value) {
              insertAtCursor(`
<interactive-stencil equation-key="${sel.value}"></interactive-stencil>
`);
            }
            closeModal();
          });
        });
        paletteBar.querySelector(".btn-insert-ttd")?.addEventListener("click", async () => {
          const ttdDemos = await queryDatabase(
            "SELECT id, title, engine, mode, expression, status, init_packet FROM interactive_demos WHERE engine = 'ttd' ORDER BY id ASC;"
          );
          showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px; color: #991b1b;">\u2696\uFE0F Insert Truth Table Custom Element (&lt;ttd-ref&gt;)</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose an authoritative proposition from the database to embed as a canonical reference:</p>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px;">Registered Propositional Expressions (${ttdDemos?.length || 0}):</label>
                            <select id="modal-select-ttd-id" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;">
                                ${(ttdDemos || []).map((d) => {
            const friendly = getRecordFriendlyName("interactive_demos", d);
            return `<option value="${d.id}">[#${d.id}] ${escapeHtml(friendly)}</option>`;
          }).join("")}
                            </select>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-ttd">Insert &lt;ttd-ref id="..."&gt;</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
          document.getElementById("btn-modal-confirm-insert-ttd")?.addEventListener("click", () => {
            const sel = document.getElementById("modal-select-ttd-id");
            if (sel && sel.value) {
              insertAtCursor(`
<ttd-ref id="${sel.value}"></ttd-ref>
`);
            }
            closeModal();
          });
        });
        paletteBar.querySelector(".btn-insert-demo")?.addEventListener("click", async () => {
          const demos = await queryDatabase("SELECT id, title, engine FROM interactive_demos ORDER BY id ASC;");
          showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Interactive Demo (&lt;visual-demo&gt;)</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose an interactive demonstration to embed:</p>
                        <select id="modal-select-demo" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(demos || []).map((d) => `<option value="${d.id}">[${escapeHtml(d.engine.toUpperCase())}] ${escapeHtml(d.title)} (#${d.id})</option>`).join("")}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-demo">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
          document.getElementById("btn-modal-confirm-insert-demo")?.addEventListener("click", () => {
            const sel = document.getElementById("modal-select-demo");
            if (sel && sel.value) {
              insertAtCursor(`
<visual-demo id="${sel.value}"></visual-demo>
`);
            }
            closeModal();
          });
        });
        paletteBar.querySelector(".btn-review-elements")?.addEventListener("click", () => {
          const text = textarea.value;
          const tagRegex = /(<ttd-ref[\s\S]*?<\/ttd-ref>|<ttd-ref[^>]*>(?:<\/ttd-ref>)?|<fs-ref[^>]*>(?:<\/fs-ref>)?|<interactive-stencil[^>]*>(?:<\/interactive-stencil>)?|<stencil-ref[^>]*>(?:<\/stencil-ref>)?|<visual-demo[^>]*>(?:<\/visual-demo>)?|<demo-embed[^>]*>(?:<\/demo-embed>)?|<pseudo-ref[^>]*>(?:<\/pseudo-ref>)?)/gi;
          const matches = [];
          let m;
          while ((m = tagRegex.exec(text)) !== null) {
            matches.push(m[0]);
          }
          if (matches.length === 0) {
            showModal(`
                            <h3 style="margin-bottom: 8px; font-size: 15px;">Review Embedded Custom Elements</h3>
                            <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">No custom element tags (&lt;ttd-ref&gt;, &lt;fs-ref&gt;, &lt;interactive-stencil&gt;, &lt;visual-demo&gt;) found in this segment's content.</p>
                            <div style="display: flex; justify-content: flex-end;">
                                <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Close</button>
                            </div>
                        `);
            return;
          }
          const renderList = () => {
            showModal(`
                            <h3 style="margin-bottom: 8px; font-size: 15px;">Review &amp; Remove Custom Elements (${matches.length})</h3>
                            <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Active custom elements in this segment. Click "Remove" to delete an instance:</p>
                            <div style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; margin-bottom: 16px;">
                                ${matches.map((tag, idx) => `
                                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; margin-bottom: 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
                                        <code style="font-size: 11.5px; color: #0f172a; word-break: break-all; flex: 1;">${escapeHtml(tag)}</code>
                                        <button type="button" class="action-btn danger btn-remove-custom-tag" data-index="${idx}" style="padding: 3px 10px; font-size: 11px; white-space: nowrap;">
                                            \u{1F5D1}\uFE0F Remove
                                        </button>
                                    </div>
                                `).join("")}
                            </div>
                            <div style="display: flex; justify-content: flex-end;">
                                <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Done</button>
                            </div>
                        `);
            document.querySelectorAll(".btn-remove-custom-tag").forEach((btn) => {
              btn.addEventListener("click", (e) => {
                const idx = parseInt(e.target.getAttribute("data-index") || "0", 10);
                const tagToRemove = matches[idx];
                if (tagToRemove) {
                  textarea.value = textarea.value.replace(tagToRemove, "");
                  matches.splice(idx, 1);
                  if (matches.length > 0) {
                    renderList();
                  } else {
                    closeModal();
                  }
                }
              });
            });
          };
          renderList();
        });
        fieldGroup.appendChild(paletteBar);
      }
    } else if (tableName === "interactive_demos" && colName === "expression") {
      const expWrapper = document.createElement("div");
      expWrapper.style.cssText = "display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 4px;";
      const expVal = val !== null && val !== void 0 ? val.toString() : "";
      const isFsd = record && record.engine === "fsd" || currentTypeKey === "fsd";
      let initObj = null;
      try {
        initObj = typeof record?.init_packet === "object" ? record.init_packet : JSON.parse(record?.init_packet || "{}");
      } catch (e) {
      }
      let initialDisplay = "\u2014";
      if (isFsd) {
        const quantifiers = initObj?.quantifiers || "\u2200x\u2081:\u2115 \u2203x\u2082:\u2115";
        const slots = initObj?.slots ? `(${initObj.slots})` : "";
        const predSym = PxeEngine.charDisplayMap[expVal] || expVal || "GT";
        initialDisplay = `${quantifiers} [ ${predSym}${slots} ]`;
      } else {
        initialDisplay = expVal ? PxeEngine.fmt(expVal) : "\u2014";
      }
      expWrapper.innerHTML = `
                <input type="text" id="field-${colName}" name="${colName}" value="${escapeHtml(expVal)}" readonly
                    style="width: 220px; padding: 7px 10px; font-family: var(--font-mono); font-size: 13px; font-weight: 700; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;"
                    title="Click to open ${isFsd ? "FSD Quantified Statement" : "Propositional Expression"} Editor" />
                <div id="preview-field-${colName}" style="font-size: 18px; font-weight: 700; color: ${isFsd ? "#1e3a8a" : "firebrick"}; font-family: 'Cambria Math', Georgia, serif; min-width: 140px; cursor: pointer;" title="Live mathematical display">
                    ${escapeHtml(initialDisplay)}
                </div>
                <button type="button" id="btn-open-pxe-editor" class="action-btn secondary" style="padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">
                    ${isFsd ? "\u{1F4D0} Edit FSD Statement" : "\u270E Edit Proposition"}
                </button>
            `;
      const openEditor = async () => {
        const expInput = expWrapper.querySelector(`#field-${colName}`);
        let curExp = expInput ? expInput.value : expVal;
        if (isFsd) {
          let constructedStmts = [];
          try {
            constructedStmts = await queryDatabase(
              "SELECT id, statement_key, title, statement_kind, expression, description FROM formal_statements ORDER BY statement_kind ASC, id ASC;"
            ) || [];
          } catch (e) {
            console.error("[openEditor] Error loading constructed formal statements:", e);
          }
          let predEquations = [];
          try {
            predEquations = await queryDatabase(
              "SELECT id, equation_key, title, formula_expr, target_symbol FROM directed_equations WHERE target_domain IN ('B_w', '\u{1D539}', 'B') ORDER BY id ASC;"
            ) || [];
          } catch (e) {
            console.error("[openEditor] Error loading predicate DEs:", e);
          }
          const codeToEqMap = {
            "j": "eq_pred_assign",
            "r": "eq_pred_gt",
            "s": "eq_pred_lt",
            "k": "eq_pred_eq",
            "l": "eq_pred_le",
            "m": "eq_pred_mem",
            "b": "eq_pred_subset",
            "v": "eq_pred_even",
            "d": "eq_pred_odd",
            "u": "eq_pred_succ",
            "w": "eq_pred_near",
            "c": "eq_pred_div"
          };
          const eqToCodeMap = {};
          Object.entries(codeToEqMap).forEach(([k, v]) => {
            eqToCodeMap[v] = k;
          });
          let currentCode = curExp || "r";
          let currentQuantifiers = initObj?.quantifiers || "\u2200x\u2081:\u2115 \u2203x\u2082:\u2115";
          let currentSlots = initObj?.slots || "x\u2081,x\u2082";
          let currentStage = initObj?.stage || "4";
          const updateLivePreview = () => {
            const previewTarget = document.getElementById("modal-fsd-live-preview");
            if (!previewTarget) return;
            const quant = document.getElementById("modal-fsd-quantifiers")?.value || "";
            const sl = document.getElementById("modal-fsd-slots")?.value || "";
            const predSel = document.getElementById("modal-fsd-pred-select");
            const selectedCode = predSel?.value || currentCode;
            const symbol = PxeEngine.charDisplayMap[selectedCode] || selectedCode;
            const slotsPart = sl ? `(${sl})` : "";
            previewTarget.textContent = `${quant} [ ${symbol}${slotsPart} ]`;
          };
          showModal(`
                        <h3 style="margin-bottom: 6px; font-size: 16px; color: #0f172a;">\u{1F4D0} Formal Statement Demo (FSD) Quantified Statement Builder</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 14px;">
                            In Middle Way Math, a predicate <strong>is</strong> a Directed Equality with codomain \u{1D539}. Select an existing constructed formal statement from Tier 1, or configure the predicate DE and quantifier bindings manually:
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;">
                            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px; padding: 10px 14px;">
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 4px;">
                                    \u{1F3DB}\uFE0F Initialize from Constructed Formal Statement (Tier 1):
                                </label>
                                <select id="modal-fsd-constructed-fs-select" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid #86efac; border-radius: 4px; background: #ffffff; color: #14532d; font-weight: 600;">
                                    <option value="">-- Choose a constructed FS / DE to initialize FSD (${constructedStmts.length} available) --</option>
                                    ${constructedStmts.map((s) => `
                                        <option value="${s.id}" data-key="${escapeHtml(s.statement_key)}" data-kind="${escapeHtml(s.statement_kind)}" data-title="${escapeHtml(s.title)}" data-expr="${escapeHtml(s.expression || "")}" data-desc="${escapeHtml(s.description || "")}">
                                            [${escapeHtml(s.statement_kind.toUpperCase())}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                    1. Governing Predicate (Directed Equality with Codomain \u{1D539}):
                                </label>
                                <select id="modal-fsd-pred-select" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; font-weight: 600; background: #ffffff; color: #0f172a;">
                                    ${predEquations.map((pe) => {
            const code = eqToCodeMap[pe.equation_key] || pe.equation_key.replace("eq_pred_", "").toLowerCase();
            const isSel = code === currentCode || pe.equation_key === currentCode;
            const sym = PxeEngine.charDisplayMap[code] || pe.target_symbol || code;
            return `<option value="${escapeHtml(code)}" ${isSel ? "selected" : ""}>
                                            ${escapeHtml(sym)} \u2014 ${escapeHtml(pe.title)} [${escapeHtml(pe.equation_key)}]
                                        </option>`;
          }).join("")}
                                </select>
                            </div>
                            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 240px;">
                                    <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                        2. Quantifier Bindings:
                                    </label>
                                    <input type="text" id="modal-fsd-quantifiers" value="${escapeHtml(currentQuantifiers)}" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;" />
                                    <div style="display: flex; gap: 5px; margin-top: 6px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="\u2200x\u2081:\u2115" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">\u2200x\u2081:\u2115</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="\u2203x\u2081:\u2115" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">\u2203x\u2081:\u2115</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="\u2200x\u2081:\u2115 \u2203x\u2082:\u2115" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">\u2200x\u2081:\u2115 \u2203x\u2082:\u2115</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="\u2203x\u2081:\u2115 \u2200y\u2081:\u{1D4AB}(\u2115)" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">\u2203x\u2081:\u2115 \u2200y\u2081:\u{1D4AB}(\u2115)</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="\u2200x\u2081:[\u2115|GT(11)]" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">\u2200x\u2081:[\u2115|GT(11)]</button>
                                    </div>
                                </div>
                                <div style="width: 200px;">
                                    <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                        3. Bound Slots:
                                    </label>
                                    <input type="text" id="modal-fsd-slots" value="${escapeHtml(currentSlots)}" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;" />
                                    <div style="display: flex; gap: 5px; margin-top: 6px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x\u2081,x\u2082" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x\u2081,x\u2082</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x\u2081" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x\u2081</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x\u2081,y\u2081" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x\u2081,y\u2081</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="A,B" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">A,B</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                    4. Default Visualizer Stage:
                                </label>
                                <select id="modal-fsd-stage" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff;">
                                    <option value="4" ${currentStage === "4" ? "selected" : ""}>Stage 4: 2D Matrix Visualizer (Truth &amp; Incidence Grid)</option>
                                    <option value="3" ${currentStage === "3" ? "selected" : ""}>Stage 3: Quantifier Prefix Evaluation</option>
                                    <option value="2" ${currentStage === "2" ? "selected" : ""}>Stage 2: Slot &amp; Variable Domain Binding</option>
                                    <option value="1" ${currentStage === "1" ? "selected" : ""}>Stage 1: Raw Predicate Assembly</option>
                                </select>
                            </div>
                            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-top: 4px;">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                                    Mathematical Quantified Statement Preview
                                </div>
                                <div id="modal-fsd-live-preview" style="font-size: 20px; font-weight: 700; color: #1e3a8a; font-family: 'Cambria Math', Georgia, serif;">
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-apply-fsd">Apply Statement</button>
                            <button type="button" class="action-btn secondary" id="btn-modal-cancel-fsd">Cancel</button>
                        </div>
                    `);
          updateLivePreview();
          document.getElementById("modal-fsd-constructed-fs-select")?.addEventListener("change", () => {
            const sel = document.getElementById("modal-fsd-constructed-fs-select");
            if (!sel || !sel.value) return;
            const opt = sel.selectedOptions[0];
            const key = opt?.getAttribute("data-key") || "";
            const title = opt?.getAttribute("data-title") || "";
            const expr = opt?.getAttribute("data-expr") || "";
            const matchedCode = Object.keys(codeToEqMap).find((c) => {
              const eqKey = codeToEqMap[c];
              return eqKey === key || key.replace("fs_pred_", "eq_pred_") === eqKey || key.includes(c);
            });
            if (matchedCode) {
              const predSel = document.getElementById("modal-fsd-pred-select");
              if (predSel) predSel.value = matchedCode;
            }
            const quantMatch = expr.match(/([∀∃][^\[:=]+)/);
            if (quantMatch) {
              const qInput = document.getElementById("modal-fsd-quantifiers");
              if (qInput) qInput.value = quantMatch[1].trim();
            }
            const titleInput = document.getElementById("field-title");
            if (titleInput && (!titleInput.value || titleInput.value.startsWith("Formal Structure") || titleInput.value.startsWith("[FSD]"))) {
              titleInput.value = `[FSD] ${title}`;
            }
            updateLivePreview();
          });
          document.getElementById("modal-fsd-pred-select")?.addEventListener("change", updateLivePreview);
          document.getElementById("modal-fsd-quantifiers")?.addEventListener("input", updateLivePreview);
          document.getElementById("modal-fsd-slots")?.addEventListener("input", updateLivePreview);
          document.querySelectorAll(".btn-quick-quant").forEach((b) => {
            b.addEventListener("click", () => {
              const qInput = document.getElementById("modal-fsd-quantifiers");
              if (qInput) {
                qInput.value = b.getAttribute("data-val") || "";
                updateLivePreview();
              }
            });
          });
          document.querySelectorAll(".btn-quick-slot").forEach((b) => {
            b.addEventListener("click", () => {
              const sInput = document.getElementById("modal-fsd-slots");
              if (sInput) {
                sInput.value = b.getAttribute("data-val") || "";
                updateLivePreview();
              }
            });
          });
          document.getElementById("btn-modal-apply-fsd")?.addEventListener("click", () => {
            const predSel = document.getElementById("modal-fsd-pred-select");
            const qInput = document.getElementById("modal-fsd-quantifiers");
            const sInput = document.getElementById("modal-fsd-slots");
            const stSel = document.getElementById("modal-fsd-stage");
            const chosenCode = predSel ? predSel.value : currentCode;
            const finalQuant = qInput ? qInput.value.trim() : "";
            const finalSlots = sInput ? sInput.value.trim() : "";
            const finalStage = stSel ? stSel.value : "4";
            if (expInput) expInput.value = chosenCode;
            const previewEl = expWrapper.querySelector(`#preview-field-${colName}`);
            const sym = PxeEngine.charDisplayMap[chosenCode] || chosenCode;
            const slotsPart = finalSlots ? `(${finalSlots})` : "";
            const fullFormula = finalQuant ? `${finalQuant} [ ${sym}${slotsPart} ]` : `${sym}${slotsPart}`;
            if (previewEl) previewEl.textContent = fullFormula;
            const newPacket = {
              exp: chosenCode,
              quantifiers: finalQuant,
              slots: finalSlots,
              stage: finalStage,
              stages: [0, 1, 2, 3]
            };
            const initTextarea = document.getElementById("field-init_packet");
            if (initTextarea) {
              initTextarea.value = JSON.stringify(newPacket, null, 2);
            }
            closeModal();
          });
          document.getElementById("btn-modal-cancel-fsd")?.addEventListener("click", () => {
            closeModal();
          });
        } else {
          showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 16px; color: #0f172a;">\u2696\uFE0F Propositional Expression (PXE) Editor</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Construct or modify the propositional expression using atomic variables and logical connectives:</p>
                        <div id="modal-pxe-builder-container"></div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
                            <button type="button" class="action-btn primary" id="btn-modal-apply-pxe">Apply Expression</button>
                            <button type="button" class="action-btn secondary" id="btn-modal-cancel-pxe">Cancel</button>
                        </div>
                    `);
          const modalTarget = document.getElementById("modal-pxe-builder-container");
          let latestPacket = null;
          let latestExp = curExp;
          mountPxeBuilderComponent(modalTarget, curExp, (packet, rawExp) => {
            latestPacket = packet;
            latestExp = rawExp;
          });
          document.getElementById("btn-modal-apply-pxe")?.addEventListener("click", () => {
            if (expInput) expInput.value = latestExp;
            const previewEl = expWrapper.querySelector(`#preview-field-${colName}`);
            if (previewEl) previewEl.textContent = latestExp ? PxeEngine.fmt(latestExp) : "\u2014";
            const statusSelect = document.getElementById("field-status");
            if (statusSelect && latestPacket?.status) {
              statusSelect.value = latestPacket.status;
            }
            const initTextarea = document.getElementById("field-init_packet");
            if (initTextarea && latestPacket) {
              initTextarea.value = JSON.stringify(latestPacket, null, 2);
            }
            closeModal();
          });
          document.getElementById("btn-modal-cancel-pxe")?.addEventListener("click", () => {
            closeModal();
          });
        }
      };
      expWrapper.querySelector("#btn-open-pxe-editor")?.addEventListener("click", openEditor);
      expWrapper.querySelector(`#field-${colName}`)?.addEventListener("click", openEditor);
      expWrapper.querySelector(`#preview-field-${colName}`)?.addEventListener("click", openEditor);
      inputElement = expWrapper;
    } else {
      const input = document.createElement("input");
      input.type = colMeta.dbDataType.includes("int") ? "number" : "text";
      input.id = `field-${colName}`;
      input.name = colName;
      input.className = "form-input";
      input.value = val !== null && val !== void 0 ? val.toString() : "";
      inputElement = input;
    }
    if (tableName !== "interactive_demos" && (colName === "formula_expr" || colName === "expression")) {
      const symBar = document.createElement("div");
      symBar.style.cssText = "display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color);";
      const syms = ["\u2192", "\u21D2", "\u211D_\u03C9", "\u{1D53B}", "\u2124", "\u2115", "\u{1D539}", "\xB7", "\u2260", "\u2208", "\u2200", "\u2203", "\u03C9", "dx", "\u2264", "\u2265", "\u2248", "\u2261", "\xD7", "\u03BB"];
      symBar.innerHTML = `
                <span style="font-size: 11px; font-weight: 700; color: #64748b; align-self: center; margin-right: 4px;">SYMBOLS:</span>
                ${syms.map(
        (s) => `<button type="button" class="btn-insert-symbol" data-sym="${s}" style="padding: 2px 7px; font-size: 12px; border: 1px solid var(--border-color); background: #ffffff; border-radius: 4px; cursor: pointer; font-family: var(--font-mono);">
                                ${s}
                            </button>`
      ).join("")}
            `;
      symBar.querySelectorAll(".btn-insert-symbol").forEach((b) => {
        b.addEventListener("click", () => {
          const sym = b.getAttribute("data-sym");
          const targetInput = inputElement;
          const start = targetInput.selectionStart || 0;
          const end = targetInput.selectionEnd || 0;
          const cur = targetInput.value;
          targetInput.value = cur.substring(0, start) + sym + cur.substring(end);
          targetInput.selectionStart = targetInput.selectionEnd = start + sym.length;
          targetInput.focus();
        });
      });
      fieldGroup.appendChild(symBar);
    }
    fieldGroup.appendChild(inputElement);
    fieldsTarget.appendChild(fieldGroup);
  }
  document.getElementById("btn-cancel-edit")?.addEventListener("click", () => {
    setMode("read");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const submitValues = {};
    for (const colName of Object.keys(tableInfo.columns)) {
      const colMeta = tableInfo.columns[colName];
      if (colMeta.isPrimaryKey && isNew) continue;
      const raw = formData.get(colName);
      if (raw === null || raw === void 0 || raw === "") {
        submitValues[colName] = colMeta.isNullable ? null : "";
      } else if (colMeta.dbDataType === "boolean") {
        submitValues[colName] = raw === "true";
      } else if (colMeta.dbDataType.includes("int")) {
        submitValues[colName] = parseInt(raw.toString(), 10);
      } else if (colMeta.dbDataType.includes("numeric") || colMeta.dbDataType.includes("double")) {
        submitValues[colName] = parseFloat(raw.toString());
      } else {
        submitValues[colName] = raw.toString();
      }
    }
    try {
      if (isNew) {
        const cols = Object.keys(submitValues);
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        const params = cols.map((c) => submitValues[c]);
        const insertSql = `INSERT INTO ${tableName} ("${cols.join('", "')}") VALUES (${placeholders.join(", ")}) RETURNING id;`;
        const res = await executeSql(insertSql, params);
        if (res.status === "error") throw new Error(res.error || res.message);
        const newId = res.data?.rows[0]?.id;
        setStatus(`\u2713 Record created successfully (#${newId})`);
        currentSelectedId = newId ? newId.toString() : null;
        setMode("read");
      } else {
        const cols = Object.keys(submitValues).filter((c) => c !== "id");
        const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`);
        const params = cols.map((c) => submitValues[c]);
        params.push(record.id);
        const updateSql = `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING id;`;
        const res = await executeSql(updateSql, params);
        if (res.status === "error") throw new Error(res.error || res.message);
        setStatus(`\u2713 Record #${record.id} updated successfully`);
        setMode("read");
      }
    } catch (saveErr) {
      console.error("Save error:", saveErr);
      showModal(`
                <h3 style="color: #dc2626; margin-bottom: 8px;">\u26A0\uFE0F Database Operation Failed</h3>
                <p style="color: #4a5568; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                    ${saveErr.message}
                </p>
                <button class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">
                    Close
                </button>
            `);
    }
  });
}
async function renderDeleteConfirmation(tableName, record) {
  if (!displayArea) return;
  const displayCol = getDisplayColumnName(tableName);
  const titleVal = record[displayCol] || `ID: ${record.id}`;
  displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 8px; padding: 30px; max-width: 600px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="font-size: 36px; margin-bottom: 12px;">\u26A0\uFE0F</div>
                <h2 style="font-size: 18px; color: #991b1b; margin-bottom: 8px;">Confirm Record Deletion</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Are you sure you want to permanently delete record <strong>${escapeHtml(titleVal)}</strong> (id = ${record.id}) from table <code>${tableName}</code>?
                </p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button class="action-btn danger" id="btn-confirm-delete" style="padding: 8px 18px;">
                        \u{1F5D1}\uFE0F Confirm & Delete
                    </button>
                    <button class="action-btn secondary" id="btn-cancel-delete" style="padding: 8px 18px;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
  document.getElementById("btn-cancel-delete")?.addEventListener("click", () => {
    setMode("read");
  });
  document.getElementById("btn-confirm-delete")?.addEventListener("click", async () => {
    try {
      const sql = `DELETE FROM ${tableName} WHERE id = $1;`;
      const res = await executeSql(sql, [record.id]);
      if (res.status === "error") throw new Error(res.error || res.message);
      setStatus(`\u2713 Record #${record.id} permanently deleted.`);
      currentSelectedId = null;
      setMode("read");
    } catch (delErr) {
      showModal(`
                <h3 style="color: #dc2626; margin-bottom: 8px;">\u26A0\uFE0F Deletion Failed</h3>
                <p style="color: #4a5568; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                    Could not delete record: ${delErr.message}
                </p>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                    Foreign key constraints or dependent child records may prevent this deletion.
                </div>
                <button class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">
                    Close
                </button>
            `);
    }
  });
}
async function fetchRecordById(tableName, id) {
  try {
    const sql = `SELECT * FROM ${tableName} WHERE id = $1;`;
    const rows = await queryDatabase(sql, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(`[fetchRecordById] Error in ${tableName} #${id}:`, err);
    return null;
  }
}
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// crud/src/main.ts
async function bootstrap() {
  const healthBadge = document.getElementById("db-health-badge");
  const statusMessage2 = document.getElementById("status-message");
  const displayPanel = document.getElementById("display-panel");
  try {
    if (statusMessage2) statusMessage2.textContent = "Checking database connection...";
    try {
      const health = await getDatabaseHealth();
      if (health.status === "connected") {
        if (healthBadge) {
          healthBadge.textContent = "\u{1F7E2} DB Connected";
          healthBadge.style.background = "#ecfdf5";
          healthBadge.style.borderColor = "#a7f3d0";
          healthBadge.style.color = "#065f46";
        }
      } else {
        if (healthBadge) {
          healthBadge.textContent = "\u{1F7E1} DB Disconnected";
          healthBadge.style.background = "#fffbeb";
          healthBadge.style.borderColor = "#fde68a";
          healthBadge.style.color = "#92400e";
        }
      }
    } catch (healthErr) {
      console.warn("[main] Database health probe non-critical warning:", healthErr);
      if (healthBadge) {
        healthBadge.textContent = "\u{1F7E1} DB Probe Failed";
        healthBadge.style.background = "#fffbeb";
        healthBadge.style.borderColor = "#fde68a";
        healthBadge.style.color = "#92400e";
      }
    }
    if (statusMessage2) statusMessage2.textContent = "Validating schema & loading metadata...";
    const metadata = await validateAndBuildMetadata();
    initializeUI(metadata, navigations, dependents);
    console.log("[main] MWM Database CRUD Studio successfully initialized.");
  } catch (err) {
    console.error("[main] Fatal error initializing MWM Database CRUD Studio:", err);
    const errorMsg = err.message || String(err);
    if (healthBadge) {
      healthBadge.textContent = "\u{1F534} Schema Error";
      healthBadge.style.background = "#fef2f2";
      healthBadge.style.borderColor = "#fecaca";
      healthBadge.style.color = "#991b1b";
    }
    if (statusMessage2) {
      statusMessage2.textContent = "Initialization failed.";
      statusMessage2.style.color = "#dc2626";
    }
    if (displayPanel) {
      displayPanel.innerHTML = `
                <div style="padding: 24px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px;">
                    <h3 style="color: #c53030; margin-bottom: 8px;">\u26A0\uFE0F Schema Validation Failed</h3>
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
                        The CRUD studio could not initialize because of a schema mismatch or database connectivity issue:
                    </p>
                    <pre style="background: #2d3748; color: #fc8181; padding: 12px; border-radius: 6px; font-size: 13px; overflow-x: auto; white-space: pre-wrap;">${errorMsg}</pre>
                    <p style="margin-top: 14px; font-size: 13px; color: #718096;">
                        Please ensure PostgreSQL is running and migrations have been executed.
                    </p>
                </div>
            `;
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
//# sourceMappingURL=bundle.js.map
