import { InputStrategy } from './InputStrategy.js'
import { clamp } from '../../../utils.js'
import { POINTER_LOOK_SPEED, MIN_PITCH_ANGLE, MAX_PITCH_ANGLE } from '../CameraConstants.js'
import { DEG2RAD } from '../../../extras/general.js'

export class PointerLockInputStrategy extends InputStrategy {
  updateLook(delta, control, context) {
    const { rotation, quaternion } = this.camera
    rotation.x += -control.pointer.delta.y * POINTER_LOOK_SPEED * delta
    rotation.y += -control.pointer.delta.x * POINTER_LOOK_SPEED * delta
    rotation.z = 0
    rotation.x = clamp(rotation.x, MIN_PITCH_ANGLE * DEG2RAD, MAX_PITCH_ANGLE * DEG2RAD)
    quaternion.setFromEuler(rotation)
  }

  updateZoom(delta, control) {
  }
}
