export class PlayerAvatarManager {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
  }

  getAvatarUrl() {
    return this.playerLocal.data.sessionAvatar || this.playerLocal.data.avatar || 'asset://avatar.vrm'
  }

  async applyAvatar() {
    const avatarUrl = this.getAvatarUrl()
    if (this.playerLocal.avatarUrl === avatarUrl) return

    return new Promise((resolve, reject) => {
      this.playerLocal.world.loader
        .load('avatar', avatarUrl)
        .then(src => {
          if (this.playerLocal.avatar) this.playerLocal.avatar.deactivate()
          this.playerLocal.avatar = src.toNodes().get('avatar')
          this.playerLocal.avatar.disableRateCheck()
          this.playerLocal.base.add(this.playerLocal.avatar)
          this.playerLocal.avatarUrl = avatarUrl
          this.playerLocal.camHeight = this.playerLocal.avatar.height * 0.9
          this.playerLocal.nametag.position.y = this.playerLocal.avatar.getHeadToHeight() + 0.2
          this.playerLocal.bubble.position.y = this.playerLocal.avatar.getHeadToHeight() + 0.2
          if (!this.playerLocal.bubble.active) {
            this.playerLocal.nametag.active = true
          }
          resolve(this.playerLocal.avatar)
        })
        .catch(err => {
          console.error(err)
          reject(err)
        })
    })
  }

  setSessionAvatar(avatar) {
    this.playerLocal.data.sessionAvatar = avatar
    this.applyAvatar()
    this.playerLocal.world.network.send('entityModified', {
      id: this.playerLocal.data.id,
      sessionAvatar: avatar,
    })
  }
}
