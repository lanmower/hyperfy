/* Unified environment management for sky, shadows, and fog */

import { SkyManager } from './SkyManager.js'
import { ShadowManager } from './ShadowManager.js'

export class EnvironmentController {
  constructor(app) {
    this.app = app
    this.shadowManager = new ShadowManager(app)
    this.skyManager = new SkyManager(app)
  }

  async initialize(settings = {}) {
    const hdrPath = settings.hdr || '/assets/environments/default.hdr'

    try {
      await this.skyManager.initWithHDR(hdrPath)
    } catch (err) {
      console.warn('HDR environment not found, using defaults')
    }

    const sunLight = this.skyManager.setSun(
      settings.sunDirection || [0.5, 1, 0.5],
      settings.sunIntensity || 1.0,
      settings.sunColor || [1, 1, 1]
    )

    this.shadowManager.init(sunLight)

    if (settings.fog) {
      this.skyManager.setFog(
        settings.fog.near || 100,
        settings.fog.far || 1000,
        settings.fog.color || [0.5, 0.5, 0.5]
      )
    }
  }

  configureFromSettings(settings) {
    if (!settings.environment) return

    const env = settings.environment

    if (env.hdr) {
      this.skyManager.initWithHDR(env.hdr)
    } else if (env.background) {
      this.skyManager.setBackgroundImage(env.background)
    }

    if (env.sun) {
      this.skyManager.setSun(
        env.sun.direction || [0.5, 1, 0.5],
        env.sun.intensity || 1.0,
        env.sun.color || [1, 1, 1]
      )
    }

    if (env.fog) {
      this.skyManager.setFog(
        env.fog.near || 100,
        env.fog.far || 1000,
        env.fog.color || [0.5, 0.5, 0.5]
      )
    }

    if (env.shadows) {
      this.shadowManager.setShadowResolution(env.shadows.resolution || 2048)
      this.shadowManager.setNumCascades(env.shadows.cascades || 3)
    }
  }

  setShadowResolution(resolution) {
    this.shadowManager.setShadowResolution(resolution)
  }

  setShadowDistance(distance) {
    this.shadowManager.setShadowDistance(distance)
  }

  setNumCascades(num) {
    this.shadowManager.setNumCascades(num)
  }

  setShadowsEnabled(enabled) {
    this.shadowManager.setShadowsEnabled(enabled)
  }

  setSkyIntensity(intensity) {
    this.skyManager.setIntensity(intensity)
  }

  setFog(near, far, color) {
    this.skyManager.setFog(near, far, color)
  }

  disableFog() {
    this.skyManager.disableFog()
  }

  setSunDirection(direction, intensity, color) {
    this.skyManager.setSun(direction, intensity, color)
  }

  serialize() {
    return {
      environment: {
        fogStart: this.app.scene.fogStart,
        fogEnd: this.app.scene.fogEnd,
        fogColor: this.app.scene.fogColor
      }
    }
  }
}
