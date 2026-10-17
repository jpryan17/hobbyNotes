//
// crud/src/uiList.ts    --- Named List Handler ---
///
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
async function currentTableInstanceCount() {
    const sql = `SELECT name FROM ${table}`;
    const rv = await executeSql<any>(sql);
    return rv.data!.rowCount;
}
function insertAddButton() {
    const tableInfo = tableMap[table];
    const addButton = document.createElement('button');
    addButton.textContent = `add ${tableInfo.name} instance`;
    addButton.addEventListener('click', (_) => {
        uiStatus.displayState = 'instanceSelected';
        uiStatus.backTo.push('tableName');
        //renderForm(table, 'update');
    });
    addButton.classList.add('list-ctrl-btn');
    navPanel.appendChild(addButton);
}
function addListButtons() {
    const tableInfo = tableMap[table];
    if (tableInfo.selfRef === undefined) {
        // flat list only
        const listButton = document.createElement('button');
        listButton.classList.add('list-ctrl-btn');
        listButton.textContent = `List`;
        listButton.addEventListener('click', async (_) => {
            await renderFlatInstanceList();
        });
        navPanel.appendChild(listButton);
    } else {
        // table has a self ref. nested list is an option
        const flatListButton = document.createElement('button');
        flatListButton.classList.add('list-ctrl-btn');
        flatListButton.textContent = `Flat List`;
        flatListButton.addEventListener('click', async (_) => {
            await renderFlatInstanceList();
        });
        navPanel.appendChild(flatListButton);
        const nestedListButton = document.createElement('button');
        nestedListButton.classList.add('list-ctrl-btn');
        nestedListButton.textContent = `Nested List`;
        nestedListButton.addEventListener('click', async (_) => {
            await renderNestedInstanceList();
        });
        navPanel.appendChild(nestedListButton);
    }
    const parentsInfo = tableInfo.namedParentRefs;
    if (parentsInfo !== undefined) {
        // table has named parents ..
        const hr = document.createElement('hr');
        navPanel.appendChild(hr);
        const gb = document.createElement('div');
        gb.innerHTML = ' group by ';
        navPanel.appendChild(gb);
        parentsInfo.forEach((refCol: string) => {
            const fkTable = tableMap[table].columns[refCol].foreignKeyTable as string;
            const listGrpButton = document.createElement('button');
            listGrpButton.textContent = `${tableMap[fkTable].name}`;
            listGrpButton.dataset.ref = refCol;
            if (tableMap[fkTable].selfRef !== undefined) {
                // this parent is hierarchical
                listGrpButton.addEventListener('click', async (ev: MouseEvent) => {
                    const target = ev.target as HTMLButtonElement;
                    await renderNestedGrpInstanceList(target.dataset.ref!);
                });
            } else {
                //this parent is not hierarchical ..
                listGrpButton.addEventListener('click', async (ev: MouseEvent) => {
                    const target = ev.target as HTMLButtonElement;
                    const refCol = target.dataset.ref as string;
                    await renderFlatGrpInstanceList(refCol);
                });
            }
            listGrpButton.classList.add('list-ctrl-btn');
            navPanel.appendChild(listGrpButton);
        });
    }
}
function addInstanceButton(name: string, indent: number = 0) {
    const listItem = document.createElement('li');
    listItem.textContent = name;
    listItem.dataset.name = name;
    listItem.style.cursor = 'pointer';
    if (indent > 0) listItem.style.marginLeft = `${20 * indent}px`;
    list.appendChild(listItem);
}
function addInstanceHeader(name: string, indent: number = 0) {
    const headerItem = document.createElement('li');
    headerItem.textContent = name;
    headerItem.style.fontWeight = 'bold';
    if (indent > 0) headerItem.style.marginLeft = `${20 * indent}px`;
    list.appendChild(headerItem);
}
//
async function renderFlatInstanceList() {
    list.innerHTML = '';
    console.log(`rendering flat list for ${table}`);
    const query = `SELECT id, name from ${table} order by name`;
    const flatInstances = await queryDatabase<FlatInstance>(query);
    flatInstances.forEach((i) => addInstanceButton(i.name, 0));
    list.addEventListener('click', listsClickHandler);
    displayPanel.appendChild(list);
}
async function renderNestedInstanceList() {
    list.innerHTML = '';
    htMap.clear();
    console.log(`rendering nested list for ${table} refCol ${tableMap[table].selfRef} `);
    const refCol = tableMap[table].selfRef;
    const query = `SELECT id, name, ${refCol} as ref from ${table} order by name`;
    const nestedInstances = await queryDatabase<NestedInstance>(query);
    nestedInstances.forEach((i) => htMap.set(i.id, i));
    setPosArray();
    posArray.forEach((p: InstancePos) => {
        addInstanceButton(htMap.get(p.id)!.name, p.nestLevel);
    });
    list.addEventListener('click', listsClickHandler);
    displayPanel.appendChild(list);
}
async function renderFlatGrpInstanceList(refColumn: string) {
    console.log(`rendering flat grouped list list for ${table}`);
    list.innerHTML = '';
    const fkTable = tableMap[table].columns[refColumn].foreignKeyTable;
    console.log(`rendering flat grouped list list for ${table} ref-col: ${refColumn} fk-table: ${fkTable}`);
    const parentQuery = `select id, name from ${fkTable} order by name`;
    const parentInstances = await queryDatabase<FlatInstance>(parentQuery);
    const instanceQuery = `select id, name, ${refColumn} as ref from ${table} order by name`;
    const instances = await queryDatabase<NestedInstance>(instanceQuery);
    setRefMap(instances);
    parentInstances.forEach((p: FlatInstance) => {
        if (refMap.has(p.id)) {
            const pc = refMap.get(p.id) as number[];
            addInstanceHeader(p.name);
            pc.forEach((id) => {
                const ii = instances.find((i) => i.id == id) as NestedInstance;
                addInstanceButton(ii.name, 1);
            });
        }
    });
    displayPanel.appendChild(list);
}
async function renderNestedGrpInstanceList(refColumn: string) {
    list.innerHTML = '';
    htMap.clear();
    const fkTable = tableMap[table].columns[refColumn].foreignKeyTable as string;
    const selfRefCol = tableMap[fkTable].selfRef as string;
    console.log(`rendering nested grouped list list for ${table} refCol: ${refColumn} 
                    selfRefCol: ${selfRefCol} fkTable: ${fkTable}`);
    const parentQuery = `select id, name, ${selfRefCol} from ${fkTable} order by name`;
    const nestedInstances = await queryDatabase<NestedInstance>(parentQuery);
    nestedInstances.forEach((i) => htMap.set(i.id, i));
    setPosArray();
    const instanceQuery = `select id, name, ${refColumn} as ref from ${table} order by name`;
    const instances = await queryDatabase<NestedInstance>(instanceQuery);
    setRefMap(instances);
    console.log(`refMap-size: ${refMap.size}`);
    posArray.forEach((p: InstancePos) => {
        const parent = htMap.get(p.id) as NestedInstance;
        if (refMap.has(p.id)) {
            const pc = refMap.get(p.id) as number[];
            addInstanceHeader(parent.name, p.nestLevel);
            pc.forEach((id) => {
                const ii = instances.find((i) => i.id == id) as NestedInstance;
                addInstanceButton(ii.name, p.nestLevel + 1);
            });
        }
    });
    list.addEventListener('click', listsClickHandler);
    displayPanel.appendChild(list);
}
//
function setRefMap(instances: NestedInstance[]) {
    refMap.clear();
    console.log(`in setRefMap. instance cnt ${instances.length}`);
    instances.forEach((i) => {
        const id = i.id;
        const ref = i.ref as number;
        if (typeof ref !== 'number') console.log(`ref is not number***`);
        if (refMap.has(ref)) {
            const curList = refMap.get(ref) as number[];
            curList.push(id);
            refMap.set(ref, curList);
        } else {
            refMap.set(ref, [id]);
        }
    });
}
function setPosArray() {
    posArray = [];
    htMap.forEach((i) => {
        if (typeof i.ref !== 'number') {
            //console.log(`****top level push id ${i.id} name ${i.name}`);
            posArray.push({ id: i.id, nestLevel: 0 });
            checkForChildRefs(i.id, 0);
        }
    });
}
function checkForChildRefs(parentId: number, parentNestLevel: number) {
    const nl = parentNestLevel + 1;
    htMap.forEach((i) => {
        if (i.ref == parentId) {
            //console.log(`****child level push id ${i.id}  name ${i.name} nl ${nl}`);
            posArray.push({ id: i.id, nestLevel: nl });
            checkForChildRefs(i.id, nl);
        }
    });
}
async function listsClickHandler(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const listItem = target.closest('.record-list > li, .record-table > tbody > tr');
    if (listItem instanceof HTMLElement) {
        const name = listItem.dataset.name as string;
        if (typeof name === 'string') {
            console.log(`${name} selected.`);
            //const vals: DBVal[] = await getRec(table, name);
            //uiStatus.displayState = 'instanceSelected';
            //uiStatus.backTo.push(rec);
            //renderForm(table, 'read', rec);
        }
        return;
    }
}
