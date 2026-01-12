import { InputStrategy } from './InputStrategy.js'
import { clamp } from '../../../utils.js'
import { ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from '../CameraConstants.js'

export class ScrollZoomStrategy extends InputStrategy {
  updateLook(delta, control, context) {
  }

  updateZoom(delta, control) {
    if (!control) return
    this.camera.zoom += -control.scrollDelta.value * ZOOM_SPEED * delta
    this.camera.zoom = clamp(this.camera.zoom, MIN_ZOOM, MAX_ZOOM)
  }
}
