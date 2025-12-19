export class PlayerEffectManager {
  constructor(player) {
    this.player = player
    this.onEffectEnd = null
  }

  setEffect(effect, onEnd) {
    if (this.player.data.effect === effect) return
    if (this.player.data.effect) {
      this.player.data.effect = null
      this.onEffectEnd?.()
      this.onEffectEnd = null
    }
    this.player.data.effect = effect
    this.onEffectEnd = onEnd
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      ef: effect,
    })
  }

  updateDuration(delta) {
    if (this.player.data.effect?.duration) {
      this.player.data.effect.duration -= delta
      if (this.player.data.effect.duration <= 0) {
        this.setEffect(null)
      }
    }
  }
}
