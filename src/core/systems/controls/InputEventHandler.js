import * as THREE from '../../extras/three.js'
import { codeToProp } from '../../extras/buttons.js'

const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'

export class InputEventHandler {
  constructor(clientControls) {
    this.controls = clientControls
  }

  onKeyDown = e => {
    if (e.repeat) return
    if (this.controls.isInputFocused()) return
    const code = e.code
    if (code === 'MetaLeft' || code === 'MetaRight') {
      return this.controls.releaseAllButtons()
    }
    const prop = codeToProp[code]
    const text = e.key
    this.controls.buttonsDown.add(prop)
    for (const control of this.controls.controls) {
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
  }

  onKeyUp = e => {
    if (e.repeat) return
    if (this.controls.isInputFocused()) return
    const code = e.code
    if (code === 'MetaLeft' || code === 'MetaRight') {
      return this.controls.releaseAllButtons()
    }
    const prop = codeToProp[code]
    this.controls.buttonsDown.delete(prop)
    for (const control of this.controls.controls) {
      const button = control.entries[prop]
      if (button?.$button && button.down) {
        button.down = false
        button.released = true
        button.onRelease?.()
      }
    }
  }

  onPointerDown = e => {
    if (e.isCoreUI) return
    if (e.pointerType === 'touch') {
      e.preventDefault()
      const info = {
        id: e.pointerId,
        position: new THREE.Vector3(e.clientX, e.clientY, 0),
        prevPosition: new THREE.Vector3(e.clientX, e.clientY, 0),
        delta: new THREE.Vector3(),
        pointerType: e.pointerType,
      }
      this.controls.touches.set(e.pointerId, info)
      for (const control of this.controls.controls) {
        const consume = control.options.onTouch?.(info)
        if (consume) break
      }
    }
    this.checkPointerChanges(e)
  }

  onPointerMove = e => {
    if (e.isCoreUI) return
    if (e.pointerType === 'touch') {
      const info = this.controls.touches.get(e.pointerId)
      if (info) {
        info.delta.x += e.clientX - info.prevPosition.x
        info.delta.y += e.clientY - info.prevPosition.y
        info.position.x = e.clientX
        info.position.y = e.clientY
        info.prevPosition.x = e.clientX
        info.prevPosition.y = e.clientY
      }
    }
    const rect = this.controls.viewport.getBoundingClientRect()
    const offsetX = e.pageX - rect.left
    const offsetY = e.pageY - rect.top
    this.controls.pointer.coords.x = Math.max(0, Math.min(1, offsetX / rect.width))
    this.controls.pointer.coords.y = Math.max(0, Math.min(1, offsetY / rect.height))
    this.controls.pointer.position.x = offsetX
    this.controls.pointer.position.y = offsetY
    this.controls.pointer.delta.x += e.movementX
    this.controls.pointer.delta.y += e.movementY
  }

  onPointerUp = e => {
    if (e.isCoreUI) return
    if (e.pointerType === 'touch') {
      const info = this.controls.touches.get(e.pointerId)
      if (info) {
        for (const control of this.controls.controls) {
          const consume = control.options.onTouchEnd?.(info)
          if (consume) break
        }
        this.controls.touches.delete(e.pointerId)
      }
    }
    this.checkPointerChanges(e)
  }

  checkPointerChanges(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.controls.lmbDown && lmb) {
      this.controls.lmbDown = true
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
    if (this.controls.lmbDown && !lmb) {
      this.controls.lmbDown = false
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
    const rmb = !!(e.buttons & RMB)
    if (!this.controls.rmbDown && rmb) {
      this.controls.rmbDown = true
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
    if (this.controls.rmbDown && !rmb) {
      this.controls.rmbDown = false
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

  onScroll = e => {
    if (e.isCoreUI) return
    e.preventDefault()
    let delta = e.shiftKey ? e.deltaX : e.deltaY
    if (!this.controls.isMac) delta = -delta
    this.controls.scroll.delta += delta
  }

  onContextMenu = e => {
    e.preventDefault()
  }
}
