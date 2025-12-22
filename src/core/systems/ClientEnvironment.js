import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { csmLevels } from './environment/csmConfig.js'
import { patchFogShader } from './environment/shaderPatches.js'
import { ShadowManager } from './environment/ShadowManager.js'
import { SkyManager } from './environment/SkyManager.js'

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
    this.shadowManager = null
    this.skyManager = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
  }

  async start() {
    this.shadowManager = new ShadowManager(this)
    this.skyManager = new SkyManager(this)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.stage.scene.add(ambientLight)

    await this.shadowManager.build(this.prefs.state.get('shadows'))
    this.skyManager.update(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
  }

  async buildCSM(shadowLevel) {
    await this.shadowManager?.build(shadowLevel)
  }

  updateCSM(shadowLevel, sunDirection, sunIntensity, sunColor) {
    this.shadowManager?.update(shadowLevel, sunDirection, sunIntensity, sunColor)
  }

  addSky(node) {
    return this.skyManager?.addSky(node)
  }

  async updateSky(sunDirection, sunIntensity, sunColor) {
    return this.skyManager?.update(sunDirection, sunIntensity, sunColor)
  }

  updateSkyPosition(rigPosition) {
    this.skyManager?.updatePosition(rigPosition)
  }

  update(delta) {
    this.shadowManager?.tick()
  }

  lateUpdate(delta) {
    this.updateSkyPosition(this.rig.position)
  }

  onPrefChanged = async ({ key, value }) => {
    if (key === 'shadows') {
      await this.buildCSM(value)
      const skyInfo = this.skyManager?.skyInfo
      if (skyInfo) {
        this.updateCSM(value, skyInfo.sunDirection, skyInfo.sunIntensity, skyInfo.sunColor)
      }
      this.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
    }
  }

  onGraphicsResize = () => {
    this.shadowManager?.updateFrustums()
  }
}
