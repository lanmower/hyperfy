/**
 * System Configuration
 *
 * Centralized configuration for all Hyperfy systems.
 * Extracts magic numbers, constants, and tunable parameters.
 * Environment variables can override defaults.
 */

/**
 * Physics Configuration
 */
export const PhysicsConfig = {
  CAPSULE_RADIUS: parseFloat(process.env.PHYSICS_CAPSULE_RADIUS ?? 0.3),
  CAPSULE_HEIGHT: parseFloat(process.env.PHYSICS_CAPSULE_HEIGHT ?? 1.8),

  MASS: parseFloat(process.env.PHYSICS_MASS ?? 70),
  GRAVITY: parseFloat(process.env.PHYSICS_GRAVITY ?? 9.81),
  GROUND_DRAG: parseFloat(process.env.PHYSICS_GROUND_DRAG ?? 0.8),
  AIR_DRAG: parseFloat(process.env.PHYSICS_AIR_DRAG ?? 0.1),

  JUMP_HEIGHT: parseFloat(process.env.PHYSICS_JUMP_HEIGHT ?? 1.5),
  JUMP_IMPULSE: parseFloat(process.env.PHYSICS_JUMP_IMPULSE ?? 7.0),
  MAX_AIR_JUMPS: parseInt(process.env.PHYSICS_MAX_AIR_JUMPS ?? 1),

  WALK_SPEED: parseFloat(process.env.PHYSICS_WALK_SPEED ?? 4.0),
  RUN_SPEED: parseFloat(process.env.PHYSICS_RUN_SPEED ?? 7.0),
  FLY_SPEED: parseFloat(process.env.PHYSICS_FLY_SPEED ?? 10.0),

  FLY_DRAG: parseFloat(process.env.PHYSICS_FLY_DRAG ?? 0.95),
  FLY_FORCE_MULTIPLIER: parseFloat(process.env.PHYSICS_FLY_FORCE ?? 3.0),

  GROUND_DETECTION_RADIUS: parseFloat(process.env.PHYSICS_GROUND_RADIUS ?? 0.35),
  GROUND_SLOPE_MAX: parseFloat(process.env.PHYSICS_GROUND_SLOPE ?? 0.5),
  GROUND_SLOPE_THRESHOLD: parseFloat(process.env.PHYSICS_GROUND_THRESHOLD ?? 0.3),

  PUSH_FORCE_DECAY: parseFloat(process.env.PHYSICS_PUSH_DECAY ?? 0.95),
}

/**
 * Rendering Configuration
 */
export const RenderingConfig = {
  SHADOW_MAP_SIZE: parseInt(process.env.RENDER_SHADOW_SIZE ?? 2048),
  SHADOW_BIAS: parseFloat(process.env.RENDER_SHADOW_BIAS ?? 0.0001),
  SHADOW_NORMAL_BIAS: parseFloat(process.env.RENDER_SHADOW_NORMAL_BIAS ?? 0.02),

  CSM_SPLITS: parseInt(process.env.RENDER_CSM_SPLITS ?? 4),
  CSM_LAMBDA: parseFloat(process.env.RENDER_CSM_LAMBDA ?? 0.5),

  FOG_START: parseFloat(process.env.RENDER_FOG_START ?? 10),
  FOG_END: parseFloat(process.env.RENDER_FOG_END ?? 1000),
  FOG_DISTANCE_OFFSET: parseFloat(process.env.RENDER_FOG_OFFSET ?? 5),

  ANTIALIASING: process.env.RENDER_AA !== 'false',
  ANISOTROPIC_FILTERING: parseInt(process.env.RENDER_ANISO ?? 8),

  PIXEL_RATIO: parseFloat(process.env.RENDER_PIXEL_RATIO ?? 1),
}

/**
 * Network Configuration
 */
export const NetworkConfig = {
  SERVER_TICK_RATE: parseInt(process.env.NET_TICK_RATE ?? 60),
  PLAYER_UPDATE_RATE: parseFloat(process.env.NET_UPDATE_RATE ?? 8), // Hz
  SNAPSHOT_INTERVAL: parseFloat(process.env.NET_SNAPSHOT_INTERVAL ?? 1),

  PING_TIMEOUT: parseInt(process.env.NET_PING_TIMEOUT ?? 5000),
  CONNECTION_TIMEOUT: parseInt(process.env.NET_CONN_TIMEOUT ?? 10000),
  DISCONNECTION_TIMEOUT: parseInt(process.env.NET_DISC_TIMEOUT ?? 30000),

  SAVE_INTERVAL: parseInt(process.env.SAVE_INTERVAL ?? 60),

  MAX_UPLOAD_SIZE: parseInt(process.env.PUBLIC_MAX_UPLOAD_SIZE ?? 50 * 1024 * 1024),
  UPLOAD_TIMEOUT: parseInt(process.env.NET_UPLOAD_TIMEOUT ?? 60000),

  ENABLE_COMPRESSION: process.env.NET_COMPRESSION !== 'false',
  MAX_MESSAGE_SIZE: parseInt(process.env.NET_MAX_MSG_SIZE ?? 1024 * 100),
}

/**
 * Input Configuration
 */
export const InputConfig = {
  POINTER_SENSITIVITY: parseFloat(process.env.INPUT_POINTER_SENS ?? 1),
  POINTER_LOOK_SPEED: parseFloat(process.env.INPUT_POINTER_SPEED ?? 0.001),
  POINTER_INVERT_Y: process.env.INPUT_INVERT_Y === 'true',

  PAN_LOOK_SPEED: parseFloat(process.env.INPUT_PAN_SPEED ?? 0.002),
  TOUCH_DEADZONE: parseFloat(process.env.INPUT_DEADZONE ?? 0.2),
  TOUCH_FULL_EXTENT: parseFloat(process.env.INPUT_FULL_EXTENT ?? 0.8),

  ZOOM_SPEED: parseFloat(process.env.INPUT_ZOOM_SPEED ?? 0.02),
  ZOOM_MIN: parseFloat(process.env.INPUT_ZOOM_MIN ?? 0.1),
  ZOOM_MAX: parseFloat(process.env.INPUT_ZOOM_MAX ?? 3),
  FIRST_PERSON_THRESHOLD: parseFloat(process.env.INPUT_FP_THRESHOLD ?? 0.9),

  KEY_REPEAT_DELAY: parseInt(process.env.INPUT_REPEAT_DELAY ?? 500),
  KEY_REPEAT_INTERVAL: parseInt(process.env.INPUT_REPEAT_INTERVAL ?? 30),
}

/**
 * Avatar & Animation Configuration
 */
export const AvatarConfig = {
  VRM_DEFAULT_SCALE: parseFloat(process.env.AVATAR_SCALE ?? 1),
  VRM_BLEND_SHAPE_WEIGHT: parseFloat(process.env.AVATAR_BLEND_WEIGHT ?? 1),

  ANIMATION_FADE_DURATION: parseFloat(process.env.ANIM_FADE ?? 0.2),
  LOCOMOTION_WALK_SPEED: parseFloat(process.env.ANIM_WALK ?? 0.5),
  LOCOMOTION_RUN_SPEED: parseFloat(process.env.ANIM_RUN ?? 1.0),

  EMOTE_DURATION: parseFloat(process.env.EMOTE_DURATION ?? 3),

  NAMETAG_OFFSET: parseFloat(process.env.NAMETAG_OFFSET ?? 2),
}

/**
 * Chat Configuration
 */
export const ChatConfig = {
  MAX_MESSAGES: parseInt(process.env.CHAT_MAX_MESSAGES ?? 50),
  MESSAGE_TIMEOUT: parseInt(process.env.CHAT_TIMEOUT ?? 300000),

  BUBBLE_DISPLAY_TIME: parseFloat(process.env.CHAT_BUBBLE_TIME ?? 5),
  BUBBLE_OFFSET_Y: parseFloat(process.env.CHAT_BUBBLE_OFFSET ?? 2),

  MESSAGE_COOLDOWN: parseInt(process.env.CHAT_COOLDOWN ?? 100),
  MAX_MESSAGES_PER_MINUTE: parseInt(process.env.CHAT_RATE_LIMIT ?? 60),
}

/**
 * Audio Configuration
 */
export const AudioConfig = {
  MASTER_VOLUME: parseFloat(process.env.AUDIO_MASTER ?? 1.0),
  EFFECTS_VOLUME: parseFloat(process.env.AUDIO_EFFECTS ?? 0.8),
  VOICE_VOLUME: parseFloat(process.env.AUDIO_VOICE ?? 1.0),

  MAX_SPATIAL_DISTANCE: parseFloat(process.env.AUDIO_MAX_DISTANCE ?? 100),
  VOICE_CODEC: process.env.AUDIO_CODEC ?? 'opus',
}

/**
 * Performance Configuration
 */
export const PerformanceConfig = {
  TARGET_FPS: parseInt(process.env.PERF_TARGET_FPS ?? 60),
  MIN_FRAME_TIME: 1000 / parseInt(process.env.PERF_TARGET_FPS ?? 60),

  MAX_DELTA_TIME: parseFloat(process.env.PERF_MAX_DELTA ?? 1 / 30),
  FIXED_DELTA_TIME: parseFloat(process.env.PERF_FIXED_DELTA ?? 1 / 50),

  QUALITY_LEVEL: parseInt(process.env.PERF_QUALITY ?? 2), // 0=low, 1=medium, 2=high, 3=ultra

  MAX_CACHED_ASSETS: parseInt(process.env.PERF_MAX_CACHE ?? 100),
  ASSET_CLEANUP_INTERVAL: parseInt(process.env.PERF_CLEANUP ?? 60000),
}

/**
 * Error & Debug Configuration
 */
export const ErrorConfig = {
  CAPTURE_ERRORS: process.env.CAPTURE_ERRORS !== 'false',
  MAX_ERROR_HISTORY: parseInt(process.env.ERROR_MAX_HISTORY ?? 500),
  ERROR_CLEANUP_INTERVAL: parseInt(process.env.ERROR_CLEANUP ?? 3600000),

  DEBUG_MODE: process.env.DEBUG === 'true',
  VERBOSE_LOGGING: process.env.VERBOSE === 'true',
  LOG_NETWORK_MESSAGES: process.env.LOG_NETWORK === 'true',
}

/**
 * Get all configuration as a single object
 */
export function getAllConfig() {
  return {
    physics: PhysicsConfig,
    rendering: RenderingConfig,
    network: NetworkConfig,
    input: InputConfig,
    avatar: AvatarConfig,
    chat: ChatConfig,
    audio: AudioConfig,
    performance: PerformanceConfig,
    error: ErrorConfig,
  }
}

/**
 * Validate configuration values
 */
export function validateConfig() {
  const errors = []

  if (PhysicsConfig.CAPSULE_RADIUS <= 0) errors.push('CAPSULE_RADIUS must be > 0')
  if (PhysicsConfig.GRAVITY <= 0) errors.push('GRAVITY must be > 0')
  if (PhysicsConfig.JUMP_HEIGHT <= 0) errors.push('JUMP_HEIGHT must be > 0')

  if (NetworkConfig.SERVER_TICK_RATE <= 0) errors.push('SERVER_TICK_RATE must be > 0')
  if (NetworkConfig.SAVE_INTERVAL < 0) errors.push('SAVE_INTERVAL must be >= 0')

  if (PerformanceConfig.TARGET_FPS <= 0) errors.push('TARGET_FPS must be > 0')
  if (PerformanceConfig.QUALITY_LEVEL < 0 || PerformanceConfig.QUALITY_LEVEL > 3) {
    errors.push('QUALITY_LEVEL must be 0-3')
  }

  return errors
}
