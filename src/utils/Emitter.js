export class Emitter {
  constructor() { this._handlers = new Map() }

  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, [])
    this._handlers.get(event).push(fn)
    return this
  }

  off(event, fn) {
    const list = this._handlers.get(event)
    if (!list) return this
    const idx = list.indexOf(fn)
    if (idx !== -1) list.splice(idx, 1)
    return this
  }

  once(event, fn) {
    const wrapped = (...args) => { this.off(event, wrapped); fn(...args) }
    return this.on(event, wrapped)
  }

  emit(event, ...args) {
    const list = this._handlers.get(event)
    if (!list) return false
    for (const fn of list.slice()) { try { fn(...args) } catch (_) {} }
    return true
  }

  removeAllListeners(event) {
    if (event) this._handlers.delete(event)
    else this._handlers.clear()
    return this
  }
}
