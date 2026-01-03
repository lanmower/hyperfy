// Emitter update logic - frame updates, particle lifecycle, and data assembly
import { Vector3, Matrix4 } from '../../core/extras/three.js'

const v1 = new Vector3()
const v2 = new Vector3()
const m1 = new Matrix4()

export function updateParticleLifecycle(particle, config, lifeCurves) {
  const progress = particle.age / particle.life
  if (lifeCurves.size) {
    const multiplier = lifeCurves.size(progress)
    particle.size = particle.startSize * multiplier
  }
  if (lifeCurves.rotate) {
    const rotation = lifeCurves.rotate(progress)
    particle.rotation = particle.startRotation + rotation
  }
  if (lifeCurves.color) {
    particle.color = lifeCurves.color(progress)
  }
  if (lifeCurves.alpha) {
    const multiplier = lifeCurves.alpha(progress)
    particle.alpha = particle.startAlpha * multiplier
  }
  if (lifeCurves.emissive) {
    const multiplier = lifeCurves.emissive(progress)
    particle.emissive = particle.startEmissive * multiplier
  }
}

export function createUpdateFn(config, state, emit, emitByTime, emitByDistance, emitBursts, velocityApplier, spritesheet, dataAssembler, lifeCurves, particles) {
  return function update({
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
    state.delta = delta * config.timescale
    state.matrixWorld = m1.fromArray(matrixWorld)
    state.camPosition = v1.fromArray(camPosition)
    state.elapsed += state.delta
    state.currWorldPos = v2.setFromMatrixPosition(state.matrixWorld)

    if (state.lastWorldPos) {
      state.distanceMoved = state.currWorldPos.distanceTo(state.lastWorldPos)
      if (state.distanceMoved > 0.0001) {
        state.moveDir.copy(state.currWorldPos).sub(state.lastWorldPos).normalize()
      }
    } else {
      state.distanceMoved = 0
      state.lastWorldPos = state.currWorldPos.clone()
    }

    emitByTime(config, state, emit)
    emitByDistance(config, state, emit)
    state.lastWorldPos.copy(state.currWorldPos)
    emitBursts(config, state, emit)

    for (const particle of particles) {
      particle.age += state.delta
      if (particle.age >= particle.life) continue
      velocityApplier.apply(particle, state.delta, state.matrixWorld, state.currWorldPos)
      updateParticleLifecycle(particle, config, lifeCurves)
      particle.finalPosition.copy(particle.position)
      if (config.space === 'local') {
        particle.finalPosition.applyMatrix4(state.matrixWorld)
      }
      particle.distance = particle.position.distanceToSquared(state.camPosition)

      if (config.spritesheet) {
        particle.uv = spritesheet(particle, state.delta)
      }
    }

    handleEmitterEnd(config, state, particles)
    assembleAndSend(config, state, dataAssembler, particles, {
      aPosition,
      aRotation,
      aDirection,
      aSize,
      aColor,
      aAlpha,
      aEmissive,
      aUV,
    })
  }
}

export function handleEmitterEnd(config, state, particles) {
  if (state.elapsed >= state.duration) {
    state.elapsed = 0
    state.bursts = config.bursts.slice()
    if (!config.loop) state.emitting = false
  }
  if (!config.loop && !state.emitting && !state.ended) {
    const activeParticles = particles.filter(p => p.age < p.life).length
    if (activeParticles === 0) {
      state.ended = true
      self.postMessage({
        emitterId: config.id,
        op: 'end',
      })
    }
  }
}

export function assembleAndSend(config, state, dataAssembler, particles, buffers) {
  const n = dataAssembler.assemble(particles, config, buffers)
  self.postMessage(
    {
      emitterId: config.id,
      op: 'update',
      n,
      aPosition: buffers.aPosition,
      aRotation: buffers.aRotation,
      aDirection: buffers.aDirection,
      aSize: buffers.aSize,
      aColor: buffers.aColor,
      aAlpha: buffers.aAlpha,
      aEmissive: buffers.aEmissive,
      aUV: buffers.aUV,
    },
    [
      buffers.aPosition.buffer,
      buffers.aRotation.buffer,
      buffers.aDirection.buffer,
      buffers.aSize.buffer,
      buffers.aColor.buffer,
      buffers.aAlpha.buffer,
      buffers.aEmissive.buffer,
      buffers.aUV.buffer,
    ]
  )
}
