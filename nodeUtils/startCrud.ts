import { exec, spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as net from 'net';
import { resolve } from 'path';

const SERVER_PORT = 3000;
const SERVER_HOST = '127.0.0.1';

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

function probeHealth(port: number, host: string): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const req = http.get(
      {
        hostname: host,
        port: port,
        path: '/api/health',
        timeout: 1000,
      },
      (res) => {
        res.resume(); // consume response data to free up memory
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolvePromise(true);
        } else {
          resolvePromise(false);
        }
      }
    );

    req.on('error', () => {
      resolvePromise(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolvePromise(false);
    });
  });
}

async function waitForServerReady(port: number, host: string, maxWaitMs = 15000): Promise<boolean> {
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

function openBrowser(url: string) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

  exec(cmd, (err) => {
    if (err) {
      console.warn(`[crud] Could not automatically open browser: ${err.message}`);
    }
  });
}

async function start() {
  const rootDir = resolve(__dirname, '../../');
  const serverPath = resolve(rootDir, 'server/public/server.js');
  let serverProcess: ChildProcess | null = null;

  const crudUrl = `http://localhost:${SERVER_PORT}/crud`;

  console.log('[crud] Checking backend server status...');
  const running = await isServerRunning(SERVER_PORT, SERVER_HOST);

  if (running) {
    console.log('[crud] Backend server is already running on port 3000.');
    const healthy = await probeHealth(SERVER_PORT, SERVER_HOST);
    if (!healthy) {
      console.log('[crud] Waiting for database connection pool to settle...');
      await waitForServerReady(SERVER_PORT, SERVER_HOST, 6000);
    }
    console.log(`[crud] Opening Database CRUD Studio: ${crudUrl}`);
    openBrowser(crudUrl);
  } else {
    console.log('[crud] Starting backend server (http://localhost:3000)...');
    serverProcess = spawn('node', [serverPath], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    console.log('[crud] Waiting for backend server and PostgreSQL connection...');
    const ready = await waitForServerReady(SERVER_PORT, SERVER_HOST, 15000);
    if (ready) {
      console.log('[crud] Backend server & database ready.');
    } else {
      console.warn('[crud] Warning: Server /api/health timed out after 15s; opening browser anyway.');
    }

    console.log(`[crud] Opening Database CRUD Studio: ${crudUrl}`);
    openBrowser(crudUrl);
  }

  const cleanup = () => {
    if (serverProcess) {
      console.log('\n[crud] Shutting down backend server...');
      serverProcess.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start();
