export class PerformanceDisplay {
  constructor() {
    this.dom = null
    this.isVisible = false
  }

  show() {
    if (!this.dom) {
      this.createDOM()
    }
    this.dom.style.display = 'block'
    this.isVisible = true
  }

  hide() {
    if (this.dom) {
      this.dom.style.display = 'none'
    }
    this.isVisible = false
  }

  createDOM() {
    this.dom = document.createElement('div')
    this.dom.id = 'performance-monitor'
    this.dom.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border: 1px solid #0f0;
      max-width: 300px;
      max-height: 500px;
      overflow: auto;
      z-index: 10000;
      display: none;
      border-radius: 4px;
      line-height: 1.4;
    `
    document.body.appendChild(this.dom)
  }

  update(snapshot) {
    if (!this.dom) return

    const html = `
      <div style="margin-bottom: 8px; border-bottom: 1px solid #0f0; padding-bottom: 8px;">
        <strong>PERFORMANCE MONITOR</strong>
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Frame:</strong> ${snapshot.frameTime.avg.toFixed(2)}ms (${(1000/snapshot.frameTime.avg).toFixed(0)} FPS)
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Memory:</strong> ${snapshot.memory.current} MB (peak: ${snapshot.memory.peak} MB, growth: ${snapshot.memory.growth} MB)
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Network:</strong> latency ${snapshot.network.avgLatency}ms
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Entities Spawn:</strong> ${snapshot.entities.avgSpawnTime}ms
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Physics:</strong> ${snapshot.physics.avgSimTime}ms (${snapshot.physics.stepCount} steps)
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Rendering:</strong> ${snapshot.rendering.avgUpdateTime}ms
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Scripts:</strong> errors: ${snapshot.scripts.errorCount}, warnings: ${snapshot.scripts.warningCount}
      </div>

      <div style="margin-bottom: 6px;">
        <strong>Raycast:</strong> ${snapshot.raycast.count} queries
      </div>

      <div style="font-size: 9px; color: #888; margin-top: 8px;">
        Uptime: ${(snapshot.uptime / 1000).toFixed(1)}s
      </div>
    `

    this.dom.innerHTML = html
  }

  cleanup() {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom)
    }
  }
}
