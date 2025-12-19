import { codeToProp } from '../../extras/buttons.js'

export class InputEventHandler {
  constructor(controls) {
    this.controls = controls
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
      const THREE = require('../../extras/three.js')
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
    this.controls.checkPointerChanges(e)
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
    this.controls.checkPointerChanges(e)
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
