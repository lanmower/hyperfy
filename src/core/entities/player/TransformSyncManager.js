import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('TransformSyncManager')

export class TransformSyncManager {
  constructor(player) {
    this.player = player
    this.pendingUpdates = new Set()
    this.isDirty = false
  }

  markDirty(object) {
    if (!object) return
    this.pendingUpdates.add(object)
    this.isDirty = true
  }

  syncAvatarTransform() {
    if (!this.player.avatar?.raw?.scene) return

    const scene = this.player.avatar.raw.scene
    const base = this.player.base

    scene.position.copy(base.position)
    scene.quaternion.copy(base.quaternion)
    this.markDirty(scene)
  }

  syncAuraTransform() {
    if (!this.player.aura) return
    const aura = this.player.aura

    if (this.player.avatar?.getBoneTransform) {
      try {
        const matrix = this.player.avatar.getBoneTransform('head')
        if (matrix) {
          aura.position.setFromMatrixPosition(matrix)
          this.markDirty(aura)
        }
      } catch (err) {
        logger.warn('getBoneTransform error', err)
      }
    }
  }

  syncCameraTransform() {
    if (!this.player.cam) return

    this.player.cam.position.copy(this.player.base.position)

    if (!this.player.world.xr?.session) {
      this.player.cam.position.y += this.player.camHeight
    }

    if (this.player.control?.camera) {
      if (this.player.world.xr?.session) {
        this.player.control.camera.position.copy(this.player.cam.position)
        this.player.control.camera.quaternion.copy(this.player.cam.quaternion)
      }
      this.markDirty(this.player.control.camera)
    }
  }

  updateMatrices() {
    if (!this.isDirty || this.pendingUpdates.size === 0) return

    for (const object of this.pendingUpdates) {
      if (!object) continue
      object.updateMatrix()
    }

    this.isDirty = false
  }

  updateMatrixWorldRecursive(object) {
    if (!object) return
    object.updateMatrixWorld(true)
  }

  updateMatrixWorldAll() {
    for (const object of this.pendingUpdates) {
      if (!object) continue
      this.updateMatrixWorldRecursive(object)
    }

    this.pendingUpdates.clear()
  }

  sync() {
    this.syncAvatarTransform()
    this.syncAuraTransform()
    this.syncCameraTransform()
    this.updateMatrices()
    this.updateMatrixWorldAll()
  }

  clear() {
    this.pendingUpdates.clear()
    this.isDirty = false
  }
}
