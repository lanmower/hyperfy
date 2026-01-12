import * as pc from '../../extras/playcanvas.js'

export class PostProcessingSetup {
  constructor(app, camera) {
    this.app = app
    this.camera = camera
    this.effects = {}
  }

  init() {
    this.effects.bloom = this.createBloomEffect()
    this.effects.fxaa = this.createFXAAEffect()
    this.effects.ssao = this.createSSAOEffect()
    return this.effects
  }

  createBloomEffect() {
    return {
      enabled: true,
      intensity: 0.5,
      threshold: 0.5,
      blurAmount: 4,
      setIntensity(val) { this.intensity = Math.max(0, Math.min(1, val)) },
      setThreshold(val) { this.threshold = Math.max(0, Math.min(1, val)) },
      setBlurAmount(val) { this.blurAmount = Math.max(1, Math.min(8, val)) }
    }
  }

  createFXAAEffect() {
    const device = this.app?.graphicsDevice
    return {
      enabled: true,
      span: 8,
      reduce: 1/8,
      reduceMul: 1/8,
      setEnabled(val) { this.enabled = val },
      device
    }
  }

  createSSAOEffect() {
    return {
      enabled: true,
      radius: 2.0,
      samples: 8,
      intensity: 1.0,
      bias: 0.0,
      falloff: 1.0,
      setRadius(val) { this.radius = Math.max(0.1, Math.min(10, val)) },
      setSamples(val) { this.samples = Math.max(4, Math.min(32, val)) },
      setIntensity(val) { this.intensity = Math.max(0, Math.min(2, val)) }
    }
  }

  setBloomIntensity(intensity) {
    if (this.effects.bloom) {
      this.effects.bloom.setIntensity(intensity)
    }
  }

  setBloomThreshold(threshold) {
    if (this.effects.bloom) {
      this.effects.bloom.setThreshold(threshold)
    }
  }

  setBloomBlurAmount(amount) {
    if (this.effects.bloom) {
      this.effects.bloom.setBlurAmount(amount)
    }
  }

  setSSAORadius(radius) {
    if (this.effects.ssao) {
      this.effects.ssao.setRadius(radius)
    }
  }

  setSSAOSamples(samples) {
    if (this.effects.ssao) {
      this.effects.ssao.setSamples(samples)
    }
  }

  setSSAOIntensity(intensity) {
    if (this.effects.ssao) {
      this.effects.ssao.setIntensity(intensity)
    }
  }

  setFXAAEnabled(enabled) {
    if (this.effects.fxaa) {
      this.effects.fxaa.setEnabled(enabled)
    }
  }

  getSettings() {
    return {
      bloom: this.effects.bloom ? {
        intensity: this.effects.bloom.intensity,
        threshold: this.effects.bloom.threshold,
        blurAmount: this.effects.bloom.blurAmount
      } : null,
      fxaa: this.effects.fxaa ? {
        enabled: this.effects.fxaa.enabled
      } : null,
      ssao: this.effects.ssao ? {
        radius: this.effects.ssao.radius,
        samples: this.effects.ssao.samples,
        intensity: this.effects.ssao.intensity,
        bias: this.effects.ssao.bias,
        falloff: this.effects.ssao.falloff
      } : null
    }
  }

  loadSettings(settings) {
    if (settings.bloom && this.effects.bloom) {
      this.setBloomIntensity(settings.bloom.intensity || 0.5)
      this.setBloomThreshold(settings.bloom.threshold || 0.5)
      this.setBloomBlurAmount(settings.bloom.blurAmount || 4)
    }

    if (settings.ssao && this.effects.ssao) {
      this.setSSAORadius(settings.ssao.radius || 2.0)
      this.setSSAOSamples(settings.ssao.samples || 8)
      this.setSSAOIntensity(settings.ssao.intensity || 1.0)
    }

    if (settings.fxaa !== undefined && this.effects.fxaa) {
      this.setFXAAEnabled(settings.fxaa)
    }
  }

  serialize() {
    return this.getSettings()
  }
}
