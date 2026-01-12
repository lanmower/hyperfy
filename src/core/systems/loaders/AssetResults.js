import { createNode } from '../../extras/createNode.js'

export class AssetResults {
  static createModel(node, file, glbScene = null) {
    return {
      toNodes() { return node.clone(true) },
      getScene() { return glbScene?.clone() },
      getStats() {
        const stats = node.getStats(true)
        stats.fileBytes = file.size
        return stats
      },
    }
  }

  static createAvatar(factory, file, vrmHooks = null) {
    const node = createNode('group', { id: '$root' })
    node.add(createNode('avatar', { id: 'avatar', factory, hooks: vrmHooks }))
    return {
      factory,
      hooks: vrmHooks,
      toNodes(customHooks) {
        const clone = node.clone(true)
        if (customHooks) clone.get('avatar').hooks = customHooks
        return clone
      },
      getStats() {
        const stats = node.getStats(true)
        stats.fileBytes = file.size
        return stats
      },
    }
  }
}
