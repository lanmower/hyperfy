import { PlayerLocalPhysicsBinding } from './PlayerLocalPhysicsBinding.js'
import { PlayerLocalCameraManager } from './PlayerLocalCameraManager.js'
import { PlayerLocalState } from './PlayerLocalState.js'

export class PlayerLocalDestroy {
  static destroyController(player) {
    if (player.controller) {
      player.controller.clear()
      player.controller.destroy()
      player.controller = null
    }
  }

  static destroyAvatarManager(player) {
    player.avatarManager.destroy()
    player.avatarManager = null
  }

  static destroyChatBubble(player) {
    if (player.chatBubble?.chatTimer) {
      clearTimeout(player.chatBubble.chatTimer)
    }
  }

  static destroyBindings(player) {
    if (player.controlBinder?.stick) {
      player.controlBinder.stick = null
    }
    if (player.controlBinder?.pan) {
      player.controlBinder.pan = null
    }
  }

  static clearSubsystems(player) {
    player.chatBubble = null
    player.inputProcessor = null
    player.animationController = null
    player.networkSynchronizer = null
    player.controlBinder = null
    player.stateManager = null
  }

  static destroyAll(player) {
    this.destroyController(player)
    this.destroyAvatarManager(player)
    this.destroyChatBubble(player)
    this.destroyBindings(player)
    PlayerLocalPhysicsBinding.destroyPhysics(player)
    PlayerLocalCameraManager.cleanupControl(player)
    PlayerLocalState.clearUINodes(player)
    PlayerLocalState.clearSceneObjects(player)
    PlayerLocalState.clearAllState(player)
    this.clearSubsystems(player)
  }
}
