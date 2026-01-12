export class UploadStats {
  constructor() {
    this.total = 0
    this.successful = 0
    this.failed = 0
    this.skipped = 0
    this.totalBytes = 0
    this.deduplicatedBytes = 0
    this.startTime = Date.now()
  }

  incrementTotal() {
    this.total++
  }

  incrementSuccessful() {
    this.successful++
  }

  incrementFailed() {
    this.failed++
  }

  incrementSkipped() {
    this.skipped++
  }

  addTotalBytes(bytes) {
    this.totalBytes += bytes
  }

  addDeduplicatedBytes(bytes) {
    this.deduplicatedBytes += bytes
  }

  getStats() {
    const elapsed = Date.now() - this.startTime
    const elapsedSec = elapsed / 1000

    return {
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      skipped: this.skipped,
      totalBytes: this.totalBytes,
      deduplicatedBytes: this.deduplicatedBytes,
      uploadRate: elapsedSec > 0 ? Math.round(this.totalBytes / elapsedSec) : 0,
      deduplicationRatio: this.total > 0 ? (this.skipped / this.total * 100).toFixed(2) : 0,
      elapsed,
      averageTime: this.successful > 0 ? Math.round(elapsed / this.successful) : 0
    }
  }

  reset() {
    this.total = 0
    this.successful = 0
    this.failed = 0
    this.skipped = 0
    this.totalBytes = 0
    this.deduplicatedBytes = 0
    this.startTime = Date.now()
  }
}
