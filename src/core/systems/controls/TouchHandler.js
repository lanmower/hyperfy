export class TouchHandler {
  constructor(clientControls) {
    this.clientControls = clientControls
  }

  onTouchStart = e => {
    if (e.isCoreUI) return
    e.preventDefault()
  }

  processTouchInput(control, touch) {
    const { touches } = this.clientControls
    const id = touch.identifier

    if (!touches.has(id)) {
      const info = {
        id,
        touch,
        position: this.getTouchPosition(touch),
        delta: { x: 0, y: 0 },
      }
      touches.set(id, info)

      const consume = control.options.onTouch?.(info)
      if (consume) return true
    }
    return false
  }

  processTouchMove(control, touch) {
    const { touches } = this.clientControls
    const id = touch.identifier
    const info = touches.get(id)

    if (info) {
      const newPos = this.getTouchPosition(touch)
      info.delta.x = newPos.x - info.position.x
      info.delta.y = newPos.y - info.position.y
      info.position.x = newPos.x
      info.position.y = newPos.y

      const consume = control.options.onTouchMove?.(info)
      if (consume) return true
    }
    return false
  }

  processTouchEnd(control, touch) {
    const { touches } = this.clientControls
    const id = touch.identifier
    const info = touches.get(id)

    if (info) {
      const consume = control.options.onTouchEnd?.(info)
      touches.delete(id)
      if (consume) return true
    }
    return false
  }

  getTouchPosition(touch) {
    return {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }
}
