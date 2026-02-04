// Pure physics SDK - zero HTTP, zero infrastructure
// Export clean SDK functions for physics simulation

export { createWorld } from './physics/World.js'
export { loadGLB } from './physics/GLBLoader.js'
export { addBody } from './physics/BodyManager.js'
export { raycast, castRay } from './physics/Queries.js'
export { step, simulate } from './physics/Simulation.js'
export { getBodyData, getEntityData } from './physics/DataAccess.js'
export { Vector3, Quaternion, Transform } from './math/index.js'
