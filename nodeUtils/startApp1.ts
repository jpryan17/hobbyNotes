import { spawn, ChildProcess } from 'child_process';
import * as net from 'net';
import { resolve } from 'path';

const SERVER_PORT = 8080;
const SERVER_HOST = '127.0.0.1';

/**
 * Checks if the backend HTTPS server is already listening on port 8080
 */
function isServerRunning(port: number, host: string): Promise<boolean> {
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
  const rootDir = resolve(__dirname, '../../');
  const serverPath = resolve(rootDir, 'server/public/server.js');
  let serverProcess: ChildProcess | null = null;

  console.log('[app1R] Checking if edit-mode server is running on port 8080...');
  const running = await isServerRunning(SERVER_PORT, SERVER_HOST);

  if (running) {
    console.log('[app1R] Edit-mode server is already running.');
  } else {
    console.log('[app1R] Starting backend edit-mode server (https://localhost:8080)...');
    serverProcess = spawn('node', [serverPath], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    // Brief pause to allow the server to bind to port 8080
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('[app1R] Launching live-server for app1 (ignoring segs/ for manual [R] control)...\n');
  const liveServerProcess = spawn('npx', ['live-server', './app1', '--ignore=segs,dist'], {
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
