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

    app.scene.ambientLight = new pc.Color(1, 1, 1)
    app.scene.ambientLightIntensity = 0.6

    const material = new pc.StandardMaterial()
    material.diffuse.set(0.2, 0.6, 0.2)
    material.update()

    const mesh = pc.createBox(app.graphicsDevice, { halfExtents: { x: 5, y: 0.5, z: 5 } })

    const ground = new pc.Entity('ground')
    ground.setLocalPosition(0, -2, 0)
    const meshInstance = new pc.MeshInstance(mesh, material)
    ground.addComponent('render', {
      type: 'asset',
      meshInstances: [meshInstance]
    })

    app.root.addChild(ground)

    if (this.baseEnvironment?.model) {
      try {
        logger.info('Loading base environment model', { model: this.baseEnvironment.model })
        const modelAsset = await new Promise((resolve, reject) => {
          const asset = new pc.Asset('baseEnvironment', 'model', { url: this.baseEnvironment.model })
          asset.on('load', () => resolve(asset.resource))
          asset.on('error', reject)
          app.assets.add(asset)
          app.assets.load(asset)
        })
        const modelEntity = new pc.Entity('baseEnvironment')
        modelEntity.addComponent('model', { asset: modelAsset })
        app.root.addChild(modelEntity)
        logger.info('Base environment model loaded and added to scene')
      } catch (err) {
        logger.error('Failed to load base environment model', { error: err.message })
      }
    }

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
