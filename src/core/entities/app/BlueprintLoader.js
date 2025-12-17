const Modes = {
  ACTIVE: 'active',
  MOVING: 'moving',
  LOADING: 'loading',
  CRASHED: 'crashed',
}

export class BlueprintLoader {
  constructor(app) {
    this.app = app
  }

  async load(crashed) {
    const app = this.app
    app.building = true
    const n = ++app.n
    const blueprint = app.world.blueprints.get(app.data.blueprint)

    if (!blueprint) {
      console.error(`Blueprint "${app.data.blueprint}" not found`)
      if (app.world.errorMonitor) {
        app.world.errorMonitor.captureError('app.blueprint.missing', [`Blueprint "${app.data.blueprint}" not found`], '')
      }
      crashed = true
    }

    if (blueprint && blueprint.disabled) {
      app.unbuild()
      app.blueprint = blueprint
      app.building = false
      return
    }

    let root
    let script
    if (app.data.uploader && app.data.uploader !== app.world.network.id) {
      const { createNode } = await import('../../extras/createNode.js')
      root = createNode('mesh')
      root.type = 'box'
      root.width = 1
      root.height = 1
      root.depth = 1
    } else {
      try {
        const type = blueprint && blueprint.model && blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
        let glb = blueprint && blueprint.model ? app.world.loader.get(type, blueprint.model) : null
        if (!glb && blueprint && blueprint.model) glb = await app.world.loader.load(type, blueprint.model)
        if (glb) root = glb.toNodes()
      } catch (err) {
        console.error(err)
        if (app.world.errorMonitor) {
          app.world.errorMonitor.captureError('app.model.load', [err.message], err.stack || '')
        }
        crashed = true
      }
      if (blueprint && blueprint.script) {
        try {
          script = app.world.loader.get('script', blueprint.script)
          if (!script) script = await app.world.loader.load('script', blueprint.script)
        } catch (err) {
          console.error(err)
          if (app.world.errorMonitor) {
            app.world.errorMonitor.captureError('app.script.load', [err.message], err.stack || '')
          }
          crashed = true
        }
      }
    }
    if (crashed) {
      let glb = app.world.loader.get('model', 'asset://crash-block.glb')
      if (!glb) glb = await app.world.loader.load('model', 'asset://crash-block.glb')
      root = glb.toNodes()
    }
    if (app.n !== n) return

    app.unbuild()
    app.mode = Modes.ACTIVE
    if (app.data.mover) app.mode = Modes.MOVING
    if (app.data.uploader && app.data.uploader !== app.world.network.id) app.mode = Modes.LOADING
    app.blueprint = blueprint
    app.root = root
    if (app.root && (!blueprint || !blueprint.scene)) {
      app.root.position.fromArray(app.data.position)
      app.root.quaternion.fromArray(app.data.quaternion)
      app.root.scale.fromArray(app.data.scale)
    }
    if (app.root) {
      app.root.activate({ world: app.world, entity: app, moving: !!app.data.mover })
    }

    return { root, script, crashed, blueprint }
  }
}
