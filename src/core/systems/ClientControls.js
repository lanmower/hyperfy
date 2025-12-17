import { isTouch } from '../../client/utils.js'
import { bindRotations } from '../extras/bindRotations.js'
import { buttons, codeToProp } from '../extras/buttons.js'
import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { ButtonStateManager } from './controls/ButtonStateManager.js'
import { ControlBindingManager } from './controls/ControlBindingManager.js'
import { InputEventHandler } from './controls/InputEventHandler.js'
import { PointerLockManager } from './controls/PointerLockManager.js'
import { ControlFactory } from './controls/ControlFactory.js'

const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'
const HandednessLeft = 'left'
const HandednessRight = 'right'

const isBrowser = typeof window !== 'undefined'

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
    this.inputEventHandler = new InputEventHandler(this)
    this.pointerLockManager = new PointerLockManager(this)
    this.controlFactory = new ControlFactory(this)
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
    if (this.xrSession) {
      this.xrSession.inputSources?.forEach(src => {
        if (src.gamepad && src.handedness === HandednessLeft) {
          for (const control of this.controls) {
            if (control.entries.xrLeftStick) {
              control.entries.xrLeftStick.value.x = src.gamepad.axes[2]
              control.entries.xrLeftStick.value.z = src.gamepad.axes[3]
              if (control.entries.xrLeftStick.capture) break
            }
            if (control.entries.xrLeftTrigger) {
              const button = control.entries.xrLeftTrigger
              const down = src.gamepad.buttons[0].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
            if (control.entries.xrLeftBtn1) {
              const button = control.entries.xrLeftBtn1
              const down = src.gamepad.buttons[4].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
            if (control.entries.xrLeftBtn2) {
              const button = control.entries.xrLeftBtn2
              const down = src.gamepad.buttons[5].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
          }
        }
        if (src.gamepad && src.handedness === HandednessRight) {
          for (const control of this.controls) {
            if (control.entries.xrRightStick) {
              control.entries.xrRightStick.value.x = src.gamepad.axes[2]
              control.entries.xrRightStick.value.z = src.gamepad.axes[3]
              if (control.entries.xrRightStick.capture) break
            }
            if (control.entries.xrRightTrigger) {
              const button = control.entries.xrRightTrigger
              const down = src.gamepad.buttons[0].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
            if (control.entries.xrRightBtn1) {
              const button = control.entries.xrRightBtn1
              const down = src.gamepad.buttons[4].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
            if (control.entries.xrRightBtn2) {
              const button = control.entries.xrRightBtn2
              const down = src.gamepad.buttons[5].pressed
              if (down && !button.down) {
                button.pressed = true
                button.onPress?.()
              }
              if (!down && button.down) {
                button.released = true
                button.onRelease?.()
              }
              button.down = down
            }
          }
        }
      })
    }
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
    return this.controlFactory.bind(options)
  }

  releaseAllButtons() {
    return this.controlFactory.releaseAllButtons()
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

  onKeyDown = e => {
    return this.inputEventHandler.onKeyDown(e)
  }

  onKeyUp = e => {
    return this.inputEventHandler.onKeyUp(e)
  }

  onPointerDown = e => {
    return this.inputEventHandler.onPointerDown(e)
  }

  onPointerMove = e => {
    return this.inputEventHandler.onPointerMove(e)
  }

  onPointerUp = e => {
    return this.inputEventHandler.onPointerUp(e)
  }

  checkPointerChanges(e) {
    return this.inputEventHandler.checkPointerChanges(e)
  }

  async lockPointer() {
    return this.pointerLockManager.lockPointer()
  }

  unlockPointer() {
    return this.pointerLockManager.unlockPointer()
  }

  onPointerLockChange = e => {
    return this.pointerLockManager.onPointerLockChange(e)
  }

  onPointerLockStart() {
    return this.pointerLockManager.onPointerLockStart()
  }

  onPointerLockEnd() {
    return this.pointerLockManager.onPointerLockEnd()
  }

  onScroll = e => {
    return this.inputEventHandler.onScroll(e)
  }

  onContextMenu = e => {
    return this.inputEventHandler.onContextMenu(e)
  }

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

function createButton(controls, control, prop) {
  const down = controls.buttonsDown.has(prop)
  const pressed = down
  const released = false
  return {
    $button: true,
    down,
    pressed,
    released,
    capture: false,
    onPress: null,
    onRelease: null,
  }
}

function createVector(controls, control, prop) {
  return {
    $vector: true,
    value: new THREE.Vector3(),
    capture: false,
  }
}

function createValue(controls, control, prop) {
  return {
    $value: true,
    value: null,
    capture: false,
  }
}

function createPointer(controls, control, prop) {
  const coords = new THREE.Vector3() // [0,0] to [1,1]
  const position = new THREE.Vector3() // [0,0] to [viewportWidth,viewportHeight]
  const delta = new THREE.Vector3() // position delta (pixels)
  return {
    get coords() {
      return coords.copy(controls.pointer.coords)
    },
    get position() {
      return position.copy(controls.pointer.position)
    },
    get delta() {
      return delta.copy(controls.pointer.delta)
    },
    get locked() {
      return controls.pointer.locked
    },
    lock() {
      controls.lockPointer()
    },
    unlock() {
      controls.unlockPointer()
    },
  }
}

function createScreen(controls, control) {
  return {
    $screen: true,
    get width() {
      return controls.screen.width
    },
    get height() {
      return controls.screen.height
    },
  }
}

function createCamera(controls, control) {
  const world = controls.world
  const position = new THREE.Vector3().copy(world.rig.position)
  const quaternion = new THREE.Quaternion().copy(world.rig.quaternion)
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ').copy(world.rig.rotation)
  bindRotations(quaternion, rotation)
  const zoom = world.camera.position.z
  return {
    $camera: true,
    position,
    quaternion,
    rotation,
    zoom,
    write: false,
  }
}
