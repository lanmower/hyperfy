import moment from 'moment'
import { emoteUrls } from '../extras/playerEmotes.js'
import { readPacket, writePacket } from '../packets.js'
import { storage } from '../storage.js'
import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'

/**
 * Client Network System
 *
 * - runs on the client
 * - provides abstract network methods matching ServerNetwork
 *
 */
export class ClientNetwork extends BaseNetwork {
  // DI Service Constants
  static DEPS = {
    loader: 'loader',
    entities: 'entities',
    chat: 'chat',
    settings: 'settings',
    livekit: 'livekit',
    events: 'events',
    blueprints: 'blueprints',
    environment: 'environment',
    stats: 'stats',
    collections: 'collections',
  }

  constructor(world) {
    super(world, clientNetworkHandlers)
    this.ws = null
    this.apiUrl = null
    this.id = null
    this.isClient = true
    this.serverTimeOffset = 0
    this.protocol.isClient = true
    this.protocol.flushTarget = this
    // Utility reference
    this.assetsUrl = world.assetsUrl
  }

  // DI Property Getters
  get loader() { return this.getService(ClientNetwork.DEPS.loader) }
  get entities() { return this.getService(ClientNetwork.DEPS.entities) }
  get chat() { return this.getService(ClientNetwork.DEPS.chat) }
  get settings() { return this.getService(ClientNetwork.DEPS.settings) }
  get livekit() { return this.getService(ClientNetwork.DEPS.livekit) }
  get events() { return this.getService(ClientNetwork.DEPS.events) }
  get blueprints() { return this.getService(ClientNetwork.DEPS.blueprints) }
  get environment() { return this.getService(ClientNetwork.DEPS.environment) }
  get stats() { return this.getService(ClientNetwork.DEPS.stats) }
  get collections() { return this.getService(ClientNetwork.DEPS.collections) }

  init({ wsUrl, name, avatar }) {
    const authToken = storage.get('authToken')
    let url = `${wsUrl}?authToken=${authToken}`
    if (name) url += `&name=${encodeURIComponent(name)}`
    if (avatar) url += `&avatar=${encodeURIComponent(avatar)}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.ws.addEventListener('message', this.onPacket)
    this.ws.addEventListener('close', this.onClose)
    this.protocol.isConnected = true
  }

  send(name, data) {
    const ignore = ['ping']
    if (!ignore.includes(name) && data.id != this.id) {
      console.log('->', name, data)
    }
    const packet = writePacket(name, data)
    this.ws.send(packet)
  }

  async upload(file) {
    {
      // first check if we even need to upload it
      const hash = await hashFile(file)
      const ext = file.name.split('.').pop().toLowerCase()
      const filename = `${hash}.${ext}`
      const url = `${this.apiUrl}/upload-check?filename=${filename}`
      const resp = await fetch(url)
      const data = await resp.json()
      if (data.exists) return // console.log('already uploaded:', filename)
    }
    // then upload it
    const form = new FormData()
    form.append('file', file)
    const url = `${this.apiUrl}/upload`
    await fetch(url, {
      method: 'POST',
      body: form,
    })
  }

  enqueue(method, data) {
    this.protocol.enqueue(method, data)
  }

  getTime() {
    return (performance.now() + this.serverTimeOffset) / 1000
  }

  onPacket = e => {
    this.protocol.processPacket(e.data)
  }

  onSnapshot(data) {
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.assetsUrl = data.assetsUrl

    // preload environment model and avatar
    // if (this.environment.base) {
    //   this.loader.preload('model', this.environment.base.model)
    // }
    if (data.settings.avatar) {
      this.loader.preload('avatar', data.settings.avatar.url)
    }
    // preload some blueprints
    for (const item of data.blueprints) {
      if (item.preload && !item.disabled) {
        if (item.model) {
          const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
          this.loader.preload(type, item.model)
        }
        if (item.script) {
          this.loader.preload('script', item.script)
        }
        for (const value of Object.values(item.props || {})) {
          if (value === undefined || value === null || !value?.url || !value?.type) continue
          this.loader.preload(value.type, value.url)
        }
      }
    }
    // preload emotes
    for (const url of emoteUrls) {
      this.loader.preload('emote', url)
    }
    // preload local player avatar
    for (const item of data.entities) {
      if (item.type === 'player' && item.userId === this.id) {
        const url = item.sessionAvatar || item.avatar
        this.loader.preload('avatar', url)
      }
    }
    this.loader.execPreload()

    this.collections.deserialize(data.collections)
    this.settings.deserialize(data.settings)
    this.settings.setHasAdminCode(data.hasAdminCode)
    this.chat.deserialize(data.chat)
    this.blueprints.deserialize(data.blueprints)
    this.entities.deserialize(data.entities)
    this.livekit?.deserialize(data.livekit)
    storage.set('authToken', data.authToken)
  }

  onSettingsModified = data => {
    this.settings.set(data.key, data.value)
  }

  onChatAdded = msg => {
    this.chat.add(msg, false)
  }

  onChatCleared = () => {
    this.chat.clear()
  }

  onBlueprintAdded = blueprint => {
    this.blueprints.add(blueprint)
  }

  onBlueprintModified = change => {
    this.blueprints.modify(change)
  }

  onEntityAdded = data => {
    this.entities.add(data)
  }

  onEntityModified = data => {
    const entity = this.entities.get(data.id)
    if (!entity) return console.error('onEntityModified: no entity found', data)
    entity.modify(data)
  }

  onEntityEvent = event => {
    const [id, version, name, data] = event
    const entity = this.entities.get(id)
    entity?.onEvent(version, name, data)
  }

  onEntityRemoved = id => {
    this.entities.remove(id)
  }

  onPlayerTeleport = data => {
    this.entities.player?.teleport(data)
  }

  onPlayerPush = data => {
    this.entities.player?.push(data.force)
  }

  onPlayerSessionAvatar = data => {
    this.entities.player?.setSessionAvatar(data.avatar)
  }

  onLiveKitLevel = data => {
    this.livekit.setLevel(data.playerId, data.level)
  }

  onMute = data => {
    this.livekit.setMuted(data.playerId, data.muted)
  }

  onPong = time => {
    this.stats?.onPong(time)
  }

  onKick = code => {
    this.events.emit('kick', code)
  }

  onHotReload = data => {
    console.log('[HMR] Reloading...')
    location.reload()
  }

  onErrors = (data) => {
    // Received error data from server
    this.events.emit('errors', data)
  }

  // Helper method to request errors from server
  requestErrors(options = {}) {
    this.send('getErrors', options)
  }

  // Helper method to clear server errors (admin only)
  clearErrors() {
    this.send('clearErrors')
  }

  onClose = code => {
    this.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `You have been disconnected.`,
      createdAt: moment().toISOString(),
    })
    this.events.emit('disconnect', code || true)
    console.log('disconnect', code)
  }

  destroy() {
    if (this.ws) {
      this.ws.removeEventListener('message', this.onPacket)
      this.ws.removeEventListener('close', this.onClose)
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }
  }
}
