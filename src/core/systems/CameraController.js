import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('CameraController')

export class CameraController extends System {
  static DEPS = {
    graphics: 'graphics',
  }

  constructor(world) {
    super(world)
    this.keys = {}
    this.velocity = new pc.Vec3()
    this.speed = 15
  }

  init() {
    logger.info('CameraController.init')
    window.addEventListener('keydown', e => this.onKeyDown(e))
    window.addEventListener('keyup', e => this.onKeyUp(e))
  }

  onKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true
  }

  onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false
  }

  update(delta) {
    const camera = this.world.graphics?.app?.scene?.activeCameraEntity
    if (!camera) return

    const pos = camera.getLocalPosition()
    const moveDir = new pc.Vec3(0, 0, 0)

    if (this.keys['w']) moveDir.z += 1
    if (this.keys['s']) moveDir.z -= 1
    if (this.keys['a']) moveDir.x -= 1
    if (this.keys['d']) moveDir.x += 1
    if (this.keys[' ']) moveDir.y += 1
    if (this.keys['shift']) moveDir.y -= 1

    if (moveDir.length() > 0) {
      moveDir.normalize()
      this.velocity.copy(moveDir).scale(this.speed * delta)
      pos.add(this.velocity)
      camera.setLocalPosition(pos.x, pos.y, pos.z)
    }
  }

  destroy() {
    window.removeEventListener('keydown', e => this.onKeyDown(e))
    window.removeEventListener('keyup', e => this.onKeyUp(e))
  }
}
