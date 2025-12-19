export class VideoGeometryHandler {
  constructor(parent) {
    this.parent = parent
  }

  calculateDimensions(instance) {
    const p = this.parent
    let width = p._width
    let height = p._height
    let vidAspect = instance?.width / instance?.height || p._aspect

    if (width === null && height === null) {
      height = 0
      width = 0
    } else if (width !== null && height === null) {
      height = width / vidAspect
    } else if (height !== null && width === null) {
      width = height * vidAspect
    }

    return { width, height, vidAspect }
  }

  createGeometry(width, height, pivot) {
    return this.parent.renderer.createGeometry(width, height, pivot)
  }

  updateGeometry(geometry, instance, width, height, pivot) {
    return this.parent.renderer.updateGeometry(geometry, instance, width, height, pivot)
  }
}
