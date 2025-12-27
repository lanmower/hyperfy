export class PerformanceMetrics {
  constructor() {
    this.frameTime = { samples: [], sum: 0, min: Infinity, max: 0, avg: 0 }
    this.memory = { initial: 0, current: 0, peak: 0, gcCount: 0 }
    this.entities = { spawn: [], despawn: [] }
    this.network = { messageCount: {}, latencies: [], throughput: 0 }
    this.physics = { simTime: [], stepCount: 0 }
    this.scripts = { execTime: {}, errorCount: 0, warningCount: 0 }
    this.raycast = { count: 0, totalTime: 0, avgTime: 0 }
    this.rendering = { drawCalls: 0, triangles: 0, textures: 0, updateTime: [] }
    this.maxSamples = 100
    this.startTime = performance.now()
    this.initMemory()
  }

  initMemory() {
    if (performance.memory) {
      this.memory.initial = performance.memory.usedJSHeapSize / 1024 / 1024
      this.memory.current = this.memory.initial
      this.memory.peak = this.memory.initial
    }
  }

  recordFrameTime(ms) {
    if (this.frameTime.samples.length >= this.maxSamples) {
      const oldest = this.frameTime.samples.shift()
      this.frameTime.sum -= oldest
    }
    this.frameTime.samples.push(ms)
    this.frameTime.sum += ms
    this.frameTime.min = Math.min(this.frameTime.min, ms)
    this.frameTime.max = Math.max(this.frameTime.max, ms)
    this.frameTime.avg = this.frameTime.sum / this.frameTime.samples.length
  }

  recordMemory() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1024 / 1024
      this.memory.current = used
      this.memory.peak = Math.max(this.memory.peak, used)
    }
  }

  recordEntitySpawn(ms) {
    if (this.entities.spawn.length >= this.maxSamples) this.entities.spawn.shift()
    this.entities.spawn.push(ms)
  }

  recordEntityDespawn(ms) {
    if (this.entities.despawn.length >= this.maxSamples) this.entities.despawn.shift()
    this.entities.despawn.push(ms)
  }

  recordNetworkMessage(type, size = 0) {
    if (!this.network.messageCount[type]) {
      this.network.messageCount[type] = 0
    }
    this.network.messageCount[type]++
    this.network.throughput += size
  }

  recordNetworkLatency(ms) {
    if (this.network.latencies.length >= this.maxSamples) {
      this.network.latencies.shift()
    }
    this.network.latencies.push(ms)
  }

  recordPhysicsSimulation(ms) {
    if (this.physics.simTime.length >= this.maxSamples) {
      this.physics.simTime.shift()
    }
    this.physics.simTime.push(ms)
    this.physics.stepCount++
  }

  recordScriptExecution(scriptName, ms) {
    if (!this.scripts.execTime[scriptName]) {
      this.scripts.execTime[scriptName] = { times: [], total: 0, count: 0 }
    }
    const entry = this.scripts.execTime[scriptName]
    if (entry.times.length >= this.maxSamples) {
      entry.total -= entry.times.shift()
    }
    entry.times.push(ms)
    entry.total += ms
    entry.count++
  }

  recordRaycast(ms) {
    this.raycast.count++
    this.raycast.totalTime += ms
    this.raycast.avgTime = this.raycast.totalTime / this.raycast.count
  }

  recordRenderingUpdate(ms, stats = {}) {
    if (this.rendering.updateTime.length >= this.maxSamples) {
      this.rendering.updateTime.shift()
    }
    this.rendering.updateTime.push(ms)
    if (stats.drawCalls !== undefined) this.rendering.drawCalls = stats.drawCalls
    if (stats.triangles !== undefined) this.rendering.triangles = stats.triangles
    if (stats.textures !== undefined) this.rendering.textures = stats.textures
  }

  recordScriptError() {
    this.scripts.errorCount++
  }

  recordScriptWarning() {
    this.scripts.warningCount++
  }

  getSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      uptime: performance.now() - this.startTime,
      frameTime: {
        min: this.frameTime.min,
        max: this.frameTime.max,
        avg: this.frameTime.avg,
        samples: this.frameTime.samples.length,
      },
      memory: {
        initial: this.memory.initial.toFixed(2),
        current: this.memory.current.toFixed(2),
        peak: this.memory.peak.toFixed(2),
        growth: (this.memory.current - this.memory.initial).toFixed(2),
        gcCount: this.memory.gcCount,
      },
      entities: {
        avgSpawnTime: this.entities.spawn.length > 0
          ? (this.entities.spawn.reduce((a, b) => a + b, 0) / this.entities.spawn.length).toFixed(2)
          : 0,
        avgDespawnTime: this.entities.despawn.length > 0
          ? (this.entities.despawn.reduce((a, b) => a + b, 0) / this.entities.despawn.length).toFixed(2)
          : 0,
      },
      network: {
        messageCount: this.network.messageCount,
        avgLatency: this.network.latencies.length > 0
          ? (this.network.latencies.reduce((a, b) => a + b, 0) / this.network.latencies.length).toFixed(2)
          : 0,
        throughput: (this.network.throughput / 1024 / 1024).toFixed(2),
      },
      physics: {
        avgSimTime: this.physics.simTime.length > 0
          ? (this.physics.simTime.reduce((a, b) => a + b, 0) / this.physics.simTime.length).toFixed(2)
          : 0,
        stepCount: this.physics.stepCount,
      },
      scripts: {
        errorCount: this.scripts.errorCount,
        warningCount: this.scripts.warningCount,
        execTimes: Object.entries(this.scripts.execTime).map(([name, data]) => ({
          name,
          avg: (data.total / data.count).toFixed(2),
          count: data.count,
        })),
      },
      raycast: {
        count: this.raycast.count,
        avgTime: this.raycast.avgTime.toFixed(2),
      },
      rendering: {
        drawCalls: this.rendering.drawCalls,
        triangles: this.rendering.triangles,
        textures: this.rendering.textures,
        avgUpdateTime: this.rendering.updateTime.length > 0
          ? (this.rendering.updateTime.reduce((a, b) => a + b, 0) / this.rendering.updateTime.length).toFixed(2)
          : 0,
      },
    }
  }

  reset() {
    this.frameTime = { samples: [], sum: 0, min: Infinity, max: 0, avg: 0 }
    this.entities = { spawn: [], despawn: [] }
    this.physics = { simTime: [], stepCount: 0 }
    this.raycast = { count: 0, totalTime: 0, avgTime: 0 }
    this.rendering = { updateTime: [], drawCalls: 0, triangles: 0, textures: 0 }
    this.startTime = performance.now()
  }
}
