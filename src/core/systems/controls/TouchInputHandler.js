export class TouchInputHandler {
  constructor(controls) {
    this.controls = controls
    this.touches = new Map()
  }

  processTouchStart(control, touch) {
    const id = touch.pointerId
    if (!this.touches.has(id)) {
      const info = { id, touch, position: { x: touch.clientX, y: touch.clientY }, delta: { x: 0, y: 0 } }
      this.touches.set(id, info)
      const consume = control.options.onTouch?.(info)
      if (consume) return true
    }
    return false
  }

  processTouchMove(control, touch) {
    const id = touch.pointerId
    const info = this.touches.get(id)
    if (info) {
      const newPos = { x: touch.clientX, y: touch.clientY }
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
    const id = touch.pointerId
    const info = this.touches.get(id)
    if (info) {
      const consume = control.options.onTouchEnd?.(info)
      this.touches.delete(id)
      if (consume) return true
    }
    return false
  }

  resetDeltas() {
    for (const [id, info] of this.touches) {
      info.delta.x = 0
      info.delta.y = 0
    }
  }
}
