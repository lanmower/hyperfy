/**
 * Player Permissions System
 *
 * Manages player rank checking and permission verification.
 * Consolidates repeated rank logic from PlayerLocal.
 */

import { Ranks } from '../../extras/ranks.js'

export class PlayerPermissions {
  constructor(player, world) {
    this.player = player
    this.world = world
  }

  /**
   * Get effective rank (player's rank or world's rank if higher)
   */
  getEffectiveRank() {
    return Math.max(
      this.player.data.rank || 0,
      this.world.settings.effectiveRank || 0
    )
  }

  /**
   * Check if this player outranks another player
   */
  outranks(otherPlayer) {
    return this.getEffectiveRank() > otherPlayer.permissions.getEffectiveRank()
  }

  /**
   * Check if player has admin rank
   */
  isAdmin() {
    const rank = this.getEffectiveRank()
    return this.hasRank(rank, Ranks.ADMIN)
  }

  /**
   * Check if player has builder rank
   */
  isBuilder() {
    const rank = this.getEffectiveRank()
    return this.hasRank(rank, Ranks.BUILDER)
  }

  /**
   * Check if player is muted
   */
  isMuted() {
    return this.world.livekit?.isMuted(this.player.data.id) ?? false
  }

  /**
   * Check if player has specific rank
   */
  hasRank(rank, targetRank) {
    return rank >= targetRank
  }

  /**
   * Get all rank names for this player's rank level
   */
  getRankNames() {
    const rank = this.getEffectiveRank()
    const names = []
    if (this.hasRank(rank, Ranks.BUILDER)) names.push('builder')
    if (this.hasRank(rank, Ranks.ADMIN)) names.push('admin')
    return names
  }
}
