import * as Nodes from '../nodes/index.js'

export function createNode(name, data) {
  const Node = Nodes[name]
  if (!Node) console.error('unknown node:', name)
  const node = new Node(data)
  return node
}
