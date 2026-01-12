/* Unified input handling with strategy pattern for pointer, keyboard, touch, XR */

export class InputDispatcher {
  constructor() {
    this.handlers = new Map()
    this.activeStrategy = null
  }

  registerHandler(inputType, handler) {
    this.handlers.set(inputType, handler)
  }

  setActiveStrategy(inputType) {
    this.activeStrategy = this.handlers.get(inputType)
  }

  dispatch(event) {
    if (!this.activeStrategy) return

    const inputType = this.getInputType(event)
    const handler = this.handlers.get(inputType)
    if (handler) handler(event)
  }

  getInputType(event) {
    if (event.pointerType) return 'pointer'
    if (event.key) return 'keyboard'
    if (event.touches) return 'touch'
    return 'unknown'
  }

  addListener(target, eventType, handler) {
    target.addEventListener(eventType, handler)
  }

  removeListener(target, eventType, handler) {
    target.removeEventListener(eventType, handler)
  }

  destroy() {
    this.handlers.clear()
    this.activeStrategy = null
  }
}
