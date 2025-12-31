import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ParticleWorkerCoordinator')

export class ParticleWorkerCoordinator {
  constructor(worker) {
    this.worker = worker
    this.emitters = new Map()
  }

  registerEmitter(id, onMessage) {
    this.emitters.set(id, { onMessage })
  }

  unregisterEmitter(id) {
    this.emitters.delete(id)
  }

  send(emitterId, message) {
    const transfers = this.extractTransfers(message)
    message.emitterId = emitterId
    this.worker.postMessage(message, transfers)
  }

  extractTransfers(message) {
    if (message.op !== 'update') return []

    return [
      message.aPosition?.buffer,
      message.aRotation?.buffer,
      message.aDirection?.buffer,
      message.aSize?.buffer,
      message.aColor?.buffer,
      message.aAlpha?.buffer,
      message.aEmissive?.buffer,
      message.aUV?.buffer,
    ].filter(buffer => buffer !== undefined)
  }

  handleWorkerMessage(event) {
    const message = event.data
    const emitter = this.emitters.get(message.emitterId)
    if (emitter && emitter.onMessage) {
      emitter.onMessage(message)
    }
  }

  handleWorkerError(error) {
    logger.error('Particle worker error', { error: error.message || String(error) })
  }

  dispose() {
    this.emitters.clear()
  }
}
