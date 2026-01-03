import { InputConfig } from '../../config/SystemConfig.js'
import { clamp } from '../../utils.js'
import * as THREE from '../../extras/three.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'
import { POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from './CameraConstants.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const UP = new THREE.Vector3(0, 1, 0)
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25
const STICK_DEAD_ZONE = InputConfig.STICK_DEAD_ZONE

const { e1, q1, v1 } = SharedVectorPool('PlayerInputProcessorActions', 1, 1, 1)

export class PlayerInputProcessorActions {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
  }

  processCamera(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { cam, control, pan } = this.playerLocal

    if (!control) return

    if (isXR) {
      cam.rotation.x = 0
      cam.rotation.z = 0
      if (control.xrRightStick.value.x === 0 && this.playerLocal.didSnapTurn) {
        this.playerLocal.didSnapTurn = false
      } else if (control.xrRightStick.value.x > 0 && !this.playerLocal.didSnapTurn) {
        cam.rotation.y -= 45 * DEG2RAD
        this.playerLocal.didSnapTurn = true
      } else if (control.xrRightStick.value.x < 0 && !this.playerLocal.didSnapTurn) {
        cam.rotation.y += 45 * DEG2RAD
        this.playerLocal.didSnapTurn = true
      }
    } else if (control.pointer?.locked) {
      cam.rotation.x += -control.pointer.delta.y * POINTER_LOOK_SPEED * delta
      cam.rotation.y += -control.pointer.delta.x * POINTER_LOOK_SPEED * delta
      cam.rotation.z = 0
    } else if (pan) {
      cam.rotation.x += -pan.delta.y * PAN_LOOK_SPEED * delta
      cam.rotation.y += -pan.delta.x * PAN_LOOK_SPEED * delta
      cam.rotation.z = 0
    }

    if (!isXR) {
      cam.rotation.x = clamp(cam.rotation.x, -89 * DEG2RAD, 89 * DEG2RAD)
      cam.quaternion.setFromEuler(cam.rotation)
    }

    if (!isXR && control?.scrollDelta) {
      cam.zoom += -control.scrollDelta.value * ZOOM_SPEED * delta
      cam.zoom = clamp(cam.zoom, MIN_ZOOM, MAX_ZOOM)
    }
  }

  processZoom(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { cam, control } = this.playerLocal

    if (!cam) return

    if (isXR && !this.playerLocal.xrActive) {
      cam.zoom = 0
      this.playerLocal.xrActive = true
    } else if (!isXR && this.playerLocal.xrActive) {
      cam.zoom = InputConfig.DEFAULT_ZOOM
      this.playerLocal.xrActive = false
    }

    if (cam.zoom < 1 && !this.playerLocal.firstPerson) {
      cam.zoom = 0
      this.playerLocal.firstPerson = true
      if (this.playerLocal.avatar?.raw?.scene) {
        this.playerLocal.avatar.raw.scene.visible = false
      } else if (this.playerLocal.avatar?.visible !== undefined) {
        this.playerLocal.avatar.visible = false
      }
    } else if (cam.zoom > 0 && this.playerLocal.firstPerson) {
      cam.zoom = InputConfig.DEFAULT_ZOOM
      this.playerLocal.firstPerson = false
      if (this.playerLocal.avatar?.raw?.scene) {
        this.playerLocal.avatar.raw.scene.visible = true
      } else if (this.playerLocal.avatar?.visible !== undefined) {
        this.playerLocal.avatar.visible = true
      }
    }
  }

  processJump() {
    const isXR = this.playerLocal.world.xr?.session
    const { control } = this.playerLocal

    if (!control) return

    this.playerLocal.jumpDown = isXR ? control.xrRightBtn1.down : control.space.down || control.touchA.down
    if (isXR ? control.xrRightBtn1.pressed : control.space.pressed || control.touchA.pressed) {
      this.playerLocal.jumpPressed = true
    }
  }

  processMovement(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { control, physics, stick, world } = this.playerLocal

    if (!physics) return
    if (!control && !isXR && !stick?.active) return

    physics.moveDir.set(0, 0, 0)
    if (isXR && control) {
      physics.moveDir.x = control.xrLeftStick.value.x
      physics.moveDir.z = control.xrLeftStick.value.z
    } else if (stick?.active) {
      const touchX = stick.touch.position.x
      const touchY = stick.touch.position.y
      const centerX = stick.center.x
      const centerY = stick.center.y
      const dx = centerX - touchX
      const dy = centerY - touchY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const moveRadius = STICK_OUTER_RADIUS - STICK_INNER_RADIUS
      if (distance > moveRadius) {
        stick.center.x = touchX + (moveRadius * dx) / distance
        stick.center.y = touchY + (moveRadius * dy) / distance
      }
      const stickX = (touchX - stick.center.x) / moveRadius
      const stickY = (touchY - stick.center.y) / moveRadius
      physics.moveDir.x = stickX
      physics.moveDir.z = stickY
      world.events.emit('stick', stick)
    } else if (control) {
      if (control.keyW.down || control.arrowUp.down) physics.moveDir.z -= 1
      if (control.keyS.down || control.arrowDown.down) physics.moveDir.z += 1
      if (control.keyA.down || control.arrowLeft.down) physics.moveDir.x -= 1
      if (control.keyD.down || control.arrowRight.down) physics.moveDir.x += 1
    }

    physics.moving = physics.moveDir.length() > STICK_DEAD_ZONE
  }

  processStickActivation() {
    const { stick } = this.playerLocal
    if (stick && !stick.active) {
      stick.active = this.playerLocal.stick.center.distanceTo(stick.touch.position) > 3
    }
  }

  processRunning() {
    const isXR = this.playerLocal.world.xr?.session
    const { stick, physics, control } = this.playerLocal

    if (!physics) return

    if (stick?.active || isXR) {
      this.playerLocal.running = physics.moving && physics.moveDir.length() > 0.9
    } else if (control) {
      this.playerLocal.running = physics.moving && (control.shiftLeft.down || control.shiftRight.down)
    }
  }

  applyMovementRotation() {
    const isXR = this.playerLocal.world.xr?.session
    const { physics, cam, base, world } = this.playerLocal

    if (!physics) return

    physics.moveDir.normalize()

    if (isXR && world.xr?.camera) {
      physics.flyDir.copy(physics.moveDir)
      physics.flyDir.applyQuaternion(world.xr.camera.quaternion)
    } else {
      physics.flyDir.copy(physics.moveDir)
      physics.flyDir.applyQuaternion(cam.quaternion)
    }

    this.playerLocal.axis.copy(physics.moveDir)

    const yQuaternion = q1.setFromAxisAngle(UP, isXR ? this.getXRRotation() : cam.rotation.y)
    physics.moveDir.applyQuaternion(yQuaternion)
  }

  getXRRotation() {
    const { world, cam } = this.playerLocal
    if (!world.xr?.camera) return cam.rotation.y
    e1.copy(world.xr.camera.rotation).reorder('YXZ')
    return e1.y + cam.rotation.y
  }

  applyBodyRotation(delta = 0.016) {
    const isXR = this.playerLocal.world.xr?.session
    const { physics, cam, base, world, firstPerson, data } = this.playerLocal

    let rotY
    let applyRotY

    if (data.effect?.turn) {
      rotY = isXR ? this.getXRRotation() : cam.rotation.y
      applyRotY = true
    } else if (physics?.moving || firstPerson) {
      rotY = isXR ? this.getXRRotation() : cam.rotation.y
      applyRotY = true
    }

    if (applyRotY) {
      e1.set(0, rotY, 0)
      q1.setFromEuler(e1)
      const alpha = 1 - Math.pow(0.00000001, delta)
      base.quaternion.slerp(q1, alpha)
    }
  }
}
