"use strict";
/**
 * nodeUtils/dbRestore.ts
 *
 * Restores the live PostgreSQL database from an SQL dump.
 * Defaults to `db/backups/latest.sql` if no specific file argument is provided.
 *
 * Usage:
 *   npm run db:restore
 *   npm run db:restore -- db/backups/hobbynotes_20261019_031800.sql
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.performRestore = performRestore;
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const dotenv = __importStar(require("dotenv"));
const rootDir = (0, path_1.resolve)(__dirname, '..', '..');
dotenv.config({ path: (0, path_1.resolve)(rootDir, '.env') });
const dbUser = process.env.DB_USER || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_DATABASE || 'hobbynotes';
const dbPass = process.env.DB_PASSWORD || '';
function performRestore(customFilePath) {
    const startTime = Date.now();
    const targetFile = customFilePath || process.argv[2] || (0, path_1.resolve)(rootDir, 'db', 'backups', 'latest.sql');
    const resolvedPath = (0, path_1.resolve)(process.cwd(), targetFile);
    if (!(0, fs_1.existsSync)(resolvedPath)) {
        throw new Error(`Backup file not found at: ${resolvedPath}`);
    }
    console.log(`[dbRestore] Restoring '${dbName}' from '${resolvedPath}' on ${dbHost}:${dbPort}...`);
    const cmd = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -f "${resolvedPath}"`;
    const env = {
        ...process.env,
        PGPASSWORD: dbPass,
    };
    (0, child_process_1.execSync)(cmd, {
        env,
        stdio: 'inherit',
        encoding: 'utf-8',
    });
    const durationMs = Date.now() - startTime;
    console.log(`[dbRestore] ✓ Database successfully restored in ${durationMs}ms from: ${resolvedPath}`);
    return { restoredFrom: resolvedPath, durationMs };
}
// Direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('dbRestore.js')) {
    try {
        performRestore();
    }
    catch (err) {
        console.error('[dbRestore] Restore failed:', err.message);
        process.exit(1);
    }
}
