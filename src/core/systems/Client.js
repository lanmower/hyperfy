import { System } from './System.js'

import * as THREE from '../extras/three.js'
import { initYoga } from '../extras/yoga.js'

const BYTES_PER_MB = 1048576
const WORKER_RATE_MS = 200

let worker

export class Client extends System {
  static DEPS = {
    graphics: 'graphics',
    tick: 'tick',
    events: 'events',
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
      get renderer() { return world.graphics?.renderer },
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
    this.graphics.renderer.setAnimationLoop(this.tick)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  onSettingChanged = ({ key, value }) => {
    if (key === 'title') {
      document.title = value || 'World'
    }
  }

  onVisibilityChange = () => {
    if (!worker) {
      const script = `
        const rate = ${WORKER_RATE_MS}
        let intervalId = null;
        self.onmessage = e => {
          if (e.data === 'start' && !intervalId) {
            intervalId = setInterval(() => {
              self.postMessage(1);
            }, rate);
          }
          if (e.data === 'stop' && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      `
      const blob = new Blob([script], { type: 'application/javascript' })
      const blobUrl = URL.createObjectURL(blob)
      worker = new Worker(blobUrl)
      URL.revokeObjectURL(blobUrl)
      worker.onmessage = () => {
        const time = performance.now()
        this.tick(time)
      }
    }
    if (document.hidden) {
      this.graphics.renderer.setAnimationLoop(null)
      worker.postMessage('start')
    } else {
      worker.postMessage('stop')
      this.graphics.renderer.setAnimationLoop(this.tick)
    }
  }

  destroy() {
    this.graphics.renderer.setAnimationLoop(null)
    worker?.postMessage('stop')
    worker?.terminate()
    worker = null
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }
}
