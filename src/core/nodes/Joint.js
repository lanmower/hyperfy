import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { bindRotations } from '../extras/bindRotations.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { createJoint } from './JointConstraints.js'

const rebuild = function() { this.markRebuild(); this.setDirty() }

const propertySchema = schema('limits', 'stiffness', 'damping', 'collide', 'breakForce', 'breakTorque')
  .add('type', { default: 'fixed', onSet: rebuild })
  .add('limitY', { default: null, onSet: rebuild })
  .add('limitZ', { default: null, onSet: rebuild })
  .add('limitMin', { default: null, onSet: rebuild })
  .add('limitMax', { default: null, onSet: rebuild })
  .add('limitStiffness', { default: null, onSet: rebuild })
  .add('limitDamping', { default: null, onSet: rebuild })
  .overrideAll({
    breakForce: { default: Infinity, onSet: rebuild },
    breakTorque: { default: Infinity, onSet: rebuild },
    collide: { default: false, onSet: rebuild },
  })
  .build()

export class Joint extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'joint'

    this.body0 = null
    this.offset0 = new THREE.Vector3(0, 0, 0)
    this.quaternion0 = new THREE.Quaternion(0, 0, 0, 1)
    this.rotation0 = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion0, this.rotation0)
    this.body1 = null
    this.offset1 = new THREE.Vector3(0, 0, 0)
    this.quaternion1 = new THREE.Quaternion(0, 0, 0, 1)
    this.rotation1 = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion1, this.rotation1)
    this.axis = new THREE.Vector3(0, 1, 0)

    defineProps(this, propertySchema, defaults, data)

    this.frame0 = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.frame1 = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
  }

  mount() {
    const actor0 = this.body0?.actor
    const actor1 = this.body1?.actor
    if (!actor0 && !actor1) return

    this.joint = createJoint(
      this.type,
      this.ctx.world.physics.physics,
      actor0,
      this.frame0,
      actor1,
      this.frame1,
      {
        offset0: this.offset0,
        offset1: this.offset1,
        quaternion0: this.quaternion0,
        quaternion1: this.quaternion1,
        axis: this.axis,
        limitY: this.limitY,
        limitZ: this.limitZ,
        limitMin: this.limitMin,
        limitMax: this.limitMax,
        limitStiffness: this.limitStiffness,
        limitDamping: this.limitDamping,
      }
    )

    if (this.collide) {
      this.joint.setConstraintFlag(PHYSX.PxConstraintFlagEnum.eCOLLISION_ENABLED, true)
    }
    this.joint.setBreakForce(this.breakForce, this.breakTorque)
    this.needsRebuild = false
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
    }
  }

  unmount() {
    this.joint?.release()
    this.joint = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[key] = source[key]
    }
    this.body0 = source.body0
    this.offset0.copy(source.offset0)
    this.quaternion0.copy(source.quaternion0)
    this.body1 = source.body1
    this.offset1.copy(source.offset1)
    this.quaternion1.copy(source.quaternion1)
    this.axis.copy(source.axis)
    return this
  }

  getProxy() {
    const self = this
    return createSchemaProxy(this, propertySchema,
      {},
      {
        body0: {
          get() { return self.body0?.getProxy() },
          set(value) {
            if (value) {
              self.ctx.world._allowRefs = true
              self.body0 = value?._ref
              self.ctx.world._allowRefs = false
            } else {
              self.body0 = null
            }
            self.needsRebuild = true
            self.setDirty()
          }
        },
        offset0: function() { return self.offset0 },
        quaternion0: function() { return self.quaternion0 },
        rotation0: function() { return self.rotation0 },
        body1: {
          get() { return self.body1?.getProxy() },
          set(value) {
            if (value) {
              self.ctx.world._allowRefs = true
              self.body1 = value?._ref
              self.ctx.world._allowRefs = false
            } else {
              self.body1 = null
            }
            self.needsRebuild = true
            self.setDirty()
          }
        },
        offset1: function() { return self.offset1 },
        quaternion1: function() { return self.quaternion1 },
        rotation1: function() { return self.rotation1 },
        axis: function() { return self.axis },
      }
    )
  }
}
