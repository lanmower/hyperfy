/* Avatar loading, UI management, and transform synchronization */

import * as THREE from '../../extras/three.js'
import { AvatarConfig } from '../../config/SystemConfig.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { createNode } from '../../extras/createNode.js'

const logger = new StructuredLogger('PlayerControllerMovement')

export class PlayerControllerMovement {
  constructor(player) {
    this.player = player
    this.initUI()
    this.transformSync = { pendingUpdates: new Set(), isDirty: false }
  }

  initUI() {
    this.nametag = createNode('nametag', { label: '', health: this.player.data.health, active: false })
    this.bubble = createNode('ui', {
      id: 'bubble',
      width: 300,
      height: 512,
      pivot: 'bottom-center',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })
    this.bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })
    this.bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })
    this.bubble.add(this.bubbleBox)
    this.bubbleBox.add(this.bubbleText)
  }

  getAvatarUrl() {
    return this.player.data.sessionAvatar || this.player.data.avatar || 'asset://avatar.vrm'
  }

  async applyAvatar() {
    const avatarUrl = this.getAvatarUrl()
    if (this.player.avatarUrl === avatarUrl) return
    return new Promise((resolve, reject) => {
      this.player.world.loader
        .load('avatar', avatarUrl)
        .then(src => {
          if (this.player.avatar?.destroy) this.player.avatar.destroy()
          try {
            const hooks = {
              scene: this.player.world.stage.scene,
              camera: this.player.world.camera,
              loader: this.player.world.loader,
              setupMaterial: this.player.world.setupMaterial,
            }
            const identityMatrix = new THREE.Matrix4()
            this.player.avatar = src.factory.create(identityMatrix, hooks, this.player)
            if (this.player.avatar?.disableRateCheck) {
              this.player.avatar.disableRateCheck()
            }
            if (this.player.avatar?.raw?.scene instanceof THREE.Object3D) {
              this.player.base.add(this.player.avatar.raw.scene)
            }
            this.player.avatarUrl = avatarUrl
            const avatarHeight = this.player.avatar?.height || AvatarConfig.DEFAULT_HEIGHT
            const headHeight = this.player.avatar?.getHeadToHeight?.() || AvatarConfig.DEFAULT_HEIGHT
            if (this.nametag?.position) {
              this.nametag.position.y = headHeight + 0.2
            }
            if (this.bubble?.position) {
              this.bubble.position.y = headHeight + 0.2
            }
            if (!this.bubble.active) {
              this.nametag.active = true
            }
            resolve(this.player.avatar)
          } catch (err) {
            logger.error('Failed to create avatar from factory', { error: err.message, avatarUrl })
            reject(err)
          }
        })
        .catch(err => {
          logger.error('Failed to load avatar asset', { error: err.message, avatarUrl })
          reject(err)
        })
    })
  }

  setSessionAvatar(avatar) {
    this.player.data.sessionAvatar = avatar
    this.applyAvatar()
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      sessionAvatar: avatar,
    })
  }

  addUIToAura(aura) {
    aura.add(this.nametag)
    aura.add(this.bubble)
  }

  setUIText(text) {
    this.bubbleText.text = text
  }

  setNametagActive(active) {
    this.nametag.active = active
  }

  setBubbleActive(active) {
    this.bubble.active = active
  }

  updateCameraForAvatar(avatar) {
    return avatar.height * 0.9
  }

  markTransformDirty(object) {
    if (!object) return
    this.transformSync.pendingUpdates.add(object)
    this.transformSync.isDirty = true
  }

  syncAvatarTransform(baseObj) {
    if (!this.player.avatar?.raw?.scene) return
    const scene = this.player.avatar.raw.scene
    scene.position.copy(baseObj.position)
    scene.quaternion.copy(baseObj.quaternion)
    this.markTransformDirty(scene)
  }

  syncAuraTransform() {
    if (!this.player.aura) return
    const aura = this.player.aura
    if (this.player.avatar?.getBoneTransform) {
      try {
        const matrix = this.player.avatar.getBoneTransform('head')
        if (matrix) {
          aura.position.setFromMatrixPosition(matrix)
          this.markTransformDirty(aura)
        }
      } catch (err) {
        logger.warn('getBoneTransform error', err)
      }
    }
  }

  syncCameraTransform(camHeight, xrSession, controlCamera, basePos) {
    if (!controlCamera) return
    controlCamera.position.copy(basePos)
    if (!xrSession) {
      controlCamera.position.y += camHeight
    }
    this.markTransformDirty(controlCamera)
  }

  updateMatrices() {
    if (!this.transformSync.isDirty || this.transformSync.pendingUpdates.size === 0) return
    for (const object of this.transformSync.pendingUpdates) {
      if (!object || !object.updateMatrix) continue
      object.updateMatrix()
    }
    this.transformSync.isDirty = false
  }

  updateMatrixWorldAll() {
    for (const object of this.transformSync.pendingUpdates) {
      if (!object || !object.updateMatrixWorld) continue
      object.updateMatrixWorld(true)
    }
    this.transformSync.pendingUpdates.clear()
  }

  clear() {
    this.transformSync.pendingUpdates.clear()
    this.transformSync.isDirty = false
  }

  destroy() {
    this.clear()
  }
}
