export const TimeoutConfig = {
  websocket: {
    maxMessageSize: 16 * 1024 * 1024,
    invalidMessageWindow: 60000,
    invalidMessageThreshold: 100,
    inactivityTimeout: 30000,
    inactivityCheckInterval: 5000,
    maxReconnectBackoff: 30000,
    messageQueueMax: 1000,
  },
}

export default TimeoutConfig
