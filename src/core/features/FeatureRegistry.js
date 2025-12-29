import { featureManager } from './FeatureManager.js'

export class FeatureRegistry {
  static initializeDefaults() {
    featureManager.register('vr_support', {
      enabled: true,
      description: 'VR headset support',
      owner: 'xr_team',
      rolloutPercentage: 100
    })

    featureManager.register('physics_v2', {
      enabled: true,
      description: 'Physics engine v2',
      owner: 'physics_team',
      rolloutPercentage: 100
    })

    featureManager.register('network_compression', {
      enabled: true,
      description: 'Network message compression',
      owner: 'network_team',
      rolloutPercentage: 100
    })

    featureManager.register('advanced_avatar', {
      enabled: true,
      description: 'Advanced avatar system',
      owner: 'avatar_team',
      rolloutPercentage: 80,
      metadata: { maxBones: 256 }
    })

    featureManager.register('live_chat', {
      enabled: true,
      description: 'Real-time chat system',
      owner: 'communication_team',
      rolloutPercentage: 100,
      dependencies: ['network_compression']
    })

    featureManager.register('spatial_audio', {
      enabled: true,
      description: 'Spatial audio processing',
      owner: 'audio_team',
      rolloutPercentage: 90
    })

    featureManager.register('performance_monitoring', {
      enabled: true,
      description: 'Runtime performance monitoring',
      owner: 'platform_team',
      rolloutPercentage: 100
    })

    featureManager.register('ai_agents', {
      enabled: false,
      description: 'AI-controlled agents',
      owner: 'ai_team',
      rolloutPercentage: 0
    })

    featureManager.register('blockchain_integration', {
      enabled: false,
      description: 'Blockchain features',
      owner: 'blockchain_team',
      rolloutPercentage: 0
    })

    featureManager.register('nft_support', {
      enabled: false,
      description: 'NFT support',
      owner: 'blockchain_team',
      rolloutPercentage: 0,
      dependencies: ['blockchain_integration']
    })

    featureManager.register('marketplace', {
      enabled: false,
      description: 'In-world marketplace',
      owner: 'commerce_team',
      rolloutPercentage: 25
    })

    featureManager.register('guilds', {
      enabled: false,
      description: 'Guild system',
      owner: 'social_team',
      rolloutPercentage: 0
    })

    featureManager.register('voice_chat', {
      enabled: true,
      description: 'Voice communication',
      owner: 'communication_team',
      rolloutPercentage: 100
    })

    featureManager.register('spectator_mode', {
      enabled: true,
      description: 'Spectator/observation mode',
      owner: 'ux_team',
      rolloutPercentage: 100
    })

    featureManager.register('particle_effects', {
      enabled: true,
      description: 'Advanced particle effects',
      owner: 'graphics_team',
      rolloutPercentage: 100
    })
  }

  static getFeatureConfig(name) {
    const flag = featureManager.get(name)
    if (!flag) {
      return null
    }
    return flag.getStatus()
  }

  static isFeatureEnabled(name, context = {}) {
    return featureManager.isEnabled(name, context)
  }

  static createFeatureContext(userId, sessionId = null, customContext = {}) {
    return {
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      ...customContext
    }
  }
}
