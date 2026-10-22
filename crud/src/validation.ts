// crud/src/validation.ts
// Validates TypeScript table configuration against active PostgreSQL schema and builds enriched runtime metadata.

import { queryDatabase } from '../../clientLib/db/api.js';
import { tables, dependents, navigations } from './crudConfig.js';
import { AppMetadata, EnrichedTable, EnrichedColumn, TableNavigationPath } from './types.js';

interface DbTableInfo {
    tablename: string;
}

interface DbColumnInfo {
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: 'YES' | 'NO';
}

interface DbForeignKeyInfo {
    source_table: string;
    source_column: string;
    target_table: string;
}

interface DbEnumInfo {
    enum_name: string;
    enum_value: string;
}

export async function validateAndBuildMetadata(): Promise<AppMetadata> {
    console.log('[crudValidation] Starting configuration validation against PostgreSQL...');

    // 1. Internal syntax check
    const [isConfigValid, configError] = validateInternalConfig();
    if (!isConfigValid) throw configError;

    // 2. Fetch active PostgreSQL metadata in parallel
    const [dbTables, dbColumns, dbForeignKeys, dbEnums] = await Promise.all([
        fetchTables(),
        fetchColumns(),
        fetchForeignKeys(),
        fetchEnums()
    ]);

    // Build enum map: udt_name -> string[]
    const enumMap: Record<string, string[]> = {};
    for (const item of dbEnums) {
        if (!enumMap[item.enum_name]) {
            enumMap[item.enum_name] = [];
        }
        enumMap[item.enum_name].push(item.enum_value);
    }

    const enrichedMetadata: AppMetadata = {};

    // 3. Enrich tables and columns
    for (const tableConfig of tables) {
        const foundDbTable = dbTables.find((t) => t.tablename.toLowerCase() === tableConfig.table.toLowerCase());
        if (!foundDbTable) {
            console.warn(`[crudValidation] DB Schema Warning: Table '${tableConfig.table}' not found in active database.`);
            continue;
        }

        const columnsForThisTable = dbColumns.filter(
            (c) => c.table_name.toLowerCase() === tableConfig.table.toLowerCase()
        );

        const enrichedTable: EnrichedTable = {
            tableName: tableConfig.table,
            label: tableConfig.label,
            singularLabel: tableConfig.singularLabel || tableConfig.label,
            exclusiveFieldSets: tableConfig.exclusiveFieldSets,
            columns: {},
            dependents: dependents.filter((d) => d.parent === tableConfig.table)
        };

        for (const colConfig of tableConfig.columns) {
            const dbCol = columnsForThisTable.find(
                (c) => c.column_name.toLowerCase() === colConfig.column.toLowerCase()
            );

            if (!dbCol) {
                console.warn(`[crudValidation] DB Column Warning: Column '${colConfig.column}' on table '${tableConfig.table}' not in schema.`);
                continue;
            }

            const fkInfo = dbForeignKeys.find(
                (fk) => fk.source_table === tableConfig.table && fk.source_column === colConfig.column
            );

            const isExplicitOptions = Array.isArray(colConfig.options) && colConfig.options.length > 0;
            const isDbEnum = enumMap.hasOwnProperty(dbCol.udt_name);
            const isEnum = isExplicitOptions || isDbEnum;
            const enumValues = isExplicitOptions
                ? (typeof colConfig.options![0] === 'string'
                    ? (colConfig.options as string[])
                    : (colConfig.options as { value: string; label: string }[]).map((o) => o.value))
                : (isDbEnum ? enumMap[dbCol.udt_name] : []);

            const enrichedCol: EnrichedColumn = {
                ...colConfig,
                label: colConfig.label || colConfig.column,
                isPrimaryKey: colConfig.column === 'id',
                isForeignKey: !!fkInfo,
                foreignKeyTable: fkInfo?.target_table,
                isEnum: isEnum,
                enumValues: enumValues,
                dbDataType: dbCol.data_type,
                isNullable: dbCol.is_nullable === 'YES'
            };

            enrichedTable.columns[colConfig.column] = enrichedCol;
        }

        enrichedMetadata[tableConfig.table] = enrichedTable;
    }

    // 4. Enrich self-referencing hierarchy columns (e.g. curriculum_nav_items.parent_id)
    for (const fk of dbForeignKeys) {
        if (fk.source_table === fk.target_table && enrichedMetadata[fk.source_table]) {
            enrichedMetadata[fk.source_table].parentColumn = fk.source_column;
        }
    }

    console.log(`[crudValidation] Validation successful. Enriched ${Object.keys(enrichedMetadata).length} tables.`);
    return enrichedMetadata;
}

function validateInternalConfig(): [boolean, Error | null] {
    const definedTableNames = new Set(tables.map((t) => t.table));

    for (const navPath of allNavPaths(navigations)) {
        if (!navPath.table && !navPath.label) {
            return [false, new Error(`Internal Config Error: A navigation node is missing both 'table' and 'label'.`)];
        }
        if (navPath.table && !definedTableNames.has(navPath.table)) {
            return [false, new Error(`Internal Config Error: Nav table '${navPath.table}' not defined in tables array.`)];
        }
    }

    for (const dep of dependents) {
        if (!definedTableNames.has(dep.table)) {
            return [false, new Error(`Internal Config Error: Dependent table '${dep.table}' not defined in tables array.`)];
        }
        if (!definedTableNames.has(dep.parent)) {
            return [false, new Error(`Internal Config Error: Dependent parent '${dep.parent}' not defined in tables array.`)];
        }
    }

    return [true, null];
}

function* allNavPaths(paths: TableNavigationPath[]): Generator<TableNavigationPath> {
    for (const path of paths) {
        yield path;
        if (path.children) {
            yield* allNavPaths(path.children);
        }
    }
}

async function fetchTables(): Promise<DbTableInfo[]> {
    return queryDatabase<DbTableInfo>("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
}

async function fetchColumns(): Promise<DbColumnInfo[]> {
    const sql = `
        SELECT table_name, column_name, data_type, udt_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    `;
    return queryDatabase<DbColumnInfo>(sql);
}

async function fetchForeignKeys(): Promise<DbForeignKeyInfo[]> {
    const sql = `
        SELECT 
            kcu.table_name AS source_table, 
            kcu.column_name AS source_column, 
            ccu.table_name AS target_table
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu 
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
    return queryDatabase<DbForeignKeyInfo>(sql);
}

async function fetchEnums(): Promise<DbEnumInfo[]> {
    const sql = `
        SELECT t.typname AS enum_name, e.enumlabel AS enum_value 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typtype = 'e';
    `;
    return queryDatabase<DbEnumInfo>(sql);
}
