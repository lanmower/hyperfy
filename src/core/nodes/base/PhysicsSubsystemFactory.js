/* Physics subsystem factory pattern for RigidBody, Collider nodes */
import * as THREE from '../../extras/three.js'
import { PhysicsForces } from '../physics/PhysicsForces.js'
import { PhysicsProperties } from '../physics/PhysicsProperties.js'

export class PhysicsSubsystemFactory {
  static createForces(actor) {
    return new PhysicsForces(actor)
  }

  static createProperties(actor) {
    return new PhysicsProperties(actor, new THREE.Vector3(), new THREE.Quaternion())
  }

  static initializeRigidBodySubsystems(node) {
    node.shapes = new Set()
    node._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    node.tempVec3 = new THREE.Vector3()
    node.tempQuat = new THREE.Quaternion()
    node.physicsForces = null
    node.physicsProperties = null
    return node
  }

  static attachActor(node, actor) {
    node.actor = actor
    node.physicsForces = this.createForces(actor)
    node.physicsProperties = this.createProperties(actor)
  }

  static cleanupActor(node) {
    if (node.actor) {
      node.actor.release()
      node.actor = null
    }
    node.physicsForces = null
    node.physicsProperties = null
  }
}
