import { Modes } from '../constants/AnimationModes.js'
import { PlayerLocalPhysicsBinding } from './PlayerLocalPhysicsBinding.js'
import { PlayerLocalCameraManager } from './PlayerLocalCameraManager.js'

export class PlayerLocalLifecycle {
  static fixedUpdate(player, delta) {
    player.physics?.update(delta)
  }

  static update(player, delta) {
    if (!player.isInitialized) return
    player.inputProcessor.processCamera(delta)
    player.inputProcessor.processZoom(delta)
    player.inputProcessor.processStickActivation()
    player.inputProcessor.processJump()
    player.inputProcessor.processMovement(delta)

    PlayerLocalPhysicsBinding.updateMovementState(player)

    player.inputProcessor.processRunning()
    player.inputProcessor.applyMovementRotation()
    player.inputProcessor.applyBodyRotation(delta)

    player.avatarManager.updateEmote()
    player.mode = player.avatarManager.updateAnimationMode()
    if (player.mode === undefined || player.mode === null) {
      player.mode = Modes.IDLE
    }
    player.avatarManager.updateGaze()
    player.avatarManager.applyAvatarLocomotion()
    player.avatarManager.update(delta)

    player.networkSynchronizer.sync(delta)
    PlayerLocalPhysicsBinding.handleEffectDuration(player, delta)
  }

  static lateUpdate(player, delta) {
    PlayerLocalCameraManager.updateCameraPosition(player, delta)
    PlayerLocalCameraManager.syncControlCamera(player, delta)
    player.avatarManager.syncTransform()
  }
}
