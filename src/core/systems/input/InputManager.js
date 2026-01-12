import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('InputManager')

export class InputManager {
  constructor(inputSystem) {
    this.input = inputSystem
    this.boundControls = new Map()
    this.handlers = new Map()
  }

  bind(options = {}) {
    const control = this.input.bind(options)
    const id = Symbol('control-id')
    this.boundControls.set(id, control)
    return {
      ...control,
      release: () => {
        control.api.release()
        this.boundControls.delete(id)
        logger.debug('Control released', { priority: options.priority })
      }
    }
  }

  registerHandler(name, handler) {
    if (this.handlers.has(name)) {
      logger.warn('Handler already registered', { name })
      return false
    }
    this.handlers.set(name, handler)
    logger.debug('Input handler registered', { name })
    return true
  }

  unregisterHandler(name) {
    const removed = this.handlers.delete(name)
    if (removed) {
      logger.debug('Input handler unregistered', { name })
    }
    return removed
  }

  getHandler(name) {
    return this.handlers.get(name)
  }

  getAllHandlers() {
    return Array.from(this.handlers.values())
  }

  setTouchBtn(prop, down) {
    return this.input.setTouchBtn(prop, down)
  }

  simulateButton(prop, pressed) {
    return this.input.simulateButton(prop, pressed)
  }

  lockPointer() {
    return this.input.lockPointer()
  }

  unlockPointer() {
    return this.input.unlockPointer()
  }

  isInputFocused() {
    return this.input.isInputFocused()
  }

  releaseAllButtons() {
    return this.input.releaseAllButtons()
  }

  getPointerState() {
    return {
      locked: this.input.pointer.locked,
      coords: this.input.pointer.coords.clone(),
      position: this.input.pointer.position.clone(),
      delta: this.input.pointer.delta.clone()
    }
  }

  getScreenDimensions() {
    return {
      width: this.input.screen.width,
      height: this.input.screen.height
    }
  }

  getScrollDelta() {
    return this.input.scroll.delta
  }

  getActiveControlCount() {
    return this.boundControls.size
  }

  destroy() {
    for (const [id, control] of this.boundControls) {
      control.api.release()
      this.boundControls.delete(id)
    }
    this.handlers.clear()
    logger.debug('InputManager destroyed', {
      controlsReleased: this.boundControls.size,
      handlersCleared: this.handlers.size
    })
  }
}
