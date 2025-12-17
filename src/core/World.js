import * as THREE from './extras/three.js'
import EventEmitter from 'eventemitter3'
import { ServiceContainer } from './di/ServiceContainer.js'
import { systemRegistry } from './systems/SystemRegistry.js'

export class World extends EventEmitter {
  constructor() {
    super()

    this.maxDeltaTime = 1 / 30 // 0.33333
    this.fixedDeltaTime = 1 / 50 // 0.01666
    this.frame = 0
    this.time = 0
    this.accumulator = 0
    this.systems = []
    this.networkRate = 1 / 8 // 8Hz
    this.assetsUrl = null
    this.assetsDir = null
    this.hot = new Set()

    this.di = new ServiceContainer()
    this.di.registerSingleton('world', this)

    this.rig = new THREE.Object3D()
    this.camera = new THREE.PerspectiveCamera(70, 0, 0.2, 1200)
    this.rig.add(this.camera)

    this.loadSystemsFromRegistry()
  }

  
  loadSystemsFromRegistry() {
    const systems = systemRegistry.getCurrentPlatformSystems()

    for (const { name, class: SystemClass } of systems) {
      this.register(name, SystemClass)
    }
  }

  register(key, System) {
    const system = new System(this)
    this.systems.push(system)
    this[key] = system
    this.di.registerSingleton(key, system)
    return system
  }

  async init(options) {
    this.storage = options.storage
    this.assetsDir = options.assetsDir
    for (const system of this.systems) {
      await system.init(options)
    }
    this.start()
  }

  start() {
    for (const system of this.systems) {
      system.start()
    }
  }

  tick = time => {
    this.preTick()
    time /= 1000
    let delta = time - this.time
    if (delta < 0) delta = 0
    if (delta > this.maxDeltaTime) {
      delta = this.maxDeltaTime
    }
    this.frame++
    this.time = time
    this.accumulator += delta
    const willFixedStep = this.accumulator >= this.fixedDeltaTime
    this.preFixedUpdate(willFixedStep)
    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime)
      this.postFixedUpdate(this.fixedDeltaTime)
      this.accumulator -= this.fixedDeltaTime
    }
    const alpha = this.accumulator / this.fixedDeltaTime
    this.preUpdate(alpha)
    this.update(delta, alpha)
    this.postUpdate(delta)
    this.lateUpdate(delta, alpha)
    this.postLateUpdate(delta)
    this.commit()
    this.postTick()
  }

  preTick() {
    for (const system of this.systems) {
      system.preTick()
    }
  }

  preFixedUpdate(willFixedStep) {
    for (const system of this.systems) {
      system.preFixedUpdate(willFixedStep)
    }
  }

  fixedUpdate(delta) {
    for (const item of this.hot) {
      item.fixedUpdate?.(delta)
    }
    for (const system of this.systems) {
      system.fixedUpdate(delta)
    }
  }

  postFixedUpdate(delta) {
    for (const system of this.systems) {
      system.postFixedUpdate(delta)
    }
  }

  preUpdate(alpha) {
    for (const system of this.systems) {
      system.preUpdate(alpha)
    }
  }

  update(delta) {
    for (const item of this.hot) {
      item.update?.(delta)
    }
    for (const system of this.systems) {
      system.update(delta)
    }
  }

  postUpdate(delta) {
    for (const system of this.systems) {
      system.postUpdate(delta)
    }
  }

  lateUpdate(delta) {
    for (const item of this.hot) {
      item.lateUpdate?.(delta)
    }
    for (const system of this.systems) {
      system.lateUpdate(delta)
    }
  }

  postLateUpdate(delta) {
    for (const item of this.hot) {
      item.postLateUpdate?.(delta)
    }
    for (const system of this.systems) {
      system.postLateUpdate(delta)
    }
  }

  commit() {
    for (const system of this.systems) {
      system.commit()
    }
  }

  postTick() {
    for (const system of this.systems) {
      system.postTick()
    }
  }

  setupMaterial = material => {
    this.environment.csm?.setupMaterial(material)
  }

  setHot(item, hot) {
    if (hot) {
      this.hot.add(item)
    } else {
      this.hot.delete(item)
    }
  }

  resolveURL(url, allowLocal) {
    if (!url) return url
    url = url.trim()
    if (url.startsWith('blob')) {
      return url
    }
    if (url.startsWith('asset://')) {
      if (this.assetsDir && allowLocal) {
        return url.replace('asset:/', this.assetsDir)
      } else if (this.assetsUrl) {
        return url.replace('asset:/', this.assetsUrl)
      } else {
        console.error('resolveURL: no assetsUrl or assetsDir defined')
        return url
      }
    }
    if (url.match(/^https?:\/\//i)) {
      return url
    }
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    if (url.startsWith('/')) {
      return url
    }
    return `https://${url}`
  }

  inject(runtime) {
    this.apps.inject(runtime)
  }

  destroy() {
    for (const system of this.systems) {
      system.destroy()
    }
  }
}
