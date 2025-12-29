export class ConsoleCapture {
  constructor(maxLogs = 500) {
    this.maxLogs = maxLogs
    this.logs = {
      errors: [],
      warnings: [],
      info: [],
    }
    this.originalLog = console.log
    this.originalWarn = console.warn
    this.originalError = console.error
    this.hooked = false
  }

  enable() {
    if (this.hooked) return

    const self = this
    const pushLog = (arr, item) => {
      arr.push(item)
      if (arr.length > self.maxLogs) arr.shift()
    }

    console.log = function (...args) {
      pushLog(self.logs.info, { time: new Date(), args })
      return self.originalLog.apply(console, args)
    }

    console.warn = function (...args) {
      pushLog(self.logs.warnings, { time: new Date(), args })
      return self.originalWarn.apply(console, args)
    }

    console.error = function (...args) {
      pushLog(self.logs.errors, { time: new Date(), args })
      return self.originalError.apply(console, args)
    }

    this.hooked = true
  }

  disable() {
    if (!this.hooked) return

    console.log = this.originalLog
    console.warn = this.originalWarn
    console.error = this.originalError

    this.hooked = false
  }

  clear() {
    this.logs.errors.length = 0
    this.logs.warnings.length = 0
    this.logs.info.length = 0
  }

  getLogs() {
    return this.logs
  }

  getErrors() {
    return this.logs.errors
  }

  getWarnings() {
    return this.logs.warnings
  }

  getInfo() {
    return this.logs.info
  }
}
