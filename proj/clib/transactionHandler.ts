// client/src/transactionHandler.ts (NEW FILE)

import * as api from './api';
import { ApiResponse } from './api';

export type TransactionMode = 'stateless' | 'stateful';

/**
 * Manages the lifecycle of a database transaction, abstracting away the
 * difference between a stateful (server-session) and stateless (client-buffered) approach.
 *
 * Usage:
 * 1. Create an instance: `const tx = new TransactionHandler('stateful');`
 * 2. Start it: `await tx.begin();`
 * 3. Execute statements: `await tx.execute('INSERT...');`
 * 4. Finish it: `await tx.commit();` or `await tx.rollback();`
 */
export class TransactionHandler {
    private mode: TransactionMode;
    private transactionId: string | null = null;
    private statements: string[] = [];
    public isActive: boolean = false;

    /**
     * @param mode The transaction strategy to use:
     * - 'stateful': Each `execute` call is sent to the server immediately under a single server-side transaction.
     * - 'stateless': Each `execute` call is buffered on the client, and all statements are sent in one block on `commit`.
     */
    constructor(mode: TransactionMode) {
        this.mode = mode;
        console.log(`TransactionHandler created in '${this.mode}' mode.`);
    }

    /**
     * Resets the handler to its initial state. Called internally after commit/rollback.
     */
    private reset(): void {
        this.isActive = false;
        this.transactionId = null;
        this.statements = [];
    }

    /**
     * Begins a transaction.
     * In stateful mode, this contacts the server to open a transaction.
     * In stateless mode, this simply prepares the client-side buffer.
     * @returns {Promise<ApiResponse>} The result of the begin operation.
     */
    async begin(): Promise<ApiResponse> {
        if (this.isActive) {
            return { status: 'error', message: 'Transaction is already active.' };
        }

        this.isActive = true;

        if (this.mode === 'stateful') {
            const response = await api.beginTransaction();
            if (response.status === 'success' && response.transactionId) {
                this.transactionId = response.transactionId;
            } else {
                // If begin fails, the transaction is not actually active.
                this.reset();
            }
            return response;
        } else {
            // In stateless mode, beginning is a client-side-only operation.
            this.statements = [];
            return Promise.resolve({
                status: 'success',
                message: 'Stateless transaction started. Ready to queue statements.',
            });
        }
    }

    /**
     * Executes an SQL statement within the active transaction.
     * In stateful mode, sends the SQL to the server for immediate execution.
     * In stateless mode, queues the SQL on the client.
     * @param {string} sql The SQL statement to execute.
     * @returns {Promise<ApiResponse>} The result of the execution or queuing operation.
     */
    async execute(sql: string): Promise<ApiResponse> {
        if (!this.isActive) {
            return { status: 'error', message: 'No active transaction. Call begin() first.' };
        }

        if (this.mode === 'stateful') {
            if (!this.transactionId) {
                // This should not happen in normal flow
                return { status: 'error', message: 'Stateful transaction is active but has no ID.' };
            }
            return api.executeSql(sql, this.transactionId);
        } else {
            this.statements.push(sql);
            return Promise.resolve({
                status: 'success',
                message: `Statement successfully queued. Total statements: ${this.statements.length}.`,
                data: { rowCount: 0 },
            });
        }
    }

    /**
     * Commits the active transaction.
     */
    async commit(): Promise<ApiResponse> {
        if (!this.isActive) {
            return { status: 'error', message: 'No active transaction to commit.' };
        }

        let response: ApiResponse;
        if (this.mode === 'stateful') {
            if (!this.transactionId) return { status: 'error', message: 'Missing transaction ID.' };
            response = await api.commitTransaction(this.transactionId);
        } else {
            if (this.statements.length === 0) {
                response = { status: 'success', message: 'Stateless transaction committed with no statements.' };
            } else {
                const fullTransactionSQL = ['BEGIN;', ...this.statements, 'COMMIT;'].join('\n');
                response = await api.executeSql(fullTransactionSQL);
            }
        }

        this.reset();
        return response;
    }

    /**
     * Rolls back the active transaction.
     */
    async rollback(): Promise<ApiResponse> {
        if (!this.isActive) {
            return { status: 'error', message: 'No active transaction to roll back.' };
        }

        let response: ApiResponse;
        if (this.mode === 'stateful') {
            if (!this.transactionId) return { status: 'error', message: 'Missing transaction ID.' };
            response = await api.rollbackTransaction(this.transactionId);
        } else {
            // Rolling back a stateless transaction is a client-side-only operation.
            response = { status: 'success', message: 'Stateless transaction rolled back. Queued statements cleared.' };
        }

        this.reset();
        return response;
    }
}
