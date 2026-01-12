import { createControlEntry } from './InputSystemFactories.js'

let actionIds = 0

export function bindInputControl(inputSystem, options = {}) {
  const entries = {}
  let reticleSupressor
  const control = {
    options, entries, actions: null,
    api: {
      hideReticle: (value = true) => {
        if (reticleSupressor && value) return
        if (!reticleSupressor && !value) return
        if (reticleSupressor) { reticleSupressor?.(); reticleSupressor = null }
        else reticleSupressor = inputSystem.world.ui.suppressReticle()
      },
      setActions: value => {
        if (value !== null && !Array.isArray(value)) throw new Error('[control] actions must be null or array')
        control.actions = value
        if (value) { for (const action of value) action.id = ++actionIds }
        inputSystem.buildActions()
      },
      release: () => {
        reticleSupressor?.()
        const idx = inputSystem.controls.indexOf(control)
        if (idx === -1) return
        inputSystem.controls.splice(idx, 1)
        options.onRelease?.()
      },
    },
  }
  const idx = inputSystem.controls.findIndex(c => c.options.priority <= options.priority)
  if (idx === -1) inputSystem.controls.push(control)
  else inputSystem.controls.splice(idx, 0, control)
  return new Proxy(control, {
    get: (target, prop) => {
      if (prop === 'entries') return entries
      if (prop in target.api) return target.api[prop]
      if (prop in entries) return entries[prop]
      entries[prop] = createControlEntry(inputSystem, control, prop, inputSystem.controlTypes)
      return entries[prop]
    },
  })
}

export function releaseAllButtons(inputSystem) {
  for (const control of inputSystem.controls) {
    for (const key in control.entries) {
      const value = control.entries[key]
      if (value.$button && value.down) { value.released = true; value.down = false; value.onRelease?.() }
    }
  }
}

export function buildActions(inputSystem) {
  inputSystem.actions = []
  for (const control of inputSystem.controls) {
    const actions = control.actions
    if (actions) {
      for (const action of actions) {
        if (!action.type === 'custom') {
          const idx = inputSystem.actions.findIndex(a => a.type === action.type)
          if (idx !== -1) continue
        }
        inputSystem.actions.push(action)
      }
    }
  }
  inputSystem.events.emit('actions', inputSystem.actions)
}
