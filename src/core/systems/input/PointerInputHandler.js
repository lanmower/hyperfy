const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'

export class PointerInputHandler {
  constructor(inputSystem) {
    this.inputSystem = inputSystem
    this.lmbDown = false
    this.rmbDown = false
    this.isMac = /Mac/.test(navigator.platform)
  }

  init() {
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.inputSystem.viewport.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    this.inputSystem.viewport.addEventListener('pointerup', this.onPointerUp)
    this.inputSystem.viewport.addEventListener('pointercancel', this.onPointerUp)
    this.inputSystem.viewport.addEventListener('wheel', this.onScroll, { passive: false })
    document.body.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)
    window.addEventListener('resize', this.onResize)
  }

  onPointerLockChange = () => {
    this.inputSystem.pointer.locked = document.pointerLockElement === this.inputSystem.viewport
    if (this.inputSystem.pointer.locked) {
      this.inputSystem.pointer.shouldLock = false
      this.inputSystem.events.emit('pointerLocked')
    } else {
      this.inputSystem.events.emit('pointerUnlocked')
    }
  }

  onPointerDown = e => {
    if (e.isCoreUI) return
    e.preventDefault()
    this.inputSystem.isUserGesture = true
    this.checkPointerChanges(e)
    for (const control of this.inputSystem.controls) {
      const consume = control.options.onPointerDown?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.inputSystem.touchHandler.processTouchStart(control, e)
        if (consume) break
      }
    }
  }

  onPointerMove = e => {
    const x = (e.clientX / this.inputSystem.screen.width) * 2 - 1
    const y = -(e.clientY / this.inputSystem.screen.height) * 2 + 1
    this.inputSystem.pointer.coords.set(x, y, 0)
    this.inputSystem.pointer.position.set(e.clientX, e.clientY, 0)
    this.checkPointerChanges(e)
    if (this.inputSystem.pointer.locked) {
      const movementX = this.isMac ? e.movementX : e.movementX * 2
      const movementY = this.isMac ? e.movementY : e.movementY * 2
      this.inputSystem.pointer.delta.x += movementX
      this.inputSystem.pointer.delta.y += movementY
    }
    for (const control of this.inputSystem.controls) {
      const consume = control.options.onPointerMove?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.inputSystem.touchHandler.processTouchMove(control, e)
        if (consume) break
      }
    }
  }

  onPointerUp = e => {
    this.checkPointerChanges(e)
    for (const control of this.inputSystem.controls) {
      const consume = control.options.onPointerUp?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = this.inputSystem.touchHandler.processTouchEnd(control, e)
        if (consume) break
      }
    }
  }

  onScroll = e => {
    e.preventDefault()
    this.inputSystem.scroll.delta += e.deltaY
  }

  onContextMenu = e => e.preventDefault()

  onResize = () => {
    this.inputSystem.screen.width = this.inputSystem.viewport.offsetWidth
    this.inputSystem.screen.height = this.inputSystem.viewport.offsetHeight
  }

  onFocus = () => this.inputSystem.releaseAllButtons()
  onBlur = () => this.inputSystem.releaseAllButtons()

  checkPointerChanges(e) {
    this.checkLeftMouseButton(e)
    this.checkRightMouseButton(e)
  }

  checkLeftMouseButton(e) {
    const lmb = !!(e.buttons & LMB)
    if (!this.lmbDown && lmb) {
      this.lmbDown = true
      this.inputSystem.buttonsDown.add(MouseLeft)
      for (const control of this.inputSystem.controls) {
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
      this.inputSystem.buttonsDown.delete(MouseLeft)
      for (const control of this.inputSystem.controls) {
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
      this.inputSystem.buttonsDown.add(MouseRight)
      for (const control of this.inputSystem.controls) {
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
      this.inputSystem.buttonsDown.delete(MouseRight)
      for (const control of this.inputSystem.controls) {
        const button = control.entries.mouseRight
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  destroy() {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.inputSystem.viewport.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.inputSystem.viewport.removeEventListener('pointerup', this.onPointerUp)
    this.inputSystem.viewport.removeEventListener('pointercancel', this.onPointerUp)
    this.inputSystem.viewport.removeEventListener('wheel', this.onScroll, { passive: false })
    document.body.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onBlur)
    window.removeEventListener('resize', this.onResize)
  }
}
