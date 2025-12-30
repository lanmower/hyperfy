import { MODE_CONFIGS } from './ActionConfigs.js'

export class ModeManager {
  constructor() {
    this.mode = 'grab'
    this.localSpace = false
  }

  getMode() {
    return this.mode
  }

  setMode(newMode) {
    if (newMode === 'grab') {
      this.localSpace = false
    }
    this.mode = newMode
  }

  getModeLabel() {
    return MODE_CONFIGS[this.mode]?.label || 'Unknown'
  }

  getSpaceLabel() {
    return this.localSpace ? 'Local' : 'World'
  }

  toggleSpace() {
    if (this.mode !== 'grab') {
      this.localSpace = !this.localSpace
    }
  }

  isLocalSpace() {
    return this.localSpace
  }
}
