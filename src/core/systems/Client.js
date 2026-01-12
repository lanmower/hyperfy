import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/StructuredLogger.js'
import { NetworkLogSink } from '../utils/logging/NetworkLogSink.js'

import * as THREE from '../extras/three.js'
import { initYoga } from '../extras/yoga.js'

const BYTES_PER_MB = 1048576
const WORKER_RATE_MS = 200

let worker
let networkLogSink = null
const originalStructuredLoggerAddSink = StructuredLogger.prototype.addSink

export class Client extends System {
  static DEPS = {
    graphics: 'graphics',
    tick: 'tick',
    events: 'events',
    network: 'network',
  }

  static EVENTS = {
    settingChanged: 'onSettingChanged',
  }

  constructor(world) {
    super(world)
    window.world = world
    window.THREE = THREE
    this.setupDebugGlobals()
  }

  setupDebugGlobals() {
    const world = this.world
    window.hyperfy = {
      world,
      get entities() { return Array.from(world.entities.items.values()) },
      get players() { return Array.from(world.entities.players.values()) },
      get player() { return world.entities.player },
      get apps() { return world.entities.apps },
      get blueprints() { return Array.from(world.blueprints.items.values()) },
      get scene() { return world.stage?.scene },
      get camera() { return world.camera },
      get graphics() { return world.graphics },
      get renderer() { return world.graphics?.app },
      get physics() { return world.physics },
      get network() { return world.network },
      get loader() { return world.loader },
      get settings() { return world.settings },
      get prefs() { return world.prefs },
      get chat() { return world.chat },
      get errors() { return world.errors?.getErrors() || [] },
      get stats() { return world.errors?.getStats() },
      get systems() { return world.systems },
      entity(id) { return world.entities.get(id) },
      blueprint(id) { return world.blueprints.get(id) },
      find(name) { return Array.from(world.entities.items.values()).filter(e => e.data?.name?.includes(name)) },
      inspect(id) {
        const e = world.entities.get(id)
        if (!e) return null
        return { data: e.data, state: e.state, position: e.position, quaternion: e.quaternion }
      },
      loaded() { return Array.from(world.loader?.results?.keys() || []) },
      memory() {
        const m = performance.memory
        return m ? { used: (m.usedJSHeapSize / BYTES_PER_MB).toFixed(1) + 'MB', total: (m.totalJSHeapSize / BYTES_PER_MB).toFixed(1) + 'MB' } : null
      },
      raycast(x, y) { return world.stage?.raycastPointer({ x, y }) }
    }
  }

  async init({ loadYoga }) {
    await loadYoga
    initYoga()
  }

  start() {
    if (this.graphics.app) {
      this.graphics.startApp()
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.setupNetworkLogging()
  }

  setupNetworkLogging() {
    if (!this.network || networkLogSink) return

    networkLogSink = new NetworkLogSink(this.network)

    StructuredLogger.prototype.addSink = function(sink) {
      originalStructuredLoggerAddSink.call(this, sink)
      if (networkLogSink && sink !== networkLogSink) {
        originalStructuredLoggerAddSink.call(this, networkLogSink)
      }
      return this
    }

    setInterval(() => {
      if (networkLogSink) {
        networkLogSink.flush()
      }
    }, 5000)
  }

  onSettingChanged = ({ key, value }) => {
    if (key === 'title') {
      document.title = value || 'World'
    }
  }

  onVisibilityChange = () => {
    if (document.hidden) {
      if (this.graphics.app?.isRunning) {
        this.graphics.app.pause()
      }
    } else {
      if (this.graphics.app && !this.graphics.app.isRunning) {
        this.graphics.app.resume()
      }
    }
  }

  destroy() {
    if (this.graphics.app?.isRunning) {
      this.graphics.app.pause()
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    if (networkLogSink) {
      networkLogSink.destroy()
      networkLogSink = null
    }
  }
}
