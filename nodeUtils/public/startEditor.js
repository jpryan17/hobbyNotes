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
const net = __importStar(require("net"));
const path_1 = require("path");
const SERVER_PORT = 3000;
const SERVER_HOST = '127.0.0.1';
function isServerRunning(port, host) {
    return new Promise((resolvePromise) => {
        const socket = new net.Socket();
        socket.setTimeout(600);
        socket.on('connect', () => {
            socket.destroy();
            resolvePromise(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolvePromise(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolvePromise(false);
        });
        socket.connect(port, host);
    });
}
function openBrowser(url) {
    const cmd = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;
    (0, child_process_1.exec)(cmd, (err) => {
        if (err) {
            console.warn(`[editor] Could not automatically open browser: ${err.message}`);
        }
    });
}
async function start() {
    const rootDir = (0, path_1.resolve)(__dirname, '../../');
    const serverPath = (0, path_1.resolve)(rootDir, 'server/public/server.js');
    let serverProcess = null;
    // Extract optional file argument (e.g. npm run editor -- app1/dist/index.html or npm run editor -- modelsOverview)
    const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
    const targetFile = args[0] ? args[0].trim() : '';
    const editorUrl = targetFile
        ? `http://localhost:${SERVER_PORT}/editor?path=${encodeURIComponent(targetFile)}`
        : `http://localhost:${SERVER_PORT}/editor`;
    console.log('[editor] Checking if backend server is running on port 3000...');
    const running = await isServerRunning(SERVER_PORT, SERVER_HOST);
    if (running) {
        console.log('[editor] Backend server is already running on port 3000.');
        console.log(`[editor] Opening Standalone Chapter Editor: ${editorUrl}`);
        openBrowser(editorUrl);
    }
    else {
        console.log('[editor] Starting backend server (http://localhost:3000)...');
        serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true,
        });
        // Wait for server to bind
        await new Promise((r) => setTimeout(r, 900));
        console.log(`[editor] Standalone Chapter Editor available at: ${editorUrl}`);
        openBrowser(editorUrl);
        // Keep process alive if we spawned the server
        const cleanup = () => {
            if (serverProcess && !serverProcess.killed) {
                console.log('\n[editor] Shutting down server...');
                serverProcess.kill();
            }
            process.exit(0);
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        serverProcess.on('exit', () => cleanup());
    }
}
start();
