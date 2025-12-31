import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('XRGraphicsAdapter')

export class XRGraphicsAdapter {
  constructor(renderer, renderState) {
    this.renderer = renderer
    this.renderState = renderState
  }

  checkDimensions() {
    if (!this.renderState.xrDimensionsNeeded) return
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    const frame = this.renderer.xr.getFrame()
    if (!frame || !referenceSpace) return
    const views = frame.getViewerPose(referenceSpace)?.views
    if (!views?.length) return
    const projectionMatrix = views[0].projectionMatrix
    const fovFactor = projectionMatrix[5]
    const renderState = this.renderState.xrSession.renderState
    const baseLayer = renderState.baseLayer
    if (baseLayer) {
      this.renderState.xrWidth = baseLayer.framebufferWidth
      this.renderState.xrHeight = baseLayer.framebufferHeight
      this.renderState.xrDimensionsNeeded = false
      logger.info('XR dimensions detected', { xrWidth: this.renderState.xrWidth, xrHeight: this.renderState.xrHeight })
    }
  }
}
