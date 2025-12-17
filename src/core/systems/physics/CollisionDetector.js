import * as THREE from '../../extras/three.js'

export class CollisionDetector {
  constructor(physics) {
    this.physics = physics
    this.collisions = new Map()
  }

  detect(actor1, actor2) {
    const handle1 = this.physics.getHandle(actor1)
    const handle2 = this.physics.getHandle(actor2)

    if (!handle1 || !handle2) return false

    return this.checkCollision(handle1, handle2)
  }

  checkCollision(handle1, handle2) {
    const contacts = this.physics.getContactsBetween(handle1, handle2)
    return contacts && contacts.length > 0
  }

  getContactPoints(actor1, actor2) {
    const handle1 = this.physics.getHandle(actor1)
    const handle2 = this.physics.getHandle(actor2)

    if (!handle1 || !handle2) return []

    return this.physics.getContactPointsBetween(handle1, handle2)
  }

  registerCollision(key, collision) {
    this.collisions.set(key, collision)
  }

  getCollision(key) {
    return this.collisions.get(key)
  }

  clearCollision(key) {
    this.collisions.delete(key)
  }
}
