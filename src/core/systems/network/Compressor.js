import { StructuredLogger } from '../../utils/logging/index.js'

let gzipSync, gunzipSync
let hasZlib = false

// Node.js only - module name as variable to prevent bundler from analyzing the require
if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
  try {
    // Use variable to obfuscate module name from bundler
    const moduleName = 'zli' + 'b'
    const zlib = require(moduleName)
    gzipSync = zlib.gzipSync
    gunzipSync = zlib.gunzipSync
    hasZlib = true
  } catch (e) {
    // zlib not available
  }
}

const logger = new StructuredLogger('Compressor')
const MIN_COMPRESS_SIZE = 1024

export class Compressor {
  constructor() {
    this.stats = {
      compressed: 0,
      uncompressed: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      totalUncompressedBytes: 0,
    }
  }

  compress(data) {
    if (!data) return data
    if (!hasZlib) return { compressed: false, data }

    const buffer = Buffer.from(JSON.stringify(data))
    const originalSize = buffer.length

    if (originalSize < MIN_COMPRESS_SIZE) {
      return { compressed: false, data }
    }

    try {
      const compressed = gzipSync(buffer)
      const compressedSize = compressed.length

      this.stats.compressed++
      this.stats.totalOriginalBytes += originalSize
      this.stats.totalCompressedBytes += compressedSize

      return {
        compressed: true,
        data: compressed.toString('base64'),
      }
    } catch (err) {
      logger.error('Compression failed', { size: originalSize, error: err.message })
      return { compressed: false, data }
    }
  }

  decompress(payload) {
    if (!payload || !payload.compressed) {
      this.stats.uncompressed++
      if (payload?.data && typeof Buffer !== 'undefined') {
        const size = Buffer.byteLength(JSON.stringify(payload.data))
        this.stats.totalUncompressedBytes += size
      }
      return payload?.data || payload
    }

    if (!hasZlib) {
      logger.warn('Zlib not available - cannot decompress')
      throw new Error('Decompression unavailable: zlib not loaded')
    }

    try {
      const buffer = Buffer.from(payload.data, 'base64')
      const decompressed = gunzipSync(buffer)
      const data = JSON.parse(decompressed.toString())
      return data
    } catch (err) {
      logger.error('Decompression failed', {
        error: err.message,
        type: err.code || err.name,
      })
      throw new Error(`Decompression failed: ${err.message}`)
    }
  }

  getStats() {
    const ratio = this.stats.totalCompressedBytes > 0
      ? ((1 - this.stats.totalCompressedBytes / this.stats.totalOriginalBytes) * 100).toFixed(1)
      : 0

    return {
      ...this.stats,
      ratio: `${ratio}%`,
      avgOriginal: this.stats.compressed > 0
        ? Math.round(this.stats.totalOriginalBytes / this.stats.compressed)
        : 0,
      avgCompressed: this.stats.compressed > 0
        ? Math.round(this.stats.totalCompressedBytes / this.stats.compressed)
        : 0,
    }
  }

  reset() {
    this.stats = {
      compressed: 0,
      uncompressed: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      totalUncompressedBytes: 0,
    }
  }
}
