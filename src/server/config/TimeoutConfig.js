export const TimeoutConfig = {
  websocket: {
    requestTimeout: 30000,
    inactivityTimeout: 300000,
    inactivityCheckInterval: 60000,
    maxReconnectBackoff: 30000,
    messageQueueMax: 100,
    maxMessageSize: 1024 * 1024,
    invalidMessageThreshold: 10,
    invalidMessageWindow: 60000,
  },

  database: {
    queryTimeout: 5000,
    connectionTimeout: 10000,
  },

  api: {
    defaultFetchTimeout: 10000,
    healthCheckInterval: 30000,
  },

  deployment: {
    portConflictRetry: 2000,
    gracefulShutdown: 30000,
  },
}

export default TimeoutConfig
