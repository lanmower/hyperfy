import * as THREE from '../../extras/three.js'

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
          if (this.playerLocal.avatar?.destroy) this.playerLocal.avatar.destroy()
          try {
            const hooks = {
              scene: this.playerLocal.world.stage.scene,
              camera: this.playerLocal.world.camera,
              loader: this.playerLocal.world.loader,
              setupMaterial: this.playerLocal.world.setupMaterial,
            }
            this.playerLocal.avatar = src.factory.create(this.playerLocal.base.matrixWorld, hooks, this.playerLocal)
            if (this.playerLocal.avatar?.disableRateCheck) {
              this.playerLocal.avatar.disableRateCheck()
            }
            if (this.playerLocal.avatar?.raw?.scene instanceof THREE.Object3D) {
              this.playerLocal.base.add(this.playerLocal.avatar.raw.scene)
            }
            this.playerLocal.avatarUrl = avatarUrl
            const avatarHeight = this.playerLocal.avatar?.height || 1.6
            this.playerLocal.camHeight = avatarHeight * 0.9
            const headHeight = this.playerLocal.avatar?.getHeadToHeight?.() || 1.6
            if (this.playerLocal.nametag?.position) {
              this.playerLocal.nametag.position.y = headHeight + 0.2
            }
            if (this.playerLocal.bubble?.position) {
              this.playerLocal.bubble.position.y = headHeight + 0.2
            }
            if (!this.playerLocal.bubble.active) {
              this.playerLocal.nametag.active = true
            }
            resolve(this.playerLocal.avatar)
          } catch (err) {
            console.error('Factory error:', err.message)
            reject(err)
          }
        })
        .catch(err => {
          console.error('Load error:', err.message)
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
