// console/console.ts
// Interactive HobbyNotes Database & Transaction Console application logic.

import { executeSql, getApiBaseUrl } from '../clientLib/db/api.js';
import { TransactionHandler } from '../clientLib/db/transactionHandler.js';

interface SqlTemplate {
    category: string;
    name: string;
    description: string;
    sql: string;
}

const TEMPLATES: SqlTemplate[] = [
    {
        category: 'Curriculum',
        name: 'All 52 Segments Overview',
        description: 'Lists modular curriculum segments ordered by sequence with character lengths and keys',
        sql: `SELECT s.id, s.seg_key, s.sequence_order, s.title, length(s.content_html) AS html_bytes, s.status 
FROM segments s
ORDER BY s.sequence_order ASC 
LIMIT 25;`
    },
    {
        category: 'Curriculum',
        name: 'Navigation Outline Sections Summary',
        description: 'Aggregates chapter counts per top-level outline section',
        sql: `SELECT parent.topic AS section_title, count(child.id) AS total_items
FROM curriculum_nav_items parent
LEFT JOIN curriculum_nav_items child ON child.parent_id = parent.id
WHERE parent.parent_id IS NULL
GROUP BY parent.id, parent.topic, parent.sequence_order
ORDER BY parent.sequence_order ASC;`
    },
    {
        category: 'Curriculum',
        name: 'Navigation Outline Tree (Hierarchy & Segments)',
        description: 'Recursive curriculum outline items with identity PKs, keys, and linked chapters',
        sql: `SELECT n.id, n.nav_key, a.app_code, n.parent_id, n.sequence_order, n.item_type, n.topic, n.nav_topic, s.seg_key, n.diagram_key
FROM curriculum_nav_items n
JOIN apps a ON a.id = n.app_id
LEFT JOIN segments s ON s.id = n.segment_id
WHERE a.app_code = 'app1'
ORDER BY n.parent_id NULLS FIRST, n.sequence_order ASC;`
    },
    {
        category: 'Foundations & Stencils',
        name: 'Formal Statements with Scaffolds',
        description: 'Formal statements with identity PKs, statement keys, tiers, and Lean signatures',
        sql: `SELECT id, statement_key, scaffold_key, domain_category, tier, title, lean_signature
FROM formal_statements
ORDER BY tier, id;`
    },
    {
        category: 'Foundations & Stencils',
        name: 'Directional Calculation Modes',
        description: 'Computational stencils with target variable formulas',
        sql: `SELECT cm.id, cm.mode_key, cm.statement_id, cm.label, cm.target_symbol, cm.target_domain, cm.formula_expr
FROM calculation_modes cm
ORDER BY cm.statement_id, cm.id;`
    },
    {
        category: 'Foundations & Stencils',
        name: 'Verified Presets (JSONB)',
        description: 'Concrete numerical test cases grounding stencils',
        sql: `SELECT vp.id, vp.preset_key, vp.mode_id, vp.title, vp.display_result, vp.domain_badge, vp.input_values
FROM verified_presets vp
ORDER BY vp.mode_id;`
    },
    {
        category: 'Cross-References',
        name: 'Embedded Stencil Citations',
        description: 'Scans interactive stencil links embedded in segment chapters',
        sql: `SELECT sr.id, s.seg_key, sr.initial_focus, fs.statement_key, cm.mode_key, sr.anchor_text
FROM segment_references sr
JOIN segments s ON s.id = sr.segment_id
LEFT JOIN formal_statements fs ON fs.id = sr.statement_id
LEFT JOIN calculation_modes cm ON cm.id = sr.mode_id
ORDER BY sr.segment_id, sr.occurrence_order
LIMIT 30;`
    },
    {
        category: 'Verification & Solvers',
        name: 'Lean Proofs Verification Cache',
        description: 'Lean 4 theorem type signatures and kernel verification status',
        sql: `SELECT lv.id, fs.statement_key, lv.theorem_name, lv.proof_status, lv.elapsed_ms, lv.created_at
FROM lean_verifications lv
JOIN formal_statements fs ON fs.id = lv.statement_id
ORDER BY lv.id;`
    },
    {
        category: 'Verification & Solvers',
        name: 'Parameter Mining Jobs',
        description: 'Automated parameter exploration finding clean integers for stencils',
        sql: `SELECT pmj.id, pmj.job_key, fs.statement_key, cm.mode_key, pmj.target_symbol, pmj.status, pmj.require_integer_outputs
FROM parameter_mining_jobs pmj
JOIN formal_statements fs ON fs.id = pmj.statement_id
JOIN calculation_modes cm ON cm.id = pmj.mode_id
ORDER BY pmj.id;`
    },
    {
        category: 'Transaction Test',
        name: 'Parameter Mining Insert / Rollback Test',
        description: 'Ideal for testing Begin -> Execute -> Rollback vs Commit',
        sql: `INSERT INTO parameter_mining_jobs (job_key, statement_id, mode_id, target_symbol, status)
VALUES ('tx_test_' || floor(random() * 10000)::text, 1, 1, 'v', 'pending')
RETURNING id, job_key, statement_id, mode_id, target_symbol, status, created_at;`
    }
];

class DatabaseConsoleApp {
    private txHandler: TransactionHandler;
    private currentResultData: any[] = [];
    private history: string[] = [];

    // DOM Elements
    private sqlInput = document.getElementById('sql-input') as HTMLTextAreaElement;
    private submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    private clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    private templatesBtn = document.getElementById('templates-btn') as HTMLButtonElement;
    private templatesMenu = document.getElementById('templates-menu') as HTMLDivElement;
    private historyBtn = document.getElementById('history-btn') as HTMLButtonElement;
    private historyMenu = document.getElementById('history-menu') as HTMLDivElement;
    private reseedBtn = document.getElementById('reseed-btn') as HTMLButtonElement | null;

    private beginBtn = document.getElementById('begin-btn') as HTMLButtonElement;
    private commitBtn = document.getElementById('commit-btn') as HTMLButtonElement;
    private rollbackBtn = document.getElementById('rollback-btn') as HTMLButtonElement;
    private txStatus = document.getElementById('tx-status') as HTMLSpanElement;

    private connectionBadge = document.getElementById('connection-badge') as HTMLDivElement;
    private connectionText = document.getElementById('connection-text') as HTMLSpanElement;
    private refreshHealthBtn = document.getElementById('refresh-health-btn') as HTMLButtonElement;

    private editorPane = document.getElementById('editor-pane') as HTMLDivElement;
    private dragResizer = document.getElementById('drag-resizer') as HTMLDivElement;
    private resultsPane = document.getElementById('results-pane') as HTMLDivElement;

    private tabTableBtn = document.getElementById('tab-table-btn') as HTMLButtonElement;
    private tabJsonBtn = document.getElementById('tab-json-btn') as HTMLButtonElement;
    private tableView = document.getElementById('table-view') as HTMLDivElement;
    private jsonView = document.getElementById('json-view') as HTMLDivElement;
    private tableContainer = document.getElementById('table-container') as HTMLDivElement;
    private jsonContainer = document.getElementById('json-container') as HTMLElement;
    private copyJsonBtn = document.getElementById('copy-json-btn') as HTMLButtonElement;
    private executionStats = document.getElementById('execution-stats') as HTMLDivElement;

    constructor() {
        this.txHandler = new TransactionHandler('stateful');
        this.loadHistory();
        this.initEvents();
        this.renderTemplates();
        this.checkHealth();
    }

    private initEvents() {
        // Submit Query
        this.submitBtn.addEventListener('click', () => this.runQuery());
        this.clearBtn.addEventListener('click', () => {
            this.sqlInput.value = '';
            this.sqlInput.focus();
        });

        // Keyboard Shortcut: Ctrl + Enter
        this.sqlInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runQuery();
            }
        });

        // Dropdowns
        this.templatesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(this.templatesMenu);
            this.historyMenu.classList.remove('visible');
        });

        this.historyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renderHistory();
            this.toggleDropdown(this.historyMenu);
            this.templatesMenu.classList.remove('visible');
        });

        document.addEventListener('click', () => {
            this.templatesMenu.classList.remove('visible');
            this.historyMenu.classList.remove('visible');
        });

        // Transaction controls
        this.beginBtn.addEventListener('click', () => this.handleBeginTx());
        this.commitBtn.addEventListener('click', () => this.handleCommitTx());
        this.rollbackBtn.addEventListener('click', () => this.handleRollbackTx());

        // Reseed database from source baseline
        this.reseedBtn?.addEventListener('click', () => this.handleReseedDb());

        // Health probe
        this.refreshHealthBtn.addEventListener('click', () => this.checkHealth());

        // Result view tabs
        this.tabTableBtn.addEventListener('click', () => this.switchTab('table'));
        this.tabJsonBtn.addEventListener('click', () => this.switchTab('json'));
        this.copyJsonBtn.addEventListener('click', () => this.copyJson());

        // Resizer Dragging
        this.initResizer();
    }

    private toggleDropdown(menu: HTMLElement) {
        menu.classList.toggle('visible');
    }

    private async checkHealth() {
        this.connectionBadge.className = 'connection-badge status-checking';
        this.connectionText.textContent = 'Checking PostgreSQL...';

        try {
            const start = performance.now();
            const res = await fetch(`${getApiBaseUrl()}/api/health`);
            const duration = Math.round(performance.now() - start);

            if (res.ok) {
                this.connectionBadge.className = 'connection-badge status-online';
                this.connectionText.textContent = `Online (${duration}ms) • hobbynotes:5432`;
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err: any) {
            this.connectionBadge.className = 'connection-badge status-offline';
            this.connectionText.textContent = `Offline: ${err.message}`;
        }
    }

    // =================================================================
    // QUERY EXECUTION & RESULTS RENDERING
    // =================================================================

    private async runQuery() {
        const sql = this.sqlInput.value.trim();
        if (!sql) {
            alert('Please enter an SQL query to execute.');
            return;
        }

        this.submitBtn.disabled = true;
        this.executionStats.textContent = 'Executing query...';
        const start = performance.now();

        try {
            // Execute via stateful transaction handler or stateless bridge
            const txId = this.txHandler.getActiveTransactionId();
            const response = await executeSql(sql, undefined, txId);
            const duration = Math.round(performance.now() - start);

            if (response.status === 'success') {
                const rows = response.data?.rows || [];
                const rowCount = response.data?.rowCount ?? rows.length;
                this.currentResultData = rows;

                this.executionStats.textContent = `${rowCount} row(s) returned in ${duration}ms ${txId ? '• [Inside Transaction]' : ''}`;
                this.renderTable(rows);
                this.renderJson(rows);

                this.addToHistory(sql);
            } else {
                this.renderError(response.message, response.error);
                this.executionStats.textContent = `Error in ${duration}ms`;
            }
        } catch (err: any) {
            this.renderError('Execution Exception', err.message);
            this.executionStats.textContent = 'Failed';
        } finally {
            this.submitBtn.disabled = false;
        }
    }

    private renderTable(rows: any[]) {
        if (!rows || rows.length === 0) {
            this.tableContainer.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">✔️ Statement executed successfully</div>
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
        html += '</tr></thead><tbody>';

        rows.forEach((row, idx) => {
            html += `<tr><td class="row-index">${idx + 1}</td>`;
            for (const col of columns) {
                const val = row[col];
                if (val === null || val === undefined) {
                    html += `<td><span class="null-badge">NULL</span></td>`;
                } else if (typeof val === 'object') {
                    html += `<td title="${this.escapeHtml(JSON.stringify(val))}">${this.escapeHtml(JSON.stringify(val))}</td>`;
                } else {
                    html += `<td title="${this.escapeHtml(String(val))}">${this.escapeHtml(String(val))}</td>`;
                }
            }
            html += '</tr>';
        });

        html += '</tbody></table>';
        this.tableContainer.innerHTML = html;
    }

    private renderJson(rows: any[]) {
        this.jsonContainer.textContent = JSON.stringify(rows, null, 2);
    }

    private renderError(title: string, detail?: string) {
        this.tableContainer.innerHTML = `
            <div class="error-banner">
                <div class="error-title">⚠️ ${this.escapeHtml(title)}</div>
                ${detail ? `<div class="error-detail">${this.escapeHtml(detail)}</div>` : ''}
            </div>
        `;
        this.jsonContainer.textContent = JSON.stringify({ error: title, detail }, null, 2);
    }

    private switchTab(tab: 'table' | 'json') {
        if (tab === 'table') {
            this.tabTableBtn.classList.add('active');
            this.tabJsonBtn.classList.remove('active');
            this.tableView.classList.add('active');
            this.jsonView.classList.remove('active');
        } else {
            this.tabTableBtn.classList.remove('active');
            this.tabJsonBtn.classList.add('active');
            this.tableView.classList.remove('active');
            this.jsonView.classList.add('active');
        }
    }

    private copyJson() {
        const text = this.jsonContainer.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
            const original = this.copyJsonBtn.textContent;
            this.copyJsonBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyJsonBtn.textContent = original;
            }, 1500);
        });
    }

    // =================================================================
    // TRANSACTION MANAGEMENT
    // =================================================================

    private async handleBeginTx() {
        this.beginBtn.disabled = true;
        const res = await this.txHandler.begin();
        if (res.status === 'success') {
            this.updateTxUI();
        } else {
            alert(`Could not begin transaction: ${res.message}`);
            this.beginBtn.disabled = false;
        }
    }

    private async handleCommitTx() {
        this.commitBtn.disabled = true;
        const res = await this.txHandler.commit();
        if (res.status === 'success') {
            this.updateTxUI();
            this.executionStats.textContent = 'Transaction committed successfully.';
        } else {
            alert(`Commit failed: ${res.message}`);
            this.updateTxUI();
        }
    }

    private async handleRollbackTx() {
        this.rollbackBtn.disabled = true;
        const res = await this.txHandler.rollback();
        if (res.status === 'success') {
            this.updateTxUI();
            this.executionStats.textContent = 'Transaction rolled back.';
        } else {
            alert(`Rollback failed: ${res.message}`);
            this.updateTxUI();
        }
    }

    private updateTxUI() {
        const isActive = this.txHandler.isActive;
        const txId = this.txHandler.getActiveTransactionId();

        this.beginBtn.disabled = isActive;
        this.commitBtn.disabled = !isActive;
        this.rollbackBtn.disabled = !isActive;

        if (isActive && txId) {
            this.txStatus.className = 'tx-badge active';
            this.txStatus.textContent = `TRANSACTION ACTIVE (${txId.substring(0, 8)}...)`;
            this.submitBtn.textContent = '▶ Execute in Transaction';
        } else {
            this.txStatus.className = 'tx-badge idle';
            this.txStatus.textContent = 'NO TRANSACTION';
            this.submitBtn.textContent = '▶ Run Query';
        }
    }

    private async handleReseedDb() {
        const confirmed = confirm(
            'Are you sure you want to RESET the PostgreSQL database to the clean Git baseline (db/seed_v2.sql)?\n\n' +
            'This will re-initialize all curriculum navigation items, segments, formal statements, calculation modes, and verified presets from source control.'
        );
        if (!confirmed) return;

        if (this.reseedBtn) {
            this.reseedBtn.disabled = true;
            this.reseedBtn.textContent = '⏳ Resetting...';
        }
        this.executionStats.textContent = 'Reseeding database from db/seed_v2.sql...';

        try {
            const start = performance.now();
            const res = await fetch(`${getApiBaseUrl()}/api/reseed-db`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const duration = Math.round(performance.now() - start);
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                this.executionStats.textContent = `Database reset successfully in ${duration}ms from Git baseline.`;
                alert(`Database successfully restored from db/seed_v2.sql in ${duration}ms!`);
                // Automatically run query to show the clean baseline in the table view
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
        } catch (err: any) {
            alert(`Database reset failed: ${err.message}`);
            this.executionStats.textContent = `Reset failed: ${err.message}`;
        } finally {
            if (this.reseedBtn) {
                this.reseedBtn.disabled = false;
                this.reseedBtn.innerHTML = '<span class="btn-icon">🔄</span> Reset DB from Source';
            }
        }
    }

    // =================================================================
    // TEMPLATES & HISTORY
    // =================================================================

    private renderTemplates() {
        let html = '';
        let currentCategory = '';

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

        this.templatesMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.addEventListener('click', () => {
                const name = item.getAttribute('data-template-name');
                const tpl = TEMPLATES.find((t) => t.name === name);
                if (tpl) {
                    this.sqlInput.value = tpl.sql;
                    this.templatesMenu.classList.remove('visible');
                    this.sqlInput.focus();
                }
            });
        });
    }

    private renderHistory() {
        if (this.history.length === 0) {
            this.historyMenu.innerHTML = `<div class="dropdown-empty">No queries in history yet.</div>`;
            return;
        }

        let html = `<div class="dropdown-group-title">Recent Queries (${this.history.length})</div>`;
        this.history.forEach((q, idx) => {
            const preview = q.replace(/\s+/g, ' ').trim();
            const truncated = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
            html += `
                <div class="dropdown-item" data-history-index="${idx}">
                    <code>${this.escapeHtml(truncated)}</code>
                </div>
            `;
        });

        this.historyMenu.innerHTML = html;

        this.historyMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.getAttribute('data-history-index') || '0', 10);
                const sql = this.history[idx];
                if (sql) {
                    this.sqlInput.value = sql;
                    this.historyMenu.classList.remove('visible');
                    this.sqlInput.focus();
                }
            });
        });
    }

    private loadHistory() {
        try {
            const raw = localStorage.getItem('hobbynotes_sql_history');
            if (raw) {
                this.history = JSON.parse(raw);
            }
        } catch {
            this.history = [];
        }
    }

    private addToHistory(sql: string) {
        // Avoid duplicate top entry
        if (this.history[0] === sql) return;

        this.history.unshift(sql);
        if (this.history.length > 25) {
            this.history = this.history.slice(0, 25);
        }

        try {
            localStorage.setItem('hobbynotes_sql_history', JSON.stringify(this.history));
        } catch {
            // Ignore quota errors
        }
    }

    // =================================================================
    // DRAG RESIZER
    // =================================================================

    private initResizer() {
        let isDragging = false;
        let startY = 0;
        let startEditorHeight = 0;

        this.dragResizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startEditorHeight = this.editorPane.getBoundingClientRect().height;
            this.dragResizer.classList.add('dragging');
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(100, Math.min(window.innerHeight - 250, startEditorHeight + deltaY));
            this.editorPane.style.flex = `0 0 ${newHeight}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.dragResizer.classList.remove('dragging');
                document.body.style.userSelect = '';
            }
        });
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new DatabaseConsoleApp();
});
