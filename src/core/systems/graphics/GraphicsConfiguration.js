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
        if (this.graphics.resize) {
          this.graphics.resize(this.graphics.width, this.graphics.height)
        }
      },
      'postprocessing': (value) => {
        if (this.postProcessing) {
          this.graphics.usePostprocessing = value
        }
      },
      'bloom': (value) => {
        if (this.postProcessing) {
          this.postProcessing.setBloomIntensity(value ? 0.5 : 0)
        }
      },
      'ssao': (value) => {
        if (this.postProcessing) {
          this.postProcessing.setSSAOIntensity(value ? 1.0 : 0)
        }
      },
      'fxaa': (value) => {
        if (this.postProcessing) {
          this.postProcessing.toggleFXAA(value)
        }
      }
    }
  }

  setupSettingHandlers(settings, prefs) {
    this.settingHandlers = {
      'bloom': (value) => {
        if (this.postProcessing) {
          this.postProcessing.setBloomIntensity(value ? 0.5 : 0)
        }
      },
      'ssao': (value) => {
        if (this.postProcessing) {
          this.postProcessing.setSSAOIntensity(value ? 1.0 : 0)
        }
      },
      'fxaa': (value) => {
        if (this.postProcessing) {
          this.postProcessing.toggleFXAA(value)
        }
      }
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
