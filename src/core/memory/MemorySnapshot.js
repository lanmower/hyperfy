import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('MemorySnapshot')

export class MemorySnapshot {
  constructor(label = null) {
    this.label = label || `snapshot-${Date.now()}`
    this.timestamp = Date.now()
    this.heapData = this.captureHeap()
    this.objectCounts = this.countObjects()
    this.checksum = this.calculateChecksum()
  }

  captureHeap() {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return null
    }

    try {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0,
      }
    } catch (error) {
      logger.warn('Failed to capture heap data', { error: error.message })
      return null
    }
  }

  countObjects() {
    const counts = {
      Map: 0,
      Set: 0,
      Array: 0,
      Object: 0,
      Function: 0,
      String: 0,
      Number: 0,
      Boolean: 0,
      Date: 0,
      RegExp: 0,
      Error: 0,
      WeakMap: 0,
      WeakSet: 0,
      WeakRef: 0,
      FinalizationRegistry: 0,
      Symbol: 0,
      BigInt: 0,
      Proxy: 0,
    }

    try {
      if (typeof globalThis !== 'undefined') {
        this.traverseObject(globalThis, counts, new WeakSet(), 0, 100)
      }
    } catch (error) {
      logger.warn('Failed to count objects', { error: error.message })
    }

    return counts
  }

  traverseObject(obj, counts, visited, depth, maxDepth) {
    if (depth > maxDepth || visited.has(obj)) return

    try {
      visited.add(obj)

      const type = obj.constructor.name
      if (type in counts) {
        counts[type]++
      }

      if (typeof obj === 'object' && obj !== null && depth < maxDepth) {
        for (const key in obj) {
          try {
            const value = obj[key]
            if (typeof value === 'object' && value !== null) {
              this.traverseObject(value, counts, visited, depth + 1, maxDepth)
            }
          } catch {
          }
        }
      }
    } catch {
    }
  }

  calculateChecksum() {
    const data = JSON.stringify({
      heapData: this.heapData,
      objectCounts: this.objectCounts,
      timestamp: this.timestamp,
    })

    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }

    return Math.abs(hash).toString(16)
  }

  getHeapUsagePercent() {
    if (!this.heapData) return null
    return (this.heapData.heapUsed / this.heapData.heapTotal) * 100
  }

  getObjectCountSum() {
    return Object.values(this.objectCounts).reduce((a, b) => a + b, 0)
  }

  getMetadata() {
    return {
      label: this.label,
      timestamp: this.timestamp,
      heapUsagePercent: this.getHeapUsagePercent(),
      totalObjects: this.getObjectCountSum(),
      checksum: this.checksum,
    }
  }

  export() {
    return {
      label: this.label,
      timestamp: this.timestamp,
      heapData: this.heapData,
      objectCounts: this.objectCounts,
      checksum: this.checksum,
      metadata: this.getMetadata(),
    }
  }

  static import(data) {
    const snapshot = Object.create(MemorySnapshot.prototype)
    snapshot.label = data.label
    snapshot.timestamp = data.timestamp
    snapshot.heapData = data.heapData
    snapshot.objectCounts = data.objectCounts
    snapshot.checksum = data.checksum
    return snapshot
  }
}
