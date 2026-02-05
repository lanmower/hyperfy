export class BandwidthMonitor {
  constructor(tickRate = 128) {
    this.tickRate = tickRate
    this.samplesPerSecond = tickRate
    this.samples = []
    this.currentBytes = 0
    this.tick = 0
  }

  recordSnapshot(snapshot) {
    const encoded = JSON.stringify(snapshot)
    this.currentBytes += encoded.length
    this.tick++

    if (this.tick % this.samplesPerSecond === 0) {
      this.samples.push({
        timestamp: Date.now(),
        bytesPerSecond: this.currentBytes,
        bytesPerPlayer: this.currentBytes / 10,
        quantizationLoss: this.estimateQuantizationLoss(snapshot)
      })

      if (this.samples.length > 60) {
        this.samples.shift()
      }

      this.currentBytes = 0
    }
  }

  estimateQuantizationLoss(snapshot) {
    let loss = 0
    if (!snapshot || !snapshot[2]) return 0
    for (const player of snapshot[2]) {
      if (player && player.length >= 3) {
        loss += (Math.round(player[0] * 100) / 100 - player[0]) ** 2
        loss += (Math.round(player[1] * 100) / 100 - player[1]) ** 2
        loss += (Math.round(player[2] * 100) / 100 - player[2]) ** 2
      }
    }
    return loss.toFixed(6)
  }

  getStats() {
    if (this.samples.length === 0) return { avg: 0, peak: 0, samples: 0 }
    const bytesPerSec = this.samples.map(s => s.bytesPerSecond)
    const avg = bytesPerSec.reduce((a, b) => a + b, 0) / bytesPerSec.length
    const peak = Math.max(...bytesPerSec)
    return {
      avgBytesPerSec: avg.toFixed(0),
      peakBytesPerSec: peak,
      avgBytesPerPlayer: (avg / 10).toFixed(0),
      withinBudget: avg < 80000,
      samples: this.samples.length
    }
  }
}
