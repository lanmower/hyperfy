

import { Node } from '../Node.js'

export class Node3D extends Node {
  constructor(data = {}) {
    super(data)

    this.visible = data.visible !== false
    this.castShadow = data.castShadow !== false
    this.receiveShadow = data.receiveShadow !== false
    this.frustumCulled = data.frustumCulled !== false
    this.matrixAutoUpdate = true

    this.geometry = null
    this.material = null
    this.materials = []

    this.boundsBox = null
    this.boundsSphere = null
  }

  
  getBounds() {
    return this.boundsBox
  }

  
  setVisible(visible) {
    this.visible = visible
  }

  
  toggleVisible() {
    this.visible = !this.visible
  }

  
  setShadow(cast, receive) {
    this.castShadow = cast
    this.receiveShadow = receive
  }

  
  clone() {
    const cloned = new this.constructor(this.toJSON())
    return cloned
  }

  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position.toArray(),
      quaternion: this.quaternion.toArray(),
      scale: this.scale.toArray(),
      visible: this.visible,
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow,
    }
  }
}
