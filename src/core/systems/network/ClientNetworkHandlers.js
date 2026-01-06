// Event handler callbacks for network snapshot updates and entity changes
import { uuid } from '../../utils.js'
import { storage } from '../../storage.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ClientNetworkHandlers')

export const createClientNetworkHandlers = (network) => ({
  onSnapshot: (data) => {
    network.snapshotProcessor.process(data)
  },

  onSettingsModified: (data) => {
    network.world.settings.set(data.key, data.value)
  },

  onChatAdded: (msg) => {
    network.world.chat.add(msg, false)
  },

  onChatCleared: () => {
    network.world.chat.clear()
  },

  onBlueprintAdded: (blueprint) => {
    network.world.blueprints.add(blueprint)
  },

  onBlueprintModified: (change) => {
    network.world.blueprints.modify(change)
  },

  onEntityAdded: (data) => {
    network.world.entities.add(data)
  },

  onEntityModified: (data) => {
    const entity = network.world.entities.get(data.id)
    if (!entity) {
      logger.error('onEntityModified: entity not found', { id: data.id })
      return
    }
    try {
      entity.modify(data)
    } catch (err) {
      logger.error('Error modifying entity', { id: data.id, error: err.message })
    }
  },

  onEntityEvent: (event) => {
    if (!Array.isArray(event) || event.length < 4) {
      logger.warn('Invalid onEntityEvent data', {
        isArray: Array.isArray(event),
        length: event?.length,
      })
      return
    }
    const [id, version, name, data] = event
    if (typeof id !== 'string' || typeof version !== 'number' || typeof name !== 'string') {
      logger.warn('Invalid onEntityEvent types', {
        idType: typeof id,
        versionType: typeof version,
        nameType: typeof name,
      })
      return
    }
    const entity = network.world.entities.get(id)
    if (!entity) {
      logger.warn('onEntityEvent: entity not found', { id })
      return
    }
    try {
      entity.onEvent(version, name, data)
    } catch (err) {
      logger.error('Error processing entity event', { id, name, error: err.message })
    }
  },

  onEntityRemoved: (id) => {
    network.world.entities.remove(id)
  },

  onPlayerTeleport: (data) => {
    network.world.entities.player?.teleport(data)
  },

  onPlayerPush: (data) => {
    network.world.entities.player?.push(data.force)
  },

  onPlayerSessionAvatar: (data) => {
    network.world.entities.player?.setSessionAvatar(data.avatar)
  },

  onLiveKitLevel: (data) => {
    network.world.livekit.setLevel(data.playerId, data.level)
  },

  onMute: (data) => {
    network.world.livekit.setMuted(data.playerId, data.muted)
  },

  onPong: (time) => {
    network.world.stats?.onPong(time)
  },

  onKick: (code) => {
    network.world.emit('kick', code)
  },

  onClose: (code) => {
    network.world.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: 'You have been disconnected.',
      createdAt: new Date().toISOString(),
    })
    network.world.emit('disconnect', code || true)
    logger.info('Disconnected', { code })
  },
})
