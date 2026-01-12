export class InputStrategy {
  constructor(camera) {
    this.camera = camera
  }

  updateLook(delta, control, context) {
    throw new Error('updateLook() must be implemented by subclass')
  }

  updateZoom(delta, control) {
    throw new Error('updateZoom() must be implemented by subclass')
  }
}
