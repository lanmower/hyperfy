import * as THREE from '../extras/three.js'
import { isArray, isFunction, isNumber, isString } from 'lodash-es'
import moment from 'moment'

import { BaseEntity } from './BaseEntity.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { NullSafetyHelper } from '../utils/safety/NullSafetyHelper.js'
import { createNode } from '../extras/createNode.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { getRef } from '../nodes/Node.js'
import { Layers } from '../extras/Layers.js'
import { ScriptExecutor } from './app/ScriptExecutor.js'
import { AppNetworkSync } from './app/AppNetworkSync.js'
import { AppPropertyHandlers } from './app/AppPropertyHandlers.js'
import { EventManager } from './app/EventManager.js'
import { AppProxyManager } from './app/AppProxyManager.js'
import { AppUtilities } from './app/AppUtilities.js'
import { RigidBody } from '../nodes/RigidBody.js'
import { Collider } from '../nodes/Collider.js'

const logger = new StructuredLogger('App')

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
    this.worldNodes = new Set()
    this.snaps = []
    this.networkSync = new AppNetworkSync(this)
    this.propertyHandlers = new AppPropertyHandlers(this)
    this.eventManager = new EventManager(this)
    this.proxyManager = new AppProxyManager(this)
    this.utilities = new AppUtilities(this)
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
        const success = this.scriptExecutor.executeScript(
          script,
          blueprint,
          blueprintProps,
          this.utilities.setTimeout,
          this.proxyManager.getWorldProxy.bind(this.proxyManager),
          this.proxyManager.getAppProxy.bind(this.proxyManager),
          this.utilities.fetch
        )
        if (!success) return this.crash()
      }
      if (this.mode === Modes.MOVING) {
        this.world.setHot(this, true)
        this.collectSnapPoints()
      }
      this.networkSync.initialize(this.root, this.world.networkRate)
      this.eventManager.flushEventQueue()
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
    this.eventManager.emit('destroy')
    this.control?.release()
    this.control = null
    this.deactivateAllNodes()
    if (this.threeScene && this.world.stage) {
      this.world.stage.scene.remove(this.threeScene)
    }
    this.threeScene = null
    this.eventManager.clearEventListeners()
    this.world.setHot(this, false)
    this.scriptExecutor.cleanup()
    this.proxyManager.cleanup()
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
    this.eventManager = null
    this.proxyManager = null
    this.networkSync = null
    this.propertyHandlers = null
    this.utilities = null
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
