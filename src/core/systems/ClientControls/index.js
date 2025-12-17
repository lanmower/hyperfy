// ClientControls orchestrator

import * as THREE from '../../extras/three.js'
import { System } from '../System.js'
import { InputHandler } from './InputHandler.js'
import { XRHandler } from './XRHandler.js'
import { createControlEntry } from './ControlFactory.js'

const isBrowser = typeof window !== 'undefined'

let actionIds = 0

export class ClientControls extends System {
  // DI Service Constants
  static DEPS = {
    rig: 'rig',
    camera: 'camera',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.controls = []
    this.actions = []
    this.buttonsDown = new Set()
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

    // Initialize sub-systems
    this.inputHandler = new InputHandler(this)
    this.xrHandler = new XRHandler(this)
  }

  // DI Property Getters
  get rig() { return this.getService(ClientControls.DEPS.rig) }
  get camera() { return this.getService(ClientControls.DEPS.camera) }
  get events() { return this.getService(ClientControls.DEPS.events) }

  start() {
    this.xrHandler.init()
  }

  preFixedUpdate() {
    // scroll delta
    for (const control of this.controls) {
      if (control.entries.scrollDelta) {
        control.entries.scrollDelta.value = this.scroll.delta
        if (control.entries.scrollDelta.capture) break
      }
    }
    // xr input
    this.xrHandler.update()
  }

  postLateUpdate() {
    // clear pointer delta
    this.pointer.delta.set(0, 0, 0)
    // clear scroll delta
    this.scroll.delta = 0
    // clear buttons
    for (const control of this.controls) {
      for (const key in control.entries) {
        const value = control.entries[key]
        if (value.$button) {
          value.pressed = false
          value.released = false
        }
      }
    }
    // update camera
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
    // clear touch deltas
    for (const [id, info] of this.touches) {
      info.delta.set(0, 0, 0)
    }
  }

  async init({ viewport }) {
    if (!isBrowser) return
    this.viewport = viewport
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    this.inputHandler.init(viewport)
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
          const idx = this.controls.indexOf(control)
          if (idx === -1) return
          this.controls.splice(idx, 1)
          options.onRelease?.()
        },
      },
    }
    // insert at correct priority level
    const idx = this.controls.findIndex(c => c.options.priority <= options.priority)
    if (idx === -1) {
      this.controls.push(control)
    } else {
      this.controls.splice(idx, 0, control)
    }
    // return proxy api
    return new Proxy(control, {
      get(target, prop) {
        if (prop in target.api) {
          return target.api[prop]
        }
        return createControlEntry(self, target, prop)
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

  destroy() {
    if (!isBrowser) return
    this.inputHandler.destroy()
    this.xrHandler.destroy()
  }
}

export { ClientControls as default }
