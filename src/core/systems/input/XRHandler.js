import { ComposableInputHandler } from './ComposableInputHandler.js'

export function createXRHandler(inputSystem) {
  const handler = new ComposableInputHandler(inputSystem)

  handler.processInputSources = inputSources => {
    if (!inputSources) return
    inputSources.forEach(src => {
      if (!src.gamepad) return
      if (src.handedness === 'left') handler.processLeftController(src)
      if (src.handedness === 'right') handler.processRightController(src)
    })
  }

  handler.processLeftController = src => handler.processController(src, 'Left')
  handler.processRightController = src => handler.processController(src, 'Right')

  handler.processController = (src, side) => {
    const stickKey = `xr${side}Stick`
    const triggerKey = `xr${side}Trigger`
    const btn1Key = `xr${side}Btn1`
    const btn2Key = `xr${side}Btn2`
    for (const control of inputSystem.controls) {
      if (control.entries[stickKey]) {
        control.entries[stickKey].value.x = src.gamepad.axes[2]
        control.entries[stickKey].value.z = src.gamepad.axes[3]
        if (control.entries[stickKey].capture) break
      }
      if (control.entries[triggerKey]) {
        handler.processButton(control.entries[triggerKey], src.gamepad.buttons[0].pressed)
        if (control.entries[triggerKey].capture) break
      }
      if (control.entries[btn1Key]) {
        handler.processButton(control.entries[btn1Key], src.gamepad.buttons[4].pressed)
        if (control.entries[btn1Key].capture) break
      }
      if (control.entries[btn2Key]) {
        handler.processButton(control.entries[btn2Key], src.gamepad.buttons[5].pressed)
        if (control.entries[btn2Key].capture) break
      }
    }
  }

  handler.processButton = (button, down) => {
    if (down && !button.down) { button.pressed = true; button.onPress?.() }
    if (!down && button.down) { button.released = true; button.onRelease?.() }
    button.down = down
  }

  return handler
}
