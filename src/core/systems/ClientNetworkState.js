import { StructuredLogger } from '../utils/logging/index.js'
import { Compressor } from './network/Compressor.js'
import { NetworkCore } from '../network/NetworkCore.js'

const logger = new StructuredLogger('ClientNetworkState')

export class ClientNetworkState {
  constructor() {
    this.id = null
    this.apiUrl = null
    this.assetsUrl = null
    this.maxUploadSize = 0
    this.serverTimeOffset = 0
    this.offlineMode = false
    this.initialized = false
    this.lastKnownState = null
    this.compressor = new Compressor()
    this.core = new NetworkCore()
  }

  setServerTime(t) {
    this.serverTimeOffset = performance.now() - t
    logger.info('Server time synchronized', { offset: this.serverTimeOffset })
  }

  getTime() {
    return performance.now() - this.serverTimeOffset
  }

  syncServerTime(serverTime) {
    this.serverTimeOffset = serverTime - performance.now()
  }

  updateFromSnapshot(data) {
    this.id = data.id
    this.apiUrl = data.apiUrl || ''
    this.assetsUrl = data.assetsUrl || ''
    this.maxUploadSize = data.maxUploadSize || 0
    this.serverTimeOffset = data.serverTime - performance.now()
  }

  markInitialized() {
    this.initialized = true
  }

  clearState() {
    this.lastKnownState = null
  }
}
