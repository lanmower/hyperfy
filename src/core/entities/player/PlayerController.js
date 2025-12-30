/* Unified player management coordinator consolidating avatar, camera, UI, and transform sync */

export class PlayerController {
  constructor(player) {
    this.player = player
    this.avatar = null
    this.camera = null
    this.ui = null
    this.transformSync = null
  }

  setAvatarManager(avatar) {
    this.avatar = avatar
  }

  setCameraManager(camera) {
    this.camera = camera
  }

  setUIManager(ui) {
    this.ui = ui
  }

  setTransformSync(sync) {
    this.transformSync = sync
  }

  updateAvatar(data) {
    if (this.avatar) this.avatar.update(data)
  }

  updateCamera(position, quaternion) {
    if (this.camera) this.camera.update(position, quaternion)
  }

  updateUI(state) {
    if (this.ui) this.ui.update(state)
  }

  syncTransform() {
    if (this.transformSync) this.transformSync.sync()
  }

  destroy() {
    this.avatar = null
    this.camera = null
    this.ui = null
    this.transformSync = null
  }
}
