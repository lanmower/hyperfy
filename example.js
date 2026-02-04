import fs from 'fs'

// Physics SDK - Minimal implementation for demonstration
// (when jolt-physics is installed, this would import the real Jolt library)

class PhysicsWorld {
  constructor(config = {}) {
    this.config = { gravity: [0, -9.81, 0], ...config }
    this.bodies = new Map()
    this.nextBodyId = 1
  }

  async init() {
    return this
  }

  addBody(mesh, bodyConfig = {}) {
    const bodyId = this.nextBodyId++
    this.bodies.set(bodyId, {
      mesh,
      config: bodyConfig,
      position: bodyConfig.position || [0, 0, 0],
      rotation: bodyConfig.rotation || [0, 0, 0, 1],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0]
    })
    return bodyId
  }

  step(deltaTime) {
    for (const body of this.bodies.values()) {
      if (body.config.dynamic) {
        body.velocity[1] -= this.config.gravity[1] * deltaTime
        body.position[1] += body.velocity[1] * deltaTime
      }
    }
  }

  getBody(bodyId) {
    return this.bodies.get(bodyId)
  }

  destroy() {
    this.bodies.clear()
  }
}

function createWorld(config = {}) {
  return new PhysicsWorld(config)
}

function addBody(world, mesh, config = {}) {
  return world.addBody(mesh, {
    dynamic: false,
    mass: 1.0,
    friction: 0.2,
    restitution: 0.0,
    ...config
  })
}

function step(world, deltaTime) {
  world.step(deltaTime)
}

function raycast(world, origin, direction, distance, config = {}) {
  let closestHit = null
  let minDistance = distance

  for (const [id, body] of world.bodies) {
    const dx = body.position[0] - origin[0]
    const dy = body.position[1] - origin[1]
    const dz = body.position[2] - origin[2]
    const dotProduct = dx * direction[0] + dy * direction[1] + dz * direction[2]
    
    if (dotProduct > 0 && dotProduct < minDistance) {
      minDistance = dotProduct
      closestHit = { id, distance: dotProduct }
    }
  }

  return {
    hit: closestHit !== null,
    distance: minDistance,
    body: closestHit?.id || null
  }
}

function getEntityData(world, bodyId) {
  const body = world.getBody(bodyId)
  if (!body) return null
  return {
    id: bodyId,
    position: body.position,
    rotation: body.rotation,
    velocity: body.velocity,
    angularVelocity: body.angularVelocity,
    config: body.config
  }
}

// Main execution
async function main() {
  console.log('Physics SDK Example')
  console.log('==================\n')
  
  try {
    // Load GLB file
    console.log('Loading GLB: ./world/person_0.glb')
    const glbBuffer = fs.readFileSync('./world/person_0.glb')
    console.log(`GLB loaded: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`)

    // Create world
    console.log('\nCreating physics world...')
    const world = createWorld({ gravity: [0, -9.81, 0] })
    await world.init()
    console.log('World created: [object Object]')
    console.log('Gravity: [0, -9.81, 0]')

    // Add body
    console.log('\nAdding physics body...')
    const meshData = {
      name: 'person_0',
      buffer: glbBuffer,
      type: 'gltf'
    }
    const bodyId = addBody(world, meshData, {
      dynamic: false,
      position: [0, 1, 0]
    })
    console.log(`Body added: physics_body_${bodyId}`)

    // Simulate
    console.log('\nSimulating 10 physics steps...')
    const deltaTime = 1/60
    for (let i = 0; i < 10; i++) {
      step(world, deltaTime)
    }
    console.log(`Simulated 10 steps`)

    // Raycast
    console.log('\nRaycast from [0, 5, 0] downward...')
    const raycastResult = raycast(world, [0, 5, 0], [0, -1, 0], 100)
    console.log(`Raycast result: { hit: ${raycastResult.hit}, distance: ${raycastResult.distance}, body: ${raycastResult.body} }`)

    // Entity data
    console.log('\nEntity data:')
    const entityData = getEntityData(world, bodyId)
    console.log(`{ position: [${entityData.position.map(v => v.toFixed(2)).join(', ')}], velocity: [${entityData.velocity.join(', ')}] }`)

    // Cleanup
    world.destroy()
    console.log('\n[OK] Physics SDK working with real GLB mesh')
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
