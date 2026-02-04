export class TickSystem {
  constructor(tickRate = 128) {
    this.tickRate = tickRate
    this.tickDuration = 1000 / tickRate
    this.currentTick = 0
    this.lastTickTime = 0
    this.callbacks = []
    this.running = false
  }

  onTick(callback) {
    this.callbacks.push(callback)
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTickTime = Date.now()
    this.loop()
  }

  loop() {
    if (!this.running) return
    const now = Date.now()
    const elapsed = now - this.lastTickTime
    if (elapsed >= this.tickDuration) {
      this.currentTick++
      this.lastTickTime = now
      for (const callback of this.callbacks) {
        callback(this.currentTick, this.tickDuration / 1000)
      }
    }
    setImmediate(() => this.loop())
  }

  stop() {
    this.running = false
  }

  getTick() {
    return this.currentTick
  }

  getTickDuration() {
    return this.tickDuration / 1000
  }
}
