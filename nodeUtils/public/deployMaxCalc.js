"use strict";
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const rootDir = path.resolve(__dirname, '../../');
const webDir = path.resolve(rootDir, 'MaximaMiner/web');
const cnamePath = path.join(webDir, 'CNAME');
console.log('[deployMaxCalc] Pre-mining benchmark database...');
(0, child_process_1.execSync)('python MaximaMiner/scripts/gen_premined.py', { cwd: rootDir, stdio: 'inherit' });
console.log('[deployMaxCalc] Writing CNAME for lamblaster.app...');
fs.writeFileSync(cnamePath, 'lamblaster.app\n', 'utf8');
console.log('[deployMaxCalc] Pushing to https://github.com/jpryan17/lamblasterA.git on main branch...');
try {
    (0, child_process_1.execSync)('git init', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git config user.name "jpryan"', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git config user.email "jpryan@localhost"', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git checkout -B main', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git add -A', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git commit -m "Deploy MaxCalc to lamblaster.app"', { cwd: webDir, stdio: 'inherit' });
    (0, child_process_1.execSync)('git push -f https://github.com/jpryan17/lamblasterA.git main', { cwd: webDir, stdio: 'inherit' });
    console.log('[deployMaxCalc] Successfully pushed to GitHub Pages repo!');
    console.log('[deployMaxCalc] Live soon at: https://lamblaster.app');
}
catch (err) {
    console.error('[deployMaxCalc] Deployment step encountered an error:', err.message);
}
