//
// crud/src/init1download.ts   --- download the required DB config info ---
//
import { queryDatabase } from '../../../clib/api';

const tabQuery = `SELECT
                    id,name,plural,db_table_name, table_type, parent_table, 
                    min_dependent_arity, max_dependent_arity
                  FROM uc_table`;

export interface TAB {
    id: number;
    name: string;
    plural: string | null;
    db_table_name: string;
    table_type: string;
    parent_table: number | null;
    min_dependent_arity: number | null;
    max_dependent_arity: number | null;
}

const colQuery = ` SELECT
                    id, for_table, db_column_name, label,
                    ui_can_modify, display_length, display_rows, label
                  FROM uc_column`;

export interface COL {
    id: number;
    for_table: number;
    db_column_name: string;
    ui_can_modify: boolean;
    display_length: number;
    display_rows: number | null;
    label: string | null;
}

const dtcQuery = `SELECT id, for_table, display_position, display_column 
                    FROM uc_dependent_table_display_column 
                    ORDER BY for_table, display_position`;
export interface DTC {
    id: number;
    for_table: number;
    display_position: number;
    display_column: number;
}

const tcnQuery = `SELECT id, for_table, enabling_column, enabling_value
                    FROM uc_table_condition`;
export interface TCN {
    id: number;
    for_table: number;
    enabling_column: number;
    enabling_value: string;
}

const ccnQuery = `SELECT id, for_column, enabling_column, enabling_value
FROM uc_column_condition`;
export interface CCN {
    id: number;
    for_column: number;
    enabling_column: number;
    enabling_value: string;
}

const navQuery = `SELECT id, name, sibling_position,nav_button_type,
                        parent_button, uc_table
                  FROM uc_navigation
                  ORDER BY parent_button, sibling_position`;
export interface NAV {
    id: number;
    name: string;
    sibling_position: number;
    nav_button_type: string;
    parent_button?: number;
    uc_table?: number;
}

const evQuery = `SELECT t.typname AS enum_name, e.enumlabel AS enum_val  
                    FROM pg_type t
                      JOIN pg_enum e ON t.oid = e.enumtypid
                      JOIN pg_namespace n ON n.oid = t.typnamespace
                    WHERE t.typtype = 'e' AND n.nspname = 'public'
                    ORDER BY enum_name, enumsortorder;`;
export interface EV {
    enum_name: string;
    enum_val: string;
}

const schemaInfoQuery = `SELECT table_name, column_name, data_type, udt_name, is_nullable 
                         FROM information_schema.columns
                         ORDER BY table_name, column_name`;
export interface SchemaInfo {
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: string;
}

const fkInfoQuery = ` SELECT
                        tc.table_name as table_name, 
                        kcu.column_name as column_name, 
                        ccu.table_name AS foreign_table_name
                    FROM information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                            AND tc.table_schema = kcu.table_schema 
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                            AND tc.table_schema='public'
                    ORDER BY table_name, column_name`;

export interface FkInfo {
    table_name: string;
    column_name: string;
    foreign_table_name: string;
}

export type DownloadInfo = [TAB[], COL[], DTC[], TCN[], CCN[], NAV[], EV[], SchemaInfo[], FkInfo[]];

export async function configQueries(): Promise<DownloadInfo> {
    return await Promise.all([
        queryDatabase<TAB>(tabQuery),
        queryDatabase<COL>(colQuery),
        queryDatabase<DTC>(dtcQuery),
        queryDatabase<TCN>(tcnQuery),
        queryDatabase<CCN>(ccnQuery),
        queryDatabase<NAV>(navQuery),
        queryDatabase<EV>(evQuery),
        queryDatabase<SchemaInfo>(schemaInfoQuery),
        queryDatabase<FkInfo>(fkInfoQuery),
    ]);
}
