import fs from 'fs-extra'
import path from 'path'
import { StructuredLogger } from './StructuredLogger.js'

export class ServerLogger {
  constructor(options = {}) {
    this.name = options.name || 'App'
    this.level = options.level || 'INFO'
    this.logsDir = options.logsDir || path.join(process.cwd(), 'logs')
    this.logger = new StructuredLogger(this.name, {
      minLevel: this.level,
      includeTimestamp: true,
    })
    this.sinks = []
    this.fileSink = null
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
    this.logger.setMetadata('requestId', id)
    return this
  }

  setUserId(id) {
    this.logger.setMetadata('userId', id)
    return this
  }

  setModule(name) {
    this.logger.setMetadata('module', name)
    return this
  }

  debug(message, data = {}) {
    this.logger.debug(message, data)
    this._writeSinks({ level: 'DEBUG', message, data })
  }

  info(message, data = {}) {
    this.logger.info(message, data)
    this._writeSinks({ level: 'INFO', message, data })
  }

  warn(message, data = {}) {
    this.logger.warn(message, data)
    this._writeSinks({ level: 'WARN', message, data })
  }

  error(message, data = {}) {
    this.logger.error(message, data)
    this._writeSinks({ level: 'ERROR', message, data })
  }

  critical(message, data = {}) {
    this.logger.fatal(message, data)
    this._writeSinks({ level: 'CRITICAL', message, data })
  }

  _writeSinks(entry) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      logger: this.name,
      data: Object.keys(entry.data).length > 0 ? entry.data : undefined,
    }

    for (const sink of this.sinks) {
      try {
        sink.write(logEntry)
      } catch (err) {
        process.stderr.write(`[ServerLogger] Sink error: ${err.message}\n`)
      }
    }
  }

  async rotate() {
    if (!this.fileSink) return
    await this.fileSink.rotate()
  }

  toString() {
    return `ServerLogger(${this.name})`
  }
}

export class ConsoleSink {
  write(entry) {
    const level = entry.level.padEnd(8)
    const timestamp = entry.timestamp.slice(11, 19)
    const message = entry.data ? `${entry.message} ${JSON.stringify(entry.data)}` : entry.message
    const stream = entry.level === 'ERROR' || entry.level === 'CRITICAL' ? process.stderr : process.stdout
    stream.write(`[${timestamp}] ${level} ${message}\n`)
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

  async rotate() {
    if (!fs.existsSync(this.logFile)) return
    const stats = fs.statSync(this.logFile)
    if (stats.size < 10 * 1024 * 1024) return

    const timestamp = new Date().toISOString().split('T')[0]
    const rotatedFile = path.join(this.logsDir, `${this.name}.${timestamp}.log`)
    await fs.move(this.logFile, rotatedFile)
  }
}
