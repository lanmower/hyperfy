import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { EnvironmentController } from './environment/EnvironmentController.js'

const logger = new StructuredLogger('ClientEnvironment')

export class ClientEnvironment extends System {
  static DEPS = {
    graphics: 'graphics',
    events: 'events',
    prefs: 'prefs',
  }

  constructor(world) {
    super(world)
    this.controller = null
  }

  async init({ baseEnvironment }) {
    logger.info('ClientEnvironment.init called')
    this.baseEnvironment = baseEnvironment
  }

  async start() {
    logger.info('ClientEnvironment.start called')
    const app = this.graphics.app
    logger.info('Graphics app available', { appReady: !!app })

    this.controller = new EnvironmentController(app)
    logger.info('EnvironmentController created')

    const ambientLight = new pc.Entity('ambient')
    ambientLight.addComponent('light', {
      type: 'omni',
      color: new pc.Color(1, 1, 1),
      intensity: 0.6,
      range: 1000
    })
    app.root.addChild(ambientLight)

    const settings = {
      hdr: this.baseEnvironment?.hdr,
      sunDirection: this.baseEnvironment?.sunDirection || [0.5, 1, 0.5],
      sunIntensity: this.baseEnvironment?.sunIntensity || 1.0,
      sunColor: this.baseEnvironment?.sunColor || [1, 1, 1],
      fog: this.baseEnvironment?.fogNear && {
        near: this.baseEnvironment.fogNear,
        far: this.baseEnvironment.fogFar,
        color: this.baseEnvironment.fogColor || [0.5, 0.5, 0.5]
      }
    }

    await this.controller.initialize(settings)
  }

  setShadowResolution(resolution) {
    this.controller?.setShadowResolution(resolution)
  }

  setShadowDistance(distance) {
    this.controller?.setShadowDistance(distance)
  }

  setNumCascades(num) {
    this.controller?.setNumCascades(num)
  }

  setShadowsEnabled(enabled) {
    this.controller?.setShadowsEnabled(enabled)
  }

  setSkyIntensity(intensity) {
    this.controller?.setSkyIntensity(intensity)
  }

  setFog(near, far, color) {
    this.controller?.setFog(near, far, color)
  }

  disableFog() {
    this.controller?.disableFog()
  }

  setSunDirection(direction, intensity, color) {
    this.controller?.setSunDirection(direction, intensity, color)
  }

  update(delta) {}

  lateUpdate(delta) {}

  destroy() {
    this.controller = null
  }
}
