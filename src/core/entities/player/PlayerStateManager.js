import * as THREE from '../../extras/three.js'
import { BaseManager } from '../../patterns/index.js'

export class PlayerStateManager extends BaseManager {
  constructor(player) {
    super(null, 'PlayerStateManager')
    this.player = player
  }

  teleport({ position: pos, rotationY }) {
    const position = new THREE.Vector3()
    position.copy(pos.isVector3 ? pos : new THREE.Vector3().fromArray(pos))
    const hasRotation = typeof rotationY === 'number'
    const pose = this.player.capsule.getGlobalPose()
    position.toPxTransform(pose)
    this.player.capsuleHandle.snap(pose)
    this.player.base.position.copy(position)
    if (hasRotation) this.player.base.rotation.y = rotationY
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      p: this.player.base.position.toArray(),
      q: this.player.base.quaternion.toArray(),
      t: true,
    })
    this.player.cam.position.copy(this.player.base.position)
    this.player.cam.position.y += this.player.camHeight
    if (hasRotation) this.player.cam.rotation.y = rotationY
    if (this.player.control?.camera) {
      this.player.control.camera.position.copy(this.player.cam.position)
      this.player.control.camera.quaternion.copy(this.player.cam.quaternion)
    }
  }

  setEffect(effect, onEnd) {
    if (this.player.data.effect === effect) return
    if (this.player.data.effect) {
      this.player.data.effect = null
      this.player.effectOnEnd?.()
      this.player.effectOnEnd = null
    }
    this.player.data.effect = effect
    this.player.effectOnEnd = onEnd
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      ef: effect,
    })
  }

  setSpeaking(speaking) {
    return this.player.chatBubble.setSpeaking(speaking)
  }

  push(force) {
    const v1 = new THREE.Vector3()
    force = v1.fromArray(force)
    if (this.player.pushForce) this.player.pushForce.add(force)
    else {
      this.player.pushForce = force.clone()
      this.player.pushForceInit = false
    }
  }

  setName(name) {
    this.modify({ name })
    this.player.world.network.send('entityModified', { id: this.player.data.id, name })
  }

  chat(msg) {
    return this.player.chatBubble.chat(msg)
  }

  modify(data) {
    let avatarChanged
    let changed
    if (data.hasOwnProperty('name')) {
      this.player.data.name = data.name
      this.player.world.events.emit('name', { playerId: this.player.data.id, name: this.player.data.name })
      changed = true
    }
    if (data.hasOwnProperty('health')) {
      this.player.data.health = data.health
      this.player.nametag.health = data.health
      this.player.world.events.emit('health', { playerId: this.player.data.id, health: data.health })
    }
    if (data.hasOwnProperty('avatar')) {
      this.player.data.avatar = data.avatar
      avatarChanged = true
      changed = true
    }
    if (data.hasOwnProperty('sessionAvatar')) {
      this.player.data.sessionAvatar = data.sessionAvatar
      avatarChanged = true
    }
    if (data.hasOwnProperty('ef')) {
      if (this.player.data.effect) {
        this.player.data.effect = null
        this.player.effectOnEnd?.()
        this.player.effectOnEnd = null
      }
      this.player.data.effect = data.ef
    }
    if (data.hasOwnProperty('rank')) {
      this.player.data.rank = data.rank
      this.player.world.events.emit('rank', { playerId: this.player.data.id, rank: this.player.data.rank })
      changed = true
    }
    if (avatarChanged) {
      this.player.applyAvatar()
    }
    if (changed) {
      this.player.world.events.emit('player', this.player)
    }
  }

  async initInternal() {
  }

  async destroyInternal() {
    this.player = null
  }
}
