import { exec, spawn, ChildProcess } from 'child_process';
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

function openBrowser(url: string) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;

  exec(cmd, (err) => {
    if (err) {
      console.warn(`[editor] Could not automatically open browser: ${err.message}`);
    }
  });
}

async function start() {
  const rootDir = resolve(__dirname, '../../');
  const serverPath = resolve(rootDir, 'server/public/server.js');
  let serverProcess: ChildProcess | null = null;

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
  } else {
    console.log('[editor] Starting backend server (http://localhost:3000)...');
    serverProcess = spawn('node', [serverPath], {
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
