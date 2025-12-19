import { EVENT } from '../../constants/EventNames.js'

export class PlayerModifyHandler {
  constructor(player) {
    this.player = player
  }

  modify(data) {
    let avatarChanged
    let changed
    if (data.hasOwnProperty('name')) {
      this.player.data.name = data.name
      this.player.world.events.emit(EVENT.name, { playerId: this.player.data.id, name: this.player.data.name })
      changed = true
    }
    if (data.hasOwnProperty('health')) {
      this.player.data.health = data.health
      this.player.nametag.health = data.health
      this.player.world.events.emit(EVENT.health, { playerId: this.player.data.id, health: data.health })
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
        this.player.effectManager.onEffectEnd?.()
        this.player.effectManager.onEffectEnd = null
      }
      this.player.data.effect = data.ef
    }
    if (data.hasOwnProperty('rank')) {
      this.player.data.rank = data.rank
      this.player.world.events.emit(EVENT.rank, { playerId: this.player.data.id, rank: this.player.data.rank })
      changed = true
    }
    if (avatarChanged) {
      this.player.applyAvatar()
    }
    if (changed) {
      this.player.world.events.emit('player', this.player)
    }
  }
}
