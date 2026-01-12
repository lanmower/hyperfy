export const PerformanceConstants = {
  FRAME_BUDGET_MS: 16.67,
  FPS_TARGET: 60,
  SAMPLE_RATE: 30,

  BUDGETS: {
    FRAME: {
      preTick: 0.5,
      fixedUpdate: 3.0,
      update: 3.0,
      lateUpdate: 3.0,
      postLateUpdate: 1.0,
      commit: 2.0,
      total: 16.67,
    },
    SYSTEM: {
      physics: 2.0,
      entities: 1.5,
      network: 0.5,
      stage: 0.3,
      avatar: 0.5,
      scripts: 1.0,
    },
    ENTITY: {
      count: 50,
      timePerEntity: 0.02,
    },
    INIT: {
      world: 5000,
      entitySpawn: 100,
      blueprintLoad: 2000,
      snapshotProcess: 500,
      clientLoader: 2000,
      clientGraphics: 1000,
      physx: 1000,
    },
    NETWORK: {
      packetProcess: 50,
      entityAdded: 100,
      entityModified: 150,
      snapshot: 500,
      broadcast: 50,
      upload: 30000,
    },
    ASSET: {
      modelLoad: 2000,
      textureLoad: 500,
      avatarLoad: 1000,
      environmentLoad: 1500,
    },
  },

  BUFFERS: {
    FRAME_PHASES_SIZE: 60,
    SYSTEM_PHASES_SIZE: 60,
    ENTITY_OPERATIONS_SIZE: 60,
    MAX_MEASUREMENTS_PER_LABEL: 1000,
    MAX_VIOLATIONS: 100,
  },

  STATISTICS: {
    P95_PERCENTILE: 0.95,
    P99_PERCENTILE: 0.99,
  },
}
