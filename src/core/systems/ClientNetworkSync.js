import { StructuredLogger } from '../utils/logging/index.js'
import { readPacket } from '../packets.js'
import { storage } from '../storage.js'

const logger = new StructuredLogger('ClientNetworkSync')

export class ClientNetworkSync {
  constructor(networkState, wsManager) {
    this.state = networkState
    this.wsManager = wsManager
    this.queue = []
  }

  enqueue(method, data) {
    this.queue.push([method, data])
  }

  flush(clientNetwork) {
    while (this.queue.length) {
      let method, data
      try {
        const entry = this.queue.shift()
        if (!Array.isArray(entry) || entry.length < 2) {
          logger.warn('Invalid queue entry dropped', {
            entryType: typeof entry,
            isArray: Array.isArray(entry),
            length: entry?.length,
          })
          continue
        }
        ;[method, data] = entry
        if (!method) {
          logger.warn('Empty method in queue entry', { data })
          continue
        }
        const handler = clientNetwork[method]
        if (typeof handler !== 'function') {
          logger.warn('Handler not found or not a function', {
            method,
            handlerType: typeof handler,
          })
          continue
        }
        handler.call(clientNetwork, data)
      } catch (err) {
        logger.error('Error flushing queue', {
          method,
          error: err.message,
          errorType: err.name,
          dataType: typeof data,
        })
      }
    }
  }

  onPacket(e, clientNetwork) {
    const [method, data] = readPacket(e.data)
    if (!method) {
      logger.error('Invalid packet received', { dataType: typeof e.data, dataSize: e.data?.length || e.data?.byteLength || 0 })
      return
    }

    let finalData = data
    const hasCompressionEnvelope = data && typeof data === 'object' && typeof data.compressed === 'boolean'

    if (hasCompressionEnvelope) {
      if (data.compressed) {
        try {
          finalData = this.state.compressor.decompress(data)
        } catch (err) {
          logger.error('Failed to decompress packet data', { method, error: err.message })
          if (data.data && typeof data.data === 'object') {
            finalData = data.data
          } else {
            return
          }
        }
      } else {
        if (data.data === undefined) {
          logger.error('Uncompressed envelope missing data field', { method })
          return
        }
        finalData = data.data
      }
    }

    this.enqueue(method, finalData)
  }

  onSnapshot(data, world) {
    const isFullSnapshot = data.collections || data.entities || data.blueprints
    const isFrameUpdate = data.time !== undefined && data.frame !== undefined && !isFullSnapshot

    if (isFrameUpdate) {
      if (data.time !== undefined) {
        this.state.syncServerTime(data.time)
      }
      return
    }

    if (!isFullSnapshot) {
      logger.warn('Snapshot packet missing expected data', {
        hasCollections: !!data.collections,
        hasEntities: !!data.entities,
        hasBlueprints: !!data.blueprints,
        hasTime: data.time !== undefined,
        hasFrame: data.frame !== undefined,
      })
      return
    }

    if (!data.id || typeof data.serverTime !== 'number') {
      logger.error('Snapshot missing required fields', {
        hasId: !!data.id,
        serverTimeType: typeof data.serverTime,
      })
      return
    }

    this.state.updateFromSnapshot(data)

    if (world.loader) {
      if (data.settings && data.settings.avatar) {
        world.loader.preload('avatar', data.settings.avatar.url)
      }

      for (const item of data.blueprints || []) {
        if (item.preload && !item.disabled) {
          if (item.model) {
            const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
            world.loader.preload(type, item.model)
          }
          if (item.script) {
            world.loader.preload('script', item.script)
          }
          for (const value of Object.values(item.props || {})) {
            if (value === undefined || value === null || !value?.url || !value?.type) continue
            world.loader.preload(value.type, value.url)
          }
        }
      }

      for (const item of data.entities || []) {
        if (item.type === 'player' && item.owner === this.state.id) {
          const url = item.sessionAvatar || item.avatar
          world.loader.preload('avatar', url)
        }
      }

      if (world.loader.execPreload) {
        world.loader.execPreload()
      }
    }

    if (data.collections) world.collections.deserialize(data.collections)
    if (data.settings) world.settings.deserialize(data.settings)
    if (data.hasAdminCode !== undefined) world.settings.setHasAdminCode(data.hasAdminCode)
    if (data.chat) world.chat.deserialize(data.chat)
    if (data.blueprints) world.blueprints.deserialize(data.blueprints)
    if (data.entities) world.entities.deserialize(data.entities)
    if (data.livekit) world.livekit?.deserialize(data.livekit)
    storage.set('authToken', data.authToken)

    logger.info('Full snapshot received', { id: this.state.id })
  }

  clearQueue() {
    if (this.queue.length > 0) {
      logger.warn('Clearing stale queue entries on reconnect', { count: this.queue.length })
      this.queue = []
    }
  }
}
