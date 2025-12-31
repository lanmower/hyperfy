import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ClientPacketHandlers')

export class ClientPacketHandlers {
  constructor(network) {
    this.network = network
  }

  handleSettingsModified(data) {
    this.network.settings.set(data.key, data.value)
  }

  handleChatAdded(msg) {
    this.network.chat.add(msg, false)
  }

  handleChatCleared() {
    this.network.chat.clear()
  }

  handleBlueprintAdded(blueprint) {
    this.network.blueprints.add(blueprint)
  }

  handleBlueprintModified(change) {
    this.network.blueprints.modify(change)
  }

  handleEntityAdded(data) {
    this.network.entities.add(data)
  }

  handleEntityModified(data) {
    const entity = this.network.entities.get(data.id)
    if (!entity) {
      logger.error('Entity not found for modification', { entityId: data.id })
      return
    }
    entity.modify(data)
  }

  handleEntityEvent(event) {
    const [id, version, name, data] = event
    const entity = this.network.entities.get(id)
    entity?.onEvent(version, name, data)
  }

  handleEntityRemoved(id) {
    this.network.entities.remove(id)
  }

  handlePlayerTeleport(data) {
    this.network.entities.player?.teleport(data)
  }

  handlePlayerPush(data) {
    this.network.entities.player?.push(data.force)
  }

  handlePlayerSessionAvatar(data) {
    this.network.entities.player?.setSessionAvatar(data.avatar)
  }

  handleLiveKitLevel(data) {
    this.network.livekit.setLevel(data.playerId, data.level)
  }

  handleMute(data) {
    this.network.livekit.setMuted(data.playerId, data.muted)
  }

  handlePong(time) {
    this.network.stats?.onPong(time)
  }

  handleKick(code) {
    this.network.events.emit('kick', code)
  }

  handleHotReload(data) {
    logger.info('Hot reload triggered', {})
    location.reload()
  }

  handleErrors(data) {
    this.network.events.emit('errors', data)
  }
}
