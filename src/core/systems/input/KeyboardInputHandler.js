import { codeToProp } from '../../extras/buttons.js'

export class KeyboardInputHandler {
  constructor(inputSystem) {
    this.inputSystem = inputSystem
  }

  init() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  onKeyDown = e => {
    if (this.inputSystem.isInputFocused()) return
    const prop = codeToProp[e.code]
    if (!prop) return
    if (this.inputSystem.buttonsDown.has(prop)) return
    this.inputSystem.buttonsDown.add(prop)
    for (const control of this.inputSystem.controls) {
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

  onKeyUp = e => {
    if (this.inputSystem.isInputFocused()) return
    const prop = codeToProp[e.code]
    if (!prop) return
    if (!this.inputSystem.buttonsDown.has(prop)) return
    this.inputSystem.buttonsDown.delete(prop)
    for (const control of this.inputSystem.controls) {
      const button = control.entries[prop]
      if (button?.$button && button.down) { button.down = false; button.released = true; button.onRelease?.() }
      const capture = control.options.onKeyUp?.(e)
      if (capture) break
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }
}
