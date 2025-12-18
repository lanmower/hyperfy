import { System } from './System.js'
import { CSMManager } from './environment/CSMManager.js'
import { SkyManager } from './environment/SkyManager.js'
import { csmLevels } from './environment/csmConfig.js'
import { patchFogShader } from './environment/shaderPatches.js'

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
    this.skyManager = null
    this.csmManager = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
    this.skyManager = new SkyManager(this.stage, this.loader, baseEnvironment)
    this.csmManager = new CSMManager(this.stage.scene, this.camera, csmLevels)
  }

  async start() {
    this.csmManager.build(this.prefs.shadows)
    this.skyManager.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
  }

  addSky(node) {
    return this.skyManager.addSky(node)
  }

  update(delta) {
    this.csmManager.tick()
  }

  lateUpdate(delta) {
    this.skyManager.updatePosition(this.rig.position)
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'shadows') {
      const skyInfo = this.skyManager.skyInfo
      this.csmManager.build(value)
      if (skyInfo) {
        this.csmManager.update(value, skyInfo.sunDirection, skyInfo.sunIntensity, skyInfo.sunColor)
      }
      this.skyManager.updateSky(this.base.sunDirection, this.base.sunIntensity, this.base.sunColor)
    }
  }

  onGraphicsResize = () => {
    this.csmManager.updateFrustums()
  }
}
