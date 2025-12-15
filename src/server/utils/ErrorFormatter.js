// Format errors for stderr with proper structure
import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
}

const SEVERITY_COLORS = {
  [ErrorLevels.ERROR]: 'red',
  [ErrorLevels.WARN]: 'yellow',
  [ErrorLevels.INFO]: 'blue',
  [ErrorLevels.DEBUG]: 'cyan'
}

const SEVERITY_SYMBOLS = {
  [ErrorLevels.ERROR]: '🔴',
  [ErrorLevels.WARN]: '⚠️ ',
  [ErrorLevels.INFO]: 'ℹ️ ',
  [ErrorLevels.DEBUG]: '🔍'
}

export class ErrorFormatter {
  constructor(options = {}) {
    this.isTTY = process.stderr.isTTY
    this.includeStackTraces = options.includeStackTraces !== false
    this.maxStackLines = options.maxStackLines || 10
    this.timezone = options.timezone || 'UTC'
  }

  formatForStderr(error, context = {}) {
    const timestamp = this.formatTimestamp(error.timestamp || Date.now())
    const severity = this.formatSeverity(error.level || ErrorLevels.ERROR)
    const contextStr = this.formatContext(context)

    let output = `${timestamp} ${severity}`

    if (contextStr) {
      output += ` ${contextStr}\n`
    } else {
      output += '\n'
    }

    output += `  Category: ${this.colorize(error.category || 'unknown', 'cyan')}\n`
    output += `  Message: ${error.message}\n`

    if (context.userId || context.entityId || context.timestamp) {
      const ctxParts = []
      if (context.userId) ctxParts.push(`userId=${context.userId}`)
      if (context.entityId) ctxParts.push(`entityId=${context.entityId}`)
      if (error.count && error.count > 1) ctxParts.push(`count=${error.count}`)

      if (ctxParts.length > 0) {
        output += `  Context: ${ctxParts.join(', ')}\n`
      }
    }

    if (this.includeStackTraces && error.stack) {
      output += this.formatStack(error.stack)
    }

    output += this.colorize('  ────────────────────────────────────────────────────────────\n', 'dim')

    return output
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    const iso = date.toISOString()
    return this.colorize(`[${iso}]`, 'gray')
  }

  formatSeverity(level) {
    const symbol = SEVERITY_SYMBOLS[level] || ''
    const text = level.toUpperCase().padEnd(5)
    const color = SEVERITY_COLORS[level] || 'white'

    return symbol + this.colorize(text, color)
  }

  formatContext(context) {
    const parts = []

    if (context.app) {
      parts.push(this.colorize(`[app:${context.app}]`, 'cyan'))
    }

    if (context.clientId) {
      let clientStr = context.clientId
      if (context.clientIP) {
        clientStr += `@${context.clientIP}`
      }
      parts.push(this.colorize(`[client:${clientStr}]`, 'blue'))
    }

    if (context.userName) {
      let userStr = context.userName
      if (context.userId) {
        userStr += `#${context.userId.substring(0, 6)}`
      }
      parts.push(this.colorize(`[user:${userStr}]`, 'magenta'))
    }

    return parts.join(' ')
  }

  formatStack(stack) {
    if (!stack) return ''

    const lines = stack.split('\n')
    const relevantLines = lines
      .slice(0, this.maxStackLines)
      .filter(line => line.trim())
      .map(line => {
        line = line.trim()
        if (line.startsWith('at ')) {
          return this.colorize('    ' + line, 'dim')
        }
        return this.colorize('  ' + line, 'dim')
      })

    if (relevantLines.length === 0) return ''

    let output = '  Stack:\n'
    output += relevantLines.join('\n') + '\n'

    if (lines.length > this.maxStackLines) {
      output += this.colorize(`    ... (${lines.length - this.maxStackLines} more lines)\n`, 'dim')
    }

    return output
  }

  formatErrorSummary(stats) {
    const parts = []

    if (stats.errors > 0) {
      parts.push(`${stats.errors} error${stats.errors !== 1 ? 's' : ''}`)
    }

    if (stats.warnings > 0) {
      parts.push(`${stats.warnings} warning${stats.warnings !== 1 ? 's' : ''}`)
    }

    if (stats.critical > 0) {
      parts.push(this.colorize(`${stats.critical} CRITICAL`, 'red'))
    }

    if (parts.length === 0) {
      return 'No errors'
    }

    let output = '\nSUMMARY: '
    output += parts.join(', ')
    output += '\n'

    if (stats.byCategory) {
      const categories = Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      if (categories.length > 0) {
        output += '  By category:\n'
        categories.forEach(([cat, count]) => {
          output += `    • ${cat}: ${count}\n`
        })
      }
    }

    return output
  }

  formatAlert(message, level = 'ERROR') {
    const symbol = level === 'CRITICAL' ? '🚨' : '⚠️'
    const color = level === 'CRITICAL' ? 'red' : 'yellow'

    let output = '\n'
    output += this.colorize('━'.repeat(80), color) + '\n'
    output += this.colorize(`${symbol} ${level} ALERT: ${message}`, color) + '\n'
    output += this.colorize('━'.repeat(80), color) + '\n'

    return output
  }

  colorize(text, color) {
    if (!this.isTTY || !COLORS[color]) {
      return text
    }
    return COLORS[color] + text + COLORS.reset
  }
}

export const errorFormatter = new ErrorFormatter()
