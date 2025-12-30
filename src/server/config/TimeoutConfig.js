// Consolidated: Re-export timeout configuration from MasterConfig
import { MasterConfig } from './MasterConfig.js'

export const TimeoutConfig = {
  websocket: {
    requestTimeout: MasterConfig.network.requestTimeout,
    inactivityTimeout: MasterConfig.network.inactivityTimeout,
    inactivityCheckInterval: MasterConfig.network.inactivityCheckInterval,
    maxReconnectBackoff: MasterConfig.network.maxReconnectDelay,
    messageQueueMax: MasterConfig.network.wsMessageQueueMax,
    maxMessageSize: MasterConfig.network.wsMaxMessageSize,
    invalidMessageThreshold: MasterConfig.network.wsInvalidMessageThreshold,
    invalidMessageWindow: MasterConfig.network.wsInvalidMessageWindow,
  },

  database: {
    queryTimeout: MasterConfig.network.databaseQueryTimeout,
    connectionTimeout: MasterConfig.network.connectionTimeout,
  },

  api: {
    defaultFetchTimeout: MasterConfig.network.fetchDefaultTimeout,
    healthCheckInterval: MasterConfig.network.aiHealthCheckInterval,
  },

  deployment: {
    portConflictRetry: MasterConfig.network.deploymentRetryDelay,
    gracefulShutdown: MasterConfig.network.gracefulShutdown,
  },
}

export default TimeoutConfig
