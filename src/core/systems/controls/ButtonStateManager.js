const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'

export class ButtonStateManager {
  constructor(parent) {
    this.parent = parent
    this.lmbDown = false
    this.rmbDown = false
  }

  releaseAllButtons() {
    for (const control of this.parent.controls) {
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

  setTouchBtn(prop, down) {
    if (down) {
      this.parent.buttonsDown.add(prop)
      for (const control of this.parent.controls) {
        const button = control.entries[prop]
        if (button?.$button) {
          button.pressed = true
          button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    } else {
      this.parent.buttonsDown.delete(prop)
      for (const control of this.parent.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  simulateButton(prop, pressed) {
    if (pressed) {
      if (this.parent.buttonsDown.has(prop)) return
      this.parent.buttonsDown.add(prop)
      for (const control of this.parent.controls) {
        const button = control.entries[prop]
        if (button?.$button) {
          button.pressed = true
          button.down = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
        const capture = control.onButtonPress?.(prop, text)
        if (capture) break
      }
    } else {
      if (!this.parent.buttonsDown.has(prop)) return
      this.parent.buttonsDown.delete(prop)
      for (const control of this.parent.controls) {
        const button = control.entries[prop]
        if (button?.$button && button.down) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  checkPointerChanges(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.lmbDown && lmb) {
      this.lmbDown = true
      this.parent.buttonsDown.add(MouseLeft)
      for (const control of this.parent.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.lmbDown && !lmb) {
      this.lmbDown = false
      this.parent.buttonsDown.delete(MouseLeft)
      for (const control of this.parent.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
    const rmb = !!(e.buttons & RMB)
    if (!this.rmbDown && rmb) {
      this.rmbDown = true
      this.parent.buttonsDown.add(MouseRight)
      for (const control of this.parent.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this.rmbDown && !rmb) {
      this.rmbDown = false
      this.parent.buttonsDown.delete(MouseRight)
      for (const control of this.parent.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }
}
