import { codeToProp } from '../../extras/buttons.js'
import { ComposableInputHandler } from './ComposableInputHandler.js'

export function createKeyboardHandler(inputSystem) {
  const handler = new ComposableInputHandler(inputSystem)
  const baseInit = handler.init.bind(handler)

  handler.init = function() {
    baseInit()
    this.addEventListener(window, 'keydown', this.onKeyDown.bind(this))
    this.addEventListener(window, 'keyup', this.onKeyUp.bind(this))
  }

  handler.onKeyDown = e => {
    if (inputSystem.isInputFocused()) return
    const prop = codeToProp[e.code]
    if (!prop) return
    if (inputSystem.buttonsDown.has(prop)) return
    inputSystem.buttonsDown.add(prop)
    for (const control of inputSystem.controls) {
      const button = control.entries[prop]
      if (button?.$button) {
        button.pressed = true; button.down = true
        const capture = button.onPress?.()
        if (capture || button.capture) break
      }
      const capture = control.options.onKeyDown?.(e)
      if (capture) break
    }
  }

  handler.onKeyUp = e => {
    if (inputSystem.isInputFocused()) return
    const prop = codeToProp[e.code]
    if (!prop) return
    if (!inputSystem.buttonsDown.has(prop)) return
    inputSystem.buttonsDown.delete(prop)
    for (const control of inputSystem.controls) {
      const button = control.entries[prop]
      if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      const capture = control.options.onKeyUp?.(e)
      if (capture) break
    }
  }

  return handler
}
