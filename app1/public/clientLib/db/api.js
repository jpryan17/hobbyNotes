// clientLib/db/api.ts
// Client-side typed HTTP API bridge for PostgreSQL queries and transactions.
// Configurable base URL: uses window.location origin if on same host, or fallback port 3000 / 8080
let apiBaseUrl = typeof window !== 'undefined' && window.location.port === '3000'
    ? ''
    : 'http://localhost:3000';
export function setApiBaseUrl(url) {
    apiBaseUrl = url.replace(/\/+$/, '');
}
export function getApiBaseUrl() {
    return apiBaseUrl;
}
/**
 * Core function to execute an SQL statement.
 * Supports:
 * - Parameterized queries via params ($1, $2, ...)
 * - Stateful execution if transactionId is supplied
 */
export async function executeSql(sql, params, transactionId = null) {
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
    }
    catch (err) {
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
export async function queryDatabase(sql, params) {
    const res = await executeSql(sql, params);
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
export async function beginTransaction() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        return await response.json();
    }
    catch (err) {
        return {
            status: 'error',
            message: 'Failed to initiate begin transaction call.',
            error: err?.message || String(err),
        };
    }
}
export async function commitTransaction(transactionId) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    }
    catch (err) {
        return {
            status: 'error',
            message: 'Failed to commit transaction.',
            error: err?.message || String(err),
        };
    }
}
export async function rollbackTransaction(transactionId) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/rollback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });
        return await response.json();
    }
    catch (err) {
        return {
            status: 'error',
            message: 'Failed to rollback transaction.',
            error: err?.message || String(err),
        };
    }
}
