import { metrics } from './MetricsManager.js'

export class PerformanceMetrics {
  static recordEntityCreation(duration, type) {
    metrics.histogram('entity.create', duration)
    metrics.histogram(`entity.create.${type}`, duration)
    metrics.counter('entity.created')
  }

  static recordEntityDestruction(duration, type) {
    metrics.histogram('entity.destroy', duration)
    metrics.histogram(`entity.destroy.${type}`, duration)
    metrics.counter('entity.destroyed')
  }

  static recordEntitySync(duration, entityCount) {
    metrics.histogram('entity.sync', duration)
    metrics.gauge('entity.sync_count', entityCount)
  }

  static recordNetworkPacket(size, duration) {
    metrics.histogram('network.packet_size', size)
    metrics.histogram('network.packet_process', duration)
    metrics.counter('network.packets_processed')
    metrics.gauge('network.last_packet_size', size)
  }

  static recordNetworkBandwidth(bytesReceived, bytesSent) {
    metrics.gauge('network.bytes_received', bytesReceived)
    metrics.gauge('network.bytes_sent', bytesSent)
  }

  static recordPhysicsStep(duration, activeActors, totalActors) {
    metrics.histogram('physics.step', duration)
    metrics.gauge('physics.active_actors', activeActors)
    metrics.gauge('physics.total_actors', totalActors)
  }

  static recordPhysicsContact(contactCount) {
    metrics.counter('physics.contacts', contactCount)
  }

  static recordResourceLoad(duration, type, url, cached) {
    metrics.histogram('resource.load', duration)
    metrics.histogram(`resource.load.${type}`, duration)
    if (cached) {
      metrics.counter('resource.cache_hit')
    } else {
      metrics.counter('resource.cache_miss')
    }
    metrics.counter('resource.loads')
  }

  static recordResourceFail(type, reason) {
    metrics.counter('resource.failures')
    metrics.counter(`resource.failures.${type}`)
    metrics.counter(`resource.failures.${reason}`)
  }

  static recordScriptExecution(duration, appId, success) {
    metrics.histogram('script.execution', duration)
    if (success) {
      metrics.counter('script.success')
    } else {
      metrics.counter('script.errors')
    }
  }

  static recordBlueprintLoad(duration, hasModel, hasScript) {
    metrics.histogram('blueprint.load', duration)
    metrics.counter('blueprint.loaded')
    if (hasModel) metrics.counter('blueprint.with_model')
    if (hasScript) metrics.counter('blueprint.with_script')
  }

  static recordError(severity, system) {
    metrics.counter('errors.total')
    metrics.counter(`errors.${severity}`)
    metrics.counter(`errors.system.${system}`)
  }

  static recordMemory(entityCount, blueprintCount, appCount, playerCount) {
    metrics.gauge('memory.entities', entityCount)
    metrics.gauge('memory.blueprints', blueprintCount)
    metrics.gauge('memory.apps', appCount)
    metrics.gauge('memory.players', playerCount)
  }

  static recordSnapshot() {
    return metrics.snapshot()
  }

  static getMetrics() {
    return metrics.snapshot()
  }

  static reset() {
    metrics.reset()
  }
}
