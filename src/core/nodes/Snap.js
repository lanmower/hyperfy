import * as THREE from '../extras/three.js'
import { Node } from './Node.js'
import { createPropertyProxy } from '../utils/helpers/defineProperty.js'

export class Snap extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'snap'
    this.worldPosition = new THREE.Vector3()
  }

  mount() {
    this.worldPosition.setFromMatrixPosition(this.matrixWorld)
    this.handle = this.ctx.world.snaps?.create(this.worldPosition, !this.ctx.moving)
  }

  commit(didMove) {
    if (didMove) {
      this.worldPosition.setFromMatrixPosition(this.matrixWorld)
      this.handle?.move()
    }
  }

  unmount() {
    this.handle?.destroy()
    this.handle = null
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, {}, super.getProxy())
    }
    return this.proxy
  }
}
