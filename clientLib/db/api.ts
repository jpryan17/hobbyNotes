// clientLib/db/api.ts
// Client-side typed HTTP API bridge for PostgreSQL queries and transactions.

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: {
        rows: T[];
        rowCount: number;
    };
    error?: string;
    transactionId?: string;
}

// Configurable base URL: uses window.location origin if on same host, or fallback port 3000 / 8080
let apiBaseUrl: string = typeof window !== 'undefined' && window.location.port === '3000'
    ? ''
    : 'http://localhost:3000';

export function setApiBaseUrl(url: string): void {
    apiBaseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
    return apiBaseUrl;
}

/**
 * Core function to execute an SQL statement.
 * Supports:
 * - Parameterized queries via params ($1, $2, ...)
 * - Stateful execution if transactionId is supplied
 */
export async function executeSql<T = any>(
    sql: string,
    params?: any[],
    transactionId: string | null = null
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql, params, transactionId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: 'error',
                message: `Server returned status ${response.status}`,
                error: errorText,
            };
        }

        return await response.json();
    } catch (err: any) {
        console.error('[clientLib/db/api] executeSql error:', err);
        return {
            status: 'error',
            message: 'Could not connect to database bridge server. Is it running?',
            error: err?.message || String(err),
        };
    }
}

/**
 * Convenience function to execute a SELECT query and return rows directly.
 */
export async function queryDatabase<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const res = await executeSql<T>(sql, params);
    if (res.status === 'success' && res.data?.rows) {
        return res.data.rows;
    }
    if (res.status === 'error') {
        console.warn(`[clientLib/db/api] Query failed: ${res.message}`, res.error);
    }
    return [];
}

/**
 * Stateful Transaction APIs
 */
export async function beginTransaction(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        return await response.json();
    } catch (err: any) {
        return {
            status: 'error',
            message: 'Failed to initiate begin transaction call.',
            error: err?.message || String(err),
        };
    }
}

export async function commitTransaction(transactionId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    } catch (err: any) {
        return {
            status: 'error',
            message: 'Failed to commit transaction.',
            error: err?.message || String(err),
        };
    }
}

export async function rollbackTransaction(transactionId: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/rollback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    } catch (err: any) {
        return {
            status: 'error',
            message: 'Failed to rollback transaction.',
            error: err?.message || String(err),
        };
    }
}
