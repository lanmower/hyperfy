import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as z from 'zod';

const BASE_DIR = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(BASE_DIR, '.dev-server.log');
const PID_FILE = join(BASE_DIR, '.dev-server.pid');

let serverProcess = null;
let serverPort = 3000;
let startTime = null;

function ensureLogFile() {
  const dir = dirname(LOG_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(LOG_FILE)) writeFileSync(LOG_FILE, '');
}

function logOutput(message) {
  ensureLogFile();
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function readPid() {
  if (existsSync(PID_FILE)) {
    try {
      return parseInt(readFileSync(PID_FILE, 'utf8').trim());
    } catch (e) {
      return null;
    }
  }
  return null;
}

function writePid(pid) {
  writeFileSync(PID_FILE, pid.toString());
}

function removePid() {
  if (existsSync(PID_FILE)) {
    try {
      writeFileSync(PID_FILE, '');
    } catch (e) {
      // ignore
    }
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

async function startServer(port, cwd) {
  if (serverProcess) {
    return {
      status: 'already_running',
      pid: serverProcess.pid,
      port: serverPort,
      message: 'Dev server already running'
    };
  }

  serverPort = port || 3000;
  startTime = Date.now();
  ensureLogFile();
  logOutput(`Starting dev server on port ${serverPort}...`);

  try {
    const scriptPath = join(cwd || BASE_DIR, 'src', 'server', 'index.js');
    logOutput(`Spawning with scriptPath: ${scriptPath}`);
    logOutput(`File exists: ${existsSync(scriptPath)}`);
    serverProcess = spawn('node', [scriptPath], {
      cwd: cwd || BASE_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: false,
      windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) logOutput(`[stdout] ${msg}`);
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) logOutput(`[stderr] ${msg}`);
    });

    serverProcess.on('error', (err) => {
      logOutput(`[error] Process error: ${err.message}`);
      serverProcess = null;
      removePid();
    });

    serverProcess.on('exit', (code, signal) => {
      logOutput(`[exit] Process exited with code ${code}, signal ${signal}`);
      serverProcess = null;
      removePid();
    });

    writePid(serverProcess.pid);
    logOutput(`Dev server started with PID ${serverProcess.pid}`);

    return {
      status: 'started',
      pid: serverProcess.pid,
      port: serverPort,
      logFile: LOG_FILE,
      message: 'Dev server started successfully'
    };
  } catch (error) {
    const msg = error.message;
    logOutput(`[error] Failed to start: ${msg}`);
    serverProcess = null;
    removePid();
    return {
      status: 'error',
      error: msg,
      message: 'Failed to start dev server'
    };
  }
}

async function stopServer(force) {
  const pid = readPid();

  if (!serverProcess && !pid) {
    return {
      status: 'not_running',
      message: 'Dev server is not running'
    };
  }

  const targetPid = serverProcess?.pid || pid;
  logOutput(`Stopping dev server (PID: ${targetPid}, force: ${force})...`);

  if (serverProcess) {
    serverProcess.removeAllListeners();

    if (force) {
      serverProcess.kill('SIGKILL');
      logOutput('Sent SIGKILL');
    } else {
      serverProcess.kill('SIGTERM');
      logOutput('Sent SIGTERM');

      const timeout = setTimeout(() => {
        if (serverProcess) {
          logOutput('SIGTERM timeout, sending SIGKILL');
          serverProcess.kill('SIGKILL');
        }
      }, 5000);

      serverProcess.on('exit', () => {
        clearTimeout(timeout);
      });
    }

    serverProcess = null;
  } else if (pid) {
    try {
      process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
      logOutput(`Killed external process ${pid}`);
    } catch (e) {
      logOutput(`[error] Failed to kill process ${pid}: ${e.message}`);
    }
  }

  removePid();
  return {
    status: 'stopped',
    pid: targetPid,
    message: 'Dev server stopped'
  };
}

function getLogs(lineCount) {
  ensureLogFile();
  lineCount = lineCount || 50;

  try {
    const content = readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim());
    const result = lines.slice(Math.max(0, lines.length - lineCount));
    return {
      status: 'ok',
      lines: result.length,
      logs: result
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function getStatus() {
  const pid = readPid();
  const running = serverProcess !== null || (pid && isProcessAlive(pid));
  const uptime = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;

  return {
    status: running ? 'running' : 'stopped',
    pid: serverProcess?.pid || pid || null,
    port: running ? serverPort : null,
    uptime: uptime,
    startTime: startTime ? new Date(startTime).toISOString() : null,
    logFile: LOG_FILE,
    pidFile: PID_FILE
  };
}

const server = new McpServer({
  name: 'hyperfy-dev-server',
  version: '1.0.0'
});

server.registerTool('start_dev_server', {
  description: 'Start the Hyperfy dev server with hot reload',
  inputSchema: {
    port: z.number().optional().describe('Port to run dev server on (default: 3000)'),
    cwd: z.string().optional().describe('Working directory (default: project root)')
  }
}, async ({ port, cwd }) => {
  const result = await startServer(port, cwd);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.registerTool('stop_dev_server', {
  description: 'Stop the running dev server cleanly',
  inputSchema: {
    force: z.boolean().optional().describe('Force kill if graceful shutdown fails (default: false)')
  }
}, async ({ force }) => {
  const result = await stopServer(force || false);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.registerTool('get_dev_logs', {
  description: 'Read recent dev server logs',
  inputSchema: {
    lines: z.number().optional().describe('Number of lines to read (default: 50)')
  }
}, async ({ lines }) => {
  const result = getLogs(lines || 50);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.registerTool('dev_server_status', {
  description: 'Check dev server status, port, uptime',
  inputSchema: {}
}, async () => {
  const result = getStatus();
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
