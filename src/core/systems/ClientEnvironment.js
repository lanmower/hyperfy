import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { csmLevels } from './environment/csmConfig.js'
import { patchFogShader } from './environment/shaderPatches.js'
import { EnvironmentController } from './environment/EnvironmentController.js'

patchFogShader()

export class ClientEnvironment extends System {
  static DEPS = {
    stage: 'stage',
    rig: 'rig',
    loader: 'loader',
    events: 'events',
    prefs: 'prefs',
    camera: 'camera',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
    graphicsResize: 'onGraphicsResize',
  }

  constructor(world) {
    super(world)
    this.csmLevels = csmLevels
    this.controller = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
  }

  async start() {
    this.controller = new EnvironmentController(this)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.stage.scene.add(ambientLight)

    await this.controller.buildCSM(this.prefs.state.get('shadows'))
    this.controller.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
  }

  async buildCSM(shadowLevel) {
    await this.controller?.buildCSM(shadowLevel)
  }

  updateCSM(shadowLevel, sunDirection, sunIntensity, sunColor) {
    this.controller?.updateCSM(shadowLevel, sunDirection, sunIntensity, sunColor)
  }

  addSky(node) {
    return this.controller?.addSky(node)
  }

  async updateSky(sunDirection, sunIntensity, sunColor) {
    return this.controller?.updateSky(sunDirection, sunIntensity, sunColor)
  }

  updateSkyPosition(rigPosition) {
    this.controller?.updateSkyPosition(rigPosition)
  }

  update(delta) {
    this.controller?.tick()
  }

  lateUpdate(delta) {
    this.updateSkyPosition(this.rig.position)
  }

  onPrefChanged = async ({ key, value }) => {
    if (key === 'shadows') {
      await this.buildCSM(value)
      const skyInfo = this.controller?.skyInfo
      if (skyInfo) {
        this.updateCSM(value, skyInfo.sunDirection, skyInfo.sunIntensity, skyInfo.sunColor)
      }
      this.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
    }
  }

  onGraphicsResize = () => {
    this.controller?.updateFrustums()
  }
}
