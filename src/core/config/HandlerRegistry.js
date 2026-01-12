
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('HandlerRegistry')

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
  'clientError': 'onClientError',
  'clientLogs': 'onClientLogs',
  'mcpSubscribeErrors': 'onMcpSubscribeErrors',
  'getErrors': 'onGetErrors',
  'clearErrors': 'onClearErrors',
  'fileUpload': 'onFileUpload',
  'fileUploadCheck': 'onFileUploadCheck',
  'fileUploadStats': 'onFileUploadStats',
  'disconnect': 'onDisconnect',
}


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


export const serverLoaderHandlers = {
  'model': 'handleModel',
  'script': 'handleScript',
  'video': 'handleVideo',
  'image': 'handleImage',
  'audio': 'handleAudio',
}


export function createHandlerMap(handlerNames, instance) {
  const handlers = {}
  for (const [name, methodName] of Object.entries(handlerNames)) {
    const method = instance[methodName]
    if (!method) {
      logger.warn('Handler method not found', { methodName })
      continue
    }
    handlers[name] = method.bind(instance)
  }
  return handlers
}
