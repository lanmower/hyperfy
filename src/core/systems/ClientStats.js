import { System } from './System.js'

import StatsGL from '../libs/stats-gl/index.js'
import Panel from '../libs/stats-gl/panel.js'
import { isBoolean } from 'lodash-es'

const PING_RATE = 1 / 2

export class ClientStats extends System {
  static DEPS = {
    events: 'events',
    prefs: 'prefs',
    graphics: 'graphics',
    network: 'network',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
    uiStateChanged: 'onUIState',
    ready: 'onReady',
  }

  constructor(world) {
    super(world)
    this.stats = null
    this.ui = null
    this.active = false
    this.lastPingAt = 0
    this.pingHistory = []
    this.pingHistorySize = 30
    this.maxPing = 0.01
  }

  init({ ui }) {
    this.ui = ui
  }

  start() {
  }

  onReady = () => {
    if (this.prefs.state.get('stats')) {
      this.toggle(true)
    }
  }

  toggle(value) {
    value = isBoolean(value) ? value : !this.active
    if (this.active === value) return
    this.active = value
    if (this.active) {
      if (!this.stats) {
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
      }
      this.ui.appendChild(this.stats.dom)
    } else {
      this.ui.removeChild(this.stats.dom)
    }
  }

  preTick() {
    if (this.active) {
      this.stats.begin()
    }
  }

  update(delta) {
    if (!this.active) return
    this.lastPingAt += delta
    if (this.lastPingAt > PING_RATE) {
      const time = performance.now()
      this.network.send('ping', time)
      this.lastPingAt = 0
    }
  }

  postTick() {
    if (this.active) {
      this.stats.end()
      this.stats.update()
    }
  }

  onPong(time) {
    const rttMs = performance.now() - time
    if (this.active && this.ping) {
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
      this.ping.update(
        avg, // current value (average)
        rttMs, // graph value (latest ping)
        max, // max value for text display
        this.maxPing, // max value for graph scaling
        0 // number of decimal places (0 for ping)
      )
    }
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'stats') {
      this.toggle(value)
    }
  }

  onUIState = state => {
    if (this.active && !state.visible) {
      this.uiHidden = true
      this.toggle(false)
    } else if (this.uiHidden && state.visible) {
      this.uiHidden = null
      this.toggle(true)
    }
  }

  destroy() {
    this.toggle(false)
  }
}
