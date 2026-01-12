import { PlayerCapsuleFactory } from './player/PlayerCapsuleFactory.js'
import { PlayerPhysics } from './player/PlayerPhysics.js'

export class PlayerLocalPhysicsBinding {
  static initializeCapsule(player) {
    const { capsule, capsuleHandle, material } = PlayerCapsuleFactory.create({
      world: player.world,
      player: player,
    })
    player.capsule = capsule
    player.capsuleHandle = capsuleHandle
    player.material = material

    if (player.capsule) {
      player.physics = new PlayerPhysics(player.world, player)
    }
  }

  static destroyPhysics(player) {
    if (player.capsule && player.capsuleHandle && player.world.physics) {
      player.world.physics.removeActor(player.capsuleHandle)
      player.capsule = null
      player.capsuleHandle = null
    }

    if (player.material) {
      player.material = null
    }

    player.physics = null
  }

  static updateMovementState(player) {
    if (!player.physics) return

    player.physics.moving = player.physics.moveDir.length() > 0

    const freeze = player.data.effect?.freeze
    const anchor = player.getAnchorMatrix()

    if (
      player.data.effect?.cancellable &&
      (player.physics.moving || player.jumpDown)
    ) {
      player.stateManager.setEffect(null)
    }

    if (freeze || anchor) {
      player.physics.moveDir.set(0, 0, 0)
      player.physics.moving = false
    }
  }

  static handleEffectDuration(player, delta) {
    if (player.data.effect?.duration) {
      player.data.effect.duration -= delta
      if (player.data.effect.duration <= 0) {
        player.stateManager.setEffect(null)
      }
    }
  }

  static toggleFlying(player, value) {
    if (!player.physics) return

    value = typeof value === 'boolean' ? value : !player.physics.flying

    if (player.physics.flying === value) return

    player.physics.flying = value

    if (player.physics.flying) {
      const velocity = player.capsule.getLinearVelocity()
      velocity.y = 0
      player.capsule.setLinearVelocity(velocity)
    }
  }
}
