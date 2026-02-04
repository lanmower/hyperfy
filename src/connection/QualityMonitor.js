import { CONNECTION_QUALITY } from '../protocol/MessageTypes.js'

export class QualityMonitor {
  constructor(config = {}) {
    this.windowSize = config.windowSize || 20
    this.rttSamples = []
    this.lastRtt = 0
    this.bytesIn = 0
    this.bytesOut = 0
    this.lastBandwidthCheck = Date.now()
    this.bandwidthIn = 0
    this.bandwidthOut = 0
    this.packetLoss = 0
    this.heartbeatsSent = 0
    this.heartbeatsReceived = 0
  }

  recordRtt(rtt) {
    this.lastRtt = rtt
    this.rttSamples.push(rtt)
    if (this.rttSamples.length > this.windowSize) this.rttSamples.shift()
  }

  recordHeartbeatSent() {
    this.heartbeatsSent++
  }

  recordHeartbeatReceived() {
    this.heartbeatsReceived++
  }

  recordBytesIn(bytes) {
    this.bytesIn += bytes
  }

  recordBytesOut(bytes) {
    this.bytesOut += bytes
  }

  getRtt() {
    if (this.rttSamples.length === 0) return 0
    const sum = this.rttSamples.reduce((a, b) => a + b, 0)
    return sum / this.rttSamples.length
  }

  getJitter() {
    if (this.rttSamples.length < 2) return 0
    const avg = this.getRtt()
    const variance = this.rttSamples.reduce((sum, s) => sum + (s - avg) ** 2, 0) / this.rttSamples.length
    return Math.sqrt(variance)
  }

  getPacketLoss() {
    if (this.heartbeatsSent === 0) return 0
    const lost = this.heartbeatsSent - this.heartbeatsReceived
    return Math.max(0, lost / this.heartbeatsSent)
  }

  getBandwidth() {
    const now = Date.now()
    const elapsed = (now - this.lastBandwidthCheck) / 1000
    if (elapsed >= 1) {
      this.bandwidthIn = this.bytesIn / elapsed
      this.bandwidthOut = this.bytesOut / elapsed
      this.bytesIn = 0
      this.bytesOut = 0
      this.lastBandwidthCheck = now
    }
    return { in: this.bandwidthIn, out: this.bandwidthOut }
  }

  getQuality() {
    const rtt = this.getRtt()
    const jitter = this.getJitter()
    const loss = this.getPacketLoss()
    if (rtt < 50 && jitter < 10 && loss < 0.01) return CONNECTION_QUALITY.EXCELLENT
    if (rtt < 100 && jitter < 30 && loss < 0.05) return CONNECTION_QUALITY.GOOD
    if (rtt < 200 && jitter < 50 && loss < 0.1) return CONNECTION_QUALITY.POOR
    return CONNECTION_QUALITY.CRITICAL
  }

  getAdaptiveTickRate(baseTick) {
    const quality = this.getQuality()
    if (quality === CONNECTION_QUALITY.EXCELLENT) return baseTick
    if (quality === CONNECTION_QUALITY.GOOD) return Math.max(20, baseTick * 0.75)
    if (quality === CONNECTION_QUALITY.POOR) return Math.max(10, baseTick * 0.5)
    return Math.max(5, baseTick * 0.25)
  }

  getStats() {
    const bw = this.getBandwidth()
    return {
      rtt: Math.round(this.getRtt()),
      jitter: Math.round(this.getJitter()),
      packetLoss: this.getPacketLoss(),
      bandwidthIn: Math.round(bw.in),
      bandwidthOut: Math.round(bw.out),
      quality: this.getQuality(),
      lastRtt: this.lastRtt
    }
  }

  reset() {
    this.rttSamples = []
    this.lastRtt = 0
    this.bytesIn = 0
    this.bytesOut = 0
    this.heartbeatsSent = 0
    this.heartbeatsReceived = 0
  }
}
