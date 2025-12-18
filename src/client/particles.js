const emitters = {}

import { Vector3, Quaternion, Matrix4 } from '../core/extras/three.js'
import { createShape } from './particles/shapes/index.js'
import { createNumberCurve, createColorCurve } from './particles/CurveInterpolators.js'
import { createNumericStarter, createColorStarter } from './particles/ValueStarters.js'
import { createSpritesheet } from './particles/SpritesheetManager.js'

const v1 = new Vector3()
const v2 = new Vector3()
const v3 = new Vector3()
const v4 = new Vector3()
const v5 = new Vector3()
const q1 = new Quaternion()
const q2 = new Quaternion()
const q3 = new Quaternion()
const m1 = new Matrix4()

const xAxis = new Vector3(1, 0, 0)
const yAxis = new Vector3(0, 1, 0)
const zAxis = new Vector3(0, 0, 1)

self.onmessage = msg => {
  msg = msg.data
  switch (msg.op) {
    case 'create':
      const system = createEmitter(msg)
      emitters[msg.id] = system
      break
    case 'emitting':
      emitters[msg.emitterId]?.setEmitting(msg.value)
      break
    case 'update':
      emitters[msg.emitterId]?.update(msg)
      break
    case 'destroy':
      emitters[msg.emitterId]?.destroy()
      emitters[msg.emitterId] = null
      break
  }
}

function createEmitter(config) {
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

  const particles = []

  for (let i = 0; i < config.max; i++) {
    particles.push({
      age: 0,
      life: 0,
      direction: new Vector3(),
      velocity: new Vector3(),
      distance: 0,
      speed: 10,
      finalPosition: new Vector3(),
      frameTime: 0,
      uv: [0, 0, 1, 1],

      position: new Vector3(),
      rotation: 0,
      startRotation: 0,
      size: 1,
      startSize: 1,
      color: [1, 1, 1],
      startColor: [1, 1, 1],
      alpha: 1,
      startAlpha: 1,
      emissive: 1,
      startEmissive: 1,

      emissionPosition: new Vector3(),
      emissionRotation: new Quaternion(),
    })
  }

  const life = createNumericStarter(config.life)
  const speed = createNumericStarter(config.speed)
  const size = createNumericStarter(config.size)
  const rotation = createNumericStarter(config.rotate)
  const color = createColorStarter(config.color)
  const alpha = createNumericStarter(config.alpha)
  const emissive = createNumericStarter(config.emissive)

  const shape = createShape(config.shape)
  const spritesheet = createSpritesheet(config.spritesheet)
  const force = config.force ? new Vector3().fromArray(config.force) : null
  const velocityLinear = config.velocityLinear ? new Vector3().fromArray(config.velocityLinear) : null
  const velocityOrbital = config.velocityOrbital ? new Vector3().fromArray(config.velocityOrbital) : null
  const velocityRadial = config.velocityRadial || null

  const sizeOverLife = config.sizeOverLife ? createNumberCurve(config.sizeOverLife) : null
  const rotateOverLife = config.rotateOverLife ? createNumberCurve(config.rotateOverLife) : null
  const colorOverLife = config.colorOverLife ? createColorCurve(config.colorOverLife) : null
  const alphaOverLife = config.alphaOverLife ? createNumberCurve(config.alphaOverLife) : null
  const emissiveOverLife = config.emissiveOverLife ? createNumberCurve(config.emissiveOverLife) : null

  function emit({ amount, matrixWorld }) {
    const progress = elapsed / config.duration // ratio through this cycle (0 to 1)
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
      if (force) {
        v3.copy(force).multiplyScalar(delta)
        particle.velocity.add(v3)
      }
      if (velocityLinear) {
        v3.copy(velocityLinear).multiplyScalar(delta)
        if (config.space === 'world') {
          particle.position.add(v3)
        } else {
          v3.applyQuaternion(q1.setFromRotationMatrix(matrixWorld))
          particle.position.add(v3)
        }
      }
      if (velocityOrbital) {
        v3.copy(particle.position)
        if (config.space === 'world') {
          v3.sub(particle.emissionPosition)
        }
        if (velocityOrbital.x !== 0) {
          q2.setFromAxisAngle(xAxis, velocityOrbital.x * delta)
          v3.applyQuaternion(q2)
        }
        if (velocityOrbital.y !== 0) {
          q2.setFromAxisAngle(yAxis, velocityOrbital.y * delta)
          v3.applyQuaternion(q2)
        }
        if (velocityOrbital.z !== 0) {
          q2.setFromAxisAngle(zAxis, velocityOrbital.z * delta)
          v3.applyQuaternion(q2)
        }

        if (config.space === 'world') {
          particle.position.copy(particle.emissionPosition).add(v3)
        } else {
          particle.position.copy(v3) // Just use the rotated vector directly
        }

        if (v3.length() > 0.001) {
          const orbitSpeed =
            v3.length() *
            Math.max(Math.abs(velocityOrbital.x), Math.abs(velocityOrbital.y), Math.abs(velocityOrbital.z))
          v4.crossVectors(
            velocityOrbital.x > 0
              ? new Vector3(1, 0, 0)
              : velocityOrbital.y > 0
                ? new Vector3(0, 1, 0)
                : new Vector3(0, 0, 1),
            v3
          ).normalize()
          v4.multiplyScalar(orbitSpeed)
          particle.velocity.copy(v4)
        }
      }
      if (velocityRadial) {
        const radialCenter = config.space === 'world' ? particle.emissionPosition : currWorldPos
        v3.copy(particle.position).sub(radialCenter)
        if (v3.length() > 0.001) {
          v3.normalize()
          v3.multiplyScalar(velocityRadial * delta)
          particle.position.add(v3)
          particle.velocity.add(v3.divideScalar(delta))
        }
      }
      v3.copy(particle.velocity).multiplyScalar(delta)
      particle.position.add(v3)
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
    if (config.blending === 'normal') {
      particles.sort((a, b) => b.distance - a.distance)
    }
    let n = 0
    for (const particle of particles) {
      if (particle.age >= particle.life) continue
      aPosition[n * 3 + 0] = particle.finalPosition.x
      aPosition[n * 3 + 1] = particle.finalPosition.y
      aPosition[n * 3 + 2] = particle.finalPosition.z
      aRotation[n * 1 + 0] = particle.rotation

      aDirection[n * 3 + 0] = particle.direction.x
      aDirection[n * 3 + 1] = particle.direction.y
      aDirection[n * 3 + 2] = particle.direction.z


      aSize[n * 1 + 0] = particle.size
      aColor[n * 3 + 0] = particle.color[0]
      aColor[n * 3 + 1] = particle.color[1]
      aColor[n * 3 + 2] = particle.color[2]
      aAlpha[n * 1 + 0] = particle.alpha
      aEmissive[n * 1 + 0] = particle.emissive
      aUV[n * 4 + 0] = particle.uv[0] // u0
      aUV[n * 4 + 1] = particle.uv[1] // v0
      aUV[n * 4 + 2] = particle.uv[2] // u1
      aUV[n * 4 + 3] = particle.uv[3] // v1
      n++
    }
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

