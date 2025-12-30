import { BaseInputHandler } from './BaseInputHandler.js'

const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'

export class PointerInputHandler extends BaseInputHandler {
  constructor(inputSystem) {
    super(inputSystem)
    this.lmbDown = false
    this.rmbDown = false
    this.isMac = /Mac/.test(navigator.platform)
  }

  init() {
    this.addEventListener(document, 'pointerlockchange', this.onPointerLockChange)
    this.addEventListener(this.inputSystem.viewport, 'pointerdown', this.onPointerDown)
    this.addEventListener(window, 'pointermove', this.onPointerMove)
    this.addEventListener(this.inputSystem.viewport, 'pointerup', this.onPointerUp)
    this.addEventListener(this.inputSystem.viewport, 'pointercancel', this.onPointerUp)
    this.addEventListener(this.inputSystem.viewport, 'wheel', this.onScroll, { passive: false })
    this.addEventListener(document.body, 'contextmenu', this.onContextMenu)
    this.addEventListener(window, 'focus', this.onFocus)
    this.addEventListener(window, 'blur', this.onBlur)
    this.addEventListener(window, 'resize', this.onResize)
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
    this.checkMouseButton(e, LMB, MouseLeft, 'lmbDown')
    this.checkMouseButton(e, RMB, MouseRight, 'rmbDown')
  }

  checkMouseButton(e, mask, buttonKey, stateKey) {
    const pressed = !!(e.buttons & mask)
    if (!this[stateKey] && pressed) {
      this[stateKey] = true
      this.inputSystem.buttonsDown.add(buttonKey)
      for (const control of this.inputSystem.controls) {
        const button = control.entries[buttonKey]
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (this[stateKey] && !pressed) {
      this[stateKey] = false
      this.inputSystem.buttonsDown.delete(buttonKey)
      for (const control of this.inputSystem.controls) {
        const button = control.entries[buttonKey]
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

}
