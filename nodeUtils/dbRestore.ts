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

import { existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

const rootDir = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(rootDir, '.env') });

const dbUser = process.env.DB_USER || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_DATABASE || 'hobbynotes';
const dbPass = process.env.DB_PASSWORD || '';

export function performRestore(customFilePath?: string): { restoredFrom: string; durationMs: number } {
  const startTime = Date.now();
  const targetFile = customFilePath || process.argv[2] || resolve(rootDir, 'db', 'backups', 'latest.sql');
  const resolvedPath = resolve(process.cwd(), targetFile);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Backup file not found at: ${resolvedPath}`);
  }

  console.log(`[dbRestore] Restoring '${dbName}' from '${resolvedPath}' on ${dbHost}:${dbPort}...`);

  const cmd = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -f "${resolvedPath}"`;

  const env = {
    ...process.env,
    PGPASSWORD: dbPass,
  };

  execSync(cmd, {
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
  } catch (err: any) {
    console.error('[dbRestore] Restore failed:', err.message);
    process.exit(1);
  }
}
