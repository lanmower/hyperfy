import { BufferedLerpVector3 } from '../../extras/BufferedLerpVector3.js'
import { BufferedLerpQuaternion } from '../../extras/BufferedLerpQuaternion.js'

export class AppNetworkSync {
  constructor(parent) {
    this.parent = parent
    this.networkPos = null
    this.networkQuat = null
    this.networkSca = null
  }

  initialize(root, networkRate) {
    if (root) {
      this.networkPos = new BufferedLerpVector3(root.position, networkRate)
      this.networkQuat = new BufferedLerpQuaternion(root.quaternion, networkRate)
      this.networkSca = new BufferedLerpVector3(root.scale, networkRate)
    }
  }

  update(delta, moverId, currentNetworkId) {
    if (moverId && moverId !== currentNetworkId) {
      this.networkPos?.update(delta)
      this.networkQuat?.update(delta)
      this.networkSca?.update(delta)
    }
  }

  updatePosition(value, hasMover) {
    if (hasMover) {
      this.networkPos?.pushArray(value)
      return false
    }
    return true
  }

  updateQuaternion(value, hasMover) {
    if (hasMover) {
      this.networkQuat?.pushArray(value)
      return false
    }
    return true
  }

  updateScale(value, hasMover) {
    if (hasMover) {
      this.networkSca?.pushArray(value)
      return false
    }
    return true
  }
}
