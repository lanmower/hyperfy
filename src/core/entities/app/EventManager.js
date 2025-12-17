const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']

export class EventManager {
  constructor(app) {
    this.app = app
  }

  on(name, callback) {
    const app = this.app
    if (!app.listeners[name]) {
      app.listeners[name] = new Set()
    }
    if (app.listeners[name].has(callback)) return
    app.listeners[name].add(callback)
    if (hotEventNames.includes(name)) {
      app.hotEvents++
      app.world.setHot(app, app.hotEvents > 0)
    }
  }

  off(name, callback) {
    const app = this.app
    if (!app.listeners[name]) return
    if (!app.listeners[name].has(callback)) return
    app.listeners[name].delete(callback)
    if (hotEventNames.includes(name)) {
      app.hotEvents--
      app.world.setHot(app, app.hotEvents > 0)
    }
  }

  emit(name, a1, a2) {
    const app = this.app
    if (!app.listeners[name]) return
    for (const callback of app.listeners[name]) {
      callback(a1, a2)
    }
  }

  onWorldEvent(name, callback) {
    const app = this.app
    app.worldListeners.set(callback, name)
    app.world.events.on(name, callback)
  }

  offWorldEvent(name, callback) {
    const app = this.app
    app.worldListeners.delete(callback)
    app.world.events.off(name, callback)
  }

  clearEventListeners() {
    const app = this.app
    app.listeners = {}
    for (const [callback, name] of app.worldListeners) {
      app.world.events.off(name, callback)
    }
    app.worldListeners.clear()
  }

  onEvent(version, name, data, networkId) {
    const app = this.app
    if (app.building || (app.blueprint && version > app.blueprint.version)) {
      app.eventQueue.push({ version, name, data, networkId })
    } else {
      app.emit(name, data, networkId)
    }
  }

  flushEventQueue() {
    const app = this.app
    while (app.eventQueue.length) {
      const event = app.eventQueue[0]
      if (app.blueprint && event.version > app.blueprint.version) break
      app.eventQueue.shift()
      app.emit(event.name, event.data, event.networkId)
    }
  }
}
