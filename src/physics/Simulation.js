// Physics simulation stepping

export function step(world, deltaTime) {
  if (!world.physicsSystem) {
    throw new Error('World not initialized')
  }

  world.step(deltaTime)
}

export function simulate(world, deltaTime, substeps = 1) {
  // Full simulation with multiple substeps
  const subDelta = deltaTime / substeps

  for (let i = 0; i < substeps; i++) {
    step(world, subDelta)
  }
}

export function getSimulationStats(world) {
  return {
    bodyCount: world.bodies.size,
    active: world.bodies.size,
    timestamp: Date.now()
  }
}
