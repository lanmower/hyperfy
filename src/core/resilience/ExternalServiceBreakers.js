import { circuitBreakerManager } from './CircuitBreaker.js'

export class ExternalServiceBreakers {
  static AI_BREAKER = 'external.ai'
  static LIVEKIT_BREAKER = 'external.livekit'
  static ASSET_LOADER_BREAKER = 'external.assetLoader'
  static STORAGE_BREAKER = 'external.storage'
  static DATABASE_BREAKER = 'external.database'

  static initialize() {
    circuitBreakerManager.create(this.AI_BREAKER, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000,
      halfOpenTimeout: 30000,
    })

    circuitBreakerManager.create(this.LIVEKIT_BREAKER, {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 120000,
      halfOpenTimeout: 45000,
    })

    circuitBreakerManager.create(this.ASSET_LOADER_BREAKER, {
      failureThreshold: 10,
      successThreshold: 5,
      timeout: 30000,
      halfOpenTimeout: 15000,
    })

    circuitBreakerManager.create(this.STORAGE_BREAKER, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000,
      halfOpenTimeout: 30000,
    })

    circuitBreakerManager.create(this.DATABASE_BREAKER, {
      failureThreshold: 2,
      successThreshold: 1,
      timeout: 90000,
      halfOpenTimeout: 45000,
    })
  }

  static async callAI(fn, fallback = null) {
    return circuitBreakerManager.execute(this.AI_BREAKER, fn, fallback)
  }

  static async callLiveKit(fn, fallback = null) {
    return circuitBreakerManager.execute(this.LIVEKIT_BREAKER, fn, fallback)
  }

  static async loadAsset(fn, fallback = null) {
    return circuitBreakerManager.execute(this.ASSET_LOADER_BREAKER, fn, fallback)
  }

  static async callStorage(fn, fallback = null) {
    return circuitBreakerManager.execute(this.STORAGE_BREAKER, fn, fallback)
  }

  static async queryDatabase(fn, fallback = null) {
    return circuitBreakerManager.execute(this.DATABASE_BREAKER, fn, fallback)
  }

  static getStatus() {
    return {
      ai: circuitBreakerManager.get(this.AI_BREAKER)?.getState(),
      livekit: circuitBreakerManager.get(this.LIVEKIT_BREAKER)?.getState(),
      assetLoader: circuitBreakerManager.get(this.ASSET_LOADER_BREAKER)?.getState(),
      storage: circuitBreakerManager.get(this.STORAGE_BREAKER)?.getState(),
      database: circuitBreakerManager.get(this.DATABASE_BREAKER)?.getState(),
    }
  }

  static reset(service) {
    circuitBreakerManager.reset(service)
  }

  static resetAll() {
    circuitBreakerManager.resetAll()
  }
}

ExternalServiceBreakers.initialize()
