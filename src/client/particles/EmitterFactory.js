// Emitter factory for particle system creation
import { BaseFactory } from '../../core/patterns/BaseFactory.js'
import { initializeEmitterState } from './EmitterState.js'
import { createEmitFn, emitByTime, emitByDistance, emitBursts } from './EmitterEmit.js'
import { createUpdateFn } from './EmitterUpdate.js'

export class EmitterFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    return this.createEmitter(config)
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('EmitterFactory config must be an object')
    }
    if (!config.id || !config.duration || !config.rate || !config.max) {
      throw new Error('EmitterFactory config requires id, duration, rate, max')
    }
  }

  static createEmitter(config) {
    const { state, particles, startupValues, shape, spritesheet, velocityApplier, dataAssembler, lifeCurves } = initializeEmitterState(config)

    const emit = createEmitFn(config, state, startupValues, shape, spritesheet, particles)
    const update = createUpdateFn(config, state, emit, emitByTime, emitByDistance, emitBursts, velocityApplier, spritesheet, dataAssembler, lifeCurves, particles)

    function destroy() {
      particles.length = 0
    }

    return {
      setEmitting(value) {
        state.emitting = value
      },
      update,
      destroy,
    }
  }
}

export function createEmitter(config) {
  return EmitterFactory.create(config)
}
