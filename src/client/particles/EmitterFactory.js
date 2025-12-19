import { Vector3, Quaternion, Matrix4 } from '../../core/extras/three.js'
import { createShape } from './shapes/index.js'
import { createNumberCurve, createColorCurve } from './CurveInterpolators.js'
import { createNumericStarter, createColorStarter } from './ValueStarters.js'
import { createSpritesheet } from './SpritesheetManager.js'
import { createParticlePool } from './ParticlePool.js'
import { VelocityApplier } from './VelocityApplier.js'
import { ParticleDataAssembler } from './ParticleDataAssembler.js'

const v1 = new Vector3()
const v2 = new Vector3()
const q1 = new Quaternion()
const m1 = new Matrix4()

export function createEmitter(config) {
  config.bursts.sort((a, b) => a.time - b.time)

  let elapsed = 0
  let duration = config.duration
  let newParticlesByTime = 0
  let newParticlesByDist = 0
  let emitting = config.emitting
  let bursts = config.bursts.slice()
  let ended = false
  let rateOverDistance = config.rateOverDistance
  let distanceRemainder = 0
  let lastWorldPos = null
  let moveDir = new Vector3()

  const particles = createParticlePool(config.max)

  const life = createNumericStarter(config.life)
  const speed = createNumericStarter(config.speed)
  const size = createNumericStarter(config.size)
  const rotation = createNumericStarter(config.rotate)
  const color = createColorStarter(config.color)
  const alpha = createNumericStarter(config.alpha)
  const emissive = createNumericStarter(config.emissive)

  const shape = createShape(config.shape)
  const spritesheet = createSpritesheet(config.spritesheet)
  const velocityApplier = new VelocityApplier(config)
  const dataAssembler = new ParticleDataAssembler()

  const sizeOverLife = config.sizeOverLife ? createNumberCurve(config.sizeOverLife) : null
  const rotateOverLife = config.rotateOverLife ? createNumberCurve(config.rotateOverLife) : null
  const colorOverLife = config.colorOverLife ? createColorCurve(config.colorOverLife) : null
  const alphaOverLife = config.alphaOverLife ? createNumberCurve(config.alphaOverLife) : null
  const emissiveOverLife = config.emissiveOverLife ? createNumberCurve(config.emissiveOverLife) : null

  function emit({ amount, matrixWorld }) {
    const progress = elapsed / config.duration
    for (let i = 0; i < amount; i++) {
      const particle = particles.find(p => p.age >= p.life)
      if (!particle) break
      particle.age = 0
      particle.life = life(progress)
      particle.speed = speed(progress)
      particle.size = size(progress)
      particle.startSize = particle.size
      particle.rotation = rotation(progress)
      particle.startRotation = particle.rotation
      particle.color = color(progress)
      particle.alpha = alpha(progress)
      particle.startAlpha = particle.alpha
      particle.emissive = emissive(progress)
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

  function update({
    delta,
    camPosition,
    matrixWorld,
    aPosition,
    aRotation,
    aDirection,
    aSize,
    aColor,
    aAlpha,
    aEmissive,
    aUV,
  }) {
    delta *= config.timescale
    matrixWorld = m1.fromArray(matrixWorld)
    camPosition = v1.fromArray(camPosition)
    elapsed += delta
    const currWorldPos = v2.setFromMatrixPosition(matrixWorld)
    let distanceMoved
    if (lastWorldPos) {
      distanceMoved = currWorldPos.distanceTo(lastWorldPos)
      if (distanceMoved > 0.0001) {
        moveDir.copy(currWorldPos).sub(lastWorldPos).normalize()
      }
    } else {
      distanceMoved = 0
      lastWorldPos = currWorldPos.clone()
    }


    if (emitting) {
      newParticlesByTime += config.rate * delta
      const amount = Math.floor(newParticlesByTime)
      if (amount > 0) emit({ amount, matrixWorld })
      newParticlesByTime -= amount
    }
    if (emitting && rateOverDistance && distanceMoved > 0) {
      const distanceBetweenParticles = 1.0 / rateOverDistance

      distanceRemainder += distanceMoved

      const particlesToEmit = Math.floor(distanceRemainder / distanceBetweenParticles)

      if (particlesToEmit > 0) {
        for (let i = 0; i < particlesToEmit; i++) {
          const lerpFactor = (i + 1) / (particlesToEmit + 1)

          const emitPosition = new Vector3().copy(lastWorldPos).lerp(currWorldPos, lerpFactor)

          const tempMatrix = new Matrix4().copy(matrixWorld)
          tempMatrix.setPosition(emitPosition)

          emit({
            amount: 1,
            matrixWorld: tempMatrix,
          })
        }

        distanceRemainder -= particlesToEmit * distanceBetweenParticles
      }
    }
    lastWorldPos.copy(currWorldPos)
    while (bursts.length && bursts[0].time <= elapsed) {
      const burst = bursts.shift()
      emit({ amount: burst.count, matrixWorld })
    }
    for (const particle of particles) {
      particle.age += delta
      if (particle.age >= particle.life) continue
      const progress = particle.age / particle.life
      velocityApplier.apply(particle, delta, matrixWorld, currWorldPos)
      if (sizeOverLife) {
        const multiplier = sizeOverLife(progress)
        particle.size = particle.startSize * multiplier
      }
      if (rotateOverLife) {
        const rotation = rotateOverLife(progress)
        particle.rotation = particle.startRotation + rotation
      }
      if (colorOverLife) {
        particle.color = colorOverLife(progress)
      }
      if (alphaOverLife) {
        const multiplier = alphaOverLife(progress)
        particle.alpha = particle.startAlpha * multiplier
      }
      if (emissiveOverLife) {
        const multiplier = emissiveOverLife(progress)
        particle.emissive = particle.startEmissive * multiplier
      }
      particle.finalPosition.copy(particle.position)
      if (config.space === 'local') {
        particle.finalPosition.applyMatrix4(matrixWorld)
      }
      particle.distance = particle.position.distanceToSquared(camPosition)

      if (config.spritesheet) {
        particle.uv = spritesheet(particle, delta)
      }
    }
    if (elapsed >= duration) {
      elapsed = 0
      bursts = config.bursts.slice()
      if (!config.loop) emitting = false
    }
    if (!config.loop && !emitting && !ended) {
      const activeParticles = particles.filter(p => p.age < p.life).length
      if (activeParticles === 0) {
        ended = true
        self.postMessage({
          emitterId: config.id,
          op: 'end',
        })
      }
    }
    const n = dataAssembler.assemble(particles, config, {
      aPosition,
      aRotation,
      aDirection,
      aSize,
      aColor,
      aAlpha,
      aEmissive,
      aUV,
    })
    self.postMessage(
      {
        emitterId: config.id,
        op: 'update',
        n,
        aPosition,
        aRotation,
        aDirection,
        aSize,
        aColor,
        aAlpha,
        aEmissive,
        aUV,
      },
      [
        aPosition.buffer,
        aRotation.buffer,
        aDirection.buffer,
        aSize.buffer,
        aColor.buffer,
        aAlpha.buffer,
        aEmissive.buffer,
        aUV.buffer,
      ]
    )
  }

  function destroy() {
    particles.length = 0
  }

  return {
    setEmitting(value) {
      emitting = value
    },
    update,
    destroy,
  }
}
