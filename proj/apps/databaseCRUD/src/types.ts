//
// crud/src/types.ts   --- LEM crud app types  --
//

export interface ConfigObj {
    tableMap?: TableMap;
    navPaths?: TableNavigationPath[];
}

export type TableMap = { [tableName: string]: TableMapRec };
export interface TableMapRec {
    dbTable: string;
    tableType: string;
    columns: ColumnMap;
    name?: string;
    plural?: string;
    selfRef?: string;
    namedParentRefs?: string[];
    dependents?: string[];
    displayColumns?: string[];
    minDependentArity?: number;
    maxDependentArity?: number;
    condition?: Condition;
}

export type ColumnMap = { [column: string]: ColumnMapRec };
export interface ColumnMapRec {
    column: string;
    label?: string;
    len: number;
    rows?: number;
    canModify: boolean;
    isNullable: string;
    dbDataType: string;
    isForeignKey: boolean;
    foreignKeyTable?: string;
    isEnum: boolean;
    enumValues?: string[];
    condition?: Condition;
    dbVal?: DbVal;
}

export interface Condition {
    enablingColumn: string;
    enablingValues: string[];
}

export interface TableNavigationPath {
    label?: string;
    table?: string;
    children: TableNavigationPath[];
}
export type DbVal = null | boolean | number | string;
export type Rec = { id: number; mode: DisplayMode; columns: RecColumns | undefined };
export type RecColumns = { [column: string]: { value: DbVal } };
export type RecArray = Rec[];

export type DisplayState = 'top' | 'navPathSelected' | 'tableSelected' | 'instanceSelected';
export type DisplayMode = 'create' | 'read' | 'update';
export type FormStackElement = { table: string; instanceId: number; savedVals?: DbVal[] };

export interface UIstatus {
    tableMap: TableMap;
    navPaths: TableNavigationPath[];
    displayState: DisplayState;
    navPath?: TableNavigationPath;
    table?: string;
    formStack: FormStackElement[];
}
