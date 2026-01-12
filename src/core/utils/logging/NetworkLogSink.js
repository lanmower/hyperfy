export class NetworkLogSink {
  constructor(network) {
    this.network = network
    this.queue = []
    this.isFlushing = false
  }

  write(logEntry) {
    this.queue.push(logEntry)
    if (this.queue.length >= 10) {
      this.flush()
    }
  }

  flush() {
    if (this.isFlushing || !this.network?.send || this.queue.length === 0) return

    this.isFlushing = true
    const batch = this.queue.splice(0, 50)

    try {
      this.network.send('clientLogs', { logs: batch })
    } catch (err) {
      console.error('Failed to send client logs to server', err.message)
      this.queue.unshift(...batch)
    }

    this.isFlushing = false
  }

  destroy() {
    this.flush()
    this.queue = []
  }
}
