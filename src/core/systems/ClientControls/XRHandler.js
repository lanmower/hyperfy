
const HandednessLeft = 'left'
const HandednessRight = 'right'

export class XRHandler {
  constructor(controls) {
    this.controls = controls
  }

  init() {
    this.controls.world.on('xrSession', this.onXRSession)
  }

  onXRSession = session => {
    this.controls.xrSession = session
  }

  update() {
    if (!this.controls.xrSession) return
    this.controls.xrSession.inputSources?.forEach(src => {
      if (src.gamepad && src.handedness === HandednessLeft) {
        this.updateLeftController(src)
      }
      if (src.gamepad && src.handedness === HandednessRight) {
        this.updateRightController(src)
      }
    })
  }

  updateLeftController(src) {
    for (const control of this.controls.controls) {
      if (control.entries.xrLeftStick) {
        control.entries.xrLeftStick.value.x = src.gamepad.axes[2]
        control.entries.xrLeftStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrLeftStick.capture) break
      }
      this.updateButton(control, 'xrLeftTrigger', src.gamepad.buttons[0])
      this.updateButton(control, 'xrLeftBtn1', src.gamepad.buttons[4])
      this.updateButton(control, 'xrLeftBtn2', src.gamepad.buttons[5])
    }
  }

  updateRightController(src) {
    for (const control of this.controls.controls) {
      if (control.entries.xrRightStick) {
        control.entries.xrRightStick.value.x = src.gamepad.axes[2]
        control.entries.xrRightStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrRightStick.capture) break
      }
      this.updateButton(control, 'xrRightTrigger', src.gamepad.buttons[0])
      this.updateButton(control, 'xrRightBtn1', src.gamepad.buttons[4])
      this.updateButton(control, 'xrRightBtn2', src.gamepad.buttons[5])
    }
  }

  updateButton(control, key, buttonState) {
    const button = control.entries[key]
    if (!button) return
    const down = buttonState.pressed
    if (down && !button.down) {
      button.pressed = true
      button.onPress?.()
    }
    if (!down && button.down) {
      button.released = true
      button.onRelease?.()
    }
    button.down = down
  }

  destroy() {
  }
}
