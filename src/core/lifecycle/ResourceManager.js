import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ResourceManager')

export class ResourceManager {
  constructor() {
    this.resources = new Map()
    this.byType = new Map()
    this.byOwner = new Map()
  }

  track(owner, type, resource, metadata = {}) {
    if (!owner || !type || !resource) {
      logger.warn('Invalid resource tracking parameters')
      return resource
    }

    const id = `${owner.constructor.name}:${type}:${Math.random().toString(36).slice(2)}`

    const entry = {
      id,
      owner,
      type,
      resource,
      metadata,
      createdAt: Date.now(),
      disposed: false
    }

    this.resources.set(id, entry)

    if (!this.byType.has(type)) {
      this.byType.set(type, [])
    }
    this.byType.get(type).push(id)

    const ownerName = owner.constructor.name
    if (!this.byOwner.has(ownerName)) {
      this.byOwner.set(ownerName, [])
    }
    this.byOwner.get(ownerName).push(id)

    return resource
  }

  untrack(id) {
    const entry = this.resources.get(id)
    if (!entry) return

    const typeList = this.byType.get(entry.type)
    if (typeList) {
      const typeIndex = typeList.indexOf(id)
      if (typeIndex >= 0) typeList.splice(typeIndex, 1)
    }

    const ownerName = entry.owner.constructor.name
    const ownerList = this.byOwner.get(ownerName)
    if (ownerList) {
      const ownerIndex = ownerList.indexOf(id)
      if (ownerIndex >= 0) ownerList.splice(ownerIndex, 1)
    }

    this.resources.delete(id)
  }

  getResourcesByType(type) {
    const ids = this.byType.get(type) || []
    return ids.map(id => this.resources.get(id)).filter(Boolean)
  }

  getResourcesByOwner(ownerName) {
    const ids = this.byOwner.get(ownerName) || []
    return ids.map(id => this.resources.get(id)).filter(Boolean)
  }

  disposeResourcesByOwner(ownerName) {
    const resources = this.getResourcesByOwner(ownerName)
    for (const entry of resources) {
      try {
        if (entry.resource && typeof entry.resource.dispose === 'function') {
          entry.resource.dispose()
        }
        entry.disposed = true
        this.untrack(entry.id)
      } catch (err) {
        logger.error('Failed to dispose owner resource', {
          owner: ownerName,
          type: entry.type,
          error: err.message
        })
      }
    }
  }

  disposeResourcesByType(type) {
    const resources = this.getResourcesByType(type)
    for (const entry of resources) {
      try {
        if (entry.resource && typeof entry.resource.dispose === 'function') {
          entry.resource.dispose()
        }
        entry.disposed = true
        this.untrack(entry.id)
      } catch (err) {
        logger.error('Failed to dispose type resource', {
          type,
          owner: entry.owner.constructor.name,
          error: err.message
        })
      }
    }
  }

  getStats() {
    const typeStats = {}
    for (const [type, ids] of this.byType.entries()) {
      typeStats[type] = ids.length
    }

    const ownerStats = {}
    for (const [owner, ids] of this.byOwner.entries()) {
      ownerStats[owner] = ids.length
    }

    return {
      totalTracked: this.resources.size,
      byType: typeStats,
      byOwner: ownerStats
    }
  }

  clear() {
    for (const entry of this.resources.values()) {
      try {
        if (entry.resource && typeof entry.resource.dispose === 'function') {
          entry.resource.dispose()
        }
      } catch (err) {
        logger.error('Failed to dispose resource during clear', {
          owner: entry.owner.constructor.name,
          type: entry.type,
          error: err.message
        })
      }
    }

    this.resources.clear()
    this.byType.clear()
    this.byOwner.clear()

    logger.info('ResourceManager cleared')
  }
}

export const resourceManager = new ResourceManager()
