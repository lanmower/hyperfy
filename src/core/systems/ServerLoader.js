import fs from 'fs-extra'
import path from 'path'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

import { BaseLoader } from './BaseLoader.js'
import { ServerAssetHandlers } from './loaders/ServerAssetHandlers.js'
import { ServerAssetFetcher } from './loaders/ServerAssetFetcher.js'

export class ServerLoader extends BaseLoader {
  static DEPS = {
    errorMonitor: 'errorMonitor',
    scripts: 'scripts',
  }

  constructor(world) {
    super(world)
    this.isServer = true
    this.rgbeLoader = new RGBELoader()
    this.handlers = new ServerAssetHandlers(world, this.errorMonitor, this.scripts)

    globalThis.self = { URL }
    globalThis.window = {}
    globalThis.document = {
      createElementNS: () => ({ style: {} }),
    }
  }

  getTypeHandlers() {
    return this.handlers.getHandlers()
  }

  async fetchArrayBuffer(url) {
    return ServerAssetFetcher.fetchArrayBuffer(url)
  }

  async fetchText(url) {
    return ServerAssetFetcher.fetchText(url)
  }
}
