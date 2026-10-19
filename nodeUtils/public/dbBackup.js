"use strict";
/**
 * nodeUtils/dbBackup.ts
 *
 * Creates an authoritative SQL dump of the live PostgreSQL database (schema + data).
 *
 * Outputs:
 * 1. `db/backups/latest.sql`: The canonical latest snapshot.
 * 2. `db/backups/hobbynotes_YYYYMMDD_HHmmss.sql`: Timestamped historical snapshot (retaining last 10).
 *
 * Usage:
 *   npm run db:backup
 *   node ./nodeUtils/public/dbBackup.js
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
exports.performBackup = performBackup;
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
const backupsDir = (0, path_1.resolve)(rootDir, 'db', 'backups');
if (!(0, fs_1.existsSync)(backupsDir)) {
    (0, fs_1.mkdirSync)(backupsDir, { recursive: true });
}
function performBackup() {
    const startTime = Date.now();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const timestampedFile = `hobbynotes_${timestamp}.sql`;
    const timestampedPath = (0, path_1.join)(backupsDir, timestampedFile);
    const latestPath = (0, path_1.join)(backupsDir, 'latest.sql');
    console.log(`[dbBackup] Starting PostgreSQL backup for '${dbName}' on ${dbHost}:${dbPort}...`);
    // Run pg_dump with clean, if-exists, no-owner, no-privileges
    const cmd = `pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} --clean --if-exists --no-owner --no-acl --encoding=UTF8`;
    const env = {
        ...process.env,
        PGPASSWORD: dbPass,
    };
    const sqlOutput = (0, child_process_1.execSync)(cmd, {
        env,
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        encoding: 'utf-8',
    });
    // Write both files
    (0, fs_1.writeFileSync)(timestampedPath, sqlOutput, 'utf-8');
    (0, fs_1.writeFileSync)(latestPath, sqlOutput, 'utf-8');
    const bytes = Buffer.byteLength(sqlOutput, 'utf-8');
    const durationMs = Date.now() - startTime;
    // Rotate backups: keep last 10 timestamped files
    try {
        const files = (0, fs_1.readdirSync)(backupsDir)
            .filter((f) => f.startsWith('hobbynotes_') && f.endsWith('.sql'))
            .sort(); // Lexicographical sort works for YYYYMMDD_HHmmss
        if (files.length > 10) {
            const toDelete = files.slice(0, files.length - 10);
            for (const delFile of toDelete) {
                (0, fs_1.unlinkSync)((0, path_1.join)(backupsDir, delFile));
                console.log(`[dbBackup] Rotated old backup: ${delFile}`);
            }
        }
    }
    catch (rotErr) {
        console.warn('[dbBackup] Warning during rotation cleanup:', rotErr);
    }
    const kb = (bytes / 1024).toFixed(1);
    console.log(`[dbBackup] ✓ Backup successfully completed in ${durationMs}ms:`);
    console.log(`  - Latest: ${latestPath} (${kb} KB)`);
    console.log(`  - Snapshot: ${timestampedPath}`);
    return { latestPath, timestampedPath, bytes, durationMs };
}
// Direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('dbBackup.js')) {
    try {
        performBackup();
    }
    catch (err) {
        console.error('[dbBackup] Backup failed:', err.message);
        process.exit(1);
    }
}
