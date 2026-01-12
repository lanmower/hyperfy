/* Input strategy selection and camera look updates */

import { XRInputStrategy } from './input/XRInputStrategy.js'
import { PointerLockInputStrategy } from './input/PointerLockInputStrategy.js'
import { TouchPanInputStrategy } from './input/TouchPanInputStrategy.js'
import { ScrollZoomStrategy } from './input/ScrollZoomStrategy.js'

export class PlayerControllerInput {
  constructor(controller) {
    this.controller = controller
    this.xrStrategy = null
    this.pointerStrategy = null
    this.panStrategy = null
  }

  updateCameraLook(delta, isXR, control, pan) {
    const strategy = this.selectInputStrategy(isXR, control, pan)
    if (strategy) {
      strategy.updateLook(delta, control, { pan })
    }
    const zoomStrategy = new ScrollZoomStrategy(this.controller)
    if (!isXR) {
      zoomStrategy.updateZoom(delta, control)
    }
  }

  selectInputStrategy(isXR, control, pan) {
    if (isXR) {
      if (!this.xrStrategy) this.xrStrategy = new XRInputStrategy(this.controller)
      return this.xrStrategy
    }
    if (control.pointer.locked) {
      if (!this.pointerStrategy) this.pointerStrategy = new PointerLockInputStrategy(this.controller)
      return this.pointerStrategy
    }
    if (pan) {
      if (!this.panStrategy) this.panStrategy = new TouchPanInputStrategy(this.controller)
      return this.panStrategy
    }
    return null
  }

  destroy() {
    this.xrStrategy = null
    this.pointerStrategy = null
    this.panStrategy = null
  }
}
