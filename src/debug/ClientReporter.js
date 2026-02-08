export class ClientReporter {
  constructor(sendFn) {
    this.send = sendFn
    this.timer = null
    this.reporting = false
  }

  reportState(state) {
  }

  start() {
    this.reporting = true
  }

  stop() {
    this.reporting = false
    if (this.timer) clearInterval(this.timer)
  }

  getStats() {
    return { reporting: this.reporting }
  }
}
