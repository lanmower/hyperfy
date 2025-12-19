import { buttons } from '../extras/buttons.js'
import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { createButton, createVector, createValue, createPointer, createScreen, createCamera } from './controls/ControlFactories.js'
import { XRInputHandler } from './controls/XRInputHandler.js'
import { TouchHandler } from './controls/TouchHandler.js'
import { InputEventHandler } from './controls/InputEventHandler.js'
import { PointerLockManager } from './controls/PointerLockManager.js'

const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'
const HandednessLeft = 'left'
const HandednessRight = 'right'

const isBrowser = typeof window !== 'undefined'
let actionIds = 0

export class ClientControls extends System {
  static DEPS = {
    rig: 'rig',
    events: 'events',
    camera: 'camera',
  }

  static EVENTS = {
    xrSession: 'onXRSession',
  }

  constructor(world) {
    super(world)
    this.controls = []
    this.actions = []
    this.buttonsDown = new Set()
    this.isUserGesture = false
    this.isMac = /Mac/.test(navigator.platform)
    this.pointer = {
      locked: false,
      shouldLock: false,
      coords: new THREE.Vector3(),
      position: new THREE.Vector3(),
      delta: new THREE.Vector3(),
    }
    this.touches = new Map()
    this.screen = {
      width: 0,
      height: 0,
    }
    this.scroll = {
      delta: 0,
    }
    this.xrSession = null
    this.lmbDown = false
    this.rmbDown = false
    this.xrInputHandler = new XRInputHandler(this)
    this.touchHandler = new TouchHandler(this)
    this.inputEventHandler = new InputEventHandler(this)
    this.pointerLockManager = new PointerLockManager(this)
    this.controlTypes = {
      mouseLeft: createButton,
      mouseRight: createButton,
      touchStick: createVector,
      scrollDelta: createValue,
      pointer: createPointer,
      screen: createScreen,
      camera: createCamera,
      xrLeftStick: createVector,
      xrLeftTrigger: createButton,
      xrLeftBtn1: createButton,
      xrLeftBtn2: createButton,
      xrRightStick: createVector,
      xrRightTrigger: createButton,
      xrRightBtn1: createButton,
      xrRightBtn2: createButton,
      touchA: createButton,
      touchB: createButton,
    }
  }

  start() {
  }

  preFixedUpdate() {
    for (const control of this.controls) {
      if (control.entries.scrollDelta) {
        control.entries.scrollDelta.value = this.scroll.delta
        if (control.entries.scrollDelta.capture) break
      }
    }
    this.xrInputHandler.processXRInput()
  }

  postLateUpdate() {
    this.pointer.delta.set(0, 0, 0)
    this.scroll.delta = 0
    for (const control of this.controls) {
      for (const key in control.entries) {
        const value = control.entries[key]
        if (value.$button) {
          value.pressed = false
          value.released = false
        }
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
    for (const [id, info] of this.touches) {
      info.delta.set(0, 0, 0)
    }
  }

  async init({ viewport }) {
    if (!isBrowser) return
    this.viewport = viewport
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    window.addEventListener('keydown', this.inputEventHandler.onKeyDown)
    window.addEventListener('keyup', this.inputEventHandler.onKeyUp)
    document.addEventListener('pointerlockchange', this.pointerLockManager.onPointerLockChange)
    this.viewport.addEventListener('pointerdown', this.inputEventHandler.onPointerDown)
    window.addEventListener('pointermove', this.inputEventHandler.onPointerMove)
    this.viewport.addEventListener('pointerup', this.inputEventHandler.onPointerUp)
    this.viewport.addEventListener('pointercancel', this.inputEventHandler.onPointerUp)
    this.viewport.addEventListener('wheel', this.inputEventHandler.onScroll, { passive: false })
    document.body.addEventListener('contextmenu', this.inputEventHandler.onContextMenu)
    this.viewport.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)
  }

  bind(options = {}) {
    const self = this
    const entries = {}
    let reticleSupressor
    const control = {
      options,
      entries,
      actions: null,
      api: {
        hideReticle(value = true) {
          if (reticleSupressor && value) return
          if (!reticleSupressor && !value) return
          if (reticleSupressor) {
            reticleSupressor?.()
            reticleSupressor = null
          } else {
            reticleSupressor = self.world.ui.suppressReticle()
          }
        },
        setActions(value) {
          if (value !== null && !Array.isArray(value)) {
            throw new Error('[control] actions must be null or array')
          }
          control.actions = value
          if (value) {
            for (const action of value) {
              action.id = ++actionIds
            }
          }
          self.buildActions()
        },
        release: () => {
          reticleSupressor?.()
          const idx = self.controls.indexOf(control)
          if (idx === -1) return
          self.controls.splice(idx, 1)
          options.onRelease?.()
        },
      },
    }
    const idx = self.controls.findIndex(c => c.options.priority <= options.priority)
    if (idx === -1) {
      self.controls.push(control)
    } else {
      self.controls.splice(idx, 0, control)
    }
    const controlTypes = self.controlTypes
    return new Proxy(control, {
      get(target, prop) {
        if (prop in target.api) {
          return target.api[prop]
        }
        if (prop in entries) {
          return entries[prop]
        }
        if (buttons.has(prop)) {
          entries[prop] = createButton(self, control, prop)
          return entries[prop]
        }
        const createType = controlTypes[prop]
        if (createType) {
          entries[prop] = createType(self, control, prop)
          return entries[prop]
        }
        return undefined
      },
    })
  }

  releaseAllButtons() {
    for (const control of this.controls) {
      for (const key in control.entries) {
        const value = control.entries[key]
        if (value.$button && value.down) {
          value.released = true
          value.down = false
          value.onRelease?.()
        }
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
          button.pressed = true
          button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    } else {
      this.buttonsDown.delete(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
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
          button.pressed = true
          button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
        const capture = control.onButtonPress?.(prop, text)
        if (capture) break
      }
    } else {
      if (!this.buttonsDown.has(prop)) return
      this.buttonsDown.delete(prop)
      for (const control of this.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  checkPointerChanges(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.lmbDown && lmb) {
      this.lmbDown = true
      this.buttonsDown.add(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.lmbDown && !lmb) {
      this.lmbDown = false
      this.buttonsDown.delete(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
    const rmb = !!(e.buttons & RMB)
    if (!this.rmbDown && rmb) {
      this.rmbDown = true
      this.buttonsDown.add(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.rmbDown && !rmb) {
      this.rmbDown = false
      this.buttonsDown.delete(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  lockPointer = () => this.pointerLockManager.lockPointer()
  unlockPointer = () => this.pointerLockManager.unlockPointer()

  onTouchStart = e => {
    if (e.isCoreUI) return
    e.preventDefault()
  }

  onResize = () => {
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
  }

  onFocus = () => {
    this.releaseAllButtons()
  }

  onBlur = () => {
    this.releaseAllButtons()
  }

  onXRSession = session => {
    this.xrSession = session
  }

  isInputFocused() {
    return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
  }

  destroy() {
    if (!isBrowser) return
    window.removeEventListener('keydown', this.inputEventHandler.onKeyDown)
    window.removeEventListener('keyup', this.inputEventHandler.onKeyUp)
    document.removeEventListener('pointerlockchange', this.pointerLockManager.onPointerLockChange)
    this.viewport.removeEventListener('pointerdown', this.inputEventHandler.onPointerDown)
    window.removeEventListener('pointermove', this.inputEventHandler.onPointerMove)
    this.viewport.removeEventListener('pointerup', this.inputEventHandler.onPointerUp)
    this.viewport.removeEventListener('pointercancel', this.inputEventHandler.onPointerUp)
    this.viewport.removeEventListener('wheel', this.inputEventHandler.onScroll, { passive: false })
    document.body.removeEventListener('contextmenu', this.inputEventHandler.onContextMenu)
    this.viewport.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onBlur)
  }
}
