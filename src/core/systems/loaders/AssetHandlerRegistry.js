export class AssetHandlerRegistry {
  constructor() {
    this.handlers = new Map()
  }

  register(type, handler) {
    this.handlers.set(type, handler)
  }

  has(type) {
    return this.handlers.has(type)
  }

  get(type) {
    return this.handlers.get(type)
  }

  handle(type, ...args) {
    const handler = this.handlers.get(type)
    return handler?.(...args)
  }

  getAll() {
    return Object.fromEntries(this.handlers)
  }

  clear() {
    this.handlers.clear()
  }
}
