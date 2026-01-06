export function serializeTransform(node) {
  return {
    position: node.position.toArray(),
    quaternion: node.quaternion.toArray(),
    scale: node.scale.toArray(),
  }
}

export function copyTransform(source, target) {
  target.position.copy(source.position)
  target.quaternion.copy(source.quaternion)
  target.scale.copy(source.scale)
}

export function serializeEntityData(entity, blueprintId, networkId) {
  return {
    id: entity.id,
    type: 'app',
    blueprint: blueprintId,
    ...serializeTransform(entity.root),
    mover: networkId,
    uploader: null,
    pinned: false,
    state: {},
  }
}
