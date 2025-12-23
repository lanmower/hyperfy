import { InputStrategy } from './InputStrategy.js'
import { clamp } from '../../../utils.js'
import { PAN_LOOK_SPEED, MIN_PITCH_ANGLE, MAX_PITCH_ANGLE } from '../CameraConstants.js'
import { DEG2RAD } from '../../../extras/general.js'

export class TouchPanInputStrategy extends InputStrategy {
  updateLook(delta, control, context) {
    const { rotation, quaternion } = this.camera
    const pan = context.pan
    if (!pan) return

    rotation.x += -pan.delta.y * PAN_LOOK_SPEED * delta
    rotation.y += -pan.delta.x * PAN_LOOK_SPEED * delta
    rotation.z = 0
    rotation.x = clamp(rotation.x, MIN_PITCH_ANGLE * DEG2RAD, MAX_PITCH_ANGLE * DEG2RAD)
    quaternion.setFromEuler(rotation)
  }

  updateZoom(delta, control) {
  }
}
