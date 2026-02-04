export class HitValidator {
  constructor(config = {}) {
    this.hitRadius = config.hitRadius || 1.0
    this.minDamage = config.minDamage || 10
    this.maxDamage = config.maxDamage || 100
    this.lagCompensator = config.lagCompensator || null
  }

  validateShot(shooter, target, shotData, serverTime, networkLatency) {
    if (!this.lagCompensator) {
      return { valid: false, reason: 'No lag compensator' }
    }

    const hitValidation = this.lagCompensator.validateHit(
      target,
      target,
      shotData.timestamp,
      networkLatency
    )

    if (!hitValidation.valid) {
      return { valid: false, reason: hitValidation.reason }
    }

    const targetState = hitValidation.targetState

    const hitDistance = this.calculateDistance(
      shotData.origin,
      targetState.position
    )

    if (hitDistance > this.hitRadius) {
      return { valid: false, reason: 'Outside hit radius', distance: hitDistance }
    }

    const damage = this.calculateDamage(shotData, targetState, hitDistance)

    return {
      valid: true,
      damage,
      targetState,
      hitDistance,
      rewindTime: hitValidation.rewindTime
    }
  }

  calculateDistance(from, to) {
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const dz = to[2] - from[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  calculateDamage(shotData, targetState, distance) {
    const distanceFactor = Math.max(0, 1 - distance / this.hitRadius)
    const baseDamage = shotData.damage || this.maxDamage

    const headshot = targetState.position[1] > 1.5
    const headshotMultiplier = headshot ? 2.0 : 1.0

    const damage = Math.round(baseDamage * distanceFactor * headshotMultiplier)
    return Math.max(this.minDamage, Math.min(this.maxDamage, damage))
  }

  applyDamage(target, damage) {
    target.health = Math.max(0, target.health - damage)
    return target.health > 0
  }

  detectSuspiciousShot(shooter, target, shotData) {
    const flags = []

    if (shotData.accuracy > 95) {
      flags.push('suspiciously_accurate')
    }

    if (shotData.fireRate > 25) {
      flags.push('fire_rate_too_high')
    }

    const distance = this.calculateDistance(shotData.origin, target.position)
    if (distance > 100) {
      flags.push('shot_from_too_far')
    }

    return {
      suspicious: flags.length > 0,
      flags
    }
  }
}
