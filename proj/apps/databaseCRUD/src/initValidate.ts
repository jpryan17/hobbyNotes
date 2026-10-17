//
// crud/src/init2validate.ts   --- validate downloaded crud config info ---
//
import { TAB, COL, TCN, CCN, NAV, EV, SchemaInfo, DownloadInfo, DTC, FkInfo } from './initDownload';

let download: DownloadInfo;
const validationErrors: string[] = [];

export function validateConfigInfo(downloads: DownloadInfo): string | undefined {
    download = downloads;
    validateTables();
    validateColumns();
    validateFkInfo();
    validateTableConditions();
    validateColumnConditions();
    validateNavPaths();
    return errorReport(validationErrors);
}

function errorReport(errors: string[]): string | undefined {
    if (errors.length == 0) return undefined;
    let result: string;
    const maxErrorsToReport = 20;
    const errorCnt = Math.min(errors.length, maxErrorsToReport);
    result = `<h2> Config Error cnt: ${errors.length} </h2><br>`;
    for (let i = 0; i < errorCnt; i++) {
        result += `<br>${errors[i]}`;
    }
    result += '<h3> Consider fixing before continuing.</h3>';
    return result;
}

//
function fmtErrorTAB1(t: TAB): string {
    return `uc_table row (${t.id}) has DB table name ${t.db_table_name} not in schema.`;
}
function fmtErrorTAB2(t: TAB): string {
    return `An undependent table(${t.id}) ${t.name} has non null parent or min/max.`;
}
function fmtErrorTAB3(t: TAB): string {
    return `dependent table(${t.id}) ${t.name} has null parent.`;
}
function fmtErrorTAB4(t: TAB): string {
    return `dependent table(${t.id}) ${t.name} has null min/max arities.`;
}
function fmtErrorTAB5(t: TAB): string {
    return `dependent table(${t.id}) ${t.name} has no display columns.`;
}
function validateTables() {
    const si = download[7] as SchemaInfo[];
    const dtc = download[2] as DTC[];
    const tab = download[0] as TAB[];
    tab.forEach((t) => {
        if (!si.some((e) => e.table_name === t.db_table_name)) {
            validationErrors.push(fmtErrorTAB1(t));
        }
        const [tableType, parent, minArity, maxArity] = [
            t.table_type,
            t.parent_table,
            t.min_dependent_arity,
            t.max_dependent_arity,
        ];
        if (tableType === 'independent') {
            if (!(parent === null) || !(minArity === null) || !(maxArity === null)) {
                validationErrors.push(fmtErrorTAB2(t));
            }
        } else {
            // table is dependent ..
            if (!(typeof parent === 'number')) {
                validationErrors.push(fmtErrorTAB3(t));
            }
            if (!(typeof minArity === 'number') || !(typeof maxArity === 'number')) {
                validationErrors.push(fmtErrorTAB4(t));
            }
            if (!dtc.some((c) => c.for_table === parent)) {
                validationErrors.push(fmtErrorTAB5(t));
            }
        }
    });
}

//
function fmtErrorCOL1(c: COL): string {
    return `UC Column (id:${c.id}) references table not in uc_table.`;
}
function fmtErrorCOL2(c: COL): string {
    return `UC Column (id:${c.id}) has DB column name ${c.db_column_name} not in schema.`;
}
function validateColumns() {
    const tab = download[0] as TAB[];
    const col = download[1] as COL[];
    col.forEach((c) => {
        const table = tab.find((t) => t.id == c.for_table);
        if (table === undefined) {
            validationErrors.push(fmtErrorCOL1(c));
        } else if (!columnSchemaInfoValid(table.db_table_name, c.db_column_name)) {
            validationErrors.push(fmtErrorCOL2(c));
        }
    });
}

//
function validateFkInfo() {
    const fkInfo = download[8] as FkInfo[];
    let fkErrors = 0;
    fkInfo.forEach((k) => {
        if (k.table_name === null || k.table_name === null || k.foreign_table_name === null) ++fkErrors;
    });
    if (fkErrors > 0) {
        validationErrors.push(`there are ${fkErrors} FK Errors.`);
    }
}

//
function fmtErrorTC1(c: TCN): string {
    return `table condition (${c.id}) table not in uc_table.`;
}
function fmtErrorTC1a(c: TCN): string {
    return `table condition (${c.id}) is not for dependent table.`;
}
function fmtErrorTC1b(c: TCN): string {
    return `table condition (${c.id}) is on table with invalid parent table.`;
}
function fmtErrorTC2(c: TCN): string {
    return `table condition (${c.id}) has enabling col not in uc_column`;
}
function fmtErrorTC3(c: TCN): string {
    return `table condition (${c.id}) references more than one enabling column.`;
}
function fmtErrorTC4(c: TCN): string {
    return `table condition (${c.id}) has enabling col not in parent table.`;
}
function fmtErrorTC4a(c: TCN): string {
    return `table condition (${c.id}) has enabling col with invalid schema info.`;
}
function fmtErrorTC5(c: TCN): string {
    return `table condition (${c.id}) has enabling col whose data type is not user defined.`;
}
function fmtErrorTC6(c: TCN): string {
    return `table condition (${c.id}) has enabling val not in enumerated value set.`;
}
function validateTableConditions() {
    const tab = download[0] as TAB[];
    const col = download[1] as COL[];
    const tcn = download[3] as TCN[];
    const evs = download[6] as EV[];
    tcn.forEach((ci) => {
        const tb = tab.find((t) => t.id == ci.for_table);
        const ec = col.find((c) => c.for_table == ci.for_table && c.id == ci.enabling_column);
        if (tb === undefined) {
            fmtErrorTC1(ci);
        } else if (tb.table_type !== 'dependent') {
            fmtErrorTC1a(ci);
        } else if (typeof tb.parent_table !== 'string') {
            fmtErrorTC1b(ci);
        } else if (ec === undefined) {
            fmtErrorTC2(ci);
        } else if (
            tcn.filter((i) => i.for_table == ci.for_table && i.enabling_column == ci.enabling_column).length != 1
        ) {
            fmtErrorTC3(ci);
        } else if (ec.for_table != ci.for_table) {
            fmtErrorTC4(ci);
        } else if (!columnSchemaInfoValid(tb.db_table_name, ec.db_column_name)) {
            fmtErrorTC4a(ci);
        } else {
            const csi = columnSchemaInfo(tb.db_table_name, ec.db_column_name);
            if (csi[0] !== 'USER-DEFINED') {
                fmtErrorTC5(ci);
            }
            if (evs.find((e) => e.enum_name == csi[1] && e.enum_val == ci.enabling_value) === undefined) {
                fmtErrorTC6(ci);
            }
        }
    });
}

//
function fmtErrorCC1(c: CCN): string {
    return `col condition (${c.id}) has column not in uc_column`;
}
function fmtErrorCC2(c: CCN): string {
    return `column condition (${c.id}) references more than one enabling column.`;
}
function fmtErrorCC3(c: CCN): string {
    return `column condition (${c.id}) has enabling col not in uc_column`;
}
function fmtErrorCC4(c: CCN): string {
    return `column condition (${c.id}) has enabling col not in same table.`;
}
function fmtErrorCC5(c: CCN): string {
    return `column condition (${c.id}) has enabling col whose data type is not user defined.`;
}
function fmtErrorCC6(c: CCN): string {
    return `column condition (${c.id}) has enabling val not in enumerated value set.`;
}
function validateColumnConditions() {
    const tab = download[0] as TAB[];
    const col = download[1] as COL[];
    const ccn = download[4] as CCN[];
    const evs = download[6] as EV[];
    ccn.forEach((ci) => {
        const forColumn = col.find((c) => (c.id = ci.for_column)) as COL;
        const tb = tab.find((t) => (t.id = forColumn.for_table)) as TAB;
        if (forColumn === undefined) {
            fmtErrorCC1(ci);
        } else if (
            ccn.filter((i) => i.for_column == ci.for_column && i.enabling_column == ci.enabling_column).length != 1
        ) {
            fmtErrorCC2(ci);
        } else {
            const ec = col.find((c) => (ci.enabling_column = c.id));
            if (ec === undefined) {
                fmtErrorCC3(ci);
            } else if (ec.for_table != forColumn.for_table) {
                fmtErrorCC4(ci);
            } else {
                const csi = columnSchemaInfo(tb.db_table_name, ec.db_column_name);
                if (csi[0] !== 'USER-DEFINED') {
                    fmtErrorCC5(ci);
                }
                if (evs.find((e) => e.enum_name == csi[1] && e.enum_val == ci.enabling_value) === undefined) {
                    fmtErrorCC6(ci);
                }
            }
        }
    });
}

//
function fmtErrorNP1(p: NAV): string {
    return `navigation instance ${p.id} has non-string name.`;
}
function fmtErrorNP2(p: NAV): string {
    return `navigation instance ${p.id} has non-number sibling position.`;
}
function fmtErrorNP3(p: NAV): string {
    return `not top level navigation instance ${p.id} has invalid parent button.`;
}
function fmtErrorNP4(p: NAV): string {
    return `not top level navigation instance ${p.id} has invalid uc_table id.`;
}
function validateNavPaths() {
    const nav = download[5] as NAV[];
    const tab = download[0] as TAB[];
    nav.forEach((npi) => {
        if (typeof npi.name !== 'string') {
            validationErrors.push(fmtErrorNP1(npi));
        }
        if (typeof npi.sibling_position !== 'number') {
            validationErrors.push(fmtErrorNP2(npi));
        }
        if (npi.nav_button_type === 'not-top-level') {
            if (!nav.some((e) => e.id == npi.parent_button)) {
                validationErrors.push(fmtErrorNP3(npi));
            }
            if (!tab.some((e) => e.id == npi.uc_table)) {
                validationErrors.push(fmtErrorNP4(npi));
            }
        }
    });
}

//
function columnSchemaInfoValid(tableName: string, columnName: string): boolean {
    const si = download[7] as SchemaInfo[];
    const rr = si.find(
        (s) =>
            s.table_name === tableName &&
            s.column_name === columnName &&
            typeof s.data_type === 'string' &&
            typeof s.udt_name === 'string' &&
            typeof s.data_type === 'string'
    );
    return rr !== undefined;
}
function columnSchemaInfo(tableName: string, columnName: string): string[] {
    const si = download[7] as SchemaInfo[];
    const rr = si.find(
        (s) =>
            s.table_name === tableName &&
            s.column_name === columnName &&
            typeof s.data_type === 'string' &&
            typeof s.udt_name === 'string' &&
            typeof s.data_type === 'string'
    );
    if (rr === undefined) return [];
    return [rr.table_name, rr.udt_name, rr.is_nullable] as string[];
}
