export class Emitter {
  constructor() {
    this.listeners = new Map()
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(fn)
    return () => this.off(event, fn)
  }

  off(event, fn) {
    if (!this.listeners.has(event)) return
    const list = this.listeners.get(event)
    const idx = list.indexOf(fn)
    if (idx !== -1) list.splice(idx, 1)
  }

  emit(event, ...args) {
    if (!this.listeners.has(event)) return
    for (const fn of this.listeners.get(event)) fn(...args)
  }

  once(event, fn) {
    const wrapper = (...args) => { this.off(event, wrapper); fn(...args) }
    this.on(event, wrapper)
  }
}
