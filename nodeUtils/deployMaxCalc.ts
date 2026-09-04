import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve(__dirname, '../../');
const webDir = path.resolve(rootDir, 'MaximaMiner/web');
const cnamePath = path.join(webDir, 'CNAME');

console.log('[deployMaxCalc] Pre-mining benchmark database...');
execSync('python MaximaMiner/scripts/gen_premined.py', { cwd: rootDir, stdio: 'inherit' });

console.log('[deployMaxCalc] Writing CNAME for lamblaster.app...');
fs.writeFileSync(cnamePath, 'lamblaster.app\n', 'utf8');

console.log('[deployMaxCalc] Pushing to https://github.com/jpryan17/lamblasterA.git on main branch...');
try {
  execSync('git init', { cwd: webDir, stdio: 'inherit' });
  execSync('git config user.name "jpryan"', { cwd: webDir, stdio: 'inherit' });
  execSync('git config user.email "jpryan@localhost"', { cwd: webDir, stdio: 'inherit' });
  execSync('git checkout -B main', { cwd: webDir, stdio: 'inherit' });
  execSync('git add -A', { cwd: webDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy MaxCalc to lamblaster.app"', { cwd: webDir, stdio: 'inherit' });
  execSync('git push -f https://github.com/jpryan17/lamblasterA.git main', { cwd: webDir, stdio: 'inherit' });
  console.log('[deployMaxCalc] Successfully pushed to GitHub Pages repo!');
  console.log('[deployMaxCalc] Live soon at: https://lamblaster.app');
} catch (err: any) {
  console.error('[deployMaxCalc] Deployment step encountered an error:', err.message);
}
