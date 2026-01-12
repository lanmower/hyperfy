import * as THREE from '../../extras/three.js'
import { v } from '../../utils/TempVectors.js'

let forceModes
function getForceMode(mode) {
  if (!forceModes) {
    forceModes = {
      force: PHYSX.PxForceModeEnum.eFORCE,
      impulse: PHYSX.PxForceModeEnum.eIMPULSE,
      acceleration: PHYSX.PxForceModeEnum.eACCELERATION,
      velocityChange: PHYSX.PxForceModeEnum.eVELOCITY_CHANGE,
    }
  }
  return forceModes[mode] || forceModes.force
}

export class PhysicsForces {
  constructor(actor) {
    this.actor = actor
    this._pv1 = null
    this._pv2 = null
  }

  addForce(force, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForce force must be Vector3')
    if (!force.toPxExtVec3) force = v[0].copy(force)
    mode = getForceMode(mode)
    this.actor?.addForce(force.toPxVec3(), mode, true)
  }

  addForceAtPos(force, pos, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForceAtPos force must be Vector3')
    if (!pos?.isVector3) throw new Error('[rigidbody] addForceAtPos force must be Vector3')
    if (!this.actor) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    if (!force.toPxExtVec3) force = v[0].copy(force)
    if (!pos.toPxExtVec3) pos = v[1].copy(pos)
    mode = getForceMode(mode)
    PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
      this.actor,
      force.toPxExtVec3(this._pv1),
      pos.toPxExtVec3(this._pv2),
      mode,
      true
    )
  }

  addForceAtLocalPos(force, pos, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForceAtLocalPos force must be Vector3')
    if (!pos?.isVector3) throw new Error('[rigidbody] addForceAtLocalPos force must be Vector3')
    if (!this.actor) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    if (!force.toPxExtVec3) force = v[0].copy(force)
    if (!pos.toPxExtVec3) pos = v[1].copy(pos)
    mode = getForceMode(mode)
    PHYSX.PxRigidBodyExt.prototype.addForceAtLocalPos(
      this.actor,
      force.toPxExtVec3(this._pv1),
      pos.toPxExtVec3(this._pv2),
      mode,
      true
    )
  }

  addTorque(torque, mode) {
    if (!torque?.isVector3) throw new Error('[rigidbody] addForce torque must be Vector3')
    if (!torque.toPxVec3) torque = v[0].copy(torque)
    mode = getForceMode(mode)
    this.actor?.addTorque(torque.toPxVec3(), mode, true)
  }
}
