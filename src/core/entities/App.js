import { createNode } from '../extras/createNode.js'
import { StructuredLogger } from '../utils/logging/index.js'

import { BaseEntity } from './BaseEntity.js'
import { ScriptExecutor } from './app/ScriptExecutor.js'
import { AppNetworkSync } from './app/AppNetworkSync.js'
import { AppPropertyHandlers } from './app/AppPropertyHandlers.js'
import { EventManager } from './app/EventManager.js'
import { AppProxyManager } from './app/AppProxyManager.js'
import { AppUtilities } from './app/AppUtilities.js'
import { AppBuilder } from './app/AppBuilder.js'
import { AppFloorCollider } from './app/AppFloorCollider.js'

const logger = new StructuredLogger('App')

export class App extends BaseEntity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isApp = true
    this.mode = 'active'
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
    this.worldNodes = new Set()
    this.snaps = []
    this.networkSync = new AppNetworkSync(this)
    this.propertyHandlers = new AppPropertyHandlers(this)
    this.eventManager = new EventManager(this)
    this.proxyManager = new AppProxyManager(this)
    this.utilities = new AppUtilities(this)
    this.builder = new AppBuilder(this)
    this.floorCollider = new AppFloorCollider(this)
    this.builder.build().catch(err => {
      logger.error('Failed to build app', { appId: this.data.id, blueprint: this.data.blueprint, error: err.message })
    })
  }

  createNode(name, data) {
    return createNode(name, data)
  }

  build(crashed) {
    return this.builder.build(crashed)
  }

  crash() {
    return this.builder.build(true)
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

  destroy(local) {
    if (this.destroyed) return
    this.destroyed = true
    this.builder.unbuild()
    this.utilities?.clearTimeouts()
    this.blueprintLoader = null
    this.scriptExecutor = null
    this.eventManager = null
    this.proxyManager = null
    this.networkSync = null
    this.propertyHandlers = null
    this.utilities = null
    this.builder = null
    this.floorCollider = null
    this.world.entities.remove(this.data.id)
    if (local) {
      this.world.network.send('entityRemoved', { id: this.data.id })
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

  flushEventQueue() {
    return this.eventManager.flushEventQueue()
  }

  getPlayerProxy(playerId) {
    return this.proxyManager.getPlayerProxy(playerId)
  }

  getWorldProxy() {
    return this.proxyManager.getWorldProxy()
  }

  getAppProxy() {
    return this.proxyManager.getAppProxy()
  }

  fetch(...args) {
    return this.utilities.fetch(...args)
  }

  setTimeout(...args) {
    return this.utilities.setTimeout(...args)
  }

  getDeadHook() {
    return this.utilities.getDeadHook()
  }

  getNodes() {
    return this.utilities.getNodes()
  }
}
