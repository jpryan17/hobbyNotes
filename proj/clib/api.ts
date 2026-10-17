// client/src/api.ts (NEW FILE)

/**
 * This module centralizes all communication with the server's API.
 * It's designed to support both stateless (client-buffered) and
 * stateful (server-session) transaction models.
 */

// Define the shared response interface here, as it's the primary contract
// for all API calls.
export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data?: { rows?: T[]; rowCount: number };
    error?: string;
    // Add transactionId for the begin response
    transactionId?: string;
}

const BASE_URL = '/api';

/**
 * The core function for executing SQL. It can operate in two modes:
 * 1. Stateless: If `transactionId` is null, it executes the given SQL in a single, atomic request.
 *    This is used for standard queries or for sending a full, client-buffered transaction block.
 * 2. Stateful: If a `transactionId` is provided, it executes the SQL within that specific
 *    server-side transaction.
 */
export async function executeSql<T>(sql: string, transactionId: string | null = null): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${BASE_URL}/sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql, transactionId }),
        });
        if (!response.ok) {
            // Handle HTTP errors like 500, 404 etc., which fetch doesn't throw by default
            return {
                status: 'error',
                message: `Server responded with status: ${response.status}`,
                error: await response.text(),
            };
        }
        return await response.json();
    } catch (err) {
        console.error('API Error in executeSql:', err);
        return {
            status: 'error',
            message: 'Could not connect to the server. Is it running?',
            error: (err as Error).message,
        };
    }
}
/**
 * Executes a SELECT query and returns the resulting rows.
 */
export async function queryDatabase<T>(sql: string): Promise<T[]> {
    const result = await executeSql<T>(sql);
    return result.data?.rows || [];
}

/**
 * Fetches the list of SQL templates from the database.
 * This is a convenience function that uses `executeSql` internally.
 */
export async function fetchSqlTemplates(): Promise<ApiResponse<any>> {
    const sql = 'SELECT name, type, sql_template FROM useful_sql ORDER BY type, name';
    // This is a stateless query, so we don't provide a transactionId.
    return executeSql(sql);
}

// --- Stateful Transaction Functions ---

/**
 * Requests the server to start a new transaction and return a unique ID for it.
 */
export async function beginTransaction(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${BASE_URL}/transactions/begin`, { method: 'POST' });
        return await response.json();
    } catch (err) {
        console.error('API Error in beginTransaction:', err);
        return { status: 'error', message: 'Failed to initiate begin transaction call.' };
    }
}

/**
 * Commits an active server-side transaction.
 */
export async function commitTransaction(transactionId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${BASE_URL}/transactions/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    } catch (err) {
        console.error('API Error in commitTransaction:', err);
        return { status: 'error', message: 'Failed to initiate commit transaction call.' };
    }
}

/**
 * Rolls back an active server-side transaction.
 */
export async function rollbackTransaction(transactionId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${BASE_URL}/transactions/rollback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    } catch (err) {
        console.error('API Error in rollbackTransaction:', err);
        return { status: 'error', message: 'Failed to initiate rollback transaction call.' };
    }
}
