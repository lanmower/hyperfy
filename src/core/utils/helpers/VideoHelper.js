export class VideoHelper {
  static applyPivot(geometry, width, height, pivot) {
    if (pivot === 'center') return
    const halfWidth = width / 2
    const halfHeight = height / 2
    switch (pivot) {
      case 'top-left':
        geometry.translate(halfWidth, -halfHeight, 0)
        break
      case 'top-center':
        geometry.translate(0, -halfHeight, 0)
        break
      case 'top-right':
        geometry.translate(-halfWidth, -halfHeight, 0)
        break
      case 'center-left':
        geometry.translate(halfWidth, 0, 0)
        break
      case 'center-right':
        geometry.translate(-halfWidth, 0, 0)
        break
      case 'bottom-left':
        geometry.translate(halfWidth, halfHeight, 0)
        break
      case 'bottom-center':
        geometry.translate(0, halfHeight, 0)
        break
      case 'bottom-right':
        geometry.translate(-halfWidth, halfHeight, 0)
        break
    }
  }
}
