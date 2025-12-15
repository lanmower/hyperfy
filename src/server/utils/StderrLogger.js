// Centralized stderr logging with formatting and rate limiting
import util from 'util'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
}

const SEVERITY_SYMBOLS = {
  ERROR: '🔴',
  WARN: '⚠️ ',
  INFO: 'ℹ️ ',
  DEBUG: '🔍'
}

export class StderrLogger {
  constructor() {
    this.isTTY = process.stderr.isTTY
    this.rateLimits = new Map()
    this.groupStack = []
    this.buffer = []
    this.flushTimer = null
  }

  error(message, context = {}) {
    this.log('ERROR', message, context)
  }

  warn(message, context = {}) {
    this.log('WARN', message, context)
  }

  info(message, context = {}) {
    this.log('INFO', message, context)
  }

  debug(message, context = {}) {
    this.log('DEBUG', message, context)
  }

  log(severity, message, context = {}) {
    if (this.shouldRateLimit(severity, message)) {
      return
    }

    const formatted = this.formatMessage(severity, message, context)
    this.write(formatted)
  }

  formatMessage(severity, message, context = {}) {
    const timestamp = this.formatTimestamp(new Date())
    const level = this.formatSeverity(severity)
    const contextStr = this.formatContext(context)

    let output = `${timestamp} ${level}`

    if (contextStr) {
      output += ` ${contextStr}`
    }

    output += `\n  ${message}\n`

    return output
  }

  formatTimestamp(date) {
    const iso = date.toISOString()
    return this.colorize(`[${iso}]`, 'gray')
  }

  formatSeverity(level) {
    const symbol = SEVERITY_SYMBOLS[level] || ''
    const text = level.padEnd(5)

    let color = 'white'
    if (level === 'ERROR') color = 'red'
    else if (level === 'WARN') color = 'yellow'
    else if (level === 'INFO') color = 'blue'
    else if (level === 'DEBUG') color = 'cyan'

    return symbol + this.colorize(text, color)
  }

  formatContext(context) {
    const parts = []

    if (context.app) {
      parts.push(this.colorize(`[app:${context.app}]`, 'cyan'))
    }
    if (context.client) {
      parts.push(this.colorize(`[client:${context.client}]`, 'blue'))
    }
    if (context.user) {
      parts.push(this.colorize(`[user:${context.user}]`, 'blue'))
    }

    return parts.join(' ')
  }

  group(title) {
    const formatted = this.colorize(`\n┌─ ${title}`, 'bright')
    this.write(formatted + '\n')
    this.groupStack.push(title)
  }

  groupEnd() {
    if (this.groupStack.length > 0) {
      this.groupStack.pop()
      const formatted = this.colorize('└─────────────────────────────────────────────\n', 'dim')
      this.write(formatted)
    }
  }

  table(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return
    }

    const keys = Object.keys(data[0])
    const colWidths = keys.map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
      return Math.min(maxLen, 50)
    })

    const header = keys.map((key, i) => key.padEnd(colWidths[i])).join(' | ')
    const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─')

    this.write('  ' + header + '\n')
    this.write('  ' + separator + '\n')

    data.forEach(row => {
      const line = keys.map((key, i) => {
        const val = String(row[key] || '')
        return val.length > colWidths[i]
          ? val.substring(0, colWidths[i] - 3) + '...'
          : val.padEnd(colWidths[i])
      }).join(' | ')
      this.write('  ' + line + '\n')
    })

    this.write('\n')
  }

  separator() {
    const line = '─'.repeat(80)
    this.write(this.colorize(line, 'dim') + '\n')
  }

  shouldRateLimit(severity, message) {
    const key = `${severity}:${message}`
    const now = Date.now()
    const limit = severity === 'ERROR' ? 1000 : 5000

    const last = this.rateLimits.get(key)
    if (last && now - last < limit) {
      return true
    }

    this.rateLimits.set(key, now)

    if (this.rateLimits.size > 1000) {
      const cutoff = now - 60000
      for (const [k, v] of this.rateLimits.entries()) {
        if (v < cutoff) {
          this.rateLimits.delete(k)
        }
      }
    }

    return false
  }

  colorize(text, color) {
    if (!this.isTTY || !COLORS[color]) {
      return text
    }
    return COLORS[color] + text + COLORS.reset
  }

  write(message) {
    process.stderr.write(message)
  }

  flush() {
    if (this.buffer.length > 0) {
      const messages = this.buffer.join('')
      this.buffer = []
      process.stderr.write(messages)
    }
  }

  clearRateLimits() {
    this.rateLimits.clear()
  }
}

export const stderrLogger = new StderrLogger()
