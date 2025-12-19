import { BaseLoader } from './BaseLoader.js'
import { ServerAssetHandlers } from './loaders/ServerAssetHandlers.js'

export class ServerLoader extends BaseLoader {
  static DEPS = {
    errorMonitor: 'errorMonitor',
    scripts: 'scripts',
  }

  constructor(world) {
    super(world)
    this.isServer = true
    this.handlers = new ServerAssetHandlers(world, this.errorMonitor, this.scripts)
    globalThis.self = { URL }
    globalThis.window = {}
    globalThis.document = { createElementNS: () => ({ style: {} }) }
  }

  getTypeHandlers() {
    return this.handlers.getHandlers()
  }

  fetchArrayBuffer(url) {
    return this.handlers.fetchArrayBuffer(url)
  }

  fetchText(url) {
    return this.handlers.fetchText(url)
  }
}
