//
// apps/databaseCRUD/src/uiDtList.ts   ---  dependent table list logic ---
//
import { queryDatabase, executeSql } from '../../../clib/api';
import { TableMap } from './types';
//import { renderForm } from './uiForm';
import { uiStatus, insertBackButton } from './uiNav';

type FlatInstance = { id: number; name: string };
type NestedInstance = { id: number; name: string; ref: number | null };
type InstancePos = { id: number; nestLevel: number };

// --- DOM Element References ---
const navPanel = document.getElementById('navigation-panel') as HTMLDivElement;
const displayPanel = document.getElementById('display-panel') as HTMLDivElement;

let tableMap: TableMap;
let table: string;
let list: HTMLUListElement;
let htMap = new Map<number, NestedInstance>();
let refMap = new Map<number, number[]>();
let posArray: InstancePos[];

export async function renderTableListUI(tableName: string) {
    tableMap = uiStatus.tableMap;
    table = tableName;
    displayPanel.innerHTML = '';
    insertBackButton();
    insertAddButton();
    const currentInstanceCnt = await currentTableInstanceCount();
    if (currentInstanceCnt == 0) {
        displayPanel.innerHTML = `Currently, ${tableMap[tableName].name} has no instances.`;
    } else {
        addListButtons();
        list = document.createElement('ul');
        list.classList.add('record-list');
    }
}
