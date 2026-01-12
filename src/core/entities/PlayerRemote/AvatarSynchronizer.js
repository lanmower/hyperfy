import * as THREE from '../../extras/three.js'
import { createNode } from '../../extras/createNode.js'

export class AvatarSynchronizer {
  constructor(player) {
    this.player = player
    this.avatarUrl = null
  }

  applyAvatar() {
    const avatarUrl = this.player.data.sessionAvatar || this.player.data.avatar || 'asset://avatar.vrm'
    if (this.avatarUrl === avatarUrl) return
    this.player.world.loader.load('avatar', avatarUrl).then(src => {
      if (this.player.avatar?.deactivate) this.player.avatar.deactivate()
      this.player.avatar = src.toNodes().get('avatar')
      if (this.player.avatar && this.player.base && this.player.base.add && this.player.avatar instanceof THREE.Object3D) {
        this.player.base.add(this.player.avatar)
      }
      const headHeight = this.player.avatar?.getHeadToHeight?.() || 1.6
      if (this.player.nametag?.position) {
        this.player.nametag.position.y = headHeight + 0.2
      }
      if (this.player.bubble?.position) {
        this.player.bubble.position.y = headHeight + 0.2
      }
      if (!this.player.bubble.active) {
        this.player.nametag.active = true
      }
      this.avatarUrl = avatarUrl
    })
  }

  updateAvatarFromData(data) {
    let avatarChanged = false
    if (data.hasOwnProperty('avatar')) {
      this.player.data.avatar = data.avatar
      avatarChanged = true
    }
    if (data.hasOwnProperty('sessionAvatar')) {
      this.player.data.sessionAvatar = data.sessionAvatar
      avatarChanged = true
    }
    if (avatarChanged) {
      this.applyAvatar()
    }
  }

  createAura() {
    const aura = createNode('group')
    const nametag = createNode('nametag', { label: this.player.data.name, health: this.player.data.health, active: false })
    aura.add(nametag)

    const bubble = createNode('ui', {
      width: 300,
      height: 512,
      pivot: 'bottom-center',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })
    const bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })
    const bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })
    bubble.add(bubbleBox)
    bubbleBox.add(bubbleText)
    aura.add(bubble)

    return { aura, nametag, bubble, bubbleBox, bubbleText }
  }

  updateHeadPosition() {
    if (this.player.avatar?.getBoneTransform) {
      const matrix = this.player.avatar.getBoneTransform('head')
      if (matrix && this.player.aura?.position) {
        this.player.aura.position.setFromMatrixPosition(matrix)
      }
    }
  }
}
