export class ModeManager {
  constructor() {
    this.currentMode = null
  }

  setMode(mode) {
    this.currentMode = mode
  }

  getMode() {
    return this.currentMode
  }

  getModeLabel() {
    return this.currentMode?.label || 'Select'
  }
}
