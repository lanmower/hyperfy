/**
 * Consolidated Handler Registry
 *
 * Centralizes all message and type handlers for Network and Loader systems.
 * Eliminates duplication of handler definitions across multiple files.
 *
 * This is used by:
 * - ClientNetwork / ServerNetwork (message handlers)
 * - ClientLoader / ServerLoader (type handlers)
 */

/**
 * Message handlers for ClientNetwork
 * Maps message type -> handler method
 */
export const clientNetworkHandlers = {
  'snapshot': 'onSnapshot',
  'settingsModified': 'onSettingsModified',
  'chatAdded': 'onChatAdded',
  'chatCleared': 'onChatCleared',
  'blueprintAdded': 'onBlueprintAdded',
  'blueprintModified': 'onBlueprintModified',
  'entityAdded': 'onEntityAdded',
  'entityModified': 'onEntityModified',
  'entityEvent': 'onEntityEvent',
  'entityRemoved': 'onEntityRemoved',
  'playerTeleport': 'onPlayerTeleport',
  'playerPush': 'onPlayerPush',
  'playerSessionAvatar': 'onPlayerSessionAvatar',
  'liveKitLevel': 'onLiveKitLevel',
  'mute': 'onMute',
  'pong': 'onPong',
  'kick': 'onKick',
  'hotReload': 'onHotReload',
  'errors': 'onErrors',
}

/**
 * Message handlers for ServerNetwork
 * Maps message type -> handler method
 */
export const serverNetworkHandlers = {
  'chatAdded': 'onChatAdded',
  'command': 'onCommand',
  'modifyRank': 'onModifyRank',
  'kick': 'onKick',
  'mute': 'onMute',
  'blueprintAdded': 'onBlueprintAdded',
  'blueprintModified': 'onBlueprintModified',
  'entityAdded': 'onEntityAdded',
  'entityModified': 'onEntityModified',
  'entityEvent': 'onEntityEvent',
  'entityRemoved': 'onEntityRemoved',
  'settingsModified': 'onSettingsModified',
  'spawnModified': 'onSpawnModified',
  'playerTeleport': 'onPlayerTeleport',
  'playerPush': 'onPlayerPush',
  'playerSessionAvatar': 'onPlayerSessionAvatar',
  'ping': 'onPing',
  'errorEvent': 'onErrorEvent',
  'errorReport': 'onErrorReport',
  'mcpSubscribeErrors': 'onMcpSubscribeErrors',
  'getErrors': 'onGetErrors',
  'clearErrors': 'onClearErrors',
  'fileUpload': 'onFileUpload',
  'fileUploadCheck': 'onFileUploadCheck',
  'fileUploadStats': 'onFileUploadStats',
  'disconnect': 'onDisconnect',
}

/**
 * Asset type handlers for ClientLoader
 * Maps asset type -> handler method name
 */
export const clientLoaderHandlers = {
  'video': 'handleVideo',
  'hdr': 'handleHDR',
  'image': 'handleImage',
  'texture': 'handleTexture',
  'model': 'handleModel',
  'emote': 'handleEmote',
  'avatar': 'handleAvatar',
  'script': 'handleScript',
  'audio': 'handleAudio',
}

/**
 * Asset type handlers for ServerLoader
 * Maps asset type -> handler method name
 */
export const serverLoaderHandlers = {
  'model': 'handleModel',
  'script': 'handleScript',
  'video': 'handleVideo',
  'image': 'handleImage',
  'audio': 'handleAudio',
}

/**
 * Convert handler name mappings to bound handler objects
 * Returns object mapping handler name -> bound handler function
 *
 * @param {Object} handlerNames - Map of name -> method name
 * @param {Object} instance - Instance to bind handlers to
 * @returns {Object} Map of name -> bound handler function
 */
export function createHandlerMap(handlerNames, instance) {
  const handlers = {}
  for (const [name, methodName] of Object.entries(handlerNames)) {
    const method = instance[methodName]
    if (!method) {
      console.warn(`Handler method not found: ${methodName}`)
      continue
    }
    handlers[name] = method.bind(instance)
  }
  return handlers
}
