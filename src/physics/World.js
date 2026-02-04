import Jolt from 'jolt-physics'

let joltModule = null

async function getJoltModule() {
  if (!joltModule) {
    joltModule = await Jolt()
  }
  return joltModule
}

export class PhysicsWorld {
  constructor(config = {}) {
    this.config = {
      gravity: [0, -9.81, 0],
      ...config
    }
    this.jolt = null
    this.physicsSystem = null
    this.bodyInterface = null
    this.bodies = new Map()
    this.nextBodyId = 1
  }

  async init() {
    const Jolt = await getJoltModule()
    this.jolt = Jolt

    // Create Jolt physics system
    this.physicsSystem = new Jolt.PhysicsSystem()
    this.physicsSystem.init(
      1000,
      0,
      1000,
      1000,
      new Jolt.BroadPhaseLayerInterface(2, 1),
      new Jolt.ObjectLayerPairFilter(),
      new Jolt.ObjectVsBroadPhaseLayerFilter()
    )

    this.bodyInterface = this.physicsSystem.getBodyInterface()

    // Set gravity
    const [gx, gy, gz] = this.config.gravity
    this.physicsSystem.setGravity(new Jolt.Vec3(gx, gy, gz))

    return this
  }

  addBody(mesh, bodyConfig = {}) {
    if (!this.physicsSystem) {
      throw new Error('World not initialized - call await world.init() first')
    }

    const bodyId = this.nextBodyId++

    // Store body reference internally
    this.bodies.set(bodyId, {
      mesh,
      config: bodyConfig,
      position: bodyConfig.position || [0, 0, 0],
      rotation: bodyConfig.rotation || [0, 0, 0, 1]
    })

    return bodyId
  }

  getBody(bodyId) {
    return this.bodies.get(bodyId)
  }

  step(deltaTime) {
    if (!this.physicsSystem) return

    // Collide and step
    this.physicsSystem.step(
      deltaTime,
      1, // collision steps
      1  // integration substeps
    )
  }

  destroy() {
    if (this.physicsSystem) {
      this.physicsSystem.destroy()
    }
    this.bodies.clear()
  }
}

export function createWorld(config = {}) {
  return new PhysicsWorld(config)
}
