/**
 * Unified Event Topics
 *
 * Defines all event types that can be emitted throughout the Hyperfy system.
 * This serves as a single source of truth for event names and prevents typos.
 *
 * Events are categorized by domain:
 * - System: Core runtime and lifecycle events
 * - World: World/environment events
 * - Entity: Entity lifecycle events
 * - Player: Player-specific events
 * - Network: Network communication events
 * - App: Application runtime events
 * - Error: Error tracking and monitoring
 * - UI: User interface events
 */

export const EventTopics = {
  System: {
    READY: 'system:ready',
    SHUTDOWN: 'system:shutdown',
    UPDATE: 'system:update',
    TICK: 'system:tick',
  },

  World: {
    LOADED: 'world:loaded',
    UNLOADED: 'world:unloaded',
    SETTINGS_CHANGED: 'world:settingsChanged',
    SPAWN_POINT_CHANGED: 'world:spawnPointChanged',
  },

  Entity: {
    ADDED: 'entity:added',
    REMOVED: 'entity:removed',
    MODIFIED: 'entity:modified',
    EVENT: 'entity:event',
    ACTIVATED: 'entity:activated',
    DEACTIVATED: 'entity:deactivated',
  },

  Player: {
    JOINED: 'player:joined',
    LEFT: 'player:left',
    TELEPORTED: 'player:teleported',
    PUSHED: 'player:pushed',
    AVATAR_CHANGED: 'player:avatarChanged',
    HEALTH_CHANGED: 'player:healthChanged',
    CHAT_MESSAGE: 'player:chatMessage',
  },

  Network: {
    CONNECTED: 'network:connected',
    DISCONNECTED: 'network:disconnected',
    MESSAGE_SENT: 'network:messageSent',
    MESSAGE_RECEIVED: 'network:messageReceived',
    PING: 'network:ping',
    KICKED: 'network:kicked',
    HOT_RELOAD: 'network:hotReload',
  },

  App: {
    CREATED: 'app:created',
    DESTROYED: 'app:destroyed',
    SCRIPT_LOADED: 'app:scriptLoaded',
    SCRIPT_ERROR: 'app:scriptError',
    PLAYER_ENTER: 'app:playerEnter',
    PLAYER_LEAVE: 'app:playerLeave',
    CUSTOM: 'app:custom', // For custom app-emitted events
  },

  Blueprint: {
    ADDED: 'blueprint:added',
    MODIFIED: 'blueprint:modified',
    REMOVED: 'blueprint:removed',
  },

  Chat: {
    MESSAGE_ADDED: 'chat:messageAdded',
    MESSAGE_CLEARED: 'chat:messageCleared',
  },

  Error: {
    OCCURRED: 'error:occurred',
    CLEARED: 'error:cleared',
    REPORTED: 'error:reported',
  },

  Admin: {
    RANK_MODIFIED: 'admin:rankModified',
    MUTED: 'admin:muted',
    COMMAND_EXECUTED: 'admin:commandExecuted',
  },

  UI: {
    PROGRESS: 'ui:progress',
    LOADING: 'ui:loading',
    READY: 'ui:ready',
  },

  Persistence: {
    SAVE_START: 'persistence:saveStart',
    SAVE_COMPLETE: 'persistence:saveComplete',
    LOAD_START: 'persistence:loadStart',
    LOAD_COMPLETE: 'persistence:loadComplete',
  },
}

export const eventTopicStrings = new Set()

function registerTopics(obj) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      eventTopicStrings.add(value)
    } else if (typeof value === 'object') {
      registerTopics(value)
    }
  }
}

registerTopics(EventTopics)

/**
 * Validate that an event topic is registered
 * @param {string} topic - The event topic to validate
 * @returns {boolean} True if the topic is registered
 */
export function isValidEventTopic(topic) {
  return eventTopicStrings.has(topic)
}

/**
 * Create a custom app event topic
 * @param {string} appId - The app ID
 * @param {string} eventName - The custom event name
 * @returns {string} The full event topic string
 */
export function createAppEventTopic(appId, eventName) {
  return `app:${appId}:${eventName}`
}
