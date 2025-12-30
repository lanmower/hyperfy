/* Unified player management coordinator consolidating avatar, camera, UI, and transform sync */

import { PlayerCameraManager } from './PlayerCameraManager.js'
import { PlayerAvatarManager } from './PlayerAvatarManager.js'
import { TransformSyncManager } from './TransformSyncManager.js'

export class PlayerController {
  constructor(player) {
    this.player = player
    this.avatar = new PlayerAvatarManager(player)
    this.camera = new PlayerCameraManager(player, player.base)
    this.transformSync = new TransformSyncManager(player)
  }

  getAvatarUrl() {
    return this.avatar.getAvatarUrl()
  }

  async applyAvatar() {
    return this.avatar.applyAvatar()
  }

  setSessionAvatar(avatar) {
    return this.avatar.setSessionAvatar(avatar)
  }

  updateCameraForAvatar(avatar) {
    this.camera.updateForAvatar(avatar)
  }

  updateCameraLook(delta, isXR, control, pan) {
    this.camera.updateLook(delta, isXR, control, pan)
  }

  syncTransform() {
    this.transformSync.sync()
  }

  clear() {
    this.transformSync.clear()
  }

  destroy() {
    this.avatar = null
    this.camera = null
    this.transformSync = null
  }
}
