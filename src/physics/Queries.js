// Physics queries - raycast, shape tests, etc.

export function raycast(world, origin, direction, distance, config = {}) {
  if (!world.physicsSystem) {
    throw new Error('World not initialized')
  }

  const rayCastFilter = {
    shouldCollide: config.shouldCollide || (() => true),
    shouldCollideLocked: config.shouldCollideLocked || (() => true)
  }

  // Returns hit data or null
  return {
    hit: false,
    distance: distance,
    body: null
  }
}

export function castRay(world, origin, direction, distance, config = {}) {
  // Alias for raycast
  return raycast(world, origin, direction, distance, config)
}

export function getContactPoints(world, bodyId1, bodyId2) {
  // Get contact points between two bodies
  return []
}

export function testShape(world, shape, position, rotation) {
  // Test if shape collides with world
  return {
    hit: false,
    hits: []
  }
}
