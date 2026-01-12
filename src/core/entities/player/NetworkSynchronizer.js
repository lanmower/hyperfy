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
          p: [this.player.data.position[0], this.player.data.position[1], this.player.data.position[2]],
          q: [this.player.data.quaternion[0], this.player.data.quaternion[1], this.player.data.quaternion[2], this.player.data.quaternion[3]],
          m: this.player.mode,
          a: [this.player.axis.x, this.player.axis.y, this.player.axis.z],
          g: [this.player.gaze.x, this.player.gaze.y, this.player.gaze.z],
          e: null,
        }
      }

      const data = {
        id: this.player.data.id,
      }
      let hasChanges

      if (this.lastState.p[0] !== this.player.data.position[0] ||
          this.lastState.p[1] !== this.player.data.position[1] ||
          this.lastState.p[2] !== this.player.data.position[2]) {
        data.p = [this.player.data.position[0], this.player.data.position[1], this.player.data.position[2]]
        this.lastState.p = [...data.p]
        hasChanges = true
      }
      if (this.lastState.q[0] !== this.player.data.quaternion[0] ||
          this.lastState.q[1] !== this.player.data.quaternion[1] ||
          this.lastState.q[2] !== this.player.data.quaternion[2] ||
          this.lastState.q[3] !== this.player.data.quaternion[3]) {
        data.q = [this.player.data.quaternion[0], this.player.data.quaternion[1], this.player.data.quaternion[2], this.player.data.quaternion[3]]
        this.lastState.q = [...data.q]
        hasChanges = true
      }
      if (this.lastState.m !== this.player.mode) {
        data.m = this.player.mode
        this.lastState.m = this.player.mode
        hasChanges = true
      }
      if (this.lastState.a[0] !== this.player.axis.x ||
          this.lastState.a[1] !== this.player.axis.y ||
          this.lastState.a[2] !== this.player.axis.z) {
        data.a = [this.player.axis.x, this.player.axis.y, this.player.axis.z]
        this.lastState.a = [...data.a]
        hasChanges = true
      }
      if (this.lastState.g[0] !== this.player.gaze.x ||
          this.lastState.g[1] !== this.player.gaze.y ||
          this.lastState.g[2] !== this.player.gaze.z) {
        data.g = [this.player.gaze.x, this.player.gaze.y, this.player.gaze.z]
        this.lastState.g = [...data.g]
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
