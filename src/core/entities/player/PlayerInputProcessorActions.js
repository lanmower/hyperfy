import { InputConfig } from '../../config/SystemConfig.js'
import { clamp } from '../../utils.js'
import { DEG2RAD } from '../../extras/general.js'
import { POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from './CameraConstants.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z
  }
  copy(v) {
    this.x = v.x; this.y = v.y; this.z = v.z
    return this
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
  normalize() {
    const len = this.length()
    if (len > 0) { this.x /= len; this.y /= len; this.z /= len }
    return this
  }
  applyQuaternion(q) {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix =  qw * x + qy * z - qz * y;
    const iy =  qw * y + qz * x - qx * z;
    const iz =  qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this
  }
  distanceTo(v) {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  set(x, y, z) {
    this.x = x; this.y = y; this.z = z
    return this
  }
}

class Quat {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w
  }
  setFromAxisAngle(axis, angle) {
    const halfAngle = angle / 2, s = Math.sin(halfAngle);
    this.x = axis.x * s; this.y = axis.y * s; this.z = axis.z * s; this.w = Math.cos(halfAngle);
    return this
  }
  setFromEuler(euler) {
    const c1 = Math.cos(euler.x / 2);
    const c2 = Math.cos(euler.y / 2);
    const c3 = Math.cos(euler.z / 2);
    const s1 = Math.sin(euler.x / 2);
    const s2 = Math.sin(euler.y / 2);
    const s3 = Math.sin(euler.z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
    return this;
  }
  copy(q) {
    this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w
    return this
  }
  slerp(q, t) {
    let dot = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    if (dot < 0) { q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w }; dot = -dot; }
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const theta = Math.acos(clampedDot) * t;
    const s = Math.sin(theta), s1 = Math.cos(theta) - dot * s;
    this.x = this.x * s1 + q.x * s;
    this.y = this.y * s1 + q.y * s;
    this.z = this.z * s1 + q.z * s;
    this.w = this.w * s1 + q.w * s;
    return this
  }
}

const UP = new Vec3(0, 1, 0)
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25
const STICK_DEAD_ZONE = InputConfig.STICK_DEAD_ZONE
const { e1, q1 } = SharedVectorPool('PlayerInputProcessorActions', 1, 1, 1)

export class PlayerInputProcessorActions {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
  }

  processCamera(delta) {
    const isXR = this.playerLocal.world.xr?.session
    const { cam, control, pan } = this.playerLocal
    if (!control) return
    if (isXR) {
      cam.rotation.x = 0; cam.rotation.z = 0
      if (control.xrRightStick.value.x === 0) this.playerLocal.didSnapTurn = false
      else if (control.xrRightStick.value.x > 0 && !this.playerLocal.didSnapTurn) {
        cam.rotation.y -= 45 * DEG2RAD; this.playerLocal.didSnapTurn = true
      } else if (control.xrRightStick.value.x < 0 && !this.playerLocal.didSnapTurn) {
        cam.rotation.y += 45 * DEG2RAD; this.playerLocal.didSnapTurn = true
      }
    } else if (control.pointer?.locked) {
      cam.rotation.x += -control.pointer.delta.y * POINTER_LOOK_SPEED * delta
      cam.rotation.y += -control.pointer.delta.x * POINTER_LOOK_SPEED * delta; cam.rotation.z = 0
    } else if (pan) {
      cam.rotation.x += -pan.delta.y * PAN_LOOK_SPEED * delta
      cam.rotation.y += -pan.delta.x * PAN_LOOK_SPEED * delta; cam.rotation.z = 0
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
    const { cam } = this.playerLocal
    if (!cam) return
    if (isXR && !this.playerLocal.xrActive) {
      cam.zoom = 0; this.playerLocal.xrActive = true
    } else if (!isXR && this.playerLocal.xrActive) {
      cam.zoom = InputConfig.DEFAULT_ZOOM; this.playerLocal.xrActive = false
    }
    if (cam.zoom < 1 && !this.playerLocal.firstPerson) {
      cam.zoom = 0; this.playerLocal.firstPerson = true
      if (this.playerLocal.avatar?.raw?.scene) this.playerLocal.avatar.raw.scene.visible = false
      else if (this.playerLocal.avatar?.visible !== undefined) this.playerLocal.avatar.visible = false
    } else if (cam.zoom > 0 && this.playerLocal.firstPerson) {
      cam.zoom = InputConfig.DEFAULT_ZOOM; this.playerLocal.firstPerson = false
      if (this.playerLocal.avatar?.raw?.scene) this.playerLocal.avatar.raw.scene.visible = true
      else if (this.playerLocal.avatar?.visible !== undefined) this.playerLocal.avatar.visible = true
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
    if (!physics || (!control && !isXR && !stick?.active)) return

    if (window.__DEBUG__?.logMovement) {
      window.__DEBUG__.movementLog = window.__DEBUG__.movementLog || [];
      window.__DEBUG__.movementLog.push({
        time: Date.now(),
        control_keyW: control?.keyW?.down,
        physics_moving: physics?.moving,
      });
      if (window.__DEBUG__.movementLog.length > 100) window.__DEBUG__.movementLog.shift();
    }

    physics.moveDir.set(0, 0, 0)
    if (isXR && control) {
      physics.moveDir.x = control.xrLeftStick.value.x
      physics.moveDir.z = control.xrLeftStick.value.z
    } else if (stick?.active) {
      const { x: touchX, y: touchY } = stick.touch.position
      const { x: centerX, y: centerY } = stick.center
      const dx = centerX - touchX, dy = centerY - touchY, distance = Math.sqrt(dx * dx + dy * dy)
      const moveRadius = STICK_OUTER_RADIUS - STICK_INNER_RADIUS
      if (distance > moveRadius) {
        stick.center.x = touchX + (moveRadius * dx) / distance
        stick.center.y = touchY + (moveRadius * dy) / distance
      }
      physics.moveDir.x = (touchX - stick.center.x) / moveRadius
      physics.moveDir.z = (touchY - stick.center.y) / moveRadius
      world.events.emit('stick', stick)
    }
    if (control) {
      const keyWDown = control.keyW?.down
      const keyADown = control.keyA?.down
      const keySDown = control.keyS?.down
      const keyDDown = control.keyD?.down
      const arrowUpDown = control.arrowUp?.down
      const arrowDownDown = control.arrowDown?.down
      const arrowLeftDown = control.arrowLeft?.down
      const arrowRightDown = control.arrowRight?.down

      if (keyWDown || arrowUpDown) physics.moveDir.z -= 1
      if (keySDown || arrowDownDown) physics.moveDir.z += 1
      if (keyADown || arrowLeftDown) physics.moveDir.x -= 1
      if (keyDDown || arrowRightDown) physics.moveDir.x += 1

      if (window.__DEBUG__?.keyboardDebug && (keyWDown || keySDown || keyADown || keyDDown)) {
        window.__DEBUG__.lastKeyboardInput = {
          keyW: keyWDown, keyA: keyADown, keyS: keySDown, keyD: keyDDown,
          moveDir: {x: physics.moveDir.x, z: physics.moveDir.z},
          timestamp: Date.now()
        }
      }
    }
    physics.moving = physics.moveDir.length() > STICK_DEAD_ZONE
  }

  processStickActivation() {
    const { stick } = this.playerLocal
    if (stick && !stick.active) {
      stick.active = stick.center.distanceTo(stick.touch.position) > 3
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
    const { physics, cam, world } = this.playerLocal
    if (!physics || !physics.flyDir || !physics.moveDir) return
    physics.moveDir.normalize()
    if (isXR && world.xr?.camera) {
      physics.flyDir.copy(physics.moveDir).applyQuaternion(world.xr.camera.quaternion)
    } else {
      physics.flyDir.copy(physics.moveDir).applyQuaternion(cam.quaternion)
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
    let rotY, applyRotY
    if (data.effect?.turn) { rotY = isXR ? this.getXRRotation() : cam.rotation.y; applyRotY = true }
    else if (physics?.moving || firstPerson) { rotY = isXR ? this.getXRRotation() : cam.rotation.y; applyRotY = true }
    if (applyRotY) {
      e1.set(0, rotY, 0); q1.setFromEuler(e1)
      const alpha = 1 - Math.pow(0.00000001, delta)
      base.quaternion.slerp(q1, alpha)
    }
  }
}
