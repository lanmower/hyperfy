import { Plugin } from '../Plugin.js'
import { StatsCollector } from '../../systems/stats/StatsCollector.js'
import { StatsDisplay } from '../../systems/stats/StatsDisplay.js'

export class StatsPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.ui = null
    this.collector = new StatsCollector(options.graphics, options.network)
    this.display = new StatsDisplay()
  }

  async init() {
    if (this.options.ui) {
      this.ui = this.options.ui
    }
    if (this.world.prefs?.state.get('stats')) {
      this.toggle(true)
    }
  }

  toggle(value) {
    this.display.toggle(value, this.collector, this.ui)
  }

  async destroy() {
    this.toggle(false)
  }

  getAPI() {
    return {
      toggle: (value) => this.toggle(value),
      isActive: () => this.display.active,
      getStats: () => this.collector,
    }
  }
}
