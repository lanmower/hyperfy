export const ServerConstants = {
  DEPLOYMENT: {
    PORT_CONFLICT_RETRY: 2000,
    GRACEFUL_SHUTDOWN_TIMEOUT: 30000,
    HEALTH_CHECK_INTERVAL: 30000,
    READY_TIMEOUT: 10000,
  },

  DATABASE: {
    QUERY_TIMEOUT: 5000,
    CONNECTION_TIMEOUT: 10000,
    CONNECTION_MAX_RETRIES: 3,
    POOL_SIZE_MIN: 2,
    POOL_SIZE_MAX: 10,
    IDLE_TIMEOUT: 30000,
  },

  API: {
    DEFAULT_FETCH_TIMEOUT: 10000,
    MAX_REQUEST_SIZE: 10 * 1024 * 1024,
    MAX_UPLOAD_SIZE: 100 * 1024 * 1024,
    COMPRESSION_THRESHOLD: 1024,
  },

  SESSIONS: {
    TIMEOUT: 1800000,
    EXTENSION_THRESHOLD: 900000,
    CHECK_INTERVAL: 60000,
  },

  RATE_LIMITING: {
    ENABLED: true,
    WINDOW_MS: 60000,
    MAX_REQUESTS: 1000,
    ERROR_REQUESTS_MAX: 30,
    ERROR_REQUESTS_WINDOW: 60000,
  },

  AUTHENTICATION: {
    JWT_EXPIRY: 3600000,
    REFRESH_TOKEN_EXPIRY: 86400000,
    SESSION_CHECK_INTERVAL: 300000,
  },

  LOGGING: {
    MAX_LOG_SIZE: 10 * 1024 * 1024,
    MAX_LOG_FILES: 10,
    LOG_RETENTION_DAYS: 30,
    REQUEST_LOG_SAMPLE_RATE: 0.1,
    REQUEST_ID_LENGTH: 12,
  },

  MONITORING: {
    ERROR_SAMPLE_RATE_PROD: 0.5,
    ERROR_SAMPLE_RATE_DEV: 1.0,
    METRICS_FLUSH_INTERVAL: 60000,
    MAX_ERROR_BUFFER: 1000,
  },

  PERFORMANCE: {
    SLOW_QUERY_THRESHOLD: 1000,
    SLOW_REQUEST_THRESHOLD: 5000,
    MEMORY_CHECK_INTERVAL: 60000,
    MEMORY_LIMIT_WARNING: 0.85,
    MEMORY_LIMIT_CRITICAL: 0.95,
  },

  NETWORKING: {
    BACKLOG: 511,
    TCP_NODELAY: true,
    KEEP_ALIVE: true,
    KEEP_ALIVE_INITIAL_DELAY: 60,
  },

  FEATURE_FLAGS: {
    ENABLE_COMPRESSION: true,
    ENABLE_CACHING: true,
    ENABLE_CLUSTERING: false,
    ENABLE_RATE_LIMITING: true,
    ENABLE_REQUEST_LOGGING: true,
  },

  ERRORS: {
    CAPTURE_BREADCRUMBS: true,
    BREADCRUMB_LIMIT: 100,
    STACK_TRACE_LIMIT: 10,
    INCLUDE_LOCAL_VARIABLES: false,
  },

  DEFAULTS: {
    TIMEZONE: 'UTC',
    LOCALE: 'en-US',
    CHARSET: 'utf-8',
  },

  AI_PROVIDERS: {
    openai: {
      apiEndpoint: 'https://api.openai.com/v1',
      healthCheckEndpoint: 'https://api.openai.com/v1/models',
      timeout: 30000,
      retryAttempts: 3,
    },
    anthropic: {
      apiEndpoint: 'https://api.anthropic.com',
      healthCheckEndpoint: 'https://api.anthropic.com/v1/messages',
      timeout: 30000,
      retryAttempts: 3,
    },
    xai: {
      apiEndpoint: 'https://api.x.ai/v1',
      healthCheckEndpoint: 'https://api.x.ai/v1/models',
      timeout: 30000,
      retryAttempts: 3,
    },
    google: {
      apiEndpoint: 'https://generativelanguage.googleapis.com',
      healthCheckEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
      timeout: 30000,
      retryAttempts: 3,
    },
  },

  AI_HEALTH_CHECK: {
    interval: 30000,
    timeout: 5000,
    maxRetries: 3,
    circuitBreakerThreshold: 5,
  },
}
