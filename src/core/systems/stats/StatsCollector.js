import StatsGL from '../../libs/stats-gl/index.js'
import Panel from '../../libs/stats-gl/panel.js'

const PING_RATE = 1 / 2

export class StatsCollector {
  constructor(graphics, network) {
    this.graphics = graphics
    this.network = network
    this.stats = null
    this.ping = null
    this.lastPingAt = 0
    this.pingHistory = []
    this.pingHistorySize = 30
    this.maxPing = 0.01
  }

  initialize(ui) {
    this.stats = new StatsGL({
      logsPerSecond: 20,
      samplesLog: 100,
      samplesGraph: 10,
      precision: 2,
      horizontal: true,
      minimal: false,
      mode: 0,
    })
    this.stats.dom.style.zIndex = null
    this.stats.init(this.graphics.renderer, false)
    this.ping = new Panel('PING', '#f00', '#200')
    this.stats.addPanel(this.ping, 3)
    ui.appendChild(this.stats.dom)
  }

  begin() {
    this.stats?.begin()
  }

  end() {
    this.stats?.end()
    this.stats?.update()
  }

  update(delta) {
    this.lastPingAt += delta
    if (this.lastPingAt > PING_RATE) {
      const time = performance.now()
      this.network.send('ping', time)
      this.lastPingAt = 0
    }
  }

  handlePong(time) {
    const rttMs = performance.now() - time
    this.pingHistory.push(rttMs)
    if (this.pingHistory.length > this.pingHistorySize) {
      this.pingHistory.shift()
    }
    let sum = 0
    let min = Infinity
    let max = 0
    for (let i = 0; i < this.pingHistory.length; i++) {
      const value = this.pingHistory[i]
      sum += value
      if (value < min) min = value
      if (value > max) max = value
    }
    const avg = sum / this.pingHistory.length
    if (max > this.maxPing) {
      this.maxPing = max
    }
    this.ping.update(avg, rttMs, max, this.maxPing, 0)
  }

  cleanup(ui) {
    if (this.stats) {
      ui.removeChild(this.stats.dom)
    }
  }
}
