import * as THREE from '../../extras/three.js'
import { CSM } from '../../libs/csm/CSM.js'

export class CSMManager {
  constructor(scene, camera, csmLevels) {
    this.scene = scene
    this.camera = camera
    this.csmLevels = csmLevels
    this.csm = null
  }

  build(shadowLevel) {
    const options = this.csmLevels[shadowLevel] || this.csmLevels.med

    if (this.csm) {
      this.csm.updateCascades(options.cascades)
      this.csm.updateShadowMapSize(options.shadowMapSize)
      return
    }

    this.csm = new CSM({
      mode: 'practical',
      cascades: 3,
      maxCascades: 3,
      shadowMapSize: 2048,
      maxFar: 100,
      lightIntensity: 1,
      lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
      fade: true,
      parent: this.scene,
      camera: this.camera,
      ...options,
    })

    if (!options.castShadow) {
      for (const light of this.csm.lights) {
        light.castShadow = false
      }
    }
  }

  update(shadowLevel, sunDirection, sunIntensity, sunColor) {
    if (!this.csm) return

    const options = this.csmLevels[shadowLevel] || this.csmLevels.med
    this.csm.lightDirection = sunDirection
    this.csm.updateCascades(options.cascades)
    this.csm.updateShadowMapSize(options.shadowMapSize)

    for (const light of this.csm.lights) {
      light.intensity = sunIntensity
      light.color.set(sunColor)
      light.castShadow = options.castShadow
    }
  }

  updateFrustums() {
    if (this.csm) {
      this.csm.updateFrustums()
    }
  }

  tick() {
    if (this.csm) {
      this.csm.update()
    }
  }
}
