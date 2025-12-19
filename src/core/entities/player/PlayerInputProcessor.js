import { clamp } from '../../utils.js'
import * as THREE from '../../extras/three.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'
import { POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from './CameraConstants.js'

const UP = new THREE.Vector3(0, 1, 0)
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25
const STICK_DEAD_ZONE = 0.2

const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const q1 = new THREE.Quaternion()
const v1 = new THREE.Vector3()

export class PlayerInputProcessor {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
  }

  processCamera(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { cam, control, pan } = this.playerLocal

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
    } else if (control.pointer.locked) {
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
    }
  }

  processZoom(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { cam, control } = this.playerLocal

    if (!isXR) {
      cam.zoom += -control.scrollDelta.value * ZOOM_SPEED * delta
      cam.zoom = clamp(cam.zoom, MIN_ZOOM, MAX_ZOOM)
    }

    if (isXR && !this.playerLocal.xrActive) {
      cam.zoom = 0
      this.playerLocal.xrActive = true
    } else if (!isXR && this.playerLocal.xrActive) {
      cam.zoom = 1
      this.playerLocal.xrActive = false
    }

    if (cam.zoom < 1 && !this.playerLocal.firstPerson) {
      cam.zoom = 0
      this.playerLocal.firstPerson = true
      this.playerLocal.avatar.visible = false
    } else if (cam.zoom > 0 && this.playerLocal.firstPerson) {
      cam.zoom = 1
      this.playerLocal.firstPerson = false
      this.playerLocal.avatar.visible = true
    }
  }

  processJump() {
    const isXR = this.playerLocal.world.xr?.session
    const { control } = this.playerLocal

    this.playerLocal.jumpDown = isXR ? control.xrRightBtn1.down : control.space.down || control.touchA.down
    if (isXR ? control.xrRightBtn1.pressed : control.space.pressed || control.touchA.pressed) {
      this.playerLocal.jumpPressed = true
    }
  }

  processMovement(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { control, physics, stick, world } = this.playerLocal

    physics.moveDir.set(0, 0, 0)
    if (isXR) {
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
    } else {
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

    if (stick?.active || isXR) {
      this.playerLocal.running = physics.moving && physics.moveDir.length() > 0.9
    } else {
      this.playerLocal.running = physics.moving && (control.shiftLeft.down || control.shiftRight.down)
    }
  }

  applyMovementRotation() {
    const isXR = this.playerLocal.world.xr?.session
    const { physics, cam, base, world } = this.playerLocal

    physics.moveDir.normalize()

    if (isXR) {
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
    e1.copy(world.xr.camera.rotation).reorder('YXZ')
    return e1.y + cam.rotation.y
  }

  applyBodyRotation() {
    const isXR = this.playerLocal.world.xr?.session
    const { physics, cam, base, world, firstPerson, data } = this.playerLocal

    let rotY = isXR ? this.getXRRotation() : cam.rotation.y
    let applyRotY

    if (data.effect?.turn) {
      applyRotY = true
    } else if (physics.moving || firstPerson) {
      applyRotY = true
    }

    if (applyRotY) {
      e1.set(0, rotY, 0)
      q1.setFromEuler(e1)
      const alpha = 1 - Math.pow(0.00000001, 0.016)
      base.quaternion.slerp(q1, alpha)
    }
  }
}
