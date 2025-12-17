import { buttons } from '../../extras/buttons.js'

let actionIds = 0

export class ControlBindingManager {
  constructor(controls, controlTypes) {
    this.controls = controls
    this.controlTypes = controlTypes
    this.actions = []
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
            reticleSupressor = self.controls.world.ui.suppressReticle()
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
          const idx = this.controls.controls.indexOf(control)
          if (idx === -1) return
          this.controls.controls.splice(idx, 1)
          options.onRelease?.()
        },
      },
    }
    const idx = this.controls.controls.findIndex(c => c.options.priority <= options.priority)
    if (idx === -1) {
      this.controls.controls.push(control)
    } else {
      this.controls.controls.splice(idx, 0, control)
    }
    return new Proxy(control, {
      get(target, prop) {
        if (prop in target.api) {
          return target.api[prop]
        }
        if (prop in entries) {
          return entries[prop]
        }
        if (buttons.has(prop)) {
          entries[prop] = this.controls.createButton(self.controls, control, prop)
          return entries[prop]
        }
        const createType = self.controlTypes[prop]
        if (createType) {
          entries[prop] = createType(self.controls, control, prop)
          return entries[prop]
        }
        return undefined
      },
    })
  }

  buildActions() {
    this.actions = []
    for (const control of this.controls.controls) {
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
    this.controls.events.emit('actions', this.actions)
  }

  getActions() {
    return this.actions
  }
}
