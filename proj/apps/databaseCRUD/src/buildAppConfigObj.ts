//
//  crud/src/buildAppConfigObj.ts   --- build the crud App config object ---
//
import { TAB, COL, DTC, TCN, CCN, NAV, EV, SchemaInfo, FkInfo, DownloadInfo } from './initDownload';
import { ColumnMap, ColumnMapRec, TableMap, TableMapRec, Condition, TableNavigationPath } from './types';

let download: DownloadInfo;

export function bldConfigObj(downloads: DownloadInfo): [TableMap, TableNavigationPath[]] {
    download = downloads;
    return [bldTableMap(), bldNavPaths()];
}
function bldTableMap(): TableMap {
    const tab = download[0] as TAB[];
    const tableMap: TableMap = {};
    tab.forEach((t) => {
        let dependents: string[] | undefined = undefined;
        let displayCols: string[] | undefined = undefined;
        let minDependentArity: number | undefined = undefined;
        let maxDependentArity: number | undefined = undefined;
        let condition: Condition | undefined = undefined;
        const plural = t.plural === null ? undefined : t.plural;

        const dt = tab.filter((e) => e.parent_table == t.id);
        dependents = dt.length == 0 ? undefined : dt.map((e) => e.db_table_name);

        if (t.table_type === 'dependent') {
            displayCols = setDisplayCols(t);
            minDependentArity = t.min_dependent_arity as number;
            maxDependentArity = t.max_dependent_arity as number;
            condition = setTableCondition(t);
        }
        const tableMapRec: TableMapRec = {
            dbTable: t.db_table_name,
            name: t.name,
            plural: plural,
            tableType: t.table_type,
            columns: bldColumnsMap(t),
            selfRef: setAnySelfRef(t),
            namedParentRefs: setAnyNamedParents(t),
            dependents: dependents,
            displayColumns: displayCols,
            minDependentArity: minDependentArity,
            maxDependentArity: maxDependentArity,
            condition: condition,
        };
        tableMap[t.db_table_name] = tableMapRec;
    });
    return tableMap;
}

function bldColumnsMap(t: TAB): ColumnMap {
    const col = download[1] as COL[];
    const si = download[7] as SchemaInfo[];
    const ki = download[8] as FkInfo[];

    const id = t.id;
    const columnMap: ColumnMap = {};
    col.forEach((c) => {
        if (c.for_table == id) {
            const csi = si.find(
                (s) => s.table_name === t.db_table_name && s.column_name === c.db_column_name
            ) as SchemaInfo;
            const [dt, udt, nf] = [csi.data_type, csi.udt_name, csi.is_nullable];
            const fki = ki.find((k) => k.table_name === t.db_table_name && k.column_name === c.db_column_name);
            const fkf = fki !== undefined;
            const fk = fkf ? fki.foreign_table_name : undefined;
            const enumFlag = dt === 'USER-DEFINED';
            const enumValues = enumFlag ? setEnumValues(udt) : undefined;
            const condition = setColumnCondition(c);

            const columnMapRec: ColumnMapRec = {
                column: c.db_column_name,
                label: c.label === null ? undefined : c.label,
                len: c.display_length,
                rows: c.display_rows === null ? undefined : c.display_rows,
                canModify: c.ui_can_modify,
                isNullable: nf,
                dbDataType: dt,
                isForeignKey: fkf,
                foreignKeyTable: fk,
                isEnum: enumFlag,
                enumValues: enumValues,
                condition: condition,
            };
            columnMap[c.db_column_name] = columnMapRec;
        }
    });
    return columnMap;
}

function setAnyNamedParents(t: TAB): string[] | undefined {
    let np: string[] = [];
    const fkInfo = download[8] as FkInfo[];
    const tableName = t.db_table_name;
    const tfk = fkInfo.filter((k) => k.table_name === tableName);
    if (tfk !== undefined) {
        tfk.forEach((k) => {
            const schemaInfo = download[7] as SchemaInfo[];
            const si = schemaInfo.find(
                (s) => s.table_name === tableName && s.column_name === k.column_name
            ) as SchemaInfo;
            if (si.is_nullable === 'NO' && k.foreign_table_name !== tableName) {
                np.push(k.column_name);
            }
        });
    }
    return np.length > 0 ? np : undefined;
}

function setAnySelfRef(t: TAB) {
    const fkInfo = download[8] as FkInfo[];
    const sr = fkInfo.find((k) => t.db_table_name === k.table_name && k.foreign_table_name === k.table_name);
    return sr === undefined ? undefined : sr.column_name;
}

function setDisplayCols(t: TAB): string[] | undefined {
    let dcCols: string[] = [];
    const dtc = download[2] as DTC[];
    const col = download[1] as COL[];
    const dcColIds = dtc.filter((c) => c.for_table == t.id).map((c) => c.display_column) as number[];
    if (dcColIds.length > 0) {
        dcColIds.forEach((colId) => {
            const ci: COL = col.find((c) => (c.id = colId)) as COL;
            dcCols.push(ci.db_column_name);
        });
    }
    return dcCols.length == 0 ? undefined : dcCols;
}

function setTableCondition(t: TAB): Condition | undefined {
    let cond: Condition | undefined = undefined;
    const tcn = download[3] as TCN[];
    const col = download[1] as COL[];
    const pc = tcn.find((c) => c.for_table == t.id);
    if (pc) {
        const colId = pc.enabling_column;
        const ci = col.find((c) => (c.id = colId)) as COL;
        const enumCol = ci.db_column_name;
        const enumVals = setEnumValues(enumCol);
        cond = { enablingColumn: enumCol, enablingValues: enumVals };
    }
    return cond;
}

function setColumnCondition(c: COL): Condition | undefined {
    let cond: Condition | undefined = undefined;
    const ccn = download[4] as CCN[];
    const col = download[1] as COL[];
    const pc = ccn.find((ci) => ci.for_column == c.id);
    if (pc) {
        const colId = pc.enabling_column;
        const ci = col.find((c) => (c.id = colId)) as COL;
        const enumCol = ci.db_column_name;
        const enumVals = setEnumValues(enumCol);
        cond = { enablingColumn: enumCol, enablingValues: enumVals };
    }
    return cond;
}

function setEnumValues(enumName: string): string[] {
    const ev = download[6] as EV[];
    const enunVals: string[] = [];
    ev.map((v: EV) => {
        if (v.enum_name === enumName) {
            enunVals.push(v.enum_val);
        }
    });
    return enunVals;
}
function setNavButtonChildren(b: NAV): TableNavigationPath[] {
    const children: TableNavigationPath[] = [];
    const nav = download[5] as NAV[];
    const tab = download[0] as TAB[];
    nav.map((c) => {
        if (c.parent_button == b.id) {
            const ti: TAB = tab.find((t) => t.id == c.uc_table) as TAB;
            children.push({ label: c.name, table: ti.db_table_name, children: setNavButtonChildren(c) });
        }
    });
    return children;
}
function bldNavPaths(): TableNavigationPath[] {
    const nav = download[5] as NAV[];
    const navPaths: TableNavigationPath[] = [];
    nav.map((b: NAV) => {
        if (b.nav_button_type === 'top-level') {
            navPaths.push({ label: b.name, children: setNavButtonChildren(b) });
        }
    });
    return navPaths;
}
