import { System } from '../System.js'
import { InputDispatcher } from './InputDispatcher.js'
import { ComposableInputHandler } from './ComposableInputHandler.js'
import { TouchInputHandler } from '../controls/TouchInputHandler.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { buildControlTypes } from './InputSystemFactories.js'
import { bindInputControl, releaseAllButtons, buildActions } from './InputSystemBinding.js'

const logger = new StructuredLogger('InputSystem')
const isBrowser = typeof window !== 'undefined'

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }
  set(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
    return this
  }
}

export class InputSystem extends System {
  static DEPS = { events: 'events', camera: 'camera' }
  static EVENTS = { xrSession: 'onXRSession' }

  constructor(world) {
    super(world)
    this.controls = []
    this.actions = []
    this.buttonsDown = new Set()
    this.isUserGesture = false
    this.pointer = { locked: false, shouldLock: false, coords: new Vec3(), position: new Vec3(), delta: new Vec3() }
    this.screen = { width: 0, height: 0 }
    this.scroll = { delta: 0 }
    this.xrSession = null
    this.touchHandler = new TouchInputHandler(this)
    this.dispatcher = new InputDispatcher()
    this.dispatcher.registerHandler('pointer', ComposableInputHandler.createPointerHandler(this))
    this.dispatcher.registerHandler('keyboard', ComposableInputHandler.createKeyboardHandler(this))
    this.dispatcher.registerHandler('xr', ComposableInputHandler.createXRHandler(this))
    this.controlTypes = buildControlTypes()
  }

  start() {}

  preFixedUpdate() {
    for (const control of this.controls) {
      if (control.entries.scrollDelta) {
        control.entries.scrollDelta.value = this.scroll.delta
        if (control.entries.scrollDelta.capture) break
      }
    }
    if (this.xrSession) {
      const xrHandler = this.dispatcher.handlers.get('xr')
      if (xrHandler) xrHandler.processInputSources(this.xrSession.inputSources)
    }
  }

  postLateUpdate() {
    this.pointer.delta.set(0, 0, 0)
    this.scroll.delta = 0
    for (const control of this.controls) {
      for (const key in control.entries) {
        const value = control.entries[key]
        if (value.$button) { value.pressed = false; value.released = false }
      }
    }
    const rig = this.world.cameraController?.camera
    if (rig) {
      let written
      for (const control of this.controls) {
        const camera = control.entries.camera
        if (camera?.write && !written && this.camera) {
          rig.position.copy(camera.position)
          rig.quaternion.copy(camera.quaternion)
          this.camera.position.z = camera.zoom
          written = true
        } else if (camera && this.camera) {
          camera.position.copy(rig.position)
          camera.quaternion.copy(rig.quaternion)
          camera.zoom = this.camera.position.z
        }
      }
    }
    const pointerHandler = this.dispatcher.handlers.get('pointer')
    if (pointerHandler) pointerHandler.resetDeltas?.()
    this.touchHandler.resetDeltas()
  }

  async init({ viewport }) {
    if (!isBrowser) return
    this.viewport = viewport
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    const keyboardHandler = this.dispatcher.handlers.get('keyboard')
    const pointerHandler = this.dispatcher.handlers.get('pointer')
    if (keyboardHandler) keyboardHandler.init?.()
    if (pointerHandler) pointerHandler.init?.()
  }

  bind(options = {}) {
    return bindInputControl(this, options)
  }

  releaseAllButtons() {
    releaseAllButtons(this)
  }

  buildActions() {
    buildActions(this)
  }

  setTouchBtn(prop, down) {
    if (down) {
      this.buttonsDown.add(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button) {
          button.pressed = true; button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    } else {
      this.buttonsDown.delete(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      }
    }
  }

  simulateButton(prop, pressed) {
    if (pressed) {
      if (this.buttonsDown.has(prop)) return
      this.buttonsDown.add(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button) {
          button.pressed = true; button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
        const capture = control.onButtonPress?.(prop)
        if (capture) break
      }
    } else {
      if (!this.buttonsDown.has(prop)) return
      this.buttonsDown.delete(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      }
    }
  }

  lockPointer() {
    if (this.pointer.locked) return
    this.pointer.shouldLock = true
    try {
      const lockPromise = this.viewport.requestPointerLock?.()
      if (lockPromise?.catch) {
        lockPromise.catch(() => {
          this.pointer.shouldLock = false
        })
      }
    } catch (e) {
      logger.warn('Failed to request pointer lock', { error: e.message })
      this.pointer.shouldLock = false
    }
  }

  unlockPointer() {
    if (!this.pointer.locked) return
    this.pointer.shouldLock = false
    try {
      document.exitPointerLock()
    } catch (e) {
      logger.warn('Failed to exit pointer lock', { error: e.message })
    }
  }

  isInputFocused() {
    return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
  }

  onXRSession(session) {
    this.xrSession = session
  }

  destroy() {
    if (!isBrowser) return
    const keyboardHandler = this.dispatcher.handlers.get('keyboard')
    const pointerHandler = this.dispatcher.handlers.get('pointer')
    if (keyboardHandler) keyboardHandler.destroy?.()
    if (pointerHandler) pointerHandler.destroy?.()
  }
}
