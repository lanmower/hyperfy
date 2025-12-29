export const GraphicsConstants = {
  CAMERA: {
    FOV: 70,
    NEAR: 0.2,
    FAR: 1200,
    ASPECT_RATIO_DEFAULT: 16 / 9,
    Z_OFFSET: 0.5,
  },

  VIEWPORT: {
    MIN_WIDTH: 320,
    MIN_HEIGHT: 240,
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    PIXEL_RATIO_MAX: 2,
  },

  RENDERING: {
    ANTIALIAS: true,
    ALPHA: true,
    DEPTH: true,
    STENCIL: false,
    TONE_MAPPING: 2,
    TONE_MAPPING_EXPOSURE: 1.0,
    PRESERVE_DRAWING_BUFFER: false,
  },

  SHADOWS: {
    TYPE: 1,
    MAP_SIZE: 2048,
    CAMERA_FAR: 35,
    CAMERA_SIZE: 25,
    BIAS: 0.0005,
    NORMAL_BIAS: 0.05,
    RADIUS: 8,
  },

  BLOOM: {
    ENABLED: true,
    LUMINANCE_THRESHOLD: 1.0,
    LUMINANCE_SMOOTHING: 0.3,
    INTENSITY: 0.5,
    RADIUS: 0.8,
  },

  FOG: {
    TYPE_EXPONENTIAL: 'exponential',
    TYPE_LINEAR: 'linear',
    DEFAULT_NEAR: 0.1,
    DEFAULT_FAR: 1000,
    DEFAULT_COLOR: 0xcccccc,
    DENSITY: 0.0001,
  },

  ENVIRONMENT: {
    INTENSITY: 1.0,
    ROTATION: 0,
    BLUR: 0,
  },

  XR: {
    FOVEATION_LEVEL: 1,
    ENABLE_HAND_TRACKING: true,
    ENABLE_PASS_THROUGH: false,
  },

  COLORS: {
    BACKGROUND_DEFAULT: 0x000000,
    WIREFRAME: 0x00ff00,
    DEBUG_NORMAL: 0xff0000,
  },

  LOD: {
    ENABLED: true,
    DISTANCE_NEAR: 10,
    DISTANCE_FAR: 100,
  },

  ANTIALIASING: {
    FXAA_ENABLED: true,
    SMAA_ENABLED: false,
    TAA_ENABLED: false,
  },

  LIMITS: {
    MAX_LIGHTS: 16,
    MAX_SHADOWS: 4,
    MAX_CLIP_PLANES: 6,
  },
}
