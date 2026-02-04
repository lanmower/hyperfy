import { ControlPriorities } from '../../extras/ControlPriorities.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PlayerControlBinder')
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25

export class PlayerControlBinder {
  constructor(player) {
    this.player = player
    this.stick = null
    this.pan = null
  }

  initControl() {
    const controls = this.player.world.controls
    if (!controls) {
      logger.warn('Controls service not available')
      return
    }

    this.player.control = controls.bind({
      priority: ControlPriorities.PLAYER,
      onTouch: touch => {
        if (!this.stick && touch.position.x < this.player.control.screen.width / 2) {
          this.stick = {
            center: touch.position.clone(),
            active: false,
            touch,
          }
        } else if (!this.pan) {
          this.pan = touch
        }
      },
      onTouchEnd: touch => {
        if (this.stick?.touch === touch) {
          this.stick = null
          const events = this.player.world.events
          events?.emit('stick', null)
        }
        if (this.pan === touch) {
          this.pan = null
        }
      },
    })
    if (this.player.control?.camera) {
      this.player.control.camera.write = true
      this.player.control.camera.position.copy(this.player.cam.position)
      this.player.control.camera.quaternion.copy(this.player.cam.quaternion)
      this.player.control.camera.zoom = this.player.cam.zoom
    }
  }
}
