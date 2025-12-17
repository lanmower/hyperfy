import { cls } from '../cls.js'

export function HierarchyDetail({ label, value, copy }) {
  let handleCopy = copy ? () => navigator.clipboard.writeText(value) : null
  return (
    <div className='nodehierarchy-detail'>
      <div className='nodehierarchy-detail-label'>{label}</div>
      <div className={cls('nodehierarchy-detail-value', { copy })} onClick={handleCopy}>
        {value}
      </div>
    </div>
  )
}

export function DetailsPanel({ selectedNode, getVectorString, hasProperty }) {
  if (!selectedNode) return null

  return (
    <div className='nodehierarchy-details'>
      <HierarchyDetail label='ID' value={selectedNode.id} copy />
      <HierarchyDetail label='Name' value={selectedNode.name} />

      {/* Position */}
      {hasProperty(selectedNode, 'position') && getVectorString(selectedNode.position) && (
        <HierarchyDetail label='Position' value={getVectorString(selectedNode.position)} />
      )}

      {/* Rotation */}
      {hasProperty(selectedNode, 'rotation') && getVectorString(selectedNode.rotation) && (
        <HierarchyDetail label='Rotation' value={getVectorString(selectedNode.rotation)} />
      )}

      {/* Scale */}
      {hasProperty(selectedNode, 'scale') && getVectorString(selectedNode.scale) && (
        <HierarchyDetail label='Scale' value={getVectorString(selectedNode.scale)} />
      )}

      {/* Material */}
      {hasProperty(selectedNode, 'material') && selectedNode.material && (
        <>
          <HierarchyDetail label='Material' value={selectedNode.material.type || 'Standard'} />
          {hasProperty(selectedNode.material, 'color') && selectedNode.material.color && (
            <HierarchyDetail
              label='Color'
              value={
                selectedNode.material.color.getHexString
                  ? `#${selectedNode.material.color.getHexString()}`
                  : 'Unknown'
              }
            />
          )}
        </>
      )}

      {/* Geometry */}
      {hasProperty(selectedNode, 'geometry') && selectedNode.geometry && (
        <HierarchyDetail label='Geometry' value={selectedNode.geometry.type || 'Custom'} />
      )}
    </div>
  )
}
