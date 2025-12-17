export class PlayerAvatarManager {
  constructor(player, world) {
    this.player = player
    this.world = world
    this.avatar = null
    this.avatarUrl = null
  }

  getAvatarUrl() {
    return this.player.data.sessionAvatar || this.player.data.avatar || 'asset://avatar.vrm'
  }

  async applyAvatar() {
    const avatarUrl = this.getAvatarUrl()
    if (this.avatarUrl === avatarUrl) return

    return new Promise((resolve, reject) => {
      this.world.loader
        .load('avatar', avatarUrl)
        .then(src => {
          if (this.avatar) this.avatar.deactivate()
          this.avatar = src.toNodes().get('avatar')
          this.avatar.disableRateCheck()
          this.player.base.add(this.avatar)
          this.avatarUrl = avatarUrl
          this.player.camHeight = this.avatar.height * 0.9
          if (this.player.ui) {
            this.player.ui.updateForAvatar(this.avatar)
          }
          if (!this.player.ui.bubble.active) {
            this.player.ui.nametag.active = true
          }
          resolve(this.avatar)
        })
        .catch(err => {
          console.error(err)
          reject(err)
        })
    })
  }

  deactivate() {
    if (this.avatar) {
      this.avatar.deactivate()
    }
  }
}
