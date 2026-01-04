import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { NametagRenderer } from '../../client/canvas/NametagRenderer.js'
import * as Config from '../config/NametagConfig.js'
import { StructuredLogger } from '../utils/logging/index.js'

export class Nametags extends System {
  static DEPS = { stage: 'stage', events: 'events', graphics: 'graphics' }
  static EVENTS = { xrSession: 'onXRSession' }

  constructor(world) {
    super(world)
    this.logger = new StructuredLogger('Nametags')
    this.renderer = null
    this.nametags = []
    this.material = null
    this.geometry = null
    this.mesh = null
  }

  init() {
    const gd = this.world.graphics?.app?.graphicsDevice
    if (!gd) {
      this.logger.warn('Graphics device not available in init()')
      return
    }
    this.renderer = new NametagRenderer(gd)
    this.material = new pc.StandardMaterial()
    this.material.diffuse.set(1, 1, 1)
    this.material.emissive.set(0, 0, 0)
    this.material.diffuseMap = this.renderer.texture
    this.material.blendType = pc.BLEND_NORMAL
    this.material.depthWrite = false
    this.material.update()
    this.geometry = pc.createPlane(gd, { halfExtents: new pc.Vec3(0.5, 0.5 * Config.HEIGHT / Config.WIDTH, 0) })
    this.mesh = new pc.Entity('nametags')
    this.mesh.addComponent('render', {
      type: 'asset',
      meshInstances: [new pc.MeshInstance(this.geometry, this.material)]
    })
    this.mesh.renderOrder = 9999
    this.instanceData = new Float32Array(Config.MAX_INSTANCES * 4)
    this.count = 0
  }

  start() { if (this.mesh) this.stage.scene.addChild(this.mesh) }

  add({ name, health }) {
    const idx = this.nametags.length
    if (idx >= Config.MAX_INSTANCES) {
      this.logger.error('reached max')
      return
    }
    this.count++
    const position = new pc.Vec3(0, 0, 0)
    const nametag = {
      idx, name, health, position,
      move: newPosition => {
        position.copy(newPosition)
      },
      setName: newName => { if (name !== newName) { name = newName; this.renderer.draw(nametag) } },
      setHealth: newHealth => { if (health !== newHealth) { health = newHealth; this.renderer.draw(nametag) } },
      destroy: () => this.remove(nametag),
    }
    this.nametags[idx] = nametag
    this.renderer.draw(nametag)
    return nametag
  }

  remove(nametag) {
    if (!this.nametags.includes(nametag)) {
      this.logger.warn('attempted to remove non-existent nametag')
      return
    }
    const last = this.nametags[this.nametags.length - 1]
    const isLast = nametag === last
    if (isLast) {
      this.nametags.pop()
      this.renderer.clear(nametag)
    } else {
      this.renderer.clear(last)
      last.idx = nametag.idx
      this.renderer.draw(last)
      this.nametags[last.idx] = last
      this.nametags.pop()
    }
    this.count--
  }

  onXRSession = session => { }
}
