export class GraphicsXR {
  constructor({ renderer }) {
    this.renderer = renderer
    this.xrSession = null
    this.xrWidth = null
    this.xrHeight = null
    this.xrDimensionsNeeded = false
  }

  init() {
    this.renderer.xr.enabled = true
    this.renderer.xr.setReferenceSpaceType('local-floor')
    this.renderer.xr.setFoveation(1)
  }

  onSessionChange(session) {
    if (session) {
      this.xrSession = session
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = true
    } else {
      this.xrSession = null
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = false
    }
  }

  checkDimensions() {
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    const frame = this.renderer.xr.getFrame()
    if (frame && referenceSpace) {
      const views = frame.getViewerPose(referenceSpace)?.views
      if (views && views.length > 0) {
        const projectionMatrix = views[0].projectionMatrix
        const fovFactor = projectionMatrix[5]
        const renderState = this.xrSession.renderState
        const baseLayer = renderState.baseLayer
        if (baseLayer) {
          this.xrWidth = baseLayer.framebufferWidth
          this.xrHeight = baseLayer.framebufferHeight
          this.xrDimensionsNeeded = false
          console.log({ xrWidth: this.xrWidth, xrHeight: this.xrHeight })
        }
      }
    }
  }

  isPresenting() {
    return this.renderer.xr.isPresenting
  }

  getHeight() {
    return this.xrHeight
  }

  needsDimensionCheck() {
    return this.xrDimensionsNeeded
  }
}
