/**
 * NodePhysics - Base class for physics-related nodes
 *
 * Extends Node with physics-specific properties and methods.
 * Used as parent for RigidBody, Collider, Joint, etc.
 *
 * Provides:
 * - Physics simulation properties
 * - Velocity/force management
 * - Collision configuration
 * - Physics constraints
 */

import { Node } from '../Node.js'

export class NodePhysics extends Node {
  constructor(data = {}) {
    super(data)

    // Physics properties
    this.mass = data.mass || 1
    this.isKinematic = data.isKinematic || false
    this.isStatic = data.isStatic || false
    this.gravity = data.gravity !== false

    // Velocity & Forces
    this.linearVelocity = data.linearVelocity || [0, 0, 0]
    this.angularVelocity = data.angularVelocity || [0, 0, 0]

    // Collider properties
    this.shape = data.shape || 'box'
    this.size = data.size || [1, 1, 1]

    // Physics material
    this.friction = data.friction !== undefined ? data.friction : 0.4
    this.restitution = data.restitution !== undefined ? data.restitution : 0.3
    this.density = data.density || 1

    // Collision layers/masks
    this.collisionLayer = data.collisionLayer || 1
    this.collisionMask = data.collisionMask || 0xFFFFFFFF

    // Constraints
    this.locked = data.locked || { x: false, y: false, z: false }
    this.constraints = []

    // Physics body reference (set by physics engine)
    this.physicsBody = null
  }

  /**
   * Set body type
   * @param {string} type - 'static' | 'kinematic' | 'dynamic'
   */
  setBodyType(type) {
    this.isStatic = type === 'static'
    this.isKinematic = type === 'kinematic'
  }

  /**
   * Apply force
   * @param {number[]} force - Force vector [x, y, z]
   */
  applyForce(force) {
    if (this.physicsBody && typeof this.physicsBody.applyForce === 'function') {
      this.physicsBody.applyForce(force)
    }
  }

  /**
   * Apply impulse
   * @param {number[]} impulse - Impulse vector [x, y, z]
   */
  applyImpulse(impulse) {
    if (this.physicsBody && typeof this.physicsBody.applyImpulse === 'function') {
      this.physicsBody.applyImpulse(impulse)
    }
  }

  /**
   * Set velocity
   * @param {number[]} velocity - Velocity vector [x, y, z]
   */
  setLinearVelocity(velocity) {
    this.linearVelocity = velocity
    if (this.physicsBody && typeof this.physicsBody.setLinearVelocity === 'function') {
      this.physicsBody.setLinearVelocity(velocity)
    }
  }

  /**
   * Set angular velocity
   * @param {number[]} velocity - Angular velocity vector [x, y, z]
   */
  setAngularVelocity(velocity) {
    this.angularVelocity = velocity
    if (this.physicsBody && typeof this.physicsBody.setAngularVelocity === 'function') {
      this.physicsBody.setAngularVelocity(velocity)
    }
  }

  /**
   * Lock/unlock axes
   * @param {Object} locked - { x, y, z } boolean flags
   */
  setLocked(locked) {
    this.locked = locked
  }

  /**
   * Set collision layer
   * @param {number} layer - Layer number
   */
  setCollisionLayer(layer) {
    this.collisionLayer = layer
  }

  /**
   * Set collision mask
   * @param {number} mask - Mask number
   */
  setCollisionMask(mask) {
    this.collisionMask = mask
  }

  /**
   * Get physics body
   * @returns {Object} Physics body reference
   */
  getPhysicsBody() {
    return this.physicsBody
  }

  /**
   * Get physics properties as JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      mass: this.mass,
      isKinematic: this.isKinematic,
      isStatic: this.isStatic,
      shape: this.shape,
      size: this.size,
      friction: this.friction,
      restitution: this.restitution,
    }
  }
}
