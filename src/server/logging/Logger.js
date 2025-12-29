import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4 }
const LOG_LEVEL_NAMES = Object.keys(LOG_LEVELS)

export class Logger {
  constructor(options = {}) {
    this.name = options.name || 'App'
    this.level = LOG_LEVELS[options.level || 'INFO']
    this.logsDir = options.logsDir || path.join(__dirname, '../../..', 'logs')
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024
    this.maxLogFiles = options.maxLogFiles || 7
    this.requestId = null
    this.userId = null
    this.module = null
    this.sinks = []
    this.messageBuffer = []
    this.bufferFlushTimer = null
    this.initialized = false
  }

  addSink(sink) {
    if (!sink || typeof sink.write !== 'function') {
      throw new Error('Sink must have a write() method')
    }
    this.sinks.push(sink)
    return this
  }

  async init() {
    if (this.initialized) return
    await fs.ensureDir(this.logsDir)
    this.initialized = true
  }

  setRequestId(id) {
    this.requestId = id
    return this
  }

  setUserId(id) {
    this.userId = id
    return this
  }

  setModule(name) {
    this.module = name
    return this
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data)
  }

  info(message, data = {}) {
    this.log('INFO', message, data)
  }

  warn(message, data = {}) {
    this.log('WARN', message, data)
  }

  error(message, data = {}) {
    this.log('ERROR', message, data)
  }

  critical(message, data = {}) {
    this.log('CRITICAL', message, data)
  }

  log(levelName, message, data = {}) {
    const level = LOG_LEVELS[levelName] || LOG_LEVELS.INFO
    if (level < this.level) return

    const entry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      logger: this.name,
      module: this.module,
      requestId: this.requestId,
      userId: this.userId,
      data: Object.keys(data).length > 0 ? data : undefined,
    }

    this.messageBuffer.push(entry)

    if (this.messageBuffer.length >= 10 || levelName === 'CRITICAL' || levelName === 'ERROR') {
      this.flush()
    }
  }

  flush() {
    if (this.messageBuffer.length === 0) return

    for (const sink of this.sinks) {
      for (const entry of this.messageBuffer) {
        try {
          sink.write(entry)
        } catch (err) {
          process.stderr.write(`[Logger] Sink error: ${err.message}\n`)
        }
      }
    }

    this.messageBuffer = []
  }

  async rotate() {
    const logFile = path.join(this.logsDir, `${this.name}.log`)
    if (!fs.existsSync(logFile)) return

    const stats = await fs.stat(logFile)
    if (stats.size < this.maxLogSize) return

    const timestamp = new Date().toISOString().split('T')[0]
    const rotatedFile = path.join(this.logsDir, `${this.name}.${timestamp}.log`)
    await fs.move(logFile, rotatedFile)

    const files = await fs.readdir(this.logsDir)
    const logFiles = files
      .filter(f => f.startsWith(this.name) && f.endsWith('.log'))
      .sort()
      .reverse()

    for (let i = this.maxLogFiles; i < logFiles.length; i++) {
      await fs.remove(path.join(this.logsDir, logFiles[i]))
    }
  }

  toString() {
    return `Logger(${this.name})`
  }
}

export class ConsoleSink {
  write(entry) {
    const level = entry.level.padEnd(8)
    const timestamp = entry.timestamp.slice(11, 19)
    const message = entry.data ? `${entry.message} ${JSON.stringify(entry.data)}` : entry.message
    const output = `[${timestamp}] ${level} ${entry.message}`
    const stream = entry.level === 'ERROR' || entry.level === 'CRITICAL' ? process.stderr : process.stdout
    stream.write(output + '\n')
  }
}

export class FileSink {
  constructor(logsDir, name) {
    this.logsDir = logsDir
    this.name = name
    this.logFile = path.join(logsDir, `${name}.log`)
  }

  write(entry) {
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(this.logFile, line)
  }
}

