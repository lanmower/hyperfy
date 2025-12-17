import { buttons } from '../../extras/buttons.js'

let actionIds = 0

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

export class ControlFactory {
  constructor(clientControls) {
    this.controls = clientControls
  }

  bind(options = {}) {
    const self = this.controls
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
    for (const control of this.controls.controls) {
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
    this.controls.actions = []
    for (const control of this.controls.controls) {
      const actions = control.actions
      if (actions) {
        for (const action of actions) {
          if (!action.type === 'custom') {
            const idx = this.controls.actions.findIndex(a => a.type === action.type)
            if (idx !== -1) continue
          }
          this.controls.actions.push(action)
        }
      }
    }
    this.controls.events.emit('actions', this.controls.actions)
  }
}
