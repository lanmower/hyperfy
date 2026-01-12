export const LoadersConstants = {
  CACHE: {
    MAX_SIZE: 100,
    EVICTION_POLICY: 'lru',
    MEMORY_LIMIT: 1024 * 1024 * 512,
  },

  BATCH: {
    SIZE: 10,
    CONCURRENT_LOADS: 5,
  },

  TIMEOUTS: {
    MODEL_LOAD: 30000,
    TEXTURE_LOAD: 10000,
    AVATAR_LOAD: 15000,
    ENVIRONMENT_LOAD: 20000,
    SCRIPT_LOAD: 5000,
  },

  RETRIES: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    BACKOFF_MULTIPLIER: 2,
  },

  FALLBACK: {
    MODEL: {
      GEOMETRY: 'box',
      BOX_SIZE: 1,
      COLOR: 0x808080,
      ROUGHNESS: 0.8,
    },
    TEXTURE: {
      WIDTH: 64,
      HEIGHT: 64,
      COLOR: 0x808080,
      FORMAT: 'image/png',
    },
    AVATAR: {
      CAPSULE_RADIUS: 0.3,
      CAPSULE_HEIGHT: 1.2,
      CAPSULE_RADIAL_SEG: 8,
      CAPSULE_HEIGHT_SEG: 16,
      COLOR: 0x808080,
    },
    HDR: {
      WIDTH: 16,
      HEIGHT: 16,
      RED: 0.5,
      GREEN: 0.5,
      BLUE: 0.5,
      ALPHA: 1.0,
    },
  },

  FORMATS: {
    MODELS: ['glb', 'gltf', 'obj', 'fbx'],
    TEXTURES: ['png', 'jpg', 'webp', 'ktx2'],
    AUDIO: ['mp3', 'wav', 'ogg', 'm4a'],
    SCRIPTS: ['js'],
    ENVIRONMENTS: ['hdr', 'exr'],
  },

  SIZE_LIMITS: {
    MODEL: 50 * 1024 * 1024,
    TEXTURE: 20 * 1024 * 1024,
    AVATAR: 30 * 1024 * 1024,
    AUDIO: 10 * 1024 * 1024,
    SCRIPT: 5 * 1024 * 1024,
  },

  QUALITY: {
    TEXTURE_QUALITY_HIGH: 'high',
    TEXTURE_QUALITY_MEDIUM: 'medium',
    TEXTURE_QUALITY_LOW: 'low',
    MIPMAPS_ENABLED: true,
    ANISOTROPY: 16,
  },

  PERFORMANCE: {
    PROGRESSIVE_LOAD: true,
    LOAD_PLACEHOLDER_FIRST: true,
    COMPRESS_TEXTURES: true,
  },

  EVENTS: {
    ON_LOAD_START: 'loadStart',
    ON_LOAD_PROGRESS: 'loadProgress',
    ON_LOAD_COMPLETE: 'loadComplete',
    ON_LOAD_ERROR: 'loadError',
  },
}
