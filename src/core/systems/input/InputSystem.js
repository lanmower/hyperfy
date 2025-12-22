import * as THREE from '../../extras/three.js'
import { System } from '../System.js'
import { buttons } from '../../extras/buttons.js'
import { bindRotations } from '../../extras/bindRotations.js'
import { PointerInputHandler } from './PointerInputHandler.js'
import { KeyboardInputHandler } from './KeyboardInputHandler.js'
import { XRInputHandler } from './XRInputHandler.js'
import { TouchInputHandler } from './TouchInputHandler.js'

const isBrowser = typeof window !== 'undefined'

let actionIds = 0

function createButton(controls, control, prop) {
  const down = controls.buttonsDown.has(prop)
  return { $button: true, down, pressed: down, released: false, capture: false, onPress: null, onRelease: null }
}

function createVector() {
  return { $vector: true, value: new THREE.Vector3(), capture: false }
}

function createValue() {
  return { $value: true, value: null, capture: false }
}

function createPointer(controls) {
  const coords = new THREE.Vector3()
  const position = new THREE.Vector3()
  const delta = new THREE.Vector3()
  return {
    get coords() { return coords.copy(controls.pointer.coords) },
    get position() { return position.copy(controls.pointer.position) },
    get delta() { return delta.copy(controls.pointer.delta) },
    get locked() { return controls.pointer.locked },
    lock() { controls.lockPointer() },
    unlock() { controls.unlockPointer() },
  }
}

function createScreen(controls) {
  return {
    $screen: true,
    get width() { return controls.screen.width },
    get height() { return controls.screen.height },
  }
}

function createCamera(controls) {
  const world = controls.world
  if (!world || !world.camera) return { $camera: true, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), rotation: new THREE.Euler(0, 0, 0, 'YXZ'), zoom: 0, write: false }
  const position = new THREE.Vector3().copy(world.rig.position)
  const quaternion = new THREE.Quaternion().copy(world.rig.quaternion)
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ').copy(world.rig.rotation)
  bindRotations(quaternion, rotation)
  const zoom = world.camera.position.z
  return { $camera: true, position, quaternion, rotation, zoom, write: false }
}

export class InputSystem extends System {
  static DEPS = { rig: 'rig', events: 'events', camera: 'camera' }
  static EVENTS = { xrSession: 'onXRSession' }

  constructor(world) {
    super(world)
    this.controls = []
    this.actions = []
    this.buttonsDown = new Set()
    this.isUserGesture = false
    this.pointer = { locked: false, shouldLock: false, coords: new THREE.Vector3(), position: new THREE.Vector3(), delta: new THREE.Vector3() }
    this.screen = { width: 0, height: 0 }
    this.scroll = { delta: 0 }
    this.xrSession = null
    this.pointerHandler = new PointerInputHandler(this)
    this.keyboardHandler = new KeyboardInputHandler(this)
    this.xrHandler = new XRInputHandler(this)
    this.touchHandler = new TouchInputHandler(this)
    this.controlTypes = {
      mouseLeft: createButton, mouseRight: createButton, touchStick: createVector, scrollDelta: createValue,
      pointer: createPointer, screen: createScreen, camera: createCamera, xrLeftStick: createVector,
      xrLeftTrigger: createButton, xrLeftBtn1: createButton, xrLeftBtn2: createButton, xrRightStick: createVector,
      xrRightTrigger: createButton, xrRightBtn1: createButton, xrRightBtn2: createButton, touchA: createButton, touchB: createButton,
    }
  }

  start() {}

  preFixedUpdate() {
    for (const control of this.controls) {
      if (control.entries.scrollDelta) {
        control.entries.scrollDelta.value = this.scroll.delta
        if (control.entries.scrollDelta.capture) break
      }
    }
    if (this.xrSession) this.xrHandler.processInputSources(this.xrSession.inputSources)
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
    let written
    for (const control of this.controls) {
      const camera = control.entries.camera
      if (camera?.write && !written && this.camera) {
        this.rig.position.copy(camera.position)
        this.rig.quaternion.copy(camera.quaternion)
        this.camera.position.z = camera.zoom
        written = true
      } else if (camera && this.camera) {
        camera.position.copy(this.rig.position)
        camera.quaternion.copy(this.rig.quaternion)
        camera.zoom = this.camera.position.z
      }
    }
    this.touchHandler.resetDeltas()
  }

  async init({ viewport }) {
    if (!isBrowser) return
    this.viewport = viewport
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    this.keyboardHandler.init()
    this.pointerHandler.init()
  }

  bind(options = {}) {
    const entries = {}
    let reticleSupressor
    const control = {
      options, entries, actions: null,
      api: {
        hideReticle: (value = true) => {
          if (reticleSupressor && value) return
          if (!reticleSupressor && !value) return
          if (reticleSupressor) { reticleSupressor?.(); reticleSupressor = null }
          else reticleSupressor = this.world.ui.suppressReticle()
        },
        setActions: value => {
          if (value !== null && !Array.isArray(value)) throw new Error('[control] actions must be null or array')
          control.actions = value
          if (value) { for (const action of value) action.id = ++actionIds }
          this.buildActions()
        },
        release: () => {
          reticleSupressor?.()
          const idx = this.controls.indexOf(control)
          if (idx === -1) return
          this.controls.splice(idx, 1)
          options.onRelease?.()
        },
      },
    }
    const idx = this.controls.findIndex(c => c.options.priority <= options.priority)
    if (idx === -1) this.controls.push(control)
    else this.controls.splice(idx, 0, control)
    return new Proxy(control, {
      get: (target, prop) => {
        if (prop in target.api) return target.api[prop]
        if (prop in entries) return entries[prop]
        if (buttons.has(prop)) { entries[prop] = createButton(this, control, prop); return entries[prop] }
        const createType = this.controlTypes[prop]
        if (createType) { entries[prop] = createType(this, control, prop); return entries[prop] }
        return undefined
      },
    })
  }

  releaseAllButtons() {
    for (const control of this.controls) {
      for (const key in control.entries) {
        const value = control.entries[key]
        if (value.$button && value.down) { value.released = true; value.down = false; value.onRelease?.() }
      }
    }
  }

  buildActions() {
    this.actions = []
    for (const control of this.controls) {
      const actions = control.actions
      if (actions) {
        for (const action of actions) {
          if (!action.type === 'custom') {
            const idx = this.actions.findIndex(a => a.type === action.type)
            if (idx !== -1) continue
          }
          this.actions.push(action)
        }
      }
    }
    this.events.emit('actions', this.actions)
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
    this.viewport.requestPointerLock()
  }

  unlockPointer() {
    if (!this.pointer.locked) return
    this.pointer.shouldLock = false
    document.exitPointerLock()
  }

  isInputFocused() {
    return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
  }

  onXRSession(session) {
    this.xrSession = session
  }

  destroy() {
    if (!isBrowser) return
    this.keyboardHandler.destroy()
    this.pointerHandler.destroy()
  }
}
