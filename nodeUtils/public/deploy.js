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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const rootDir = path.resolve(__dirname, '../../');
try {
    console.log('[deploy] Running build...');
    (0, child_process_1.execSync)('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('[deploy] Staging changes in git...');
    (0, child_process_1.execSync)('git add .', { cwd: rootDir, stdio: 'inherit' });
    try {
        (0, child_process_1.execSync)('git commit -m "Deploy Mathematics and the Middle Way to middlewaymath.app"', { cwd: rootDir, stdio: 'inherit' });
    }
    catch {
        console.log('[deploy] No new staged changes to commit.');
    }
    console.log('[deploy] Pushing to origin master...');
    (0, child_process_1.execSync)('git push origin master', { cwd: rootDir, stdio: 'inherit' });
    console.log('[deploy] Successfully deployed to origin master!');
}
catch (err) {
    console.error('[deploy Error]:', err.message);
    process.exit(1);
}
