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
const http = __importStar(require("http"));
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
function probeHealth(port, host) {
    return new Promise((resolvePromise) => {
        const req = http.get({
            hostname: host,
            port: port,
            path: '/api/health',
            timeout: 1000,
        }, (res) => {
            res.resume();
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                resolvePromise(true);
            }
            else {
                resolvePromise(false);
            }
        });
        req.on('error', () => {
            resolvePromise(false);
        });
        req.on('timeout', () => {
            req.destroy();
            resolvePromise(false);
        });
    });
}
async function waitForServerReady(port, host, maxWaitMs = 15000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        const running = await isServerRunning(port, host);
        if (running) {
            const healthy = await probeHealth(port, host);
            if (healthy) {
                return true;
            }
        }
        await new Promise((r) => setTimeout(r, 150));
    }
    return false;
}
function openBrowser(url) {
    const cmd = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;
    (0, child_process_1.exec)(cmd, (err) => {
        if (err) {
            console.warn(`[console] Could not automatically open browser: ${err.message}`);
        }
    });
}
async function start() {
    const rootDir = (0, path_1.resolve)(__dirname, '../../');
    const serverPath = (0, path_1.resolve)(rootDir, 'server/public/server.js');
    let serverProcess = null;
    const consoleUrl = `http://localhost:${SERVER_PORT}/console`;
    console.log('[console] Checking backend server status...');
    const running = await isServerRunning(SERVER_PORT, SERVER_HOST);
    if (running) {
        console.log('[console] Backend server is already running on port 3000.');
        const healthy = await probeHealth(SERVER_PORT, SERVER_HOST);
        if (!healthy) {
            console.log('[console] Waiting for database connection pool to settle...');
            await waitForServerReady(SERVER_PORT, SERVER_HOST, 6000);
        }
        console.log(`[console] Opening Database Console: ${consoleUrl}`);
        openBrowser(consoleUrl);
    }
    else {
        console.log('[console] Starting backend server (http://localhost:3000)...');
        serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true,
        });
        console.log('[console] Waiting for backend server and PostgreSQL connection...');
        const ready = await waitForServerReady(SERVER_PORT, SERVER_HOST, 15000);
        if (ready) {
            console.log('[console] Backend server & database ready.');
        }
        else {
            console.warn('[console] Warning: Server /api/health timed out after 15s; opening browser anyway.');
        }
        console.log(`[console] Database Console available at: ${consoleUrl}`);
        openBrowser(consoleUrl);
        // Keep process alive if we spawned the server
        const cleanup = () => {
            if (serverProcess && !serverProcess.killed) {
                console.log('\n[console] Shutting down server...');
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
