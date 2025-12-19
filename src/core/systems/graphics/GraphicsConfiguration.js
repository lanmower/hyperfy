export class GraphicsConfiguration {
  constructor(graphics, postProcessing) {
    this.graphics = graphics
    this.postProcessing = postProcessing
    this.prefHandlers = {}
    this.settingHandlers = {}
  }

  setupPrefHandlers(renderer, settings, prefs) {
    this.prefHandlers = {
      'dpr': (value) => {
        renderer.setPixelRatio(value)
        this.graphics.resize(this.graphics.renderState.width, this.graphics.renderState.height)
      },
      'postprocessing': (value) => {
        this.graphics.usePostprocessing = value
      },
      'bloom': (value) => {
        this.graphics.bloomEnabled = value
        this.postProcessing.updateEffects(value)
      },
      'ao': (value) => {
        this.postProcessing.aoPass.enabled = value && settings.get('ao')
      },
    }
  }

  setupSettingHandlers(settings, prefs) {
    this.settingHandlers = {
      'ao': (value) => {
        this.postProcessing.aoPass.enabled = value && prefs.state.get('ao')
      },
    }
  }

  handlePrefChanged(key, value) {
    const handler = this.prefHandlers[key]
    if (handler) handler(value)
  }

  handleSettingChanged(key, value) {
    const handler = this.settingHandlers[key]
    if (handler) handler(value)
  }
}
