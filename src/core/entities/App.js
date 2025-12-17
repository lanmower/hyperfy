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
import { BlueprintLoader } from './app/BlueprintLoader.js'
import { ScriptExecutor } from './app/ScriptExecutor.js'
import { EventManager } from './app/EventManager.js'
import { ProxyFactory } from './app/ProxyFactory.js'

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
    this.blueprintLoader = new BlueprintLoader(this)
    this.scriptExecutor = new ScriptExecutor(this)
    this.eventManager = new EventManager(this)
    this.proxyFactory = new ProxyFactory(this)
    this.build()
  }

  createNode(name, data) {
    const node = createNode(name, data)
    return node
  }

  async build(crashed) {
    const result = await this.blueprintLoader.load(crashed)
    if (!result) return
    const { root, script, blueprint } = result
    const runScript =
      (this.mode === Modes.ACTIVE && script && !crashed) || (this.mode === Modes.MOVING && this.keepActive)
    if (runScript) {
      const success = this.scriptExecutor.executeScript(script, blueprint, blueprint.props, this.setTimeout, this.getWorldProxy.bind(this), this.getAppProxy.bind(this), this.fetch)
      if (!success) return this.crash()
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
    this.eventManager.flushEventQueue()
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
    this.eventManager.clearEventListeners()
    this.hotEvents = 0
    this.world.setHot(this, false)
    this.scriptExecutor.cleanup()
    this.deadHook.dead = true
    this.deadHook = { dead: false }
    this.onFields?.([])
  }

  fixedUpdate(delta) {
    return this.scriptExecutor.fixedUpdate(delta)
  }

  update(delta) {
    if (this.data.mover && this.data.mover !== this.world.network.id) {
      this.networkPos.update(delta)
      this.networkQuat.update(delta)
      this.networkSca.update(delta)
    }
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
    if (!this.blueprint || !this.blueprint.model) return
    const type = this.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = this.world.loader.get(type, this.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }

  getPlayerProxy(playerId) {
    return this.proxyFactory.getPlayerProxy(playerId)
  }

  getWorldProxy() {
    return this.proxyFactory.getWorldProxy()
  }

  getAppProxy() {
    return this.proxyFactory.getAppProxy()
  }
}
