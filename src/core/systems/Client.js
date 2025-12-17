import { System } from './System.js'

import * as THREE from '../extras/three.js'
import { initYoga } from '../extras/yoga.js'

let worker

/**
 * Client System
 *
 * - Runs on the client
 *
 *
 */
export class Client extends System {
  // DI Service Constants
  static DEPS = {
    graphics: 'graphics',
    tick: 'tick',
    events: 'events',
  }

  constructor(world) {
    super(world)
    window.world = world
    window.THREE = THREE
    this.setupDebugGlobals()
  }

  // DI Property Getters
  get graphics() { return this.getService(Client.DEPS.graphics) }
  get tick() { return this.getService(Client.DEPS.tick) }
  get events() { return this.getService(Client.DEPS.events) }

  setupDebugGlobals() {
    const world = this.world
    window.hyperfy = {
      world,
      get entities() { return Array.from(world.entities.items.values()) },
      get players() { return Array.from(world.entities.players.values()) },
      get player() { return world.entities.player },
      get apps() { return Array.from(world.entities.items.values()).filter(e => e.isApp) },
      get blueprints() { return Array.from(world.blueprints.items.values()) },
      get scene() { return world.stage?.scene },
      get camera() { return world.camera },
      get renderer() { return world.graphics?.renderer },
      get physics() { return world.physics },
      get network() { return world.network },
      get loader() { return world.loader },
      get settings() { return world.settings },
      get prefs() { return world.prefs },
      get chat() { return world.chat },
      get errors() { return world.errorMonitor?.getErrors() || [] },
      get stats() { return world.errorMonitor?.getStats() },
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
        return m ? { used: (m.usedJSHeapSize / 1048576).toFixed(1) + 'MB', total: (m.totalJSHeapSize / 1048576).toFixed(1) + 'MB' } : null
      },
      raycast(x, y) { return world.stage?.raycastPointer({ x, y }) }
    }
  }

  async init({ loadYoga }) {
    await loadYoga
    initYoga()
  }

  start() {
    this.graphics.renderer.setAnimationLoop(this.tick)
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    this.events.on('settingChanged', this.onSettingChanged)
  }

  onSettingChanged = ({ key, value }) => {
    if (key === 'title') {
      document.title = value || 'World'
    }
  }

  onVisibilityChange = () => {
    // if the tab is no longer active, browsers stop triggering requestAnimationFrame.
    // this is obviously bad because physics stop running and we stop processing websocket messages etc.
    // instead, we stop using requestAnimationFrame and get a worker to tick at a slower rate using setInterval
    // and notify us.
    // this allows us to keep everything running smoothly.
    // See: https://gamedev.stackexchange.com/a/200503 (kinda fucking genius)
    //
    // spawn worker if we haven't yet
    if (!worker) {
      const script = `
        const rate = 1000 / 5 // 5 FPS
        let intervalId = null;
        self.onmessage = e => {
          if (e.data === 'start' && !intervalId) {
            intervalId = setInterval(() => {
              self.postMessage(1);
            }, rate);
            console.log('[worker] tick started')
          }
          if (e.data === 'stop' && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log('[worker] tick stopped')
          }
        }
      `
      const blob = new Blob([script], { type: 'application/javascript' })
      worker = new Worker(URL.createObjectURL(blob))
      worker.onmessage = () => {
        const time = performance.now()
        this.tick(time)
      }
    }
    if (document.hidden) {
      // stop rAF
      this.graphics.renderer.setAnimationLoop(null)
      // tell the worker to start
      worker.postMessage('start')
    } else {
      // tell the worker to stop
      worker.postMessage('stop')
      // resume rAF
      this.graphics.renderer.setAnimationLoop(this.tick)
    }
  }

  destroy() {
    this.graphics.renderer.setAnimationLoop(null)
    worker?.postMessage('stop')
    worker = null
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }
}
