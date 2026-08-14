"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const net = __importStar(require("net"));
const path_1 = require("path");
const SERVER_PORT = 8080;
const SERVER_HOST = '127.0.0.1';
/**
 * Checks if the backend HTTPS server is already listening on port 8080
 */
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
async function start() {
    const rootDir = (0, path_1.resolve)(__dirname, '../../');
    const serverPath = (0, path_1.resolve)(rootDir, 'server/public/server.js');
    let serverProcess = null;
    console.log('[app1R] Checking if edit-mode server is running on port 8080...');
    const running = await isServerRunning(SERVER_PORT, SERVER_HOST);
    if (running) {
        console.log('[app1R] Edit-mode server is already running.');
    }
    else {
        console.log('[app1R] Starting backend edit-mode server (https://localhost:8080)...');
        serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true,
        });
        // Brief pause to allow the server to bind to port 8080
        await new Promise((r) => setTimeout(r, 800));
    }
    console.log('[app1R] Launching live-server for app1 (ignoring segs/ for manual [R] control)...\n');
    const liveServerProcess = (0, child_process_1.spawn)('npx', ['live-server', './app1', '--ignore=segs,dist'], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true,
    });
    // Handle clean shutdown on Ctrl+C
    const cleanup = () => {
        if (serverProcess && !serverProcess.killed) {
            console.log('\n[app1R] Shutting down backend edit-mode server...');
            serverProcess.kill();
        }
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    liveServerProcess.on('exit', () => cleanup());
}
start();
