// crud/src/ui.ts
// Universal metadata-driven UI engine for the MWM Database CRUD Application.

import { AppMetadata, TableNavigationPath, Dependent, EnrichedTable, EnrichedColumn } from './types.js';
import { queryDatabase, executeSql } from '../../clientLib/db/api.js';

type TreeNode = { id: number | string; parentId: number | string | null; name: string; children: TreeNode[] };

interface WorkUnit {
    mode: 'create' | 'modify';
    initialState: any;
    currentState: any;
}

let currentWorkUnit: WorkUnit | null = null;
let appMetadata: AppMetadata = {};
let navigations: TableNavigationPath[] = [];
let dependents: Dependent[] = [];
let onReturn: ((...args: any[]) => void) | null = null;

// DOM Elements
const navPanel = document.getElementById('navigation-panel') as HTMLDivElement;
const displayPanel = document.getElementById('display-panel') as HTMLDivElement;
const mainModal = document.getElementById('main-modal') as HTMLDivElement;
const modalBody = document.getElementById('modal-body') as HTMLDivElement;
const statusMessage = document.getElementById('status-message') as HTMLElement;

export async function executeDml(sql: string): Promise<number> {
    const res = await executeSql(sql);
    if (res.status === 'error') {
        throw new Error(res.error || res.message);
    }
    return res.data?.rowCount || 0;
}

export function isKnownRecord(obj: any): obj is { id: number | string; [key: string]: any } {
    return obj && typeof obj === 'object' && (typeof obj.id === 'number' || typeof obj.id === 'string');
}

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
    if (cols.includes('demo_key')) return 'demo_key';
    if (cols.includes('seg_key')) return 'seg_key';
    if (cols.includes('label')) return 'label';
    if (cols.includes('symbol')) return 'symbol';
    if (cols.includes('preset_key')) return 'preset_key';
    if (cols.includes('target_key')) return 'target_key';
    if (cols.includes('app_code')) return 'app_code';
    return cols[0] || 'id';
}

/**
 * Initializes the entire UI with validated metadata.
 */
export function initializeUI(metadata: AppMetadata, navs: TableNavigationPath[], deps: Dependent[]) {
    appMetadata = metadata;
    navigations = navs;
    dependents = deps;

    initializeNavigation();
    initializeEventListeners();
    if (statusMessage) {
        statusMessage.textContent = `Ready • ${Object.keys(appMetadata).length} tables loaded`;
    }
}

export function initializeNavigation() {
    navPanel.innerHTML = '<h3>Navigation</h3>';
    navigations.forEach((navPath) => {
        const button = document.createElement('button');
        const buttonText = navPath.label || (navPath.table && appMetadata[navPath.table]?.label) || 'Entity';
        const navId = navPath.label || navPath.table!;
        button.dataset.navId = navId;
        button.textContent = buttonText;
        if (navPath.table) {
            button.dataset.tableName = navPath.table;
        }
        button.classList.add('nav-group-btn');
        navPanel.appendChild(button);
    });
    displayPanel.innerHTML = `
        <h3>Welcome to MWM Database CRUD Studio</h3>
        <p style="color: #64748b; margin-top: 8px;">Select an entity from the navigation menu on the left to inspect, create, or modify records with full relational integrity.</p>
    `;
    onReturn = null;
}

export function initializeEventListeners() {
    navPanel.addEventListener('click', handleNavClick);
    displayPanel.addEventListener('click', handleDisplayPanelClick);

    const closeBtn = mainModal.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    displayPanel.addEventListener('focusin', (event) => {
        if (event.target && (event.target as HTMLElement).classList.contains('has-hints')) {
            showHintsFor(event.target as HTMLInputElement | HTMLTextAreaElement);
        }
    });

    document.addEventListener('click', (event) => {
        if (!(event.target as HTMLElement).closest('.hint-container')) {
            hideAllHintDropdowns();
        }
    });
}

// =============================================================================
// NAVIGATION DISPATCH
// =============================================================================

async function handleNavClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.matches('.back-nav-btn')) {
        initializeNavigation();
        return;
    }

    const navId = target.dataset.navId || target.dataset.tableName;
    if (!navId) return;

    const findPath = (paths: TableNavigationPath[], id: string): TableNavigationPath | undefined => {
        for (const path of paths) {
            if (path.label === id || path.table === id) return path;
            if (path.children) {
                const found = findPath(path.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const clickedPath = findPath(navigations, navId);
    if (!clickedPath) return;

    if (target.matches('.nav-group-btn')) {
        let subNavPaths: TableNavigationPath[];
        if (clickedPath.table) {
            subNavPaths = [clickedPath];
        } else {
            subNavPaths = clickedPath.children || [];
        }

        renderSubNavigation(subNavPaths);
        const title = clickedPath.label || (clickedPath.table && appMetadata[clickedPath.table]?.label) || 'Entity';
        displayPanel.innerHTML = `<h3>${title}</h3><p style="color: #64748b; margin-top: 8px;">Please select an entity from the sub-navigation list on the left.</p>`;
    } else if (target.matches('.sub-nav-btn')) {
        if (clickedPath.table) {
            await renderTableList(clickedPath.table);
        }
    }
}

function renderSubNavigation(paths: TableNavigationPath[]) {
    navPanel.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.textContent = '‹ Back to Main Menu';
    backButton.className = 'back-nav-btn';
    navPanel.appendChild(backButton);

    renderNavLevel(paths, navPanel, 0);
}

function renderNavLevel(paths: TableNavigationPath[], container: HTMLElement, level: number) {
    paths.forEach((path) => {
        const button = document.createElement('button');
        if (path.table) {
            const tableInfo = appMetadata[path.table];
            button.textContent = path.label || (tableInfo ? tableInfo.label : path.table);
            button.dataset.tableName = path.table;
            button.classList.add('sub-nav-btn');
            button.style.paddingLeft = `${12 + level * 12}px`;
        } else {
            button.textContent = path.label!;
            button.classList.add('nav-folder-header');
            button.disabled = true;
        }

        container.appendChild(button);
        if (path.children && path.children.length > 0) {
            renderNavLevel(path.children, container, level + 1);
        }
    });
}

// =============================================================================
// DISPLAY PANEL DISPATCH
// =============================================================================

async function handleDisplayPanelClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Hint item click
    if (target.classList.contains('hint-item')) {
        const value = target.dataset.value;
        const input = target.closest('.hint-container')?.querySelector('.has-hints') as HTMLInputElement | HTMLTextAreaElement;
        if (value && input) {
            input.value = value;
            hideAllHintDropdowns();
        }
        return;
    }

    // Record list item click (navigates to read-only detail view)
    const listItem = target.closest('.record-list > li, .record-table > tbody > tr');
    if (listItem instanceof HTMLElement) {
        const { tableName, id } = listItem.dataset;
        if (tableName && id) {
            onReturn = () => renderTableList(tableName);
            await showRecordDetails(tableName, id);
        }
        return;
    }

    // Foreign key "Go To" link click
    if (target.matches('.goto-link')) {
        const { tableName, id } = target.dataset;
        if (tableName && id) {
            onReturn = () => renderTableList(tableName);
            await showRecordDetails(tableName, id);
        }
        return;
    }

    // "+ Add New [Record]" button click
    if (target.matches('.add-new-btn')) {
        const { tableName } = target.dataset;
        if (tableName) {
            onReturn = () => renderTableList(tableName);
            currentWorkUnit = {
                mode: 'create',
                initialState: { _children: {} },
                currentState: { _children: {} }
            };
            await renderEditableForm(tableName);
        }
        return;
    }

    // Dependent child table button click
    if (target.matches('.dependents-container > button:not(.add-new-dependent-btn)')) {
        const { dependentTable, parentTable, parentId, isReadOnly } = target.dataset;
        if (dependentTable && parentTable && parentId) {
            onReturn = () => showRecordDetails(parentTable, parentId);
            const dependentInfo = dependents.find((d) => d.table === dependentTable)!;
            await renderDependentList(parentTable, parentId, dependentInfo, isReadOnly === 'true');
        }
        return;
    }

    // "Group By" button click
    if (target.matches('.grouping-choice-btn')) {
        const { tableName, groupBy } = target.dataset;
        if (tableName && groupBy) {
            await renderGroupedList(tableName, groupBy);
        }
        return;
    }

    // "View Full List" button click (from grouped view)
    if (target.matches('.flat-list-choice-btn')) {
        const { tableName } = target.dataset;
        if (tableName) {
            await renderTableList(tableName);
        }
        return;
    }

    // "Modify" button click (on detail view)
    if (target.matches('.modify-btn')) {
        const { tableName, record } = target.dataset;
        if (tableName && record) {
            const recordObject = JSON.parse(record);
            const transactionUnit = await fetchTransactionUnit(tableName, recordObject.id);
            currentWorkUnit = {
                mode: 'modify',
                initialState: structuredClone(transactionUnit),
                currentState: transactionUnit
            };
            onReturn = () => showRecordDetails(tableName, recordObject.id.toString());
            await renderEditableForm(tableName, currentWorkUnit.currentState);
        }
        return;
    }

    // "Delete" button click
    if (target.matches('.delete-btn')) {
        const { tableName, recordId } = target.dataset;
        if (tableName && recordId) {
            handleDelete(tableName, recordId);
        }
        return;
    }

    // "+ Add New [Child]" button click
    if (target.matches('.add-new-dependent-btn')) {
        const { dependentTable, parentTable, parentId } = target.dataset;
        if (dependentTable && parentTable && parentId) {
            const fkColumn = Object.values(appMetadata[dependentTable].columns).find(
                (c) => c.isForeignKey && c.foreignKeyTable === parentTable
            );
            if (fkColumn) {
                onReturn = () => showRecordDetails(parentTable, parentId);
                const initialChildRecord: Record<string, any> = {};
                initialChildRecord[fkColumn.column] = parentId;
                await renderEditableForm(dependentTable, initialChildRecord);
            } else {
                showErrorModal(`Configuration Error: Could not find foreign key from '${dependentTable}' to '${parentTable}'.`);
            }
        }
        return;
    }
}

// =============================================================================
// RECURSIVE TRANSACTION UNIT (WORK UNIT)
// =============================================================================

async function fetchTransactionUnit(tableName: string, recordId: string | number): Promise<any> {
    const parentSql = `SELECT * FROM ${tableName} WHERE id = ${recordId}`;
    const parentRecords = await queryDatabase<any>(parentSql);
    const parentRecord = parentRecords[0];

    if (!parentRecord) {
        throw new Error(`Record ${recordId} not found in table ${tableName}`);
    }

    parentRecord._children = {};
    const dependentsForParent = dependents.filter((d) => d.parent === tableName);

    for (const dependent of dependentsForParent) {
        const fkToParent = Object.values(appMetadata[dependent.table].columns).find(
            (c) => c.isForeignKey && c.foreignKeyTable === tableName
        );

        if (fkToParent) {
            const childSql = `SELECT id FROM ${dependent.table} WHERE "${fkToParent.column}" = ${recordId}`;
            const childIds = await queryDatabase<{ id: number }>(childSql);

            const childRecords = await Promise.all(
                childIds.map((child) => fetchTransactionUnit(dependent.table, child.id))
            );
            parentRecord._children[dependent.table] = childRecords;
        }
    }

    return parentRecord;
}

// =============================================================================
// FORM SUBMISSION (UPDATE & INSERT)
// =============================================================================

async function handleFormSubmit(tableName: string, recordId: number | string | null, originalRecord: any = null) {
    const form = displayPanel.querySelector('form')!;
    const formData = new FormData(form);
    const tableInfo = appMetadata[tableName];

    try {
        let sql = '';

        if (recordId && originalRecord) {
            // --- UPDATE LOGIC ---
            const setClauses: string[] = [];
            formData.forEach((newValue, columnName) => {
                const columnMeta = tableInfo.columns[columnName];
                if (!columnMeta || !columnMeta.canModify) return;

                const originalValue = (originalRecord[columnName] ?? '').toString();

                if (newValue !== originalValue) {
                    let formattedValue: string;
                    if (newValue === '') {
                        formattedValue = 'NULL';
                    } else {
                        const type = columnMeta.dbDataType.toLowerCase();
                        if (type.includes('char') || type.includes('text') || columnMeta.isEnum) {
                            formattedValue = `'${(newValue as string).replace(/'/g, "''")}'`;
                        } else if (type === 'json' || type === 'jsonb') {
                            formattedValue = `'${(newValue as string).replace(/'/g, "''")}'::jsonb`;
                        } else {
                            formattedValue = newValue as string;
                        }
                    }
                    setClauses.push(`"${columnName}" = ${formattedValue}`);
                }
            });

            if (setClauses.length === 0) {
                alert('No changes were made.');
                if (onReturn) await onReturn();
                return;
            }

            sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ${recordId}`;
            await executeDml(sql);
            if (statusMessage) statusMessage.textContent = `Record #${recordId} updated successfully.`;
            alert('✓ Record updated successfully!');
            if (onReturn) await onReturn();
        } else {
            // --- CREATE LOGIC ---
            const columns: string[] = [];
            const values: string[] = [];

            formData.forEach((value, key) => {
                const columnMeta = tableInfo.columns[key];
                if (!columnMeta || !columnMeta.canModify) return;

                columns.push(`"${key}"`);
                const type = columnMeta.dbDataType.toLowerCase();

                if (value === '') {
                    if (type.includes('char') || type.includes('text')) {
                        values.push("''");
                    } else {
                        values.push('NULL');
                    }
                } else {
                    if (type.includes('char') || type.includes('text') || columnMeta.isEnum) {
                        values.push(`'${(value as string).replace(/'/g, "''")}'`);
                    } else if (type === 'json' || type === 'jsonb') {
                        values.push(`'${(value as string).replace(/'/g, "''")}'::jsonb`);
                    } else {
                        values.push(value as string);
                    }
                }
            });

            if (columns.length === 0) {
                alert('Cannot submit an empty form.');
                return;
            }

            sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING id`;
            const result = await queryDatabase<{ id: number | string }>(sql);

            if (!result || result.length === 0) {
                throw new Error('Database did not return the new ID.');
            }

            const newRecordId = result[0].id;
            if (statusMessage) statusMessage.textContent = `Record #${newRecordId} added successfully.`;
            alert('✓ Record created successfully!');

            onReturn = () => renderTableList(tableName);
            await showRecordDetails(tableName, newRecordId.toString());
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        showErrorModal(`Operation Failed: ${errorMessage}`);
    }
}

// =============================================================================
// LIST RENDERERS
// =============================================================================

async function renderTableList(tableName: string) {
    const tableInfo = appMetadata[tableName];
    if (!tableInfo) return;

    displayPanel.innerHTML = `<h3>Loading ${tableInfo.label}...</h3>`;
    const displayCol = getDisplayColumnName(tableName);

    try {
        if (tableInfo.parentColumn) {
            const sql = `SELECT id, "${displayCol}" as name, "${tableInfo.parentColumn}" as "parentId" FROM ${tableName} ORDER BY "${displayCol}" ASC`;
            const records = await queryDatabase<{ id: number | string; name: string; parentId: number | string | null }>(sql);
            renderHierarchicalList(tableName, records);
        } else {
            const sql = `SELECT id, "${displayCol}" as name FROM ${tableName} ORDER BY "${displayCol}" ASC`;
            const records = await queryDatabase<{ id: number | string; name: string }>(sql);
            renderFlatList(tableName, records);
        }
    } catch (error) {
        displayPanel.innerHTML = `<p style="color:red">Error loading list: ${(error as Error).message}</p>`;
    }
}

function renderFlatList(tableName: string, records: { id: number | string; name: string }[]) {
    const tableInfo = appMetadata[tableName];
    displayPanel.innerHTML = '';

    const controlBar = document.createElement('div');
    controlBar.className = 'control-bar';
    displayPanel.appendChild(controlBar);

    const addButton = document.createElement('button');
    const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, '');
    addButton.textContent = `+ Add New ${singular}`;
    addButton.className = 'add-new-btn';
    addButton.dataset.tableName = tableName;
    controlBar.appendChild(addButton);

    // Group By Options for non-nullable FKs
    const potentialParents = Object.values(tableInfo.columns).filter((c) => c.isForeignKey && !c.isNullable);
    if (potentialParents.length > 0) {
        const groupLabel = document.createElement('span');
        groupLabel.textContent = 'Group by:';
        groupLabel.style.marginLeft = '20px';
        groupLabel.style.fontWeight = 'bold';
        controlBar.appendChild(groupLabel);

        potentialParents.forEach((parentColumn) => {
            const parentTableInfo = appMetadata[parentColumn.foreignKeyTable!];
            if (parentTableInfo) {
                const button = document.createElement('button');
                button.textContent = parentTableInfo.singularLabel || parentTableInfo.label;
                button.className = 'grouping-choice-btn';
                button.dataset.tableName = tableName;
                button.dataset.groupBy = parentColumn.column;
                button.style.marginLeft = '6px';
                controlBar.appendChild(button);
            }
        });
    }

    const heading = document.createElement('h3');
    heading.textContent = `${tableInfo.label} (${records.length})`;
    displayPanel.appendChild(heading);

    if (records.length === 0) {
        const empty = document.createElement('div');
        empty.style.padding = '24px';
        empty.style.color = '#64748b';
        empty.textContent = 'No records found in this table.';
        displayPanel.appendChild(empty);
        return;
    }

    const list = document.createElement('ul');
    list.classList.add('record-list');
    records.forEach((record) => {
        const li = document.createElement('li');
        li.textContent = record.name || `(ID: ${record.id})`;
        li.dataset.id = record.id.toString();
        li.dataset.tableName = tableName;
        list.appendChild(li);
    });
    displayPanel.appendChild(list);
}

function renderHierarchicalList(tableName: string, records: { id: number | string; name: string; parentId: number | string | null }[]) {
    const tableInfo = appMetadata[tableName];
    displayPanel.innerHTML = '';

    const controlBar = document.createElement('div');
    controlBar.className = 'control-bar';
    displayPanel.appendChild(controlBar);

    const addButton = document.createElement('button');
    const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, '');
    addButton.textContent = `+ Add New Root ${singular}`;
    addButton.className = 'add-new-btn';
    addButton.dataset.tableName = tableName;
    controlBar.appendChild(addButton);

    const heading = document.createElement('h3');
    heading.textContent = `${tableInfo.label} Hierarchy (${records.length})`;
    displayPanel.appendChild(heading);

    const buildTree = (parentId: number | string | null): TreeNode[] => {
        return records
            .filter((r) => r.parentId === parentId)
            .map((r) => ({
                id: r.id,
                parentId: r.parentId,
                name: r.name || `(ID: ${r.id})`,
                children: buildTree(r.id)
            }));
    };

    const tree = buildTree(null);
    const renderBranch = (nodes: TreeNode[], container: HTMLElement) => {
        const ul = document.createElement('ul');
        ul.classList.add('record-list');
        nodes.forEach((node) => {
            const li = document.createElement('li');
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

async function renderGroupedList(tableName: string, groupByColumnName: string) {
    const tableInfo = appMetadata[tableName];
    const parentColumn = tableInfo.columns[groupByColumnName];
    const parentTable = parentColumn.foreignKeyTable!;
    const parentDisplayCol = getDisplayColumnName(parentTable);
    const displayCol = getDisplayColumnName(tableName);

    displayPanel.innerHTML = `<h3>Loading grouped records...</h3>`;

    try {
        const [records, parentRecords] = await Promise.all([
            queryDatabase<any[]>(`SELECT * FROM ${tableName}`),
            queryDatabase<{ id: number | string; name: string }[]>(`SELECT id, "${parentDisplayCol}" as name FROM ${parentTable} ORDER BY "${parentDisplayCol}" ASC`)
        ]);

        displayPanel.innerHTML = '';

        const controlBar = document.createElement('div');
        controlBar.className = 'control-bar';
        displayPanel.appendChild(controlBar);

        const flatListBtn = document.createElement('button');
        flatListBtn.textContent = '‹ View Full List';
        flatListBtn.className = 'flat-list-choice-btn';
        flatListBtn.dataset.tableName = tableName;
        controlBar.appendChild(flatListBtn);

        const heading = document.createElement('h3');
        heading.textContent = `${tableInfo.label} grouped by ${appMetadata[parentTable]?.singularLabel || parentTable}`;
        displayPanel.appendChild(heading);

        parentRecords.forEach((parent) => {
            const children = records.filter((r) => String(r[groupByColumnName]) === String(parent.id));
            if (children.length > 0) {
                const groupContainer = document.createElement('div');
                groupContainer.style.marginBottom = '20px';

                const groupTitle = document.createElement('h4');
                groupTitle.style.marginBottom = '8px';
                groupTitle.textContent = `${parent.name} (${children.length})`;
                groupContainer.appendChild(groupTitle);

                const list = document.createElement('ul');
                list.classList.add('record-list');
                children.forEach((child) => {
                    const li = document.createElement('li');
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
        displayPanel.innerHTML = `<p style="color:red">Error: ${(error as Error).message}</p>`;
    }
}

// =============================================================================
// RECORD DETAILS & FORMS
// =============================================================================

async function showRecordDetails(tableName: string, id: string | number) {
    displayPanel.innerHTML = `<h3>Loading Details...</h3>`;
    try {
        const sql = `SELECT * FROM ${tableName} WHERE id = ${id}`;
        const records = await queryDatabase<any[]>(sql);

        if (records.length === 0) {
            throw new Error(`Record with ID ${id} not found in '${tableName}'.`);
        }

        const record = records[0];
        if (isKnownRecord(record)) {
            const displayCol = getDisplayColumnName(tableName);
            const titleVal = record[displayCol] || `ID: ${record.id}`;
            const title = `'${titleVal}'`;

            const form = await createForm(tableName, title, true, record);
            displayPanel.innerHTML = '';
            displayPanel.appendChild(form);
        }
    } catch (error) {
        displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${(error as Error).message}</p>`;
    }
}

async function renderEditableForm(tableName: string, record: any = null) {
    const tableInfo = appMetadata[tableName];
    const isUpdating = currentWorkUnit?.mode === 'modify';
    const displayCol = getDisplayColumnName(tableName);

    let formTitle: string;
    if (isUpdating && record) {
        const titleVal = record[displayCol] || `ID: ${record.id}`;
        formTitle = `Modify '${titleVal}'`;
    } else {
        const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, '');
        formTitle = `Add New ${singular}`;
    }

    displayPanel.innerHTML = '';
    const form = await createForm(tableName, formTitle, false, record);
    displayPanel.appendChild(form);
}

async function createForm(tableName: string, title: string, isReadOnly: boolean, record: any = null): Promise<HTMLDivElement> {
    const tableInfo = appMetadata[tableName];
    const container = document.createElement('div');
    container.className = 'form-container';

    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.style.marginBottom = '20px';
    container.appendChild(heading);

    const form = document.createElement('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(tableName, record ? record.id : null, record);
    });

    const isUpdating = record !== null && !isReadOnly;

    // Render columns
    for (const columnName in tableInfo.columns) {
        const columnMeta = tableInfo.columns[columnName];
        if (columnName === 'id' && !isReadOnly) continue; // Skip id field on edit/create

        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'form-field';
        if (!columnMeta.isNullable && columnMeta.canModify) {
            fieldContainer.classList.add('is-required');
        }

        const label = document.createElement('label');
        label.textContent = columnMeta.label || columnName;
        fieldContainer.appendChild(label);

        const rawValue = record ? record[columnName] : null;

        if (isReadOnly) {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'form-value';

            if (rawValue === null || rawValue === undefined) {
                valueSpan.textContent = 'NULL';
                valueSpan.classList.add('null-value');
            } else if (typeof rawValue === 'object') {
                valueSpan.textContent = JSON.stringify(rawValue);
            } else {
                valueSpan.textContent = rawValue.toString();
            }

            fieldContainer.appendChild(valueSpan);

            // Foreign Key Link to Target Record
            if (columnMeta.isForeignKey && rawValue !== null && rawValue !== undefined) {
                const targetTable = columnMeta.foreignKeyTable!;
                const targetCol = getDisplayColumnName(targetTable);
                try {
                    const fkSql = `SELECT "${targetCol}" as name FROM ${targetTable} WHERE id = ${rawValue}`;
                    const fkResult = await queryDatabase<{ name: string }>(fkSql);
                    if (fkResult.length > 0) {
                        const link = document.createElement('a');
                        link.className = 'goto-link';
                        link.dataset.tableName = targetTable;
                        link.dataset.id = rawValue.toString();
                        link.textContent = `[Go to ${appMetadata[targetTable]?.singularLabel || targetTable}: ${fkResult[0].name}]`;
                        fieldContainer.appendChild(link);
                    }
                } catch (e) {
                    // Ignore FK name resolution errors
                }
            }
        } else {
            // EDITABLE FORM INPUTS
            let inputElement: HTMLElement;

            if (columnMeta.isEnum) {
                const select = document.createElement('select');
                select.name = columnName;

                if (columnMeta.isNullable) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '-- (None / Null) --';
                    select.appendChild(defaultOption);
                }

                columnMeta.enumValues.forEach((enumVal) => {
                    const option = document.createElement('option');
                    option.value = enumVal;
                    option.textContent = enumVal;
                    if (rawValue === enumVal) option.selected = true;
                    select.appendChild(option);
                });

                inputElement = select;
            } else if (columnMeta.rows && columnMeta.rows > 1) {
                const textarea = document.createElement('textarea');
                textarea.name = columnName;
                textarea.rows = columnMeta.rows;
                textarea.cols = columnMeta.len || 50;
                textarea.value = rawValue !== null && rawValue !== undefined ? (typeof rawValue === 'object' ? JSON.stringify(rawValue, null, 2) : rawValue.toString()) : '';
                inputElement = textarea;
            } else {
                const input = document.createElement('input');
                input.type = columnMeta.dbDataType.includes('int') ? 'number' : 'text';
                input.name = columnName;
                input.size = columnMeta.len || 30;
                input.value = rawValue !== null && rawValue !== undefined ? rawValue.toString() : '';
                inputElement = input;
            }

            if (!columnMeta.canModify) {
                (inputElement as HTMLInputElement).readOnly = true;
                inputElement.style.backgroundColor = '#f1f5f9';
            }

            fieldContainer.appendChild(inputElement);
        }

        form.appendChild(fieldContainer);
    }

    // Dependent child table launcher buttons (available on read-only detail view)
    if (isReadOnly && record) {
        const depContainer = document.createElement('div');
        depContainer.className = 'dependents-container';

        const depLabel = document.createElement('strong');
        depLabel.style.width = '100%';
        depLabel.style.marginBottom = '6px';
        depLabel.textContent = 'Dependent Child Relationships:';
        depContainer.appendChild(depLabel);

        for (const dep of tableInfo.dependents) {
            const depTableMeta = appMetadata[dep.table];
            if (!depTableMeta) continue;

            const fkToParent = Object.values(depTableMeta.columns).find(
                (c) => c.isForeignKey && c.foreignKeyTable === tableName
            );

            if (fkToParent) {
                const countSql = `SELECT count(*) FROM ${dep.table} WHERE "${fkToParent.column}" = ${record.id}`;
                const countRes = await queryDatabase<{ count: string }>(countSql);
                const count = countRes[0]?.count || '0';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = `${depTableMeta.label} (${count})`;
                btn.dataset.dependentTable = dep.table;
                btn.dataset.parentTable = tableName;
                btn.dataset.parentId = record.id.toString();
                btn.dataset.isReadOnly = 'true';
                depContainer.appendChild(btn);
            }
        }

        form.appendChild(depContainer);
    }

    // Action Buttons
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    if (isReadOnly && record) {
        const modifyBtn = document.createElement('button');
        modifyBtn.type = 'button';
        modifyBtn.className = 'form-btn primary modify-btn';
        modifyBtn.textContent = '✏️ Modify Record';
        modifyBtn.dataset.tableName = tableName;
        modifyBtn.dataset.record = JSON.stringify(record);
        actions.appendChild(modifyBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'form-btn danger delete-btn';
        deleteBtn.textContent = '🗑️ Delete Record';
        deleteBtn.dataset.tableName = tableName;
        deleteBtn.dataset.recordId = record.id.toString();
        actions.appendChild(deleteBtn);

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'form-btn secondary';
        backBtn.textContent = '‹ Back to List';
        backBtn.addEventListener('click', () => {
            if (onReturn) onReturn();
            else renderTableList(tableName);
        });
        actions.appendChild(backBtn);
    } else {
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'form-btn primary';
        saveBtn.textContent = isUpdating ? '💾 Save Changes' : '➕ Create Record';
        actions.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'form-btn secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            if (onReturn) onReturn();
            else renderTableList(tableName);
        });
        actions.appendChild(cancelBtn);
    }

    form.appendChild(actions);
    container.appendChild(form);
    return container;
}

async function renderDependentList(
    parentTableName: string,
    parentId: string | number,
    dependentInfo: Dependent,
    isReadOnly: boolean = true
) {
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
        const parentRes = await queryDatabase<{ name: string }>(`SELECT "${parentCol}" as name FROM ${parentTableName} WHERE id = ${parentId}`);
        const parentName = parentRes[0]?.name || `ID ${parentId}`;

        const displayCols = dependentInfo.displayColumns || [getDisplayColumnName(dependentTable)];
        const selectCols = ['id', ...displayCols.map((c) => `"${c}"`)];

        const sql = `SELECT ${selectCols.join(', ')} FROM ${dependentTable} WHERE "${fkToParent.column}" = ${parentId}`;
        const records = await queryDatabase<any[]>(sql);

        displayPanel.innerHTML = '';

        const controlBar = document.createElement('div');
        controlBar.className = 'control-bar';
        displayPanel.appendChild(controlBar);

        const backBtn = document.createElement('button');
        backBtn.textContent = `‹ Back to '${parentName}'`;
        backBtn.className = 'add-new-btn';
        backBtn.style.background = '#64748b';
        backBtn.addEventListener('click', () => showRecordDetails(parentTableName, parentId));
        controlBar.appendChild(backBtn);

        const addDepBtn = document.createElement('button');
        const singular = depMeta.singularLabel || depMeta.label.replace(/s$/, '');
        addDepBtn.textContent = `+ Add New ${singular}`;
        addDepBtn.className = 'add-new-btn add-new-dependent-btn';
        addDepBtn.dataset.dependentTable = dependentTable;
        addDepBtn.dataset.parentTable = parentTableName;
        addDepBtn.dataset.parentId = parentId.toString();
        controlBar.appendChild(addDepBtn);

        const heading = document.createElement('h3');
        heading.textContent = `${depMeta.label} for '${parentName}' (${records.length})`;
        displayPanel.appendChild(heading);

        if (records.length === 0) {
            const empty = document.createElement('div');
            empty.style.padding = '24px';
            empty.style.color = '#64748b';
            empty.textContent = `No ${depMeta.label.toLowerCase()} attached to this record yet.`;
            displayPanel.appendChild(empty);
            return;
        }

        const list = document.createElement('ul');
        list.classList.add('record-list');
        const mainCol = displayCols[0] || 'id';

        records.forEach((rec) => {
            const li = document.createElement('li');
            li.textContent = rec[mainCol] || `(ID: ${rec.id})`;
            li.dataset.id = rec.id.toString();
            li.dataset.tableName = dependentTable;
            list.appendChild(li);
        });

        displayPanel.appendChild(list);
    } catch (e) {
        displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${(e as Error).message}</p>`;
    }
}

// =============================================================================
// DELETION & MODALS
// =============================================================================

async function handleDelete(tableName: string, recordId: string | number) {
    const tableInfo = appMetadata[tableName];
    const confirmed = confirm(`Are you sure you want to delete this ${tableInfo.singularLabel || tableName} record (ID: ${recordId})?`);
    if (!confirmed) return;

    try {
        const sql = `DELETE FROM ${tableName} WHERE id = ${recordId}`;
        await executeDml(sql);
        if (statusMessage) statusMessage.textContent = `Record #${recordId} deleted from ${tableName}.`;
        alert('✓ Record deleted successfully.');
        renderTableList(tableName);
    } catch (e) {
        showErrorModal(`Delete Failed: ${(e as Error).message}`);
    }
}

export function closeModal() {
    mainModal.classList.remove('open');
    modalBody.innerHTML = '';
}

export function showErrorModal(message: string) {
    modalBody.innerHTML = `
        <h3 style="color: #dc2626; margin-bottom: 12px;">⚠️ Database Operation Error</h3>
        <p style="font-size: 13.5px; line-height: 1.5; color: #334155;">${message}</p>
        <button style="margin-top: 20px; padding: 6px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; cursor: pointer;" onclick="document.getElementById('main-modal').classList.remove('open')">Dismiss</button>
    `;
    mainModal.classList.add('open');
}

function showHintsFor(input: HTMLInputElement | HTMLTextAreaElement) {
    // Hints dropdown placeholder for future extension
}

function hideAllHintDropdowns() {
    document.querySelectorAll('.hint-dropdown').forEach((d) => d.remove());
}
