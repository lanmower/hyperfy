export class SnapshotCodec {
  static encode(network) {
    return {
      id: network.id || network.sockets?.size,
      serverTime: performance.now(),
      assetsUrl: network.assetsUrl || process.env.PUBLIC_ASSETS_URL,
      apiUrl: network.apiUrl || process.env.PUBLIC_API_URL,
      maxUploadSize: network.maxUploadSize || process.env.PUBLIC_MAX_UPLOAD_SIZE,
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
      serverTimeOffset: data.serverTime - performance.now(),
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
    network.collections.deserialize(data.collections)
    network.settings.deserialize(data.settings)
    network.settings.setHasAdminCode(data.hasAdminCode)
    network.chat.deserialize(data.chat)
    network.blueprints.deserialize(data.blueprints)
    network.entities.deserialize(data.entities)
    network.livekit?.deserialize(data.livekit)
  }
}
