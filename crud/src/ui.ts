// crud/src/ui.ts
// Schema-driven, attribute-complete CRUD Studio engine for Middle Way Mathematics.

import { AppMetadata, TableNavigationPath, Dependent, EnrichedTable, EnrichedColumn } from './types.js';
import { queryDatabase, executeSql } from '../../clientLib/db/api.js';
import { navigationMenuTree, renderMenuHierarchy, getFilteredMenuTree, syncMenuTreeFromDatabase } from './menuTree.js';
import { PxeEngine, mountPxeBuilderComponent } from '../../clientLib/pxeEngine.js';
import { mountFsdBuilder, parseStatementToFsdData, FsdCommitData } from '../../clientLib/fsd.js';
import { renderSegmentContentSurface } from './contentEditor.js';

export type CrudMode = 'create' | 'read' | 'update' | 'delete';

export interface TypeMapping {
    table: string;
    filterKind?: { column: string; value: string };
    label: string;
}

export const typeMap: Record<string, TypeMapping> = {
    segment: { table: 'segments', label: 'Segments' },
    segments: { table: 'segments', label: 'Segments' },
    axiom: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'axiom' }, label: 'Formal Axiom' },
    axioms: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'axiom' }, label: 'Formal Axioms' },
    theorem: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'theorem' }, label: 'Formal Theorem' },
    theorems: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'theorem' }, label: 'Formal Theorems' },
    directed_equality: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'directed_equality' }, label: 'Directed Equality (Formal)' },
    directed_equalities: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'directed_equality' }, label: 'Directed Equalities' },
    directed_equations: { table: 'formal_statements', filterKind: { column: 'statement_kind', value: 'directed_equality' }, label: 'Directed Equalities' },
    formal_statement: { table: 'formal_statements', label: 'All Formal Statements' },
    formal_statements: { table: 'formal_statements', label: 'All Formal Statements' },
    computational_stencil: { table: 'directed_equations', label: 'Computational Stencil' },
    computational_stencils: { table: 'directed_equations', label: 'Computational Stencils' },
    stencil: { table: 'directed_equations', label: 'Computational Stencil' },
    stencils: { table: 'directed_equations', label: 'Computational Stencils' },
    truth_table: { table: 'interactive_demos', filterKind: { column: 'engine', value: 'ttd' }, label: 'Truth Table Display (TTD)' },
    ttd: { table: 'interactive_demos', filterKind: { column: 'engine', value: 'ttd' }, label: 'Truth Table Demo (TTD)' },
    btd: { table: 'interactive_demos', filterKind: { column: 'engine', value: 'btd' }, label: 'Binary Tree Demo (BTD)' },
    bid: { table: 'interactive_demos', filterKind: { column: 'engine', value: 'bid' }, label: 'Binary Interval Demo (BID)' },
    fsd: { table: 'interactive_demos', filterKind: { column: 'engine', value: 'fsd' }, label: 'Formal Statements Demo (FSD)' },
    interactive_demo: { table: 'interactive_demos', label: 'Interactive Visual Demo' },
    interactive_demos: { table: 'interactive_demos', label: 'Interactive Demos' },
    demo_initialization: { table: 'interactive_demos', label: 'Demo Initialization' },
    demo_initializations: { table: 'interactive_demos', label: 'Demo Initializations' },
    pseudocode_algorithm: { table: 'pseudocode_algorithms', label: 'Pseudocode Algorithm' },
    pseudocode_algorithms: { table: 'pseudocode_algorithms', label: 'Pseudocode Algorithms' },
    algorithms: { table: 'pseudocode_algorithms', label: 'Pseudocode Algorithms' },
    symbols: { table: 'symbols', label: 'Symbols Glossary' },
    mode_slot: { table: 'mode_slots', label: 'Mode Slot' },
    mode_slots: { table: 'mode_slots', label: 'Mode Slots' },
    equation_statement_link: { table: 'equation_statement_links', label: 'Equation-Statement Link' },
    equation_statement_links: { table: 'equation_statement_links', label: 'Equation-Statement Links' },
    lean_verification: { table: 'lean_verifications', label: 'Lean Verification' },
    lean_verifications: { table: 'lean_verifications', label: 'Lean Verifications' },
    segment_reference: { table: 'segment_references', label: 'Segment Reference' },
    curriculum_nav_item: { table: 'curriculum_nav_items', label: 'Index Entry' },
    curriculum_nav_items: { table: 'curriculum_nav_items', label: 'Index Entries' },
    index_entry: { table: 'curriculum_nav_items', label: 'Index Entry' },
    index_entries: { table: 'curriculum_nav_items', label: 'Index Entries' },
    app_setting: { table: 'apps', label: 'App Setting' },
    apps: { table: 'apps', label: 'Apps' },
    domain: { table: 'domains', label: 'Mathematical Domain' },
    domains: { table: 'domains', label: 'Mathematical & Physical Domains' },
    lean_declaration: { table: 'lean_declarations', label: 'Lean Declaration' },
    lean_declarations: { table: 'lean_declarations', label: 'Lean 4 Formal Declarations' },
};

interface NavHistoryItem {
    mode: CrudMode;
    typeKey: string;
    tableName: string;
    id: string | null;
    title: string;
}

// Runtime State
let appMetadata: AppMetadata = {};
let navigations: TableNavigationPath[] = [];
let dependents: Dependent[] = [];

let currentMode: CrudMode = 'read';
let currentTypeKey: string | null = null;
let currentSelectedId: string | null = null;
let currentTitle: string = '';
const navHistory: NavHistoryItem[] = [];

// DOM References
let modeBtn: HTMLElement | null = null;
let modeDropdownMenu: HTMLElement | null = null;
let currentModeLabel: HTMLElement | null = null;
let typeBtn: HTMLElement | null = null;
let typeDropdownMenu: HTMLElement | null = null;
let currentTypeLabel: HTMLElement | null = null;
let subjectBtn: HTMLElement | null = null;
let subjectDropdownMenu: HTMLElement | null = null;
let currentSubjectLabel: HTMLElement | null = null;
let currentSubject: string = 'all';
let breadcrumbActiveType: HTMLElement | null = null;
let navBackBtn: HTMLElement | null = null;
let displayArea: HTMLElement | null = null;
let statusMessage: HTMLElement | null = null;
let statusTiming: HTMLElement | null = null;
let mainModal: HTMLElement | null = null;
let modalBody: HTMLElement | null = null;

/**
 * Determines the best human-readable column for a table in Middle Way Mathematics.
 */
export function getDisplayColumnName(tableName: string): string {
    const tableInfo = appMetadata[tableName];
    if (!tableInfo) return 'id';
    const cols = Object.keys(tableInfo.columns);
    if (cols.includes('title')) return 'title';
    if (cols.includes('name')) return 'name';
    if (cols.includes('topic')) return 'topic';
    if (cols.includes('theorem_name')) return 'theorem_name';
    if (cols.includes('statement_key')) return 'statement_key';
    if (cols.includes('equation_key')) return 'equation_key';
    if (cols.includes('algo_key')) return 'algo_key';
    if (cols.includes('seg_key')) return 'seg_key';
    if (cols.includes('label')) return 'label';
    if (cols.includes('symbol')) return 'symbol';
    if (cols.includes('preset_key')) return 'preset_key';
    if (cols.includes('target_key')) return 'target_key';
    if (cols.includes('app_code')) return 'app_code';
    return cols[0] || 'id';
}

/**
 * Resolves a comprehensive, human-friendly display name for an entity record.
 */
export function getRecordFriendlyName(tableName: string, record: any): string {
    if (!record) return '';
    switch (tableName) {
        case 'directed_equations':
            return `${record.title || record.label || 'Equation'} (${record.equation_key || record.id})`;
        case 'formal_statements':
            return `${record.title || record.expression || 'Statement'} (${record.statement_key || record.id})`;
        case 'pseudocode_algorithms':
            return `${record.title || record.name || 'Algorithm'} (${record.algo_key || record.id})`;
        case 'mode_slots':
            return `Slot #${record.slot_index}: ${record.symbol} (${record.label || record.unit || 'parameter'})`;
        case 'lean_verifications':
            return `Theorem ${record.theorem_name} [${record.proof_status || 'status'}]`;
        case 'curriculum_nav_items':
            return `#${record.sequence_order}: ${record.topic || record.nav_topic || 'Nav Item'}`;
        case 'segment_references':
            return `${record.ref_type}: ${record.target_key}${record.anchor_text ? ` ("${record.anchor_text}")` : ''}`;
        case 'segment_prerequisites':
            return `Prerequisite Seg #${record.prerequisite_segment_id} (${record.prereq_type || 'prereq'})`;
        case 'segments':
            return `${record.title || record.slug || 'Chapter'} (Seq: ${record.sequence_order || record.id})`;
        case 'apps':
            return `${record.name || 'App'} (${record.app_code || record.id})`;
        case 'interactive_demos': {
            if (record.engine === 'ttd') {
                let initObj: any = null;
                try {
                    initObj = typeof record.init_packet === 'object' ? record.init_packet : JSON.parse(record.init_packet || '{}');
                } catch (e) {
                    initObj = {};
                }
                const exp = record.expression || initObj?.exp || '';
                const fmt = initObj?.fmt || (exp ? PxeEngine.fmt(exp) : '');
                let status = record.status || initObj?.status;
                if (!status && exp) {
                    const evalRes = PxeEngine.evalTruthTable(exp);
                    status = evalRes?.isTautology ? 'taut' : (evalRes?.isContradiction ? 'unsat' : 'cont');
                }
                const statusSuffix = status ? ` [${status}]` : '';
                const titlePrefix = (record.title && record.title !== fmt && record.title !== exp) ? `${record.title} — ` : '';
                return `${titlePrefix}${fmt || exp || record.title || 'TTD'}${statusSuffix}`;
            }
            return `${record.title || 'Demo #' + record.id} (${record.engine || 'demo'}${record.mode ? ` - ${record.mode}` : ''})`;
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

/**
 * Returns the unique friendly key and title/label for a record.
 */
export function getRecordUniqueKeyDisplay(tableName: string, record: any): { key: string; label: string } {
    if (!record) return { key: '', label: '' };
    switch (tableName) {
        case 'segments':
            return {
                key: record.slug || record.seg_key || `#${record.id}`,
                label: record.title || record.slug || `Segment #${record.id}`
            };
        case 'formal_statements':
            return {
                key: record.statement_key || `#${record.id}`,
                label: record.title || record.expression || `Statement #${record.id}`
            };
        case 'pseudocode_algorithms':
            return {
                key: record.algo_key || `#${record.id}`,
                label: record.title || record.name || `Algorithm #${record.id}`
            };
        case 'interactive_demos':
            return {
                key: record.engine ? `${record.engine.toUpperCase()}: ${record.expression || record.id}` : `#${record.id}`,
                label: record.title || `Demo #${record.id}`
            };
        case 'curriculum_nav_items':
            return {
                key: record.nav_key || `#${record.id}`,
                label: record.topic || record.nav_topic || `Nav Item #${record.id}`
            };
        case 'apps':
            return {
                key: record.app_code || `#${record.id}`,
                label: record.name || `App #${record.id}`
            };
        case 'lean_declarations':
            return {
                key: record.name || `#${record.id}`,
                label: record.kind ? `[${record.kind}] ${record.name}` : record.name
            };
        case 'directed_equations':
            return {
                key: record.equation_key || `#${record.id}`,
                label: record.title || record.label || `Equation #${record.id}`
            };
        default: {
            const displayCol = getDisplayColumnName(tableName);
            return {
                key: record.key || record.slug || `#${record.id}`,
                label: record[displayCol] || `ID: ${record.id}`
            };
        }
    }
}

/**
 * Formats a clean badge string combining the unique friendly key and readable label.
 */
export function formatFkBadgeText(tableName: string, record: any): string {
    if (!record) return '-- None --';
    const info = getRecordUniqueKeyDisplay(tableName, record);
    if (info.key && info.label && info.key !== info.label) {
        return `${info.key} · ${info.label}`;
    }
    return info.key || info.label || `ID: ${record.id}`;
}

/**
 * Opens a modal picker to select a referenced child / parent entity.
 */
async function openChildRecordPickerModal(
    parentTable: string,
    colName: string,
    fkTable: string,
    isNullable: boolean,
    currentValue: string,
    onSelect: (record: any | null) => void
) {
    const tableInfo = appMetadata[fkTable];
    const targetLabel = tableInfo?.singularLabel || tableInfo?.label || fkTable;

    let orderCol = 'id';
    const candidateCols = Object.keys(tableInfo?.columns || {});
    if (candidateCols.includes('sequence_order')) orderCol = 'sequence_order';
    else if (candidateCols.includes('slug')) orderCol = 'slug';
    else if (candidateCols.includes('topic')) orderCol = 'topic';
    else if (candidateCols.includes('title')) orderCol = 'title';
    else if (candidateCols.includes('name')) orderCol = 'name';

    let records: any[] = [];
    try {
        let sql = `SELECT * FROM ${fkTable}`;
        if (parentTable === fkTable && currentSelectedId) {
            sql += ` WHERE id != ${parseInt(currentSelectedId, 10)}`;
        }
        sql += ` ORDER BY "${orderCol}" ASC, id ASC;`;
        records = (await queryDatabase<any>(sql)) || [];
    } catch (e) {
        console.error(`[openChildRecordPickerModal] Error fetching ${fkTable}:`, e);
    }

    const modal = document.createElement('div');
    modal.className = 'crud-modal open';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px);';

    modal.innerHTML = `
        <div style="background: #ffffff; border-radius: 8px; width: 680px; max-width: 92vw; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc;">
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">Select ${escapeHtml(targetLabel)}</h3>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Table: <code style="font-family: var(--font-mono);">${fkTable}</code> • Total: ${records.length} records</div>
                </div>
                <button type="button" class="btn-close-picker-modal" style="background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer; padding: 2px 8px; border-radius: 4px;">✕</button>
            </div>
            <div style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <input type="text" id="picker-search-input" placeholder="🔍 Search by key, title, slug, or ID..." style="width: 100%; box-sizing: border-box; padding: 8px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;" />
            </div>
            <div id="picker-records-list" style="flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px;">
                ${isNullable ? `
                    <div class="picker-item" data-id="" style="padding: 8px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border: 1px dashed #cbd5e1; color: #64748b; font-size: 13px; background: #f8fafc;">
                        <span>-- None (Unlink / Clear Association) --</span>
                        <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">NULL</span>
                    </div>
                ` : ''}
                ${records.map(r => {
                    const info = getRecordUniqueKeyDisplay(fkTable, r);
                    const isSelected = currentValue && currentValue.toString() === r.id.toString();
                    return `
                        <div class="picker-item" data-id="${r.id}" style="padding: 8px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border: 1px solid ${isSelected ? '#38bdf8' : '#e2e8f0'}; background: ${isSelected ? '#f0f9ff' : '#ffffff'}; transition: all 0.1s ease;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; background: #f1f5f9; color: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${escapeHtml(info.key)}</span>
                                <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${escapeHtml(info.label)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 11px; color: #94a3b8; font-family: var(--font-mono);">#${r.id}</span>
                                ${isSelected ? `<span style="font-size: 11px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">Selected</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: flex-end;">
                <button type="button" class="btn-close-picker-modal action-btn secondary" style="padding: 6px 14px; font-size: 12px;">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelectorAll('.btn-close-picker-modal').forEach(b => b.addEventListener('click', closeModal));

    const searchInput = modal.querySelector('#picker-search-input') as HTMLInputElement;
    const itemsList = modal.querySelector('#picker-records-list') as HTMLDivElement;
    searchInput.focus();

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        itemsList.querySelectorAll('.picker-item').forEach(el => {
            const itemEl = el as HTMLElement;
            const text = itemEl.textContent?.toLowerCase() || '';
            itemEl.style.display = text.includes(query) ? 'flex' : 'none';
        });
    });

    itemsList.querySelectorAll('.picker-item').forEach(el => {
        const itemEl = el as HTMLElement;
        itemEl.addEventListener('mouseenter', () => {
            itemEl.style.borderColor = '#0284c7';
            itemEl.style.background = '#f0f9ff';
        });
        itemEl.addEventListener('mouseleave', () => {
            const isSel = itemEl.getAttribute('data-id') === currentValue;
            itemEl.style.borderColor = isSel ? '#38bdf8' : '#e2e8f0';
            itemEl.style.background = isSel ? '#f0f9ff' : '#ffffff';
        });
        itemEl.addEventListener('click', () => {
            const chosenId = itemEl.getAttribute('data-id');
            if (!chosenId) {
                onSelect(null);
            } else {
                const found = records.find(r => r.id.toString() === chosenId);
                onSelect(found || null);
            }
            closeModal();
        });
    });
}

/**
 * Initializes the entire UI with validated metadata.
 */
export function initializeUI(
    metadata: AppMetadata,
    navs: TableNavigationPath[],
    deps: Dependent[]
) {
    appMetadata = metadata;
    navigations = navs;
    dependents = deps;

    modeBtn = document.getElementById('mode-btn');
    modeDropdownMenu = document.getElementById('mode-dropdown-menu');
    currentModeLabel = document.getElementById('current-mode-label');
    typeBtn = document.getElementById('type-btn');
    typeDropdownMenu = document.getElementById('type-dropdown-menu');
    currentTypeLabel = document.getElementById('current-type-label');
    subjectBtn = document.getElementById('subject-btn');
    subjectDropdownMenu = document.getElementById('subject-dropdown-menu');
    currentSubjectLabel = document.getElementById('current-subject-label');
    breadcrumbActiveType = document.getElementById('breadcrumb-active-type');
    navBackBtn = document.getElementById('nav-back-btn');
    displayArea = document.getElementById('display-area');
    statusMessage = document.getElementById('status-message');
    statusTiming = document.getElementById('status-timing');
    mainModal = document.getElementById('main-modal');
    modalBody = document.getElementById('modal-body');

    currentMode = 'read';
    currentTypeKey = null;
    currentSelectedId = null;
    currentTitle = '';
    currentSubject = 'all';

    if (currentModeLabel) currentModeLabel.textContent = 'Read';
    if (currentTypeLabel) currentTypeLabel.textContent = 'Select Type';
    if (currentSubjectLabel) currentSubjectLabel.textContent = 'All';

    updateBreadcrumbs();
    setupControlListeners();
    renderCurrentView();

    setStatus('Ready • Mode: Read (default) • Select mode, type, or subject');
}

/**
 * Setup event listeners for Mode and Type dropdowns, Back button, and Modal.
 */
function setupControlListeners() {
    // Mode dropdown toggle
    if (modeBtn && modeDropdownMenu) {
        modeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeDropdownMenu) typeDropdownMenu.classList.remove('show');
            modeDropdownMenu?.classList.toggle('show');
        });

        // Mode items
        modeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = (item as HTMLElement).getAttribute('data-mode') as CrudMode;
                if (mode) {
                    setMode(mode);
                    modeDropdownMenu?.classList.remove('show');
                }
            });
        });
    }

    // Build Hierarchical Type Menu
    if (typeDropdownMenu) {
        typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
    }

    // Type dropdown toggle
    if (typeBtn && typeDropdownMenu) {
        typeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modeDropdownMenu) modeDropdownMenu.classList.remove('show');
            typeDropdownMenu?.classList.toggle('show');
        });

        // Hierarchical Type items click delegation
        typeDropdownMenu.addEventListener('click', async (e) => {
            const targetItem = (e.target as HTMLElement).closest('.dropdown-item') as HTMLElement;
            if (!targetItem) return;

            const hasSubmenu = targetItem.classList.contains('has-submenu');
            const typeKey = targetItem.getAttribute('data-type');
            const instanceKey = targetItem.getAttribute('data-instance-key');
            const instanceId = targetItem.getAttribute('data-instance-id');
            const label = targetItem.getAttribute('data-label') || '';

            // In Create mode: if user clicks a leaf item with a typeKey (e.g. "Truth Table Demo (TTD)", "Axioms", etc.):
            // immediately select that type and launch the create form!
            if (currentMode === 'create' && typeKey && !hasSubmenu) {
                e.stopPropagation();
                typeDropdownMenu?.classList.remove('show');
                typeDropdownMenu?.querySelectorAll('.open-submenu').forEach((el) => el.classList.remove('open-submenu'));
                setType(typeKey);
                return;
            }

            // 1. Direct instance selection (leaf record)
            if (instanceKey || instanceId) {
                e.stopPropagation();
                typeDropdownMenu?.classList.remove('show');
                typeDropdownMenu?.querySelectorAll('.open-submenu').forEach((el) => el.classList.remove('open-submenu'));
                if (currentMode === 'create') {
                    setType(typeKey || currentTypeKey);
                } else {
                    await selectInstanceDirectly(typeKey || currentTypeKey, instanceKey || instanceId!, label);
                }
                return;
            }

            // 2. Item with attached submenu: toggle on click
            if (hasSubmenu) {
                e.stopPropagation();
                const isOpen = targetItem.classList.contains('open-submenu');
                // Close sibling open submenus at this level
                targetItem.parentElement?.querySelectorAll(':scope > .dropdown-item.open-submenu').forEach((el) => {
                    if (el !== targetItem) el.classList.remove('open-submenu');
                });
                if (isOpen) {
                    targetItem.classList.remove('open-submenu');
                } else {
                    targetItem.classList.add('open-submenu');
                    positionSubmenu(targetItem);
                }
                return;
            }

            // 3. Category leaf item (e.g., "Browse All Segments", "Browse All Axioms", or Relational Tables)
            if (typeKey) {
                e.stopPropagation();
                typeDropdownMenu?.classList.remove('show');
                typeDropdownMenu?.querySelectorAll('.open-submenu').forEach((el) => el.classList.remove('open-submenu'));
                setType(typeKey);
                return;
            }
        });

        const positionSubmenu = (item: HTMLElement) => {
            const submenu = item.querySelector(':scope > .dropdown-submenu') as HTMLElement;
            if (!submenu) return;

            submenu.style.left = '100%';
            submenu.style.right = 'auto';
            submenu.style.top = '-4px';

            const rect = submenu.getBoundingClientRect();
            // Flip to left if clipping right screen boundary
            if (rect.right > window.innerWidth - 15) {
                submenu.style.left = 'auto';
                submenu.style.right = '100%';
            }
            // Shift up if clipping bottom boundary
            if (rect.bottom > window.innerHeight - 15) {
                const overflowY = rect.bottom - (window.innerHeight - 15);
                submenu.style.top = `${Math.max(-rect.height + 30, -4 - overflowY)}px`;
            }
        };

        // Dynamic Submenu positioning on hover via delegation (retains functionality across re-renders)
        typeDropdownMenu.addEventListener('mouseover', (e) => {
            const item = (e.target as HTMLElement).closest('.dropdown-item.has-submenu') as HTMLElement;
            if (item && typeDropdownMenu.contains(item)) {
                positionSubmenu(item);
            }
        });
    }

    // Subject dropdown toggle
    if (subjectBtn && subjectDropdownMenu) {
        subjectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modeDropdownMenu) modeDropdownMenu.classList.remove('show');
            if (typeDropdownMenu) typeDropdownMenu.classList.remove('show');
            subjectDropdownMenu?.classList.toggle('show');
        });

        // Subject items selection
        subjectDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const subj = (item as HTMLElement).getAttribute('data-subject') || 'all';
                setSubject(subj);
                subjectDropdownMenu?.classList.remove('show');
            });
        });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        if (modeDropdownMenu) modeDropdownMenu.classList.remove('show');
        if (typeDropdownMenu) {
            typeDropdownMenu.classList.remove('show');
            typeDropdownMenu.querySelectorAll('.open-submenu').forEach((el) => el.classList.remove('open-submenu'));
        }
        if (subjectDropdownMenu) subjectDropdownMenu.classList.remove('show');
    });

    // Back button
    if (navBackBtn) {
        navBackBtn.addEventListener('click', () => {
            navigateBack();
        });
    }

    // Reset Studio button (follows Subject in control header)
    const resetStudioBtn = document.getElementById('btn-reset-studio');
    if (resetStudioBtn) {
        resetStudioBtn.addEventListener('click', () => {
            resetStudio();
        });
    }

    // Modal close
    const modalClose = document.getElementById('modal-close-button');
    if (modalClose && mainModal) {
        modalClose.addEventListener('click', closeModal);
    }

    // Ops Buttons: Backup DB, Prep/Build, Deploy
    const btnOpsBackup = document.getElementById('btn-ops-backup');
    if (btnOpsBackup) {
        btnOpsBackup.addEventListener('click', async () => {
            const originalText = btnOpsBackup.innerHTML;
            btnOpsBackup.innerHTML = '<span>⏳</span> Backing up...';
            (btnOpsBackup as HTMLButtonElement).disabled = true;
            setStatus('📦 Running PostgreSQL database backup...');
            try {
                const resp = await fetch('/api/ops/backup', { method: 'POST' });
                const data = await resp.json();
                if (data.status === 'success') {
                    setStatus('✓ PostgreSQL database backed up to db/backups/latest.sql');
                    showModal(`
                        <h3 style="color: #0369a1; margin-bottom: 8px;">📦 Database Backup Complete</h3>
                        <p style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                            The PostgreSQL database was successfully dumped to:
                            <br><code style="font-family: var(--font-mono); font-weight: 600;">db/backups/latest.sql</code>
                        </p>
                        <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11.5px; max-height: 180px; overflow-y: auto;">${escapeHtml(data.output || data.message)}</pre>
                        <div style="margin-top: 14px; text-align: right;">
                            <button class="action-btn primary" onclick="document.getElementById('main-modal').classList.remove('open')">Close</button>
                        </div>
                    `);
                } else {
                    throw new Error(data.message || 'Backup failed');
                }
            } catch (err: any) {
                setStatus('⚠️ Database backup failed: ' + err.message);
                alert('Backup error: ' + err.message);
            } finally {
                btnOpsBackup.innerHTML = originalText;
                (btnOpsBackup as HTMLButtonElement).disabled = false;
            }
        });
    }

    const btnOpsPrep = document.getElementById('btn-ops-prep');
    if (btnOpsPrep) {
        btnOpsPrep.addEventListener('click', async () => {
            const originalText = btnOpsPrep.innerHTML;
            btnOpsPrep.innerHTML = '<span>⏳</span> Prepping...';
            (btnOpsPrep as HTMLButtonElement).disabled = true;
            setStatus('⚙️ Running prep (database backup + distribution build)...');
            try {
                const resp = await fetch('/api/ops/prep', { method: 'POST' });
                const data = await resp.json();
                if (data.status === 'success') {
                    setStatus('✓ Prep complete: PostgreSQL backed up & app1/dist/index.html updated');
                    showModal(`
                        <h3 style="color: #4338ca; margin-bottom: 8px;">⚙️ Prep / Build Complete</h3>
                        <p style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                            PostgreSQL database backed up and distribution compiled into:
                            <br><code style="font-family: var(--font-mono); font-weight: 600;">app1/dist/index.html</code> (57 segments loaded from PostgreSQL).
                        </p>
                        <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11.5px; max-height: 180px; overflow-y: auto;">${escapeHtml(data.output || data.message)}</pre>
                        <div style="margin-top: 14px; text-align: right;">
                            <button class="action-btn primary" onclick="document.getElementById('main-modal').classList.remove('open')">Close</button>
                        </div>
                    `);
                } else {
                    throw new Error(data.message || 'Prep build failed');
                }
            } catch (err: any) {
                setStatus('⚠️ Prep build failed: ' + err.message);
                alert('Prep build error: ' + err.message);
            } finally {
                btnOpsPrep.innerHTML = originalText;
                (btnOpsPrep as HTMLButtonElement).disabled = false;
            }
        });
    }

    const btnOpsDeploy = document.getElementById('btn-ops-deploy');
    if (btnOpsDeploy) {
        btnOpsDeploy.addEventListener('click', () => {
            showModal(`
                <h3 style="color: #059669; margin-bottom: 8px;">🚀 Deploy to middlewaymath.app</h3>
                <p style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 14px;">
                    This will run <strong>prep</strong> (snapshot PostgreSQL database + compile all segments into <code>app1/dist/index.html</code>), sync overview and spec documents, and push directly to <strong>origin master</strong>.
                </p>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
                    <button class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                    <button class="action-btn" id="modal-btn-confirm-deploy" style="background: #059669; color: #ffffff; border: 1px solid #047857; font-weight: 700;">
                        🚀 Confirm &amp; Push to Production
                    </button>
                </div>
            `);

            document.getElementById('modal-btn-confirm-deploy')?.addEventListener('click', async () => {
                const modalTarget = document.getElementById('modal-body-content');
                if (modalTarget) {
                    modalTarget.innerHTML = `
                        <div style="text-align: center; padding: 24px 10px;">
                            <div style="font-size: 32px; margin-bottom: 12px; animation: spin 1s infinite linear;">🚀</div>
                            <h3 style="color: #059669; margin-bottom: 8px;">Deploying to Production...</h3>
                            <p style="color: #64748b; font-size: 13px;">Running prep, staging files, committing, and pushing to origin master...</p>
                        </div>
                    `;
                }
                setStatus('🚀 Deploying Mathematics and the Middle Way to middlewaymath.app...');
                try {
                    const resp = await fetch('/api/ops/deploy', { method: 'POST' });
                    const data = await resp.json();
                    if (data.status === 'success') {
                        setStatus('✓ Successfully deployed to middlewaymath.app!');
                        showModal(`
                            <h3 style="color: #059669; margin-bottom: 8px;">🎉 Deployment Succeeded!</h3>
                            <p style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                                Changes have been pushed to <code>origin master</code> and deployed live to <strong>middlewaymath.app</strong>!
                            </p>
                            <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11.5px; max-height: 200px; overflow-y: auto;">${escapeHtml(data.output || data.message)}</pre>
                            <div style="margin-top: 14px; text-align: right;">
                                <button class="action-btn primary" onclick="document.getElementById('main-modal').classList.remove('open')">Done</button>
                            </div>
                        `);
                    } else {
                        throw new Error(data.message || 'Deployment error');
                    }
                } catch (err: any) {
                    setStatus('⚠️ Deployment failed: ' + err.message);
                    showModal(`
                        <h3 style="color: #dc2626; margin-bottom: 8px;">⚠️ Deployment Failed</h3>
                        <p style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                            ${escapeHtml(err.message)}
                        </p>
                        <div style="margin-top: 14px; text-align: right;">
                            <button class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Close</button>
                        </div>
                    `);
                }
            });
        });
    }
}

/**
 * Fully resets CRUD Studio selection and navigation history, returning to initial clean landing state.
 */
export function resetStudio() {
    navHistory.length = 0;
    currentMode = 'read';
    currentTypeKey = null;
    currentSelectedId = null;
    currentTitle = '';
    currentSubject = 'all';

    if (currentModeLabel) currentModeLabel.textContent = 'Read';
    if (currentTypeLabel) currentTypeLabel.textContent = 'Select Type';
    if (currentSubjectLabel) currentSubjectLabel.textContent = 'All';

    // Close any open dropdowns
    modeDropdownMenu?.classList.remove('show');
    typeDropdownMenu?.classList.remove('show');
    subjectDropdownMenu?.classList.remove('show');

    if (modeDropdownMenu) {
        modeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            if ((item as HTMLElement).getAttribute('data-mode') === 'read') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    if (subjectDropdownMenu) {
        subjectDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            if ((item as HTMLElement).getAttribute('data-subject') === 'all') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    if (typeDropdownMenu) {
        typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree('all', 'read'));
        typeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.classList.remove('active');
        });
    }

    closeModal();
    updateBreadcrumbs();
    renderCurrentView();
    setStatus('Ready • Selection reset to clean landing state');
}

/**
 * Filter predicate evaluating whether a record belongs to the currently active Subject filter.
 */
export function matchesCurrentSubject(tableName: string, record: any): boolean {
    if (!currentSubject || currentSubject === 'all') return true;
    if (!record) return false;

    if (tableName === 'formal_statements') {
        const cat = record.domain_category || '';
        const subj = record.subject_type || '';
        const key = record.statement_key || '';

        switch (currentSubject) {
            case 'logic':
                return ['logic', 'set_theory', 'order_theory'].includes(cat) || key.startsWith('fs_pred_');
            case 'numbers_trees':
                return cat === 'arithmetic' || ['fs_tree2_totally_ordered', 'fs_dyadic_isomorphism', 'fs_van_den_dries_ehrlich', 'fs_conway_addition', 'fs_conway_multiplication'].includes(key);
            case 'algebra':
                return ['fs_cauchy_schwarz_discrete', 'fs_unit_rotor_projection', 'fs_euler_identity_rotor'].includes(key) || cat === 'linear_algebra';
            case 'analysis':
                return cat === 'discrete_analysis';
            case 'physics':
                return subj === 'physics' || cat === 'kinematics_and_dynamics';
            case 'information':
                return subj === 'information' || cat === 'information_and_signals';
            default:
                return true;
        }
    }

    if (tableName === 'interactive_demos') {
        const engine = record.engine || '';
        switch (currentSubject) {
            case 'logic':
                return engine === 'ttd';
            case 'numbers_trees':
                return engine === 'btd';
            case 'analysis':
                return engine === 'bid' || engine === 'fsd';
            case 'physics':
                return false;
            case 'information':
                return false;
            default:
                return true;
        }
    }

    return true;
}

/**
 * Updates the global subject filter lens, re-pruning the type menu and re-rendering active views.
 */
export function setSubject(subject: string) {
    currentSubject = subject;
    const labelMap: Record<string, string> = {
        all: 'All',
        logic: 'Logic & Set Theory',
        numbers_trees: 'Numbers & Trees',
        algebra: 'Vectors & Algebra',
        analysis: 'Continuum Analysis',
        physics: 'Applied Physics',
        information: 'Quantum & Bayesian Info'
    };

    if (currentSubjectLabel) {
        currentSubjectLabel.textContent = labelMap[subject] || subject;
    }

    if (subjectDropdownMenu) {
        subjectDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            if ((item as HTMLElement).getAttribute('data-subject') === subject) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Refresh Hierarchical Type Menu using the filtered tree for active subject and mode
    if (typeDropdownMenu) {
        typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
    }

    renderCurrentView();
    setStatus(`Subject Scope: ${labelMap[subject] || subject}`);
}

/**
 * Switches the current CRUD mode.
 * If an entity type is already active, preserves it so changing mode directly targets that entity.
 */
export function setMode(mode: CrudMode, preserveSelection: boolean = false) {
    currentMode = mode;
    if (currentModeLabel) currentModeLabel.textContent = capitalize(mode);

    if (modeDropdownMenu) {
        modeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            if ((item as HTMLElement).getAttribute('data-mode') === mode) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Refresh Hierarchical Type Menu to reflect mode:
    // In 'create' mode, the type menu strictly shows creatable types without instance children.
    // In 'read' / 'update' mode, the type menu provides the full instance tree.
    if (typeDropdownMenu) {
        typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
    }

    if (preserveSelection) {
        // Keep currentTypeKey and currentSelectedId intact (e.g. after save/cancel)
    } else if (mode === 'create') {
        // If switching to Create mode, clear selected instance ID so a blank form is initialized
        currentSelectedId = null;
    } else if (!currentTypeKey) {
        currentSelectedId = null;
        currentTitle = '';
        if (currentTypeLabel) currentTypeLabel.textContent = 'Select Type';
        if (typeDropdownMenu) {
            typeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
                item.classList.remove('active');
            });
        }
    }

    updateBreadcrumbs();
    renderCurrentView();
    setStatus(`Mode: ${capitalize(mode)} • ${currentTypeKey ? `Target: ${currentTypeKey}` : 'Select type'}`);
}

/**
 * Switches the current entity type.
 */
export function setType(typeKey: string, clearSelection = true) {
    currentTypeKey = typeKey;
    const mapping = typeMap[typeKey] || { table: typeKey, label: typeKey };
    if (clearSelection) {
        currentSelectedId = null;
        currentTitle = mapping.label;
    }
    if (currentTypeLabel) currentTypeLabel.textContent = mapping.label;

    if (typeDropdownMenu) {
        typeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            if ((item as HTMLElement).getAttribute('data-type') === typeKey) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateBreadcrumbs();
    renderCurrentView();
    setStatus(`Table: ${mapping.table} (${mapping.label})`);
}

/**
 * Navigates into a related entity (via Foreign Key or Child relationship).
 */
export function navigateToEntity(tableNameOrTypeKey: string, id: string, title: string) {
    const activeMapping = typeMap[currentTypeKey] || { table: currentTypeKey, label: currentTypeKey };

    navHistory.push({
        mode: currentMode,
        typeKey: currentTypeKey,
        tableName: activeMapping.table,
        id: currentSelectedId,
        title: currentTitle,
    });

    // Check if tableNameOrTypeKey is a typeKey or a direct table name
    let resolvedTypeKey = tableNameOrTypeKey;
    if (!typeMap[tableNameOrTypeKey]) {
        // Find matching typeKey for this table name
        const found = Object.keys(typeMap).find((k) => typeMap[k].table === tableNameOrTypeKey);
        if (found) resolvedTypeKey = found;
        else {
            // Register ad-hoc type mapping
            typeMap[tableNameOrTypeKey] = {
                table: tableNameOrTypeKey,
                label: appMetadata[tableNameOrTypeKey]?.label || tableNameOrTypeKey,
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

/**
 * Returns to previous entity in navigation history.
 */
export function navigateBack() {
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
    setStatus(`Returned to ${mapping.table} #${currentSelectedId || 'list'}`);
}

/**
 * Directly selects an instance by unique key or ID and immediately displays its attributes/card.
 */
export async function selectInstanceDirectly(typeKey: string, instanceKeyOrId: string | number, label?: string) {
    let resolvedTypeKey = typeKey;
    const mapping = typeMap[typeKey] || { table: typeKey, label: typeKey };
    const tableName = mapping.table;

    // 1. Fetch record from database
    let record: any = null;
    const strKey = String(instanceKeyOrId);

    // Legacy demo key lookup fallback (backwards compatibility for bookmarked slugs)
    const legacyDemoMap: Record<string, number> = {
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
    } else if (tableName === 'interactive_demos' && legacyDemoMap[strKey]) {
        record = await fetchRecordById(tableName, legacyDemoMap[strKey].toString());
    }

    if (!record) {
        const tableCols = appMetadata[tableName] ? Object.keys(appMetadata[tableName].columns) : [];
        const candidateKeys = [
            'nav_key', 'seg_key', 'statement_key', 'equation_key', 'algo_key',
            'expression', 'preset_key', 'app_code', 'symbol', 'target_key', 'slug', 'name', 'title'
        ];

        for (const col of candidateKeys) {
            if (tableCols.includes(col)) {
                try {
                    const rows = await queryDatabase<any>(
                        `SELECT * FROM ${tableName} WHERE "${col}" = $1 LIMIT 1;`,
                        [strKey]
                    );
                    if (rows && rows.length > 0) {
                        record = rows[0];
                        break;
                    }
                } catch {
                    // continue search
                }
            }
        }

        if (!record && tableName === 'curriculum_nav_items') {
            try {
                const navRows = await queryDatabase<any>(
                    `SELECT cni.* FROM curriculum_nav_items cni 
                     JOIN segments s ON s.id = cni.segment_id 
                     WHERE s.seg_key = $1 OR s.slug = $1 LIMIT 1;`,
                    [strKey]
                );
                if (navRows && navRows.length > 0) record = navRows[0];
            } catch {
                // continue search
            }
        }
    }

    if (!record) {
        console.warn(`[selectInstanceDirectly] Record not found in ${tableName} for key: ${instanceKeyOrId}`);
        setStatus(`Record '${instanceKeyOrId}' not found in ${tableName}`);
        setType(typeKey);
        return;
    }

    // If this is a formal statement, align the specific typeKey to its statement_kind
    if (tableName === 'formal_statements' && record.statement_kind) {
        resolvedTypeKey = record.statement_kind;
    } else if (tableName === 'interactive_demos' && record.engine && typeMap[record.engine]) {
        resolvedTypeKey = record.engine;
    }

    currentTypeKey = resolvedTypeKey;
    const activeMapping = typeMap[currentTypeKey] || { table: tableName, label: capitalize(resolvedTypeKey) };
    if (currentTypeLabel) currentTypeLabel.textContent = activeMapping.label;

    currentSelectedId = record.id.toString();
    const displayCol = getDisplayColumnName(tableName);
    currentTitle = record[displayCol] || label || `ID: ${record.id}`;

    // Highlight in type menu if present
    if (typeDropdownMenu) {
        typeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            const itemType = (item as HTMLElement).getAttribute('data-type');
            const itemInst = (item as HTMLElement).getAttribute('data-instance-key') || (item as HTMLElement).getAttribute('data-instance-id');
            if (itemInst === strKey || itemInst === currentSelectedId || (itemType === currentTypeKey && !itemInst)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateBreadcrumbs();

    // Render directly based on mode
    if (currentMode === 'create') {
        renderRecordForm(tableName, null, true);
    } else if (currentMode === 'update') {
        renderRecordForm(tableName, record, false);
    } else if (currentMode === 'delete') {
        renderDeleteConfirmation(tableName, record);
    } else {
        // READ MODE
        await renderEntityInspectorView(tableName, activeMapping.filterKind);
    }

    setStatus(`Loaded ${activeMapping.label}: ${currentTitle} (#${record.id})`);
}

/**
 * Updates breadcrumb trail and back button visibility.
 */
function updateBreadcrumbs() {
    const breadcrumbMode = document.getElementById('breadcrumb-mode');
    if (breadcrumbMode) {
        breadcrumbMode.textContent = `Mode: ${capitalize(currentMode)}`;
    }

    if (!currentTypeKey) {
        if (breadcrumbActiveType) {
            breadcrumbActiveType.innerHTML = `<span style="color: #64748b; font-style: italic;">Select Type</span>`;
        }
        if (navBackBtn) navBackBtn.style.display = 'none';
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
            navBackBtn.style.display = 'inline-flex';
            navBackBtn.innerHTML = `<span>← Back to ${escapeHtml(last.title || last.tableName)}</span>`;
        } else {
            navBackBtn.style.display = 'none';
        }
    }
}

function setStatus(msg: string) {
    if (statusMessage) statusMessage.textContent = msg;
    if (statusTiming) statusTiming.textContent = new Date().toLocaleTimeString();
}

function showModal(contentHtml: string, isWide: boolean = false) {
    if (modalBody && mainModal) {
        const modalContent = mainModal.querySelector('.modal-content');
        if (modalContent) {
            if (isWide) modalContent.classList.add('wide');
            else modalContent.classList.remove('wide');
        }
        modalBody.innerHTML = contentHtml;
        mainModal.classList.add('open');
    }
}

function closeModal() {
    if (mainModal) {
        mainModal.classList.remove('open');
    }
}

// =============================================================================
// MAIN DISPATCHER & LANDING / WELCOME SCREEN
// =============================================================================
// MAIN DISPATCHER & INITIAL DISPLAY
// =============================================================================

/**
 * Renders the clean, professional initial display prompting to select mode and instance.
 * Single path to target via the toolbar dropdown controls above.
 */
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

/**
 * Renders an instance picker for Update or Delete actions when a type is chosen but no instance selected yet.
 */
async function renderEntityInstancePickerForAction(
    tableName: string,
    action: 'update' | 'delete',
    filterKind?: { column: string; value: string }
) {
    if (!displayArea) return;

    const tableInfo = appMetadata[tableName];
    if (!tableInfo) return;
    const displayCol = getDisplayColumnName(tableName);

    const actionVerb = action === 'update' ? 'Edit' : 'Delete';
    const actionColor = action === 'update' ? '#d97706' : '#dc2626';
    const actionIcon = action === 'update' ? '✏️' : '🗑️';

    displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="inspector-container">
                <div class="instance-bar" style="background: ${action === 'update' ? '#fffbeb' : '#fef2f2'}; border-color: ${action === 'update' ? '#fde68a' : '#fecaca'};">
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

    const selectEl = document.getElementById('entity-instance-action-select') as HTMLSelectElement;
    const targetEl = document.getElementById('inspector-action-target') as HTMLDivElement;

    try {
        let sql = `SELECT * FROM ${tableName}`;
        const params: any[] = [];
        if (filterKind) {
            sql += ` WHERE "${filterKind.column}" = $1`;
            params.push(filterKind.value);
        }
        sql += ` ORDER BY "${displayCol}" ASC;`;

        const allRecords = (await queryDatabase<any>(sql, params)) || [];
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
                        🌐 Clear Subject Filter (Show All)
                    </button>
                </div>
            `;
            document.getElementById('btn-reset-subject-scope-action')?.addEventListener('click', () => setSubject('all'));
            return;
        }

        selectEl.innerHTML = `
            <option value="">-- Select ${tableInfo.singularLabel || tableInfo.label} to ${actionVerb} (${records.length}${currentSubject !== 'all' ? ` of ${allRecords.length}` : ''} available) --</option>
            ${records
                .map(
                    (r) =>
                        `<option value="${r.id}">
                            ${escapeHtml(getRecordFriendlyName(tableName, r))} (ID: ${r.id})
                        </option>`
                )
                .join('')}
        `;

        const triggerActionOnRecord = async (record: any) => {
            currentSelectedId = record.id.toString();
            currentTitle = getRecordFriendlyName(tableName, record);
            updateBreadcrumbs();

            if (action === 'update') {
                await renderRecordForm(tableName, record, false);
            } else {
                renderDeleteConfirmation(tableName, record);
            }
        };

        const filterScopeBanner = currentSubject !== 'all' ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px; margin-bottom: 14px;">
                <span style="font-size: 12.5px; font-weight: 600; color: #1d4ed8;">
                    Filtered by Subject: <strong>${escapeHtml(currentSubjectLabel?.textContent || currentSubject)}</strong> (${records.length} of ${allRecords.length} records)
                </span>
                <button type="button" id="btn-clear-active-filter-action" style="background: none; border: none; font-size: 12px; font-weight: 700; color: #2563eb; cursor: pointer;">
                    ✕ Clear Scope
                </button>
            </div>
        ` : '';

        targetEl.innerHTML = `
            <div class="instance-menu-card">
                ${filterScopeBanner}
                <div class="instance-menu-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 style="color: ${actionColor};">${actionIcon} Select a Record to ${actionVerb} (${records.length}${currentSubject !== 'all' ? ` filtered from ${allRecords.length}` : ''} Available)</h3>
                    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">
                        Click any item below or choose from the dropdown above to immediately initiate the ${actionVerb.toLowerCase()} workflow.
                    </p>
                </div>
                <div class="instance-menu-list">
                    ${records
                        .map((r) => {
                            const friendlyTitle = r[displayCol] || `ID: ${r.id}`;
                            const key = r.equation_key || r.statement_key || r.algo_key || r.seg_key || r.symbol || r.preset_key || '';
                            const desc = r.formula_description || r.description || r.summary || '';
                            return `
                                <div class="instance-menu-item" data-id="${r.id}" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; background: #ffffff;">
                                    <div style="flex: 1;">
                                        <div class="instance-item-title" style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-weight: 600; color: #0f172a;">${escapeHtml(friendlyTitle)}</span>
                                            ${key ? `<code class="instance-key-badge">${escapeHtml(key)}</code>` : ''}
                                            <span class="instance-id-badge">#${r.id}</span>
                                        </div>
                                        ${desc ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(desc.slice(0, 120))}${desc.length > 120 ? '...' : ''}</div>` : ''}
                                    </div>
                                    <button class="btn btn-sm" style="background: ${actionColor}; color: #ffffff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer;">
                                        ${actionIcon} ${actionVerb}
                                    </button>
                                </div>
                            `;
                        })
                        .join('')}
                </div>
            </div>
        `;

        targetEl.querySelector('#btn-clear-active-filter-action')?.addEventListener('click', () => {
            setSubject('all');
        });

        targetEl.querySelectorAll('.instance-menu-item').forEach((item) => {
            item.addEventListener('click', () => {
                const id = (item as HTMLElement).getAttribute('data-id')!;
                const record = records.find((r: any) => r.id.toString() === id);
                if (record) {
                    triggerActionOnRecord(record);
                }
            });
        });

        selectEl.addEventListener('change', () => {
            const id = selectEl.value;
            if (!id) return;
            const record = records.find((r: any) => r.id.toString() === id);
            if (record) {
                triggerActionOnRecord(record);
            }
        });
    } catch (err) {
        console.error(`[renderEntityInstancePickerForAction] Error:`, err);
        targetEl.innerHTML = `<div style="padding: 24px; color: #dc2626;">Error querying ${tableName}: ${(err as Error).message}</div>`;
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

    // 1. CREATE MODE: Table is known, initiate new record form immediately
    if (currentMode === 'create') {
        renderRecordForm(tableName, null, true);
        return;
    }

    // 2. UPDATE / MODIFY MODE
    if (currentMode === 'update') {
        if (currentSelectedId) {
            const record = await fetchRecordById(tableName, currentSelectedId);
            if (record) {
                await renderRecordForm(tableName, record, false);
                return;
            }
        }
        await renderEntityInstancePickerForAction(tableName, 'update', mapping.filterKind);
        return;
    }

    // 3. DELETE MODE
    if (currentMode === 'delete') {
        if (currentSelectedId) {
            const record = await fetchRecordById(tableName, currentSelectedId);
            if (record) {
                renderDeleteConfirmation(tableName, record);
                return;
            }
        }
        await renderEntityInstancePickerForAction(tableName, 'delete', mapping.filterKind);
        return;
    }

    // 4. READ MODE (INSPECT)
    await renderEntityInspectorView(tableName, mapping.filterKind);
}

// =============================================================================
// READ: GENERAL ENTITY INSPECTOR VIEW (Covers Every Actual DB Attribute)
// =============================================================================

async function renderEntityInspectorView(tableName: string, filterKind?: { column: string; value: string }) {
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

    const selectEl = document.getElementById('entity-instance-select') as HTMLSelectElement;
    const cardTarget = document.getElementById('inspector-card-target') as HTMLDivElement;

    // Fetch instances for dropdown and menu
    try {
        let sql = `SELECT * FROM ${tableName}`;
        const params: any[] = [];
        if (filterKind) {
            sql += ` WHERE "${filterKind.column}" = $1`;
            params.push(filterKind.value);
        }
        sql += ` ORDER BY "${displayCol}" ASC;`;

        const allRecords = (await queryDatabase<any>(sql, params)) || [];
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
                        🌐 Clear Subject Filter (Show All)
                    </button>
                </div>
            `;
            document.getElementById('btn-reset-subject-scope')?.addEventListener('click', () => setSubject('all'));
            return;
        }

        selectEl.innerHTML = `
            <option value="" ${!currentSelectedId ? 'selected' : ''}>-- Select ${tableInfo.singularLabel || tableInfo.label} (${records.length}${currentSubject !== 'all' ? ` of ${allRecords.length}` : ''} available) --</option>
            ${records
                .map(
                    (r) =>
                        `<option value="${r.id}" ${currentSelectedId === r.id.toString() ? 'selected' : ''}>
                            ${escapeHtml(getRecordFriendlyName(tableName, r))} (ID: ${r.id})
                        </option>`
                )
                .join('')}
        `;

        const showInstanceSelectionMenu = () => {
            currentSelectedId = null;
            selectEl.value = '';
            const mapping = typeMap[currentTypeKey] || { table: tableName, label: tableInfo.label };
            currentTitle = mapping.label;
            updateBreadcrumbs();
            const filterScopeBanner = currentSubject !== 'all' ? `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px; margin-bottom: 14px;">
                    <span style="font-size: 12.5px; font-weight: 600; color: #1d4ed8;">
                        Filtered by Subject: <strong>${escapeHtml(currentSubjectLabel?.textContent || currentSubject)}</strong> (${records.length} of ${allRecords.length} records)
                    </span>
                    <button type="button" id="btn-clear-active-filter" style="background: none; border: none; font-size: 12px; font-weight: 700; color: #2563eb; cursor: pointer;">
                        ✕ Clear Scope
                    </button>
                </div>
            ` : '';

            cardTarget.innerHTML = `
                <div class="instance-menu-card">
                    ${filterScopeBanner}
                    <div class="instance-menu-header">
                        <h3>Available ${tableInfo.label} (${records.length}${currentSubject !== 'all' ? ` filtered from ${allRecords.length}` : ''})</h3>
                        <p>Select an instance below or from the dropdown menu above to inspect its complete database attributes.</p>
                    </div>
                    <div class="instance-menu-list">
                        ${records
                            .map((r) => {
                                const friendlyTitle = getRecordFriendlyName(tableName, r);
                                const key = r.equation_key || r.statement_key || r.algo_key || r.seg_key || r.symbol || r.preset_key || '';
                                const formula = r.formula_expr || r.expression || r.signature || '';
                                const desc = r.formula_description || r.description || r.summary || '';
                                return `
                                    <div class="instance-menu-item" data-id="${r.id}">
                                        <div style="flex: 1;">
                                            <div class="instance-item-title">
                                                <span>${escapeHtml(friendlyTitle)}</span>
                                                ${key ? `<code class="instance-key-badge">${escapeHtml(key)}</code>` : ''}
                                                ${r.statement_kind ? `<span class="kind-badge kind-${escapeHtml(r.statement_kind)}">${escapeHtml(r.statement_kind)}</span>` : ''}
                                                ${r.tier ? `<span class="tier-badge tier-${escapeHtml(r.tier)}">${escapeHtml(r.tier)}</span>` : ''}
                                                <span class="instance-id-badge">#${r.id}</span>
                                            </div>
                                            ${formula ? `<div class="instance-item-formula">${escapeHtml(formula)}</div>` : ''}
                                            ${desc ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">${escapeHtml(desc.slice(0, 140))}${desc.length > 140 ? '...' : ''}</div>` : ''}
                                        </div>
                                        <div style="color: var(--primary); font-size: 13px; font-weight: 700; margin-left: 12px;">
                                            Inspect ↗
                                        </div>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                </div>
            `;

            cardTarget.querySelector('#btn-clear-active-filter')?.addEventListener('click', () => {
                setSubject('all');
            });

            cardTarget.querySelectorAll('.instance-menu-item').forEach((item) => {
                item.addEventListener('click', () => {
                    const id = (item as HTMLElement).getAttribute('data-id')!;
                    inspectInstance(id);
                });
            });
        };

        const inspectInstance = async (id: string) => {
            currentSelectedId = id;
            selectEl.value = id;
            const fullRecord = records.find((r: any) => r.id.toString() === id) || (await fetchRecordById(tableName, id));
            if (fullRecord) {
                currentTitle = getRecordFriendlyName(tableName, fullRecord);
                updateBreadcrumbs();
                cardTarget.innerHTML = `
                    <button class="back-to-menu-btn" id="btn-back-to-menu">
                        <span>‹ Back to ${tableInfo.label} Selection Menu</span>
                    </button>
                `;
                const card = await renderAttributeCompleteCard(tableName, fullRecord);
                cardTarget.appendChild(card);

                document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
                    showInstanceSelectionMenu();
                });
            }
        };

        if (currentSelectedId) {
            await inspectInstance(currentSelectedId);
        } else {
            showInstanceSelectionMenu();
        }

        selectEl.addEventListener('change', async () => {
            if (selectEl.value === '') {
                showInstanceSelectionMenu();
            } else {
                await inspectInstance(selectEl.value);
            }
        });
    } catch (err) {
        console.error(`[renderEntityInspectorView] Error loading ${tableName}:`, err);
        cardTarget.innerHTML = `<div style="padding: 24px; color: #dc2626;">Error querying table ${tableName}: ${(err as Error).message}</div>`;
    }
}

// =============================================================================
// SEGMENT AUTHORING & READER VIEW BRIDGE
// =============================================================================

/**
 * Renders the full Segment Content authoring surface / reader inside #display-area.
 */
export async function renderSegmentAuthoringView(record: any, mode: 'read' | 'update' = 'read') {
    if (!displayArea) return;
    currentSelectedId = record.id.toString();
    currentTitle = record.title || record.slug || `Segment #${record.id}`;
    updateBreadcrumbs();

    await renderSegmentContentSurface({
        container: displayArea,
        segmentRecord: record,
        initialMode: mode,
        onBack: () => {
            renderCurrentView();
        },
        onSaved: (updatedRecord) => {
            currentTitle = updatedRecord.title || updatedRecord.slug || `Segment #${updatedRecord.id}`;
            updateBreadcrumbs();
        },
        onSwitchMode: (newMode) => {
            setMode(newMode, true);
        }
    });
}

// =============================================================================
// ATTRIBUTE COMPLETE CARD (Exposes Every DB Attribute, FK, and Child Rel)
// =============================================================================

async function renderAttributeCompleteCard(tableName: string, record: any): Promise<HTMLDivElement> {
    const tableInfo = appMetadata[tableName];
    const displayCol = getDisplayColumnName(tableName);
    const container = document.createElement('div');

    const card = document.createElement('div');
    card.className = 'attribute-card';

    // Header bar
    const titleVal = getRecordFriendlyName(tableName, record);
    card.innerHTML = `
        <div class="card-header-bar">
            <div>
                <h2 class="card-main-title">${escapeHtml(titleVal)}</h2>
                <div class="card-meta-line">
                    <span>Table: <strong style="font-family: var(--font-mono); color: var(--primary);">${tableName}</strong></span>
                    <span>•</span>
                    <span>Primary Key: <strong>id = ${record.id}</strong></span>
                    <span>•</span>
                    <span>Total Columns: <strong>${Object.keys(tableInfo.columns).length}</strong></span>
                </div>
            </div>
        </div>
    `;

    // Attribute Table
    const table = document.createElement('table');
    table.className = 'attr-table';
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

    const tbody = table.querySelector('tbody')!;

    for (const colName of Object.keys(tableInfo.columns)) {
        const colMeta = tableInfo.columns[colName];
        const rawVal = record[colName];

        const tr = document.createElement('tr');

        // Column Name
        const tdName = document.createElement('td');
        tdName.className = 'attr-col-name';
        tdName.innerHTML = `
            <div>${escapeHtml(colName)}</div>
            ${colMeta.label && colMeta.label !== colName ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">${escapeHtml(colMeta.label)}</div>` : ''}
        `;
        tr.appendChild(tdName);

        // Data Type & Constraints
        const tdType = document.createElement('td');
        tdType.className = 'attr-col-type';
        const flags: string[] = [];
        if (colMeta.isPrimaryKey) flags.push('<span style="color: var(--primary); font-weight: 700;">PK</span>');
        if (colMeta.isForeignKey) flags.push('<span style="color: #7c3aed; font-weight: 700;">FK</span>');
        if (!colMeta.isNullable) flags.push('NOT NULL');
        else flags.push('NULLABLE');
        if (colMeta.isEnum) flags.push('ENUM');

        tdType.innerHTML = `
            <div>${escapeHtml(colMeta.dbDataType.toUpperCase())}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${flags.join(' • ')}</div>
        `;
        tr.appendChild(tdType);

        // Value
        const tdVal = document.createElement('td');
        tdVal.className = 'attr-col-val';

        if (colMeta.isForeignKey && colMeta.foreignKeyTable) {
            // Foreign Key Resolution Link (with sparse down-arrow button - always present)
            const fkTable = colMeta.foreignKeyTable;
            const hasVal = rawVal !== null && rawVal !== undefined && rawVal !== '';

            const group = document.createElement('div');
            group.className = 'fk-field-group';
            group.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';

            const badge = document.createElement('span');
            badge.className = 'fk-friendly-badge';
            badge.style.cssText = 'font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 4px 10px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; min-height: 28px;';
            badge.textContent = hasVal ? `Loading ${fkTable} #${rawVal}...` : '-- None --';

            const navBtn = document.createElement('button');
            navBtn.type = 'button';
            navBtn.className = 'btn-nav-child-arrow';
            navBtn.setAttribute('data-table', fkTable);
            navBtn.setAttribute('data-id', hasVal ? rawVal.toString() : '');
            navBtn.textContent = '↓';

            if (hasVal) {
                navBtn.title = `Drill down to ${appMetadata[fkTable]?.singularLabel || fkTable} #${rawVal}`;
                navBtn.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-size: 14px; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; line-height: 1; transition: all 0.15s ease;';
                navBtn.addEventListener('click', () => {
                    navigateToEntity(fkTable, rawVal.toString(), badge.textContent || `${fkTable} #${rawVal}`);
                });

                queryDatabase<any>(`SELECT * FROM ${fkTable} WHERE id = $1;`, [rawVal])
                    .then((rows) => {
                        if (rows && rows.length > 0) {
                            badge.textContent = formatFkBadgeText(fkTable, rows[0]);
                        }
                    })
                    .catch(() => {});
            } else {
                navBtn.title = 'No referenced child linked';
                navBtn.disabled = true;
                navBtn.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-size: 14px; font-weight: 700; color: #94a3b8; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: not-allowed; opacity: 0.5; line-height: 1;';
            }

            group.appendChild(badge);
            group.appendChild(navBtn);
            tdVal.appendChild(group);
        } else if (rawVal === null || rawVal === undefined) {
            tdVal.innerHTML = `<span class="null-badge">NULL</span>`;
        } else if (typeof rawVal === 'boolean') {
            tdVal.innerHTML = rawVal
                ? `<span style="color: var(--emerald); font-weight: 700;">TRUE</span>`
                : `<span style="color: #64748b; font-weight: 700;">FALSE</span>`;
        } else if (tableName === 'formal_statements' && colName === 'expression') {
            const expStr = rawVal ? rawVal.toString() : '';
            tdVal.innerHTML = `
                <div style="padding: 10px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: inline-block; min-width: 320px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                    <div style="font-size: 19px; font-weight: 700; color: #1e3a8a; font-family: 'Cambria Math', Georgia, serif; letter-spacing: 0.5px;">
                        ${escapeHtml(expStr || '—')}
                    </div>
                </div>
            `;
        } else if (tableName === 'formal_statements' && (colName === 'lean_signature' || colName === 'lean_snippet')) {
            const code = rawVal ? rawVal.toString() : '';
            if (!code) {
                tdVal.innerHTML = `<span class="null-badge">NULL</span>`;
            } else {
                tdVal.innerHTML = `
                    <pre class="raw-code-box" style="background: #0f172a; color: #38bdf8; font-family: var(--font-mono); font-size: 12px; padding: 10px 14px; border-radius: 6px; border: 1px solid #1e293b; white-space: pre-wrap; word-break: break-word; margin: 0; max-height: 240px; overflow-y: auto;">${escapeHtml(code)}</pre>
                `;
            }
        } else if (tableName === 'formal_statements' && colName === 'status') {
            const st = rawVal ? rawVal.toString() : '';
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let badgeLabel = st || 'None';
            if (st === 'published') {
                badgeBg = '#ecfdf5';
                badgeColor = '#047857';
                badgeLabel = '✓ Published';
            } else if (st === 'verified') {
                badgeBg = '#ecfdf5';
                badgeColor = '#059669';
                badgeLabel = '🛡️ Verified';
            } else if (st === 'under_review') {
                badgeBg = '#eff6ff';
                badgeColor = '#1d4ed8';
                badgeLabel = '🔍 Under Review';
            } else if (st === 'staged') {
                badgeBg = '#fffbeb';
                badgeColor = '#d97706';
                badgeLabel = '⚡ Staged';
            } else if (st === 'draft') {
                badgeBg = '#f1f5f9';
                badgeColor = '#475569';
                badgeLabel = '📝 Draft';
            }
            tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 12px; background: ${badgeBg}; color: ${badgeColor}; display: inline-flex; align-items: center; gap: 4px;">${escapeHtml(badgeLabel)}</span>`;
        } else if (tableName === 'formal_statements' && colName === 'tier') {
            const trVal = rawVal ? rawVal.toString() : '';
            let tBg = '#f1f5f9';
            let tColor = '#475569';
            let tIcon = '🏷️';
            if (trVal === 'constitutional') {
                tBg = '#faf5ff';
                tColor = '#7e22ce';
                tIcon = '🏛️';
            } else if (trVal === 'law') {
                tBg = '#eef2ff';
                tColor = '#4338ca';
                tIcon = '⚖️';
            } else if (trVal === 'scenario') {
                tBg = '#f0f9ff';
                tColor = '#0369a1';
                tIcon = '🌐';
            }
            tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 12px; background: ${tBg}; color: ${tColor}; display: inline-flex; align-items: center; gap: 4px;">${tIcon} ${escapeHtml(trVal)}</span>`;
        } else if (tableName === 'formal_statements' && colName === 'statement_kind') {
            const kVal = rawVal ? rawVal.toString() : '';
            let kBg = '#f8fafc';
            let kColor = '#334155';
            let kIcon = '📌';
            if (kVal === 'axiom') {
                kBg = '#fffbeb';
                kColor = '#b45309';
                kIcon = '📜';
            } else if (kVal === 'theorem') {
                kBg = '#f0fdfa';
                kColor = '#0f766e';
                kIcon = '💎';
            } else if (kVal === 'directed_equality') {
                kBg = '#eff6ff';
                kColor = '#1d4ed8';
                kIcon = '⇌';
            }
            tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 12px; background: ${kBg}; color: ${kColor}; display: inline-flex; align-items: center; gap: 4px;">${kIcon} ${escapeHtml(kVal)}</span>`;
        } else if (tableName === 'formal_statements' && colName === 'domain_category') {
            tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; font-family: var(--font-mono);">${escapeHtml(rawVal.toString())}</span>`;
        } else if (tableName === 'formal_statements' && colName === 'referenced_segments') {
            const segs = Array.isArray(rawVal) ? rawVal : (typeof rawVal === 'string' ? rawVal.replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean) : []);
            if (segs.length === 0) {
                tdVal.innerHTML = `<span style="color: #94a3b8; font-style: italic;">No segments citing this statement</span>`;
            } else {
                tdVal.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${segs.map((s: string) => `<span style="font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-family: var(--font-mono);">${escapeHtml(s)}</span>`).join('')}
                    </div>
                `;
            }
        } else if (tableName === 'interactive_demos' && colName === 'expression') {
            const expStr = rawVal ? rawVal.toString() : '';
            const isFsd = record.engine === 'fsd';

            if (isFsd) {
                let initObj: any = null;
                try {
                    initObj = typeof record.init_packet === 'object' ? record.init_packet : JSON.parse(record.init_packet || '{}');
                } catch (e) {}

                const quantifiers = initObj?.quantifiers || '';
                const slots = initObj?.slots ? `(${initObj.slots})` : '';
                const predSym = PxeEngine.charDisplayMap[expStr] || expStr;
                const innerPred = slots ? `${predSym}${slots}` : predSym;
                const displayFormula = quantifiers ? `${quantifiers} [ ${innerPred} ]` : innerPred;

                tdVal.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                            <code style="font-family: var(--font-mono); font-weight: 700; color: #7c3aed; background: #f5f3ff; padding: 4px 10px; border-radius: 4px; font-size: 13px;">Predicate: ${escapeHtml(expStr || '—')}</code>
                            <span style="font-size: 20px; font-weight: 700; color: #1e3a8a; font-family: 'Cambria Math', Georgia, serif;">${escapeHtml(displayFormula)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #64748b;">
                            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                                Active: Stage ${escapeHtml(initObj?.stage || '4')} (Matrix Visualizer)
                            </span>
                            ${initObj?.slots ? `<span>Bound Slots: <strong style="color: #334155;">${escapeHtml(initObj.slots)}</strong></span>` : ''}
                        </div>
                    </div>
                `;
            } else {
                const fmtStr = expStr ? PxeEngine.fmt(expStr) : '';
                tdVal.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <code style="font-family: var(--font-mono); font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; font-size: 13px;">${escapeHtml(expStr || '—')}</code>
                        <span style="font-size: 19px; font-weight: 700; color: firebrick; font-family: 'Cambria Math', Georgia, serif;">${escapeHtml(fmtStr)}</span>
                    </div>
                `;
            }
        } else if (tableName === 'interactive_demos' && colName === 'status') {
            const st = rawVal ? rawVal.toString() : '';
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let badgeLabel = st || 'None';
            if (st === 'taut') {
                badgeBg = '#ecfdf5';
                badgeColor = '#047857';
                badgeLabel = '⚖️ Tautology [taut]';
            } else if (st === 'unsat') {
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                badgeLabel = '⚠️ Unsatisfiable [unsat]';
            } else if (st === 'cont') {
                badgeBg = '#f1f5f9';
                badgeColor = '#0284c7';
                badgeLabel = 'Contingent [cont]';
            }
            tdVal.innerHTML = `<span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; background: ${badgeBg}; color: ${badgeColor};">${escapeHtml(badgeLabel)}</span>`;
        } else if (tableName === 'interactive_demos' && colName === 'init_packet') {
            tdVal.innerHTML = `
                <details style="font-size: 11px; color: #64748b;">
                    <summary style="cursor: pointer; font-weight: 600;">View Raw JSON Packet</summary>
                    <pre class="raw-code-box" style="margin-top: 4px;">${escapeHtml(typeof rawVal === 'object' ? JSON.stringify(rawVal, null, 2) : (rawVal || '').toString())}</pre>
                </details>
            `;
        } else if (typeof rawVal === 'object') {
            tdVal.innerHTML = `<pre class="raw-code-box">${escapeHtml(JSON.stringify(rawVal, null, 2))}</pre>`;
        } else if (colName === 'content_html') {
            tdVal.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 2px 0;">
                    <span style="font-size: 13px; font-weight: 600; color: #1e293b;">HTML Lecture Body</span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${(rawVal.length / 1024).toFixed(1)} KB (${rawVal.length.toLocaleString()} chars)
                    </span>
                    <button type="button" class="action-btn primary btn-open-content-editor" style="font-size: 11.5px; padding: 4px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;">
                        📖 View &amp; Inspect in Content Editor
                    </button>
                </div>
            `;
            tdVal.querySelector('.btn-open-content-editor')?.addEventListener('click', () => {
                renderSegmentAuthoringView(record, 'read');
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



    container.appendChild(card);

    // Attach click events for Foreign Key links (and sparse down-arrow buttons)
    card.querySelectorAll('.btn-nav-child-arrow, .fk-goto-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const fkTable = (btn as HTMLElement).getAttribute('data-table') || (btn as HTMLElement).getAttribute('data-fktable')!;
            const fkId = (btn as HTMLElement).getAttribute('data-id') || (btn as HTMLElement).getAttribute('data-fkid')!;
            if (fkId) {
                navigateToEntity(fkTable, fkId, `${fkTable} #${fkId}`);
            }
        });
    });

    return container;
}

/**
 * Renders the child records list under a parent record.
 * Strictly adheres to the relational master-detail rule:
 * Parent display does not display child info/columns; describes children via friendly names
 * (single text field if 1 child, menu if multiple children) + button to inspect.
 */
async function renderChildRecordsList(
    childTable: string,
    fkColumn: string,
    parentId: string | number,
    childLabel: string,
    target: HTMLDivElement
) {
    target.style.display = 'block';
    target.innerHTML = `<div style="padding: 12px; color: #64748b;">Loading child records for ${escapeHtml(childLabel)}...</div>`;

    const childMeta = appMetadata[childTable];

    try {
        const sql = `SELECT * FROM ${childTable} WHERE "${fkColumn}" = $1 ORDER BY id ASC;`;
        const rows = await queryDatabase<any>(sql, [parentId]);

        if (!rows || rows.length === 0) {
            target.innerHTML = `
                <div style="padding: 14px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px;">
                    <div style="color: #64748b; font-size: 13px;">No child records found in <strong>${escapeHtml(childTable)}</strong> for this record.</div>
                </div>
            `;
            return;
        }

        const singular = childMeta?.singularLabel || childLabel;

        if (rows.length === 1) {
            const child = rows[0];
            const friendlyName = getRecordFriendlyName(childTable, child);
            target.innerHTML = `
                <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px; padding: 14px 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">
                            ${escapeHtml(singular)}:
                        </span>
                        <input type="text" readonly value="${escapeHtml(friendlyName)}" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                        <button type="button" class="btn btn-sm action-btn primary goto-child-single-btn" data-id="${child.id}" data-name="${escapeHtml(friendlyName)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">
                            Inspect ${escapeHtml(singular)} ↗
                        </button>
                    </div>
                </div>
            `;

            target.querySelector('.goto-child-single-btn')?.addEventListener('click', () => {
                navigateToEntity(childTable, child.id.toString(), friendlyName);
            });
        } else {
            target.innerHTML = `
                <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px; padding: 14px 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">
                            ${escapeHtml(childLabel)} (${rows.length}):
                        </span>
                        <select class="child-select-menu" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                            ${rows
                                .map((r: any) => {
                                    const friendlyName = getRecordFriendlyName(childTable, r);
                                    return `<option value="${r.id}" data-name="${escapeHtml(friendlyName)}">${escapeHtml(friendlyName)}</option>`;
                                })
                                .join('')}
                        </select>
                        <button type="button" class="btn btn-sm action-btn primary goto-child-multi-btn" style="padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">
                            Inspect Selected ↗
                        </button>
                    </div>
                </div>
            `;

            const selectEl = target.querySelector('.child-select-menu') as HTMLSelectElement;
            target.querySelector('.goto-child-multi-btn')?.addEventListener('click', () => {
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    const friendlyName = opt?.getAttribute('data-name') || `${singular} #${selectEl.value}`;
                    navigateToEntity(childTable, selectEl.value, friendlyName);
                }
            });
        }
    } catch (e) {
        target.innerHTML = `<div style="padding: 12px; color: #dc2626;">Error loading child records: ${(e as Error).message}</div>`;
    }
}

// =============================================================================
// EDIT & CREATE FORM (Full Parameterized SQL Mutation)
// =============================================================================

async function renderRecordForm(tableName: string, record: any = null, isNew: boolean = false) {
    if (!displayArea) return;

    const tableInfo = appMetadata[tableName];
    const displayCol = getDisplayColumnName(tableName);
    const activeMapping = typeMap[currentTypeKey || ''];
    const entityLabel = activeMapping?.label || tableInfo.singularLabel || tableInfo.label;
    const formTitle = isNew
        ? `Create New ${entityLabel}`
        : `Modify ${entityLabel}: ${record ? getRecordFriendlyName(tableName, record) || `ID: ${record.id}` : ''}`;

    // 1. Fetch available instances of this table (to support top instance-bar matching Read UI)
    let records: any[] = [];
    if (!isNew) {
        try {
            let sql = `SELECT * FROM ${tableName}`;
            const params: any[] = [];
            if (activeMapping?.filterKind) {
                sql += ` WHERE "${activeMapping.filterKind.column}" = $1`;
                params.push(activeMapping.filterKind.value);
            }
            sql += ` ORDER BY "${displayCol}" ASC;`;
            const allRecords = (await queryDatabase<any>(sql, params)) || [];
            records = allRecords.filter((r) => matchesCurrentSubject(tableName, r));
        } catch (e) {
            console.error('[renderRecordForm] Error fetching records:', e);
        }
    }

    const instanceBarHtml = !isNew ? `
        <div class="instance-bar">
            <div class="instance-select-group">
                <span class="instance-select-label">Select ${tableInfo.singularLabel || tableInfo.label}:</span>
                <select id="entity-instance-select" class="instance-select">
                    <option value="">-- Select ${tableInfo.singularLabel || tableInfo.label} (${records.length} available) --</option>
                    ${records
                        .map(
                            (r) =>
                                `<option value="${r.id}" ${record && record.id === r.id ? 'selected' : ''}>
                                    ${escapeHtml(getRecordFriendlyName(tableName, r))} (ID: ${r.id})
                                </option>`
                        )
                        .join('')}
                </select>
            </div>
        </div>
    ` : '';

    displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="inspector-container">
                ${instanceBarHtml}
                <div id="inspector-card-target">
                    <form id="active-crud-form">
                        <div class="attribute-card">
                            <div class="card-header-bar">
                                <div>
                                    <h2 class="card-main-title">${escapeHtml(formTitle)}</h2>
                                    <div class="card-meta-line">
                                        <span>Table: <strong style="font-family: var(--font-mono); color: var(--primary);">${tableName}</strong></span>
                                        <span>•</span>
                                        <span>Primary Key: <strong>${record ? `id = ${record.id}` : 'New'}</strong></span>
                                        <span>•</span>
                                        <span>Mode: <strong style="color: var(--primary);">${isNew ? 'INSERT' : 'UPDATE'}</strong></span>
                                        <span>•</span>
                                        <span>Total Columns: <strong>${Object.keys(tableInfo.columns).length}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <table class="attr-table">
                                <thead>
                                    <tr>
                                        <th style="width: 220px;">DB Attribute (Column)</th>
                                        <th style="width: 170px;">Data Type &amp; Constraint</th>
                                        <th>Database Value &amp; Relationships (Editable)</th>
                                    </tr>
                                </thead>
                                <tbody id="form-fields-target"></tbody>
                            </table>
                            <div class="form-actions-footer" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
                                <button type="submit" class="action-btn primary btn-save-record-footer" style="padding: 7px 18px; font-weight: 700;">
                                    💾 ${isNew ? 'Create Record' : 'Save Changes'}
                                </button>
                                <button type="button" class="action-btn secondary btn-cancel-edit" style="padding: 7px 14px;">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    const fieldsTarget = document.getElementById('form-fields-target')!;
    const form = document.getElementById('active-crud-form') as HTMLFormElement;

    // Instance dropdown switcher
    const selectEl = document.getElementById('entity-instance-select') as HTMLSelectElement | null;
    if (selectEl) {
        selectEl.addEventListener('change', async () => {
            const nextId = selectEl.value;
            if (nextId) {
                currentSelectedId = nextId;
                const nextRec = await fetchRecordById(tableName, nextId);
                if (nextRec) {
                    currentTitle = getRecordFriendlyName(tableName, nextRec);
                    updateBreadcrumbs();
                    await renderRecordForm(tableName, nextRec, false);
                }
            }
        });
    }

    for (const colName of Object.keys(tableInfo.columns)) {
        const colMeta = tableInfo.columns[colName];

        // Skip auto-generated primary key on create
        if (colMeta.isPrimaryKey && isNew) continue;

        let val = record ? record[colName] : '';
        if (isNew && tableName === 'interactive_demos') {
            if (colName === 'engine') {
                if (currentTypeKey === 'ttd' || currentTypeKey === 'truth_table') val = 'ttd';
                else if (currentTypeKey === 'btd') val = 'btd';
                else if (currentTypeKey === 'bid') val = 'bid';
                else if (currentTypeKey === 'fsd') val = 'fsd';
            }
            if (colName === 'mode') {
                if (currentTypeKey === 'ttd' || currentTypeKey === 'truth_table') val = 'propositional_logic';
            }
        }
        if (isNew && tableName === 'formal_statements') {
            if (colName === 'statement_kind') {
                if (currentTypeKey === 'axiom') val = 'axiom';
                else if (currentTypeKey === 'theorem') val = 'theorem';
                else if (currentTypeKey === 'directed_equality') val = 'directed_equality';
            }
        }

        const tr = document.createElement('tr');

        // Column Name
        const tdName = document.createElement('td');
        tdName.className = 'attr-col-name';
        tdName.innerHTML = `
            <div>${escapeHtml(colName)}</div>
            ${colMeta.label && colMeta.label !== colName ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">${escapeHtml(colMeta.label)}</div>` : ''}
        `;
        tr.appendChild(tdName);

        // Data Type & Constraints
        const tdType = document.createElement('td');
        tdType.className = 'attr-col-type';
        const flags: string[] = [];
        if (colMeta.isPrimaryKey) flags.push('<span style="color: var(--primary); font-weight: 700;">PK</span>');
        if (colMeta.isForeignKey) flags.push('<span style="color: #7c3aed; font-weight: 700;">FK</span>');
        if (!colMeta.isNullable) flags.push('NOT NULL');
        else flags.push('NULLABLE');
        if (colMeta.isEnum) flags.push('ENUM');

        tdType.innerHTML = `
            <div>${escapeHtml(colMeta.dbDataType.toUpperCase())}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${flags.join(' • ')}</div>
        `;
        tr.appendChild(tdType);

        // Value / Input cell
        const tdVal = document.createElement('td');
        tdVal.className = 'attr-col-val';

        let inputElement: HTMLElement;

        if (colMeta.isPrimaryKey || !colMeta.canModify) {
            const pkContainer = document.createElement('div');
            pkContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
            const pkVal = val !== null && val !== undefined ? val.toString() : 'Auto-generated';
            pkContainer.innerHTML = `
                <span style="font-family: var(--font-mono); font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; display: inline-block;">
                    ${escapeHtml(pkVal)}
                </span>
                <span style="font-size: 11px; color: #64748b;">(Immutable PK)</span>
                ${!isNew && val !== null && val !== undefined ? `<input type="hidden" id="field-${colName}" name="${colName}" value="${escapeHtml(val.toString())}" />` : ''}
            `;
            inputElement = pkContainer;
        } else if (tableName === 'segments' && colName === 'content_html') {
            const container = document.createElement('div');
            const rawHtml = val !== null && val !== undefined ? val.toString() : '';
            const kbSize = (rawHtml.length / 1024).toFixed(1);
            const charCount = rawHtml.length.toLocaleString();

            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 2px 0;">
                    <span style="font-size: 13px; font-weight: 600; color: #1e293b;">HTML Lecture Body</span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${kbSize} KB (${charCount} chars)
                    </span>
                    <button type="button" class="action-btn primary btn-open-authoring-surface" style="font-size: 11.5px; padding: 4px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;">
                        ✏️ Open in Full Authoring Surface
                    </button>
                    <input type="hidden" id="field-${colName}" name="${colName}" value="${escapeHtml(rawHtml)}" />
                </div>
            `;

            container.querySelector('.btn-open-authoring-surface')?.addEventListener('click', () => {
                if (record) {
                    renderSegmentAuthoringView(record, 'update');
                }
            });

            inputElement = container;
        } else if (colMeta.isEnum) {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.style.maxWidth = '320px';

            if (colMeta.isNullable) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = '-- (None / NULL) --';
                select.appendChild(opt);
            }

            colMeta.enumValues.forEach((ev) => {
                const opt = document.createElement('option');
                opt.value = ev;
                let optLabel = ev;
                if (colName === 'status' && tableName === 'interactive_demos') {
                    if (ev === 'taut') optLabel = 'taut (Tautology)';
                    else if (ev === 'unsat') optLabel = 'unsat (Unsatisfiable / Contradiction)';
                    else if (ev === 'cont') optLabel = 'cont (Contingent)';
                }
                opt.textContent = optLabel;
                if (val === ev) opt.selected = true;
                select.appendChild(opt);
            });
            inputElement = select;
        } else if (colMeta.dbDataType === 'boolean') {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.style.maxWidth = '160px';

            const optTrue = document.createElement('option');
            optTrue.value = 'true';
            optTrue.textContent = 'TRUE';
            if (val === true || val === 'true') optTrue.selected = true;

            const optFalse = document.createElement('option');
            optFalse.value = 'false';
            optFalse.textContent = 'FALSE';
            if (val === false || val === 'false') optFalse.selected = true;

            select.appendChild(optTrue);
            select.appendChild(optFalse);
            inputElement = select;
        } else if (colName === 'target_domain' || (tableName === 'mode_slots' && colName === 'domain')) {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.style.maxWidth = '540px';
            select.innerHTML = `<option value="">Loading MWM domains from database...</option>`;

            queryDatabase<any>('SELECT domain_key, symbol, name, lean_type, base_unit FROM domains ORDER BY id ASC;')
                .then((domainRows) => {
                    if (domainRows && domainRows.length > 0) {
                        select.innerHTML = `
                            <option value="">-- Select Valid MWM Domain (Lean-Anchored) --</option>
                            ${domainRows
                                .map((d: any) => {
                                    const isSel = val === d.domain_key || val === d.symbol;
                                    const leanPart = d.lean_type ? ` [Lean: ${escapeHtml(d.lean_type)}]` : '';
                                    const unitPart = d.base_unit ? ` (${escapeHtml(d.base_unit)})` : '';
                                    return `<option value="${escapeHtml(d.domain_key)}" ${isSel ? 'selected' : ''}>
                                        ${escapeHtml(d.symbol)} — ${escapeHtml(d.name)}${unitPart}${leanPart}
                                    </option>`;
                                })
                                .join('')}
                        `;
                    }
                })
                .catch((err) => {
                    console.error('[renderRecordForm] Error fetching domains:', err);
                });

            inputElement = select;
        } else if (tableName === 'formal_statements' && colName === 'domain_category') {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.style.maxWidth = '360px';
            const categories = [
                { val: 'logic', label: 'Logic & Metamathematics (logic)' },
                { val: 'arithmetic', label: 'Arithmetic & Number Spines (arithmetic)' },
                { val: 'discrete_analysis', label: 'Discrete Analysis & Transects (discrete_analysis)' },
                { val: 'order_theory', label: 'Order Theory & Lattices (order_theory)' },
                { val: 'information_and_signals', label: 'Information & Signals (information_and_signals)' },
                { val: 'set_theory', label: 'Set Theory & Hypersets (set_theory)' },
                { val: 'kinematics_and_dynamics', label: 'Kinematics & Dynamics (kinematics_and_dynamics)' }
            ];
            categories.forEach((cat) => {
                const opt = document.createElement('option');
                opt.value = cat.val;
                opt.textContent = cat.label;
                if (val === cat.val) opt.selected = true;
                select.appendChild(opt);
            });
            inputElement = select;
        } else if (colMeta.isForeignKey && colMeta.foreignKeyTable) {
            const fkTable = colMeta.foreignKeyTable;
            const hasVal = val !== null && val !== undefined && val !== '';

            const container = document.createElement('div');
            container.className = 'fk-field-group';
            container.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';

            const badge = document.createElement('span');
            badge.id = `field-${colName}-display`;
            badge.className = 'fk-friendly-badge';
            badge.style.cssText = 'font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 4px 10px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; min-height: 28px;';
            badge.textContent = hasVal ? `Loading ${fkTable} #${val}...` : '-- None --';

            const navBtn = document.createElement('button');
            navBtn.type = 'button';
            navBtn.id = `field-${colName}-nav-btn`;
            navBtn.className = 'btn-nav-child-arrow';
            navBtn.setAttribute('data-table', fkTable);
            navBtn.setAttribute('data-id', hasVal ? val.toString() : '');
            navBtn.textContent = '↓';

            const updateNavBtnState = (targetId: string | null) => {
                if (targetId) {
                    navBtn.disabled = false;
                    navBtn.setAttribute('data-id', targetId);
                    navBtn.title = `Drill down to ${appMetadata[fkTable]?.singularLabel || fkTable} #${targetId}`;
                    navBtn.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-size: 14px; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; line-height: 1; transition: all 0.15s ease;';
                } else {
                    navBtn.disabled = true;
                    navBtn.setAttribute('data-id', '');
                    navBtn.title = 'No referenced child linked';
                    navBtn.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-size: 14px; font-weight: 700; color: #94a3b8; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: not-allowed; opacity: 0.5; line-height: 1;';
                }
            };

            updateNavBtnState(hasVal ? val.toString() : null);

            navBtn.addEventListener('click', () => {
                const targetId = navBtn.getAttribute('data-id');
                if (targetId) {
                    navigateToEntity(fkTable, targetId, badge.textContent || `${fkTable} #${targetId}`);
                }
            });

            const pickerBtn = document.createElement('button');
            pickerBtn.type = 'button';
            pickerBtn.id = `field-${colName}-picker-btn`;
            pickerBtn.className = 'action-btn secondary btn-open-fk-picker';
            pickerBtn.style.cssText = 'padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; border-radius: 4px; border: 1px solid var(--border-color); background: #ffffff; min-height: 28px;';
            pickerBtn.innerHTML = '✎ Select Child';

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = `field-${colName}`;
            hiddenInput.name = colName;
            hiddenInput.value = hasVal ? val.toString() : '';

            if (hasVal) {
                queryDatabase<any>(`SELECT * FROM ${fkTable} WHERE id = $1;`, [val])
                    .then((rows) => {
                        if (rows && rows.length > 0) {
                            badge.textContent = formatFkBadgeText(fkTable, rows[0]);
                        }
                    })
                    .catch(() => {});
            }

            pickerBtn.addEventListener('click', () => {
                openChildRecordPickerModal(
                    tableName,
                    colName,
                    fkTable,
                    colMeta.isNullable,
                    hiddenInput.value,
                    (selectedRecord) => {
                        if (!selectedRecord) {
                            hiddenInput.value = '';
                            badge.textContent = '-- None --';
                            updateNavBtnState(null);
                        } else {
                            hiddenInput.value = selectedRecord.id.toString();
                            badge.textContent = formatFkBadgeText(fkTable, selectedRecord);
                            updateNavBtnState(selectedRecord.id.toString());
                        }
                    }
                );
            });

            container.appendChild(badge);
            container.appendChild(navBtn);
            container.appendChild(pickerBtn);
            container.appendChild(hiddenInput);

            inputElement = container;
        } else if (colName === 'content_html') {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; max-width: 650px;';

            const summaryRow = document.createElement('div');
            summaryRow.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 2px 0;';

            const strVal = val ? val.toString() : '';
            summaryRow.innerHTML = `
                <span style="font-size: 13px; font-weight: 600; color: #1e293b;">HTML Lecture Body</span>
                <span id="field-${colName}-stats" style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                    ${(strVal.length / 1024).toFixed(1)} KB (${strVal.length.toLocaleString()} chars)
                </span>
                <button type="button" class="action-btn primary btn-open-content-editor-update" style="font-size: 11.5px; padding: 4px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;">
                    ✏️ Open in Content Editor
                </button>
            `;

            const details = document.createElement('details');
            details.style.cssText = 'margin-top: 4px; font-size: 12px; color: #64748b;';
            details.innerHTML = `<summary style="cursor: pointer; font-weight: 600; margin-bottom: 6px;">View / Direct Edit Raw HTML</summary>`;

            const textarea = document.createElement('textarea');
            textarea.id = `field-${colName}`;
            textarea.name = colName;
            textarea.rows = colMeta.rows || 6;
            textarea.className = 'form-textarea';
            textarea.style.maxWidth = '650px';
            textarea.value = strVal;

            textarea.addEventListener('input', () => {
                const stats = summaryRow.querySelector(`#field-${colName}-stats`);
                if (stats) {
                    const l = textarea.value.length;
                    stats.textContent = `${(l / 1024).toFixed(1)} KB (${l.toLocaleString()} chars)`;
                }
            });

            summaryRow.querySelector('.btn-open-content-editor-update')?.addEventListener('click', () => {
                const tempRecord = { ...record, [colName]: textarea.value };
                renderSegmentContentSurface({
                    container: displayArea!,
                    segmentRecord: tempRecord,
                    initialMode: 'update',
                    onBack: () => {
                        renderRecordForm(tableName, record, isNew);
                    },
                    onSaved: (updatedRecord) => {
                        textarea.value = updatedRecord.content_html || '';
                        record.content_html = textarea.value;
                        const stats = summaryRow.querySelector(`#field-${colName}-stats`);
                        if (stats) {
                            const l = textarea.value.length;
                            stats.textContent = `${(l / 1024).toFixed(1)} KB (${l.toLocaleString()} chars)`;
                        }
                    }
                });
            });

            details.appendChild(textarea);
            wrapper.appendChild(summaryRow);
            wrapper.appendChild(details);
            inputElement = wrapper;
        } else if (colMeta.rows && colMeta.rows > 1) {
            const textarea = document.createElement('textarea');
            textarea.id = `field-${colName}`;
            textarea.name = colName;
            textarea.rows = colMeta.rows || 3;
            textarea.className = 'form-textarea';
            textarea.style.maxWidth = '650px';
            textarea.value = val !== null && val !== undefined
                ? (typeof val === 'object' ? JSON.stringify(val, null, 2) : val.toString())
                : '';
            inputElement = textarea;

            // Interactive demo init_packet: clean collapsible details
            if (tableName === 'interactive_demos' && colName === 'init_packet') {
                const details = document.createElement('details');
                details.style.cssText = 'margin-top: 4px; font-size: 12px; color: #64748b;';
                details.innerHTML = `<summary style="cursor: pointer; font-weight: 600; margin-bottom: 6px;">View / Direct Edit Raw JSON Packet</summary>`;
                details.appendChild(textarea);
                inputElement = details;
            }
        } else if (tableName === 'interactive_demos' && colName === 'expression') {
            const expWrapper = document.createElement('div');
            expWrapper.style.cssText = 'display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 4px;';
            const expVal = val !== null && val !== undefined ? val.toString() : '';
            const isFsd = (record && record.engine === 'fsd') || currentTypeKey === 'fsd';

            let initObj: any = null;
            try {
                initObj = typeof record?.init_packet === 'object' ? record.init_packet : JSON.parse(record?.init_packet || '{}');
            } catch (e) {}

            let initialDisplay = '—';
            if (isFsd) {
                const quantifiers = initObj?.quantifiers || '∀x₁:ℕ ∃x₂:ℕ';
                const slots = initObj?.slots ? `(${initObj.slots})` : '';
                const predSym = PxeEngine.charDisplayMap[expVal] || expVal || 'GT';
                initialDisplay = `${quantifiers} [ ${predSym}${slots} ]`;
            } else {
                initialDisplay = expVal ? PxeEngine.fmt(expVal) : '—';
            }

            expWrapper.innerHTML = `
                <input type="text" id="field-${colName}" name="${colName}" value="${escapeHtml(expVal)}" readonly
                    style="width: 220px; padding: 7px 10px; font-family: var(--font-mono); font-size: 13px; font-weight: 700; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;"
                    title="Click to open ${isFsd ? 'FSD Quantified Statement' : 'Propositional Expression'} Editor" />
                <div id="preview-field-${colName}" style="font-size: 18px; font-weight: 700; color: ${isFsd ? '#1e3a8a' : 'firebrick'}; font-family: 'Cambria Math', Georgia, serif; min-width: 140px; cursor: pointer;" title="Live mathematical display">
                    ${escapeHtml(initialDisplay)}
                </div>
                <button type="button" id="btn-open-pxe-editor" class="action-btn secondary" style="padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">
                    ${isFsd ? '📐 Edit FSD Statement' : '✎ Edit Proposition'}
                </button>
            `;

            const openEditor = async () => {
                const expInput = expWrapper.querySelector(`#field-${colName}`) as HTMLInputElement;
                let curExp = expInput ? expInput.value : expVal;

                if (isFsd) {
                    // 1. Load constructed formal statements from Tier 1 for direct selection
                    let constructedStmts: any[] = [];
                    try {
                        constructedStmts = (await queryDatabase<any>(
                            "SELECT id, statement_key, title, statement_kind, expression, description FROM formal_statements ORDER BY statement_kind ASC, id ASC;"
                        )) || [];
                    } catch (e) {
                        console.error('[openEditor] Error loading constructed formal statements:', e);
                    }

                    // 2. Load all Boolean Directed Equalities from PostgreSQL
                    let predEquations: any[] = [];
                    try {
                        predEquations = (await queryDatabase<any>(
                            "SELECT id, equation_key, title, formula_expr, target_symbol FROM directed_equations WHERE target_domain IN ('B_w', '𝔹', 'B') ORDER BY id ASC;"
                        )) || [];
                    } catch (e) {
                        console.error('[openEditor] Error loading predicate DEs:', e);
                    }

                    // Map code <-> equation_key
                    const codeToEqMap: Record<string, string> = {
                        'j': 'eq_pred_assign',
                        'r': 'eq_pred_gt',
                        's': 'eq_pred_lt',
                        'k': 'eq_pred_eq',
                        'l': 'eq_pred_le',
                        'm': 'eq_pred_mem',
                        'b': 'eq_pred_subset',
                        'v': 'eq_pred_even',
                        'd': 'eq_pred_odd',
                        'u': 'eq_pred_succ',
                        'w': 'eq_pred_near',
                        'c': 'eq_pred_div'
                    };
                    const eqToCodeMap: Record<string, string> = {};
                    Object.entries(codeToEqMap).forEach(([k, v]) => { eqToCodeMap[v] = k; });

                    let currentCode = curExp || 'r';
                    let currentQuantifiers = initObj?.quantifiers || '∀x₁:ℕ ∃x₂:ℕ';
                    let currentSlots = initObj?.slots || 'x₁,x₂';
                    let currentStage = initObj?.stage || '4';

                    const updateLivePreview = () => {
                        const previewTarget = document.getElementById('modal-fsd-live-preview');
                        if (!previewTarget) return;
                        const quant = (document.getElementById('modal-fsd-quantifiers') as HTMLInputElement)?.value || '';
                        const sl = (document.getElementById('modal-fsd-slots') as HTMLInputElement)?.value || '';
                        const predSel = document.getElementById('modal-fsd-pred-select') as HTMLSelectElement;
                        const selectedCode = predSel?.value || currentCode;
                        const symbol = PxeEngine.charDisplayMap[selectedCode] || selectedCode;
                        const slotsPart = sl ? `(${sl})` : '';
                        previewTarget.textContent = `${quant} [ ${symbol}${slotsPart} ]`;
                    };

                    showModal(`
                        <h3 style="margin-bottom: 6px; font-size: 16px; color: #0f172a;">📐 Formal Statement Demo (FSD) Quantified Statement Builder</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 14px;">
                            In Middle Way Math, a predicate <strong>is</strong> a Directed Equality with codomain 𝔹. Select an existing constructed formal statement from Tier 1, or configure the predicate DE and quantifier bindings manually:
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;">
                            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px; padding: 10px 14px;">
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 4px;">
                                    🏛️ Initialize from Constructed Formal Statement (Tier 1):
                                </label>
                                <select id="modal-fsd-constructed-fs-select" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid #86efac; border-radius: 4px; background: #ffffff; color: #14532d; font-weight: 600;">
                                    <option value="">-- Choose a constructed FS / DE to initialize FSD (${constructedStmts.length} available) --</option>
                                    ${constructedStmts.map((s) => `
                                        <option value="${s.id}" data-key="${escapeHtml(s.statement_key)}" data-kind="${escapeHtml(s.statement_kind)}" data-title="${escapeHtml(s.title)}" data-expr="${escapeHtml(s.expression || '')}" data-desc="${escapeHtml(s.description || '')}">
                                            [${escapeHtml(s.statement_kind.toUpperCase())}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                    1. Governing Predicate (Directed Equality with Codomain 𝔹):
                                </label>
                                <select id="modal-fsd-pred-select" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; font-weight: 600; background: #ffffff; color: #0f172a;">
                                    ${predEquations.map((pe) => {
                                        const code = eqToCodeMap[pe.equation_key] || pe.equation_key.replace('eq_pred_', '').toLowerCase();
                                        const isSel = code === currentCode || pe.equation_key === currentCode;
                                        const sym = PxeEngine.charDisplayMap[code] || pe.target_symbol || code;
                                        return `<option value="${escapeHtml(code)}" ${isSel ? 'selected' : ''}>
                                            ${escapeHtml(sym)} — ${escapeHtml(pe.title)} [${escapeHtml(pe.equation_key)}]
                                        </option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 240px;">
                                    <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                        2. Quantifier Bindings:
                                    </label>
                                    <input type="text" id="modal-fsd-quantifiers" value="${escapeHtml(currentQuantifiers)}" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;" />
                                    <div style="display: flex; gap: 5px; margin-top: 6px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="∀x₁:ℕ" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">∀x₁:ℕ</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="∃x₁:ℕ" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">∃x₁:ℕ</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="∀x₁:ℕ ∃x₂:ℕ" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">∀x₁:ℕ ∃x₂:ℕ</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="∃x₁:ℕ ∀y₁:𝒫(ℕ)" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">∃x₁:ℕ ∀y₁:𝒫(ℕ)</button>
                                        <button type="button" class="btn btn-sm btn-quick-quant" data-val="∀x₁:[ℕ|GT(11)]" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">∀x₁:[ℕ|GT(11)]</button>
                                    </div>
                                </div>
                                <div style="width: 200px;">
                                    <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                        3. Bound Slots:
                                    </label>
                                    <input type="text" id="modal-fsd-slots" value="${escapeHtml(currentSlots)}" style="width: 100%; padding: 7px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;" />
                                    <div style="display: flex; gap: 5px; margin-top: 6px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x₁,x₂" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x₁,x₂</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x₁" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x₁</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="x₁,y₁" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">x₁,y₁</button>
                                        <button type="button" class="btn btn-sm btn-quick-slot" data-val="A,B" style="padding: 2px 7px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">A,B</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
                                    4. Default Visualizer Stage:
                                </label>
                                <select id="modal-fsd-stage" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff;">
                                    <option value="4" ${currentStage === '4' ? 'selected' : ''}>Stage 4: 2D Matrix Visualizer (Truth &amp; Incidence Grid)</option>
                                    <option value="3" ${currentStage === '3' ? 'selected' : ''}>Stage 3: Quantifier Prefix Evaluation</option>
                                    <option value="2" ${currentStage === '2' ? 'selected' : ''}>Stage 2: Slot &amp; Variable Domain Binding</option>
                                    <option value="1" ${currentStage === '1' ? 'selected' : ''}>Stage 1: Raw Predicate Assembly</option>
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

                    document.getElementById('modal-fsd-constructed-fs-select')?.addEventListener('change', () => {
                        const sel = document.getElementById('modal-fsd-constructed-fs-select') as HTMLSelectElement;
                        if (!sel || !sel.value) return;
                        const opt = sel.selectedOptions[0];
                        const key = opt?.getAttribute('data-key') || '';
                        const title = opt?.getAttribute('data-title') || '';
                        const expr = opt?.getAttribute('data-expr') || '';

                        // If key matches a predicate code
                        const matchedCode = Object.keys(codeToEqMap).find((c) => {
                            const eqKey = codeToEqMap[c];
                            return eqKey === key || key.replace('fs_pred_', 'eq_pred_') === eqKey || key.includes(c);
                        });
                        if (matchedCode) {
                            const predSel = document.getElementById('modal-fsd-pred-select') as HTMLSelectElement;
                            if (predSel) predSel.value = matchedCode;
                        }

                        // Try extracting quantifiers from expression
                        const quantMatch = expr.match(/([∀∃][^\[:=]+)/);
                        if (quantMatch) {
                            const qInput = document.getElementById('modal-fsd-quantifiers') as HTMLInputElement;
                            if (qInput) qInput.value = quantMatch[1].trim();
                        }

                        // If demo title input exists on page, update it
                        const titleInput = document.getElementById('field-title') as HTMLInputElement;
                        if (titleInput && (!titleInput.value || titleInput.value.startsWith('Formal Structure') || titleInput.value.startsWith('[FSD]'))) {
                            titleInput.value = `[FSD] ${title}`;
                        }

                        updateLivePreview();
                    });

                    document.getElementById('modal-fsd-pred-select')?.addEventListener('change', updateLivePreview);
                    document.getElementById('modal-fsd-quantifiers')?.addEventListener('input', updateLivePreview);
                    document.getElementById('modal-fsd-slots')?.addEventListener('input', updateLivePreview);

                    document.querySelectorAll('.btn-quick-quant').forEach((b) => {
                        b.addEventListener('click', () => {
                            const qInput = document.getElementById('modal-fsd-quantifiers') as HTMLInputElement;
                            if (qInput) {
                                qInput.value = (b as HTMLElement).getAttribute('data-val') || '';
                                updateLivePreview();
                            }
                        });
                    });

                    document.querySelectorAll('.btn-quick-slot').forEach((b) => {
                        b.addEventListener('click', () => {
                            const sInput = document.getElementById('modal-fsd-slots') as HTMLInputElement;
                            if (sInput) {
                                sInput.value = (b as HTMLElement).getAttribute('data-val') || '';
                                updateLivePreview();
                            }
                        });
                    });

                    document.getElementById('btn-modal-apply-fsd')?.addEventListener('click', () => {
                        const predSel = document.getElementById('modal-fsd-pred-select') as HTMLSelectElement;
                        const qInput = document.getElementById('modal-fsd-quantifiers') as HTMLInputElement;
                        const sInput = document.getElementById('modal-fsd-slots') as HTMLInputElement;
                        const stSel = document.getElementById('modal-fsd-stage') as HTMLSelectElement;

                        const chosenCode = predSel ? predSel.value : currentCode;
                        const finalQuant = qInput ? qInput.value.trim() : '';
                        const finalSlots = sInput ? sInput.value.trim() : '';
                        const finalStage = stSel ? stSel.value : '4';

                        if (expInput) expInput.value = chosenCode;

                        const previewEl = expWrapper.querySelector(`#preview-field-${colName}`);
                        const sym = PxeEngine.charDisplayMap[chosenCode] || chosenCode;
                        const slotsPart = finalSlots ? `(${finalSlots})` : '';
                        const fullFormula = finalQuant ? `${finalQuant} [ ${sym}${slotsPart} ]` : `${sym}${slotsPart}`;
                        if (previewEl) previewEl.textContent = fullFormula;

                        const newPacket = {
                            exp: chosenCode,
                            quantifiers: finalQuant,
                            slots: finalSlots,
                            stage: finalStage,
                            stages: [0, 1, 2, 3]
                        };

                        const initTextarea = document.getElementById('field-init_packet') as HTMLTextAreaElement;
                        if (initTextarea) {
                            initTextarea.value = JSON.stringify(newPacket, null, 2);
                        }

                        closeModal();
                    });

                    document.getElementById('btn-modal-cancel-fsd')?.addEventListener('click', () => {
                        closeModal();
                    });
                } else {
                    showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 16px; color: #0f172a;">⚖️ Propositional Expression (PXE) Editor</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Construct or modify the propositional expression using atomic variables and logical connectives:</p>
                        <div id="modal-pxe-builder-container"></div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
                            <button type="button" class="action-btn primary" id="btn-modal-apply-pxe">Apply Expression</button>
                            <button type="button" class="action-btn secondary" id="btn-modal-cancel-pxe">Cancel</button>
                        </div>
                    `);

                    const modalTarget = document.getElementById('modal-pxe-builder-container')!;
                    let latestPacket: any = null;
                    let latestExp = curExp;

                    mountPxeBuilderComponent(modalTarget, curExp, (packet, rawExp) => {
                        latestPacket = packet;
                        latestExp = rawExp;
                    });

                    document.getElementById('btn-modal-apply-pxe')?.addEventListener('click', () => {
                        if (expInput) expInput.value = latestExp;
                        const previewEl = expWrapper.querySelector(`#preview-field-${colName}`);
                        if (previewEl) previewEl.textContent = latestExp ? PxeEngine.fmt(latestExp) : '—';

                        // Update status dropdown
                        const statusSelect = document.getElementById('field-status') as HTMLSelectElement;
                        if (statusSelect && latestPacket?.status) {
                            statusSelect.value = latestPacket.status;
                        }

                        // Update init_packet textarea if present
                        const initTextarea = document.getElementById('field-init_packet') as HTMLTextAreaElement;
                        if (initTextarea && latestPacket) {
                            initTextarea.value = JSON.stringify(latestPacket, null, 2);
                        }

                        closeModal();
                    });

                    document.getElementById('btn-modal-cancel-pxe')?.addEventListener('click', () => {
                        closeModal();
                    });
                }
            };

            expWrapper.querySelector('#btn-open-pxe-editor')?.addEventListener('click', openEditor);
            expWrapper.querySelector(`#field-${colName}`)?.addEventListener('click', openEditor);
            expWrapper.querySelector(`#preview-field-${colName}`)?.addEventListener('click', openEditor);

            inputElement = expWrapper;
        } else if (tableName === 'formal_statements' && colName === 'expression') {
            const expWrapper = document.createElement('div');
            expWrapper.className = 'fs-workbench-field-wrapper';
            expWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 4px;';
            const expVal = val !== null && val !== undefined ? val.toString() : '';

            expWrapper.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input type="text" id="field-${colName}" name="${colName}" value="${escapeHtml(expVal)}"
                        class="form-input" style="flex: 1; min-width: 280px; font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #0369a1; background: #f0f9ff; border: 1.5px solid #bae6fd; padding: 8px 12px; border-radius: 6px;"
                        placeholder="e.g. ∀x₁:ℕ ∃x₂:ℕ [ x₁ < x₂ ]" />
                    <button type="button" id="btn-open-fsd-workbench" class="action-btn primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 700; background: #0284c7; border: none; border-radius: 6px; cursor: pointer; color: #ffffff; box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);">
                        <span>📐</span>
                        <span>4-Stage FS Constructor</span>
                    </button>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Formula Preview:</span>
                        <div id="preview-field-${colName}" style="font-size: 16px; font-weight: 700; color: #1e3a8a; font-family: 'Cambria Math', Georgia, serif;">
                            ${escapeHtml(expVal || '— (Empty Statement) —')}
                        </div>
                    </div>
                    <span style="font-size: 11.5px; color: #0284c7; font-weight: 600;">
                        4-Stage Build: 1. Expression → 2. Slots &amp; Constants → 3. Quantifiers → 4. Verified FS
                    </span>
                </div>
            `;

            const inputEl = expWrapper.querySelector(`#field-${colName}`) as HTMLInputElement;
            const previewEl = expWrapper.querySelector(`#preview-field-${colName}`) as HTMLElement;
            if (inputEl && previewEl) {
                inputEl.addEventListener('input', () => {
                    previewEl.textContent = inputEl.value.trim() || '— (Empty Statement) —';
                });
            }

            const openWorkbench = () => {
                const curVal = inputEl ? inputEl.value.trim() : expVal;
                const parsedData = parseStatementToFsdData(curVal);

                showModal(`
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">📐</span>
                                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">
                                    4-Stage Formal Statement (FS) Constructor
                                </h3>
                                <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
                                    Authoring Workbench
                                </span>
                            </div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 3px;">
                                Construct any formal statement with predicates, connectives, slots, and quantifiers, then commit to PostgreSQL.
                            </div>
                        </div>
                        <button type="button" class="action-btn secondary" id="btn-close-fsd-modal" style="padding: 5px 12px; font-size: 12px;">
                            ✕ Cancel
                        </button>
                    </div>
                    <div id="modal-fsd-workbench-container" style="width: 100%; height: 580px; overflow: hidden; background: #ffffff; border: 1.5px solid var(--border-color); border-radius: 6px;"></div>
                `, true);

                const container = document.getElementById('modal-fsd-workbench-container')!;
                document.getElementById('btn-close-fsd-modal')?.addEventListener('click', () => closeModal());

                mountFsdBuilder(container, {
                    width: container.clientWidth || 980,
                    height: 580,
                    initialData: parsedData,
                    buttonLabel: 'Commit to Formal Statement ✓',
                    onCommit: (data: FsdCommitData) => {
                        if (inputEl) {
                            inputEl.value = data.fullStatement;
                        }
                        if (previewEl) {
                            previewEl.textContent = data.fullStatement;
                        }

                        // Auto-suggest statement_key if empty
                        const keyInput = document.getElementById('field-statement_key') as HTMLInputElement;
                        if (keyInput && (!keyInput.value || keyInput.value.trim() === '')) {
                            const cleanExp = data.exp.toLowerCase();
                            keyInput.value = `fs_${cleanExp}_${Date.now().toString().slice(-4)}`;
                        }

                        // Auto-suggest title if empty
                        const titleInput = document.getElementById('field-title') as HTMLInputElement;
                        if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
                            titleInput.value = `Formal Statement: ${data.formattedText}`;
                        }

                        closeModal();
                    },
                    onCancel: () => closeModal()
                });
            };

            expWrapper.querySelector('#btn-open-fsd-workbench')?.addEventListener('click', openWorkbench);
            inputElement = expWrapper;
        } else {
            const input = document.createElement('input');
            input.type = colMeta.dbDataType.includes('int') ? 'number' : 'text';
            input.id = `field-${colName}`;
            input.name = colName;
            input.className = 'form-input';
            if (colMeta.dbDataType.includes('int')) {
                input.style.width = '140px';
            } else {
                input.style.maxWidth = '540px';
            }
            input.value = val !== null && val !== undefined ? val.toString() : '';
            inputElement = input;
        }

        // Quick Math Symbol Palette (only for directed equations, never for interactive_demos)
        if (tableName !== 'interactive_demos' && (colName === 'formula_expr' || colName === 'expression')) {
            const symBar = document.createElement('div');
            symBar.style.cssText = 'display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color);';
            const syms = ['→', '⇒', '↔', '∧', '∨', '¬', '⊢', '⊨', 'ℝ_ω', '𝔻', 'ℤ', 'ℕ', '𝔹', '·', '≠', '∈', '∀', '∃', 'ω', 'dx', '≤', '≥', '≈', '≡', '×', 'λ'];
            symBar.innerHTML = `
                <span style="font-size: 11px; font-weight: 700; color: #64748b; align-self: center; margin-right: 4px;">SYMBOLS:</span>
                ${syms
                    .map(
                        (s) =>
                            `<button type="button" class="btn-insert-symbol" data-sym="${s}" style="padding: 2px 7px; font-size: 12px; border: 1px solid var(--border-color); background: #ffffff; border-radius: 4px; cursor: pointer; font-family: var(--font-mono);">
                                ${s}
                            </button>`
                    )
                    .join('')}
            `;
            symBar.querySelectorAll('.btn-insert-symbol').forEach((b) => {
                b.addEventListener('click', () => {
                    const sym = (b as HTMLElement).getAttribute('data-sym')!;
                    const targetInput = inputElement as HTMLInputElement | HTMLTextAreaElement;
                    if (targetInput && 'selectionStart' in targetInput) {
                        const start = targetInput.selectionStart || 0;
                        const end = targetInput.selectionEnd || 0;
                        const cur = targetInput.value;
                        targetInput.value = cur.substring(0, start) + sym + cur.substring(end);
                        targetInput.selectionStart = targetInput.selectionEnd = start + sym.length;
                        targetInput.focus();
                    }
                });
            });
            tdVal.appendChild(inputElement);
            tdVal.appendChild(symBar);
        } else {
            tdVal.appendChild(inputElement);
        }

        tr.appendChild(tdVal);
        fieldsTarget.appendChild(tr);
    }

    // Cancel Buttons (both header and footer)
    document.querySelectorAll('.btn-cancel-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            setMode('read', true);
        });
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const submitValues: Record<string, any> = {};

        for (const colName of Object.keys(tableInfo.columns)) {
            const colMeta = tableInfo.columns[colName];
            if (colMeta.isPrimaryKey && isNew) continue;

            const raw = formData.get(colName);
            if (raw === null || raw === undefined || raw === '') {
                submitValues[colName] = colMeta.isNullable ? null : '';
            } else if (colMeta.dbDataType === 'boolean') {
                submitValues[colName] = raw === 'true';
            } else if (colMeta.dbDataType.includes('int')) {
                submitValues[colName] = parseInt(raw.toString(), 10);
            } else if (colMeta.dbDataType.includes('numeric') || colMeta.dbDataType.includes('double')) {
                submitValues[colName] = parseFloat(raw.toString());
            } else {
                submitValues[colName] = raw.toString();
            }
        }

        if (tableName === 'formal_statements') {
            if (submitValues['type']) submitValues['subject_type'] = submitValues['type'];
            if (submitValues['statement_kind']) submitValues['structure_kind'] = submitValues['statement_kind'];
        }

        try {
            if (isNew) {
                // INSERT
                const cols = Object.keys(submitValues);
                const placeholders = cols.map((_, i) => `$${i + 1}`);
                const params = cols.map((c) => submitValues[c]);
                const insertSql = `INSERT INTO ${tableName} ("${cols.join('", "')}") VALUES (${placeholders.join(', ')}) RETURNING id;`;

                const res = await executeSql(insertSql, params);
                if (res.status === 'error') throw new Error(res.error || res.message);

                const newId = res.data?.rows[0]?.id;
                setStatus(`✓ Record created successfully (#${newId})`);
                currentSelectedId = newId ? newId.toString() : null;

                // Dynamically sync menu instances from DB and rebuild catalogs in background
                await syncMenuTreeFromDatabase(queryDatabase);
                if (typeDropdownMenu) {
                    typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
                }
                fetch('/api/rebuild-catalog', { method: 'POST' }).catch((e) => console.warn('[rebuild-catalog] background notice:', e));

                setMode('read', true);
            } else {
                // UPDATE
                const cols = Object.keys(submitValues).filter((c) => c !== 'id');
                const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`);
                const params = cols.map((c) => submitValues[c]);
                params.push(record.id);
                const updateSql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING id;`;

                const res = await executeSql(updateSql, params);
                if (res.status === 'error') throw new Error(res.error || res.message);

                setStatus(`✓ Record #${record.id} updated successfully`);
                currentSelectedId = record.id.toString();

                // Dynamically sync menu instances from DB and rebuild catalogs in background
                await syncMenuTreeFromDatabase(queryDatabase);
                if (typeDropdownMenu) {
                    typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
                }
                fetch('/api/rebuild-catalog', { method: 'POST' }).catch((e) => console.warn('[rebuild-catalog] background notice:', e));

                setMode('read', true);
            }
        } catch (saveErr) {
            console.error('Save error:', saveErr);
            showModal(`
                <h3 style="color: #dc2626; margin-bottom: 8px;">⚠️ Database Operation Failed</h3>
                <p style="color: #4a5568; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                    ${(saveErr as Error).message}
                </p>
                <button class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">
                    Close
                </button>
            `);
        }
    });
}

// =============================================================================
// DELETE CONFIRMATION
// =============================================================================

async function renderDeleteConfirmation(tableName: string, record: any) {
    if (!displayArea) return;

    const displayCol = getDisplayColumnName(tableName);
    const titleVal = record[displayCol] || `ID: ${record.id}`;

    displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 8px; padding: 30px; max-width: 600px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
                <h2 style="font-size: 18px; color: #991b1b; margin-bottom: 8px;">Confirm Record Deletion</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Are you sure you want to permanently delete record <strong>${escapeHtml(titleVal)}</strong> (id = ${record.id}) from table <code>${tableName}</code>?
                </p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button class="action-btn danger" id="btn-confirm-delete" style="padding: 8px 18px;">
                        🗑️ Confirm & Delete
                    </button>
                    <button class="action-btn secondary" id="btn-cancel-delete" style="padding: 8px 18px;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => {
        setMode('read');
    });

    document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
        try {
            const sql = `DELETE FROM ${tableName} WHERE id = $1;`;
            const res = await executeSql(sql, [record.id]);
            if (res.status === 'error') throw new Error(res.error || res.message);

            setStatus(`✓ Record #${record.id} permanently deleted.`);
            currentSelectedId = null;

            await syncMenuTreeFromDatabase(queryDatabase);
            if (typeDropdownMenu) {
                typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject, currentMode));
            }
            fetch('/api/rebuild-catalog', { method: 'POST' }).catch((e) => console.warn('[rebuild-catalog] background notice:', e));

            setMode('read');
        } catch (delErr) {
            showModal(`
                <h3 style="color: #dc2626; margin-bottom: 8px;">⚠️ Deletion Failed</h3>
                <p style="color: #4a5568; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
                    Could not delete record: ${(delErr as Error).message}
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchRecordById(tableName: string, id: string | number): Promise<any | null> {
    try {
        const sql = `SELECT * FROM ${tableName} WHERE id = $1;`;
        const rows = await queryDatabase<any>(sql, [id]);
        return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error(`[fetchRecordById] Error in ${tableName} #${id}:`, err);
        return null;
    }
}

function escapeHtml(str: string | null | undefined): string {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTtdDisplay(exp: string): string {
    const codeMap: Record<string, string> = {
        'p': '𝑝',
        'q': '𝑞',
        'r': '𝑟',
        's': '𝑠',
        '[': '(',
        ']': ')',
        'n': '¬',
        'a': ' ∧ ',
        'o': ' ∨ ',
        'i': ' → ',
        'e': ' ↔ '
    };
    let res = '';
    for (const ch of exp) {
        res += codeMap[ch] !== undefined ? codeMap[ch] : ch;
    }
    return res;
}
