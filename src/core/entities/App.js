import * as THREE from '../extras/three.js'
import { isArray, isFunction, isNumber, isString } from 'lodash-es'
import moment from 'moment'

import { BaseEntity } from './BaseEntity.js'
import { createNode } from '../extras/createNode.js'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3.js'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { getRef } from '../nodes/Node.js'
import { Layers } from '../extras/Layers.js'
import { createPlayerProxy } from '../extras/createPlayerProxy.js'

const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']

const Modes = {
  ACTIVE: 'active',
  MOVING: 'moving',
  LOADING: 'loading',
  CRASHED: 'crashed',
}

export class App extends BaseEntity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isApp = true
    this.n = 0
    this.worldNodes = new Set()
    this.hotEvents = 0
    this.worldListeners = new Map()
    this.listeners = {}
    this.eventQueue = []
    this.snaps = []
    this.root = createNode('group')
    this.fields = []
    this.target = null
    this.projectLimit = Infinity
    this.keepActive = false
    this.playerProxies = new Map()
    this.hitResultsPool = []
    this.hitResults = []
    this.deadHook = { dead: false }
    this.build()
  }

  createNode(name, data) {
    const node = createNode(name, data)
    return node
  }

  async build(crashed) {
    this.building = true
    const n = ++this.n
    const blueprint = this.world.blueprints.get(this.data.blueprint)

    if (!blueprint) {
      console.error(`Blueprint "${this.data.blueprint}" not found`)
      if (this.world.errorMonitor) {
        this.world.errorMonitor.captureError('app.blueprint.missing', [`Blueprint "${this.data.blueprint}" not found`], '')
      }
      crashed = true
    }

    if (blueprint && blueprint.disabled) {
      this.unbuild()
      this.blueprint = blueprint
      this.building = false
      return
    }

    let root
    let script
    if (this.data.uploader && this.data.uploader !== this.world.network.id) {
      root = createNode('mesh')
      root.type = 'box'
      root.width = 1
      root.height = 1
      root.depth = 1
    }
    else {
      try {
        const type = blueprint && blueprint.model && blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
        let glb = blueprint && blueprint.model ? this.world.loader.get(type, blueprint.model) : null
        if (!glb && blueprint && blueprint.model) glb = await this.world.loader.load(type, blueprint.model)
        if (glb) root = glb.toNodes()
      } catch (err) {
        console.error(err)
        if (this.world.errorMonitor) {
          this.world.errorMonitor.captureError('app.model.load', [err.message], err.stack || '')
        }
        crashed = true
      }
      if (blueprint && blueprint.script) {
        try {
          script = this.world.loader.get('script', blueprint.script)
          if (!script) script = await this.world.loader.load('script', blueprint.script)
        } catch (err) {
          console.error(err)
          if (this.world.errorMonitor) {
            this.world.errorMonitor.captureError('app.script.load', [err.message], err.stack || '')
          }
          crashed = true
        }
      }
    }
    if (crashed) {
      let glb = this.world.loader.get('model', 'asset://crash-block.glb')
      if (!glb) glb = await this.world.loader.load('model', 'asset://crash-block.glb')
      root = glb.toNodes()
    }
    if (this.n !== n) return
    this.unbuild()
    this.mode = Modes.ACTIVE
    if (this.data.mover) this.mode = Modes.MOVING
    if (this.data.uploader && this.data.uploader !== this.world.network.id) this.mode = Modes.LOADING
    this.blueprint = blueprint
    this.root = root
    if (this.root && (!blueprint || !blueprint.scene)) {
      this.root.position.fromArray(this.data.position)
      this.root.quaternion.fromArray(this.data.quaternion)
      this.root.scale.fromArray(this.data.scale)
    }
    if (this.root) {
      this.root.activate({ world: this.world, entity: this, moving: !!this.data.mover })
    }
    const runScript =
      (this.mode === Modes.ACTIVE && script && !crashed) || (this.mode === Modes.MOVING && this.keepActive)
    if (runScript) {
      this.abortController = new AbortController()
      this.script = script
      this.keepActive = false // allow script to re-enable
      try {
        this.script.exec(this.getWorldProxy(), this.getAppProxy(), this.fetch, blueprint.props, this.setTimeout)
      } catch (err) {
        console.error('script crashed')
        console.error(err)
        if (this.world.errorMonitor) {
          this.world.errorMonitor.captureError('app.script.execution', [err.message], err.stack || '')
        }
        return this.crash()
      }
    }
    if (this.mode === Modes.MOVING) {
      this.world.setHot(this, true)
      this.snaps = []
      if (this.root) {
        this.root.traverse(node => {
          if (node.name === 'snap') {
            this.snaps.push(node.worldPosition)
          }
        })
      }
    }
    if (root) {
      this.networkPos = new BufferedLerpVector3(root.position, this.world.networkRate)
      this.networkQuat = new BufferedLerpQuaternion(root.quaternion, this.world.networkRate)
      this.networkSca = new BufferedLerpVector3(root.scale, this.world.networkRate)
    }
    while (this.eventQueue.length) {
      const event = this.eventQueue[0]
      if (this.blueprint && event.version > this.blueprint.version) break // ignore future versions
      this.eventQueue.shift()
      this.emit(event.name, event.data, event.networkId)
    }
    this.building = false
  }

  unbuild() {
    this.emit('destroy')
    this.control?.release()
    this.control = null
    this.playerProxies.forEach(player => {
      player.$cleanup()
    })
    this.root?.deactivate()
    for (const node of this.worldNodes) {
      node.deactivate()
    }
    this.worldNodes.clear()
    this.clearEventListeners()
    this.hotEvents = 0
    this.world.setHot(this, false)
    this.abortController?.abort()
    this.abortController = null
    this.deadHook.dead = true
    this.deadHook = { dead: false }
    this.onFields?.([])
  }

  fixedUpdate(delta) {
    if (this.mode === Modes.ACTIVE && this.script) {
      try {
        this.emit('fixedUpdate', delta)
      } catch (err) {
        console.error('script fixedUpdate crashed', this)
        console.error(err)
        if (this.world.errorMonitor) {
          this.world.errorMonitor.captureError('app.script.fixedUpdate', [err.message], err.stack || '')
        }
        this.crash()
        return
      }
    }
  }

  update(delta) {
    if (this.data.mover && this.data.mover !== this.world.network.id) {
      this.networkPos.update(delta)
      this.networkQuat.update(delta)
      this.networkSca.update(delta)
    }
    if (this.mode === Modes.ACTIVE && this.script) {
      try {
        this.emit('update', delta)
      } catch (err) {
        console.error('script update() crashed', this)
        console.error(err)
        if (this.world.errorMonitor) {
          this.world.errorMonitor.captureError('app.script.update', [err.message], err.stack || '')
        }
        this.crash()
        return
      }
    }
  }

  lateUpdate(delta) {
    if (this.mode === Modes.ACTIVE && this.script) {
      try {
        this.emit('lateUpdate', delta)
      } catch (err) {
        console.error('script lateUpdate() crashed', this)
        console.error(err)
        if (this.world.errorMonitor) {
          this.world.errorMonitor.captureError('app.script.lateUpdate', [err.message], err.stack || '')
        }
        this.crash()
        return
      }
    }
  }

  onUploaded() {
    this.data.uploader = null
    this.world.network.send('entityModified', { id: this.data.id, uploader: null })
  }

  modify(data) {
    let rebuild
    if (data.hasOwnProperty('blueprint')) {
      this.data.blueprint = data.blueprint
      rebuild = true
    }
    if (data.hasOwnProperty('uploader')) {
      this.data.uploader = data.uploader
      rebuild = true
    }
    if (data.hasOwnProperty('mover')) {
      this.data.mover = data.mover
      rebuild = true
    }
    if (data.hasOwnProperty('position')) {
      this.data.position = data.position
      if (this.data.mover) {
        this.networkPos.pushArray(data.position)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('quaternion')) {
      this.data.quaternion = data.quaternion
      if (this.data.mover) {
        this.networkQuat.pushArray(data.quaternion)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('scale')) {
      this.data.scale = data.scale
      if (this.data.mover) {
        this.networkSca.pushArray(data.scale)
      } else {
        rebuild = true
      }
    }
    if (data.hasOwnProperty('pinned')) {
      this.data.pinned = data.pinned
    }
    if (data.hasOwnProperty('state')) {
      this.data.state = data.state
      rebuild = true
    }
    if (rebuild) {
      this.build()
    }
  }

  crash() {
    this.build(true)
  }

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true

    this.unbuild()

    this.world.entities.remove(this.data.id)
    if (local) {
      this.world.network.send('entityRemoved', this.data.id)
    }
  }

  on(name, callback) {
    if (!this.listeners[name]) {
      this.listeners[name] = new Set()
    }
    if (this.listeners[name].has(callback)) return
    this.listeners[name].add(callback)
    if (hotEventNames.includes(name)) {
      this.hotEvents++
      this.world.setHot(this, this.hotEvents > 0)
    }
  }

  off(name, callback) {
    if (!this.listeners[name]) return
    if (!this.listeners[name].has(callback)) return
    this.listeners[name].delete(callback)
    if (hotEventNames.includes(name)) {
      this.hotEvents--
      this.world.setHot(this, this.hotEvents > 0)
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
    this.world.events.on(name, callback)
  }

  offWorldEvent(name, callback) {
    this.worldListeners.delete(callback)
    this.world.events.off(name, callback)
  }

  clearEventListeners() {
    this.listeners = {}
    for (const [callback, name] of this.worldListeners) {
      this.world.events.off(name, callback)
    }
    this.worldListeners.clear()
  }

  onEvent(version, name, data, networkId) {
    if (this.building || (this.blueprint && version > this.blueprint.version)) {
      this.eventQueue.push({ version, name, data, networkId })
    } else {
      this.emit(name, data, networkId)
    }
  }

  fetch = async (url, options = {}) => {
    try {
      const resp = await fetch(url, {
        ...options,
        signal: this.abortController.signal,
      })
      const secureResp = {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        json: async () => await resp.json(),
        text: async () => await resp.text(),
        blob: async () => await resp.blob(),
        arrayBuffer: async () => await resp.arrayBuffer(),
      }
      return secureResp
    } catch (err) {
      console.error(err)
    }
  }

  setTimeout = (fn, ms) => {
    const hook = this.getDeadHook()
    const timerId = setTimeout(() => {
      if (hook.dead) return
      fn()
    }, ms)
    return timerId
  }

  getDeadHook = () => {
    return this.deadHook
  }

  getNodes() {
    if (!this.blueprint || !this.blueprint.model) return
    const type = this.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = this.world.loader.get(type, this.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }

  getPlayerProxy(playerId) {
    if (playerId === undefined) playerId = this.world.entities.player?.data.id
    let proxy = this.playerProxies.get(playerId)
    if (!proxy || proxy.destroyed) {
      const player = this.world.entities.getPlayer(playerId)
      if (!player) return null
      proxy = createPlayerProxy(this, player)
      this.playerProxies.set(playerId, proxy)
    }
    return proxy
  }

  getWorldProxy() {
    if (!this.worldProxy) {
      const entity = this
      const getters = this.world.apps.worldGetters
      const setters = this.world.apps.worldSetters
      const methods = this.world.apps.worldMethods
      this.worldProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop in getters) {
              return getters[prop](entity)
            }
            if (prop in methods) {
              const method = methods[prop]
              return (...args) => {
                return method(entity, ...args)
              }
            }
            return undefined
          },
          set: (target, prop, value) => {
            if (prop in setters) {
              setters[prop](entity, value)
              return true
            }
            return true
          },
        }
      )
    }
    return this.worldProxy
  }

  getAppProxy() {
    if (!this.appProxy) {
      const entity = this
      const getters = this.world.apps.appGetters
      const setters = this.world.apps.appSetters
      const methods = this.world.apps.appMethods
      this.appProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop in getters) {
              return getters[prop](entity)
            }
            if (prop in methods) {
              const method = methods[prop]
              return (...args) => {
                return method(entity, ...args)
              }
            }
            return entity.root.getProxy()[prop]
          },
          set: (target, prop, value) => {
            if (prop in setters) {
              setters[prop](entity, value)
              return true
            }
            if (prop in entity.root.getProxy()) {
              entity.root.getProxy()[prop] = value
              return true
            }
            return true
          },
        }
      )
    }
    return this.appProxy
  }
}
