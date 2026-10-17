//
// crud/src/uiForms.ts   --- handle UI forms ---
//
import { TableMap } from './types';

import { queryDatabase, executeSql } from '../../../clib/api';

// --- DOM Element References ---
const displayPanel = document.getElementById('display-panel') as HTMLDivElement;
const modalBody = document.getElementById('modal-body') as HTMLDivElement;
const mainModal = document.getElementById('main-modal') as HTMLDivElement;

type FormMode = 'C' | 'R' | 'U';
type DbVal = boolean | number | string | null;

let table: string;
let instanceId: number | undefined;
let mode: FormMode;
let rec: DbVal[];

export function renderForm(forTable: string, forInstance?: number) {
    table = forTable;
    if (typeof forInstance === 'number')
        mode = 'R';
        instanceId = for
        setRecVals();
    if (mode === 'C') {

    }
}

//

async function getRec(table: string, name: string) {
    let query = 'SELECT ';
    let cnt = 0;
    const keys = Object.keys(tableMap[table].columns);
    const keyLen = keys.length;
    keys.forEach((c) => {
        const col = tableMap[table].columns[c];
        ++cnt;
        if (cnt < keyLen) {
            query += `${col.column}, `;
        } else {
            query += `${col.column} `;
        }
    });
    query += `FROM ${table} WHERE name = '${name}'`;

    return await queryDatabase<DBVal>(query);
}

export async function formsClickHandler(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.matches('.modify-btn')) {
        const { tableName, record } = target.dataset;
        await renderEditableForm(tableName);
        return;
    }
    if (target.matches('.goto-link')) {
        const { tableName, id } = target.dataset;
        if (tableName && id) {
            onReturn = () => renderTableList(tableName);
            await showRecordDetails(tableName, id);
        }
        return;
    }
    if (target.matches('.delete-btn')) {
        const { tableName, recordId } = target.dataset;
        if (tableName && recordId) {
            handleDelete(tableName, recordId);
        }
        return;
    }
    if (target.matches('.dependency-nav-btn')) {
        const { tableName, recordId } = target.dataset;
        if (tableName && recordId) {
            closeModal();
            showRecordDetails(tableName, recordId);
        }
        return;
    }
    if (target.matches('.add-new-dependent-btn')) {
        const tableMap = uiStatus.metadata as tableMap;
        const { dependentTable, parentTable, parentId } = target.dataset;
        if (dependentTable && parentTable && parentId) {
            const fkColumn = Object.values(tableMap[dependentTable].columns).find(
                (c) => c.isForeignKey && c.foreignKeyTable === parentTable
            );
            if (fkColumn) {
                onReturn = () => showRecordDetails(parentTable, parentId);
                await renderEditableForm(dependentTable, null);
            } else {
                showErrorModal(
                    `Configuration Error: Could not find a foreign key from '${dependentTable}' to '${parentTable}'.`
                );
            }
        }
        return;
    }
    if (target.matches('.dependents-container > button')) {
        const { dependentTable, parentTable, parentId, isReadOnly } = target.dataset;
        if (dependentTable && parentTable && parentId && isReadOnly !== undefined) {
            // Set the return path to the parent's detail view
            onReturn = () => showRecordDetails(parentTable, parentId);
            const dependentInfo = dependents.find((d) => d.table === dependentTable)!;
            // Pass the read-only flag to the list renderer
            await renderDependentList(parentTable, parentId, dependentInfo, isReadOnly === 'true');
        }
        return;
    }
    if (target.classList.contains('hint-item')) {
        const value = target.dataset.value;
        const input = target.closest('.hint-container')?.querySelector('.has-hints') as
            | HTMLInputElement
            | HTMLTextAreaElement;
        if (value && input) {
            input.value = value;
            hideAllHintDropdowns();
        }
        return;
    }
}
async function renderDependentList(
    parentTableName: string,
    parentId: string,
    dependentInfo: Dependent,
    isReadOnly: boolean // This flag is now a core part of the function
) {
    const dependentTable = dependentInfo.table;
    const dependentTableMeta = tableMap[dependentTable];

    displayPanel.innerHTML = `<h3>Loading ${dependentTableMeta.label}...</h3>`;

    try {
        // --- 1. Find the relationship key ---
        const fkToParent = Object.values(dependentTableMeta.columns).find(
            (c) => c.isForeignKey && c.foreignKeyTable === parentTableName
        );

        if (!fkToParent) {
            throw new Error(
                `Configuration Error: Could not find relationship from ${dependentTable} to ${parentTableName}`
            );
        }

        // --- 2. Fetch parent's display name for the header ---
        let parentDisplayName = `Parent (ID: ${parentId})`; // Fallback name
        try {
            const parentNameResult = await queryDatabase<{ name: string }>(
                `SELECT name FROM ${parentTableName} WHERE id = ${parentId}`
            );
            if (parentNameResult.length > 0) {
                parentDisplayName = `'${parentNameResult[0].name}'`;
            }
        } catch (e) {
            console.error(`Could not fetch parent name for ${parentTableName}:${parentId}`, e);
        }

        // --- 3. Build the SQL query to fetch dependent records and their display columns ---
        const columnsToSelect: string[] = ['t1.id'];
        const joins: string[] = [];
        let joinCounter = 2;

        dependentInfo.displayColumns.forEach((colName) => {
            const colMeta = dependentTableMeta.columns[colName];
            if (colMeta?.isForeignKey) {
                joins.push(
                    `LEFT JOIN ${colMeta.foreignKeyTable} AS t${joinCounter} ON t1."${colName}" = t${joinCounter}.id`
                );
                // Use a safe alias for the joined column name
                columnsToSelect.push(`t${joinCounter}.name AS "${colName}__display"`);
                joinCounter++;
            } else {
                columnsToSelect.push(`t1."${colName}"`);
            }
        });

        const sql = `
            SELECT ${columnsToSelect.join(', ')}
            FROM ${dependentTable} AS t1
            ${joins.join(' ')}
            WHERE t1."${fkToParent.column}" = ${parentId}
        `;

        const records = await queryDatabase<any[]>(sql);

        // --- 4. Render the UI ---
        displayPanel.innerHTML = `<h3>${dependentTableMeta.label} for ${parentDisplayName}</h3>`;

        // --- 5. Conditionally render the "Add New" button based on the read-only state ---
        if (!isReadOnly) {
            const addButton = document.createElement('button');
            const singularLabel = dependentTableMeta.singularLabel || dependentTableMeta.label.slice(0, -1);
            addButton.textContent = `+ Add New ${singularLabel}`;
            addButton.className = 'add-new-dependent-btn';
            addButton.dataset.dependentTable = dependentTable;
            addButton.dataset.parentTable = parentTableName;
            addButton.dataset.parentId = parentId;
            addButton.style.marginBottom = '15px';
            displayPanel.appendChild(addButton);
        }

        // --- 6. Render the list of records (or a "not found" message) ---
        if (records.length === 0) {
            displayPanel.innerHTML += `<p>No related records found.</p>`;
            return;
        }

        const table = document.createElement('table');
        table.className = 'record-table';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        dependentInfo.displayColumns.forEach((colName) => {
            const th = document.createElement('th');
            th.textContent = dependentTableMeta.columns[colName]?.label || colName;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        for (const record of records) {
            if (isKnownRecord(record)) {
                // Use our type guard for safety
                const row = tbody.insertRow();
                row.dataset.tableName = dependentTable;
                row.dataset.id = record.id.toString();
                row.style.cursor = 'pointer';

                dependentInfo.displayColumns.forEach((colName) => {
                    const cell = row.insertCell();
                    const colMeta = dependentTableMeta.columns[colName];
                    // Use the aliased name for FKs, otherwise the direct column name
                    const value = colMeta?.isForeignKey ? record[`${colName}__display`] : record[colName];
                    cell.textContent = value ?? '---';
                });
            }
        }
        displayPanel.appendChild(table);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${errorMessage}</p>`;
    }
}
async function handleFormSubmit(tableName: string, recordId: number | null, originalRecord: any = null) {
    const form = displayPanel.querySelector('form')!;
    const formData = new FormData(form);
    const tableInfo = tableMap[tableName];

    try {
        let sql = '';

        if (recordId && originalRecord) {
            // --- UPDATE LOGIC ---
            const setClauses: string[] = [];
            formData.forEach((newValue, columnName) => {
                const columnMeta = tableInfo.columns[columnName];
                const originalValue = (originalRecord[columnName] ?? '').toString();

                if (columnMeta.canModify && newValue !== originalValue) {
                    let formattedValue: string;
                    if (newValue === '') {
                        formattedValue = 'NULL';
                    } else {
                        const type = columnMeta.dbDataType;
                        if (type.includes('char') || type.includes('text') || columnMeta.isEnum) {
                            formattedValue = `'${(newValue as string).replace(/'/g, "''")}'`;
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
            alert('Record updated successfully!');

            // On success, execute the return path callback.
            if (onReturn) await onReturn();
        } else {
            // --- CREATE LOGIC ---
            const columns: string[] = [];
            const values: string[] = [];

            formData.forEach((value, key) => {
                const columnMeta = tableInfo.columns[key];
                if (!columnMeta.canModify) return; // Only include modifiable columns

                columns.push(`"${key}"`);

                const type = columnMeta.dbDataType;

                if (value === '') {
                    if (type.includes('char') || type.includes('text')) {
                        values.push("''");
                    } else {
                        values.push('NULL');
                    }
                } else {
                    if (type.includes('char') || type.includes('text') || type === 'ARRAY' || columnMeta.isEnum) {
                        values.push(`'${(value as string).replace(/'/g, "''")}'`);
                    } else {
                        values.push(value as string);
                    }
                }
            });

            if (columns.length === 0) {
                alert('Cannot submit an empty form.');
                return;
            }

            // Add "RETURNING id" to get the new record's ID back from the database.
            sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING id`;

            // The queryDatabase function can return the result of DML with RETURNING
            const result = await queryDatabase<{ id: number }>(sql);

            if (!result || result.length === 0) {
                throw new Error('Failed to create record: The database did not return the new ID.');
            }

            const newRecordId = result[0].id;
            alert('Record added successfully!');

            // --- THE "CREATE-FIRST" WORKFLOW ---
            // Instead of going back, navigate directly to the detail view of the new record.
            // This will render the "Edit" form where child buttons will be enabled.
            onReturn = () => renderTableList(tableName); // Set the return path for the new screen.
            await showRecordDetails(tableName, newRecordId.toString());
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        showErrorModal(`Failed to save record:\n\n${errorMessage}`);
    }
}
async function renderForeignKey(span: HTMLSpanElement, targetTable: string, id: number, showLink: boolean = true) {
    try {
        const sql = `SELECT name FROM ${targetTable} WHERE id = ${id}`;
        const result = await queryDatabase<{ name: string }>(sql);
        if (result.length > 0) {
            span.textContent = result[0].name;
            if (showLink) {
                const link = document.createElement('a');
                link.className = 'goto-link';
                link.textContent = ' ➔';
                link.title = `Go to this ${tableMap[targetTable].label} record`;
                link.dataset.tableName = targetTable;
                link.dataset.id = id.toString();
                span.appendChild(link);
            }
        } else {
            span.textContent = `[ID: ${id}] Not Found`;
            span.classList.add('error-value');
        }
    } catch (e) {
        span.textContent = `[ID: ${id}] Error`;
        span.classList.add('error-value');
        console.error(`Failed to resolve FK for table ${targetTable}, ID ${id}`, e);
    }
}
export async function showRecordDetails(tableName: string, id: string) {
    renderMinimalNav(); // Shrink the nav panel
    displayPanel.innerHTML = `<h3>Loading Details...</h3>`;
    try {
        const sql = `SELECT * FROM ${tableName} WHERE id = ${id}`;
        const records = await queryDatabase<any[]>(sql);

        if (records.length === 0) {
            throw new Error(`Record with ID ${id} not found in table '${tableName}'.`);
        }

        const record = records[0];

        // --- THE FIX IS HERE ---
        // Use our existing type guard to prove the shape of the record.
        if (isKnownRecord(record)) {
            // Now TypeScript knows that record.name and record.id are safe to access.
            const title = record.name ? `'${record.name}'` : `(ID: ${record.id})`;

            // Call the central form creator in read-only mode.
            const form = await createForm(tableName, title, true, record);

            displayPanel.innerHTML = ''; // Clear loading message
            displayPanel.appendChild(form);
        } else {
            // This case handles if the database returns a malformed object.
            throw new Error(`Record with ID ${id} from table '${tableName}' is invalid or missing an ID.`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        displayPanel.innerHTML = `<h3 style="color:red">Error</h3><p>${errorMessage}</p>`;
    }
}
export async function renderEditableForm(tableName: string, record: any = null) {
    renderMinimalNav(); // This can be simplified now

    const tableInfo = tableMap[tableName];
    const isUpdating = currentWorkUnit?.mode === 'modify';
    const singular = tableInfo.singularLabel || tableInfo.label.replace(/s$/, '');

    const title = isUpdating ? `Edit ${singular}: '${record.name || `ID: ${record.id}`}'` : `Add New ${singular}`;

    const form = await createForm(tableName, title, false, isUpdating ? record : {});

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // The record passed here is the original record for diffing.
        handleFormSubmit(tableName, record ? record.id : null, isUpdating ? currentWorkUnit!.initialState : null);
    });

    displayPanel.innerHTML = '';
    displayPanel.appendChild(form);
    setupFormDynamics(form, tableInfo);
}
function renderDependencyPruner(parentTable: string, depTable: string, records: { id: number; name: string }[]) {
    const parentInfo = tableMap[parentTable];
    const depInfo = tableMap[depTable];

    // The nav panel should just have a "Back" button
    renderMinimalNav();

    const title = 'Deletion Blocked by Dependencies';
    const message = `<p>Cannot delete this ${parentInfo.singularLabel || parentInfo.label}. You must first address the following referenced ${depInfo.label}:</p>`;

    displayPanel.innerHTML = ''; // Clear the panel
    const titleEl = document.createElement('h2');
    titleEl.style.color = '#c00';
    titleEl.textContent = title;
    displayPanel.appendChild(titleEl);
    displayPanel.innerHTML += message;

    const listContainer = document.createElement('div');
    listContainer.className = 'dependency-list-buttons';

    records.forEach((rec) => {
        const button = document.createElement('button');
        button.textContent = rec.name;
        button.className = 'dependency-nav-btn';
        button.dataset.tableName = depTable;
        button.dataset.recordId = rec.id.toString();
        listContainer.appendChild(button);
    });

    displayPanel.appendChild(listContainer);
}
async function createForm(
    tableName: string,
    title: string,
    isReadOnly: boolean,
    initialValues: Record<string, any>
): Promise<HTMLFormElement> {
    const tableInfo = tableMap[tableName];
    const form = document.createElement('form');
    form.className = 'form-container';
    form.setAttribute('autocomplete', 'off');
    form.dataset.isReadOnly = isReadOnly.toString();

    // Create a header container for the title and action buttons
    const headerDiv = document.createElement('div');
    headerDiv.className = 'form-header';

    const titleElement = document.createElement('h2');
    titleElement.textContent = `${tableInfo.label}: ${title}`;
    headerDiv.appendChild(titleElement);

    // Add Modify and Delete buttons ONLY on a read-only view of an existing record.
    if (isReadOnly && initialValues.id) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'action-buttons';

        // Modify Button
        const modifyButton = document.createElement('button');
        modifyButton.type = 'button';
        modifyButton.textContent = 'Modify';
        modifyButton.className = 'modify-btn';
        modifyButton.dataset.tableName = tableName;
        modifyButton.dataset.record = JSON.stringify(initialValues);
        buttonContainer.appendChild(modifyButton);

        // Delete Button
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.dataset.tableName = tableName;
        // --- THIS IS THE KEY ATTRIBUTE FOR THE "CREATE-FIRST" WORKFLOW ---
        deleteButton.dataset.recordId = initialValues.id.toString();
        deleteButton.dataset.recordName = initialValues.name || `ID: ${initialValues.id}`;
        deleteButton.style.backgroundColor = '#f8d7da';
        buttonContainer.appendChild(deleteButton);

        headerDiv.appendChild(buttonContainer);
    }

    form.appendChild(headerDiv);

    // Render all form fields
    const fieldRenderPromises: Promise<void>[] = [];
    for (const columnName in tableInfo.columns) {
        const columnMeta = tableInfo.columns[columnName];
        const value = initialValues[columnName] ?? '';

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-field';

        const label = document.createElement('label');
        label.setAttribute('for', `field-${columnName}`);
        label.textContent = columnMeta.label || columnName;
        fieldDiv.appendChild(label);

        const valueContainer = document.createElement('div');
        valueContainer.className = 'value-container';
        fieldDiv.appendChild(valueContainer);

        const isEditable = !isReadOnly && columnMeta.canModify;

        if (isEditable) {
            const control = createEditableControl(tableName, columnName, value, fieldRenderPromises);
            valueContainer.appendChild(control);
        } else {
            const readOnlySpan = createReadOnlySpan(columnMeta, value, fieldRenderPromises);
            valueContainer.appendChild(readOnlySpan);
        }

        form.appendChild(fieldDiv);
    }

    // Render the container and buttons for dependent tables
    const dependentsForThisTable = dependents.filter((d) => d.parent === tableName);
    if (dependentsForThisTable.length > 0) {
        const dependentsContainer = document.createElement('div');
        dependentsContainer.className = 'dependents-container';
        const dependentsHeader = document.createElement('h4');
        dependentsHeader.textContent = 'Related Information';
        dependentsContainer.appendChild(dependentsHeader);

        const parentId = initialValues.id || null;
        const buttonPromises = dependentsForThisTable.map((dep) =>
            createDependentButton(dependentsContainer, dep, parentId)
        );
        await Promise.all(buttonPromises);
        form.appendChild(dependentsContainer);
    }

    // Add the Submit button for editable forms
    if (!isReadOnly) {
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit';
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.style.cursor = 'not-allowed';
        form.appendChild(submitButton);
    }

    await Promise.all(fieldRenderPromises);
    return form;
}
async function createDependentButton(
    container: HTMLElement,
    dependent: Dependent,
    parentId: number | null // This can be null for new parent records
) {
    const button = document.createElement('button');
    const dependentTableInfo = tableMap[dependent.table];

    // Store all necessary metadata on the button itself for the dynamic updater function.
    button.textContent = dependentTableInfo.label;
    button.dataset.dependentTable = dependent.table;
    button.dataset.parentTable = dependent.parent;
    if (parentId) {
        button.dataset.parentId = parentId.toString();
    }

    // If there's a table-level condition, store its details on the button for dynamic checks.
    if (dependentTableInfo.condition) {
        const condition = dependentTableInfo.condition;
        button.dataset.enablingColumn = condition.enablingColumn;
        button.dataset.enablingValues = JSON.stringify(condition.enablingValues);
    }

    // For the "no children" check, we only need to query the DB if we are on an EXISTING parent record.
    // For new records, childCount is irrelevant as the button will be enabled (if relevant).
    if (parentId) {
        try {
            const fkToParent = Object.values(dependentTableInfo.columns).find(
                (c) => c.isForeignKey && c.foreignKeyTable === dependent.parent
            );
            if (fkToParent) {
                const countSql = `SELECT COUNT(*) as count FROM ${dependent.table} WHERE "${fkToParent.column}" = ${parentId}`;
                const result = await queryDatabase<{ count: string }>(countSql);
                const childCount = parseInt(result[0].count, 10);
                // Store the count on the button for the updater to use without re-querying.
                button.dataset.childCount = childCount.toString();
            } else {
                button.dataset.childCount = '0'; // Default if FK not found
            }
        } catch (e) {
            console.error(`Failed to get child count for ${dependent.table}`, e);
            button.dataset.childCount = '0'; // Default on error
        }
    }

    container.appendChild(button);
}
function updateDependentButtons(form: HTMLFormElement) {
    const formData = new FormData(form);
    const isReadOnly = form.dataset.isReadOnly === 'true';
    const isCreatingNew = !form.querySelector('[data-record-id]'); // A way to check if we're on an edit form

    form.querySelectorAll('.dependents-container > button').forEach((buttonElement) => {
        const button = buttonElement as HTMLButtonElement;
        const { dependentTable, enablingColumn, enablingValues, childCount } = button.dataset;

        // Rule 0: If we are creating a new parent, child buttons are always disabled.
        if (isCreatingNew) {
            button.disabled = true;
            button.title = 'You must save this record before you can add related information.';
            button.style.opacity = '0.5';
            // We only check irrelevance for display purposes. The button remains disabled.
            if (enablingColumn && enablingValues) {
                const parsedEnablingValues: string[] = JSON.parse(enablingValues);
                const switchValue = (formData.get(enablingColumn) as string | null) ?? '';
                if (!parsedEnablingValues.includes(switchValue)) {
                    button.textContent = `${tableMap[dependentTable!].label} (Irrelevant)`;
                } else {
                    button.textContent = tableMap[dependentTable!].label;
                }
            }
            return; // Stop processing, the button is disabled.
        }

        // --- The rest of the logic only applies to existing records (Edit/ReadOnly mode) ---

        // RULE 1: Irrelevance Check.
        if (enablingColumn && enablingValues) {
            const parsedEnablingValues: string[] = JSON.parse(enablingValues);
            const switchValue = (formData.get(enablingColumn) as string | null) ?? '';
            if (!parsedEnablingValues.includes(switchValue)) {
                button.disabled = true;
                button.textContent = `${tableMap[dependentTable!].label} (Irrelevant)`;
                button.style.opacity = '0.5';
                return;
            }
        }

        button.textContent = tableMap[dependentTable!].label;
        button.style.opacity = '1';

        // RULE 2: Read-Only Mode Check.
        if (isReadOnly) {
            if (childCount === '0') {
                button.disabled = true;
                button.textContent += ' (no children)';
                button.style.opacity = '0.7';
            } else {
                button.disabled = false;
            }
            return;
        }

        // RULE 3: Editable Mode (for an existing record).
        button.disabled = false;
    });
}
function createReadOnlySpan(columnMeta: EnrichedColumn, value: any, promises: Promise<void>[]): HTMLElement {
    const valueSpan = document.createElement('span');
    valueSpan.className = 'form-value readonly';
    if (value === null || value === '' || value === undefined) {
        valueSpan.textContent = '---';
    } else if (columnMeta.isForeignKey) {
        promises.push(renderForeignKey(valueSpan, columnMeta.foreignKeyTable!, value, true));
    } else {
        valueSpan.textContent = value.toString();
    }
    return valueSpan;
}
function createEditableControl(
    tableName: string,
    columnName: string,
    value: any,
    promises: Promise<void>[]
): HTMLElement {
    const columnMeta = tableMap[tableName].columns[columnName];
    let control: HTMLElement;

    if (columnMeta.isForeignKey || columnMeta.isEnum) {
        const select = document.createElement('select');
        select.id = `field-${columnName}`;
        select.name = columnName; // Set name directly

        if (columnMeta.isForeignKey) {
            promises.push(populateForeignKeyDropdown(select, columnMeta.foreignKeyTable!, value));
        } else {
            select.add(new Option('---', ''));
            columnMeta.enumValues!.forEach((v) => select.add(new Option(v, v, undefined, v === value)));
        }
        control = select;
    } else {
        // --- THIS IS THE CORRECTED LOGIC ---

        // 1. Create the actual form element first.
        const inputElement =
            columnMeta.rows && columnMeta.rows > 1
                ? document.createElement('textarea')
                : document.createElement('input');

        // 2. Set ALL of its essential properties immediately. This is the key.
        inputElement.id = `field-${columnName}`;
        inputElement.name = columnName; // The most important fix!
        inputElement.value = value ?? '';

        if (inputElement instanceof HTMLTextAreaElement) inputElement.rows = columnMeta.rows!;
        if (inputElement instanceof HTMLInputElement) inputElement.type = 'text';
        if (columnMeta.len) inputElement.style.width = `${columnMeta.len}em`;

        // 3. NOW, if hints are used, wrap the fully-configured element.
        if (columnMeta.useHints) {
            const hintContainer = document.createElement('div');
            hintContainer.className = 'hint-container';
            inputElement.classList.add('has-hints');
            inputElement.dataset.tableName = tableName;
            inputElement.dataset.columnName = columnMeta.column;

            const dropdownDiv = document.createElement('div');
            dropdownDiv.className = 'hint-dropdown';

            hintContainer.appendChild(inputElement);
            hintContainer.appendChild(dropdownDiv);

            control = hintContainer; // The final control is the wrapper div
        } else {
            control = inputElement; // The final control is the input itself
        }
    }

    return control;
}
function setupFormDynamics(form: HTMLFormElement, tableInfo: EnrichedTable) {
    const formChangeHandler = () => {
        // Run all updaters on every form change.
        updateFormVisibility(form, tableInfo);
        updateDependentButtons(form);
        checkFormValidity(form, tableInfo);
    };

    form.addEventListener('input', formChangeHandler);

    // Run the handler once immediately on form load to set the initial state correctly.
    formChangeHandler();
}
function updateFormVisibility(form: HTMLFormElement, tableInfo: EnrichedTable) {
    const formData = new FormData(form);
    const currentValues: Record<string, string> = {};
    formData.forEach((value, key) => {
        currentValues[key] = value as string;
    });

    for (const columnName in tableInfo.columns) {
        // Find the specific value container for this column
        const inputElement = form.querySelector(`[name="${columnName}"]`);
        const valueContainer = inputElement?.closest('.value-container') as HTMLElement | null;
        if (!valueContainer) continue;

        const columnMeta = tableInfo.columns[columnName];
        let isVisible = true;

        // --- Run visibility rules ---
        const condition = columnMeta.condition;
        if (condition) {
            const switchValue = currentValues[condition.enablingColumn];
            isVisible = condition.enablingValues.includes(switchValue);
        }
        /*
        const exclusiveSet = tableInfo.exclusiveFieldSets?.find((set) => Object.values(set.cases).includes(columnName));
        if (exclusiveSet) {
            const switchValue = currentValues[exclusiveSet.switchColumn];
            isVisible = exclusiveSet.cases[switchValue] === columnName;
        }
        */
        // --- Apply visibility to the VALUE CONTAINER ONLY ---
        const input = valueContainer.querySelector('input, select, textarea') as HTMLInputElement;
        if (isVisible) {
            valueContainer.style.visibility = 'visible';
            if (input) input.disabled = false;
        } else {
            valueContainer.style.visibility = 'hidden';
            if (input) {
                input.value = '';
                input.disabled = true; // Disable hidden fields so they aren't submitted
            }
        }
    }
    checkFormValidity(form, tableInfo);
}
function checkFormValidity(form: HTMLFormElement, tableInfo: EnrichedTable) {
    let isFormValid = true;

    // Get a snapshot of the form's current values
    const formData = new FormData(form);
    const currentValues: Record<string, string> = {};
    formData.forEach((value, key) => {
        currentValues[key] = value as string;
    });

    // We must check the validity of EVERY column defined in our metadata
    for (const columnName in tableInfo.columns) {
        const columnMeta = tableInfo.columns[columnName];
        const fieldContainer = form.querySelector(`[name="${columnName}"]`)?.closest('.form-field') as HTMLElement;

        // Only validate fields that are currently visible in the UI
        if (fieldContainer && fieldContainer.style.display !== 'none') {
            let isFieldRequired = false;

            // Rule 1: Is it NOT NULL in the database?
            if (!columnMeta.isNullable) {
                isFieldRequired = true;
            }

            /* Rule 2: Is it the active case of an Exclusive Set?
            const exclusiveSet = tableInfo.exclusiveFieldSets?.find((set) =>
                Object.values(set.cases).includes(columnName)
            );
            if (exclusiveSet) {
                const switchValue = currentValues[exclusiveSet.switchColumn];
                if (exclusiveSet.cases[switchValue] === columnName) {
                    isFieldRequired = true;
                }
            }
            */
            // Rule 3: Is its Sufficient Condition met?
            if (columnMeta.condition) {
                const switchValue = currentValues[columnMeta.condition.enablingColumn];
                if (columnMeta.condition.enablingValues.includes(switchValue)) {
                    isFieldRequired = true;
                }
            }

            // FINAL CHECK for this field: If it's required, it must have a value.
            if (isFieldRequired && !currentValues[columnName]) {
                isFormValid = false;
                // We can break early because we already know the form is invalid.
                break;
            }
        }
    }

    // Final Decision on the Submit button
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
        submitButton.disabled = !isFormValid;
        submitButton.style.opacity = isFormValid ? '1' : '0.5';
        submitButton.style.cursor = isFormValid ? 'pointer' : 'not-allowed';
    }
}
async function handleDelete(tableName: string, recordId: string) {
    try {
        // Step 1: Perform the silent "dry run" to check for dependencies.
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, recordId }),
        });

        const result = await response.json();

        if (response.ok && result.status === 'deletable') {
            // --- SCENARIO A: DELETION IS POSSIBLE (It's a "leaf") ---
            // The dry run succeeded. NOW, and only now, we ask for final confirmation.
            const recordName = document.querySelector('h2')?.textContent || `this record (ID: ${recordId})`;
            if (
                confirm(
                    `This record has no dependencies and can be deleted permanently.\n\nAre you sure you want to delete ${recordName}?`
                )
            ) {
                const sql = `DELETE FROM ${tableName} WHERE id = ${recordId}`;
                await executeDml(sql);

                alert('Record deleted successfully!');

                if (onReturn) {
                    onReturn();
                    onReturn = null;
                } else {
                    await renderTableList(tableName);
                }
            }
            // If user cancels the final confirmation, we do nothing.
        } else if (response.status === 409 && result.error === 'dependency_violation') {
            // --- SCENARIO B: DELETION IS BLOCKED ---
            // The dry run failed. Show the interactive pruner view with NO prior alert.
            handleDependencyError(result.message, tableName, recordId);
        } else {
            // --- SCENARIO C: An unexpected server error ---
            throw new Error(result.message || `Server responded with status ${response.status}`);
        }
    } catch (e) {
        // This catch handles network failures or the thrown error from Scenario C.
        alert(`Operation Failed: ${(e as Error).message}`);
    }
}
async function handleDependencyError(errorMessage: string, parentTable: string, parentId: string) {
    const match = /on table "([^"]+)"/.exec(errorMessage);

    if (match && match[1]) {
        const dependentTableName = match[1];
        const fkToParent = Object.values(tableMap[dependentTableName].columns).find(
            (c) => c.isForeignKey && c.foreignKeyTable === parentTable
        );

        if (fkToParent) {
            // Set the return path BEFORE navigating away
            onReturn = () => showRecordDetails(parentTable, parentId);

            const sql = `SELECT id, name FROM ${dependentTableName} WHERE "${fkToParent.column}" = ${parentId}`;
            const blockingRecords = (await queryDatabase<any>(sql)) as { id: number; name: string }[];

            // Call the new renderer that draws in the main panel
            renderDependencyPruner(parentTable, dependentTableName, blockingRecords);
        } else {
            // Fallback error
            showErrorModal('Configuration error: could not map dependency.');
        }
    } else {
        // Fallback for unexpected error formats
        showErrorModal(`Failed to delete record:\n\n${errorMessage}`);
    }
}

async function populateForeignKeyDropdown(select: HTMLSelectElement, targetTable: string, selectedId: number | null) {
    try {
        const records = await queryDatabase<{ id: number; name: string }>(
            `SELECT id, name FROM ${targetTable} ORDER BY name ASC`
        );
        select.add(new Option('--- (None) ---', ''));
        records.forEach((rec) => {
            const option = new Option(rec.name, rec.id.toString());
            if (rec.id === selectedId) option.selected = true;
            select.add(option);
        });
    } catch (e) {
        console.error(`Failed to populate dropdown for table ${targetTable}`, e);
        select.add(new Option('Error loading options', ''));
        select.disabled = true;
    }
}
export async function showHintsFor(input: HTMLInputElement | HTMLTextAreaElement) {
    const { tableName, columnName } = input.dataset;
    if (!tableName || !columnName) return;

    // Find the dropdown sibling
    const dropdown = input.nextElementSibling as HTMLDivElement;
    if (!dropdown || !dropdown.classList.contains('hint-dropdown')) return;

    // Hide any other open dropdowns first
    hideAllHintDropdowns();

    // Fetch data if the dropdown is empty
    if (dropdown.innerHTML === '') {
        try {
            const sql = `SELECT DISTINCT "${columnName}" AS "hint" FROM ${tableName} WHERE "${columnName}" IS NOT NULL AND "${columnName}" != '' ORDER BY "hint" ASC`;
            const results = await queryDatabase<{ hint: string }>(sql);
            if (results.length === 0) return; // Don't show empty dropdown

            results.forEach((res) => {
                if (res.hint) {
                    const item = document.createElement('div');
                    item.className = 'hint-item';
                    item.textContent = res.hint;
                    item.dataset.value = res.hint;
                    dropdown.appendChild(item);
                }
            });
        } catch (e) {
            console.error(`Failed to fetch hints for ${tableName}.${columnName}`, e);
            return;
        }
    }

    // Show the dropdown if it has content
    if (dropdown.hasChildNodes()) {
        dropdown.style.display = 'block';
    }
}
export function hideAllHintDropdowns() {
    document.querySelectorAll('.hint-dropdown').forEach((d) => {
        (d as HTMLDivElement).style.display = 'none';
    });
}

// for MODAL alerts
function showErrorModal(message: string) {
    modalBody.innerHTML = `<h2 style="color: #c00;">An Error Occurred</h2>`;
    const messagePara = document.createElement('p');
    messagePara.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${message}</pre>`;
    modalBody.appendChild(messagePara);

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.onclick = closeModal; // This now correctly refers to the new function
    modalBody.appendChild(okButton);

    // This now correctly refers to the new function, fixing the "mainModal not used" error.
    openModal();
}
function openModal() {
    mainModal.style.display = 'flex';
}
export function closeModal() {
    mainModal.style.display = 'none';
    modalBody.innerHTML = ''; // Clear content on close
}
