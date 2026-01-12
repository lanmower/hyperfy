import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('InputHelper')

export class InputHelper {
  static registerInput(control, eventType, handler, options = {}) {
    if (!control) {
      logger.warn('registerInput called with null control')
      return null
    }

    const listeners = control._listeners = control._listeners || {}
    if (!listeners[eventType]) {
      listeners[eventType] = []
    }

    const listener = {
      handler,
      once: options.once || false,
      capture: options.capture || false,
      passive: options.passive !== false,
    }

    listeners[eventType].push(listener)
    return () => {
      const idx = listeners[eventType].indexOf(listener)
      if (idx !== -1) listeners[eventType].splice(idx, 1)
    }
  }

  static dispatchInput(control, eventType, data) {
    if (!control) return false

    const listeners = control._listeners?.[eventType] || []
    let handled = false

    for (const listener of listeners) {
      try {
        const result = listener.handler(data)
        if (result === true) {
          handled = true
          if (!listener.passive) break
        }
      } catch (err) {
        logger.error('Input handler error', { eventType, error: err.message })
      }

      if (listener.once) {
        const idx = listeners.indexOf(listener)
        if (idx !== -1) listeners.splice(idx, 1)
      }
    }

    return handled
  }

  static removeAllListeners(control, eventType = null) {
    if (!control._listeners) return

    if (eventType) {
      delete control._listeners[eventType]
    } else {
      for (const key in control._listeners) {
        delete control._listeners[key]
      }
    }
  }

  static normalizeButtonState(buttonState) {
    return {
      down: buttonState.down || false,
      pressed: buttonState.pressed || false,
      released: buttonState.released || false,
      value: buttonState.value || 0,
    }
  }

  static normalizeVectorState(vectorState) {
    return {
      x: vectorState.x || 0,
      y: vectorState.y || 0,
      z: vectorState.z || 0,
      length: Math.sqrt((vectorState.x || 0) ** 2 + (vectorState.y || 0) ** 2 + (vectorState.z || 0) ** 2),
    }
  }

  static mergeInputConfigs(baseConfig, overrideConfig) {
    return {
      ...baseConfig,
      ...overrideConfig,
      buttons: { ...baseConfig.buttons, ...overrideConfig.buttons },
      axes: { ...baseConfig.axes, ...overrideConfig.axes },
    }
  }
}
