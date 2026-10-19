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

import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

const rootDir = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(rootDir, '.env') });

const dbUser = process.env.DB_USER || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_DATABASE || 'hobbynotes';
const dbPass = process.env.DB_PASSWORD || '';

const backupsDir = resolve(rootDir, 'db', 'backups');
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
}

export function performBackup(): { latestPath: string; timestampedPath: string; bytes: number; durationMs: number } {
  const startTime = Date.now();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const timestampedFile = `hobbynotes_${timestamp}.sql`;
  const timestampedPath = join(backupsDir, timestampedFile);
  const latestPath = join(backupsDir, 'latest.sql');

  console.log(`[dbBackup] Starting PostgreSQL backup for '${dbName}' on ${dbHost}:${dbPort}...`);

  // Run pg_dump with clean, if-exists, no-owner, no-privileges
  const cmd = `pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} --clean --if-exists --no-owner --no-acl --encoding=UTF8`;

  const env = {
    ...process.env,
    PGPASSWORD: dbPass,
  };

  const sqlOutput = execSync(cmd, {
    env,
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    encoding: 'utf-8',
  });

  // Write both files
  writeFileSync(timestampedPath, sqlOutput, 'utf-8');
  writeFileSync(latestPath, sqlOutput, 'utf-8');

  const bytes = Buffer.byteLength(sqlOutput, 'utf-8');
  const durationMs = Date.now() - startTime;

  // Rotate backups: keep last 10 timestamped files
  try {
    const files = readdirSync(backupsDir)
      .filter((f) => f.startsWith('hobbynotes_') && f.endsWith('.sql'))
      .sort(); // Lexicographical sort works for YYYYMMDD_HHmmss

    if (files.length > 10) {
      const toDelete = files.slice(0, files.length - 10);
      for (const delFile of toDelete) {
        unlinkSync(join(backupsDir, delFile));
        console.log(`[dbBackup] Rotated old backup: ${delFile}`);
      }
    }
  } catch (rotErr) {
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
  } catch (err: any) {
    console.error('[dbBackup] Backup failed:', err.message);
    process.exit(1);
  }
}
