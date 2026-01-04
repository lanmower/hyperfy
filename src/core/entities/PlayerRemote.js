import * as THREE from '../extras/three.js'
import { BaseEntity } from './BaseEntity.js'
import { createNode } from '../extras/createNode.js'
import { hasRank, Ranks } from '../extras/ranks.js'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3.js'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion.js'
import { EVENT } from '../constants/EventNames.js'
import { AvatarSynchronizer } from './PlayerRemote/AvatarSynchronizer.js'
import { RemoteAnimationController } from './PlayerRemote/RemoteAnimationController.js'

let capsuleGeometry
{
  const radius = 0.3
  const inner = 1.2
  const height = radius + inner + radius
  capsuleGeometry = new THREE.CapsuleGeometry(radius, inner) // matches PlayerLocal capsule size
  capsuleGeometry.translate(0, height / 2, 0)
}

export class PlayerRemote extends BaseEntity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isPlayer = true
    this.isRemote = true
    this.avatarSync = new AvatarSynchronizer(this)
    this.animationCtrl = new RemoteAnimationController(this)
    this.init()
  }

  async init() {
    if (!this.world.isClient) return
    if (this.world.graphics?.app) return
    this.base = new THREE.Object3D()
    this.base.position.fromArray(this.data.position)
    this.base.quaternion.fromArray(this.data.quaternion)
    this.world.rig.add(this.base)

    this.body = new THREE.Object3D()
    this.base.add(this.body)
    this.collider = new THREE.Object3D()
    this.body.add(this.collider)

    const { aura, nametag, bubble, bubbleBox, bubbleText } = this.avatarSync.createAura()
    this.aura = aura
    this.nametag = nametag
    this.bubble = bubble
    this.bubbleBox = bubbleBox
    this.bubbleText = bubbleText
    if (this.aura instanceof THREE.Object3D) {
      this.world.rig.add(this.aura)
    }

    this.aura.activate?.({ world: this.world, entity: this })
    this.base.activate?.({ world: this.world, entity: this })

    this.avatarSync.applyAvatar()

    this.position = new BufferedLerpVector3(this.base.position, this.world.networkRate * 1.5)
    this.quaternion = new BufferedLerpQuaternion(this.base.quaternion, this.world.networkRate * 1.5)
    this.teleport = 0

    this.world.setHot(this, true)
  }

  applyAvatar() {
    this.avatarSync.applyAvatar()
  }

  getAnchorMatrix() {
    if (this.data.effect?.anchorId) {
      return this.world.anchors.get(this.data.effect.anchorId)
    }
  }

  outranks(otherPlayer) {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    const otherRank = Math.max(otherPlayer.data.rank, this.world.settings.effectiveRank)
    return rank > otherRank
  }

  isAdmin() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.ADMIN)
  }

  isBuilder() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.BUILDER)
  }

  isMuted() {
    return this.world.livekit.isMuted(this.data.id)
  }

  update(delta) {
    const anchor = this.getAnchorMatrix()
    if (!anchor) {
      this.position.update(delta)
      this.quaternion.update(delta)
    }
    this.animationCtrl.updateAnimation(delta)
  }

  lateUpdate(delta) {
    const anchor = this.getAnchorMatrix()
    if (anchor) {
      this.position.snap()
      this.quaternion.snap()
      this.base.position.setFromMatrixPosition(anchor)
      this.base.quaternion.setFromRotationMatrix(anchor)
      this.base.clean()
    }
    this.avatarSync.updateHeadPosition()
  }

  setEffect(effect, onEnd) {
    if (this.data.effect) {
      this.data.effect = null
      this.onEffectEnd?.()
      this.onEffectEnd = null
    }
    this.data.effect = effect
    this.onEffectEnd = onEnd
    this.body.active = effect?.anchorId ? false : true
  }

  setSpeaking(speaking) {
    this.animationCtrl.setSpeaking(speaking)
  }

  modify(data) {
    const now = Date.now()
    if (!this._lastUpdateTime) this._lastUpdateTime = 0
    const timeSinceLastUpdate = now - this._lastUpdateTime
    const minUpdateInterval = 16

    if (data.hasOwnProperty('t')) {
      this.teleport++
    }
    if (data.hasOwnProperty('p')) {
      if (Array.isArray(data.p) && data.p.length === 3) {
        if (timeSinceLastUpdate >= minUpdateInterval) {
          this.data.position = data.p
          this.position.push(data.p, this.teleport)
          this._lastUpdateTime = now
        }
      } else {
        logger.warn('Invalid position data in PlayerRemote.modify()', { dataType: typeof data.p, length: Array.isArray(data.p) ? data.p.length : 'not-array' })
      }
    }
    if (data.hasOwnProperty('q')) {
      if (Array.isArray(data.q) && data.q.length === 4) {
        if (timeSinceLastUpdate >= minUpdateInterval) {
          this.data.quaternion = data.q
          this.quaternion.push(data.q, this.teleport)
          this._lastUpdateTime = now
        }
      } else {
        logger.warn('Invalid quaternion data in PlayerRemote.modify()', { dataType: typeof data.q, length: Array.isArray(data.q) ? data.q.length : 'not-array' })
      }
    }
    this.animationCtrl.updateAnimationFromData(data)
    if (data.hasOwnProperty('ef')) {
      this.setEffect(data.ef)
    }
    if (data.hasOwnProperty('name')) {
      this.data.name = data.name
      this.nametag.label = data.name
      this.world.events.emit(EVENT.name, { playerId: this.data.id, name: this.data.name })
    }
    if (data.hasOwnProperty('health')) {
      this.data.health = data.health
      this.nametag.health = data.health
      this.world.events.emit(EVENT.health, { playerId: this.data.id, health: data.health })
    }
    this.avatarSync.updateAvatarFromData(data)
    if (data.hasOwnProperty('rank')) {
      this.data.rank = data.rank
      this.world.events.emit(EVENT.rank, { playerId: this.data.id, rank: this.data.rank })
    }
  }

  chat(msg) {
    this.nametag.active = false
    this.bubbleText.value = msg
    this.bubble.active = true
    clearTimeout(this.chatTimer)
    this.chatTimer = setTimeout(() => {
      this.bubble.active = false
      this.nametag.active = true
    }, 5000)
  }

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true

    clearTimeout(this.chatTimer)
    this.base?.deactivate?.()
    this.avatar?.deactivate?.()
    this.avatar = null
    this.world.setHot?.(this, false)
    this.world.events?.emit(EVENT.game.leave, { playerId: this.data.id })
    this.aura?.deactivate?.()
    this.aura = null

    this.world.entities.remove(this.data.id)
    if (local) {
      this.world.network.send('entityRemoved', { id: this.data.id })
    }
  }
}
