import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('StateSync')

export class StateRegistry {
  constructor() {
    this.providers = new Map()
    this.dependencies = new Map()
  }

  register(name, provider, deps = []) {
    if (this.providers.has(name)) {
      logger.warn('State provider already registered', { name })
      return false
    }
    this.providers.set(name, provider)
    this.dependencies.set(name, deps)
    logger.debug('State provider registered', { name, dependencyCount: deps.length })
    return true
  }

  unregister(name) {
    const removed = this.providers.delete(name)
    this.dependencies.delete(name)
    if (removed) {
      logger.debug('State provider unregistered', { name })
    }
    return removed
  }

  getProvider(name) {
    return this.providers.get(name)
  }

  getAllProviders() {
    return Array.from(this.providers.entries())
  }

  getDependencies(name) {
    return this.dependencies.get(name) || []
  }

  getOrderedNames() {
    const visited = new Set()
    const ordered = []

    const visit = (name) => {
      if (visited.has(name)) return
      visited.add(name)

      const deps = this.getDependencies(name)
      for (const dep of deps) {
        if (this.providers.has(dep)) {
          visit(dep)
        }
      }
      ordered.push(name)
    }

    for (const name of this.providers.keys()) {
      visit(name)
    }

    return ordered
  }
}

export class StateSnapshot {
  constructor(id, timestamp, data = {}) {
    this.id = id
    this.timestamp = timestamp
    this.data = data
    this.version = 1
    this.metadata = {}
  }

  setMetadata(key, value) {
    this.metadata[key] = value
    return this
  }

  getMetadata(key) {
    return this.metadata[key]
  }

  addState(name, state) {
    this.data[name] = state
    return this
  }

  getState(name) {
    return this.data[name]
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      version: this.version,
      data: this.data,
      metadata: this.metadata
    }
  }

  static fromJSON(obj) {
    const snapshot = new StateSnapshot(obj.id, obj.timestamp, obj.data)
    snapshot.version = obj.version || 1
    snapshot.metadata = obj.metadata || {}
    return snapshot
  }
}

export class StateSyncManager {
  constructor(network) {
    this.network = network
    this.registry = new StateRegistry()
    this.lastSnapshot = null
    this.dirtyState = new Set()
  }

  registerStateProvider(name, provider, deps = []) {
    return this.registry.register(name, provider, deps)
  }

  unregisterStateProvider(name) {
    return this.registry.unregister(name)
  }

  markDirty(name) {
    this.dirtyState.add(name)
    logger.debug('State marked dirty', { name, totalDirty: this.dirtyState.size })
  }

  clearDirty() {
    this.dirtyState.clear()
  }

  isDirty(name) {
    return this.dirtyState.has(name)
  }

  getDirtyStates() {
    return Array.from(this.dirtyState)
  }

  encodeSnapshot(id, timestamp) {
    const snapshot = new StateSnapshot(id, timestamp)

    const ordered = this.registry.getOrderedNames()
    for (const name of ordered) {
      const provider = this.registry.getProvider(name)
      try {
        const state = provider.serialize?.()
        if (state !== undefined) {
          snapshot.addState(name, state)
          logger.debug('State serialized', { name })
        }
      } catch (err) {
        logger.error('Failed to serialize state', { name, error: err.message })
        throw err
      }
    }

    this.lastSnapshot = snapshot
    return snapshot
  }

  decodeSnapshot(snapshotData) {
    const snapshot = StateSnapshot.fromJSON(snapshotData)

    const ordered = this.registry.getOrderedNames()
    for (const name of ordered) {
      const provider = this.registry.getProvider(name)
      const state = snapshot.getState(name)

      if (state !== undefined && provider.deserialize) {
        try {
          provider.deserialize(state)
          logger.debug('State deserialized', { name })
        } catch (err) {
          logger.error('Failed to deserialize state', { name, error: err.message })
          throw err
        }
      }
    }

    this.lastSnapshot = snapshot
    return snapshot
  }

  getLastSnapshot() {
    return this.lastSnapshot
  }

  getStateStats() {
    return {
      totalProviders: this.registry.providers.size,
      dirtyCount: this.dirtyState.size,
      providers: Array.from(this.registry.providers.keys()),
      dirty: Array.from(this.dirtyState)
    }
  }

  destroy() {
    this.registry.providers.clear()
    this.registry.dependencies.clear()
    this.dirtyState.clear()
    this.lastSnapshot = null
    logger.debug('StateSyncManager destroyed')
  }
}
