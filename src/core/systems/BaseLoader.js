import { System } from './System.js'

export class BaseLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.preloadItems = []
    this.resolveURL = world.resolveURL
    this.setupTypeRegistry()
  }

  setupTypeRegistry() {
    this.typeHandlers = this.getTypeHandlers()
  }

  getTypeHandlers() {
    return {}
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }

    url = this.resolveURL(url, this.isServer)

    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return Promise.resolve(null)
    }

    const promise = handler(url).then(result => {
      this.results.set(key, result)
      return result
    })

    this.promises.set(key, promise)
    return promise
  }

  destroy() {
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
