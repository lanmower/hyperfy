export class BlueprintLoader {
  constructor(app) {
    this.app = app
    this.blueprint = null
  }

  async load(crashed) {
    const world = this.app.world
    const blueprintId = this.app.data.blueprint

    if (!blueprintId) {
      return null
    }

    const blueprintData = world.blueprints.get(blueprintId)
    if (!blueprintData) {
      console.warn(`[BlueprintLoader] Blueprint not found: ${blueprintId}`)
      return null
    }

    this.app.blueprint = blueprintData

    try {
      let root = null
      let scene = null
      let script = null

      if (blueprintData.model && !crashed) {
        const modelResult = await this.loadModel(blueprintData.model)
        root = modelResult?.nodes
        scene = modelResult?.scene
      }

      if (blueprintData.script && !crashed) {
        script = await this.loadScript(blueprintData.script)
      }

      return {
        root,
        scene,
        script,
        blueprint: blueprintData,
      }
    } catch (err) {
      console.error(`[BlueprintLoader] Failed to load blueprint:`, err)
      return null
    }
  }

  async loadModel(modelUrl) {
    try {
      const world = this.app.world
      if (!world.loader) {
        console.warn(`[BlueprintLoader] Loader not available (server-side model loading not supported)`)
        return null
      }
      const type = modelUrl.endsWith('.vrm') ? 'avatar' : 'model'

      let glb = world.loader.get(type, modelUrl)
      if (!glb) {
        glb = await world.loader.load(type, modelUrl)
      }

      if (!glb) {
        console.warn(`[BlueprintLoader] Failed to load model: ${modelUrl}`)
        return null
      }

      return {
        nodes: glb.toNodes(),
        scene: glb.getScene?.(),
      }
    } catch (err) {
      console.error(`[BlueprintLoader] Error loading model (${modelUrl}):`, err)
      return null
    }
  }

  async loadScript(scriptUrl) {
    try {
      const world = this.app.world

      if (!world.loader) {
        console.warn(`[BlueprintLoader] Loader not available (server-side script loading not supported)`)
        return null
      }

      let scriptCode = world.loader.get('script', scriptUrl)
      if (!scriptCode) {
        scriptCode = await world.loader.load('script', scriptUrl)
      }

      if (!scriptCode) {
        console.warn(`[BlueprintLoader] Failed to load script: ${scriptUrl}`)
        return null
      }

      return scriptCode
    } catch (err) {
      console.error(`[BlueprintLoader] Error loading script (${scriptUrl}):`, err)
      return null
    }
  }
}
