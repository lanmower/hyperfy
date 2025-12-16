/**
 * Node3D - Base class for 3D geometric nodes
 *
 * Extends Node with 3D-specific properties and methods.
 * Used as parent for Mesh, SkinnedMesh, Group, etc.
 *
 * Provides:
 * - Geometry/material management
 * - Bounds calculation
 * - Raycasting support
 * - Visibility control
 */

import { Node } from '../Node.js'

export class Node3D extends Node {
  constructor(data = {}) {
    super(data)

    // 3D-specific properties
    this.visible = data.visible !== false
    this.castShadow = data.castShadow !== false
    this.receiveShadow = data.receiveShadow !== false
    this.frustumCulled = data.frustumCulled !== false
    this.matrixAutoUpdate = true

    // Geometry data (set by subclasses)
    this.geometry = null
    this.material = null
    this.materials = []

    // Cached bounds
    this.boundsBox = null
    this.boundsSphere = null
  }

  /**
   * Get bounding box
   * @returns {THREE.Box3} Bounding box
   */
  getBounds() {
    // Override in subclasses for specific geometry
    return this.boundsBox
  }

  /**
   * Set visibility
   * @param {boolean} visible - Visibility state
   */
  setVisible(visible) {
    this.visible = visible
  }

  /**
   * Toggle visibility
   */
  toggleVisible() {
    this.visible = !this.visible
  }

  /**
   * Set shadow settings
   * @param {boolean} cast - Cast shadow
   * @param {boolean} receive - Receive shadow
   */
  setShadow(cast, receive) {
    this.castShadow = cast
    this.receiveShadow = receive
  }

  /**
   * Clone the node
   * @returns {Node3D} Cloned node
   */
  clone() {
    const cloned = new this.constructor(this.toJSON())
    return cloned
  }

  /**
   * Get node as JSON
   * @returns {Object} JSON representation
   */
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
