import fs from 'fs-extra'
import path from 'path'

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
