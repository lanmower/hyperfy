/* Avatar loading, UI management, and transform synchronization */

import * as pc from '../../extras/playcanvas.js'
import { AvatarConfig } from '../../config/SystemConfig.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { createNode } from '../../extras/createNode.js'

const logger = new StructuredLogger('PlayerControllerMovement')

export class PlayerControllerMovement {
  constructor(player) {
    this.player = player
    this.initUI()
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
    try {
      const src = await this.player.world.loader.load('avatar', avatarUrl)
      if (this.player.avatar?.destroy) this.player.avatar.destroy()
      try {
        const hooks = {
          scene: this.player.world.graphics?.app?.root,
          camera: this.player.world.graphics?.pcCamera,
          loader: this.player.world.loader,
          setupMaterial: this.player.world.setupMaterial,
        }
        const identityMatrix = new pc.Mat4()
        identityMatrix.setIdentity()
        this.player.avatar = src.factory.create(identityMatrix, hooks, this.player)
        if (this.player.avatar?.disableRateCheck) {
          this.player.avatar.disableRateCheck()
        }
        this.player.avatarUrl = avatarUrl
        const avatarHeight = this.player.avatar?.height || AvatarConfig.DEFAULT_HEIGHT
        const headHeight = this.player.avatar?.getHeadToHeight?.() || AvatarConfig.DEFAULT_HEIGHT

        if (!this.player.base) {
          this.player.base = new pc.Entity('player-base')
          this.player.world.graphics.app.root.addChild(this.player.base)
        }

        this.player.base.setLocalPosition(0, 0, 0)
        this.player.base.setLocalRotation(0, 0, 0)

        if (this.nametag?.position) {
          this.nametag.position.y = headHeight + 0.2
        }
        if (this.bubble?.position) {
          this.bubble.position.y = headHeight + 0.2
        }
        if (!this.bubble.active) {
          this.nametag.active = true
        }
      } catch (err) {
        logger.error('Failed to create avatar from factory', { error: err.message, avatarUrl })
        this.player.avatarUrl = avatarUrl
      }
    } catch (err) {
      logger.error('Failed to load avatar asset', { error: err.message, avatarUrl })
      this.player.avatarUrl = avatarUrl
    }
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

  syncAvatarTransform(position, quaternion) {
    if (!this.player.avatar) return
  }

  syncAuraTransform(position) {
    if (!this.player.avatar?.getBoneTransform) return
    try {
      const matrix = this.player.avatar.getBoneTransform('head')
      if (matrix) {
      }
    } catch (err) {
      logger.warn('getBoneTransform error', err)
    }
  }

  syncCameraTransform(camHeight, xrSession, controlCamera, basePos) {
    if (!controlCamera || !controlCamera.position) return
    if (controlCamera.position.x !== undefined) {
      controlCamera.position.x = basePos[0]
      controlCamera.position.y = basePos[1] + (xrSession ? 0 : camHeight)
      controlCamera.position.z = basePos[2]
    }
  }

  clear() {}

  destroy() {
    this.clear()
  }
}
