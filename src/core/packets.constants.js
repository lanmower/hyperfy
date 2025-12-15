// Packet type constants - eliminates magic strings

export const PacketTypes = {
  SNAPSHOT: 'snapshot',
  COMMAND: 'command',
  CHAT_ADDED: 'chatAdded',
  CHAT_CLEARED: 'chatCleared',
  BLUEPRINT_ADDED: 'blueprintAdded',
  BLUEPRINT_MODIFIED: 'blueprintModified',
  ENTITY_ADDED: 'entityAdded',
  ENTITY_MODIFIED: 'entityModified',
  ENTITY_EVENT: 'entityEvent',
  ENTITY_REMOVED: 'entityRemoved',
  PLAYER_TELEPORT: 'playerTeleport',
  PLAYER_PUSH: 'playerPush',
  PLAYER_SESSION_AVATAR: 'playerSessionAvatar',
  LIVEKIT_LEVEL: 'liveKitLevel',
  MUTE: 'mute',
  SETTINGS_MODIFIED: 'settingsModified',
  SPAWN_MODIFIED: 'spawnModified',
  MODIFY_RANK: 'modifyRank',
  KICK: 'kick',
  PING: 'ping',
  PONG: 'pong',
  ERROR_REPORT: 'errorReport',
  ERROR_EVENT: 'errorEvent',
  GET_ERRORS: 'getErrors',
  CLEAR_ERRORS: 'clearErrors',
  ERRORS: 'errors',
  MCP_SUBSCRIBE_ERRORS: 'mcpSubscribeErrors',
  MCP_ERROR_EVENT: 'mcpErrorEvent',
  HOT_RELOAD: 'hotReload',
}

// Reverse mapping for validation
export const PACKET_NAMES = Object.values(PacketTypes)
