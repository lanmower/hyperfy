/**
 * Player Input Handler
 *
 * Manages all player input handling including keyboard, mouse, touch, and XR.
 * Consolidates input logic from PlayerLocal.
 */

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

    // Input state
    this.jumpPressed = false
    this.jumpDown = false
    this.running = false
    this.firstPerson = false
    this.xrActive = false

    // Touch input state
    this.stick = { center: null, active: false, touch: null }
    this.pan = null
    this.panStart = null

    // Movement state
    this.moveDir = new THREE.Vector3()
    this.moving = false
  }

  /**
   * Initialize the control binding
   */
  initControl(control) {
    this.control = control
  }

  /**
   * Initialize touch stick input
   */
  initTouchStick() {
    // Touch event handling would go here
    // This is a placeholder for the touch interface setup
  }

  /**
   * Update input state
   */
  update(delta, isXR) {
    this.xrActive = isXR

    // Update camera look
    this.updateCameraLook()

    // Update zoom
    this.updateZoom()

    // Handle first-person transitions
    this.updateFirstPerson()

    // Update movement input
    this.updateMovementInput()

    // Update jump input
    this.updateJumpInput()

    // Update running state
    this.updateRunning()
  }

  /**
   * Update camera look based on input
   */
  updateCameraLook() {
    if (!this.control) return

    const { pointerLock, touch, movement } = this.control

    if (pointerLock) {
      // Mouse look with pointer lock
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
      // Touch pan look
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

  /**
   * Update camera zoom (first/third person)
   */
  updateZoom() {
    // Adjust camera zoom based on input
    // Values < 1 = first person, > 1 = third person
    const wheel = this.control?.wheel || 0
    if (wheel !== 0) {
      const newZoom = Math.max(0.1, Math.min(3, (this.camera.zoom || 1) + wheel * ZOOM_SPEED))
      this.camera.zoom = newZoom
      this.camera.updateProjectionMatrix?.()
    }
  }

  /**
   * Update first-person transition
   */
  updateFirstPerson() {
    const zoomThreshold = 0.9
    const wasFirstPerson = this.firstPerson
    this.firstPerson = (this.camera.zoom || 1) < zoomThreshold

    // Transition logic if needed
    if (wasFirstPerson !== this.firstPerson) {
      // Could trigger animation or event here
    }
  }

  /**
   * Update movement input from all sources
   */
  updateMovementInput() {
    const moveInput = new THREE.Vector3()

    if (this.xrActive && this.world.xr?.session) {
      // XR thumbstick input
      moveInput.copy(this.getXRMovementInput())
    } else if (this.stick.active) {
      // Touch stick input
      moveInput.copy(this.getTouchMovementInput())
    } else {
      // Keyboard input
      moveInput.copy(this.getKeyboardMovementInput())
    }

    // Store movement
    this.moveDir.copy(moveInput)
    this.moving = moveInput.length() > STICK_DEAD_ZONE

    // Normalize for consistent speed
    if (this.moving) {
      this.moveDir.normalize()
    }
  }

  /**
   * Get movement from XR controller
   */
  getXRMovementInput() {
    const input = new THREE.Vector3()
    // XR thumbstick logic would go here
    return input
  }

  /**
   * Get movement from touch stick
   */
  getTouchMovementInput() {
    const input = new THREE.Vector3()
    if (!this.stick.center || !this.stick.active) return input

    const dx = (this.stick.x || 0) - (this.stick.center.x || 0)
    const dy = (this.stick.y || 0) - (this.stick.center.y || 0)

    // Normalize to -1 to 1
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > STICK_DEAD_ZONE) {
      input.set(dx / length, 0, dy / length)
    }

    return input
  }

  /**
   * Get movement from keyboard
   */
  getKeyboardMovementInput() {
    const input = new THREE.Vector3()
    const keys = this.control?.keys || {}

    if (keys.w || keys.ArrowUp) input.z -= 1
    if (keys.s || keys.ArrowDown) input.z += 1
    if (keys.a || keys.ArrowLeft) input.x -= 1
    if (keys.d || keys.ArrowRight) input.x += 1

    return input
  }

  /**
   * Update jump input
   */
  updateJumpInput() {
    const wasJumpDown = this.jumpDown
    this.jumpDown = this.control?.keys?.(' ') || false

    // Jump press is rising edge
    this.jumpPressed = this.jumpDown && !wasJumpDown
  }

  /**
   * Update running state
   */
  updateRunning() {
    const shift = this.control?.keys?.shift || false
    const stickExtent = this.stick.active ? this.getStickExtent() : 0

    this.running = shift || stickExtent >= STICK_FULL_EXTENT
  }

  /**
   * Get current stick extent (0-1)
   */
  getStickExtent() {
    if (!this.stick.center) return 0

    const dx = (this.stick.x || 0) - (this.stick.center.x || 0)
    const dy = (this.stick.y || 0) - (this.stick.center.y || 0)

    return Math.min(1, Math.sqrt(dx * dx + dy * dy) / 100)
  }

  /**
   * Get movement direction (already normalized if moving)
   */
  getMovementDirection() {
    return this.moveDir.clone()
  }

  /**
   * Check if jump was pressed (rising edge)
   */
  isJumpPressed() {
    return this.jumpPressed
  }

  /**
   * Check if jump is held down
   */
  isJumpHeld() {
    return this.jumpDown
  }

  /**
   * Check if player is running
   */
  isRunning() {
    return this.running
  }

  /**
   * Check if player is in first-person view
   */
  isFirstPerson() {
    return this.firstPerson
  }
}
