import { isBoolean } from 'lodash-es'

export class StatsDisplay {
  constructor() {
    this.active = false
    this.uiHidden = null
  }

  toggle(value, collector, ui) {
    value = isBoolean(value) ? value : !this.active
    if (this.active === value) return
    this.active = value
    if (this.active) {
      if (!collector.stats) {
        collector.initialize(ui)
      } else {
        ui.appendChild(collector.stats.dom)
      }
    } else {
      collector.cleanup(ui)
    }
  }

  handleUIStateChange(state, collector, ui) {
    if (this.active && !state.visible) {
      this.uiHidden = true
      this.toggle(false, collector, ui)
    } else if (this.uiHidden && state.visible) {
      this.uiHidden = null
      this.toggle(true, collector, ui)
    }
  }
}
