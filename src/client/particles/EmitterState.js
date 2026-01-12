// Emitter state initialization and configuration parsing
import { Vector3, Matrix4 } from '../../core/extras/three.js'
import { createNumberCurve, createColorCurve } from './CurveInterpolators.js'
import { createNumericStarter, createColorStarter } from './ValueStarters.js'
import { createSpritesheet } from './SpritesheetManager.js'
import { createParticlePool } from './ParticlePool.js'
import { VelocityApplier } from './VelocityApplier.js'
import { ParticleDataAssembler } from './ParticleDataAssembler.js'
import { createShape } from './shapes/index.js'

export function initializeEmitterState(config) {
  config.bursts.sort((a, b) => a.time - b.time)

  const state = {
    elapsed: 0,
    duration: config.duration,
    newParticlesByTime: 0,
    newParticlesByDist: 0,
    emitting: config.emitting,
    bursts: config.bursts.slice(),
    ended: false,
    rateOverDistance: config.rateOverDistance,
    distanceRemainder: 0,
    lastWorldPos: null,
    moveDir: new Vector3(),
  }

  const particles = createParticlePool(config.max)

  const startupValues = {
    life: createNumericStarter(config.life),
    speed: createNumericStarter(config.speed),
    size: createNumericStarter(config.size),
    rotation: createNumericStarter(config.rotate),
    color: createColorStarter(config.color),
    alpha: createNumericStarter(config.alpha),
    emissive: createNumericStarter(config.emissive),
  }

  const shape = createShape(config.shape)
  const spritesheet = createSpritesheet(config.spritesheet)
  const velocityApplier = new VelocityApplier(config)
  const dataAssembler = new ParticleDataAssembler()

  const lifeCurves = {
    size: config.sizeOverLife ? createNumberCurve(config.sizeOverLife) : null,
    rotate: config.rotateOverLife ? createNumberCurve(config.rotateOverLife) : null,
    color: config.colorOverLife ? createColorCurve(config.colorOverLife) : null,
    alpha: config.alphaOverLife ? createNumberCurve(config.alphaOverLife) : null,
    emissive: config.emissiveOverLife ? createNumberCurve(config.emissiveOverLife) : null,
  }

  return {
    state,
    particles,
    startupValues,
    shape,
    spritesheet,
    velocityApplier,
    dataAssembler,
    lifeCurves,
  }
}
