import * as THREE from '../extras/three.js'
import { isArray, isFunction, isNumber, isString } from 'lodash-es'
import moment from 'moment'

import { BaseEntity } from './BaseEntity.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { NullSafetyHelper } from '../utils/safety/NullSafetyHelper.js'
import { createNode } from '../extras/createNode.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { getRef } from '../nodes/Node.js'
import { Layers } from '../extras/Layers.js'
import { createPlayerProxy } from '../extras/createPlayerProxy.js'
import { ScriptExecutor } from './app/ScriptExecutor.js'
import { ProxyRegistry } from '../proxy/ProxyRegistry.js'
import { AppNetworkSync } from './app/AppNetworkSync.js'
import { AppPropertyHandlers } from './app/AppPropertyHandlers.js'
import { RigidBody } from '../nodes/RigidBody.js'
import { Collider } from '../nodes/Collider.js'
import { InputSanitizer } from '../security/InputSanitizer.js'

const logger = new ComponentLogger('App')

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
    this.mode = Modes.ACTIVE
    this.n = 0
    this.root = createNode('group')
    this.fields = []
    this.target = null
    this.projectLimit = Infinity
    this.keepActive = false
    this.hitResultsPool = []
    this.hitResults = []
    this.deadHook = { dead: false }
    this.abortController = new AbortController()
    this.scriptExecutor = new ScriptExecutor(this)
    this.eventListeners = {}
    this.worldListeners = new Map()
    this.eventQueue = []
    this.hotEvents = 0
    this.proxyRegistry = new ProxyRegistry()
    this.worldNodes = new Set()
    this.snaps = []
    this.networkSync = new AppNetworkSync(this)
    this.propertyHandlers = new AppPropertyHandlers(this)
    this.build().catch(err => {
      logger.error('Failed to build app', { appId: this.data.id, blueprint: this.data.blueprint, error: err.message })
    })
  }

  createNode(name, data) {
    const node = createNode(name, data)
    return node
  }

  async build(crashed) {
    if (this.building) return
    this.building = true
    const n = ++this.n
    try {
      const blueprint = this.world.blueprints.get(this.data.blueprint)
      if (!blueprint) return

      if (blueprint.disabled) {
        this.unbuild()
        this.blueprint = blueprint
        return
      }

      this.blueprint = blueprint
      this.mode = Modes.ACTIVE
      if (this.data.mover) this.mode = Modes.MOVING
      if (this.data.uploader && this.data.uploader !== this.world.network.id) this.mode = Modes.LOADING

      let root
      let scene
      let script

      if (this.data.uploader && this.data.uploader !== this.world.network.id) {
        root = createNode('mesh')
        root.type = 'box'
        root.width = 1
        root.height = 1
        root.depth = 1
      } else {
        const result = await this.world.blueprints.loadBlueprint(this, crashed)
        if (result) {
          root = result.root
          scene = result.scene
          script = result.script
        } else {
          crashed = true
        }
      }

      if (!root || crashed) {
        crashed = true
        const glb = await this.world.loader.load('model', 'asset://crash-block.glb')
        if (glb) root = glb.toNodes()
      }

      if (!root) return

      if (this.n !== n) return
      this.unbuild()

      this.root = root
      if (!blueprint.scene) {
        this.root.position.fromArray(this.data.position || [0, 0, 0])
        this.root.quaternion.fromArray(this.data.quaternion || [0, 0, 0, 1])
        this.root.scale.fromArray(this.data.scale || [1, 1, 1])
      }
      this.root.activate?.({ world: this.world, entity: this, moving: !!this.data.mover })
      if (scene && this.world.stage) {
        this.threeScene = scene
        if (blueprint.scene) {
          scene.position.set(0, 0, 0)
          scene.quaternion.set(0, 0, 0, 1)
          scene.scale.set(1, 1, 1)
        } else {
          scene.position.fromArray(this.data.position || [0, 0, 0])
          scene.quaternion.fromArray(this.data.quaternion || [0, 0, 0, 1])
          scene.scale.fromArray(this.data.scale || [1, 1, 1])
        }
        this.world.stage.scene.add(scene)
      }
      this.createFloorColliderIfNeeded(this.root)
      const runScript =
        (this.mode === Modes.ACTIVE && script && !crashed) || (this.mode === Modes.MOVING && this.keepActive)
      if (runScript) {
        const blueprintProps = NullSafetyHelper.getBlueprintProps(this)
        const success = this.scriptExecutor.executeScript(script, blueprint, blueprintProps, this.setTimeout, this.getWorldProxy.bind(this), this.getAppProxy.bind(this), this.fetch)
        if (!success) return this.crash()
      }
      if (this.mode === Modes.MOVING) {
        this.world.setHot(this, true)
        this.collectSnapPoints()
      }
      this.networkSync.initialize(this.root, this.world.networkRate)
      this.flushEventQueue()
    } finally {
      this.building = false
    }
  }

  createFloorColliderIfNeeded(root) {
    if (!root || !this.world.physics || this.floorCreated) return
    this.floorCreated = true
    try {
      window.__DEBUG__ = window.__DEBUG__ || {}
      window.__DEBUG__.floorDebug = { step: 'starting' }
      const rigidbody = new RigidBody({ type: 'static', position: [0, -5, 0] })
      window.__DEBUG__.floorDebug.rigidbodyCreated = true
      const collider = new Collider({
        type: 'box',
        width: 1000,
        height: 10,
        depth: 1000,
        layer: 'environment',
      })
      window.__DEBUG__.floorDebug.colliderCreated = true
      rigidbody.add(collider)
      window.__DEBUG__.floorDebug.colliderAdded = true
      this.root.add(rigidbody)
      window.__DEBUG__.floorDebug.addedToRoot = true
      rigidbody.activate?.({ world: this.world, entity: this })
      window.__DEBUG__.floorDebug.rigidBodyActivated = true
      collider.activate?.({ world: this.world, entity: this })
      window.__DEBUG__.floorDebug.colliderActivated = true
      rigidbody.mount?.()
      window.__DEBUG__.floorDebug.rigidbodyMounted = true
      collider.mount?.()
      window.__DEBUG__.floorDebug.colliderMounted = true
      window.__DEBUG__.floorDebug.step = 'complete'
    } catch (err) {
      window.__DEBUG__ = window.__DEBUG__ || {}
      window.__DEBUG__.floorDebug = { error: err.message, stack: err.stack }
    }
  }

  collectSnapPoints() {
    this.snaps = []
    if (this.root) {
      this.root.traverse(node => {
        if (node.name === 'snap') {
          this.snaps.push(node.worldPosition)
        }
      })
    }
  }

  deactivateAllNodes() {
    this.root?.deactivate()
    for (const node of this.worldNodes) {
      node.deactivate()
    }
    this.worldNodes.clear()
  }

  unbuild() {
    this.emit('destroy')
    this.control?.release()
    this.control = null
    this.deactivateAllNodes()
    if (this.threeScene && this.world.stage) {
      this.world.stage.scene.remove(this.threeScene)
    }
    this.threeScene = null
    this.clearEventListeners()
    this.world.setHot(this, false)
    this.scriptExecutor.cleanup()
    this.proxyRegistry.clear()
    this.abortController.abort()
    this.networkSync.networkPos = null
    this.networkSync.networkQuat = null
    this.networkSync.networkSca = null
    this.deadHook.dead = true
    this.deadHook = { dead: false }
    this.onFields?.([])
  }

  fixedUpdate(delta) {
    return this.scriptExecutor.fixedUpdate(delta)
  }

  update(delta) {
    this.networkSync.update(delta, this.data.mover, this.world.network.id)
    return this.scriptExecutor.update(delta)
  }

  lateUpdate(delta) {
    return this.scriptExecutor.lateUpdate(delta)
  }

  onUploaded() {
    this.data.uploader = null
    this.world.network.send('entityModified', { id: this.data.id, uploader: null })
  }

  modify(data) {
    this.propertyHandlers.modify(data, this.networkSync)
  }

  crash() {
    this.build(true)
  }

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true

    this.unbuild()

    this.blueprintLoader = null
    this.scriptExecutor = null
    this.proxyRegistry = null
    this.networkSync = null
    this.propertyHandlers = null
    this.world.entities.remove(this.data.id)
    if (local) {
      this.world.network.send('entityRemoved', this.data.id)
    }
  }

  on(name, callback) {
    if (!this.eventListeners[name]) this.eventListeners[name] = new Set()
    if (this.eventListeners[name].has(callback)) return
    this.eventListeners[name].add(callback)
    const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']
    if (hotEventNames.includes(name)) {
      this.hotEvents++
      this.world.setHot(this, this.hotEvents > 0)
    }
  }

  off(name, callback) {
    if (!this.eventListeners[name]) return
    if (!this.eventListeners[name].has(callback)) return
    this.eventListeners[name].delete(callback)
    const hotEventNames = ['fixedUpdate', 'update', 'lateUpdate']
    if (hotEventNames.includes(name)) {
      this.hotEvents--
      this.world.setHot(this, this.hotEvents > 0)
    }
  }

  emit(name, a1, a2) {
    if (!this.eventListeners[name]) return
    for (const callback of this.eventListeners[name]) {
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

  onEvent(version, name, data, networkId) {
    this.eventQueue.push({ version, name, data, networkId })
    this.emit(name, data)
  }

  flushEventQueue() {
    this.eventQueue = []
  }

  clearEventListeners() {
    this.eventListeners = {}
    this.worldListeners.forEach((eventName, callback) => {
      this.world.events.off(eventName, callback)
    })
    this.worldListeners.clear()
    this.hotEvents = 0
  }

  fetch = async (url, options = {}) => {
    try {
      const validation = InputSanitizer.validateURL(url)
      if (!validation.valid) {
        logger.error('Fetch URL validation failed', {
          url,
          appId: this.data.id,
          blueprintId: this.blueprint?.id,
          violations: validation.violations,
        })
        throw new Error(`URL validation failed: ${validation.violations.map(v => v.message).join(', ')}`)
      }

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
      logger.error('Fetch failed', { url, error: err.message })
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
    const cached = this.proxyRegistry.getProxy(playerId)
    if (cached) return cached
    const player = this.world.entities.get(playerId)
    if (!player) return null
    const proxy = createPlayerProxy(this, player)
    this.proxyRegistry.cache.set(playerId, proxy)
    return proxy
  }

  getWorldProxy() {
    const cached = this.proxyRegistry.getProxy('world')
    if (cached) return cached
    const apps = this.world.apps
    const proxy = {}
    if (!apps) return proxy
    const allKeys = new Set([...Object.keys(apps.worldGetters || {}), ...Object.keys(apps.worldSetters || {})])
    for (const key of allKeys) {
      try {
        const descriptor = { enumerable: true, configurable: true }
        if (apps.worldGetters?.[key]) descriptor.get = () => apps.worldGetters[key](apps, this)
        if (apps.worldSetters?.[key]) descriptor.set = (value) => apps.worldSetters[key](apps, this, value)
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        logger.warn('Failed to define property', { property: key, error: err.message })
      }
    }
    for (const key in apps.worldMethods) {
      proxy[key] = (...args) => apps.worldMethods[key](apps, this, ...args)
    }
    this.proxyRegistry.cache.set('world', proxy)
    return proxy
  }

  getAppProxy() {
    const cached = this.proxyRegistry.getProxy('app')
    if (cached) return cached
    const apps = this.world.apps
    const proxy = {}
    if (!apps) return proxy
    const allKeys = new Set([...Object.keys(apps.appGetters || {}), ...Object.keys(apps.appSetters || {})])
    for (const key of allKeys) {
      try {
        const descriptor = { enumerable: true, configurable: true }
        if (apps.appGetters?.[key]) descriptor.get = () => apps.appGetters[key](apps, this)
        if (apps.appSetters?.[key]) descriptor.set = (value) => apps.appSetters[key](apps, this, value)
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        logger.warn('Failed to define property', { property: key, error: err.message })
      }
    }
    for (const key in apps.appMethods) {
      proxy[key] = (...args) => apps.appMethods[key](apps, this, ...args)
    }
    this.proxyRegistry.cache.set('app', proxy)
    return proxy
  }
}
