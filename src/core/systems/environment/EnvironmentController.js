/* Unified environment management for sky and shadows */

export class EnvironmentController {
  constructor() {
    this.sky = null
    this.shadows = null
    this.lighting = null
  }

  setSky(sky) {
    this.sky = sky
  }

  setShadows(shadows) {
    this.shadows = shadows
  }

  setLighting(lighting) {
    this.lighting = lighting
  }

  update(deltaTime) {
    if (this.sky) this.sky.update(deltaTime)
    if (this.shadows) this.shadows.update(deltaTime)
    if (this.lighting) this.lighting.update(deltaTime)
  }

  getSkyIntensity() {
    return this.sky?.intensity || 1
  }

  getShadowMapSize() {
    return this.shadows?.mapSize || 1024
  }

  setAmbientLight(intensity) {
    if (this.lighting) this.lighting.setAmbient(intensity)
  }
}
