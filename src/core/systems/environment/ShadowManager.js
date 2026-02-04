import * as pc from '../../extras/playcanvas.js'

export class ShadowManager {
  constructor(app) {
    this.app = app
    this.sunLight = null
    this.initialized = false
  }

  init(sunLight) {
    this.sunLight = sunLight
    this.initialized = true

    const light = sunLight.light
    light.castShadows = true
    light.shadowType = pc.SHADOW_PCF3
    light.shadowResolution = 2048
    light.shadowDistance = 500
    light.numCascades = 3
    light.cascadeSplits = [0.1, 0.3, 1.0]

    return this
  }

  setShadowResolution(resolution = 2048) {
    if (this.sunLight && this.sunLight.light) {
      this.sunLight.light.shadowResolution = resolution
    }
  }

  setShadowDistance(distance = 500) {
    if (this.sunLight && this.sunLight.light) {
      this.sunLight.light.shadowDistance = distance
    }
  }

  setNumCascades(num = 3) {
    if (this.sunLight && this.sunLight.light) {
      this.sunLight.light.numCascades = Math.max(1, Math.min(4, num))
    }
  }

  setCascadeSplits(splits = [0.1, 0.3, 1.0]) {
    if (this.sunLight && this.sunLight.light) {
      this.sunLight.light.cascadeSplits = splits
    }
  }

  setShadowsEnabled(enabled = true) {
    if (this.sunLight && this.sunLight.light) {
      this.sunLight.light.castShadows = enabled
    }
  }
}
