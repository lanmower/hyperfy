import { System } from './System.js'
import { StatsCollector } from './stats/StatsCollector.js'
import { StatsDisplay } from './stats/StatsDisplay.js'

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
    this.ui = null
    this.collector = new StatsCollector(this.graphics, this.network)
    this.display = new StatsDisplay()
  }

  init({ ui }) {
    this.ui = ui
  }

  start() {}

  onReady = () => {
    if (this.prefs.state.get('stats')) {
      this.toggle(true)
    }
  }

  toggle(value) {
    this.display.toggle(value, this.collector, this.ui)
  }

  preTick() {
    if (this.display.active) {
      this.collector.begin()
    }
  }

  update(delta) {
    if (this.display.active) {
      this.collector.update(delta)
    }
  }

  postTick() {
    if (this.display.active) {
      this.collector.end()
    }
  }

  onPong(time) {
    if (this.display.active && this.collector.ping) {
      this.collector.handlePong(time)
    }
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'stats') {
      this.toggle(value)
    }
  }

  onUIState = state => {
    this.display.handleUIStateChange(state, this.collector, this.ui)
  }

  destroy() {
    this.toggle(false)
  }
}
