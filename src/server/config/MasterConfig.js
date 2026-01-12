// Unified master configuration: Consolidated from previous MasterConfig, TimeoutConfig, RateLimitConfig
// Environment variables: HYPERFY_* prefix for server config, PHYSICS_*, CHAT_*, etc. for core config
const env = typeof process !== 'undefined' && process.env ? process.env : {}

const MasterConfig = {
  network: {
    requestTimeout: parseInt(env.HYPERFY_NETWORK_REQUEST_TIMEOUT ?? 30000, 10),
    inactivityTimeout: parseInt(env.HYPERFY_NETWORK_INACTIVITY_TIMEOUT ?? 300000, 10),
    databaseQueryTimeout: parseInt(env.HYPERFY_NETWORK_DB_QUERY_TIMEOUT ?? 5000, 10),
    connectionTimeout: parseInt(env.HYPERFY_NETWORK_CONN_TIMEOUT ?? 10000, 10),
    fetchDefaultTimeout: parseInt(env.HYPERFY_NETWORK_FETCH_TIMEOUT ?? 30000, 10),
    aiHealthCheckInterval: parseInt(env.HYPERFY_NETWORK_AI_HEALTH_INTERVAL ?? 30000, 10),
    aiHealthCheckTimeout: parseInt(env.HYPERFY_NETWORK_AI_HEALTH_TIMEOUT ?? 5000, 10),
    deploymentRetryDelay: parseInt(env.HYPERFY_NETWORK_DEPLOYMENT_RETRY ?? 2000, 10),
    wsMaxMessageSize: parseInt(env.HYPERFY_NETWORK_WS_MAX_SIZE ?? 1024 * 1024, 10),
    wsInvalidMessageThreshold: parseInt(env.HYPERFY_NETWORK_WS_INVALID_THRESHOLD ?? 10, 10),
    wsInvalidMessageWindow: parseInt(env.HYPERFY_NETWORK_WS_INVALID_WINDOW ?? 60000, 10),
    wsMessageQueueMax: parseInt(env.HYPERFY_NETWORK_WS_QUEUE_MAX ?? 100, 10),
    inactivityCheckInterval: parseInt(env.HYPERFY_NETWORK_INACTIVITY_CHECK ?? 60000, 10),
    reconnectDelay: parseInt(env.HYPERFY_NETWORK_RECONNECT_DELAY ?? 1000, 10),
    maxReconnectAttempts: parseInt(env.HYPERFY_NETWORK_MAX_RECONNECT ?? 10, 10),
    maxReconnectDelay: parseInt(env.HYPERFY_NETWORK_MAX_RECONNECT_DELAY ?? 30000, 10),
    gracefulShutdown: parseInt(env.HYPERFY_NETWORK_GRACEFUL_SHUTDOWN ?? 30000, 10),
  },

  security: {
    maxScriptSize: parseInt(env.HYPERFY_SECURITY_MAX_SCRIPT ?? 1024 * 1024, 10),
    maxStringLiteral: parseInt(env.HYPERFY_SECURITY_MAX_STRING ?? 100 * 1024, 10),
    maxUrlLength: parseInt(env.HYPERFY_SECURITY_MAX_URL ?? 2048, 10),
    maxPropertyDepth: parseInt(env.HYPERFY_SECURITY_MAX_DEPTH ?? 10, 10),
    maxAdminAttempts: parseInt(env.HYPERFY_SECURITY_MAX_ADMIN_ATTEMPTS ?? 5, 10),
    adminLockoutTime: parseInt(env.HYPERFY_SECURITY_ADMIN_LOCKOUT ?? 300000, 10),
  },

  rateLimits: {
    upload: { max: 10, window: 60000, burst: 1.3, description: 'File upload rate limit' },
    admin: { max: 30, window: 60000, burst: 1.3, description: 'Admin command rate limit' },
    api: { max: 100, window: 60000, burst: 1.3, description: 'General API rate limit' },
    websocket: { max: 5, window: 60000, burst: 1.0, description: 'WebSocket connection rate limit' },
    health: { max: 60, window: 60000, burst: 1.5, description: 'Health check rate limit' },
  },

  uploads: {
    maxFileSize: parseInt(env.HYPERFY_UPLOADS_MAX_FILE ?? 50 * 1024 * 1024, 10),
  },

  avatar: {
    maxFileSize: parseInt(env.HYPERFY_AVATAR_MAX_FILE ?? 50 * 1024 * 1024, 10),
    maxTextureBytes: parseInt(env.HYPERFY_AVATAR_MAX_TEXTURE ?? 32 * 1024 * 1024, 10),
    maxTriangles: parseInt(env.HYPERFY_AVATAR_MAX_TRIANGLES ?? 100000, 10),
  },

  rendering: {
    previewFOV: parseFloat(env.HYPERFY_RENDERING_FOV ?? 70),
    previewAspectRatio: parseFloat(env.HYPERFY_RENDERING_ASPECT ?? 16 / 9),
    previewWidth: parseInt(env.HYPERFY_RENDERING_WIDTH ?? 1080, 10),
    previewHeight: parseInt(env.HYPERFY_RENDERING_HEIGHT ?? 900, 10),
    hdriUrl: env.HYPERFY_RENDERING_HDRI ?? '/day2.hdr',
  },

  maintenance: {
    rateLimitCleanupInterval: parseInt(env.HYPERFY_MAINTENANCE_RATELIMIT_CLEANUP ?? 60000, 10),
    logRotationInterval: parseInt(env.HYPERFY_MAINTENANCE_LOG_ROTATION ?? 86400000, 10),
    cacheWarmerInterval: parseInt(env.HYPERFY_MAINTENANCE_CACHE_WARMER ?? 300000, 10),
  },
}

export default MasterConfig
export { MasterConfig }
