import { buttons } from '../../extras/buttons.js'
import { createButton } from './ControlFactories.js'

let actionIds = 0

export class ControlManager {
  constructor(parent) {
    this.parent = parent
  }

  bind(options = {}) {
    const self = this.parent
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
          self.controlManager.buildActions()
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

  buildActions() {
    this.parent.actions = []
    for (const control of this.parent.controls) {
      const actions = control.actions
      if (actions) {
        for (const action of actions) {
          if (!action.type === 'custom') {
            const idx = this.parent.actions.findIndex(a => a.type === action.type)
            if (idx !== -1) continue
          }
          this.parent.actions.push(action)
        }
      }
    }
    this.parent.events.emit('actions', this.parent.actions)
  }
}
