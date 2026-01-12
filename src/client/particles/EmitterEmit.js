// Emit logic for particles - handles spawning and initialization
import { Vector3, Quaternion, Matrix4 } from '../../core/extras/three.js'

const q1 = new Quaternion()
const m1 = new Matrix4()

export function createEmitFn(config, state, startupValues, shape, spritesheet, particles) {
  return function emit({ amount, matrixWorld }) {
    const progress = state.elapsed / config.duration
    for (let i = 0; i < amount; i++) {
      const particle = particles.find(p => p.age >= p.life)
      if (!particle) break
      particle.age = 0
      particle.life = startupValues.life(progress)
      particle.speed = startupValues.speed(progress)
      particle.size = startupValues.size(progress)
      particle.startSize = particle.size
      particle.rotation = startupValues.rotation(progress)
      particle.startRotation = particle.rotation
      particle.color = startupValues.color(progress)
      particle.alpha = startupValues.alpha(progress)
      particle.startAlpha = particle.alpha
      particle.emissive = startupValues.emissive(progress)
      particle.startEmissive = particle.emissive

      particle.frameTime = 0
      particle.uv = spritesheet(particle, 0)

      shape(particle.position, particle.direction)

      if (config.direction > 0) {
        const randomFactor = config.direction
        particle.direction.x += (Math.random() * 2 - 1) * randomFactor
        particle.direction.y += (Math.random() * 2 - 1) * randomFactor
        particle.direction.z += (Math.random() * 2 - 1) * randomFactor
        particle.direction.normalize()
      }

      particle.velocity.copy(particle.direction).multiplyScalar(particle.speed)

      particle.distance = Infinity

      if (config.space === 'world') {
        particle.position.applyMatrix4(matrixWorld)
        q1.setFromRotationMatrix(matrixWorld)
        particle.direction.applyQuaternion(q1)
        particle.velocity.applyQuaternion(q1)

        particle.emissionPosition.setFromMatrixPosition(matrixWorld)
        particle.emissionRotation.setFromRotationMatrix(matrixWorld)
      } else {
        particle.emissionPosition.set(0, 0, 0)
        particle.emissionRotation.identity()
      }
    }
  }
}

export function emitByTime(config, state, emit) {
  if (state.emitting) {
    state.newParticlesByTime += config.rate * state.delta
    const amount = Math.floor(state.newParticlesByTime)
    if (amount > 0) emit({ amount, matrixWorld: state.matrixWorld })
    state.newParticlesByTime -= amount
  }
}

export function emitByDistance(config, state, emit) {
  if (state.emitting && config.rateOverDistance && state.distanceMoved > 0) {
    const distanceBetweenParticles = 1.0 / config.rateOverDistance
    state.distanceRemainder += state.distanceMoved

    const particlesToEmit = Math.floor(state.distanceRemainder / distanceBetweenParticles)

    if (particlesToEmit > 0) {
      const Vector3 = state.lastWorldPos.constructor
      const Matrix4 = state.matrixWorld.constructor
      for (let i = 0; i < particlesToEmit; i++) {
        const lerpFactor = (i + 1) / (particlesToEmit + 1)
        const emitPosition = new Vector3().copy(state.lastWorldPos).lerp(state.currWorldPos, lerpFactor)
        const tempMatrix = new Matrix4().copy(state.matrixWorld)
        tempMatrix.setPosition(emitPosition)
        emit({ amount: 1, matrixWorld: tempMatrix })
      }
      state.distanceRemainder -= particlesToEmit * distanceBetweenParticles
    }
  }
}

export function emitBursts(config, state, emit) {
  while (state.bursts.length && state.bursts[0].time <= state.elapsed) {
    const burst = state.bursts.shift()
    emit({ amount: burst.count, matrixWorld: state.matrixWorld })
  }
}
