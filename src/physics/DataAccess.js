// Physics data access - get state from bodies

export function getBodyData(world, bodyId) {
  const body = world.getBody(bodyId)

  if (!body) {
    return null
  }

  return {
    id: bodyId,
    position: body.position || [0, 0, 0],
    rotation: body.rotation || [0, 0, 0, 1],
    velocity: body.velocity || [0, 0, 0],
    angularVelocity: body.angularVelocity || [0, 0, 0],
    config: body.config
  }
}

export function getEntityData(world, bodyId) {
  // Alias for getBodyData for consistency with SDK naming
  return getBodyData(world, bodyId)
}

export function getAllBodies(world) {
  const result = []

  for (const [id, body] of world.bodies) {
    result.push({
      id,
      ...getBodyData(world, id)
    })
  }

  return result
}

export function getBodyState(world, bodyId) {
  return getBodyData(world, bodyId)
}
