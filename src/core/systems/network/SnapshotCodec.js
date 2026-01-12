export class SnapshotCodec {
  static encode(network) {
    const env = typeof process !== 'undefined' && process.env ? process.env : {}
    return {
      id: network.id || network.sockets?.size,
      serverTime: performance.now(),
      assetsUrl: network.assetsUrl || env.PUBLIC_ASSETS_URL,
      apiUrl: network.apiUrl || env.PUBLIC_API_URL,
      maxUploadSize: network.maxUploadSize || env.PUBLIC_MAX_UPLOAD_SIZE,
      collections: network.collections.serialize(),
      settings: network.settings.serialize(),
      chat: network.chat.serialize(),
      blueprints: network.blueprints.serialize(),
      entities: network.entities.serialize(),
    }
  }

  static decode(data, network) {
    return {
      id: data.id,
      serverTime: data.serverTime,
      apiUrl: data.apiUrl,
      maxUploadSize: data.maxUploadSize,
      assetsUrl: data.assetsUrl,
      collections: data.collections,
      settings: data.settings,
      chat: data.chat,
      blueprints: data.blueprints,
      entities: data.entities,
      livekit: data.livekit,
      authToken: data.authToken,
      hasAdminCode: data.hasAdminCode,
    }
  }

  static deserializeState(data, network) {
    // Deserialize in dependency order to ensure references exist
    // Collections must come first as settings may reference collections
    network.collections.deserialize(data.collections)
    network.settings.deserialize(data.settings)
    network.settings.setHasAdminCode(data.hasAdminCode)
    network.chat.deserialize(data.chat)
    // Blueprints must come before entities as entities reference blueprints
    network.blueprints.deserialize(data.blueprints)
    network.entities.deserialize(data.entities)
    network.livekit?.deserialize(data.livekit)
  }
}
