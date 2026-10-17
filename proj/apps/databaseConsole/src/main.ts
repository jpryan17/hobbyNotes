// client/src/main.ts (With Transaction Logic)

export {};
import { ApiResponse } from '../../../clib/api';
import * as api from '../../../clib/api';
import { TransactionHandler, TransactionMode } from '../../../clib/transactionHandler';

declare const Quill: any;

interface Submission {
    sql: string;
    result: string;
}

interface SqlTemplate {
    name: string;
    type: string;
    sql_template: string;
}
const history: Submission[] = [];

// --- UI ELEMENT REFERENCES ---
const quill1 = new Quill('#edit-area', { placeholder: 'Enter SQL...' });
const quill2 = new Quill('#result-area', { readOnly: true, placeholder: 'Results...' });
const submitButton = document.querySelector('#submit-button') as HTMLButtonElement;
const clearButton = document.querySelector('#clear-button') as HTMLButtonElement;
const historyButton = document.querySelector('#history-button') as HTMLButtonElement;
const historyDropdown = document.querySelector('#history-dropdown') as HTMLDivElement;
const templatesButton = document.querySelector('#templates-button') as HTMLButtonElement;
const templatesDropdown = document.querySelector('#templates-dropdown') as HTMLDivElement;
// --- NEW: TRANSACTION UI REFERENCES ---
const beginButton = document.querySelector('#begin-button') as HTMLButtonElement;
const commitButton = document.querySelector('#commit-button') as HTMLButtonElement;
const rollbackButton = document.querySelector('#rollback-button') as HTMLButtonElement;
const transactionStatus = document.querySelector('#transaction-status') as HTMLSpanElement;
// --- CHOOSE YOUR MODE ---
const CURRENT_MODE: TransactionMode = 'stateful'; // Or 'stateless'

// --- APPLICATION STATE ---
let txHandler: TransactionHandler | null = null;

// --- INITIALIZATION ---
historyButton.disabled = true;
updateTransactionUI(); // Set initial state for transaction buttons

// --- NEW: TRANSACTION HELPER FUNCTIONS ---

function updateTransactionUI() {
    const isInTransaction = txHandler?.isActive ?? false;
    // This function's logic is now even simpler.
    beginButton.disabled = isInTransaction;
    commitButton.disabled = !isInTransaction;
    rollbackButton.disabled = !isInTransaction;

    if (isInTransaction) {
        submitButton.textContent = 'Execute in Transaction';
        transactionStatus.textContent = 'TRANSACTION IN PROGRESS';
    } else {
        submitButton.textContent = 'Submit';
        transactionStatus.textContent = '';
    }
}
function displayResponse(response: ApiResponse<any>) {
    let displayString = '';
    if (response.status === 'success') {
        displayString = response.message;
        if (response.data?.rows && response.data.rows.length > 0) {
            const jsonData = JSON.stringify(response.data.rows, null, 2);
            displayString += '\n\n--- Data ---\n' + jsonData;
        }
    } else {
        displayString = `Error: ${response.message}\n\n--- Details ---\n${response.error || ''}`;
    }
    quill2.setText(displayString);
}
// --- HELPER FUNCTIONS ---
function truncate(text: string, length: number): string {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText.length <= length) return cleanedText;
    return cleanedText.substring(0, length) + '...';
}
function renderHistoryDropdown() {
    // ... (This function remains unchanged)
    historyDropdown.innerHTML = '';
    if (history.length === 0) {
        historyDropdown.innerHTML = `<div class="no-history">No history yet.</div>`;
        return;
    }
    const list = document.createElement('ul');
    history.forEach((submission, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = truncate(submission.sql, 40);
        listItem.title = submission.sql;
        listItem.dataset.historyIndex = index.toString();

        listItem.addEventListener('click', () => {
            const clickedIndex = parseInt(listItem.dataset.historyIndex!, 10);
            const selectedSubmission = history[clickedIndex];
            quill1.setText(selectedSubmission.sql);
            quill2.setText('');
            historyDropdown.classList.remove('visible');
        });

        listItem.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const indexToRemove = parseInt((event.currentTarget as HTMLLIElement).dataset.historyIndex!, 10);
            history.splice(indexToRemove, 1);
            renderHistoryDropdown();
            if (history.length === 0) {
                historyButton.disabled = true;
                historyDropdown.classList.remove('visible');
            }
        });
        list.appendChild(listItem);
    });
    historyDropdown.appendChild(list);
}

function renderTemplatesDropdown(templates: SqlTemplate[]) {
    // ... (This function remains unchanged)
    templatesDropdown.innerHTML = ''; // Clear previous content

    if (templates.length === 0) {
        templatesDropdown.innerHTML = `<div class="message">No templates found.</div>`;
        return;
    }

    const list = document.createElement('ul');
    templates.forEach((template) => {
        const listItem = document.createElement('li');
        // Format as requested: <type/name>
        listItem.textContent = `[${template.type}] ${template.name}`;
        listItem.title = template.sql_template; // Show full SQL on hover

        // Attach a click listener that knows about this specific template
        listItem.addEventListener('click', () => {
            quill1.setText(template.sql_template); // Load the template
            quill2.setText(''); // Clear the result area
            templatesDropdown.classList.remove('visible'); // Hide dropdown
        });

        list.appendChild(listItem);
    });
    templatesDropdown.appendChild(list);
}

// --- EVENT LISTENERS ---
clearButton.addEventListener('click', () => {
    quill1.setText('');
    quill2.setText('');
});

// MODIFIED: submitButton now handles two modes (transactional and non-transactional)
// The submit button now has beautifully simple logic.
submitButton.addEventListener('click', async () => {
    const sql = quill1.getText().trim();
    if (!sql) {
        return;
    }

    submitButton.disabled = true;
    quill2.setText('Executing...');

    let response: ApiResponse<any>;
    if (txHandler?.isActive) {
        // If a transaction is active, use the handler.
        response = await txHandler.execute(sql);
        // In stateless mode, this gives immediate feedback that the statement was queued.
        // In stateful mode, this gives the actual result from the server.
    } else {
        // Otherwise, execute as a standalone statement.
        response = await api.executeSql(sql);
    }

    displayResponse(response);
    history.unshift({ sql, result: quill2.getText() });
    submitButton.disabled = false;
    if (history.length > 0) {
        historyButton.disabled = false;
    }
});

beginButton.addEventListener('click', async () => {
    // Create a new handler instance for this transaction.
    txHandler = new TransactionHandler(CURRENT_MODE);
    const response = await txHandler.begin();
    displayResponse(response);
    updateTransactionUI();
});

commitButton.addEventListener('click', async () => {
    if (!txHandler) return;
    const response = await txHandler.commit();
    displayResponse(response);
    txHandler = null; // Transaction is over, so we can clear the handler
    updateTransactionUI();
});

rollbackButton.addEventListener('click', async () => {
    if (!txHandler) return;
    const response = await txHandler.rollback();
    displayResponse(response);
    txHandler = null; // Transaction is over, so we can clear the handler
    updateTransactionUI();
});

historyButton.addEventListener('click', (event) => {
    // ... (This listener remains unchanged)
    event.stopPropagation();
    if (historyDropdown.classList.contains('visible')) {
        historyDropdown.classList.remove('visible');
    } else {
        renderHistoryDropdown();
        positionDropdown(historyButton, historyDropdown);
        historyDropdown.classList.add('visible');
    }
});
document.addEventListener('click', (event) => {
    // ... (This listener remains unchanged)
    const target = event.target as Node;

    // Hide history dropdown if click is outside
    if (!historyButton.contains(target) && !historyDropdown.contains(target)) {
        historyDropdown.classList.remove('visible');
    }

    // Hide templates dropdown if click is outside
    if (!templatesButton.contains(target) && !templatesDropdown.contains(target)) {
        templatesDropdown.classList.remove('visible');
    }
});
templatesButton.addEventListener('click', async (event) => {
    // ... (This listener remains unchanged)
    event.stopPropagation();

    // If it's already visible, just hide it
    if (templatesDropdown.classList.contains('visible')) {
        templatesDropdown.classList.remove('visible');
        return;
    }
    // Show a loading message and position the dropdown
    templatesDropdown.innerHTML = `<div class="message">Loading templates...</div>`;
    positionDropdown(templatesButton, templatesDropdown);
    templatesDropdown.classList.add('visible');

    // Fetch the data from the server
    const sql = 'SELECT name, type, sql_template FROM useful_sql ORDER BY type, name';
    const templates: SqlTemplate[] = await api.queryDatabase<SqlTemplate>(sql);
    renderTemplatesDropdown(templates);
});

function positionDropdown(button: HTMLElement, dropdown: HTMLElement) {
    // ... (This function remains unchanged)
    const buttonRect = button.getBoundingClientRect();
    const containerRect = (button.offsetParent as HTMLElement).getBoundingClientRect();

    const top = buttonRect.bottom - containerRect.top + 5; // 5px gap
    const left = buttonRect.left - containerRect.left;

    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
}

// ===============================================================
// RESIZER LOGIC (Unchanged)
// ===============================================================
(function initializeResizablePanels() {
    const layout = document.querySelector('.editor-ui-container') as HTMLElement;
    if (!layout) return;

    const topPanel = document.getElementById('edit-area') as HTMLElement;
    const resizer = document.getElementById('resizer') as HTMLElement;
    const bottomPanel = document.getElementById('result-area') as HTMLElement;

    let startY: number;
    let startTopHeight: number;

    const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        startY = e.clientY;
        startTopHeight = topPanel.offsetHeight;
        document.body.classList.add('is-resizing');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientY - startY;
        const minPanelHeight = 50;
        const totalHeight = layout.offsetHeight;
        const resizerHeight = resizer.offsetHeight;
        const totalPanelHeight = totalHeight - resizerHeight;
        let newTopHeight = startTopHeight + delta;
        if (newTopHeight < minPanelHeight) {
            newTopHeight = minPanelHeight;
        }
        if (newTopHeight > totalPanelHeight - minPanelHeight) {
            newTopHeight = totalPanelHeight - minPanelHeight;
        }
        const newBottomHeight = totalPanelHeight - newTopHeight;
        topPanel.style.flexBasis = `${newTopHeight}px`;
        bottomPanel.style.flexBasis = `${newBottomHeight}px`;
    };
    const onMouseUp = () => {
        document.body.classList.remove('is-resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
})();
