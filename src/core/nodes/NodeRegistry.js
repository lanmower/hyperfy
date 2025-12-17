export class NodeRegistry {
  static registry = new Map()
  static initialized = false

  static register(name, nodeClass) {
    if (this.registry.has(name)) {
      console.warn(`[NodeRegistry] Overwriting registered node type: ${name}`)
    }
    this.registry.set(name, nodeClass)
    return nodeClass
  }

  static get(name) {
    return this.registry.get(name)
  }

  static has(name) {
    return this.registry.has(name)
  }

  static getAll() {
    return new Map(this.registry)
  }

  static unregister(name) {
    return this.registry.delete(name)
  }

  static clear() {
    this.registry.clear()
  }

  static getNames() {
    return Array.from(this.registry.keys())
  }

  static async registerAsync(name, importFn) {
    try {
      const nodeClass = await importFn()
      this.register(name, nodeClass)
      return nodeClass
    } catch (err) {
      console.error(`[NodeRegistry] Failed to load node type ${name}:`, err)
      throw err
    }
  }

  static async loadAll(nodeModules) {
    const promises = Object.entries(nodeModules).map(([name, importFn]) =>
      this.registerAsync(name, importFn).catch(err => {
        console.error(`[NodeRegistry] Failed to load ${name}`, err)
      })
    )
    await Promise.all(promises)
    this.initialized = true
  }

  static createNode(typeName, data = {}) {
    const nodeClass = this.get(typeName)
    if (!nodeClass) {
      throw new Error(`[NodeRegistry] Unknown node type: ${typeName}`)
    }
    return new nodeClass(data)
  }
}

export async function initializeNodeRegistry() {
  const nodeModules = {
    group: () => import('./Group.js').then(m => m.Group),
    mesh: () => import('./Mesh.js').then(m => m.Mesh),
    skinnedmesh: () => import('./SkinnedMesh.js').then(m => m.SkinnedMesh),
    lod: () => import('./LOD.js').then(m => m.LOD),
    audio: () => import('./Audio.js').then(m => m.Audio),
    video: () => import('./Video.js').then(m => m.Video),
    image: () => import('./Image.js').then(m => m.Image),
    snap: () => import('./Snap.js').then(m => m.Snap),
    avatar: () => import('./Avatar.js').then(m => m.Avatar),
    action: () => import('./Action.js').then(m => m.Action),
    anchor: () => import('./Anchor.js').then(m => m.Anchor),
    nametag: () => import('./Nametag.js').then(m => m.Nametag),
    particles: () => import('./Particles.js').then(m => m.Particles),
    sky: () => import('./Sky.js').then(m => m.Sky),
    ui: () => import('./UI.js').then(m => m.UI),
    uiview: () => import('./UIView.js').then(m => m.UIView),
    uitext: () => import('./UIText.js').then(m => m.UIText),
    uiimage: () => import('./UIImage.js').then(m => m.UIImage),
    controller: () => import('./Controller.js').then(m => m.Controller),
    rigidbody: () => import('./RigidBody.js').then(m => m.RigidBody),
    collider: () => import('./Collider.js').then(m => m.Collider),
    joint: () => import('./Joint.js').then(m => m.Joint),
  }

  await NodeRegistry.loadAll(nodeModules)
}

export function registerNodeTypes(nodes) {
  Object.entries(nodes).forEach(([name, nodeClass]) => {
    NodeRegistry.register(name, nodeClass)
  })
}
