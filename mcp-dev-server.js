import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const BASE_DIR = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(BASE_DIR, '.dev-server.log');
const PID_FILE = join(BASE_DIR, '.dev-server.pid');

let serverProcess = null;
let serverPort = 3000;
let startTime = null;

const tools = [
  {
    name: 'start_dev_server',
    description: 'Start the Hyperfy dev server with hot reload',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Port to run dev server on (default: 3000)'
        },
        cwd: {
          type: 'string',
          description: 'Working directory (default: project root)'
        }
      }
    }
  },
  {
    name: 'stop_dev_server',
    description: 'Stop the running dev server cleanly',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force kill if graceful shutdown fails (default: false)'
        }
      }
    }
  },
  {
    name: 'get_dev_logs',
    description: 'Read recent dev server logs',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'number',
          description: 'Number of lines to read (default: 50)'
        }
      }
    }
  },
  {
    name: 'dev_server_status',
    description: 'Check dev server status, port, uptime',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

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
      appendFileSync(PID_FILE, '');
      writeFileSync(PID_FILE, '');
    } catch (e) {
      // ignore
    }
  }
}

function startServer(port, cwd) {
  return new Promise((resolve) => {
    if (serverProcess) {
      resolve({
        status: 'already_running',
        pid: serverProcess.pid,
        port: serverPort,
        message: 'Dev server already running'
      });
      return;
    }

    serverPort = port || 3000;
    startTime = Date.now();
    ensureLogFile();

    logOutput(`Starting dev server on port ${serverPort}...`);

    try {
      serverProcess = spawn('node', ['scripts/dev.mjs'], {
        cwd: cwd || BASE_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: process.platform === 'win32',
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

      resolve({
        status: 'started',
        pid: serverProcess.pid,
        port: serverPort,
        logFile: LOG_FILE,
        message: 'Dev server started successfully'
      });
    } catch (error) {
      const msg = error.message;
      logOutput(`[error] Failed to start: ${msg}`);
      serverProcess = null;
      removePid();
      resolve({
        status: 'error',
        error: msg,
        message: 'Failed to start dev server'
      });
    }
  });
}

function stopServer(force) {
  return new Promise((resolve) => {
    const pid = readPid();

    if (!serverProcess && !pid) {
      resolve({
        status: 'not_running',
        message: 'Dev server is not running'
      });
      return;
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
    resolve({
      status: 'stopped',
      pid: targetPid,
      message: 'Dev server stopped'
    });
  });
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

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

async function handleToolCall(toolName, toolInput) {
  switch (toolName) {
    case 'start_dev_server':
      return await startServer(toolInput.port, toolInput.cwd);
    case 'stop_dev_server':
      return await stopServer(toolInput.force || false);
    case 'get_dev_logs':
      return getLogs(toolInput.lines || 50);
    case 'dev_server_status':
      return getStatus();
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// MCP Server implementation
const stdio = process.stdin;
let inputBuffer = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', async (chunk) => {
  inputBuffer += chunk;
  const lines = inputBuffer.split('\n');
  inputBuffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const message = JSON.parse(line);

      if (message.method === 'initialize') {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'hyperfy-dev-server',
                version: '1.0.0'
              }
            }
          }) + '\n'
        );
      } else if (message.method === 'tools/list') {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: { tools }
          }) + '\n'
        );
      } else if (message.method === 'tools/call') {
        const result = await handleToolCall(message.params.name, message.params.arguments);
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          }) + '\n'
        );
      }
    } catch (error) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message?.id || null,
          error: {
            code: -32603,
            message: error.message
          }
        }) + '\n'
      );
    }
  }
});

process.stdin.on('end', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});
