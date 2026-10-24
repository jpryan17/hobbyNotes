import { execSync } from 'child_process';
import * as path from 'path';

import * as fs from 'fs';

const rootDir = path.resolve(__dirname, '../../');
const distIndexPath = path.join(rootDir, 'app1', 'dist', 'index.html');
const forceBuild = process.argv.includes('--build') || process.argv.includes('-b');

try {
  const runPrep = process.argv.includes('--prep') || process.argv.includes('--build') || process.argv.includes('-b');
  if (runPrep) {
    console.log('[deploy] Running prep (PostgreSQL backup + distribution build)...');
    execSync('npm run prep', { cwd: rootDir, stdio: 'inherit' });
  }

  // Always ensure standalone overview.html and mwm_pseudocode_spec.html are synced to dist before staging
  const rootOverview = path.join(rootDir, 'overview.html');
  const distOverview = path.join(rootDir, 'app1', 'dist', 'overview.html');
  if (fs.existsSync(rootOverview)) {
    const distDir = path.dirname(distOverview);
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(rootOverview, distOverview);
    console.log('[deploy] Synced latest overview.html to app1/dist/overview.html');
  }

  const rootSpec = path.join(rootDir, 'mwm_pseudocode_spec.html');
  const distSpec = path.join(rootDir, 'app1', 'dist', 'mwm_pseudocode_spec.html');
  if (fs.existsSync(rootSpec)) {
    const distDir = path.dirname(distSpec);
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(rootSpec, distSpec);
    console.log('[deploy] Synced latest mwm_pseudocode_spec.html to app1/dist/mwm_pseudocode_spec.html');
  }

  // Check if there are any working tree or staged changes
  const gitStatus = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' }).trim();
  if (!gitStatus) {
    console.log('[deploy] Working tree is clean. Nothing new to commit or deploy.');
    process.exit(0);
  }

  console.log('[deploy] Staging changes in git...');
  execSync('git add .', { cwd: rootDir, stdio: 'inherit' });

  try {
    execSync('git commit -m "Deploy Mathematics and the Middle Way to middlewaymath.app"', { cwd: rootDir, stdio: 'inherit' });
  } catch {
    console.log('[deploy] No new staged changes to commit.');
  }

  console.log('[deploy] Pushing to origin master...');
  execSync('git push origin master', { cwd: rootDir, stdio: 'inherit' });
  console.log('[deploy] Successfully deployed to origin master!');
} catch (err: any) {
  console.error('[deploy Error]:', err.message);
  process.exit(1);
}
