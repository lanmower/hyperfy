export class AppNodeManager {
  constructor(parent) {
    this.parent = parent
    this.worldNodes = new Set()
    this.snaps = []
  }

  collectSnapPoints() {
    this.snaps = []
    if (this.parent.root) {
      this.parent.root.traverse(node => {
        if (node.name === 'snap') {
          this.snaps.push(node.worldPosition)
        }
      })
    }
  }

  deactivateAllNodes() {
    this.parent.root?.deactivate()
    for (const node of this.worldNodes) {
      node.deactivate()
    }
    this.worldNodes.clear()
  }

  getNodes() {
    const p = this.parent
    if (!p.blueprint || !p.blueprint.model) return
    const type = p.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = p.world.loader.get(type, p.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }
}
