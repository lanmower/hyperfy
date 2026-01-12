export const EntitiesConstants = {
  LIMITS: {
    MAX_ENTITIES: 10000,
    MAX_HOT_ENTITIES: 500,
    MAX_SPAWNED_PER_FRAME: 50,
    MAX_DESTROYED_PER_FRAME: 50,
  },

  VALIDATION: {
    INVALID_WINDOW_MS: 60000,
    INVALID_THRESHOLD: 10,
    CHECK_INTERVAL: 5000,
  },

  TYPES: {
    APP: 'app',
    PLAYER: 'player',
    AVATAR: 'avatar',
    ENVIRONMENT: 'environment',
    NPC: 'npc',
    PROJECTILE: 'projectile',
    PROP: 'prop',
  },

  STATES: {
    IDLE: 0,
    ACTIVE: 1,
    TRANSITIONING: 2,
    DESTROYED: 3,
  },

  FLAGS: {
    IS_LOCAL: 1,
    IS_HOT: 2,
    IS_STATIC: 4,
    HAS_PHYSICS: 8,
    HAS_SCRIPT: 16,
    IS_VISIBLE: 32,
    NETWORKED: 64,
    PERSISTENT: 128,
  },

  SYNC: {
    POSITION_THRESHOLD: 0.01,
    ROTATION_THRESHOLD: 0.01,
    SCALE_THRESHOLD: 0.01,
    SYNC_INTERVAL_MS: 33,
  },

  INTERPOLATION: {
    ENABLED: true,
    DURATION_MS: 100,
    EASING: 'linear',
  },

  HIERARCHY: {
    MAX_DEPTH: 32,
    MAX_CHILDREN: 1000,
  },

  COMPONENTS: {
    TRANSFORM: 'transform',
    PHYSICS: 'physics',
    GRAPHICS: 'graphics',
    SCRIPT: 'script',
    AUDIO: 'audio',
    ANIMATION: 'animation',
  },

  LIFECYCLE: {
    ON_SPAWN: 'onSpawn',
    ON_INIT: 'onInit',
    ON_ENABLE: 'onEnable',
    ON_DISABLE: 'onDisable',
    ON_DESTROY: 'onDestroy',
  },

  NETWORK: {
    UPDATE_FREQUENCY: 30,
    SNAPSHOT_FREQUENCY: 60,
    INTERPOLATION_FACTOR: 0.1,
  },

  POOLING: {
    ENABLED: true,
    INITIAL_SIZE: 100,
    GROW_SIZE: 50,
  },
}
