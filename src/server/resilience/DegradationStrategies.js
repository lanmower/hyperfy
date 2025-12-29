export class DegradationStrategies {
  static createDatabaseStrategy(world, logger) {
    let cacheMode = false
    let readOnlyMode = false
    const messageBuffer = []

    return {
      name: 'database',
      critical: true,
      fallbackMode: 'cache-and-readonly',

      onDegrade: () => {
        cacheMode = true
        readOnlyMode = true
        logger?.warn('[DEGRADATION] Database degraded - using cache and read-only mode')
      },

      onRecover: () => {
        cacheMode = false
        readOnlyMode = false
        logger?.info('[DEGRADATION] Database recovered - resuming normal operations')
      },

      isReadOnly: () => readOnlyMode,
      isCacheMode: () => cacheMode,
    }
  }

  static createStorageStrategy(logger) {
    let tempStorage = new Map()
    let skipStorage = false

    return {
      name: 'storage',
      critical: false,
      fallbackMode: 'temporary-memory',

      onDegrade: () => {
        skipStorage = true
        tempStorage = new Map()
        logger?.warn('[DEGRADATION] Storage degraded - using temporary in-memory storage')
      },

      onRecover: () => {
        skipStorage = false
        const itemCount = tempStorage.size
        tempStorage.clear()
        logger?.info(`[DEGRADATION] Storage recovered - cleared ${itemCount} temporary items`)
      },

      getTempStorage: () => tempStorage,
      isSkipStorage: () => skipStorage,
    }
  }

  static createWebSocketStrategy(world, logger) {
    let messageQueue = []
    let broadcastFrequency = 1
    let reducedMode = false

    return {
      name: 'websocket',
      critical: true,
      fallbackMode: 'buffered-reduced-frequency',

      onDegrade: () => {
        reducedMode = true
        broadcastFrequency = 5
        messageQueue = []
        logger?.warn('[DEGRADATION] WebSocket degraded - buffering messages and reducing frequency')
      },

      onRecover: () => {
        reducedMode = false
        broadcastFrequency = 1

        if (messageQueue.length > 0) {
          logger?.info(`[DEGRADATION] WebSocket recovered - processing ${messageQueue.length} buffered messages`)

          for (const msg of messageQueue) {
            try {
              if (world?.network?.broadcast) {
                world.network.broadcast(msg)
              }
            } catch (err) {
              logger?.error(`[DEGRADATION] Error sending buffered message: ${err.message}`)
            }
          }
        }

        messageQueue = []
      },

      queueMessage: (msg) => {
        if (reducedMode) {
          messageQueue.push(msg)
          if (messageQueue.length > 1000) {
            messageQueue.shift()
          }
        }
      },

      shouldBroadcast: (tick) => {
        return !reducedMode || (tick % broadcastFrequency === 0)
      },

      getQueuedCount: () => messageQueue.length,
      isReducedMode: () => reducedMode,
    }
  }

  static createAnimationStrategy(logger) {
    let simpleMode = false
    let disableComplex = false

    return {
      name: 'animations',
      critical: false,
      fallbackMode: 'simple-only',

      onDegrade: () => {
        simpleMode = true
        disableComplex = true
        logger?.warn('[DEGRADATION] Animations degraded - disabling complex animations')
      },

      onRecover: () => {
        simpleMode = false
        disableComplex = false
        logger?.info('[DEGRADATION] Animations recovered - re-enabling all animations')
      },

      isSimpleMode: () => simpleMode,
      shouldDisableComplex: () => disableComplex,
    }
  }

  static createExternalAPIStrategy(logger) {
    let cachedData = new Map()
    let useDefaults = false
    let skipCalls = false

    return {
      name: 'external-api',
      critical: false,
      fallbackMode: 'cached-and-defaults',

      onDegrade: () => {
        useDefaults = true
        skipCalls = true
        logger?.warn('[DEGRADATION] External APIs degraded - using cached data and defaults')
      },

      onRecover: () => {
        useDefaults = false
        skipCalls = false
        cachedData.clear()
        logger?.info('[DEGRADATION] External APIs recovered - resuming external calls')
      },

      getCached: (key) => cachedData.get(key),
      setCached: (key, value) => cachedData.set(key, value),
      shouldSkipCall: () => skipCalls,
      shouldUseDefaults: () => useDefaults,
    }
  }

  static createUploadStrategy(logger) {
    let rejectUploads = false
    let maxFileSize = 200 * 1024 * 1024

    return {
      name: 'upload',
      critical: false,
      fallbackMode: 'reject-new-uploads',

      onDegrade: () => {
        rejectUploads = true
        maxFileSize = 10 * 1024 * 1024
        logger?.warn('[DEGRADATION] Upload degraded - rejecting new uploads and reducing max file size')
      },

      onRecover: () => {
        rejectUploads = false
        maxFileSize = 200 * 1024 * 1024
        logger?.info('[DEGRADATION] Upload recovered - accepting uploads at normal limits')
      },

      shouldRejectUploads: () => rejectUploads,
      getMaxFileSize: () => maxFileSize,
    }
  }

  static createAllStrategies(world, logger) {
    return {
      database: DegradationStrategies.createDatabaseStrategy(world, logger),
      storage: DegradationStrategies.createStorageStrategy(logger),
      websocket: DegradationStrategies.createWebSocketStrategy(world, logger),
      animations: DegradationStrategies.createAnimationStrategy(logger),
      'external-api': DegradationStrategies.createExternalAPIStrategy(logger),
      upload: DegradationStrategies.createUploadStrategy(logger),
    }
  }
}
