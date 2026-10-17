// client/src/main.ts (Rewound State)

export {};

declare const Quill: any;

interface ApiResponse {
    status: 'success' | 'error';
    message: string;
    data?: { rows?: any[]; rowCount: number };
    error?: string;
}

interface Submission {
    sql: string;
    result: string;
}
//
// SQL template data
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

// --- INITIALIZATION ---
historyButton.disabled = true;

// --- HELPER FUNCTIONS ---
function truncate(text: string, length: number): string {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText.length <= length) return cleanedText;
    return cleanedText.substring(0, length) + '...';
}
async function executeSqlOnServer(sql: string): Promise<ApiResponse> {
    const endpoint = '/api/sql';
    const requestPayload = sql;
    const fullPath = `${endpoint}?context=${encodeURIComponent(requestPayload)}`;
    try {
        const response = await fetch(fullPath);
        return await response.json();
    } catch (err) {
        console.error('Failed to fetch from server:', err);
        return {
            status: 'error',
            message: 'Could not connect to the server. Is it running?',
            error: (err as Error).message,
        };
    }
}
function renderHistoryDropdown() {
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
submitButton.addEventListener('click', async () => {
    const sql = quill1.getText().trim();
    if (!sql) {
        quill2.setText('Please enter an SQL statement.');
        return;
    }
    quill2.setText('Executing...');
    submitButton.disabled = true;
    historyButton.disabled = true;
    const response = await executeSqlOnServer(sql);
    let displayString = '';
    if (response.status === 'success') {
        displayString = response.message;
        if (response.data?.rows && response.data.rows.length > 0) {
            const jsonData = JSON.stringify(response.data.rows, null, 2);
            displayString += '\n\n--- Data ---\n' + jsonData;
        }
    } else {
        displayString = `Error: ${response.message}\n\n--- Details ---\n${response.error}`;
    }
    quill2.setText(displayString);
    submitButton.disabled = false;
    historyButton.disabled = false;
    history.unshift({ sql, result: displayString });
    if (history.length > 0) {
        historyButton.disabled = false;
    }
});
historyButton.addEventListener('click', (event) => {
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
    const response = await executeSqlOnServer(sql);

    if (response.status === 'success' && response.data?.rows) {
        // We need to cast the generic rows to our specific type
        const templates = response.data.rows as SqlTemplate[];
        renderTemplatesDropdown(templates);
    } else {
        templatesDropdown.innerHTML = `<div class="message">Error fetching templates.</div>`;
    }
});
//
// A more generic positioner for any dropdown
function positionDropdown(button: HTMLElement, dropdown: HTMLElement) {
    const buttonRect = button.getBoundingClientRect();
    const containerRect = (button.offsetParent as HTMLElement).getBoundingClientRect();

    const top = buttonRect.bottom - containerRect.top + 5; // 5px gap
    const left = buttonRect.left - containerRect.left;

    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
}
// ===============================================================
// RESIZER LOGIC (Corrected with box-sizing in mind)
// ===============================================================

// Self-invoking function to avoid polluting the global scope
(function initializeResizablePanels() {
    const layout = document.querySelector('.editor-ui-container') as HTMLElement;
    if (!layout) return; // Exit if the layout isn't found

    const topPanel = document.getElementById('edit-area') as HTMLElement;
    const resizer = document.getElementById('resizer') as HTMLElement;
    const bottomPanel = document.getElementById('result-area') as HTMLElement;

    // --- State for dragging ---
    let startY: number;
    let startTopHeight: number;

    const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();

        // Record the starting positions
        startY = e.clientY;
        startTopHeight = topPanel.offsetHeight;

        document.body.classList.add('is-resizing');
        // Attach listeners to the whole document to catch mouse moves anywhere
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientY - startY;
        const minPanelHeight = 50;
        const totalHeight = layout.offsetHeight;
        const resizerHeight = resizer.offsetHeight;

        // Calculate the potential new height for the top panel
        let newTopHeight = startTopHeight + delta;

        // Calculate the total available space for both panels
        const totalPanelHeight = totalHeight - resizerHeight;

        // Constrain the top panel's height
        if (newTopHeight < minPanelHeight) {
            newTopHeight = minPanelHeight;
        }
        if (newTopHeight > totalPanelHeight - minPanelHeight) {
            newTopHeight = totalPanelHeight - minPanelHeight;
        }

        // Explicitly calculate the bottom panel's height
        const newBottomHeight = totalPanelHeight - newTopHeight;

        // Apply the new sizes to BOTH panels using flex-basis
        topPanel.style.flexBasis = `${newTopHeight}px`;
        bottomPanel.style.flexBasis = `${newBottomHeight}px`;
    };
    const onMouseUp = () => {
        document.body.classList.remove('is-resizing');
        // Clean up the listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // Attach the starting listener
    resizer.addEventListener('mousedown', onMouseDown);
})();
