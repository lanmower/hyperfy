import * as pc from './extras/playcanvas.js'
import { System } from './systems/System.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('CameraController')

export class CameraController extends System {
  static DEPS = {
    graphics: 'graphics',
  }

  constructor(world) {
    super(world)
    this.keys = {}
    this.moveSpeed = 12
    this.velocity = new pc.Vec3()
  }

  async init() {
    logger.info('CameraController.init')
    this.setupKeyListeners()
  }

  setupKeyListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false
    })
  }

  update(deltaTime) {
    try {
      if (!this.graphics?.app?.scene) return
      const camera = this.graphics.app.scene.activeCameraEntity
      if (!camera) return

      this.velocity.set(0, 0, 0)
      const pos = camera.getLocalPosition()

      if (this.keys['w'] || this.keys['arrowup']) this.velocity.z -= 1
      if (this.keys['s'] || this.keys['arrowdown']) this.velocity.z += 1
      if (this.keys['d'] || this.keys['arrowright']) this.velocity.x += 1
      if (this.keys['a'] || this.keys['arrowleft']) this.velocity.x -= 1
      if (this.keys[' ']) this.velocity.y += 1
      if (this.keys['shift']) this.velocity.y -= 1

      const vel = this.velocity.length()
      if (vel > 0) {
        this.velocity.normalize()
        this.velocity.scale(this.moveSpeed * deltaTime)
        pos.add(this.velocity)
        camera.setLocalPosition(pos)
      }
    } catch (err) {
      logger.error('CameraController.update error', { error: err.message })
    }
  }

  destroy() {
    this.keys = {}
  }
}
