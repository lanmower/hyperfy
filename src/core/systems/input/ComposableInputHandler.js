import { createKeyboardHandler } from './KeyboardHandler.js'
import { createPointerHandler } from './PointerHandler.js'
import { createXRHandler } from './XRHandler.js'

export class ComposableInputHandler {
  constructor(inputSystem) {
    this.inputSystem = inputSystem
    this.listeners = []
  }

  addEventListener(target, event, handler, options) {
    target.addEventListener(event, handler, options)
    this.listeners.push({ target, event, handler, options })
  }

  removeEventListener(target, event, handler, options) {
    target.removeEventListener(event, handler, options)
  }

  async init() {}

  async destroy() {
    for (const { target, event, handler, options } of this.listeners) {
      this.removeEventListener(target, event, handler, options)
    }
    this.listeners = []
  }

  static createKeyboardHandler(inputSystem) {
    return createKeyboardHandler(inputSystem)
  }

  static createPointerHandler(inputSystem) {
    return createPointerHandler(inputSystem)
  }

  static createXRHandler(inputSystem) {
    return createXRHandler(inputSystem)
  }
}
