/**
 * Centralized master configuration for all hardcoded values across Hyperfy
 * Single source of truth for network timeouts, security thresholds, rate limits, and constraints
 * Values organized by concern for easy discovery and modification
 * Environment variable overrides supported via loadFromEnv()
 */

const MasterConfig = {
  /**
   * Network and connection timeouts (milliseconds)
   * Controls WebSocket, fetch, database, and health check intervals
   */
  network: {
    requestTimeout: 30000,               // Standard API request timeout
    inactivityTimeout: 300000,           // WebSocket inactivity before reconnect (5 minutes)
    databaseQueryTimeout: 5000,          // Database query execution timeout
    fetchDefaultTimeout: 30000,          // Default fetch() call timeout
    aiHealthCheckInterval: 30000,        // AI provider health check frequency
    aiHealthCheckTimeout: 5000,          // Health check request timeout
    deploymentRetryDelay: 2000,          // Port conflict retry interval
    wsMaxMessageSize: 1024 * 1024,       // WebSocket single message size limit (1 MB)
    wsInvalidMessageThreshold: 10,       // Invalid messages before disconnection
    wsInvalidMessageWindow: 60000,       // Time window for invalid message tracking (1 minute)
    wsMessageQueueMax: 100,              // Maximum pending messages before dropping
    inactivityCheckInterval: 60000,      // How often to check for inactivity (1 minute)
    reconnectDelay: 1000,                // Initial reconnect delay (exponential backoff)
    maxReconnectAttempts: 10,            // Maximum reconnection attempts before page reload
    maxReconnectDelay: 30000,            // Max delay between reconnection attempts
  },

  /**
   * Security constraints and validation limits
   * Controls script execution, input validation, and property constraints
   */
  security: {
    maxScriptSize: 1024 * 1024,          // Maximum app script size (1 MB)
    maxStringLiteral: 100 * 1024,        // Maximum string literal size in props (100 KB)
    maxUrlLength: 2048,                  // Maximum URL length for validation
    maxPropertyDepth: 10,                // Maximum object nesting depth
    maxAdminAttempts: 5,                 // Failed admin login attempts before lockout
    adminLockoutTime: 300000,            // Admin lockout duration after failed attempts (5 minutes)
  },

  /**
   * Rate limiting configuration
   * Uses token bucket algorithm with burst support
   * window in milliseconds, burst as multiplier (1.0 = no burst)
   */
  rateLimits: {
    upload: {
      max: 10,
      window: 60000,
      burst: 1.3,
      description: 'File upload rate limit',
    },
    admin: {
      max: 30,
      window: 60000,
      burst: 1.3,
      description: 'Admin command rate limit',
    },
    api: {
      max: 100,
      window: 60000,
      burst: 1.3,
      description: 'General API rate limit',
    },
    websocket: {
      max: 5,
      window: 60000,
      burst: 1.0,
      description: 'WebSocket connection rate limit',
    },
    health: {
      max: 60,
      window: 60000,
      burst: 1.5,
      description: 'Health check rate limit',
    },
  },

  /**
   * File upload constraints
   * Controls maximum file sizes for uploads and avatars
   * Sizes in bytes
   */
  uploads: {
    maxFileSize: 50 * 1024 * 1024,       // General upload limit (50 MB)
  },

  /**
   * Avatar constraints
   * Controls avatar file and resource limits
   * Sizes in bytes, triangles as count
   */
  avatar: {
    maxFileSize: 50 * 1024 * 1024,       // Avatar file size limit (50 MB)
    maxTextureBytes: 32 * 1024 * 1024,   // Maximum texture memory (32 MB)
    maxTriangles: 100000,                // Maximum triangle count
  },

  /**
   * Three.js rendering configuration
   * Camera and viewport settings for preview/display
   */
  rendering: {
    previewFOV: 70,                      // Field of view for avatar preview
    previewAspectRatio: 16 / 9,          // Preview camera aspect ratio
    previewWidth: 1080,                  // Preview render width
    previewHeight: 900,                  // Preview render height
    hdriUrl: '/day2.hdr',               // Default HDRI for preview environment
  },

  /**
   * Cleanup and maintenance intervals (milliseconds)
   * Controls periodic cleanup of caches, logs, and expired data
   */
  maintenance: {
    rateLimitCleanupInterval: 60000,     // Rate limit cache cleanup frequency
    logRotationInterval: 86400000,       // Log rotation interval (24 hours)
    cacheWarmerInterval: 300000,         // Cache warmer frequency (5 minutes)
  },

  /**
   * Load configuration values from environment variables
   * Allows runtime override of any config value
   * Usage: MasterConfig.loadFromEnv('HYPERFY_')
   * Sets HYPERFY_NETWORK_REQUEST_TIMEOUT to override network.requestTimeout
   */
  loadFromEnv(prefix = 'HYPERFY_') {
    const env = process.env

    const pathMap = {
      [`${prefix}NETWORK_REQUEST_TIMEOUT`]: 'network.requestTimeout',
      [`${prefix}NETWORK_INACTIVITY_TIMEOUT`]: 'network.inactivityTimeout',
      [`${prefix}NETWORK_DATABASE_QUERY_TIMEOUT`]: 'network.databaseQueryTimeout',
      [`${prefix}NETWORK_FETCH_TIMEOUT`]: 'network.fetchDefaultTimeout',
      [`${prefix}NETWORK_AI_HEALTH_CHECK_INTERVAL`]: 'network.aiHealthCheckInterval',
      [`${prefix}SECURITY_MAX_SCRIPT_SIZE`]: 'security.maxScriptSize',
      [`${prefix}SECURITY_MAX_STRING_LITERAL`]: 'security.maxStringLiteral',
      [`${prefix}SECURITY_MAX_URL_LENGTH`]: 'security.maxUrlLength',
      [`${prefix}SECURITY_MAX_PROPERTY_DEPTH`]: 'security.maxPropertyDepth',
      [`${prefix}UPLOADS_MAX_FILE_SIZE`]: 'uploads.maxFileSize',
      [`${prefix}AVATAR_MAX_FILE_SIZE`]: 'avatar.maxFileSize',
      [`${prefix}AVATAR_MAX_TEXTURE_BYTES`]: 'avatar.maxTextureBytes',
      [`${prefix}AVATAR_MAX_TRIANGLES`]: 'avatar.maxTriangles',
    }

    for (const [envKey, configPath] of Object.entries(pathMap)) {
      if (env[envKey] !== undefined) {
        const value = isNaN(env[envKey]) ? env[envKey] : parseInt(env[envKey], 10)
        setNestedValue(this, configPath, value)
      }
    }

    return this
  },
}

/**
 * Helper function to set nested object values
 * Used by loadFromEnv() to set values in nested config paths
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

export default MasterConfig
export { MasterConfig }
