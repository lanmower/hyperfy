const env = typeof process !== 'undefined' && process.env ? process.env : {}

export const PhysicsConfig = {
  CAPSULE_RADIUS: parseFloat(env.PHYSICS_CAPSULE_RADIUS ?? 0.3),
  CAPSULE_HEIGHT: parseFloat(env.PHYSICS_CAPSULE_HEIGHT ?? 1.8),

  MASS: parseFloat(env.PHYSICS_MASS ?? 70),
  GRAVITY: parseFloat(env.PHYSICS_GRAVITY ?? 9.81),
  GROUND_DRAG: parseFloat(env.PHYSICS_GROUND_DRAG ?? 0.8),
  AIR_DRAG: parseFloat(env.PHYSICS_AIR_DRAG ?? 0.1),

  JUMP_HEIGHT: parseFloat(env.PHYSICS_JUMP_HEIGHT ?? 1.5),
  JUMP_IMPULSE: parseFloat(env.PHYSICS_JUMP_IMPULSE ?? 7.0),
  MAX_AIR_JUMPS: parseInt(env.PHYSICS_MAX_AIR_JUMPS ?? 1),

  WALK_SPEED: parseFloat(env.PHYSICS_WALK_SPEED ?? 4.0),
  RUN_SPEED: parseFloat(env.PHYSICS_RUN_SPEED ?? 7.0),
  FLY_SPEED: parseFloat(env.PHYSICS_FLY_SPEED ?? 10.0),

  FLY_DRAG: parseFloat(env.PHYSICS_FLY_DRAG ?? 0.95),
  FLY_FORCE_MULTIPLIER: parseFloat(env.PHYSICS_FLY_FORCE ?? 3.0),

  GROUND_DETECTION_RADIUS: parseFloat(env.PHYSICS_GROUND_RADIUS ?? 0.35),
  GROUND_SLOPE_MAX: parseFloat(env.PHYSICS_GROUND_SLOPE ?? 0.5),
  GROUND_SLOPE_THRESHOLD: parseFloat(env.PHYSICS_GROUND_THRESHOLD ?? 0.3),

  GROUND_SWEEP_OFFSET: parseFloat(env.PHYSICS_GROUND_SWEEP_OFFSET ?? 0.12),
  GROUND_SWEEP_DISTANCE: parseFloat(env.PHYSICS_GROUND_SWEEP_DISTANCE ?? 0.1),
  PLATFORM_RAYCAST_DISTANCE: parseFloat(env.PHYSICS_PLATFORM_RAYCAST ?? 2),
  PLATFORM_RAYCAST_OFFSET: parseFloat(env.PHYSICS_PLATFORM_OFFSET ?? 0.2),

  PUSH_FORCE_DECAY: parseFloat(env.PHYSICS_PUSH_DECAY ?? 0.95),
  PUSH_DRAG: parseFloat(env.PHYSICS_PUSH_DRAG ?? 20),

  FALL_DAMAGE_THRESHOLD: parseFloat(env.PHYSICS_FALL_THRESHOLD ?? 1.6),
  FALL_TIMER_THRESHOLD: parseFloat(env.PHYSICS_FALL_TIMER ?? 0.1),
  FALL_VELOCITY: parseFloat(env.PHYSICS_FALL_VELOCITY ?? -5),

  GRAVITY_PLATFORM_FACTOR: parseFloat(env.PHYSICS_GRAVITY_PLATFORM ?? 0.2),
  SLIPPING_GRAVITY: parseFloat(env.PHYSICS_SLIPPING_GRAVITY ?? 0.5),
  DRAG_COEFFICIENT: parseFloat(env.PHYSICS_DRAG_COEFF ?? 10),
}


export const RenderingConfig = {
  SHADOW_MAP_SIZE: parseInt(env.RENDER_SHADOW_SIZE ?? 2048),
  SHADOW_BIAS: parseFloat(env.RENDER_SHADOW_BIAS ?? 0.0001),
  SHADOW_NORMAL_BIAS: parseFloat(env.RENDER_SHADOW_NORMAL_BIAS ?? 0.02),

  CSM_SPLITS: parseInt(env.RENDER_CSM_SPLITS ?? 4),
  CSM_LAMBDA: parseFloat(env.RENDER_CSM_LAMBDA ?? 0.5),

  FOG_START: parseFloat(env.RENDER_FOG_START ?? 10),
  FOG_END: parseFloat(env.RENDER_FOG_END ?? 1000),
  FOG_DISTANCE_OFFSET: parseFloat(env.RENDER_FOG_OFFSET ?? 5),

  ANTIALIASING: env.RENDER_AA !== 'false',
  ANISOTROPIC_FILTERING: parseInt(env.RENDER_ANISO ?? 8),

  PIXEL_RATIO: parseFloat(env.RENDER_PIXEL_RATIO ?? 1),
}


export const NetworkConfig = {
  SERVER_TICK_RATE: parseInt(env.NET_TICK_RATE ?? 60),
  PLAYER_UPDATE_RATE: parseFloat(env.NET_UPDATE_RATE ?? 8), // Hz
  SNAPSHOT_INTERVAL: parseFloat(env.NET_SNAPSHOT_INTERVAL ?? 1),

  PING_TIMEOUT: parseInt(env.NET_PING_TIMEOUT ?? 5000),
  CONNECTION_TIMEOUT: parseInt(env.NET_CONN_TIMEOUT ?? 10000),
  DISCONNECTION_TIMEOUT: parseInt(env.NET_DISC_TIMEOUT ?? 30000),

  SAVE_INTERVAL: parseInt(env.SAVE_INTERVAL ?? 60),

  MAX_UPLOAD_SIZE: parseInt(env.PUBLIC_MAX_UPLOAD_SIZE ?? 50 * 1024 * 1024),
  UPLOAD_TIMEOUT: parseInt(env.NET_UPLOAD_TIMEOUT ?? 60000),

  ENABLE_COMPRESSION: env.NET_COMPRESSION !== 'false',
  MAX_MESSAGE_SIZE: parseInt(env.NET_MAX_MSG_SIZE ?? 1024 * 100),
}


export const InputConfig = {
  POINTER_SENSITIVITY: parseFloat(env.INPUT_POINTER_SENS ?? 1),
  POINTER_LOOK_SPEED: parseFloat(env.INPUT_POINTER_SPEED ?? 0.001),
  POINTER_INVERT_Y: env.INPUT_INVERT_Y === 'true',

  PAN_LOOK_SPEED: parseFloat(env.INPUT_PAN_SPEED ?? 0.002),
  TOUCH_DEADZONE: parseFloat(env.INPUT_DEADZONE ?? 0.2),
  TOUCH_FULL_EXTENT: parseFloat(env.INPUT_FULL_EXTENT ?? 0.8),

  ZOOM_SPEED: parseFloat(env.INPUT_ZOOM_SPEED ?? 0.02),
  ZOOM_MIN: parseFloat(env.INPUT_ZOOM_MIN ?? 0.1),
  ZOOM_MAX: parseFloat(env.INPUT_ZOOM_MAX ?? 3),
  FIRST_PERSON_THRESHOLD: parseFloat(env.INPUT_FP_THRESHOLD ?? 0.9),
  DEFAULT_ZOOM: parseFloat(env.INPUT_DEFAULT_ZOOM ?? 1.5),
  STICK_DEAD_ZONE: parseFloat(env.INPUT_STICK_DEADZONE ?? 0.2),

  KEY_REPEAT_DELAY: parseInt(env.INPUT_REPEAT_DELAY ?? 500),
  KEY_REPEAT_INTERVAL: parseInt(env.INPUT_REPEAT_INTERVAL ?? 30),
}


export const AvatarConfig = {
  VRM_DEFAULT_SCALE: parseFloat(env.AVATAR_SCALE ?? 1),
  VRM_BLEND_SHAPE_WEIGHT: parseFloat(env.AVATAR_BLEND_WEIGHT ?? 1),

  ANIMATION_FADE_DURATION: parseFloat(env.ANIM_FADE ?? 0.2),
  LOCOMOTION_WALK_SPEED: parseFloat(env.ANIM_WALK ?? 0.5),
  LOCOMOTION_RUN_SPEED: parseFloat(env.ANIM_RUN ?? 1.0),

  EMOTE_DURATION: parseFloat(env.EMOTE_DURATION ?? 3),

  NAMETAG_OFFSET: parseFloat(env.NAMETAG_OFFSET ?? 2),
  DEFAULT_HEIGHT: parseFloat(env.AVATAR_DEFAULT_HEIGHT ?? 1.6),
  HEAD_HEIGHT_OFFSET: parseFloat(env.AVATAR_HEAD_OFFSET ?? 0.2),
  CAM_HEIGHT_FACTOR: parseFloat(env.AVATAR_CAM_HEIGHT_FACTOR ?? 0.9),
}


export const ChatConfig = {
  MAX_MESSAGES: parseInt(env.CHAT_MAX_MESSAGES ?? 50),
  MESSAGE_TIMEOUT: parseInt(env.CHAT_TIMEOUT ?? 300000),

  BUBBLE_DISPLAY_TIME: parseFloat(env.CHAT_BUBBLE_TIME ?? 5),
  BUBBLE_OFFSET_Y: parseFloat(env.CHAT_BUBBLE_OFFSET ?? 2),

  MESSAGE_COOLDOWN: parseInt(env.CHAT_COOLDOWN ?? 100),
  MAX_MESSAGES_PER_MINUTE: parseInt(env.CHAT_RATE_LIMIT ?? 60),
}


export const AudioConfig = {
  MASTER_VOLUME: parseFloat(env.AUDIO_MASTER ?? 1.0),
  EFFECTS_VOLUME: parseFloat(env.AUDIO_EFFECTS ?? 0.8),
  VOICE_VOLUME: parseFloat(env.AUDIO_VOICE ?? 1.0),

  MAX_SPATIAL_DISTANCE: parseFloat(env.AUDIO_MAX_DISTANCE ?? 100),
  VOICE_CODEC: env.AUDIO_CODEC ?? 'opus',
}


export const PerformanceConfig = {
  TARGET_FPS: parseInt(env.PERF_TARGET_FPS ?? 60),
  MIN_FRAME_TIME: 1000 / parseInt(env.PERF_TARGET_FPS ?? 60),

  MAX_DELTA_TIME: parseFloat(env.PERF_MAX_DELTA ?? 1 / 30),
  FIXED_DELTA_TIME: parseFloat(env.PERF_FIXED_DELTA ?? 1 / 50),

  QUALITY_LEVEL: parseInt(env.PERF_QUALITY ?? 2), // 0=low, 1=medium, 2=high, 3=ultra

  MAX_CACHED_ASSETS: parseInt(env.PERF_MAX_CACHE ?? 100),
  ASSET_CLEANUP_INTERVAL: parseInt(env.PERF_CLEANUP ?? 60000),
}


export const ErrorConfig = {
  CAPTURE_ERRORS: env.CAPTURE_ERRORS !== 'false',
  MAX_ERROR_HISTORY: parseInt(env.ERROR_MAX_HISTORY ?? 500),
  ERROR_CLEANUP_INTERVAL: parseInt(env.ERROR_CLEANUP ?? 3600000),

  DEBUG_MODE: env.DEBUG === 'true',
  VERBOSE_LOGGING: env.VERBOSE === 'true',
  LOG_NETWORK_MESSAGES: env.LOG_NETWORK === 'true',
}


export const BuilderConfig = {
  SNAP_DEGREES: 5,
  SNAP_DISTANCE: 1,
  PROJECT_MAX: 500,
  TRANSFORM_LIMIT: parseInt(env.BUILDER_TRANSFORM_LIMIT ?? 50),
}


export const NametagConfig = {
  RESOLUTION: parseInt(env.NAMETAG_RESOLUTION ?? 2),
  GRID_COLS: parseInt(env.NAMETAG_GRID_COLS ?? 5),
  GRID_ROWS: parseInt(env.NAMETAG_GRID_ROWS ?? 20),
  WIDTH: parseInt(env.NAMETAG_WIDTH ?? 200),
  HEIGHT: parseInt(env.NAMETAG_HEIGHT ?? 35),
}


export const RenderConfig = {
  ACTION_BATCH_SIZE: parseInt(env.RENDER_ACTION_BATCH ?? 500),
  LOD_BATCH_SIZE: parseInt(env.RENDER_LOD_BATCH ?? 1000),
}


export const WorldConfig = {
  MAX_DELTA_TIME: parseFloat(env.WORLD_MAX_DELTA ?? 1 / 30),
  FIXED_DELTA_TIME: parseFloat(env.WORLD_FIXED_DELTA ?? 1 / 50),
}


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
    builder: BuilderConfig,
    nametag: NametagConfig,
    render: RenderConfig,
    world: WorldConfig,
  }
}


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
