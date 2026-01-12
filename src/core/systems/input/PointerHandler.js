import { ComposableInputHandler } from './ComposableInputHandler.js'

export function createPointerHandler(inputSystem) {
  const handler = new ComposableInputHandler(inputSystem)
  const baseInit = handler.init.bind(handler)
  const isMac = /Mac/.test(navigator.platform)
  handler.lmbDown = false
  handler.rmbDown = false

  handler.init = function() {
    baseInit()
    this.addEventListener(document, 'pointerlockchange', this.onPointerLockChange.bind(this))
    this.addEventListener(inputSystem.viewport, 'pointerdown', this.onPointerDown.bind(this))
    this.addEventListener(window, 'pointermove', this.onPointerMove.bind(this))
    this.addEventListener(inputSystem.viewport, 'pointerup', this.onPointerUp.bind(this))
    this.addEventListener(inputSystem.viewport, 'pointercancel', this.onPointerUp.bind(this))
    this.addEventListener(inputSystem.viewport, 'wheel', this.onScroll.bind(this), { passive: false })
    this.addEventListener(document.body, 'contextmenu', this.onContextMenu.bind(this))
    this.addEventListener(window, 'focus', this.onFocus.bind(this))
    this.addEventListener(window, 'blur', this.onBlur.bind(this))
    this.addEventListener(window, 'resize', this.onResize.bind(this))
  }

  handler.onPointerLockChange = () => {
    inputSystem.pointer.locked = document.pointerLockElement === inputSystem.viewport
    if (inputSystem.pointer.locked) {
      inputSystem.pointer.shouldLock = false
      inputSystem.events.emit('pointerLocked')
    } else {
      inputSystem.events.emit('pointerUnlocked')
    }
  }

  handler.onPointerDown = e => {
    if (e.isCoreUI) return
    e.preventDefault()
    inputSystem.isUserGesture = true
    handler.checkPointerChanges(e)
    for (const control of inputSystem.controls) {
      const consume = control.options.onPointerDown?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = inputSystem.touchHandler.processTouchStart(control, e)
        if (consume) break
      }
    }
  }

  handler.onPointerMove = e => {
    const x = (e.clientX / inputSystem.screen.width) * 2 - 1
    const y = -(e.clientY / inputSystem.screen.height) * 2 + 1
    inputSystem.pointer.coords.set(x, y, 0)
    inputSystem.pointer.position.set(e.clientX, e.clientY, 0)
    handler.checkPointerChanges(e)
    if (inputSystem.pointer.locked) {
      const movementX = isMac ? e.movementX : e.movementX * 2
      const movementY = isMac ? e.movementY : e.movementY * 2
      inputSystem.pointer.delta.x += movementX
      inputSystem.pointer.delta.y += movementY
    }
    for (const control of inputSystem.controls) {
      const consume = control.options.onPointerMove?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = inputSystem.touchHandler.processTouchMove(control, e)
        if (consume) break
      }
    }
  }

  handler.onPointerUp = e => {
    handler.checkPointerChanges(e)
    for (const control of inputSystem.controls) {
      const consume = control.options.onPointerUp?.(e)
      if (consume) break
      if (e.pointerType === 'touch') {
        const consume = inputSystem.touchHandler.processTouchEnd(control, e)
        if (consume) break
      }
    }
  }

  handler.onScroll = e => {
    e.preventDefault()
    inputSystem.scroll.delta += e.deltaY
  }

  handler.onContextMenu = e => e.preventDefault()

  handler.onResize = () => {
    inputSystem.screen.width = inputSystem.viewport.offsetWidth
    inputSystem.screen.height = inputSystem.viewport.offsetHeight
  }

  handler.onFocus = () => inputSystem.releaseAllButtons()
  handler.onBlur = () => inputSystem.releaseAllButtons()

  handler.checkPointerChanges = e => {
    handler.checkMouseButton(e, 1, 'mouseLeft', 'lmbDown')
    handler.checkMouseButton(e, 2, 'mouseRight', 'rmbDown')
  }

  handler.checkMouseButton = (e, mask, buttonKey, stateKey) => {
    const pressed = !!(e.buttons & mask)
    if (!handler[stateKey] && pressed) {
      handler[stateKey] = true
      inputSystem.buttonsDown.add(buttonKey)
      for (const control of inputSystem.controls) {
        const button = control.entries[buttonKey]
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    if (handler[stateKey] && !pressed) {
      handler[stateKey] = false
      inputSystem.buttonsDown.delete(buttonKey)
      for (const control of inputSystem.controls) {
        const button = control.entries[buttonKey]
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }

  handler.resetDeltas = () => {
    handler.lmbDown = false
    handler.rmbDown = false
  }

  return handler
}
