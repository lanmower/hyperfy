import * as THREE from '../extras/three.js'
import { isArray, isFunction, isNumber, isString } from 'lodash-es'
import moment from 'moment'

import { BaseEntity } from './BaseEntity.js'
import { createNode } from '../extras/createNode.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { getRef } from '../nodes/Node.js'
import { Layers } from '../extras/Layers.js'
import { createPlayerProxy } from '../extras/createPlayerProxy.js'
import { BlueprintLoader } from './app/BlueprintLoader.js'
import { ScriptExecutor } from './app/ScriptExecutor.js'
import { EventManager } from './app/EventManager.js'
import { ProxyFactory } from './app/ProxyFactory.js'
import { AppNodeManager } from './app/AppNodeManager.js'
import { AppNetworkSync } from './app/AppNetworkSync.js'
import { AppPropertyHandlers } from './app/AppPropertyHandlers.js'
import { RigidBody } from '../nodes/RigidBody.js'
import { Collider } from '../nodes/Collider.js'

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
    this.blueprintLoader = new BlueprintLoader(this)
    this.scriptExecutor = new ScriptExecutor(this)
    this.eventManager = new EventManager(this)
    this.proxyFactory = new ProxyFactory(this)
    this.nodeManager = new AppNodeManager(this)
    this.networkSync = new AppNetworkSync(this)
    this.propertyHandlers = new AppPropertyHandlers(this)
    this.worldNodes = this.nodeManager.worldNodes
    this.snaps = this.nodeManager.snaps
    this.build().catch(err => {
      console.error('App.build() failed:', err.message)
    })
  }

  createNode(name, data) {
    const node = createNode(name, data)
    return node
  }

  async build(crashed) {
    const result = await this.blueprintLoader.load(crashed)
    if (!result) return
    const { root, script, blueprint } = result
    if (root) {
      this.root = root
      root.activate?.({ world: this.world, entity: this })
      root.position.x = this.data.position?.[0] ?? 0
      root.position.y = this.data.position?.[1] ?? 0
      root.position.z = this.data.position?.[2] ?? 0
      root.quaternion.x = this.data.quaternion?.[0] ?? 0
      root.quaternion.y = this.data.quaternion?.[1] ?? 0
      root.quaternion.z = this.data.quaternion?.[2] ?? 0
      root.quaternion.w = this.data.quaternion?.[3] ?? 1
      root.scale.x = this.data.scale?.[0] ?? 1
      root.scale.y = this.data.scale?.[1] ?? 1
      root.scale.z = this.data.scale?.[2] ?? 1
      this.createFloorColliderIfNeeded(root)
    }
    const runScript =
      (this.mode === Modes.ACTIVE && script && !crashed) || (this.mode === Modes.MOVING && this.keepActive)
    if (runScript) {
      const success = this.scriptExecutor.executeScript(script, blueprint, blueprint.props, this.setTimeout, this.getWorldProxy.bind(this), this.getAppProxy.bind(this), this.fetch)
      if (!success) return this.crash()
    }
    if (this.mode === Modes.MOVING) {
      this.world.setHot(this, true)
      this.nodeManager.collectSnapPoints()
    }
    this.networkSync.initialize(root || this.root, this.world.networkRate)
    this.eventManager.flushEventQueue()
    this.building = false
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

  unbuild() {
    this.emit('destroy')
    this.control?.release()
    this.control = null
    this.nodeManager.deactivateAllNodes()
    this.eventManager.clearEventListeners()
    this.world.setHot(this, false)
    this.scriptExecutor.cleanup()
    this.proxyFactory.clear()
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

    this.world.entities.remove(this.data.id)
    if (local) {
      this.world.network.send('entityRemoved', this.data.id)
    }
  }

  on(name, callback) {
    return this.eventManager.on(name, callback)
  }

  off(name, callback) {
    return this.eventManager.off(name, callback)
  }

  emit(name, a1, a2) {
    return this.eventManager.emit(name, a1, a2)
  }

  onWorldEvent(name, callback) {
    return this.eventManager.onWorldEvent(name, callback)
  }

  offWorldEvent(name, callback) {
    return this.eventManager.offWorldEvent(name, callback)
  }

  onEvent(version, name, data, networkId) {
    return this.eventManager.onEvent(version, name, data, networkId)
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
    return this.nodeManager.getNodes()
  }

  getPlayerProxy(playerId) {
    if (!this.playerProxies) this.playerProxies = new Map()
    if (!this.playerProxies.has(playerId)) {
      const proxy = this.proxyFactory.getPlayerProxy(playerId)
      if (proxy) this.playerProxies.set(playerId, proxy)
    }
    return this.playerProxies.get(playerId)
  }

  getWorldProxy() {
    return this.proxyFactory.getWorldProxy()
  }

  getAppProxy() {
    return this.proxyFactory.getAppProxy()
  }
}
