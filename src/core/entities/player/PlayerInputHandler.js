
import * as THREE from '../../extras/three.js'

const POINTER_LOOK_SPEED = 0.001
const PAN_LOOK_SPEED = 0.002
const ZOOM_SPEED = 0.02
const STICK_DEAD_ZONE = 0.2
const STICK_FULL_EXTENT = 0.8
const TOUCH_MOVE_THRESHOLD = 20

export class PlayerInputHandler {
  constructor(camera, world) {
    this.camera = camera
    this.world = world

    this.jumpPressed = false
    this.jumpDown = false
    this.running = false
    this.firstPerson = false
    this.xrActive = false

    this.stick = { center: null, active: false, touch: null }
    this.pan = null
    this.panStart = null

    this.moveDir = new THREE.Vector3()
    this.moving = false
  }

  initControl(control) {
    this.control = control
  }

  initTouchStick() {
  }

  update(delta, isXR) {
    this.xrActive = isXR

    this.updateCameraLook()

    this.updateZoom()

    this.updateFirstPerson()

    this.updateMovementInput()

    this.updateJumpInput()

    this.updateRunning()
  }

  updateCameraLook() {
    if (!this.control) return

    const { pointerLock, touch, movement } = this.control

    if (pointerLock) {
      const dx = movement.x || 0
      const dy = movement.y || 0

      const euler = new THREE.Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(this.camera.quaternion)
      euler.setFromVector3(new THREE.Vector3(
        euler.x - dy * POINTER_LOOK_SPEED,
        euler.y - dx * POINTER_LOOK_SPEED,
        0
      ))
      this.camera.quaternion.setFromEuler(euler)
    } else if (this.pan && this.panStart) {
      const dx = (this.pan.x || 0) - (this.panStart.x || 0)
      const dy = (this.pan.y || 0) - (this.panStart.y || 0)

      const euler = new THREE.Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(this.camera.quaternion)
      euler.setFromVector3(new THREE.Vector3(
        euler.x - dy * PAN_LOOK_SPEED,
        euler.y - dx * PAN_LOOK_SPEED,
        0
      ))
      this.camera.quaternion.setFromEuler(euler)
      this.panStart = { ...this.pan }
    }
  }

  updateZoom() {
    const wheel = this.control?.wheel || 0
    if (wheel !== 0) {
      const newZoom = Math.max(0.1, Math.min(3, (this.camera.zoom || 1) + wheel * ZOOM_SPEED))
      this.camera.zoom = newZoom
      this.camera.updateProjectionMatrix?.()
    }
  }

  updateFirstPerson() {
    const zoomThreshold = 0.9
    const wasFirstPerson = this.firstPerson
    this.firstPerson = (this.camera.zoom || 1) < zoomThreshold

    if (wasFirstPerson !== this.firstPerson) {
    }
  }

  updateMovementInput() {
    const moveInput = new THREE.Vector3()

    if (this.xrActive && this.world.xr?.session) {
      moveInput.copy(this.getXRMovementInput())
    } else if (this.stick.active) {
      moveInput.copy(this.getTouchMovementInput())
    } else {
      moveInput.copy(this.getKeyboardMovementInput())
    }

    this.moveDir.copy(moveInput)
    this.moving = moveInput.length() > STICK_DEAD_ZONE

    if (this.moving) {
      this.moveDir.normalize()
    }
  }

  getXRMovementInput() {
    const input = new THREE.Vector3()
    return input
  }

  getTouchMovementInput() {
    const input = new THREE.Vector3()
    if (!this.stick.center || !this.stick.active) return input

    const dx = (this.stick.x || 0) - (this.stick.center.x || 0)
    const dy = (this.stick.y || 0) - (this.stick.center.y || 0)

    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > STICK_DEAD_ZONE) {
      input.set(dx / length, 0, dy / length)
    }

    return input
  }

  getKeyboardMovementInput() {
    const input = new THREE.Vector3()
    const keys = this.control?.keys || {}

    if (keys.w || keys.ArrowUp) input.z -= 1
    if (keys.s || keys.ArrowDown) input.z += 1
    if (keys.a || keys.ArrowLeft) input.x -= 1
    if (keys.d || keys.ArrowRight) input.x += 1

    return input
  }

  updateJumpInput() {
    const wasJumpDown = this.jumpDown
    this.jumpDown = this.control?.keys?.(' ') || false

    this.jumpPressed = this.jumpDown && !wasJumpDown
  }

  updateRunning() {
    const shift = this.control?.keys?.shift || false
    const stickExtent = this.stick.active ? this.getStickExtent() : 0

    this.running = shift || stickExtent >= STICK_FULL_EXTENT
  }

  getStickExtent() {
    if (!this.stick.center) return 0

    const dx = (this.stick.x || 0) - (this.stick.center.x || 0)
    const dy = (this.stick.y || 0) - (this.stick.center.y || 0)

    return Math.min(1, Math.sqrt(dx * dx + dy * dy) / 100)
  }

  getMovementDirection() {
    return this.moveDir.clone()
  }

  isJumpPressed() {
    return this.jumpPressed
  }

  isJumpHeld() {
    return this.jumpDown
  }

  isRunning() {
    return this.running
  }

  isFirstPerson() {
    return this.firstPerson
  }
}
