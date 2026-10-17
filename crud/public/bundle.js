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
      { column: "tier", label: "Axiomatic Tier", canModify: true, len: 20 },
      { column: "type", label: "Subject Type", canModify: true, len: 18 },
      { column: "statement_kind", label: "Statement Kind", canModify: true, len: 20 },
      { column: "domain_category", label: "Domain Category", canModify: true, len: 24 },
      { column: "governing_seed", label: "Governing Seed", canModify: true, len: 20 },
      { column: "expression", label: "Mathematical Expression", canModify: true, len: 60, rows: 2 },
      { column: "description", label: "Conceptual Summary", canModify: true, len: 60, rows: 3, useHints: true },
      { column: "lean_signature", label: "Lean 4 Signature", canModify: true, len: 60, rows: 2 },
      { column: "lean_snippet", label: "Lean Code Snippet", canModify: true, len: 60, rows: 4 },
      { column: "status", label: "Editorial Status", canModify: true, len: 16 }
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
  {
    table: "verified_presets",
    label: "Verified Presets (Test Vectors)",
    singularLabel: "Verified Preset",
    columns: [
      { column: "preset_key", label: "Preset Key", canModify: true, len: 32 },
      { column: "equation_id", label: "Parent Equation", canModify: false, len: 24 },
      { column: "title", label: "Preset Scenario Title", canModify: true, len: 36 },
      { column: "domain_badge", label: "Domain Badge", canModify: true, len: 16 },
      { column: "display_result", label: "Expected Display Result", canModify: true, len: 24 },
      { column: "input_values", label: "JSON Input Vector Map", canModify: true, len: 50, rows: 3 },
      { column: "is_canonical", label: "Is Canonical Baseline", canModify: true, len: 10 }
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
      { column: "demo_key", label: "Demo Key", canModify: true, len: 32 },
      { column: "title", label: "Demo Title", canModify: true, len: 45 },
      { column: "sandbox_type", label: "Sandbox Type (btd/bid/ttd)", canModify: true, len: 16 },
      { column: "canvas_mode", label: "Canvas Mode", canModify: true, len: 16 },
      { column: "init_packet", label: "Initialization JSON Packet", canModify: true, len: 55, rows: 4 },
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
      { column: "ref_type", label: "Reference Tag Type (fs/eq/pseudo)", canModify: true, len: 18 },
      { column: "target_key", label: "Target Referenced Key", canModify: true, len: 32 },
      { column: "statement_id", label: "Linked Formal Statement", canModify: true, len: 24 },
      { column: "equation_id", label: "Linked Stencil Equation", canModify: true, len: 24 },
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
  }
];
var dependents = [
  { table: "directed_equations", parent: "formal_statements", displayColumns: ["equation_key", "title"] },
  { table: "lean_verifications", parent: "formal_statements", displayColumns: ["theorem_name", "proof_status"] },
  { table: "mode_slots", parent: "directed_equations", displayColumns: ["slot_index", "symbol", "label"] },
  { table: "verified_presets", parent: "directed_equations", displayColumns: ["preset_key", "title"] },
  { table: "curriculum_nav_items", parent: "apps", displayColumns: ["sequence_order", "topic"] },
  { table: "segment_references", parent: "segments", displayColumns: ["ref_type", "target_key"] },
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
      { table: "mode_slots" },
      { table: "verified_presets" }
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
      const isEnum = enumMap.hasOwnProperty(dbCol.udt_name);
      const enumValues = isEnum ? enumMap[dbCol.udt_name] : [];
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

// crud/src/ui.ts
var currentWorkUnit = null;
var appMetadata = {};
var navigations2 = [];
var dependents2 = [];
var onReturn = null;
var navPanel = document.getElementById("navigation-panel");
var displayPanel = document.getElementById("display-panel");
var mainModal = document.getElementById("main-modal");
var modalBody = document.getElementById("modal-body");
var statusMessage = document.getElementById("status-message");
async function executeDml(sql) {
  const res = await executeSql(sql);
  if (res.status === "error") {
    throw new Error(res.error || res.message);
  }
  return res.data?.rowCount || 0;
}
function isKnownRecord(obj) {
  return obj && typeof obj === "object" && (typeof obj.id === "number" || typeof obj.id === "string");
}
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
  if (cols.includes("demo_key")) return "demo_key";
  if (cols.includes("seg_key")) return "seg_key";
  if (cols.includes("label")) return "label";
  if (cols.includes("symbol")) return "symbol";
  if (cols.includes("preset_key")) return "preset_key";
  if (cols.includes("target_key")) return "target_key";
  if (cols.includes("app_code")) return "app_code";
  return cols[0] || "id";
}
function initializeUI(metadata, navs, deps) {
  appMetadata = metadata;
  navigations2 = navs;
  dependents2 = deps;
  initializeNavigation();
  initializeEventListeners();
  if (statusMessage) {
    statusMessage.textContent = `Ready \u2022 ${Object.keys(appMetadata).length} tables loaded`;
  }
}
function initializeNavigation() {
  navPanel.innerHTML = "<h3>Navigation</h3>";
  navigations2.forEach((navPath) => {
    const button = document.createElement("button");
    const buttonText = navPath.label || navPath.table && appMetadata[navPath.table]?.label || "Entity";
    const navId = navPath.label || navPath.table;
    button.dataset.navId = navId;
    button.textContent = buttonText;
    if (navPath.table) {
      button.dataset.tableName = navPath.table;
    }
    button.classList.add("nav-group-btn");
    navPanel.appendChild(button);
  });
  displayPanel.innerHTML = `
        <h3>Welcome to MWM Database CRUD Studio</h3>
        <p style="color: #64748b; margin-top: 8px;">Select an entity from the navigation menu on the left to inspect, create, or modify records with full relational integrity.</p>
    `;
  onReturn = null;
}
function initializeEventListeners() {
  navPanel.addEventListener("click", handleNavClick);
  displayPanel.addEventListener("click", handleDisplayPanelClick);
  const closeBtn = mainModal.querySelector(".modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
  displayPanel.addEventListener("focusin", (event) => {
    if (event.target && event.target.classList.contains("has-hints")) {
      showHintsFor(event.target);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".hint-container")) {
      hideAllHintDropdowns();
    }
  });
}
async function handleNavClick(event) {
  const target = event.target;
  if (target.matches(".back-nav-btn")) {
    initializeNavigation();
    return;
  }
  const navId = target.dataset.navId || target.dataset.tableName;
  if (!navId) return;
  const findPath = (paths, id) => {
    for (const path of paths) {
      if (path.label === id || path.table === id) return path;
      if (path.children) {
        const found = findPath(path.children, id);
        if (found) return found;
      }
    }
    return void 0;
  };
  const clickedPath = findPath(navigations2, navId);
  if (!clickedPath) return;
  if (target.matches(".nav-group-btn")) {
    let subNavPaths;
    if (clickedPath.table) {
      subNavPaths = [clickedPath];
    } else {
      subNavPaths = clickedPath.children || [];
    }
    renderSubNavigation(subNavPaths);
    const title = clickedPath.label || clickedPath.table && appMetadata[clickedPath.table]?.label || "Entity";
    displayPanel.innerHTML = `<h3>${title}</h3><p style="color: #64748b; margin-top: 8px;">Please select an entity from the sub-navigation list on the left.</p>`;
  } else if (target.matches(".sub-nav-btn")) {
    if (clickedPath.table) {
      await renderTableList(clickedPath.table);
    }
  }
}
function renderSubNavigation(paths) {
  navPanel.innerHTML = "";
  const backButton = document.createElement("button");
  backButton.textContent = "\u2039 Back to Main Menu";
  backButton.className = "back-nav-btn";
  navPanel.appendChild(backButton);
  renderNavLevel(paths, navPanel, 0);
}
function renderNavLevel(paths, container, level) {
  paths.forEach((path) => {
    const button = document.createElement("button");
    if (path.table) {
      const tableInfo = appMetadata[path.table];
      button.textContent = path.label || (tableInfo ? tableInfo.label : path.table);
      button.dataset.tableName = path.table;
      button.classList.add("sub-nav-btn");
      button.style.paddingLeft = `${12 + level * 12}px`;
    } else {
      button.textContent = path.label;
      button.classList.add("nav-folder-header");
      button.disabled = true;
    }
    container.appendChild(button);
    if (path.children && path.children.length > 0) {
      renderNavLevel(path.children, container, level + 1);
    }
  });
}
async function handleDisplayPanelClick(event) {
  const target = event.target;
  if (target.classList.contains("hint-item")) {
    const value = target.dataset.value;
    const input = target.closest(".hint-container")?.querySelector(".has-hints");
    if (value && input) {
      input.value = value;
      hideAllHintDropdowns();
    }
    return;
  }
  const listItem = target.closest(".record-list > li, .record-table > tbody > tr");
  if (listItem instanceof HTMLElement) {
    const { tableName, id } = listItem.dataset;
    if (tableName && id) {
      onReturn = () => renderTableList(tableName);
      await showRecordDetails(tableName, id);
    }
    return;
  }
  if (target.matches(".goto-link")) {
    const { tableName, id } = target.dataset;
    if (tableName && id) {
      onReturn = () => renderTableList(tableName);
      await showRecordDetails(tableName, id);
    }
    return;
  }
  if (target.matches(".add-new-btn")) {
    const { tableName } = target.dataset;
    if (tableName) {
      onReturn = () => renderTableList(tableName);
      currentWorkUnit = {
        mode: "create",
        initialState: { _children: {} },
        currentState: { _children: {} }
      };
      await renderEditableForm(tableName);
    }
    return;
  }
  if (target.matches(".dependents-container > button:not(.add-new-dependent-btn)")) {
    const { dependentTable, parentTable, parentId, isReadOnly } = target.dataset;
    if (dependentTable && parentTable && parentId) {
      onReturn = () => showRecordDetails(parentTable, parentId);
      const dependentInfo = dependents2.find((d) => d.table === dependentTable);
      await renderDependentList(parentTable, parentId, dependentInfo, isReadOnly === "true");
    }
    return;
  }
  if (target.matches(".grouping-choice-btn")) {
    const { tableName, groupBy } = target.dataset;
    if (tableName && groupBy) {
      await renderGroupedList(tableName, groupBy);
    }
    return;
  }
  if (target.matches(".flat-list-choice-btn")) {
    const { tableName } = target.dataset;
    if (tableName) {
      await renderTableList(tableName);
    }
    return;
  }
  if (target.matches(".modify-btn")) {
    const { tableName, record } = target.dataset;
    if (tableName && record) {
      const recordObject = JSON.parse(record);
      const transactionUnit = await fetchTransactionUnit(tableName, recordObject.id);
      currentWorkUnit = {
        mode: "modify",
        initialState: structuredClone(transactionUnit),
        currentState: transactionUnit
      };
      onReturn = () => showRecordDetails(tableName, recordObject.id.toString());
      await renderEditableForm(tableName, currentWorkUnit.currentState);
    }
    return;
  }
  if (target.matches(".delete-btn")) {
    const { tableName, recordId } = target.dataset;
    if (tableName && recordId) {
      handleDelete(tableName, recordId);
    }
    return;
  }
  if (target.matches(".add-new-dependent-btn")) {
    const { dependentTable, parentTable, parentId } = target.dataset;
    if (dependentTable && parentTable && parentId) {
      const fkColumn = Object.values(appMetadata[dependentTable].columns).find(
        (c) => c.isForeignKey && c.foreignKeyTable === parentTable
      );
      if (fkColumn) {
        onReturn = () => showRecordDetails(parentTable, parentId);
        const initialChildRecord = {};
        initialChildRecord[fkColumn.column] = parentId;
        await renderEditableForm(dependentTable, initialChildRecord);
      } else {
        showErrorModal(`Configuration Error: Could not find foreign key from '${dependentTable}' to '${parentTable}'.`);
      }
    }
    return;
  }
}
async function fetchTransactionUnit(tableName, recordId) {
  const parentSql = `SELECT * FROM ${tableName} WHERE id = ${recordId}`;
  const parentRecords = await queryDatabase(parentSql);
  const parentRecord = parentRecords[0];
  if (!parentRecord) {
    throw new Error(`Record ${recordId} not found in table ${tableName}`);
  }
  parentRecord._children = {};
  const dependentsForParent = dependents2.filter((d) => d.parent === tableName);
  for (const dependent of dependentsForParent) {
    const fkToParent = Object.values(appMetadata[dependent.table].columns).find(
      (c) => c.isForeignKey && c.foreignKeyTable === tableName
    );
    if (fkToParent) {
      const childSql = `SELECT id FROM ${dependent.table} WHERE "${fkToParent.column}" = ${recordId}`;
      const childIds = await queryDatabase(childSql);
      const childRecords = await Promise.all(
        childIds.map((child) => fetchTransactionUnit(dependent.table, child.id))
      );
      parentRecord._children[dependent.table] = childRecords;
    }
  }
  return parentRecord;
}
async function handleFormSubmit(tableName, recordId, originalRecord = null) {
  const form = displayPanel.querySelector("form");
  const formData = new FormData(form);
  const tableInfo = appMetadata[tableName];
  try {
    let sql = "";
    if (recordId && originalRecord) {
      const setClauses = [];
      formData.forEach((newValue, columnName) => {
        const columnMeta = tableInfo.columns[columnName];
        if (!columnMeta || !columnMeta.canModify) return;
        const originalValue = (originalRecord[columnName] ?? "").toString();
        if (newValue !== originalValue) {
          let formattedValue;
          if (newValue === "") {
            formattedValue = "NULL";
          } else {
            const type = columnMeta.dbDataType.toLowerCase();
            if (type.includes("char") || type.includes("text") || columnMeta.isEnum) {
              formattedValue = `'${newValue.replace(/'/g, "''")}'`;
            } else if (type === "json" || type === "jsonb") {
              formattedValue = `'${newValue.replace(/'/g, "''")}'::jsonb`;
            } else {
              formattedValue = newValue;
            }
          }
          setClauses.push(`"${columnName}" = ${formattedValue}`);
        }
      });
      if (setClauses.length === 0) {
        alert("No changes were made.");
        if (onReturn) await onReturn();
        return;
      }
      sql = `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE id = ${recordId}`;
      await executeDml(sql);
      if (statusMessage) statusMessage.textContent = `Record #${recordId} updated successfully.`;
      alert("\u2713 Record updated successfully!");
      if (onReturn) await onReturn();
    } else {
      const columns = [];
      const values = [];
      formData.forEach((value, key) => {
        const columnMeta = tableInfo.columns[key];
        if (!columnMeta || !columnMeta.canModify) return;
        columns.push(`"${key}"`);
        const type = columnMeta.dbDataType.toLowerCase();
        if (value === "") {
          if (type.includes("char") || type.includes("text")) {
            values.push("''");
          } else {
            values.push("NULL");
          }
        } else {
          if (type.includes("char") || type.includes("text") || columnMeta.isEnum) {
            values.push(`'${value.replace(/'/g, "''")}'`);
          } else if (type === "json" || type === "jsonb") {
            values.push(`'${value.replace(/'/g, "''")}'::jsonb`);
          } else {
            values.push(value);
          }
        }
      });
      if (columns.length === 0) {
        alert("Cannot submit an empty form.");
        return;
      }
      sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")}) RETURNING id`;
      const result = await queryDatabase(sql);
      if (!result || result.length === 0) {
        throw new Error("Database did not return the new ID.");
      }
      const newRecordId = result[0].id;
      if (statusMessage) statusMessage.textContent = `Record #${newRecordId} added successfully.`;
      alert("\u2713 Record created successfully!");
      onReturn = () => renderTableList(tableName);
      await showRecordDetails(tableName, newRecordId.toString());
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    showErrorModal(`Operation Failed: ${errorMessage}`);
  }
}
async function renderTableList(tableName) {
  const tableInfo = appMetadata[tableName];
  if (!tableInfo) return;
  displayPanel.innerHTML = `<h3>Loading ${tableInfo.label}...</h3>`;
  const displayCol = getDisplayColumnName(tableName);
  try {
    if (tableInfo.parentColumn) {
      const sql = `SELECT id, "${displayCol}" as name, "${tableInfo.parentColumn}" as "parentId" FROM ${tableName} ORDER BY "${displayCol}" ASC`;
      const records = await queryDatabase(sql);
      renderHierarchicalList(tableName, records);
    } else {
      const sql = `SELECT id, "${displayCol}" as name FROM ${tableName} ORDER BY "${displayCol}" ASC`;
      const records = await queryDatabase(sql);
      renderFlatList(tableName, records);
    }
  } catch (error) {
    displayPanel.innerHTML = `<p style="color:red">Error loading list: ${error.message}</p>`;
  }
}
function renderFlatList(tableName, records) {
  const tableInfo = appMetadata[tableName];
  displayPanel.innerHTML = "";
  const controlBar = document.createElement("div");
  controlBar.className = "control-bar";
  displayPanel.appendChild(controlBar);
  const addButton = document.createElement("button");
  const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, "");
  addButton.textContent = `+ Add New ${singular}`;
  addButton.className = "add-new-btn";
  addButton.dataset.tableName = tableName;
  controlBar.appendChild(addButton);
  const potentialParents = Object.values(tableInfo.columns).filter((c) => c.isForeignKey && !c.isNullable);
  if (potentialParents.length > 0) {
    const groupLabel = document.createElement("span");
    groupLabel.textContent = "Group by:";
    groupLabel.style.marginLeft = "20px";
    groupLabel.style.fontWeight = "bold";
    controlBar.appendChild(groupLabel);
    potentialParents.forEach((parentColumn) => {
      const parentTableInfo = appMetadata[parentColumn.foreignKeyTable];
      if (parentTableInfo) {
        const button = document.createElement("button");
        button.textContent = parentTableInfo.singularLabel || parentTableInfo.label;
        button.className = "grouping-choice-btn";
        button.dataset.tableName = tableName;
        button.dataset.groupBy = parentColumn.column;
        button.style.marginLeft = "6px";
        controlBar.appendChild(button);
      }
    });
  }
  const heading = document.createElement("h3");
  heading.textContent = `${tableInfo.label} (${records.length})`;
  displayPanel.appendChild(heading);
  if (records.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "24px";
    empty.style.color = "#64748b";
    empty.textContent = "No records found in this table.";
    displayPanel.appendChild(empty);
    return;
  }
  const list = document.createElement("ul");
  list.classList.add("record-list");
  records.forEach((record) => {
    const li = document.createElement("li");
    li.textContent = record.name || `(ID: ${record.id})`;
    li.dataset.id = record.id.toString();
    li.dataset.tableName = tableName;
    list.appendChild(li);
  });
  displayPanel.appendChild(list);
}
function renderHierarchicalList(tableName, records) {
  const tableInfo = appMetadata[tableName];
  displayPanel.innerHTML = "";
  const controlBar = document.createElement("div");
  controlBar.className = "control-bar";
  displayPanel.appendChild(controlBar);
  const addButton = document.createElement("button");
  const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, "");
  addButton.textContent = `+ Add New Root ${singular}`;
  addButton.className = "add-new-btn";
  addButton.dataset.tableName = tableName;
  controlBar.appendChild(addButton);
  const heading = document.createElement("h3");
  heading.textContent = `${tableInfo.label} Hierarchy (${records.length})`;
  displayPanel.appendChild(heading);
  const buildTree = (parentId) => {
    return records.filter((r) => r.parentId === parentId).map((r) => ({
      id: r.id,
      parentId: r.parentId,
      name: r.name || `(ID: ${r.id})`,
      children: buildTree(r.id)
    }));
  };
  const tree = buildTree(null);
  const renderBranch = (nodes, container) => {
    const ul = document.createElement("ul");
    ul.classList.add("record-list");
    nodes.forEach((node) => {
      const li = document.createElement("li");
      li.textContent = node.name;
      li.dataset.id = node.id.toString();
      li.dataset.tableName = tableName;
      ul.appendChild(li);
      if (node.children.length > 0) {
        renderBranch(node.children, li);
      }
    });
    container.appendChild(ul);
  };
  renderBranch(tree, displayPanel);
}
async function renderGroupedList(tableName, groupByColumnName) {
  const tableInfo = appMetadata[tableName];
  const parentColumn = tableInfo.columns[groupByColumnName];
  const parentTable = parentColumn.foreignKeyTable;
  const parentDisplayCol = getDisplayColumnName(parentTable);
  const displayCol = getDisplayColumnName(tableName);
  displayPanel.innerHTML = `<h3>Loading grouped records...</h3>`;
  try {
    const [records, parentRecords] = await Promise.all([
      queryDatabase(`SELECT * FROM ${tableName}`),
      queryDatabase(`SELECT id, "${parentDisplayCol}" as name FROM ${parentTable} ORDER BY "${parentDisplayCol}" ASC`)
    ]);
    displayPanel.innerHTML = "";
    const controlBar = document.createElement("div");
    controlBar.className = "control-bar";
    displayPanel.appendChild(controlBar);
    const flatListBtn = document.createElement("button");
    flatListBtn.textContent = "\u2039 View Full List";
    flatListBtn.className = "flat-list-choice-btn";
    flatListBtn.dataset.tableName = tableName;
    controlBar.appendChild(flatListBtn);
    const heading = document.createElement("h3");
    heading.textContent = `${tableInfo.label} grouped by ${appMetadata[parentTable]?.singularLabel || parentTable}`;
    displayPanel.appendChild(heading);
    parentRecords.forEach((parent) => {
      const children = records.filter((r) => String(r[groupByColumnName]) === String(parent.id));
      if (children.length > 0) {
        const groupContainer = document.createElement("div");
        groupContainer.style.marginBottom = "20px";
        const groupTitle = document.createElement("h4");
        groupTitle.style.marginBottom = "8px";
        groupTitle.textContent = `${parent.name} (${children.length})`;
        groupContainer.appendChild(groupTitle);
        const list = document.createElement("ul");
        list.classList.add("record-list");
        children.forEach((child) => {
          const li = document.createElement("li");
          li.textContent = child[displayCol] || `(ID: ${child.id})`;
          li.dataset.id = child.id.toString();
          li.dataset.tableName = tableName;
          list.appendChild(li);
        });
        groupContainer.appendChild(list);
        displayPanel.appendChild(groupContainer);
      }
    });
  } catch (error) {
    displayPanel.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
  }
}
async function showRecordDetails(tableName, id) {
  displayPanel.innerHTML = `<h3>Loading Details...</h3>`;
  try {
    const sql = `SELECT * FROM ${tableName} WHERE id = ${id}`;
    const records = await queryDatabase(sql);
    if (records.length === 0) {
      throw new Error(`Record with ID ${id} not found in '${tableName}'.`);
    }
    const record = records[0];
    if (isKnownRecord(record)) {
      const displayCol = getDisplayColumnName(tableName);
      const titleVal = record[displayCol] || `ID: ${record.id}`;
      const title = `'${titleVal}'`;
      const form = await createForm(tableName, title, true, record);
      displayPanel.innerHTML = "";
      displayPanel.appendChild(form);
    }
  } catch (error) {
    displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${error.message}</p>`;
  }
}
async function renderEditableForm(tableName, record = null) {
  const tableInfo = appMetadata[tableName];
  const isUpdating = currentWorkUnit?.mode === "modify";
  const displayCol = getDisplayColumnName(tableName);
  let formTitle;
  if (isUpdating && record) {
    const titleVal = record[displayCol] || `ID: ${record.id}`;
    formTitle = `Modify '${titleVal}'`;
  } else {
    const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, "");
    formTitle = `Add New ${singular}`;
  }
  displayPanel.innerHTML = "";
  const form = await createForm(tableName, formTitle, false, record);
  displayPanel.appendChild(form);
}
async function createForm(tableName, title, isReadOnly, record = null) {
  const tableInfo = appMetadata[tableName];
  const container = document.createElement("div");
  container.className = "form-container";
  const heading = document.createElement("h3");
  heading.textContent = title;
  heading.style.marginBottom = "20px";
  container.appendChild(heading);
  const form = document.createElement("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit(tableName, record ? record.id : null, record);
  });
  const isUpdating = record !== null && !isReadOnly;
  for (const columnName in tableInfo.columns) {
    const columnMeta = tableInfo.columns[columnName];
    if (columnName === "id" && !isReadOnly) continue;
    const fieldContainer = document.createElement("div");
    fieldContainer.className = "form-field";
    if (!columnMeta.isNullable && columnMeta.canModify) {
      fieldContainer.classList.add("is-required");
    }
    const label = document.createElement("label");
    label.textContent = columnMeta.label || columnName;
    fieldContainer.appendChild(label);
    const rawValue = record ? record[columnName] : null;
    if (isReadOnly) {
      const valueSpan = document.createElement("span");
      valueSpan.className = "form-value";
      if (rawValue === null || rawValue === void 0) {
        valueSpan.textContent = "NULL";
        valueSpan.classList.add("null-value");
      } else if (typeof rawValue === "object") {
        valueSpan.textContent = JSON.stringify(rawValue);
      } else {
        valueSpan.textContent = rawValue.toString();
      }
      fieldContainer.appendChild(valueSpan);
      if (columnMeta.isForeignKey && rawValue !== null && rawValue !== void 0) {
        const targetTable = columnMeta.foreignKeyTable;
        const targetCol = getDisplayColumnName(targetTable);
        try {
          const fkSql = `SELECT "${targetCol}" as name FROM ${targetTable} WHERE id = ${rawValue}`;
          const fkResult = await queryDatabase(fkSql);
          if (fkResult.length > 0) {
            const link = document.createElement("a");
            link.className = "goto-link";
            link.dataset.tableName = targetTable;
            link.dataset.id = rawValue.toString();
            link.textContent = `[Go to ${appMetadata[targetTable]?.singularLabel || targetTable}: ${fkResult[0].name}]`;
            fieldContainer.appendChild(link);
          }
        } catch (e) {
        }
      }
    } else {
      let inputElement;
      if (columnMeta.isEnum) {
        const select = document.createElement("select");
        select.name = columnName;
        if (columnMeta.isNullable) {
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "-- (None / Null) --";
          select.appendChild(defaultOption);
        }
        columnMeta.enumValues.forEach((enumVal) => {
          const option = document.createElement("option");
          option.value = enumVal;
          option.textContent = enumVal;
          if (rawValue === enumVal) option.selected = true;
          select.appendChild(option);
        });
        inputElement = select;
      } else if (columnMeta.rows && columnMeta.rows > 1) {
        const textarea = document.createElement("textarea");
        textarea.name = columnName;
        textarea.rows = columnMeta.rows;
        textarea.cols = columnMeta.len || 50;
        textarea.value = rawValue !== null && rawValue !== void 0 ? typeof rawValue === "object" ? JSON.stringify(rawValue, null, 2) : rawValue.toString() : "";
        inputElement = textarea;
      } else {
        const input = document.createElement("input");
        input.type = columnMeta.dbDataType.includes("int") ? "number" : "text";
        input.name = columnName;
        input.size = columnMeta.len || 30;
        input.value = rawValue !== null && rawValue !== void 0 ? rawValue.toString() : "";
        inputElement = input;
      }
      if (!columnMeta.canModify) {
        inputElement.readOnly = true;
        inputElement.style.backgroundColor = "#f1f5f9";
      }
      fieldContainer.appendChild(inputElement);
    }
    form.appendChild(fieldContainer);
  }
  if (isReadOnly && record) {
    const depContainer = document.createElement("div");
    depContainer.className = "dependents-container";
    const depLabel = document.createElement("strong");
    depLabel.style.width = "100%";
    depLabel.style.marginBottom = "6px";
    depLabel.textContent = "Dependent Child Relationships:";
    depContainer.appendChild(depLabel);
    for (const dep of tableInfo.dependents) {
      const depTableMeta = appMetadata[dep.table];
      if (!depTableMeta) continue;
      const fkToParent = Object.values(depTableMeta.columns).find(
        (c) => c.isForeignKey && c.foreignKeyTable === tableName
      );
      if (fkToParent) {
        const countSql = `SELECT count(*) FROM ${dep.table} WHERE "${fkToParent.column}" = ${record.id}`;
        const countRes = await queryDatabase(countSql);
        const count = countRes[0]?.count || "0";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = `${depTableMeta.label} (${count})`;
        btn.dataset.dependentTable = dep.table;
        btn.dataset.parentTable = tableName;
        btn.dataset.parentId = record.id.toString();
        btn.dataset.isReadOnly = "true";
        depContainer.appendChild(btn);
      }
    }
    form.appendChild(depContainer);
  }
  const actions = document.createElement("div");
  actions.className = "form-actions";
  if (isReadOnly && record) {
    const modifyBtn = document.createElement("button");
    modifyBtn.type = "button";
    modifyBtn.className = "form-btn primary modify-btn";
    modifyBtn.textContent = "\u270F\uFE0F Modify Record";
    modifyBtn.dataset.tableName = tableName;
    modifyBtn.dataset.record = JSON.stringify(record);
    actions.appendChild(modifyBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "form-btn danger delete-btn";
    deleteBtn.textContent = "\u{1F5D1}\uFE0F Delete Record";
    deleteBtn.dataset.tableName = tableName;
    deleteBtn.dataset.recordId = record.id.toString();
    actions.appendChild(deleteBtn);
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "form-btn secondary";
    backBtn.textContent = "\u2039 Back to List";
    backBtn.addEventListener("click", () => {
      if (onReturn) onReturn();
      else renderTableList(tableName);
    });
    actions.appendChild(backBtn);
  } else {
    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "form-btn primary";
    saveBtn.textContent = isUpdating ? "\u{1F4BE} Save Changes" : "\u2795 Create Record";
    actions.appendChild(saveBtn);
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "form-btn secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      if (onReturn) onReturn();
      else renderTableList(tableName);
    });
    actions.appendChild(cancelBtn);
  }
  form.appendChild(actions);
  container.appendChild(form);
  return container;
}
async function renderDependentList(parentTableName, parentId, dependentInfo, isReadOnly = true) {
  const dependentTable = dependentInfo.table;
  const depMeta = appMetadata[dependentTable];
  const parentMeta = appMetadata[parentTableName];
  displayPanel.innerHTML = `<h3>Loading ${depMeta.label}...</h3>`;
  try {
    const fkToParent = Object.values(depMeta.columns).find(
      (c) => c.isForeignKey && c.foreignKeyTable === parentTableName
    );
    if (!fkToParent) {
      throw new Error(`Could not find foreign key from ${dependentTable} to ${parentTableName}`);
    }
    const parentCol = getDisplayColumnName(parentTableName);
    const parentRes = await queryDatabase(`SELECT "${parentCol}" as name FROM ${parentTableName} WHERE id = ${parentId}`);
    const parentName = parentRes[0]?.name || `ID ${parentId}`;
    const displayCols = dependentInfo.displayColumns || [getDisplayColumnName(dependentTable)];
    const selectCols = ["id", ...displayCols.map((c) => `"${c}"`)];
    const sql = `SELECT ${selectCols.join(", ")} FROM ${dependentTable} WHERE "${fkToParent.column}" = ${parentId}`;
    const records = await queryDatabase(sql);
    displayPanel.innerHTML = "";
    const controlBar = document.createElement("div");
    controlBar.className = "control-bar";
    displayPanel.appendChild(controlBar);
    const backBtn = document.createElement("button");
    backBtn.textContent = `\u2039 Back to '${parentName}'`;
    backBtn.className = "add-new-btn";
    backBtn.style.background = "#64748b";
    backBtn.addEventListener("click", () => showRecordDetails(parentTableName, parentId));
    controlBar.appendChild(backBtn);
    const addDepBtn = document.createElement("button");
    const singular = depMeta.singularLabel || depMeta.label.replace(/s$/, "");
    addDepBtn.textContent = `+ Add New ${singular}`;
    addDepBtn.className = "add-new-btn add-new-dependent-btn";
    addDepBtn.dataset.dependentTable = dependentTable;
    addDepBtn.dataset.parentTable = parentTableName;
    addDepBtn.dataset.parentId = parentId.toString();
    controlBar.appendChild(addDepBtn);
    const heading = document.createElement("h3");
    heading.textContent = `${depMeta.label} for '${parentName}' (${records.length})`;
    displayPanel.appendChild(heading);
    if (records.length === 0) {
      const empty = document.createElement("div");
      empty.style.padding = "24px";
      empty.style.color = "#64748b";
      empty.textContent = `No ${depMeta.label.toLowerCase()} attached to this record yet.`;
      displayPanel.appendChild(empty);
      return;
    }
    const list = document.createElement("ul");
    list.classList.add("record-list");
    const mainCol = displayCols[0] || "id";
    records.forEach((rec) => {
      const li = document.createElement("li");
      li.textContent = rec[mainCol] || `(ID: ${rec.id})`;
      li.dataset.id = rec.id.toString();
      li.dataset.tableName = dependentTable;
      list.appendChild(li);
    });
    displayPanel.appendChild(list);
  } catch (e) {
    displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${e.message}</p>`;
  }
}
async function handleDelete(tableName, recordId) {
  const tableInfo = appMetadata[tableName];
  const confirmed = confirm(`Are you sure you want to delete this ${tableInfo.singularLabel || tableName} record (ID: ${recordId})?`);
  if (!confirmed) return;
  try {
    const sql = `DELETE FROM ${tableName} WHERE id = ${recordId}`;
    await executeDml(sql);
    if (statusMessage) statusMessage.textContent = `Record #${recordId} deleted from ${tableName}.`;
    alert("\u2713 Record deleted successfully.");
    renderTableList(tableName);
  } catch (e) {
    showErrorModal(`Delete Failed: ${e.message}`);
  }
}
function closeModal() {
  mainModal.classList.remove("open");
  modalBody.innerHTML = "";
}
function showErrorModal(message) {
  modalBody.innerHTML = `
        <h3 style="color: #dc2626; margin-bottom: 12px;">\u26A0\uFE0F Database Operation Error</h3>
        <p style="font-size: 13.5px; line-height: 1.5; color: #334155;">${message}</p>
        <button style="margin-top: 20px; padding: 6px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; cursor: pointer;" onclick="document.getElementById('main-modal').classList.remove('open')">Dismiss</button>
    `;
  mainModal.classList.add("open");
}
function showHintsFor(input) {
}
function hideAllHintDropdowns() {
  document.querySelectorAll(".hint-dropdown").forEach((d) => d.remove());
}

// crud/src/main.ts
async function bootstrap() {
  const healthBadge = document.getElementById("db-health-badge");
  const statusMessage2 = document.getElementById("status-message");
  const displayPanel2 = document.getElementById("display-panel");
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
    if (displayPanel2) {
      displayPanel2.innerHTML = `
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
