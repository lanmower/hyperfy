/* Unified environment management for sky and shadows */

import { SkyManager } from './SkyManager.js'
import { ShadowManager } from './ShadowManager.js'

export class EnvironmentController {
  constructor(environment) {
    this.environment = environment
    this.shadowManager = new ShadowManager(environment)
    this.skyManager = new SkyManager(environment)
  }

  async buildCSM(shadowLevel) {
    return this.shadowManager.build(shadowLevel)
  }

  updateCSM(shadowLevel, sunDirection, sunIntensity, sunColor) {
    return this.shadowManager.update(shadowLevel, sunDirection, sunIntensity, sunColor)
  }

  addSky(node) {
    return this.skyManager.addSky(node)
  }

  async updateSky(sunDirection, sunIntensity, sunColor) {
    return this.skyManager.update(sunDirection, sunIntensity, sunColor)
  }

  updateSkyPosition(rigPosition) {
    return this.skyManager.updatePosition(rigPosition)
  }

  get skyInfo() {
    return this.skyManager.skyInfo
  }

  tick() {
    this.shadowManager.tick()
  }

  updateFrustums() {
    this.shadowManager.updateFrustums()
  }

  setSky(sky) {
    this.skyManager = sky
  }

  setShadows(shadows) {
    this.shadowManager = shadows
  }

  update(deltaTime) {
    if (this.skyManager) this.skyManager.update(deltaTime)
    if (this.shadowManager) this.shadowManager.update(deltaTime)
  }

  getSkyIntensity() {
    return this.skyManager?.intensity || 1
  }

  getShadowMapSize() {
    return this.shadowManager?.mapSize || 1024
  }

  setAmbientLight(intensity) {
    if (this.shadowManager) this.shadowManager.setAmbient(intensity)
  }
}
