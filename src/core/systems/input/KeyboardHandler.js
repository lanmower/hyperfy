import { codeToProp } from '../../extras/buttons.js'
import { ComposableInputHandler } from './ComposableInputHandler.js'

export function createKeyboardHandler(inputSystem) {
  const handler = new ComposableInputHandler(inputSystem)
  const baseInit = handler.init.bind(handler)

  handler.init = function() {
    baseInit()
    const boundKeyDown = this.onKeyDown.bind(this)
    const boundKeyUp = this.onKeyUp.bind(this)
    this.addEventListener(window, 'keydown', boundKeyDown)
    this.addEventListener(window, 'keyup', boundKeyUp)
    this.addEventListener(document, 'keydown', boundKeyDown, true)
    this.addEventListener(document, 'keyup', boundKeyUp, true)
  }

  handler.onKeyDown = e => {
    if (inputSystem.isInputFocused()) return
    const prop = codeToProp[e.code]
    if (!prop) return
    if (inputSystem.buttonsDown.has(prop)) return
    inputSystem.buttonsDown.add(prop)
    for (const control of inputSystem.controls) {
      let button = control.entries[prop]
      if (!button && control[prop]) {
        button = control[prop]
      }
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
      let button = control.entries[prop]
      if (!button && control[prop]) {
        button = control[prop]
      }
      if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      const capture = control.options.onKeyUp?.(e)
      if (capture) break
    }
  }

  return handler
}
