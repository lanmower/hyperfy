import { performance } from 'perf_hooks'

const PROFILE_DURATION = 60000
const SAMPLE_INTERVAL = 5000
const MEMORY_ALERT_THRESHOLD = 500 * 1024 * 1024

class MemoryProfiler {
  constructor() {
    this.samples = []
    this.startTime = Date.now()
    this.startMemory = null
    this.peakMemory = 0
  }

  getSample() {
    if (global.gc) {
      global.gc()
    }

    const usage = process.memoryUsage()
    const sample = {
      timestamp: Date.now() - this.startTime,
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
    }

    if (!this.startMemory) {
      this.startMemory = sample
    }

    if (sample.heapUsed > this.peakMemory) {
      this.peakMemory = sample.heapUsed
    }

    return sample
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  analyze() {
    if (this.samples.length < 2) {
      return { error: 'Not enough samples' }
    }

    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const duration = (last.timestamp - first.timestamp) / 1000

    const heapGrowth = last.heapUsed - first.heapUsed
    const growthRate = heapGrowth / duration

    const leakSuspected = growthRate > 1024 * 1024

    const topConsumers = [
      { name: 'Heap Used', size: last.heapUsed },
      { name: 'External', size: last.external },
      { name: 'Array Buffers', size: last.arrayBuffers },
    ].sort((a, b) => b.size - a.size)

    return {
      duration: duration.toFixed(1) + 's',
      samples: this.samples.length,
      initial: {
        heapUsed: this.formatBytes(first.heapUsed),
        heapTotal: this.formatBytes(first.heapTotal),
        rss: this.formatBytes(first.rss),
      },
      final: {
        heapUsed: this.formatBytes(last.heapUsed),
        heapTotal: this.formatBytes(last.heapTotal),
        rss: this.formatBytes(last.rss),
      },
      peak: this.formatBytes(this.peakMemory),
      growth: {
        heap: this.formatBytes(heapGrowth),
        rate: this.formatBytes(growthRate) + '/s',
      },
      leakSuspected,
      topConsumers: topConsumers.map(c => ({
        name: c.name,
        size: this.formatBytes(c.size),
      })),
      alert: last.heapUsed > MEMORY_ALERT_THRESHOLD
        ? `Memory usage exceeds ${this.formatBytes(MEMORY_ALERT_THRESHOLD)} threshold`
        : null,
    }
  }

  printReport() {
    const analysis = this.analyze()

    console.log('\n=== MEMORY PROFILE REPORT ===\n')
    console.log('Duration:', analysis.duration)
    console.log('Samples:', analysis.samples)
    console.log('')

    console.log('Initial Memory:')
    console.log('  Heap Used:', analysis.initial.heapUsed)
    console.log('  Heap Total:', analysis.initial.heapTotal)
    console.log('  RSS:', analysis.initial.rss)
    console.log('')

    console.log('Final Memory:')
    console.log('  Heap Used:', analysis.final.heapUsed)
    console.log('  Heap Total:', analysis.final.heapTotal)
    console.log('  RSS:', analysis.final.rss)
    console.log('')

    console.log('Peak Heap Used:', analysis.peak)
    console.log('')

    console.log('Memory Growth:')
    console.log('  Total:', analysis.growth.heap)
    console.log('  Rate:', analysis.growth.rate)
    console.log('')

    console.log('Top Memory Consumers:')
    analysis.topConsumers.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name}: ${c.size}`)
    })
    console.log('')

    if (analysis.leakSuspected) {
      console.log('WARNING: Potential memory leak detected!')
      console.log('  - Heap is growing at', analysis.growth.rate)
      console.log('  - Review object retention and cleanup')
      console.log('')
    }

    if (analysis.alert) {
      console.log('ALERT:', analysis.alert)
      console.log('')
    }

    return analysis
  }

  async run(duration = PROFILE_DURATION, interval = SAMPLE_INTERVAL) {
    console.log('Starting memory profiler...')
    console.log('Duration:', duration / 1000, 'seconds')
    console.log('Sample interval:', interval / 1000, 'seconds')
    console.log('Run with --expose-gc flag for accurate measurements')
    console.log('')

    const sampleCount = Math.ceil(duration / interval)

    for (let i = 0; i < sampleCount; i++) {
      const sample = this.getSample()
      this.samples.push(sample)

      process.stdout.write(`\rSampling... ${i + 1}/${sampleCount} (${this.formatBytes(sample.heapUsed)})`)

      if (i < sampleCount - 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    }

    console.log('\n')
    return this.printReport()
  }
}

const profiler = new MemoryProfiler()

const duration = parseInt(process.argv[2]) || PROFILE_DURATION
const interval = parseInt(process.argv[3]) || SAMPLE_INTERVAL

profiler.run(duration, interval).then(() => {
  process.exit(0)
}).catch(err => {
  console.error('Profiler error:', err)
  process.exit(1)
})
