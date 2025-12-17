
import { Ranks } from '../../extras/ranks.js'

export class PlayerPermissions {
  constructor(player, world) {
    this.player = player
    this.world = world
  }

  getEffectiveRank() {
    return Math.max(
      this.player.data.rank || 0,
      this.world.settings.effectiveRank || 0
    )
  }

  outranks(otherPlayer) {
    return this.getEffectiveRank() > otherPlayer.permissions.getEffectiveRank()
  }

  isAdmin() {
    const rank = this.getEffectiveRank()
    return this.hasRank(rank, Ranks.ADMIN)
  }

  isBuilder() {
    const rank = this.getEffectiveRank()
    return this.hasRank(rank, Ranks.BUILDER)
  }

  isMuted() {
    return this.world.livekit?.isMuted(this.player.data.id) ?? false
  }

  hasRank(rank, targetRank) {
    return rank >= targetRank
  }

  getRankNames() {
    const rank = this.getEffectiveRank()
    const names = []
    if (this.hasRank(rank, Ranks.BUILDER)) names.push('builder')
    if (this.hasRank(rank, Ranks.ADMIN)) names.push('admin')
    return names
  }
}
