import * as THREE from '../extras/three.js'
import { UIHelper } from '../utils/helpers/Helpers.js'
const { getPivotOffset } = UIHelper

export class UILayoutCalculations {
  constructor(ui) {
    this.ui = ui
    this.pivotOffset = new THREE.Vector3()
  }

  resolveHit(hit) {
    if (hit?.point) {
      const inverseMatrix = new THREE.Matrix4().copy(this.ui.mesh.matrixWorld).invert()
      const hitPoint = new THREE.Vector3().copy(hit.point).applyMatrix4(inverseMatrix).multiplyScalar(1 / this.ui._size).sub(this.pivotOffset)
      const x = hitPoint.x * this.ui._res
      const y = -hitPoint.y * this.ui._res
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
    return findHitNode(this.ui)
  }

  updatePivot() {
    this.pivotOffset.copy(getPivotOffset(this.ui._size, this.ui._pivot, this.ui._res))
  }
}
