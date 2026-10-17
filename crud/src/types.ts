// crud/src/types.ts
// Core metadata and UI state types for the MWM Database CRUD application.

export interface TableConfig {
    table: string;
    label: string;
    singularLabel?: string;
    exclusiveFieldSets?: ExclusiveFieldSet[];
    columns: ColumnConfig[];
}

export interface ColumnConfig {
    column: string;
    label?: string;
    canModify: boolean;
    len: number;
    rows?: number;
    useHints?: boolean;
    sufficientCondition?: SufficientCondition;
}

export interface ExclusiveFieldSet {
    switchColumn: string;
    cases: Record<string, string>;
}

export interface SufficientCondition {
    enablingColumn: string;
    enablingValues: string[];
}

export interface Dependent {
    table: string;
    parent: string;
    displayColumns?: string[];
}

export interface TableNavigationPath {
    label?: string;
    table?: string;
    children?: TableNavigationPath[];
}

export interface EnrichedColumn extends ColumnConfig {
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    foreignKeyTable?: string;
    isEnum: boolean;
    enumValues: string[];
    dbDataType: string;
    isNullable: boolean;
}

export interface EnrichedTable {
    tableName: string;
    label: string;
    singularLabel?: string;
    exclusiveFieldSets?: ExclusiveFieldSet[];
    columns: Record<string, EnrichedColumn>;
    dependents: Dependent[];
    parentColumn?: string;
}

export type AppMetadata = Record<string, EnrichedTable>;
