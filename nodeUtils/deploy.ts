import { execSync } from 'child_process';
import * as path from 'path';

import * as fs from 'fs';

const rootDir = path.resolve(__dirname, '../../');
const distIndexPath = path.join(rootDir, 'app1', 'dist', 'index.html');
const forceBuild = process.argv.includes('--build') || process.argv.includes('-b');

try {
  if (forceBuild || !fs.existsSync(distIndexPath)) {
    console.log('[deploy] Building distribution...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  } else {
    console.log('[deploy] Verified existing dist/index.html. Skipping redundant build step (use --build to force).');
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
