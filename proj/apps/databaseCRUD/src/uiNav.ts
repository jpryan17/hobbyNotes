//
// crud/src/uiNav.ts    --- UI Navigation ---
//
import { TableMap, TableNavigationPath } from './types';
import { renderTableListUI } from './uiList';
import { UIstatus } from './types';

export const uiStatus: UIstatus = {
    tableMap: {},
    navPaths: [],
    displayState: 'top',
    formStack: []
};

// --- DOM Element References ---
const navPanel = document.getElementById('navigation-panel') as HTMLDivElement;
const displayPanel = document.getElementById('display-panel') as HTMLDivElement;

export function initializeUI(map: TableMap, paths: TableNavigationPath[], msg: string) {
    uiStatus.tableMap = map;
    uiStatus.navPaths = paths;
    initialize(msg);
}
function initialize(msg = '') {
    const navPaths = uiStatus.navPaths;
    uiStatus.displayState = 'top';
    uiStatus.navPath = undefined;
    uiStatus.table = undefined;
    uiStatus.formStack = [];
    navPanel.innerHTML = '';
    navPaths.forEach((navPath) => {
        const button = document.createElement('button');
        const buttonText = navPath.label!;
        button.dataset.navId = navPath.label!;

        button.textContent = buttonText;
        button.classList.add('nav-group-btn');
        navPanel.appendChild(button);
    });
    navPanel.addEventListener('click', handleNavClick);
    displayPanel.innerHTML = msg;
}
async function handleNavClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const navPaths = uiStatus.navPaths;
    if (target.matches('.nav-group-btn')) {
        const navId = target.dataset.navId;
        const navPath = navPaths.find((path) => path.label === navId) as TableNavigationPath;
        uiStatus.displayState = 'navPathSelected';
        uiStatus.navPath = navPath;
        renderSubNavigation(navPath.children);
        displayPanel.innerHTML = ``;
    } else if (target.matches('.sub-nav-btn')) {
        const table = target.dataset.tableName as string;
        uiStatus.displayState = 'tableSelected';
        uiStatus.table = table;
        await renderTableListUI(table);
    }
}
export function insertBackButton() {
    navPanel.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.textContent = '‹ Back';
    backButton.classList.add('list-ctrl-btn');
    backButton.addEventListener('click', (_) => backButtonHandler());
    navPanel.appendChild(backButton);
}
function backButtonHandler() {
    if (uiStatus.displayState === 'navPathSelected') {
        initialize();
    } else if (uiStatus.displayState === 'tableSelected') {
        uiStatus.displayState = 'navPathSelected';
        uiStatus.table = undefined;
        displayPanel.innerHTML = '';
        uiStatus.displayState = 'navPathSelected';
        const navPath = uiStatus.navPath as TableNavigationPath;
        renderSubNavigation(navPath.children);
    } else if (uiStatus.displayState === 'instanceSelected') {
        if (uiStatus.backTo.length < 3) {
            // horrible error message
            return;
        }
        const last = uiStatus.backTo.length - 1;
        uiStatus.backTo.pop();
        if (last > 2) {
            const recId = uiStatus.backTo[last];
            console.log(`rec ${recId}`);
            //reRendernForm(rec);
        } else {
            uiStatus.displayState = 'tableSelected';
            const table = uiStatus.backTo[last] as string;
            //reRendertableUI(table)
            console.log(`table ${table}`);
        }
    }
}
function renderSubNavigation(navPaths: TableNavigationPath[]) {
    insertBackButton();
    navPanel.appendChild(document.createElement('hr'));
    renderNavLevel(navPaths, navPanel, 0);
}
function renderNavLevel(paths: TableNavigationPath[], container: HTMLElement, level: number) {
    const tableMap = uiStatus.tableMap;
    paths.forEach((path) => {
        const button = document.createElement('button');
        button.style.marginLeft = `${level * 20}px`;

        if (path.table) {
            // This is a TABLE NODE
            const table = tableMap[path.table];
            button.textContent = table.plural || table.name + 's';
            button.dataset.tableName = path.table;
            button.classList.add('sub-nav-btn');
        } else {
            // Horrible error message
            return;
        }
        container.appendChild(button);
        if (path.children && path.children.length > 0) {
            renderNavLevel(path.children, container, level + 1);
        }
    });
}
