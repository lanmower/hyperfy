
const levels = { debug: 0, info: 1, warn: 2, error: 3, success: 4 }
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

export class Output {
  constructor(context = '', minLevel = 'debug') {
    this.context = context
    this.minLevel = levels[minLevel] ?? 1
    this.startTime = Date.now()
  }

  #format(level, msg, data) {
    if (levels[level] < this.minLevel) return
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    const ctx = this.context ? `${colors.cyan}[${this.context}]${colors.reset}` : ''
    let icon = ''
    switch (level) {
      case 'debug': icon = `${colors.dim}·${colors.reset}`; break
      case 'info': icon = `${colors.blue}ⓘ${colors.reset}`; break
      case 'warn': icon = `${colors.yellow}⚠${colors.reset}`; break
      case 'error': icon = `${colors.red}✕${colors.reset}`; break
      case 'success': icon = `${colors.green}✓${colors.reset}`; break
    }
    const timestamp = `${colors.dim}${time}${colors.reset}`
    const message = level === 'error' || level === 'warn' ? `${colors[['error', 'warn'].includes(level) ? 'red' : 'reset']}${msg}${colors.reset}` : msg
    console.log(`${timestamp} ${icon} ${ctx} ${message}${data ? ' ' + JSON.stringify(data) : ''}`)
  }

  debug(msg, data) { this.#format('debug', msg, data) }
  info(msg, data) { this.#format('info', msg, data) }
  warn(msg, data) { this.#format('warn', msg, data) }
  error(msg, data) { this.#format('error', msg, data) }
  success(msg, data) { this.#format('success', msg, data) }

  table(data) {
    console.table(data)
  }

  group(label) {
    console.group(`${colors.cyan}${label}${colors.reset}`)
  }

  groupEnd() {
    console.groupEnd()
  }

  time(label) {
    console.time(`${colors.dim}${label}${colors.reset}`)
  }

  timeEnd(label) {
    console.timeEnd(`${colors.dim}${label}${colors.reset}`)
  }

  elapsed() {
    const ms = Date.now() - this.startTime
    return `${ms}ms`
  }

  divider() {
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`)
  }

  clear() {
    console.clear()
  }
}

export const globalOutput = new Output()
