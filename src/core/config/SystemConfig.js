import {
  PhysicsConfig,
  RenderingConfig,
  NetworkConfig,
  InputConfig,
  AvatarConfig,
  ChatConfig,
  AudioConfig,
  PerformanceConfig,
  ErrorConfig,
  BuilderConfig,
  NametagConfig,
  RenderConfig,
  WorldConfig
} from './SystemConfigDefaults.js'

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

export {
  PhysicsConfig,
  RenderingConfig,
  NetworkConfig,
  InputConfig,
  AvatarConfig,
  ChatConfig,
  AudioConfig,
  PerformanceConfig,
  ErrorConfig,
  BuilderConfig,
  NametagConfig,
  RenderConfig,
  WorldConfig
}
