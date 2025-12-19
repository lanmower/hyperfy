export class XRControllerManager {
  constructor(controls) {
    this.controls = controls
  }

  processInputSources(inputSources) {
    if (!inputSources) return
    inputSources.forEach(src => {
      if (!src.gamepad) return
      if (src.handedness === 'left') this.processLeftController(src)
      if (src.handedness === 'right') this.processRightController(src)
    })
  }

  processLeftController(src) {
    for (const control of this.controls.controls) {
      if (control.entries.xrLeftStick) {
        control.entries.xrLeftStick.value.x = src.gamepad.axes[2]
        control.entries.xrLeftStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrLeftStick.capture) break
      }
      if (control.entries.xrLeftTrigger) {
        this.processButton(control.entries.xrLeftTrigger, src.gamepad.buttons[0].pressed)
        if (control.entries.xrLeftTrigger.capture) break
      }
      if (control.entries.xrLeftBtn1) {
        this.processButton(control.entries.xrLeftBtn1, src.gamepad.buttons[4].pressed)
        if (control.entries.xrLeftBtn1.capture) break
      }
      if (control.entries.xrLeftBtn2) {
        this.processButton(control.entries.xrLeftBtn2, src.gamepad.buttons[5].pressed)
        if (control.entries.xrLeftBtn2.capture) break
      }
    }
  }

  processRightController(src) {
    for (const control of this.controls.controls) {
      if (control.entries.xrRightStick) {
        control.entries.xrRightStick.value.x = src.gamepad.axes[2]
        control.entries.xrRightStick.value.z = src.gamepad.axes[3]
        if (control.entries.xrRightStick.capture) break
      }
      if (control.entries.xrRightTrigger) {
        this.processButton(control.entries.xrRightTrigger, src.gamepad.buttons[0].pressed)
        if (control.entries.xrRightTrigger.capture) break
      }
      if (control.entries.xrRightBtn1) {
        this.processButton(control.entries.xrRightBtn1, src.gamepad.buttons[4].pressed)
        if (control.entries.xrRightBtn1.capture) break
      }
      if (control.entries.xrRightBtn2) {
        this.processButton(control.entries.xrRightBtn2, src.gamepad.buttons[5].pressed)
        if (control.entries.xrRightBtn2.capture) break
      }
    }
  }

  processButton(button, down) {
    if (down && !button.down) { button.pressed = true; button.onPress?.() }
    if (!down && button.down) { button.released = true; button.onRelease?.() }
    button.down = down
  }
}
