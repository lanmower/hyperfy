export class XRInputHandler {
  constructor(inputSystem) {
    this.inputSystem = inputSystem
  }

  init() {}

  processInputSources(inputSources) {
    if (!inputSources) return
    inputSources.forEach(src => {
      if (!src.gamepad) return
      if (src.handedness === 'left') this.processLeftController(src)
      if (src.handedness === 'right') this.processRightController(src)
    })
  }

  processLeftController(src) { this.processController(src, 'Left') }
  processRightController(src) { this.processController(src, 'Right') }

  processController(src, side) {
    const stickKey = `xr${side}Stick`
    const triggerKey = `xr${side}Trigger`
    const btn1Key = `xr${side}Btn1`
    const btn2Key = `xr${side}Btn2`
    for (const control of this.inputSystem.controls) {
      if (control.entries[stickKey]) {
        control.entries[stickKey].value.x = src.gamepad.axes[2]
        control.entries[stickKey].value.z = src.gamepad.axes[3]
        if (control.entries[stickKey].capture) break
      }
      if (control.entries[triggerKey]) {
        this.processButton(control.entries[triggerKey], src.gamepad.buttons[0].pressed)
        if (control.entries[triggerKey].capture) break
      }
      if (control.entries[btn1Key]) {
        this.processButton(control.entries[btn1Key], src.gamepad.buttons[4].pressed)
        if (control.entries[btn1Key].capture) break
      }
      if (control.entries[btn2Key]) {
        this.processButton(control.entries[btn2Key], src.gamepad.buttons[5].pressed)
        if (control.entries[btn2Key].capture) break
      }
    }
  }

  processButton(button, down) {
    if (down && !button.down) { button.pressed = true; button.onPress?.() }
    if (!down && button.down) { button.released = true; button.onRelease?.() }
    button.down = down
  }

  destroy() {}
}
