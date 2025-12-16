// ClientControls input event handling

import { isTouch } from '../../../client/utils.js'
import * as THREE from '../../extras/three.js'

const LMB = 1
const RMB = 2

export class InputHandler {
  constructor(controls) {
    this.controls = controls
  }

  init(viewport) {
    this.viewport = viewport
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    this.viewport.addEventListener('pointerup', this.onPointerUp)
    this.viewport.addEventListener('pointercancel', this.onPointerUp)
    this.viewport.addEventListener('wheel', this.onScroll, { passive: false })
    document.body.addEventListener('contextmenu', this.onContextMenu)
    this.viewport.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)
  }

  onKeyDown = e => {
    if (e.defaultPrevented) return
    if (e.repeat) return
    if (this.isInputFocused()) return
    const code = e.code
    if (code === 'Tab') e.preventDefault()
    const { codeToProp } = require('../../extras/buttons.js')
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
    if (this.isInputFocused()) return
    const code = e.code
    if (code === 'MetaLeft' || code === 'MetaRight') {
      return this.controls.releaseAllButtons()
    }
    const { codeToProp } = require('../../extras/buttons.js')
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
    const rect = this.viewport.getBoundingClientRect()
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
      this.controls.buttonsDown.add('mouseLeft')
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
      this.controls.buttonsDown.delete('mouseLeft')
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
      this.controls.buttonsDown.add('mouseRight')
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
      this.controls.buttonsDown.delete('mouseRight')
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

  async lockPointer() {
    if (isTouch) return
    this.controls.pointer.shouldLock = true
    try {
      await this.viewport.requestPointerLock()
      return true
    } catch (err) {
      console.log('pointerlock denied, too quick?')
      return false
    }
  }

  unlockPointer() {
    this.controls.pointer.shouldLock = false
    if (!this.controls.pointer.locked) return
    document.exitPointerLock()
    this.onPointerLockEnd()
  }

  onPointerLockChange = e => {
    const didPointerLock = !!document.pointerLockElement
    if (didPointerLock) {
      this.onPointerLockStart()
    } else {
      this.onPointerLockEnd()
    }
  }

  onPointerLockStart() {
    if (this.controls.pointer.locked) return
    this.controls.pointer.locked = true
    this.controls.world.events.emit('pointerLockChanged', true)
    if (!this.controls.pointer.shouldLock) this.unlockPointer()
  }

  onPointerLockEnd() {
    if (!this.controls.pointer.locked) return
    this.controls.pointer.locked = false
    this.controls.world.events.emit('pointerLockChanged', false)
  }

  onScroll = e => {
    if (e.isCoreUI) return
    e.preventDefault()
    const isMac = /Mac/.test(navigator.platform)
    let delta = e.shiftKey ? e.deltaX : e.deltaY
    if (!isMac) delta = -delta
    this.controls.scroll.delta += delta
  }

  onContextMenu = e => {
    e.preventDefault()
  }

  onTouchStart = e => {
    if (e.isCoreUI) return
    e.preventDefault()
  }

  onResize = () => {
    this.controls.screen.width = this.viewport.offsetWidth
    this.controls.screen.height = this.viewport.offsetHeight
  }

  onFocus = () => {
    this.controls.releaseAllButtons()
  }

  onBlur = () => {
    this.controls.releaseAllButtons()
  }

  isInputFocused() {
    return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.viewport.removeEventListener('pointerup', this.onPointerUp)
    this.viewport.removeEventListener('pointercancel', this.onPointerUp)
    this.viewport.removeEventListener('wheel', this.onScroll)
    document.body.removeEventListener('contextmenu', this.onContextMenu)
    this.viewport.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onBlur)
  }
}
