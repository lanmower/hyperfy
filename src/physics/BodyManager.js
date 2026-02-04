// Rigidbody manager - minimal body creation interface

export function addBody(world, mesh, config = {}) {
  if (!world.physicsSystem) {
    throw new Error('World not initialized')
  }

  const bodyConfig = {
    dynamic: false,
    mass: 1.0,
    friction: 0.2,
    restitution: 0.0,
    ...config
  }

  const bodyId = world.addBody(mesh, bodyConfig)
  return bodyId
}

export function removeBody(world, bodyId) {
  world.bodies.delete(bodyId)
}

export function setBodyPosition(world, bodyId, position) {
  const body = world.getBody(bodyId)
  if (body) {
    body.position = position
  }
}

export function setBodyRotation(world, bodyId, rotation) {
  const body = world.getBody(bodyId)
  if (body) {
    body.rotation = rotation
  }
}

export function setBodyVelocity(world, bodyId, velocity) {
  const body = world.getBody(bodyId)
  if (body) {
    body.velocity = velocity
  }
}
