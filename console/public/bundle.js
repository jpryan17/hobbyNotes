// clientLib/db/api.ts
var apiBaseUrl = typeof window !== "undefined" && window.location.port === "3000" ? "" : "http://localhost:3000";
function getApiBaseUrl() {
  return apiBaseUrl;
}
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
async function beginTransaction() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/transactions/begin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await response.json();
  } catch (err) {
    return {
      status: "error",
      message: "Failed to initiate begin transaction call.",
      error: err?.message || String(err)
    };
  }
}
async function commitTransaction(transactionId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/transactions/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId })
    });
    return await response.json();
  } catch (err) {
    return {
      status: "error",
      message: "Failed to commit transaction.",
      error: err?.message || String(err)
    };
  }
}
async function rollbackTransaction(transactionId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/transactions/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId })
    });
    return await response.json();
  } catch (err) {
    return {
      status: "error",
      message: "Failed to rollback transaction.",
      error: err?.message || String(err)
    };
  }
}

// clientLib/db/transactionHandler.ts
var TransactionHandler = class {
  mode;
  transactionId = null;
  statements = [];
  isActive = false;
  constructor(mode = "stateful") {
    this.mode = mode;
  }
  reset() {
    this.isActive = false;
    this.transactionId = null;
    this.statements = [];
  }
  getActiveTransactionId() {
    return this.transactionId;
  }
  /**
   * Begins a transaction.
   * In stateful mode, initiates a server session client.
   * In stateless mode, readies the client-side statement buffer.
   */
  async begin() {
    if (this.isActive) {
      return { status: "error", message: "Transaction is already active." };
    }
    this.isActive = true;
    if (this.mode === "stateful") {
      const response = await beginTransaction();
      if (response.status === "success" && response.transactionId) {
        this.transactionId = response.transactionId;
      } else {
        this.reset();
      }
      return response;
    } else {
      this.statements = [];
      return {
        status: "success",
        message: "Stateless transaction started. Ready to buffer statements."
      };
    }
  }
  /**
   * Executes an SQL statement within the transaction.
   */
  async execute(sql, params) {
    if (!this.isActive) {
      return { status: "error", message: "No active transaction. Call begin() first." };
    }
    if (this.mode === "stateful") {
      if (!this.transactionId) {
        return { status: "error", message: "Stateful transaction is active but has no ID." };
      }
      return executeSql(sql, params, this.transactionId);
    } else {
      this.statements.push({ sql, params });
      return {
        status: "success",
        message: `Statement queued in buffer (${this.statements.length} total).`,
        data: { rows: [], rowCount: 0 }
      };
    }
  }
  /**
   * Commits the active transaction.
   */
  async commit() {
    if (!this.isActive) {
      return { status: "error", message: "No active transaction to commit." };
    }
    let response;
    if (this.mode === "stateful") {
      if (!this.transactionId) {
        return { status: "error", message: "Missing transaction ID." };
      }
      response = await commitTransaction(this.transactionId);
    } else {
      if (this.statements.length === 0) {
        response = { status: "success", message: "Stateless transaction committed with 0 statements." };
      } else {
        const fullSql = ["BEGIN;", ...this.statements.map((s) => s.sql.trim().replace(/;+$/, "") + ";"), "COMMIT;"].join("\n");
        response = await executeSql(fullSql);
      }
    }
    this.reset();
    return response;
  }
  /**
   * Rolls back the active transaction.
   */
  async rollback() {
    if (!this.isActive) {
      return { status: "error", message: "No active transaction to roll back." };
    }
    let response;
    if (this.mode === "stateful") {
      if (this.transactionId) {
        response = await rollbackTransaction(this.transactionId);
      } else {
        response = { status: "error", message: "Missing transaction ID." };
      }
    } else {
      response = {
        status: "success",
        message: `Stateless transaction rolled back (${this.statements.length} statements discarded).`
      };
    }
    this.reset();
    return response;
  }
};

// console/console.ts
var TEMPLATES = [
  {
    category: "Curriculum",
    name: "All 52 Segments Overview",
    description: "Lists modular curriculum segments ordered by sequence with character lengths and keys",
    sql: `SELECT s.id, s.seg_key, s.sequence_order, s.title, length(s.content_html) AS html_bytes, s.status 
FROM segments s
ORDER BY s.sequence_order ASC 
LIMIT 25;`
  },
  {
    category: "Curriculum",
    name: "Navigation Outline Sections Summary",
    description: "Aggregates chapter counts per top-level outline section",
    sql: `SELECT parent.topic AS section_title, count(child.id) AS total_items
FROM curriculum_nav_items parent
LEFT JOIN curriculum_nav_items child ON child.parent_id = parent.id
WHERE parent.parent_id IS NULL
GROUP BY parent.id, parent.topic, parent.sequence_order
ORDER BY parent.sequence_order ASC;`
  },
  {
    category: "Curriculum",
    name: "Navigation Outline Tree (Hierarchy & Segments)",
    description: "Recursive curriculum outline items with identity PKs, keys, and linked chapters",
    sql: `SELECT n.id, n.nav_key, a.app_code, n.parent_id, n.sequence_order, n.item_type, n.topic, n.nav_topic, s.seg_key, n.diagram_key
FROM curriculum_nav_items n
JOIN apps a ON a.id = n.app_id
LEFT JOIN segments s ON s.id = n.segment_id
WHERE a.app_code = 'app1'
ORDER BY n.parent_id NULLS FIRST, n.sequence_order ASC;`
  },
  {
    category: "Foundations & Stencils",
    name: "Formal Statements with Scaffolds",
    description: "Formal statements with identity PKs, statement keys, tiers, and Lean signatures",
    sql: `SELECT id, statement_key, scaffold_key, domain_category, tier, title, lean_signature
FROM formal_statements
ORDER BY tier, id;`
  },
  {
    category: "Foundations & Stencils",
    name: "Directional Calculation Modes",
    description: "Computational stencils with target variable formulas",
    sql: `SELECT cm.id, cm.mode_key, cm.statement_id, cm.label, cm.target_symbol, cm.target_domain, cm.formula_expr
FROM calculation_modes cm
ORDER BY cm.statement_id, cm.id;`
  },
  {
    category: "Foundations & Stencils",
    name: "Verified Presets (JSONB)",
    description: "Concrete numerical test cases grounding stencils",
    sql: `SELECT vp.id, vp.preset_key, vp.mode_id, vp.title, vp.display_result, vp.domain_badge, vp.input_values
FROM verified_presets vp
ORDER BY vp.mode_id;`
  },
  {
    category: "Cross-References",
    name: "Embedded Stencil Citations",
    description: "Scans interactive stencil links embedded in segment chapters",
    sql: `SELECT sr.id, s.seg_key, sr.initial_focus, fs.statement_key, cm.mode_key, sr.anchor_text
FROM segment_references sr
JOIN segments s ON s.id = sr.segment_id
LEFT JOIN formal_statements fs ON fs.id = sr.statement_id
LEFT JOIN calculation_modes cm ON cm.id = sr.mode_id
ORDER BY sr.segment_id, sr.occurrence_order
LIMIT 30;`
  },
  {
    category: "Verification & Solvers",
    name: "Lean Proofs Verification Cache",
    description: "Lean 4 theorem type signatures and kernel verification status",
    sql: `SELECT lv.id, fs.statement_key, lv.theorem_name, lv.proof_status, lv.elapsed_ms, lv.created_at
FROM lean_verifications lv
JOIN formal_statements fs ON fs.id = lv.statement_id
ORDER BY lv.id;`
  },
  {
    category: "Verification & Solvers",
    name: "Parameter Mining Jobs",
    description: "Automated parameter exploration finding clean integers for stencils",
    sql: `SELECT pmj.id, pmj.job_key, fs.statement_key, cm.mode_key, pmj.target_symbol, pmj.status, pmj.require_integer_outputs
FROM parameter_mining_jobs pmj
JOIN formal_statements fs ON fs.id = pmj.statement_id
JOIN calculation_modes cm ON cm.id = pmj.mode_id
ORDER BY pmj.id;`
  },
  {
    category: "Transaction Test",
    name: "Parameter Mining Insert / Rollback Test",
    description: "Ideal for testing Begin -> Execute -> Rollback vs Commit",
    sql: `INSERT INTO parameter_mining_jobs (job_key, statement_id, mode_id, target_symbol, status)
VALUES ('tx_test_' || floor(random() * 10000)::text, 1, 1, 'v', 'pending')
RETURNING id, job_key, statement_id, mode_id, target_symbol, status, created_at;`
  }
];
var DatabaseConsoleApp = class {
  txHandler;
  currentResultData = [];
  history = [];
  // DOM Elements
  sqlInput = document.getElementById("sql-input");
  submitBtn = document.getElementById("submit-btn");
  clearBtn = document.getElementById("clear-btn");
  templatesBtn = document.getElementById("templates-btn");
  templatesMenu = document.getElementById("templates-menu");
  historyBtn = document.getElementById("history-btn");
  historyMenu = document.getElementById("history-menu");
  reseedBtn = document.getElementById("reseed-btn");
  beginBtn = document.getElementById("begin-btn");
  commitBtn = document.getElementById("commit-btn");
  rollbackBtn = document.getElementById("rollback-btn");
  txStatus = document.getElementById("tx-status");
  connectionBadge = document.getElementById("connection-badge");
  connectionText = document.getElementById("connection-text");
  refreshHealthBtn = document.getElementById("refresh-health-btn");
  editorPane = document.getElementById("editor-pane");
  dragResizer = document.getElementById("drag-resizer");
  resultsPane = document.getElementById("results-pane");
  tabTableBtn = document.getElementById("tab-table-btn");
  tabJsonBtn = document.getElementById("tab-json-btn");
  tableView = document.getElementById("table-view");
  jsonView = document.getElementById("json-view");
  tableContainer = document.getElementById("table-container");
  jsonContainer = document.getElementById("json-container");
  copyJsonBtn = document.getElementById("copy-json-btn");
  executionStats = document.getElementById("execution-stats");
  constructor() {
    this.txHandler = new TransactionHandler("stateful");
    this.loadHistory();
    this.initEvents();
    this.renderTemplates();
    this.checkHealth();
  }
  initEvents() {
    this.submitBtn.addEventListener("click", () => this.runQuery());
    this.clearBtn.addEventListener("click", () => {
      this.sqlInput.value = "";
      this.sqlInput.focus();
    });
    this.sqlInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.runQuery();
      }
    });
    this.templatesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown(this.templatesMenu);
      this.historyMenu.classList.remove("visible");
    });
    this.historyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.renderHistory();
      this.toggleDropdown(this.historyMenu);
      this.templatesMenu.classList.remove("visible");
    });
    document.addEventListener("click", () => {
      this.templatesMenu.classList.remove("visible");
      this.historyMenu.classList.remove("visible");
    });
    this.beginBtn.addEventListener("click", () => this.handleBeginTx());
    this.commitBtn.addEventListener("click", () => this.handleCommitTx());
    this.rollbackBtn.addEventListener("click", () => this.handleRollbackTx());
    this.reseedBtn?.addEventListener("click", () => this.handleReseedDb());
    this.refreshHealthBtn.addEventListener("click", () => this.checkHealth());
    this.tabTableBtn.addEventListener("click", () => this.switchTab("table"));
    this.tabJsonBtn.addEventListener("click", () => this.switchTab("json"));
    this.copyJsonBtn.addEventListener("click", () => this.copyJson());
    this.initResizer();
  }
  toggleDropdown(menu) {
    menu.classList.toggle("visible");
  }
  async checkHealth() {
    this.connectionBadge.className = "connection-badge status-checking";
    this.connectionText.textContent = "Checking PostgreSQL...";
    try {
      const start = performance.now();
      const res = await fetch(`${getApiBaseUrl()}/api/health`);
      const duration = Math.round(performance.now() - start);
      if (res.ok) {
        this.connectionBadge.className = "connection-badge status-online";
        this.connectionText.textContent = `Online (${duration}ms) \u2022 hobbynotes:5432`;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      this.connectionBadge.className = "connection-badge status-offline";
      this.connectionText.textContent = `Offline: ${err.message}`;
    }
  }
  // =================================================================
  // QUERY EXECUTION & RESULTS RENDERING
  // =================================================================
  async runQuery() {
    const sql = this.sqlInput.value.trim();
    if (!sql) {
      alert("Please enter an SQL query to execute.");
      return;
    }
    this.submitBtn.disabled = true;
    this.executionStats.textContent = "Executing query...";
    const start = performance.now();
    try {
      const txId = this.txHandler.getActiveTransactionId();
      const response = await executeSql(sql, void 0, txId);
      const duration = Math.round(performance.now() - start);
      if (response.status === "success") {
        const rows = response.data?.rows || [];
        const rowCount = response.data?.rowCount ?? rows.length;
        this.currentResultData = rows;
        this.executionStats.textContent = `${rowCount} row(s) returned in ${duration}ms ${txId ? "\u2022 [Inside Transaction]" : ""}`;
        this.renderTable(rows);
        this.renderJson(rows);
        this.addToHistory(sql);
      } else {
        this.renderError(response.message, response.error);
        this.executionStats.textContent = `Error in ${duration}ms`;
      }
    } catch (err) {
      this.renderError("Execution Exception", err.message);
      this.executionStats.textContent = "Failed";
    } finally {
      this.submitBtn.disabled = false;
    }
  }
  renderTable(rows) {
    if (!rows || rows.length === 0) {
      this.tableContainer.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">\u2714\uFE0F Statement executed successfully</div>
                    <div>0 rows returned.</div>
                </div>
            `;
      return;
    }
    const columns = Object.keys(rows[0]);
    let html = '<table class="result-table"><thead><tr>';
    html += '<th class="row-index">#</th>';
    for (const col of columns) {
      html += `<th>${this.escapeHtml(col)}</th>`;
    }
    html += "</tr></thead><tbody>";
    rows.forEach((row, idx) => {
      html += `<tr><td class="row-index">${idx + 1}</td>`;
      for (const col of columns) {
        const val = row[col];
        if (val === null || val === void 0) {
          html += `<td><span class="null-badge">NULL</span></td>`;
        } else if (typeof val === "object") {
          html += `<td title="${this.escapeHtml(JSON.stringify(val))}">${this.escapeHtml(JSON.stringify(val))}</td>`;
        } else {
          html += `<td title="${this.escapeHtml(String(val))}">${this.escapeHtml(String(val))}</td>`;
        }
      }
      html += "</tr>";
    });
    html += "</tbody></table>";
    this.tableContainer.innerHTML = html;
  }
  renderJson(rows) {
    this.jsonContainer.textContent = JSON.stringify(rows, null, 2);
  }
  renderError(title, detail) {
    this.tableContainer.innerHTML = `
            <div class="error-banner">
                <div class="error-title">\u26A0\uFE0F ${this.escapeHtml(title)}</div>
                ${detail ? `<div class="error-detail">${this.escapeHtml(detail)}</div>` : ""}
            </div>
        `;
    this.jsonContainer.textContent = JSON.stringify({ error: title, detail }, null, 2);
  }
  switchTab(tab) {
    if (tab === "table") {
      this.tabTableBtn.classList.add("active");
      this.tabJsonBtn.classList.remove("active");
      this.tableView.classList.add("active");
      this.jsonView.classList.remove("active");
    } else {
      this.tabTableBtn.classList.remove("active");
      this.tabJsonBtn.classList.add("active");
      this.tableView.classList.remove("active");
      this.jsonView.classList.add("active");
    }
  }
  copyJson() {
    const text = this.jsonContainer.textContent || "";
    navigator.clipboard.writeText(text).then(() => {
      const original = this.copyJsonBtn.textContent;
      this.copyJsonBtn.textContent = "\u2705 Copied!";
      setTimeout(() => {
        this.copyJsonBtn.textContent = original;
      }, 1500);
    });
  }
  // =================================================================
  // TRANSACTION MANAGEMENT
  // =================================================================
  async handleBeginTx() {
    this.beginBtn.disabled = true;
    const res = await this.txHandler.begin();
    if (res.status === "success") {
      this.updateTxUI();
    } else {
      alert(`Could not begin transaction: ${res.message}`);
      this.beginBtn.disabled = false;
    }
  }
  async handleCommitTx() {
    this.commitBtn.disabled = true;
    const res = await this.txHandler.commit();
    if (res.status === "success") {
      this.updateTxUI();
      this.executionStats.textContent = "Transaction committed successfully.";
    } else {
      alert(`Commit failed: ${res.message}`);
      this.updateTxUI();
    }
  }
  async handleRollbackTx() {
    this.rollbackBtn.disabled = true;
    const res = await this.txHandler.rollback();
    if (res.status === "success") {
      this.updateTxUI();
      this.executionStats.textContent = "Transaction rolled back.";
    } else {
      alert(`Rollback failed: ${res.message}`);
      this.updateTxUI();
    }
  }
  updateTxUI() {
    const isActive = this.txHandler.isActive;
    const txId = this.txHandler.getActiveTransactionId();
    this.beginBtn.disabled = isActive;
    this.commitBtn.disabled = !isActive;
    this.rollbackBtn.disabled = !isActive;
    if (isActive && txId) {
      this.txStatus.className = "tx-badge active";
      this.txStatus.textContent = `TRANSACTION ACTIVE (${txId.substring(0, 8)}...)`;
      this.submitBtn.textContent = "\u25B6 Execute in Transaction";
    } else {
      this.txStatus.className = "tx-badge idle";
      this.txStatus.textContent = "NO TRANSACTION";
      this.submitBtn.textContent = "\u25B6 Run Query";
    }
  }
  async handleReseedDb() {
    const confirmed = confirm(
      "Are you sure you want to RESET the PostgreSQL database to the clean Git baseline (db/seed_v2.sql)?\n\nThis will re-initialize all curriculum navigation items, segments, formal statements, calculation modes, and verified presets from source control."
    );
    if (!confirmed) return;
    if (this.reseedBtn) {
      this.reseedBtn.disabled = true;
      this.reseedBtn.textContent = "\u23F3 Resetting...";
    }
    this.executionStats.textContent = "Reseeding database from db/seed_v2.sql...";
    try {
      const start = performance.now();
      const res = await fetch(`${getApiBaseUrl()}/api/reseed-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const duration = Math.round(performance.now() - start);
      const data = await res.json();
      if (res.ok && data.status === "success") {
        this.executionStats.textContent = `Database reset successfully in ${duration}ms from Git baseline.`;
        alert(`Database successfully restored from db/seed_v2.sql in ${duration}ms!`);
        this.sqlInput.value = `SELECT n.id, n.nav_key, n.sequence_order, n.item_type, n.topic, s.seg_key
FROM curriculum_nav_items n
JOIN apps a ON a.id = n.app_id
LEFT JOIN segments s ON s.id = n.segment_id
WHERE a.app_code = 'app1'
ORDER BY n.parent_id NULLS FIRST, n.sequence_order ASC
LIMIT 30;`;
        this.runQuery();
      } else {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      alert(`Database reset failed: ${err.message}`);
      this.executionStats.textContent = `Reset failed: ${err.message}`;
    } finally {
      if (this.reseedBtn) {
        this.reseedBtn.disabled = false;
        this.reseedBtn.innerHTML = '<span class="btn-icon">\u{1F504}</span> Reset DB from Source';
      }
    }
  }
  // =================================================================
  // TEMPLATES & HISTORY
  // =================================================================
  renderTemplates() {
    let html = "";
    let currentCategory = "";
    TEMPLATES.forEach((tpl) => {
      if (tpl.category !== currentCategory) {
        currentCategory = tpl.category;
        html += `<div class="dropdown-group-title">${this.escapeHtml(currentCategory)}</div>`;
      }
      html += `
                <div class="dropdown-item" data-template-name="${this.escapeHtml(tpl.name)}">
                    <strong>${this.escapeHtml(tpl.name)}</strong>
                    <span class="dropdown-item-desc">${this.escapeHtml(tpl.description)}</span>
                </div>
            `;
    });
    this.templatesMenu.innerHTML = html;
    this.templatesMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        const name = item.getAttribute("data-template-name");
        const tpl = TEMPLATES.find((t) => t.name === name);
        if (tpl) {
          this.sqlInput.value = tpl.sql;
          this.templatesMenu.classList.remove("visible");
          this.sqlInput.focus();
        }
      });
    });
  }
  renderHistory() {
    if (this.history.length === 0) {
      this.historyMenu.innerHTML = `<div class="dropdown-empty">No queries in history yet.</div>`;
      return;
    }
    let html = `<div class="dropdown-group-title">Recent Queries (${this.history.length})</div>`;
    this.history.forEach((q, idx) => {
      const preview = q.replace(/\s+/g, " ").trim();
      const truncated = preview.length > 50 ? preview.substring(0, 50) + "..." : preview;
      html += `
                <div class="dropdown-item" data-history-index="${idx}">
                    <code>${this.escapeHtml(truncated)}</code>
                </div>
            `;
    });
    this.historyMenu.innerHTML = html;
    this.historyMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        const idx = parseInt(item.getAttribute("data-history-index") || "0", 10);
        const sql = this.history[idx];
        if (sql) {
          this.sqlInput.value = sql;
          this.historyMenu.classList.remove("visible");
          this.sqlInput.focus();
        }
      });
    });
  }
  loadHistory() {
    try {
      const raw = localStorage.getItem("hobbynotes_sql_history");
      if (raw) {
        this.history = JSON.parse(raw);
      }
    } catch {
      this.history = [];
    }
  }
  addToHistory(sql) {
    if (this.history[0] === sql) return;
    this.history.unshift(sql);
    if (this.history.length > 25) {
      this.history = this.history.slice(0, 25);
    }
    try {
      localStorage.setItem("hobbynotes_sql_history", JSON.stringify(this.history));
    } catch {
    }
  }
  // =================================================================
  // DRAG RESIZER
  // =================================================================
  initResizer() {
    let isDragging = false;
    let startY = 0;
    let startEditorHeight = 0;
    this.dragResizer.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startEditorHeight = this.editorPane.getBoundingClientRect().height;
      this.dragResizer.classList.add("dragging");
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(window.innerHeight - 250, startEditorHeight + deltaY));
      this.editorPane.style.flex = `0 0 ${newHeight}px`;
    });
    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        this.dragResizer.classList.remove("dragging");
        document.body.style.userSelect = "";
      }
    });
  }
  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
};
document.addEventListener("DOMContentLoaded", () => {
  new DatabaseConsoleApp();
});
//# sourceMappingURL=bundle.js.map
