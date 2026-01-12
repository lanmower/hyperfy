import * as THREE from '../../extras/three.js'
import { v, q, m } from '../../utils/TempVectors.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('TransformSystem')
const EPSILON = 0.000000001

export class TransformSystem {
  constructor(node) {
    this.node = node
  }

  setupTransform(data) {
    this.node.position = new THREE.Vector3()
    this.node.position.fromArray(data.position || [0, 0, 0])
    this.node.quaternion = new THREE.Quaternion()
    this.node.quaternion.fromArray(data.quaternion || [0, 0, 0, 1])
    this.node.rotation = new THREE.Euler().setFromQuaternion(this.node.quaternion)
    this.node.rotation.reorder('YXZ')
    this.node.scale = new THREE.Vector3()
    this.node.scale.fromArray(data.scale || [1, 1, 1])
    this.node.matrix = new THREE.Matrix4()
    this.node.matrixWorld = new THREE.Matrix4()
    this.setupChangeListeners()
  }

  setupChangeListeners() {
    const node = this.node
    try {
      if (node.position && typeof node.position._onChange === 'function') {
        node.position._onChange(() => {
          node.setTransformed()
        })
      }
    } catch (e) {
      logger.warn('Failed to setup position change listener', { error: e.message })
    }
    try {
      if (node.rotation && typeof node.rotation._onChange === 'function') {
        node.rotation._onChange(() => {
          node.quaternion.setFromEuler(node.rotation, false)
          node.setTransformed()
        })
      }
    } catch (e) {
      logger.warn('Failed to setup rotation change listener', { error: e.message })
    }
    try {
      if (node.quaternion && typeof node.quaternion._onChange === 'function') {
        node.quaternion._onChange(() => {
          node.rotation.setFromQuaternion(node.quaternion, undefined, false)
          node.setTransformed()
        })
      }
    } catch (e) {
      logger.warn('Failed to setup quaternion change listener', { error: e.message })
    }
    try {
      if (node.scale && typeof node.scale._onChange === 'function') {
        node.scale._onChange(() => {
          if (node.scale.x === 0 || node.scale.y === 0 || node.scale.z === 0) {
            return node.scale.set(
              node.scale.x || EPSILON,
              node.scale.y || EPSILON,
              node.scale.z || EPSILON
            )
          }
          node.setTransformed()
        })
      }
    } catch (e) {
      logger.warn('Failed to setup scale change listener', { error: e.message })
    }
  }

  setTransformed() {
    if (this.node.isTransformed) return
    this.node.traverse(node => {
      if (node === this.node) {
        node.isTransformed = true
        node.setDirty()
      } else if (node.isDirty) {
        this.node.ctx.world.stage.dirtyNodes.delete(node)
      } else {
        node.isDirty = true
      }
    })
  }

  updateTransform() {
    const node = this.node
    if (node.isTransformed) {
      node.matrix.compose(node.position, node.quaternion, node.scale)
      node.isTransformed = false
    }
    if (node.parent) {
      node.matrixWorld.multiplyMatrices(node.parent.matrixWorld, node.matrix)
    } else {
      node.matrixWorld.copy(node.matrix)
    }
  }

  getWorldPosition(vec3 = v[0]) {
    this.node.matrixWorld.decompose(vec3, q[0], v[1])
    return vec3
  }

  getWorldMatrix(mat = m[0]) {
    return mat.copy(this.node.matrixWorld)
  }
}
