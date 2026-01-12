import { createNode } from '../../extras/createNode.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { NullSafetyHelper } from '../../utils/safety/NullSafetyHelper.js'

const logger = new StructuredLogger('AppBuilder')

const Modes = {
  ACTIVE: 'active',
  MOVING: 'moving',
  LOADING: 'loading',
  CRASHED: 'crashed',
}

export class AppBuilder {
  constructor(app) {
    this.app = app
  }

  async build(crashed) {
    if (this.app.building) return
    this.app.building = true
    const n = ++this.app.n
    try {
      const blueprint = this.app.world.blueprints.get(this.app.data.blueprint)
      if (!blueprint) return

      if (blueprint.disabled) {
        this.unbuild()
        this.app.blueprint = blueprint
        return
      }

      this.app.blueprint = blueprint
      this.app.mode = Modes.ACTIVE
      if (this.app.data.mover) this.app.mode = Modes.MOVING
      if (this.app.data.uploader && this.app.data.uploader !== this.app.world.network.id) this.app.mode = Modes.LOADING

      let root
      let scene
      let script

      if (this.app.data.uploader && this.app.data.uploader !== this.app.world.network.id) {
        root = createNode('mesh')
        root.type = 'box'
        root.width = 1
        root.height = 1
        root.depth = 1
      } else {
        const result = await this.app.world.blueprints.loadBlueprint(this.app, crashed)
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
        const glb = await this.app.world.loader.load('model', 'asset://crash-block.glb')
        if (glb) root = glb.toNodes()
      }

      if (!root) return

      if (this.app.n !== n) return
      this.unbuild()

      this.app.root = root
      if (!blueprint.scene) {
        this.app.root.position.fromArray(this.app.data.position || [0, 0, 0])
        this.app.root.quaternion.fromArray(this.app.data.quaternion || [0, 0, 0, 1])
        this.app.root.scale.fromArray(this.app.data.scale || [1, 1, 1])
      }
      this.app.root.activate?.({ world: this.app.world, entity: this.app, moving: !!this.app.data.mover })
      this.app.floorCollider.createFloorColliderIfNeeded(this.app.root)
      if (!blueprint.scene) {
        const runScript = (this.app.mode === Modes.ACTIVE && script && !crashed) || (this.app.mode === Modes.MOVING && this.app.keepActive)
        if (runScript) {
          const blueprintProps = NullSafetyHelper.getBlueprintProps(this.app)
          const success = this.app.scriptExecutor.executeScript(
            script,
            blueprint,
            blueprintProps,
            this.app.utilities.setTimeout,
            this.app.proxyManager.getWorldProxy.bind(this.app.proxyManager),
            this.app.proxyManager.getAppProxy.bind(this.app.proxyManager),
            this.app.utilities.fetch
          )
          if (!success) return this.app.crash()
        }
      }
      if (this.app.mode === Modes.MOVING) {
        this.app.world.setHot(this.app, true)
        this.collectSnapPoints()
      }
      this.app.networkSync.initialize(this.app.root, this.app.world.networkRate)
      this.app.eventManager.flushEventQueue()
    } finally {
      this.app.building = false
    }
  }

  collectSnapPoints() {
    this.app.snaps = []
    if (this.app.root) {
      this.app.root.traverse(node => {
        if (node.name === 'snap') {
          this.app.snaps.push(node.worldPosition)
        }
      })
    }
  }

  deactivateAllNodes() {
    this.app.root?.deactivate()
    for (const node of this.app.worldNodes) {
      node.deactivate()
    }
    this.app.worldNodes.clear()
  }

  unbuild() {
    this.app.eventManager.emit('destroy')
    this.app.control?.release()
    this.app.control = null
    this.deactivateAllNodes()
    this.app.eventManager.clearEventListeners()
    this.app.world.setHot(this.app, false)
    this.app.scriptExecutor.cleanup()
    this.app.proxyManager.cleanup()
    this.app.abortController.abort()
    this.app.networkSync.networkPos = null
    this.app.networkSync.networkQuat = null
    this.app.networkSync.networkSca = null
    this.app.deadHook.dead = true
    this.app.deadHook = { dead: false }
    this.app.onFields?.([])
  }
}
