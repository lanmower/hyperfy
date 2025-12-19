export class NetworkSynchronizer {
  constructor(player) {
    this.player = player
    this.lastSendAt = 0
    this.lastState = null
  }

  sync(delta) {
    this.lastSendAt += delta
    if (this.lastSendAt >= this.player.world.networkRate) {
      if (!this.lastState) {
        this.lastState = {
          id: this.player.data.id,
          p: this.player.base.position.clone(),
          q: this.player.base.quaternion.clone(),
          m: this.player.mode,
          a: this.player.axis.clone(),
          g: this.player.gaze.clone(),
          e: null,
        }
      }

      const data = {
        id: this.player.data.id,
      }
      let hasChanges

      if (!this.lastState.p.equals(this.player.base.position)) {
        data.p = this.player.base.position.toArray()
        this.lastState.p.copy(this.player.base.position)
        hasChanges = true
      }
      if (!this.lastState.q.equals(this.player.base.quaternion)) {
        data.q = this.player.base.quaternion.toArray()
        this.lastState.q.copy(this.player.base.quaternion)
        hasChanges = true
      }
      if (this.lastState.m !== this.player.mode) {
        data.m = this.player.mode
        this.lastState.m = this.player.mode
        hasChanges = true
      }
      if (!this.lastState.a.equals(this.player.axis)) {
        data.a = this.player.axis.toArray()
        this.lastState.a.copy(this.player.axis)
        hasChanges = true
      }
      if (!this.lastState.g.equals(this.player.gaze)) {
        data.g = this.player.gaze.toArray()
        this.lastState.g.copy(this.player.gaze)
        hasChanges = true
      }
      if (this.lastState.e !== this.player.emote) {
        data.e = this.player.emote
        this.lastState.e = this.player.emote
        hasChanges = true
      }

      if (hasChanges) {
        this.player.world.network.send('entityModified', data)
      }
      this.lastSendAt = 0
    }
  }
}
