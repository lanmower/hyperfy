import { BlendIcon, BoxIcon, CircleIcon, DumbbellIcon, EyeIcon, FolderIcon, MagnetIcon, PersonStandingIcon } from 'lucide-react'
import { cls } from '../cls.js'

const nodeIcons = {
  default: CircleIcon,
  group: FolderIcon,
  mesh: BoxIcon,
  rigidbody: DumbbellIcon,
  collider: BlendIcon,
  lod: EyeIcon,
  avatar: PersonStandingIcon,
  snap: MagnetIcon,
}

export function renderHierarchy(nodes, depth = 0, selectedNode, setSelectedNode) {
  if (!Array.isArray(nodes)) return null

  return nodes.map(node => {
    if (!node) return null

    const children = node.children || []
    const hasChildren = Array.isArray(children) && children.length > 0
    const isSelected = selectedNode?.id === node.id
    const Icon = nodeIcons[node.name] || nodeIcons.default

    return (
      <div key={node.id}>
        <div
          className={cls('nodehierarchy-item', {
            'nodehierarchy-item-indent': depth > 0,
            selected: isSelected,
          })}
          style={{ marginLeft: depth * 20 }}
          onClick={() => setSelectedNode(node)}
        >
          <Icon size={14} />
          <span>{node.id === '$root' ? 'app' : node.id}</span>
        </div>
        {hasChildren && renderHierarchy(children, depth + 1, selectedNode, setSelectedNode)}
      </div>
    )
  })
}
