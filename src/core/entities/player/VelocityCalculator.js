import * as THREE from '../../extras/three.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()

export class VelocityCalculator {
  static updateGravityAndVelocity(world, player, physics, delta, snare) {
    const PHYSX = world.PHYSX

    if (physics.grounded) {
      if (physics.platform.actor) {
        const isStatic = physics.platform.actor instanceof PHYSX.PxRigidStatic
        const isKinematic = physics.platform.actor
          .getRigidBodyFlags?.()
          .isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)

        if (!isKinematic && !isStatic) {
          const amount = -9.81 * 0.2
          const force = v1.set(0, amount, 0)
          PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
            physics.platform.actor,
            force.toPxVec3(),
            player.capsule.getGlobalPose().p,
            PHYSX.PxForceModeEnum.eFORCE,
            true
          )
        }
      }
    } else {
      const force = v1.set(0, -physics.effectiveGravity, 0)
      player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const velocity = v1.copy(player.capsule.getLinearVelocity())

    const dragCoeff = 10 * delta
    const perpComponent = v2.copy(physics.groundNormal).multiplyScalar(velocity.dot(physics.groundNormal))
    const parallelComponent = v3.copy(velocity).sub(perpComponent)
    parallelComponent.multiplyScalar(1 - dragCoeff)
    velocity.copy(parallelComponent.add(perpComponent))

    if (physics.grounded && !physics.jumping) {
      const projectedLength = velocity.dot(physics.groundNormal)
      const projectedVector = v2.copy(physics.groundNormal).multiplyScalar(projectedLength)
      velocity.sub(projectedVector)
    }

    if (physics.justLeftGround && !physics.jumping) {
      velocity.y = -5
    }

    if (physics.slipping) {
      velocity.y -= 0.5
    }

    if (physics.pushForce) {
      if (!physics.pushForceInit) {
        physics.pushForceInit = true
        if (physics.pushForce.y) {
          physics.jumped = true
          physics.jumping = false
          physics.falling = false
          physics.airJumped = false
          physics.airJumping = false
        }
      }
      velocity.add(physics.pushForce)

      const drag = 20
      const decayFactor = 1 - drag * delta
      if (decayFactor < 0) {
        physics.pushForce.set(0, 0, 0)
      } else {
        physics.pushForce.multiplyScalar(Math.max(decayFactor, 0))
      }

      if (physics.pushForce.length() < 0.01) {
        physics.pushForce = null
      }
    }

    player.capsule.setLinearVelocity(velocity.toPxVec3())
  }

  static updateFlyingPhysics(world, player, physics, delta) {
    const PHYSX = world.PHYSX

    if (physics.moving || player.jumpDown || player.control?.keyC?.down) {
      const flySpeed = physics.flyForce * (player.running ? 2 : 1)
      const force = v1.copy(physics.flyDir).multiplyScalar(flySpeed)

      if (player.jumpDown) {
        force.y = flySpeed
      } else if (player.control?.keyC?.down) {
        force.y = -flySpeed
      }

      player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const v2 = new THREE.Vector3()
    const v3 = new THREE.Vector3()
    const v4 = new THREE.Vector3()

    const velocity = v2.copy(player.capsule.getLinearVelocity())
    const dragForce = v3.copy(velocity).multiplyScalar(-physics.flyDrag * delta)
    player.capsule.addForce(dragForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)

    const zeroAngular = v4.set(0, 0, 0)
    player.capsule.setAngularVelocity(zeroAngular.toPxVec3())

    if (!world.builder?.enabled) {
      physics.flying = false
    }
  }
}
