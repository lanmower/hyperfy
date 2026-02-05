export class RecordingEngine {
  constructor(windowSize = 60) {
    this.windowSize = windowSize
    this.buffer = []
    this.events = []
    this.startTime = Date.now()
  }

  recordSnapshot(tick, snapshot) {
    const frame = {
      tick,
      timestamp: Date.now() - this.startTime,
      snapshot: JSON.parse(JSON.stringify(snapshot))
    }

    this.buffer.push(frame)

    if (this.buffer.length * (1/128) > this.windowSize) {
      this.buffer.shift()
    }
  }

  recordEvent(type, data) {
    this.events.push({
      type,
      timestamp: Date.now() - this.startTime,
      data
    })

    if (this.events.length > 10000) {
      this.events.shift()
    }
  }

  getReplay(startTick, endTick) {
    const frames = this.buffer.filter(f => f.tick >= startTick && f.tick <= endTick)
    const events = this.events.filter(e => e.timestamp >= (startTick / 128 * 1000) && e.timestamp <= (endTick / 128 * 1000))

    return {
      startTick,
      endTick,
      duration: (endTick - startTick) / 128,
      frames: frames.length,
      events: events.length,
      data: { frames, events }
    }
  }

  serialize() {
    return JSON.stringify({
      recordedAt: new Date().toISOString(),
      duration: this.buffer.length / 128,
      frames: this.buffer.length,
      events: this.events.length,
      data: { buffer: this.buffer, events: this.events }
    })
  }

  static deserialize(json) {
    const parsed = JSON.parse(json)
    const engine = new RecordingEngine()
    engine.buffer = parsed.data.buffer
    engine.events = parsed.data.events
    return engine
  }
}
