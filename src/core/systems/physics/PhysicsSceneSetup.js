export class PhysicsSceneSetup {
  constructor(physics) {
    this.physics = physics
  }

  createScene(events) {
    const sceneDesc = new PHYSX.PxSceneDesc(this.physics.tolerances)
    sceneDesc.gravity = new PHYSX.PxVec3(0, -9.81, 0)
    sceneDesc.cpuDispatcher = PHYSX.DefaultCpuDispatcherCreate(0)
    sceneDesc.filterShader = PHYSX.DefaultFilterShader()
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_CCD, true)
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_ACTIVE_ACTORS, true)
    sceneDesc.solverType = PHYSX.PxSolverTypeEnum.eTGS
    sceneDesc.simulationEventCallback = events.createSimulationEventCallback()
    sceneDesc.broadPhaseType = PHYSX.PxBroadPhaseTypeEnum.eGPU
    return this.physics.physics.createScene(sceneDesc)
  }
}
