import { emoteUrls } from '../../extras/playerEmotes.js'
import { storage } from '../../storage.js'
import { SnapshotCodec } from './SnapshotCodec.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { tracer } from '../../utils/tracing/index.js'

const logger = new StructuredLogger('SnapshotProcessor')

export class SnapshotProcessor {
  constructor(network) {
    this.network = network
    this.stateSync = null
  }

  setStateSync(stateSync) {
    this.stateSync = stateSync
    logger.debug('StateSync manager registered')
  }

  process(data) {
    tracer.traceSync(`snapshot_process`, span => {
      logger.info('Snapshot process started', { networkId: data.id, entityCount: data.entities?.length, blueprintCount: data.blueprints?.length })

      span?.setAttribute('networkId', data.id)
      span?.setAttribute('entityCount', data.entities?.length || 0)
      span?.setAttribute('blueprintCount', data.blueprints?.length || 0)
      span?.setAttribute('timestamp', data.serverTime)

      this.network.id = data.id
      this.network.serverTimeOffset = data.serverTime - performance.now()
      this.network.apiUrl = data.apiUrl
      this.network.maxUploadSize = data.maxUploadSize
      this.network.assetsUrl = data.assetsUrl

      const preloadSpan = tracer.startSpan(`snapshot_preload_assets`, span?.traceId)
      this.preloadAssets(data)
      tracer.endSpan(preloadSpan)

      logger.info('Deserializing snapshot state')
      span?.addEvent('deserialization_started')

      const deserializeSpan = tracer.startSpan(`snapshot_deserialize`, span?.traceId)
      try {
        if (this.stateSync) {
          this.stateSync.decodeSnapshot(data)
        } else {
          SnapshotCodec.deserializeState(data, this.network)
        }
        span?.setAttribute('deserializeStatus', 'success')
        tracer.endSpan(deserializeSpan)
      } catch (err) {
        span?.setAttribute('deserializeStatus', 'error')
        tracer.endSpan(deserializeSpan, 'error', err)
        throw err
      }

      logger.info('Snapshot state deserialization complete')
      storage.set('authToken', data.authToken)
      span?.setAttribute('status', 'success')
    })
  }

  preloadAssets(data) {
    if (!this.network.loader) {
      logger.info('Loader not available, skipping preload')
      return
    }
    if (data.settings && data.settings.avatar) {
      this.network.loader.preload('avatar', data.settings.avatar.url)
    }

    if (Array.isArray(data.blueprints)) {
      for (const item of data.blueprints) {
        if (item.preload && !item.disabled) {
          if (item.model) {
            const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
            this.network.loader.preload(type, item.model)
          }
          if (item.script) {
            this.network.loader.preload('script', item.script)
          }
          for (const value of Object.values(item.props || {})) {
            if (value === undefined || value === null || !value?.url || !value?.type) continue
            this.network.loader.preload(value.type, value.url)
          }
        }
      }
    } else {
      logger.warn('Blueprints not found or not array', { blueprintsType: typeof data.blueprints })
    }

    for (const url of emoteUrls) {
      this.network.loader.preload('emote', url)
    }

    if (Array.isArray(data.entities)) {
      for (const item of data.entities) {
        if (item.type === 'player' && item.userId === this.network.id) {
          const url = item.sessionAvatar || item.avatar
          this.network.loader.preload('avatar', url)
        }
      }
    } else {
      logger.warn('Entities not found or not array', { entitiesType: typeof data.entities })
    }

    this.network.loader.execPreload()
  }
}
