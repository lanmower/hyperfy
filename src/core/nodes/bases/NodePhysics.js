

import { Node } from '../Node.js'

export class NodePhysics extends Node {
  constructor(data = {}) {
    super(data)

    this.mass = data.mass || 1
    this.isKinematic = data.isKinematic || false
    this.isStatic = data.isStatic || false
    this.gravity = data.gravity !== false

    this.linearVelocity = data.linearVelocity || [0, 0, 0]
    this.angularVelocity = data.angularVelocity || [0, 0, 0]

    this.shape = data.shape || 'box'
    this.size = data.size || [1, 1, 1]

    this.friction = data.friction !== undefined ? data.friction : 0.4
    this.restitution = data.restitution !== undefined ? data.restitution : 0.3
    this.density = data.density || 1

    this.collisionLayer = data.collisionLayer || 1
    this.collisionMask = data.collisionMask || 0xFFFFFFFF

    this.locked = data.locked || { x: false, y: false, z: false }
    this.constraints = []

    this.physicsBody = null
  }

  
  setBodyType(type) {
    this.isStatic = type === 'static'
    this.isKinematic = type === 'kinematic'
  }

  
  applyForce(force) {
    if (this.physicsBody && typeof this.physicsBody.applyForce === 'function') {
      this.physicsBody.applyForce(force)
    }
  }

  
  applyImpulse(impulse) {
    if (this.physicsBody && typeof this.physicsBody.applyImpulse === 'function') {
      this.physicsBody.applyImpulse(impulse)
    }
  }

  
  setLinearVelocity(velocity) {
    this.linearVelocity = velocity
    if (this.physicsBody && typeof this.physicsBody.setLinearVelocity === 'function') {
      this.physicsBody.setLinearVelocity(velocity)
    }
  }

  
  setAngularVelocity(velocity) {
    this.angularVelocity = velocity
    if (this.physicsBody && typeof this.physicsBody.setAngularVelocity === 'function') {
      this.physicsBody.setAngularVelocity(velocity)
    }
  }

  
  setLocked(locked) {
    this.locked = locked
  }

  
  setCollisionLayer(layer) {
    this.collisionLayer = layer
  }

  
  setCollisionMask(mask) {
    this.collisionMask = mask
  }

  
  getPhysicsBody() {
    return this.physicsBody
  }

  
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
