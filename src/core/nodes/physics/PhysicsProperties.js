import * as THREE from '../../extras/three.js'

export class PhysicsProperties {
  constructor(actor, tempVec3, tempQuat) {
    this.actor = actor
    this.tempVec3 = tempVec3
    this.tempQuat = tempQuat
  }

  get sleeping() {
    if (!this.actor) return false
    return this.actor.isSleeping()
  }

  getPosition(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    const pose = this.actor.getGlobalPose()
    vec3.copy(pose.p)
    return vec3
  }

  setPosition(vec3) {
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    vec3.toPxTransform(pose)
    this.actor.setGlobalPose(pose)
  }

  getQuaternion(quat) {
    if (!quat) quat = this.tempQuat
    if (!this.actor) return quat.set(0, 0, 0)
    const pose = this.actor.getGlobalPose()
    quat.copy(pose.q)
    return quat
  }

  setQuaternion(quat) {
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    quat.toPxTransform(pose)
    this.actor.setGlobalPose(pose)
  }

  getLinearVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.fromPxVec3(this.actor.getLinearVelocity())
  }

  setLinearVelocity(vec3) {
    this.actor?.setLinearVelocity?.(vec3.toPxVec3())
  }

  getAngularVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.fromPxVec3(this.actor.getAngularVelocity())
  }

  setAngularVelocity(vec3) {
    this.actor?.setAngularVelocity?.(vec3.toPxVec3())
  }

  getVelocityAtPos(pos, vec3) {
    if (!pos?.isVector3) throw new Error('[rigidbody] getVelocityAtPos pos must be Vector3')
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.copy(PHYSX.PxRigidBodyExt.prototype.getVelocityAtPos(this.actor, pos.toPxVec3()))
  }

  getLocalVelocityAtLocalPos(pos, vec3) {
    if (!pos?.isVector3) throw new Error('[rigidbody] getVelocityAtLocalPos pos must be Vector3')
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.copy(PHYSX.PxRigidBodyExt.prototype.getLocalVelocityAtLocalPos(this.actor, pos.toPxVec3()))
  }

  setCenterOfMass(pos, callback) {
    if (!pos?.isVector3) throw new Error('[rigidbody] setCenterOfMass pos must be Vector3')
    callback({ _centerOfMass: pos.clone(), needsRebuild: true })
  }

  setKinematicTarget(position, quaternion, tm) {
    position.toPxTransform(tm)
    quaternion.toPxTransform(tm)
    this.actor?.setKinematicTarget(tm)
  }
}
