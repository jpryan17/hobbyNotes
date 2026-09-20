import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve(__dirname, '../../');
const distDir = path.resolve(rootDir, 'app2/dist');
const cnamePath = path.join(distDir, 'CNAME');

console.log('[deployLam] Ensuring app2 is built...');
execSync('npm run app2BuildR', { cwd: rootDir, stdio: 'inherit' });

console.log('[deployLam] Writing CNAME for lamblaster.app...');
fs.writeFileSync(cnamePath, 'lamblaster.app\n', 'utf8');

console.log('[deployLam] Pushing to https://github.com/jpryan17/lamblasterA.git on main branch...');
try {
  execSync('git init', { cwd: distDir, stdio: 'inherit' });
  execSync('git config user.name "jpryan"', { cwd: distDir, stdio: 'inherit' });
  execSync('git config user.email "jpryan@localhost"', { cwd: distDir, stdio: 'inherit' });
  execSync('git checkout -B main', { cwd: distDir, stdio: 'inherit' });
  execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy LAM to lamblaster.app"', { cwd: distDir, stdio: 'inherit' });
  execSync('git push -f https://github.com/jpryan17/lamblasterA.git main', { cwd: distDir, stdio: 'inherit' });
  console.log('[deployLam] Successfully pushed to GitHub Pages repo!');
  console.log('[deployLam] Live soon at: https://lamblaster.app');
} catch (err: any) {
  console.error('[deployLam] Deployment step encountered an error:', err.message);
}
