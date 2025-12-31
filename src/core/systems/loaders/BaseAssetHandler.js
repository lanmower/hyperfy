import { AssetHandlerRegistry } from './AssetHandlerRegistry.js'

export class BaseAssetHandler {
  constructor() {
    this.registry = new AssetHandlerRegistry()
    this.setupHandlers()
  }

  setupHandlers() {
    throw new Error('setupHandlers must be implemented by subclass')
  }

  getHandlers() {
    return this.registry.getAll()
  }
}
