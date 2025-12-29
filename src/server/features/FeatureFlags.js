import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FeatureFlags')
const flags = new Map()
const rolloutPercentages = new Map()
const flagHistory = new Map()

const DEFAULT_FLAGS = {
  newPhysics: { enabled: false, rollout: 0, description: 'Enable experimental physics engine' },
  advancedGraphics: { enabled: false, rollout: 0, description: 'Enable advanced graphics features' },
  betaFeatures: { enabled: false, rollout: 0, description: 'Enable beta features' },
  maintenanceMode: { enabled: false, rollout: 0, description: 'Enable maintenance mode' },
  enhancedShadows: { enabled: false, rollout: 0, description: 'Enable enhanced shadow rendering' },
  spatialAudio: { enabled: false, rollout: 0, description: 'Enable spatial audio processing' },
  asyncLoading: { enabled: true, rollout: 100, description: 'Enable async asset loading' },
  debugMode: { enabled: false, rollout: 0, description: 'Enable debug mode' },
}

function initializeFlags() {
  for (const [key, config] of Object.entries(DEFAULT_FLAGS)) {
    const envKey = `FEATURE_${key.toUpperCase()}`
    const envValue = process.env[envKey]

    const enabled = envValue === 'true' ? true : envValue === 'false' ? false : config.enabled
    const rollout = config.rollout

    flags.set(key, {
      enabled,
      rollout,
      description: config.description,
      lastModified: new Date().toISOString(),
      modifiedBy: 'system',
    })

    rolloutPercentages.set(key, rollout)
    flagHistory.set(key, [{
      timestamp: new Date().toISOString(),
      enabled,
      rollout,
      modifiedBy: 'system',
      reason: 'initialization',
    }])
  }
}

initializeFlags()

function hashUserId(userId) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function isFeatureEnabled(flagName, userId = null) {
  const flag = flags.get(flagName)
  if (!flag) {
    return false
  }

  if (!flag.enabled) {
    return false
  }

  if (flag.rollout === 100) {
    return true
  }

  if (flag.rollout === 0) {
    return false
  }

  if (!userId) {
    return false
  }

  const hash = hashUserId(userId)
  const bucket = hash % 100
  return bucket < flag.rollout
}

export function toggleFeature(flagName, enabled, modifiedBy = 'admin') {
  if (!flags.has(flagName)) {
    return { success: false, error: 'Flag does not exist' }
  }

  const flag = flags.get(flagName)
  const previousState = { ...flag }

  flag.enabled = enabled
  flag.lastModified = new Date().toISOString()
  flag.modifiedBy = modifiedBy

  const history = flagHistory.get(flagName) || []
  history.push({
    timestamp: flag.lastModified,
    enabled,
    rollout: flag.rollout,
    modifiedBy,
    reason: 'manual toggle',
    previousState,
  })
  flagHistory.set(flagName, history)

  logger.info('Feature flag toggled', { flagName, enabled, modifiedBy })

  return { success: true, flag }
}

export function setRollout(flagName, percentage, modifiedBy = 'admin') {
  if (!flags.has(flagName)) {
    return { success: false, error: 'Flag does not exist' }
  }

  if (percentage < 0 || percentage > 100) {
    return { success: false, error: 'Rollout percentage must be between 0 and 100' }
  }

  const flag = flags.get(flagName)
  const previousState = { ...flag }

  flag.rollout = percentage
  flag.lastModified = new Date().toISOString()
  flag.modifiedBy = modifiedBy

  rolloutPercentages.set(flagName, percentage)

  const history = flagHistory.get(flagName) || []
  history.push({
    timestamp: flag.lastModified,
    enabled: flag.enabled,
    rollout: percentage,
    modifiedBy,
    reason: 'rollout change',
    previousState,
  })
  flagHistory.set(flagName, history)

  logger.info('Feature flag rollout changed', { flagName, percentage, modifiedBy })

  return { success: true, flag }
}

export function createFeature(flagName, description, enabled = false, rollout = 0, modifiedBy = 'admin') {
  if (flags.has(flagName)) {
    return { success: false, error: 'Flag already exists' }
  }

  const flag = {
    enabled,
    rollout,
    description,
    lastModified: new Date().toISOString(),
    modifiedBy,
  }

  flags.set(flagName, flag)
  rolloutPercentages.set(flagName, rollout)
  flagHistory.set(flagName, [{
    timestamp: flag.lastModified,
    enabled,
    rollout,
    modifiedBy,
    reason: 'creation',
  }])

  logger.info('Feature flag created', { flagName, description, enabled, rollout, modifiedBy })

  return { success: true, flag }
}

export function deleteFeature(flagName, modifiedBy = 'admin') {
  if (DEFAULT_FLAGS[flagName]) {
    return { success: false, error: 'Cannot delete default flags' }
  }

  if (!flags.has(flagName)) {
    return { success: false, error: 'Flag does not exist' }
  }

  flags.delete(flagName)
  rolloutPercentages.delete(flagName)
  flagHistory.delete(flagName)

  logger.info('Feature flag deleted', { flagName, modifiedBy })

  return { success: true }
}

export function getAllFlags() {
  const result = {}
  for (const [key, value] of flags.entries()) {
    result[key] = { ...value }
  }
  return result
}

export function getFlag(flagName) {
  return flags.get(flagName) || null
}

export function getFlagHistory(flagName) {
  return flagHistory.get(flagName) || []
}

export function getUserVariant(flagName, userId) {
  const flag = flags.get(flagName)
  if (!flag) {
    return { enabled: false, variant: 'control', reason: 'flag not found' }
  }

  if (!flag.enabled) {
    return { enabled: false, variant: 'control', reason: 'flag disabled' }
  }

  if (flag.rollout === 100) {
    return { enabled: true, variant: 'treatment', reason: 'full rollout' }
  }

  if (flag.rollout === 0) {
    return { enabled: false, variant: 'control', reason: 'no rollout' }
  }

  const hash = hashUserId(userId)
  const bucket = hash % 100
  const enabled = bucket < flag.rollout

  return {
    enabled,
    variant: enabled ? 'treatment' : 'control',
    bucket,
    rollout: flag.rollout,
    reason: 'A/B test assignment',
  }
}

export function getStats() {
  return {
    totalFlags: flags.size,
    enabledFlags: Array.from(flags.values()).filter(f => f.enabled).length,
    disabledFlags: Array.from(flags.values()).filter(f => !f.enabled).length,
    flagsWithRollout: Array.from(flags.values()).filter(f => f.rollout > 0 && f.rollout < 100).length,
  }
}
