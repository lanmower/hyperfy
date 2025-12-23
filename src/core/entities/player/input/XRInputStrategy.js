import { InputStrategy } from './InputStrategy.js'
import { DEG2RAD } from '../../../extras/general.js'
import { XR_SNAP_TURN_ANGLE } from '../CameraConstants.js'

export class XRInputStrategy extends InputStrategy {
  constructor(camera) {
    super(camera)
    this.didSnapTurn = false
  }

  updateLook(delta, control, context) {
    const { rotation, quaternion } = this.camera
    rotation.x = 0
    rotation.z = 0

    if (control.xrRightStick.value.x === 0 && this.didSnapTurn) {
      this.didSnapTurn = false
    } else if (control.xrRightStick.value.x > 0 && !this.didSnapTurn) {
      rotation.y -= XR_SNAP_TURN_ANGLE * DEG2RAD
      this.didSnapTurn = true
    } else if (control.xrRightStick.value.x < 0 && !this.didSnapTurn) {
      rotation.y += XR_SNAP_TURN_ANGLE * DEG2RAD
      this.didSnapTurn = true
    }

    quaternion.setFromEuler(rotation)
  }

  updateZoom(delta, control) {
  }
}
