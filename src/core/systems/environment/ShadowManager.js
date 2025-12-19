import * as THREE from '../../extras/three.js'

let CSM = null
let csmLoading = null

async function loadCSM() {
  if (CSM) return CSM
  if (csmLoading) return csmLoading
  csmLoading = import('../../libs/csm/CSM.js').then(module => {
    CSM = module.CSM
    csmLoading = null
    return CSM
  })
  return csmLoading
}

export class ShadowManager {
  constructor(environment) {
    this.environment = environment
    this.csm = null
  }

  async build(shadowLevel) {
    const options = this.environment.csmLevels[shadowLevel] || this.environment.csmLevels.med
    if (this.csm) {
      this.csm.updateCascades(options.cascades)
      this.csm.updateShadowMapSize(options.shadowMapSize)
      return
    }
    const CSMClass = await loadCSM()
    this.csm = new CSMClass({
      mode: 'practical',
      cascades: 3,
      maxCascades: 3,
      shadowMapSize: 2048,
      maxFar: 100,
      lightIntensity: 1,
      lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
      fade: true,
      parent: this.environment.stage.scene,
      camera: this.environment.camera,
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
    const options = this.environment.csmLevels[shadowLevel] || this.environment.csmLevels.med
    this.csm.lightDirection = sunDirection
    this.csm.updateCascades(options.cascades)
    this.csm.updateShadowMapSize(options.shadowMapSize)
    for (const light of this.csm.lights) {
      light.intensity = sunIntensity
      light.color.set(sunColor)
      light.castShadow = options.castShadow
    }
  }

  tick() {
    if (this.csm) {
      this.csm.update()
    }
  }

  updateFrustums() {
    if (this.csm) {
      this.csm.updateFrustums()
    }
  }
}
