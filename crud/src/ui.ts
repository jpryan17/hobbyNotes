// crud/src/ui.ts
// Schema-driven, attribute-complete CRUD Studio engine for Middle Way Mathematics.

import { AppMetadata, TableNavigationPath, Dependent, EnrichedTable, EnrichedColumn } from './types.js';
import { queryDatabase, executeSql } from '../../clientLib/db/api.js';
import { navigationMenuTree, renderMenuHierarchy, getFilteredMenuTree } from './menuTree.js';
import { PxeEngine, mountPxeBuilderComponent } from '../../clientLib/pxeEngine.js';

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
                return `${fmt || exp || record.title || 'TTD'}${statusSuffix}`;
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
        typeDropdownMenu.innerHTML = renderMenuHierarchy(navigationMenuTree);
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

            // 1. Direct instance selection (leaf record)
            if (instanceKey || instanceId) {
                e.stopPropagation();
                typeDropdownMenu?.classList.remove('show');
                typeDropdownMenu?.querySelectorAll('.open-submenu').forEach((el) => el.classList.remove('open-submenu'));
                await selectInstanceDirectly(typeKey || currentTypeKey, instanceKey || instanceId!, label);
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

        // Dynamic Submenu positioning on hover
        typeDropdownMenu.querySelectorAll('.dropdown-item.has-submenu').forEach((item) => {
            item.addEventListener('mouseenter', () => {
                positionSubmenu(item as HTMLElement);
            });
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

    // Modal close
    const modalClose = document.getElementById('modal-close-button');
    if (modalClose && mainModal) {
        modalClose.addEventListener('click', closeModal);
    }
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

    // Refresh Hierarchical Type Menu using the filtered tree
    if (typeDropdownMenu) {
        typeDropdownMenu.innerHTML = renderMenuHierarchy(getFilteredMenuTree(currentSubject));
    }

    renderCurrentView();
    setStatus(`Subject Scope: ${labelMap[subject] || subject}`);
}

/**
 * Switches the current CRUD mode and resets the type to generic so an instance selection initiates behavior.
 */
export function setMode(mode: CrudMode) {
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

    // Reset type to generic type anytime mode changes so a subsequent selection initiates behavior
    currentTypeKey = null;
    currentSelectedId = null;
    currentTitle = '';
    if (currentTypeLabel) currentTypeLabel.textContent = 'Select Type';
    if (typeDropdownMenu) {
        typeDropdownMenu.querySelectorAll('.dropdown-item').forEach((item) => {
            item.classList.remove('active');
        });
    }

    updateBreadcrumbs();
    renderCurrentView();
    setStatus(`Mode: ${capitalize(mode)} • Select mode and instance`);
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

function showModal(contentHtml: string) {
    if (modalBody && mainModal) {
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
                renderRecordForm(tableName, record, false);
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
                renderRecordForm(tableName, record, false);
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

        if (rawVal === null || rawVal === undefined) {
            tdVal.innerHTML = `<span class="null-badge">NULL</span>`;
        } else if (typeof rawVal === 'boolean') {
            tdVal.innerHTML = rawVal
                ? `<span style="color: var(--emerald); font-weight: 700;">TRUE</span>`
                : `<span style="color: #64748b; font-weight: 700;">FALSE</span>`;
        } else if (colMeta.isForeignKey && rawVal) {
            // Foreign Key Resolution Link
            const fkTable = colMeta.foreignKeyTable || 'unknown';
            tdVal.innerHTML = `
                <span style="font-family: var(--font-mono); font-weight: 700;">${rawVal}</span>
                <button class="fk-goto-btn" data-fktable="${fkTable}" data-fkid="${rawVal}">
                    <span>↗ Go to ${fkTable} #${rawVal}</span>
                </button>
            `;

            // Async name resolution
            const targetCol = getDisplayColumnName(fkTable);
            queryDatabase<any>(`SELECT "${targetCol}" as name FROM ${fkTable} WHERE id = $1;`, [rawVal])
                .then((rows) => {
                    if (rows && rows.length > 0) {
                        const btn = tdVal.querySelector('.fk-goto-btn');
                        if (btn) {
                            btn.innerHTML = `<span>↗ Go to ${appMetadata[fkTable]?.singularLabel || fkTable}: ${escapeHtml(rows[0].name || '')} (#${rawVal})</span>`;
                        }
                    }
                })
                .catch(() => {});
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
            // Concise 1-line attribute metric with scroll button
            tdVal.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 2px 0;">
                    <span style="font-size: 13px; font-weight: 600; color: #1e293b;">HTML Lecture Body</span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${(rawVal.length / 1024).toFixed(1)} KB (${rawVal.length.toLocaleString()} chars)
                    </span>
                    <button type="button" class="action-btn secondary btn-scroll-to-lecture-viewer" style="font-size: 11.5px; padding: 3px 10px; cursor: pointer;">
                        📖 View &amp; Inspect Lecture Content ↓
                    </button>
                </div>
            `;
            tdVal.querySelector('.btn-scroll-to-lecture-viewer')?.addEventListener('click', () => {
                const viewerEl = card.querySelector('.lecture-content-viewer');
                if (viewerEl) {
                    viewerEl.scrollIntoView({ behavior: 'smooth' });
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

    // =========================================================================
    // RELATIONAL MASTER-DETAIL: CONNECTED ENTITIES & CHILD DESCRIPTIONS
    // Parent display does not inline child info; describes children via friendly
    // names (single text field if 1 child, dropdown menu if multiple) + nav button.
    // =========================================================================
    const relContainer = document.createElement('div');
    relContainer.className = 'connected-relations-container';
    relContainer.style.cssText = 'margin: 20px 24px; padding: 18px 20px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);';

    let hasRelations = false;
    let relRowsHtml = '';

    // 1. If Formal Statement (especially Directed Equality):
    if (tableName === 'formal_statements') {
        // A. Child Stencils (via equation_statement_links)
        try {
            const stencils = await queryDatabase<any>(
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
                                Inspect Stencil ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Computational Stencils (${stencils.length}):</span>
                            <select id="select-rel-stencils" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${stencils.map((s: any) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.label)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-rel-stencil" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Stencil ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying stencils:', err);
        }

        // B. Child Pseudocode Block (via pseudo_algo_id or join)
        try {
            let algoRecord: any = null;
            if (record.pseudo_algo_id) {
                algoRecord = await fetchRecordById('pseudocode_algorithms', record.pseudo_algo_id.toString());
            } else {
                const algos = await queryDatabase<any>(
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
                            Inspect Pseudocode ↗
                        </button>
                    </div>
                `;
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying pseudocode:', err);
        }

        // C. Parent Formal Statement (if this statement instantiates a parent theorem/axiom)
        if (record.parent_id) {
            try {
                const parentStmt = await fetchRecordById('formal_statements', record.parent_id.toString());
                if (parentStmt) {
                    hasRelations = true;
                    const pTitle = parentStmt.title || parentStmt.expression || parentStmt.statement_key;
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Instantiates (Parent FS):</span>
                            <input type="text" readonly value="${escapeHtml(pTitle)} (${escapeHtml(parentStmt.statement_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-parent-fs" data-id="${parentStmt.id}" data-title="${escapeHtml(pTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent FS ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying parent formal statement:', err);
            }
        }
    }

    // 2. If Computational Stencil (directed_equations):
    if (tableName === 'directed_equations') {
        // Parent Directed Equality (Formal Statement)
        try {
            const parentStmts = await queryDatabase<any>(
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
                                Inspect Parent DE ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Statements (${parentStmts.length}):</span>
                            <select id="select-parent-de" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${parentStmts.map((p: any) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.statement_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-parent-de" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying parent statements:', err);
        }

        // Associated Pseudocode Algorithm (if pointed to by pseudo_algo_id)
        if (record.pseudo_algo_id) {
            try {
                const algoRecord = await fetchRecordById('pseudocode_algorithms', record.pseudo_algo_id.toString());
                if (algoRecord) {
                    hasRelations = true;
                    const algoTitle = algoRecord.title || algoRecord.name || algoRecord.algo_key;
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Associated Pseudocode:</span>
                            <input type="text" readonly value="${escapeHtml(algoTitle)} (${escapeHtml(algoRecord.algo_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-algo" data-id="${algoRecord.id}" data-title="${escapeHtml(algoTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #4f46e5; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Pseudocode ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying stencil pseudocode:', err);
            }
        }
    }

    // 3. If Pseudocode Algorithm (pseudocode_algorithms):
    if (tableName === 'pseudocode_algorithms') {
        try {
            const parentStmts = await queryDatabase<any>(
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
                                Inspect Parent DE ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Statements (${parentStmts.length}):</span>
                            <select id="select-parent-de" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${parentStmts.map((p: any) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.statement_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-parent-de" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent DE ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying parent statements for algorithm:', err);
        }
    }

    // 4. If Index Entry (curriculum_nav_items):
    if (tableName === 'curriculum_nav_items') {
        // A. Associated Lecture Segment
        if (record.segment_id) {
            try {
                const segRecord = await fetchRecordById('segments', record.segment_id.toString());
                if (segRecord) {
                    hasRelations = true;
                    const segTitle = segRecord.title || segRecord.seg_key;
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Lecture Segment:</span>
                            <input type="text" readonly value="${escapeHtml(segTitle)} (${escapeHtml(segRecord.seg_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-segment" data-id="${segRecord.id}" data-title="${escapeHtml(segTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Segment ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying segment for nav item:', err);
            }
        }

        // B. Associated Interactive Demo (if diagram_key present)
        if (record.diagram_key) {
            try {
                const demos = await queryDatabase<any>(
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
                                Inspect Demo ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying demo for nav item:', err);
            }
        }

        // C. Parent Index Entry
        if (record.parent_id) {
            try {
                const parentNav = await fetchRecordById('curriculum_nav_items', record.parent_id.toString());
                if (parentNav) {
                    hasRelations = true;
                    const pTitle = parentNav.topic || parentNav.nav_key;
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Parent Index Entry:</span>
                            <input type="text" readonly value="${escapeHtml(pTitle)} (${escapeHtml(parentNav.nav_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-index-entry" data-id="${parentNav.id}" data-title="${escapeHtml(pTitle)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Parent Entry ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying parent nav item:', err);
            }
        }

        // D. Child Sub-Index Entries
        try {
            const childNavs = await queryDatabase<any>(
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
                                Inspect Index Entry ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Child Index Entries (${childNavs.length}):</span>
                            <select id="select-child-navs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${childNavs.map((n: any) => `<option value="${n.id}" data-title="${escapeHtml(n.topic)}">${escapeHtml(n.topic)} (${escapeHtml(n.nav_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-child-nav" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying child nav items:', err);
        }
    }

    // 5. If Lecture Segment (segments):
    if (tableName === 'segments') {
        // A. Associated Index Entry (Curriculum Nav Item)
        try {
            const navItems = await queryDatabase<any>(
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
                                Inspect Index Entry ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Index Entries (${navItems.length}):</span>
                            <select id="select-seg-navs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${navItems.map((n: any) => `<option value="${n.id}" data-title="${escapeHtml(n.topic)}">${escapeHtml(n.topic)} (${escapeHtml(n.nav_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-seg-nav" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #6366f1; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying nav items for segment:', err);
        }

        // B. Cited Formal Statements
        try {
            const citedStmts = await queryDatabase<any>(
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
                                Inspect Statement ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Formal Statements (${citedStmts.length}):</span>
                            <select id="select-cited-stmts" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citedStmts.map((s: any) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-cited-stmt" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #d97706; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying cited statements for segment:', err);
        }

        // C. Cited Computational Stencils
        try {
            const citedStencils = await queryDatabase<any>(
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
                                Inspect Stencil ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Cited Stencils (${citedStencils.length}):</span>
                            <select id="select-cited-stencils" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citedStencils.map((s: any) => `<option value="${s.id}" data-title="${escapeHtml(s.title)}">${escapeHtml(s.title)} (${escapeHtml(s.label)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-cited-stencil" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying cited stencils for segment:', err);
        }

        // D. Prerequisite Chapters
        try {
            const prereqs = await queryDatabase<any>(
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
                                Inspect Prerequisite ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Prerequisite Chapters (${prereqs.length}):</span>
                            <select id="select-prereqs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${prereqs.map((p: any) => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${escapeHtml(p.seg_key)}) [${escapeHtml(p.prerequisite_type)}]</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-prereq" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying prerequisites for segment:', err);
        }
    }

    // 6. If Interactive Demo (interactive_demos):
    if (tableName === 'interactive_demos') {
        try {
            let exp = record.expression || '';
            if (!exp) {
                try {
                    const initObj = typeof record.init_packet === 'object' ? record.init_packet : JSON.parse(record.init_packet || '{}');
                    exp = initObj?.exp || '';
                } catch (e) {}
            }

            let query = `
                SELECT DISTINCT s.id, s.seg_key, s.title
                FROM segments s
                LEFT JOIN segment_references sr ON sr.segment_id = s.id AND sr.demo_id = $1
                WHERE sr.id IS NOT NULL
                   OR s.content_html LIKE $2
                   OR s.content_html LIKE $3
            `;
            const params: any[] = [
                record.id,
                `%id="${record.id}"%`,
                `%demo-id="${record.id}"%`
            ];
            if (exp) {
                params.push(`%${exp}%`);
                query += ` OR s.content_html LIKE $${params.length}`;
            }
            query += ` ORDER BY s.id ASC;`;

            const citingSegs = await queryDatabase<any>(query, params);

            if (citingSegs && citingSegs.length > 0) {
                hasRelations = true;
                if (citingSegs.length === 1) {
                    const cseg = citingSegs[0];
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Citing Chapter (Segment):</span>
                            <input type="text" readonly value="${escapeHtml(cseg.title || cseg.seg_key)} (${escapeHtml(cseg.seg_key)})" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; color: #0f172a;" />
                            <button type="button" class="btn btn-sm btn-nav-segment" data-id="${cseg.id}" data-title="${escapeHtml(cseg.title || cseg.seg_key)}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Segment ↗
                            </button>
                        </div>
                    `;
                } else {
                    relRowsHtml += `
                        <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">Citing Chapters (${citingSegs.length}):</span>
                            <select id="select-citing-segs" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                ${citingSegs.map((s: any) => `<option value="${s.id}" data-title="${escapeHtml(s.title || s.seg_key)}">${escapeHtml(s.title || s.seg_key)} (${escapeHtml(s.seg_key)})</option>`).join('')}
                            </select>
                            <button type="button" id="btn-nav-citing-seg" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                Inspect Selected ↗
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('[renderAttributeCompleteCard] Error querying citing segments for demo:', err);
        }

        // B. Governing Predicate Directed Equality (if FSD)
        if (record.engine === 'fsd') {
            try {
                let predKey = record.expression || '';
                if (!predKey) {
                    try {
                        const initObj = typeof record.init_packet === 'object' ? record.init_packet : JSON.parse(record.init_packet || '{}');
                        predKey = initObj?.exp || '';
                    } catch (e) {}
                }

                // Map PXE code to equation_key
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
                const mappedEqKey = codeToEqMap[predKey] || `eq_pred_${predKey}`;

                const predRows = await queryDatabase<any>(
                    `SELECT id, equation_key, title, formula_expr 
                     FROM directed_equations 
                     WHERE target_domain IN ('B_w', '𝔹', 'B') 
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
                                Inspect Predicate DE ↗
                            </button>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('[renderAttributeCompleteCard] Error querying predicate DE for FSD:', err);
            }
        }
    }

    // 7. Generic Dependent Child Tables (lean_verifications, mode_slots, etc.)
    const dependentsForTable = tableInfo.dependents || [];
    for (const dep of dependentsForTable) {
        // Skip tables already handled explicitly above to prevent redundant duplication
        if (tableName === 'formal_statements' && dep.table === 'directed_equations') continue;
        if (tableName === 'curriculum_nav_items' && dep.table === 'curriculum_nav_items') continue;
        if (tableName === 'segments' && (dep.table === 'segment_references' || dep.table === 'segment_prerequisites' || dep.table === 'curriculum_nav_items')) continue;

        const depTableMeta = appMetadata[dep.table];
        if (!depTableMeta) continue;

        const fkToParent = Object.values(depTableMeta.columns).find(
            (c) => c.isForeignKey && c.foreignKeyTable === tableName
        );

        if (fkToParent) {
            try {
                const childRows = await queryDatabase<any>(
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
                                    Inspect ${escapeHtml(childSingular)} ↗
                                </button>
                            </div>
                        `;
                    } else {
                        const selectId = `select-dep-${dep.table}`;
                        relRowsHtml += `
                            <div class="rel-row" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #334155; min-width: 170px;">${escapeHtml(childPlural)} (${childRows.length}):</span>
                                <select id="${selectId}" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff; color: #0f172a;">
                                    ${childRows
                                        .map((r: any) => {
                                            const fname = getRecordFriendlyName(dep.table, r);
                                            return `<option value="${r.id}" data-title="${escapeHtml(fname)}">${escapeHtml(fname)}</option>`;
                                        })
                                        .join('')}
                                </select>
                                <button type="button" class="btn btn-sm btn-nav-dep-multi" data-select-id="${selectId}" data-table="${dep.table}" style="padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
                                    Inspect Selected ↗
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

        // Event delegation for navigation buttons
        relContainer.querySelectorAll('.btn-nav-stencil').forEach((btn) => {
            btn.addEventListener('click', () => {
                const sid = (btn as HTMLElement).getAttribute('data-id')!;
                const stitle = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('computational_stencil', sid, stitle);
            });
        });

        const btnNavRelStencil = relContainer.querySelector('#btn-nav-rel-stencil');
        if (btnNavRelStencil) {
            btnNavRelStencil.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-rel-stencils') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('computational_stencil', selectEl.value, opt?.getAttribute('data-title') || 'Stencil');
                }
            });
        }

        relContainer.querySelectorAll('.btn-nav-algo').forEach((btn) => {
            btn.addEventListener('click', () => {
                const aid = (btn as HTMLElement).getAttribute('data-id')!;
                const atitle = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('pseudocode_algorithms', aid, atitle);
            });
        });

        relContainer.querySelectorAll('.btn-nav-parent-fs').forEach((btn) => {
            btn.addEventListener('click', () => {
                const pid = (btn as HTMLElement).getAttribute('data-id')!;
                const ptitle = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('formal_statement', pid, ptitle);
            });
        });

        const btnNavParentDe = relContainer.querySelector('#btn-nav-parent-de');
        if (btnNavParentDe) {
            btnNavParentDe.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-parent-de') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('formal_statement', selectEl.value, opt?.getAttribute('data-title') || 'Formal Statement');
                }
            });
        }

        relContainer.querySelectorAll('.btn-nav-segment').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = (btn as HTMLElement).getAttribute('data-id')!;
                const title = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('segments', id, title);
            });
        });

        const btnNavCitingSeg = relContainer.querySelector('#btn-nav-citing-seg');
        if (btnNavCitingSeg) {
            btnNavCitingSeg.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-citing-segs') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('segments', selectEl.value, opt?.getAttribute('data-title') || 'Segment');
                }
            });
        }

        relContainer.querySelectorAll('.btn-nav-index-entry').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = (btn as HTMLElement).getAttribute('data-id')!;
                const title = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('curriculum_nav_item', id, title);
            });
        });

        const btnNavChildNav = relContainer.querySelector('#btn-nav-child-nav');
        if (btnNavChildNav) {
            btnNavChildNav.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-child-navs') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('curriculum_nav_item', selectEl.value, opt?.getAttribute('data-title') || 'Index Entry');
                }
            });
        }

        const btnNavSegNav = relContainer.querySelector('#btn-nav-seg-nav');
        if (btnNavSegNav) {
            btnNavSegNav.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-seg-navs') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('curriculum_nav_item', selectEl.value, opt?.getAttribute('data-title') || 'Index Entry');
                }
            });
        }

        const btnNavCitedStmt = relContainer.querySelector('#btn-nav-cited-stmt');
        if (btnNavCitedStmt) {
            btnNavCitedStmt.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-cited-stmts') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('formal_statement', selectEl.value, opt?.getAttribute('data-title') || 'Statement');
                }
            });
        }

        const btnNavCitedStencil = relContainer.querySelector('#btn-nav-cited-stencil');
        if (btnNavCitedStencil) {
            btnNavCitedStencil.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-cited-stencils') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('computational_stencil', selectEl.value, opt?.getAttribute('data-title') || 'Stencil');
                }
            });
        }

        const btnNavPrereq = relContainer.querySelector('#btn-nav-prereq');
        if (btnNavPrereq) {
            btnNavPrereq.addEventListener('click', () => {
                const selectEl = relContainer.querySelector('#select-prereqs') as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    navigateToEntity('segments', selectEl.value, opt?.getAttribute('data-title') || 'Prerequisite');
                }
            });
        }

        relContainer.querySelectorAll('.btn-nav-demo').forEach((btn) => {
            btn.addEventListener('click', () => {
                const did = (btn as HTMLElement).getAttribute('data-id')!;
                const dtitle = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity('interactive_demos', did, dtitle);
            });
        });

        relContainer.querySelectorAll('.btn-nav-dep-child').forEach((btn) => {
            btn.addEventListener('click', () => {
                const table = (btn as HTMLElement).getAttribute('data-table')!;
                const id = (btn as HTMLElement).getAttribute('data-id')!;
                const title = (btn as HTMLElement).getAttribute('data-title')!;
                navigateToEntity(table, id, title);
            });
        });

        relContainer.querySelectorAll('.btn-nav-dep-multi').forEach((btn) => {
            btn.addEventListener('click', () => {
                const selectId = (btn as HTMLElement).getAttribute('data-select-id')!;
                const table = (btn as HTMLElement).getAttribute('data-table')!;
                const selectEl = relContainer.querySelector(`#${selectId}`) as HTMLSelectElement;
                if (selectEl && selectEl.value) {
                    const opt = selectEl.selectedOptions[0];
                    const title = opt?.getAttribute('data-title') || `${table} #${selectEl.value}`;
                    navigateToEntity(table, selectEl.value, title);
                }
            });
        });

        card.appendChild(relContainer);
    }

    // =========================================================================
    // DEDICATED LECTURE CONTENT VIEWER FOR SEGMENTS
    // =========================================================================
    if (tableName === 'segments' && record.content_html) {
        const viewer = document.createElement('div');
        viewer.className = 'lecture-content-viewer';
        viewer.style.cssText = 'margin: 20px 24px; padding: 18px 20px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);';

        viewer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        📖 Lecture Content &amp; HTML Viewer
                    </span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono); font-weight: 600;">
                        ${(record.content_html.length / 1024).toFixed(1)} KB
                    </span>
                    <span style="font-size: 11px; color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 12px; font-weight: 600; border: 1px solid #a7f3d0;">
                        ${escapeHtml(record.status || 'published')}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="btn btn-sm btn-lecture-tab-preview" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid var(--primary); background: var(--primary); color: #ffffff; cursor: pointer;">
                        👁️ Rendered Preview
                    </button>
                    <button type="button" class="btn btn-sm btn-lecture-tab-source" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid var(--border-color); background: #ffffff; color: #475569; cursor: pointer;">
                        ‹/› Raw HTML Source
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

        const btnPreview = viewer.querySelector('.btn-lecture-tab-preview') as HTMLButtonElement;
        const btnSource = viewer.querySelector('.btn-lecture-tab-source') as HTMLButtonElement;
        const bodyPreview = viewer.querySelector('.lecture-tab-body-preview') as HTMLElement;
        const bodySource = viewer.querySelector('.lecture-tab-body-source') as HTMLElement;

        btnPreview?.addEventListener('click', () => {
            btnPreview.style.background = 'var(--primary)';
            btnPreview.style.borderColor = 'var(--primary)';
            btnPreview.style.color = '#ffffff';
            btnSource.style.background = '#ffffff';
            btnSource.style.borderColor = 'var(--border-color)';
            btnSource.style.color = '#475569';
            bodyPreview.style.display = 'block';
            bodySource.style.display = 'none';
        });

        btnSource?.addEventListener('click', () => {
            btnSource.style.background = 'var(--primary)';
            btnSource.style.borderColor = 'var(--primary)';
            btnSource.style.color = '#ffffff';
            btnPreview.style.background = '#ffffff';
            btnPreview.style.borderColor = 'var(--border-color)';
            btnPreview.style.color = '#475569';
            bodyPreview.style.display = 'none';
            bodySource.style.display = 'block';
        });

        card.appendChild(viewer);
    }

    container.appendChild(card);

    // Attach click events for Foreign Key links
    card.querySelectorAll('.fk-goto-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const fkTable = (btn as HTMLElement).getAttribute('data-fktable')!;
            const fkId = (btn as HTMLElement).getAttribute('data-fkid')!;
            navigateToEntity(fkTable, fkId, `${fkTable} #${fkId}`);
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

function renderRecordForm(tableName: string, record: any = null, isNew: boolean = false) {
    if (!displayArea) return;

    const tableInfo = appMetadata[tableName];
    const displayCol = getDisplayColumnName(tableName);
    const formTitle = isNew
        ? `Create New ${tableInfo.singularLabel || tableInfo.label}`
        : `Modify ${tableInfo.singularLabel || tableInfo.label}: ${record ? record[displayCol] || `ID: ${record.id}` : ''}`;

    displayArea.innerHTML = `
        <div class="entity-inspector-view">
            <div class="form-container">
                <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 6px;">${escapeHtml(formTitle)}</h2>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">
                    Table: <strong>${tableName}</strong> ${isNew ? '• Mode: INSERT' : `• Mode: UPDATE (id = ${record.id})`}
                </div>
                <form id="active-crud-form">
                    <div id="form-fields-target"></div>
                    <div class="form-actions-footer">
                        <button type="submit" class="action-btn primary" id="btn-save-record">
                            💾 ${isNew ? 'Create Record' : 'Save Changes'}
                        </button>
                        <button type="button" class="action-btn secondary" id="btn-cancel-edit">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const fieldsTarget = document.getElementById('form-fields-target')!;
    const form = document.getElementById('active-crud-form') as HTMLFormElement;

    for (const colName of Object.keys(tableInfo.columns)) {
        const colMeta = tableInfo.columns[colName];

        // Skip auto-generated primary key on create
        if (colMeta.isPrimaryKey && isNew) continue;

        let val = record ? record[colName] : '';
        if (isNew && tableName === 'interactive_demos') {
            if (colName === 'engine' && (currentTypeKey === 'ttd' || currentTypeKey === 'truth_table')) {
                val = 'ttd';
            }
            if (colName === 'mode' && (currentTypeKey === 'ttd' || currentTypeKey === 'truth_table')) {
                val = 'propositional_logic';
            }
        }

        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-field-group';

        fieldGroup.innerHTML = `
            <div class="form-field-header">
                <label class="form-field-label" for="field-${colName}">
                    ${escapeHtml(colMeta.label || colName)} ${!colMeta.isNullable ? '<span style="color: var(--danger);">*</span>' : ''}
                </label>
                <span class="form-field-type">
                    ${escapeHtml(colName)} • ${colMeta.dbDataType.toUpperCase()} ${colMeta.isPrimaryKey ? '(PK)' : ''}
                </span>
            </div>
        `;

        let inputElement: HTMLElement;

        if (colMeta.isPrimaryKey || !colMeta.canModify) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `field-${colName}`;
            input.name = colName;
            input.value = val !== null && val !== undefined ? val.toString() : '';
            input.readOnly = true;
            input.className = 'form-input';
            input.style.backgroundColor = '#f1f5f9';
            input.style.color = '#64748b';
            input.style.cursor = 'not-allowed';
            inputElement = input;
        } else if (colMeta.isEnum) {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';

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
        } else if (tableName === 'formal_statements' && colName === 'parent_id') {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.innerHTML = `<option value="">-- None (Top-Level Formal Statement) --</option>`;

            queryDatabase<any>("SELECT id, statement_key, title, statement_kind FROM formal_statements WHERE statement_kind IN ('axiom', 'theorem') ORDER BY id ASC;")
                .then((stmts) => {
                    if (stmts && stmts.length > 0) {
                        select.innerHTML = `
                            <option value="">-- None (Top-Level Formal Statement) --</option>
                            ${stmts
                                .map((s: any) => {
                                    const isSel = val && val.toString() === s.id.toString();
                                    return `<option value="${s.id}" ${isSel ? 'selected' : ''}>
                                        [${escapeHtml(s.statement_kind.toUpperCase())}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})
                                    </option>`;
                                })
                                .join('')}
                        `;
                    }
                })
                .catch((err) => {
                    console.error('[renderRecordForm] Error fetching parent statements:', err);
                });

            inputElement = select;
        } else if (colName === 'lean_decl_id') {
            const select = document.createElement('select');
            select.id = `field-${colName}`;
            select.name = colName;
            select.className = 'form-select';
            select.innerHTML = `<option value="">-- None (Unlinked from Lean Kernel) --</option>`;

            queryDatabase<any>('SELECT id, name, kind, signature, line_no FROM lean_declarations ORDER BY name ASC;')
                .then((decls) => {
                    if (decls && decls.length > 0) {
                        select.innerHTML = `
                            <option value="">-- None (Unlinked from Lean Kernel) --</option>
                            ${decls
                                .map((d: any) => {
                                    const isSel = val && val.toString() === d.id.toString();
                                    const sigPreview = d.signature ? d.signature.slice(0, 70) : '';
                                    return `<option value="${d.id}" ${isSel ? 'selected' : ''}>
                                        [${escapeHtml(d.kind)}] ${escapeHtml(d.name)} : ${escapeHtml(sigPreview)} (line ${d.line_no})
                                    </option>`;
                                })
                                .join('')}
                        `;
                    }
                })
                .catch((err) => {
                    console.error('[renderRecordForm] Error fetching lean declarations:', err);
                });

            inputElement = select;
        } else if (colMeta.rows && colMeta.rows > 1) {
            const textarea = document.createElement('textarea');
            textarea.id = `field-${colName}`;
            textarea.name = colName;
            textarea.rows = colMeta.rows || 4;
            textarea.className = 'form-textarea';
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

            // If Segment HTML content, provide Citation & Custom Element insertion palette
            if (tableName === 'segments' && colName === 'content_html') {
                const paletteBar = document.createElement('div');
                paletteBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);';
                paletteBar.innerHTML = `
                    <span style="font-size: 11.5px; font-weight: 700; color: #475569; align-self: center; margin-right: 4px;">CUSTOM ELEMENTS:</span>
                    <button type="button" class="btn btn-sm btn-insert-fs" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        ➕ Formal Statement Citation
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-stencil" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        ➕ Stencil Calculation Mode
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-ttd" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid #fca5a5; color: #b91c1c; font-weight: 600; border-radius: 4px; cursor: pointer;">
                        ⚖️ Truth Table (TTD)
                    </button>
                    <button type="button" class="btn btn-sm btn-insert-demo" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        ➕ Interactive Visual Demo
                    </button>
                    <button type="button" class="btn btn-sm btn-review-elements" style="padding: 3px 8px; font-size: 11px; background: #ffffff; border: 1px solid #cbd5e1; color: #475569; border-radius: 4px; cursor: pointer; margin-left: auto;">
                        🔍 Review / Remove Tags
                    </button>
                `;

                const insertAtCursor = (txt: string) => {
                    const start = textarea.selectionStart || 0;
                    const end = textarea.selectionEnd || 0;
                    const current = textarea.value;
                    textarea.value = current.substring(0, start) + txt + current.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + txt.length;
                    textarea.focus();
                };

                paletteBar.querySelector('.btn-insert-fs')?.addEventListener('click', async () => {
                    const stmts = await queryDatabase<any>("SELECT id, statement_key, title, statement_kind FROM formal_statements ORDER BY id ASC;");
                    showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Formal Statement Citation</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose a formal statement or directed equality to cite:</p>
                        <select id="modal-select-fs" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(stmts || []).map((s: any) => `<option value="${escapeHtml(s.statement_key)}">[${escapeHtml(s.statement_kind)}] ${escapeHtml(s.title)} (${escapeHtml(s.statement_key)})</option>`).join('')}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-fs">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
                    document.getElementById('btn-modal-confirm-insert-fs')?.addEventListener('click', () => {
                        const sel = document.getElementById('modal-select-fs') as HTMLSelectElement;
                        if (sel && sel.value) {
                            insertAtCursor(`\n<fs-ref statement-key="${sel.value}"></fs-ref>\n`);
                        }
                        closeModal();
                    });
                });

                paletteBar.querySelector('.btn-insert-stencil')?.addEventListener('click', async () => {
                    const stencils = await queryDatabase<any>("SELECT id, equation_key, title, label FROM directed_equations ORDER BY id ASC;");
                    showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Stencil Calculation Mode</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose a computational stencil to embed:</p>
                        <select id="modal-select-stencil" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(stencils || []).map((st: any) => `<option value="${escapeHtml(st.equation_key)}">${escapeHtml(st.title)} (${escapeHtml(st.label)}) [${escapeHtml(st.equation_key)}]</option>`).join('')}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-stencil">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
                    document.getElementById('btn-modal-confirm-insert-stencil')?.addEventListener('click', () => {
                        const sel = document.getElementById('modal-select-stencil') as HTMLSelectElement;
                        if (sel && sel.value) {
                            insertAtCursor(`\n<interactive-stencil equation-key="${sel.value}"></interactive-stencil>\n`);
                        }
                        closeModal();
                    });
                });

                paletteBar.querySelector('.btn-insert-ttd')?.addEventListener('click', async () => {
                    const ttdDemos = await queryDatabase<any>(
                        "SELECT id, title, engine, mode, expression, status, init_packet FROM interactive_demos WHERE engine = 'ttd' ORDER BY id ASC;"
                    );
                    showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px; color: #991b1b;">⚖️ Insert Truth Table Custom Element (&lt;ttd-ref&gt;)</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose an authoritative proposition from the database to embed as a canonical reference:</p>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px;">Registered Propositional Expressions (${ttdDemos?.length || 0}):</label>
                            <select id="modal-select-ttd-id" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px;">
                                ${(ttdDemos || []).map((d: any) => {
                                    const friendly = getRecordFriendlyName('interactive_demos', d);
                                    return `<option value="${d.id}">[#${d.id}] ${escapeHtml(friendly)}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-ttd">Insert &lt;ttd-ref id="..."&gt;</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);

                    document.getElementById('btn-modal-confirm-insert-ttd')?.addEventListener('click', () => {
                        const sel = document.getElementById('modal-select-ttd-id') as HTMLSelectElement;
                        if (sel && sel.value) {
                            insertAtCursor(`\n<ttd-ref id="${sel.value}"></ttd-ref>\n`);
                        }
                        closeModal();
                    });
                });

                paletteBar.querySelector('.btn-insert-demo')?.addEventListener('click', async () => {
                    const demos = await queryDatabase<any>("SELECT id, title, engine FROM interactive_demos ORDER BY id ASC;");
                    showModal(`
                        <h3 style="margin-bottom: 8px; font-size: 15px;">Insert Interactive Demo (&lt;visual-demo&gt;)</h3>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 12px;">Choose an interactive demonstration to embed:</p>
                        <select id="modal-select-demo" style="width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px;">
                            ${(demos || []).map((d: any) => `<option value="${d.id}">[${escapeHtml(d.engine.toUpperCase())}] ${escapeHtml(d.title)} (#${d.id})</option>`).join('')}
                        </select>
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button type="button" class="action-btn primary" id="btn-modal-confirm-insert-demo">Insert Tag</button>
                            <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Cancel</button>
                        </div>
                    `);
                    document.getElementById('btn-modal-confirm-insert-demo')?.addEventListener('click', () => {
                        const sel = document.getElementById('modal-select-demo') as HTMLSelectElement;
                        if (sel && sel.value) {
                            insertAtCursor(`\n<visual-demo id="${sel.value}"></visual-demo>\n`);
                        }
                        closeModal();
                    });
                });

                paletteBar.querySelector('.btn-review-elements')?.addEventListener('click', () => {
                    const text = textarea.value;
                    const tagRegex = /(<ttd-ref[\s\S]*?<\/ttd-ref>|<ttd-ref[^>]*>(?:<\/ttd-ref>)?|<fs-ref[^>]*>(?:<\/fs-ref>)?|<interactive-stencil[^>]*>(?:<\/interactive-stencil>)?|<stencil-ref[^>]*>(?:<\/stencil-ref>)?|<visual-demo[^>]*>(?:<\/visual-demo>)?|<demo-embed[^>]*>(?:<\/demo-embed>)?|<pseudo-ref[^>]*>(?:<\/pseudo-ref>)?)/gi;
                    const matches: string[] = [];
                    let m: RegExpExecArray | null;
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
                                            🗑️ Remove
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="display: flex; justify-content: flex-end;">
                                <button type="button" class="action-btn secondary" onclick="document.getElementById('main-modal').classList.remove('open')">Done</button>
                            </div>
                        `);

                        document.querySelectorAll('.btn-remove-custom-tag').forEach((btn) => {
                            btn.addEventListener('click', (e) => {
                                const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
                                const tagToRemove = matches[idx];
                                if (tagToRemove) {
                                    textarea.value = textarea.value.replace(tagToRemove, '');
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
        } else {
            const input = document.createElement('input');
            input.type = colMeta.dbDataType.includes('int') ? 'number' : 'text';
            input.id = `field-${colName}`;
            input.name = colName;
            input.className = 'form-input';
            input.value = val !== null && val !== undefined ? val.toString() : '';
            inputElement = input;
        }

        // Quick Math Symbol Palette (only for directed equations, never for interactive_demos)
        if (tableName !== 'interactive_demos' && (colName === 'formula_expr' || colName === 'expression')) {
            const symBar = document.createElement('div');
            symBar.style.cssText = 'display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color);';
            const syms = ['→', '⇒', 'ℝ_ω', '𝔻', 'ℤ', 'ℕ', '𝔹', '·', '≠', '∈', '∀', '∃', 'ω', 'dx', '≤', '≥', '≈', '≡', '×', 'λ'];
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

    // Cancel Button
    document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
        setMode('read');
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
                setMode('read');
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
                setMode('read');
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
