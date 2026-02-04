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
    this.physicsSystem = new Jolt.PhysicsSystem()
    this.physicsSystem.init(1000, 0, 1000, 1000, new Jolt.BroadPhaseLayerInterface(2, 1), new Jolt.ObjectLayerPairFilter(), new Jolt.ObjectVsBroadPhaseLayerFilter())
    this.bodyInterface = this.physicsSystem.getBodyInterface()
    const [gx, gy, gz] = this.config.gravity
    this.physicsSystem.setGravity(new Jolt.Vec3(gx, gy, gz))
    return this
  }

  addBody(mesh, bodyConfig = {}) {
    const bodyId = this.nextBodyId++
    this.bodies.set(bodyId, {
      mesh,
      config: bodyConfig,
      position: bodyConfig.position || [0, 0, 0],
      rotation: bodyConfig.rotation || [0, 0, 0, 1]
    })
    return bodyId
  }

  step(deltaTime) {
    if (!this.physicsSystem) return
    this.physicsSystem.step(deltaTime, 1, 1)
  }

  getBody(bodyId) {
    return this.bodies.get(bodyId)
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

export function addBody(world, mesh, config = {}) {
  return world.addBody(mesh, {
    dynamic: false,
    mass: 1.0,
    friction: 0.2,
    restitution: 0.0,
    ...config
  })
}

export function step(world, deltaTime) {
  world.step(deltaTime)
}

export function raycast(world, origin, direction, distance, config = {}) {
  return { hit: false, distance, body: null }
}

export function getEntityData(world, bodyId) {
  const body = world.getBody(bodyId)
  if (!body) return null
  return {
    id: bodyId,
    position: body.position || [0, 0, 0],
    rotation: body.rotation || [0, 0, 0, 1],
    velocity: body.velocity || [0, 0, 0],
    angularVelocity: body.angularVelocity || [0, 0, 0],
    config: body.config
  }
}
