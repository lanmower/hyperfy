/* Base input handler with automatic event listener tracking and cleanup */

export class BaseInputHandler {
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

  async init() {
    // Template method: subclasses override
  }

  async destroy() {
    // Automatic cleanup of all registered listeners
    for (const { target, event, handler, options } of this.listeners) {
      this.removeEventListener(target, event, handler, options)
    }
    this.listeners = []
  }
}
