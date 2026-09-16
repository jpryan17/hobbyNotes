// clientLib/db/transactionHandler.ts
// Manages the lifecycle of database transactions across both stateful and stateless modes.

import * as api from './api.js';
import { ApiResponse } from './api.js';

export type TransactionMode = 'stateless' | 'stateful';

export interface QueuedStatement {
    sql: string;
    params?: any[];
}

export class TransactionHandler {
    private mode: TransactionMode;
    private transactionId: string | null = null;
    private statements: QueuedStatement[] = [];
    public isActive: boolean = false;

    constructor(mode: TransactionMode = 'stateful') {
        this.mode = mode;
    }

    private reset(): void {
        this.isActive = false;
        this.transactionId = null;
        this.statements = [];
    }

    public getActiveTransactionId(): string | null {
        return this.transactionId;
    }

    /**
     * Begins a transaction.
     * In stateful mode, initiates a server session client.
     * In stateless mode, readies the client-side statement buffer.
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
                this.reset();
            }
            return response;
        } else {
            this.statements = [];
            return {
                status: 'success',
                message: 'Stateless transaction started. Ready to buffer statements.',
            };
        }
    }

    /**
     * Executes an SQL statement within the transaction.
     */
    async execute(sql: string, params?: any[]): Promise<ApiResponse> {
        if (!this.isActive) {
            return { status: 'error', message: 'No active transaction. Call begin() first.' };
        }

        if (this.mode === 'stateful') {
            if (!this.transactionId) {
                return { status: 'error', message: 'Stateful transaction is active but has no ID.' };
            }
            return api.executeSql(sql, params, this.transactionId);
        } else {
            this.statements.push({ sql, params });
            return {
                status: 'success',
                message: `Statement queued in buffer (${this.statements.length} total).`,
                data: { rows: [], rowCount: 0 },
            };
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
            if (!this.transactionId) {
                return { status: 'error', message: 'Missing transaction ID.' };
            }
            response = await api.commitTransaction(this.transactionId);
        } else {
            if (this.statements.length === 0) {
                response = { status: 'success', message: 'Stateless transaction committed with 0 statements.' };
            } else {
                // Execute all buffered statements in one atomic block
                const fullSql = ['BEGIN;', ...this.statements.map(s => s.sql.trim().replace(/;+$/, '') + ';'), 'COMMIT;'].join('\n');
                response = await api.executeSql(fullSql);
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
            if (this.transactionId) {
                response = await api.rollbackTransaction(this.transactionId);
            } else {
                response = { status: 'error', message: 'Missing transaction ID.' };
            }
        } else {
            response = {
                status: 'success',
                message: `Stateless transaction rolled back (${this.statements.length} statements discarded).`,
            };
        }

        this.reset();
        return response;
    }
}
