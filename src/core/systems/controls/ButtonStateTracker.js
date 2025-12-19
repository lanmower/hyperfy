const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'

export class ButtonStateTracker {
  constructor(controls) {
    this.controls = controls
    this.lmbDown = false
    this.rmbDown = false
  }

  checkPointerChanges(e) {
    this.checkLeftMouseButton(e)
    this.checkRightMouseButton(e)
  }

  checkLeftMouseButton(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.lmbDown && lmb) {
      this.lmbDown = true
      this.controls.buttonsDown.add(MouseLeft)
      for (const control of this.controls.controls) {
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
      this.controls.buttonsDown.delete(MouseLeft)
      for (const control of this.controls.controls) {
        const button = control.entries.mouseLeft
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  checkRightMouseButton(e) {
    const rmb = !!(e.buttons & RMB)
    if (!this.rmbDown && rmb) {
      this.rmbDown = true
      this.controls.buttonsDown.add(MouseRight)
      for (const control of this.controls.controls) {
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
      this.controls.buttonsDown.delete(MouseRight)
      for (const control of this.controls.controls) {
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
