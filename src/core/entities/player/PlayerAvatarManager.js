export class PlayerAvatarManager {
  constructor(player) {
    this.player = player
  }

  getAvatarUrl() {
    return this.player.controller.getAvatarUrl()
  }

  async applyAvatar() {
    return this.player.controller.applyAvatar()
  }

  setSessionAvatar(avatar) {
    return this.player.controller.setSessionAvatar(avatar)
  }

  syncTransform() {
    return this.player.controller.syncTransform()
  }

  updateEmote() {
    return this.player.animationController.updateEmote()
  }

  updateAnimationMode() {
    return this.player.animationController.updateAnimationMode()
  }

  updateGaze() {
    return this.player.animationController.updateGaze()
  }

  applyAvatarLocomotion() {
    return this.player.animationController.applyAvatarLocomotion()
  }

  update(delta) {
    return this.player.avatar?.update?.(delta)
  }

  destroy() {
    if (this.player.avatar?.destroy) {
      this.player.avatar.destroy()
    }
    this.player.avatar = null
    this.player.avatarUrl = null
  }
}
