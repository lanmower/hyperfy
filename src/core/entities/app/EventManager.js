export class EventManager {
  constructor(app) {
    this.app = app
    this.listeners = {}
    this.worldListeners = new Map()
    this.eventQueue = []
    this.hotEvents = 0
  }

  on(name, callback) {
    if (!this.listeners[name]) this.listeners[name] = new Set()
    if (this.listeners[name].has(callback)) return
    this.listeners[name].add(callback)
    const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']
    if (hotEventNames.includes(name)) {
      this.hotEvents++
      this.app.world.setHot(this.app, this.hotEvents > 0)
    }
  }

  off(name, callback) {
    if (!this.listeners[name]) return
    if (!this.listeners[name].has(callback)) return
    this.listeners[name].delete(callback)
    const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']
    if (hotEventNames.includes(name)) {
      this.hotEvents--
      this.app.world.setHot(this.app, this.hotEvents > 0)
    }
  }

  emit(name, a1, a2) {
    if (!this.listeners[name]) return
    for (const callback of this.listeners[name]) {
      callback(a1, a2)
    }
  }

  onWorldEvent(name, callback) {
    this.worldListeners.set(callback, name)
    this.app.world.events.on(name, callback)
  }

  offWorldEvent(name, callback) {
    this.worldListeners.delete(callback)
    this.app.world.events.off(name, callback)
  }

  onEvent(version, name, data, networkId) {
    this.eventQueue.push({ version, name, data, networkId })
    this.emit(name, data)
  }

  flushEventQueue() {
    this.eventQueue = []
  }

  clearEventListeners() {
    this.listeners = {}
    this.worldListeners.forEach((eventName, callback) => {
      this.app.world.events.off(eventName, callback)
    })
    this.worldListeners.clear()
    this.hotEvents = 0
  }

  cleanup() {
    this.clearEventListeners()
  }
}
