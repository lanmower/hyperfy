import { v, m } from '../../utils/TempVectors.js'

export class UIInteractionHandler {
  constructor(parent) {
    this.parent = parent
  }

  resolveHit(hit) {
    if (hit?.point) {
      const inverseMatrix = m[0].copy(this.parent.mesh.matrixWorld).invert()
      v[0].copy(hit.point)
        .applyMatrix4(inverseMatrix)
        .multiplyScalar(1 / this.parent._size)
        .sub(this.parent.pivotOffset)
      const x = v[0].x * this.parent._res
      const y = -v[0].y * this.parent._res
      return this.findNodeAt(x, y)
    }
    if (hit?.coords) {
      return this.findNodeAt(hit.coords.x, hit.coords.y)
    }
    return null
  }

  findNodeAt(x, y) {
    const findHitNode = (node, offsetX = 0, offsetY = 0) => {
      if (!node.box || node._display === 'none') return null
      const left = offsetX + node.box.left
      const top = offsetY + node.box.top
      const width = node.box.width
      const height = node.box.height
      if (x < left || x > left + width || y < top || y > top + height) {
        return null
      }
      for (let i = node.children.length - 1; i >= 0; i--) {
        const childHit = findHitNode(node.children[i], offsetX, offsetY)
        if (childHit) return childHit
      }
      return node
    }
    return findHitNode(this.parent)
  }
}
