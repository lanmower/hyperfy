import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { buttons } from '../extras/buttons.js'
import { bindRotations } from '../extras/bindRotations.js'

const isBrowser = typeof window !== 'undefined'
const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'
const HandednessLeft = 'left'
const HandednessRight = 'right'

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
  const position = new THREE.Vector3().copy(world.rig.position)
  const quaternion = new THREE.Quaternion().copy(world.rig.quaternion)
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ').copy(world.rig.rotation)
  bindRotations(quaternion, rotation)
  const zoom = world.camera.position.z
  return { $camera: true, position, quaternion, rotation, zoom, write: false }
}

export class ClientControls extends System {
  static DEPS = { rig: 'rig', events: 'events', camera: 'camera' }
  static EVENTS = { xrSession: 'onXRSession' }

  constructor(world) {
    super(world)
    this.controls = []
    this.actions = []
    this.buttonsDown = new Set()
    this.isUserGesture = false
    this.isMac = /Mac/.test(navigator.platform)
    this.pointer = { locked: false, shouldLock: false, coords: new THREE.Vector3(), position: new THREE.Vector3(), delta: new THREE.Vector3() }
    this.touches = new Map()
    this.screen = { width: 0, height: 0 }
    this.scroll = { delta: 0 }
    this.xrSession = null
    this.lmbDown = false
    this.rmbDown = false
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
    if (this.xrSession) {
      this.xrSession.inputSources?.forEach(src => {
        if (src.gamepad && src.handedness === HandednessLeft) this.processLeftController(src)
        if (src.gamepad && src.handedness === HandednessRight) this.processRightController(src)
      })
    }
  }

  processLeftController(src) {
    for (const control of this.controls) {
      if (control.entries.xrLeftStick) {
        control.entries.xrLeftStick.value.x = src.gamepad.axes[2]
        control.entries.xrLeftStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrLeftStick.capture) break
      }
      if (control.entries.xrLeftTrigger) {
        this.processXRButton(control.entries.xrLeftTrigger, src.gamepad.buttons[0].pressed)
        if (control.entries.xrLeftTrigger.capture) break
      }
      if (control.entries.xrLeftBtn1) {
        this.processXRButton(control.entries.xrLeftBtn1, src.gamepad.buttons[4].pressed)
        if (control.entries.xrLeftBtn1.capture) break
      }
      if (control.entries.xrLeftBtn2) {
        this.processXRButton(control.entries.xrLeftBtn2, src.gamepad.buttons[5].pressed)
        if (control.entries.xrLeftBtn2.capture) break
      }
    }
  }

  processRightController(src) {
    for (const control of this.controls) {
      if (control.entries.xrRightStick) {
        control.entries.xrRightStick.value.x = src.gamepad.axes[2]
        control.entries.xrRightStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrRightStick.capture) break
      }
      if (control.entries.xrRightTrigger) {
        this.processXRButton(control.entries.xrRightTrigger, src.gamepad.buttons[0].pressed)
        if (control.entries.xrRightTrigger.capture) break
      }
      if (control.entries.xrRightBtn1) {
        this.processXRButton(control.entries.xrRightBtn1, src.gamepad.buttons[4].pressed)
        if (control.entries.xrRightBtn1.capture) break
      }
      if (control.entries.xrRightBtn2) {
        this.processXRButton(control.entries.xrRightBtn2, src.gamepad.buttons[5].pressed)
        if (control.entries.xrRightBtn2.capture) break
      }
    }
  }

  processXRButton(button, down) {
    if (down && !button.down) { button.pressed = true; button.onPress?.() }
    if (!down && button.down) { button.released = true; button.onRelease?.() }
    button.down = down
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
      if (camera?.write && !written) {
        this.rig.position.copy(camera.position)
        this.rig.quaternion.copy(camera.quaternion)
        this.camera.position.z = camera.zoom
        written = true
      } else if (camera) {
        camera.position.copy(this.rig.position)
        camera.quaternion.copy(this.rig.quaternion)
        camera.zoom = this.camera.position.z
      }
    }
    for (const [id, info] of this.touches) info.delta.set(0, 0, 0)
  }

  async init({ viewport }) {
    if (!isBrowser) return
    this.viewport = viewport
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    this.viewport.addEventListener('pointerup', this.onPointerUp)
    this.viewport.addEventListener('pointercancel', this.onPointerUp)
    this.viewport.addEventListener('wheel', this.onScroll, { passive: false })
    document.body.addEventListener('contextmenu', this.onContextMenu)
    this.viewport.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)
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

  checkPointerChanges(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.lmbDown && lmb) {
      this.lmbDown = true; this.buttonsDown.add(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = true; button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.lmbDown && !lmb) {
      this.lmbDown = false; this.buttonsDown.delete(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft
        if (button) { button.down = false; button.released = true; button.onRelease?.() }
      }
    }
    const rmb = !!(e.buttons & RMB)
    if (!this.rmbDown && rmb) {
      this.rmbDown = true; this.buttonsDown.add(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = true; button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.rmbDown && !rmb) {
      this.rmbDown = false; this.buttonsDown.delete(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight
        if (button) { button.down = false; button.released = true; button.onRelease?.() }
      }
    }
  }

  lockPointer = () => {
    if (this.pointer.locked) return
    this.pointer.shouldLock = true
    this.viewport.requestPointerLock()
  }

  unlockPointer = () => {
    if (!this.pointer.locked) return
    this.pointer.shouldLock = false
    document.exitPointerLock()
  }

  onPointerLockChange = () => {
    this.pointer.locked = document.pointerLockElement === this.viewport
    if (this.pointer.locked) {
      this.pointer.shouldLock = false
      this.events.emit('pointerLocked')
    } else {
      this.events.emit('pointerUnlocked')
    }
  }

  onKeyDown = e => {
    if (this.isInputFocused()) return
    const prop = e.code
    if (this.buttonsDown.has(prop)) return
    this.buttonsDown.add(prop)
    for (const control of this.controls) {
      const button = control.entries[prop]
      if (button?.$button) {
        button.pressed = true; button.down = true
        const capture = button.onPress?.()
        if (capture || button.capture) break
      }
      const capture = control.options.onKeyDown?.(e)
      if (capture) break
    }
  }

  onKeyUp = e => {
    if (this.isInputFocused()) return
    const prop = e.code
    if (!this.buttonsDown.has(prop)) return
    this.buttonsDown.delete(prop)
    for (const control of this.controls) {
      const button = control.entries[prop]
      if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      const capture = control.options.onKeyUp?.(e)
      if (capture) break
    }
  }

  onPointerDown = e => {
    if (e.isCoreUI) return
    e.preventDefault()
    this.isUserGesture = true
    this.checkPointerChanges(e)
    for (const control of this.controls) {
      const consume = control.options.onPointerDown?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.processTouchStart(control, e)
        if (consume) break
      }
    }
  }

  onPointerMove = e => {
    const x = (e.clientX / this.screen.width) * 2 - 1
    const y = -(e.clientY / this.screen.height) * 2 + 1
    this.pointer.coords.set(x, y, 0)
    this.pointer.position.set(e.clientX, e.clientY, 0)
    this.checkPointerChanges(e)
    if (this.pointer.locked) {
      const movementX = this.isMac ? e.movementX : e.movementX * 2
      const movementY = this.isMac ? e.movementY : e.movementY * 2
      this.pointer.delta.x += movementX
      this.pointer.delta.y += movementY
    }
    for (const control of this.controls) {
      const consume = control.options.onPointerMove?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.processTouchMove(control, e)
        if (consume) break
      }
    }
  }

  onPointerUp = e => {
    this.checkPointerChanges(e)
    for (const control of this.controls) {
      const consume = control.options.onPointerUp?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.processTouchEnd(control, e)
        if (consume) break
      }
    }
  }

  onScroll = e => {
    e.preventDefault()
    this.scroll.delta += e.deltaY
  }

  onContextMenu = e => e.preventDefault()

  processTouchStart(control, touch) {
    const id = touch.pointerId
    if (!this.touches.has(id)) {
      const info = { id, touch, position: { x: touch.clientX, y: touch.clientY }, delta: { x: 0, y: 0 } }
      this.touches.set(id, info)
      const consume = control.options.onTouch?.(info)
      if (consume) return true
    }
    return false
  }

  processTouchMove(control, touch) {
    const id = touch.pointerId
    const info = this.touches.get(id)
    if (info) {
      const newPos = { x: touch.clientX, y: touch.clientY }
      info.delta.x = newPos.x - info.position.x
      info.delta.y = newPos.y - info.position.y
      info.position.x = newPos.x
      info.position.y = newPos.y
      const consume = control.options.onTouchMove?.(info)
      if (consume) return true
    }
    return false
  }

  processTouchEnd(control, touch) {
    const id = touch.pointerId
    const info = this.touches.get(id)
    if (info) {
      const consume = control.options.onTouchEnd?.(info)
      this.touches.delete(id)
      if (consume) return true
    }
    return false
  }

  onTouchStart = e => {
    if (e.isCoreUI) return
    e.preventDefault()
  }

  onResize = () => {
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
  }

  onFocus = () => this.releaseAllButtons()
  onBlur = () => this.releaseAllButtons()
  onXRSession = session => { this.xrSession = session }
  isInputFocused() { return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' }

  destroy() {
    if (!isBrowser) return
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.viewport.removeEventListener('pointerup', this.onPointerUp)
    this.viewport.removeEventListener('pointercancel', this.onPointerUp)
    this.viewport.removeEventListener('wheel', this.onScroll, { passive: false })
    document.body.removeEventListener('contextmenu', this.onContextMenu)
    this.viewport.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onBlur)
  }
}
