import { RigidBody } from '../../nodes/RigidBody.js'
import { Collider } from '../../nodes/Collider.js'

export class AppFloorCollider {
  constructor(app) {
    this.app = app
  }

  createFloorColliderIfNeeded(root) {
    if (!root || !this.app.world.physics || this.app.floorCreated) return
    this.app.floorCreated = true
    try {
      window.__DEBUG__ = window.__DEBUG__ || {}
      window.__DEBUG__.floorDebug = { step: 'starting' }
      const rigidbody = new RigidBody({ type: 'static', position: [0, -5, 0] })
      window.__DEBUG__.floorDebug.rigidbodyCreated = true
      const collider = new Collider({
        type: 'box',
        width: 1000,
        height: 10,
        depth: 1000,
        layer: 'environment',
      })
      window.__DEBUG__.floorDebug.colliderCreated = true
      rigidbody.add(collider)
      window.__DEBUG__.floorDebug.colliderAdded = true
      this.app.root.add(rigidbody)
      window.__DEBUG__.floorDebug.addedToRoot = true
      rigidbody.activate?.({ world: this.app.world, entity: this.app })
      window.__DEBUG__.floorDebug.rigidBodyActivated = true
      collider.activate?.({ world: this.app.world, entity: this.app })
      window.__DEBUG__.floorDebug.colliderActivated = true
      rigidbody.mount?.()
      window.__DEBUG__.floorDebug.rigidbodyMounted = true
      collider.mount?.()
      window.__DEBUG__.floorDebug.colliderMounted = true
      window.__DEBUG__.floorDebug.step = 'complete'
    } catch (err) {
      window.__DEBUG__ = window.__DEBUG__ || {}
      window.__DEBUG__.floorDebug = { error: err.message, stack: err.stack }
    }
  }
}
