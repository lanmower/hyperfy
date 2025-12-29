/* ComponentLogger: Simple logging wrapper with console-based output */
export class ComponentLogger {
  constructor(name) {
    this.name = name
  }

  info(message, data) {
    const msg = data ? `${message} ${JSON.stringify(data)}` : message
    console.log(`[${this.name}] ${msg}`)
  }

  warn(message, data) {
    const msg = data ? `${message} ${JSON.stringify(data)}` : message
    console.warn(`[${this.name}] ${msg}`)
  }

  error(message, data) {
    const msg = data ? `${message} ${JSON.stringify(data)}` : message
    console.error(`[${this.name}] ${msg}`)
  }

  debug(message, data) {
    const msg = data ? `${message} ${JSON.stringify(data)}` : message
    console.debug(`[${this.name}] ${msg}`)
  }
}
