import moment from 'moment'
import { writePacket } from '../packets.js'
import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
import { ClientPacketHandlers } from './network/ClientPacketHandlers.js'
import { storage } from '../storage.js'

export class ClientNetwork extends BaseNetwork {
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
    this.apiUrl = null
    this.id = null
    this.isClient = true
    this.serverTimeOffset = 0
    this.protocol.isClient = true
    this.protocol.flushTarget = this
    this.assetsUrl = world.assetsUrl
    this.wsManager = new WebSocketManager(this)
    this.snapshotProcessor = new SnapshotProcessor(this)
    this.packetHandlers = new ClientPacketHandlers(this)
  }

  init({ wsUrl, name, avatar }) {
    this.wsManager.init(wsUrl, name, avatar)
  }

  send(name, data) {
    const ignore = ['ping']
    if (!ignore.includes(name) && data.id != this.id) {
      console.log('->', name, data)
    }
    const packet = writePacket(name, data)
    this.wsManager.send(packet)
  }

  async upload(file) {
    const hash = await hashFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    const filename = `${hash}.${ext}`
    const url = `${this.apiUrl}/upload-check?filename=${filename}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.exists) return

    const form = new FormData()
    form.append('file', file)
    const uploadUrl = `${this.apiUrl}/upload`
    await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    })
  }

  onPacket = e => {
    this.protocol.processPacket(e.data)
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

  enqueue(method, data) {
    this.protocol.enqueue(method, data)
  }

  getTime() {
    return (performance.now() + this.serverTimeOffset) / 1000
  }

  onSnapshot(data) {
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.assetsUrl = data.assetsUrl
    this.snapshotProcessor.process(data)
  }

  onSettingsModified = data => this.packetHandlers.handleSettingsModified(data)
  onChatAdded = msg => this.packetHandlers.handleChatAdded(msg)
  onChatCleared = () => this.packetHandlers.handleChatCleared()
  onBlueprintAdded = blueprint => this.packetHandlers.handleBlueprintAdded(blueprint)
  onBlueprintModified = change => this.packetHandlers.handleBlueprintModified(change)
  onEntityAdded = data => this.packetHandlers.handleEntityAdded(data)
  onEntityModified = data => this.packetHandlers.handleEntityModified(data)
  onEntityEvent = event => this.packetHandlers.handleEntityEvent(event)
  onEntityRemoved = id => this.packetHandlers.handleEntityRemoved(id)
  onPlayerTeleport = data => this.packetHandlers.handlePlayerTeleport(data)
  onPlayerPush = data => this.packetHandlers.handlePlayerPush(data)
  onPlayerSessionAvatar = data => this.packetHandlers.handlePlayerSessionAvatar(data)
  onLiveKitLevel = data => this.packetHandlers.handleLiveKitLevel(data)
  onMute = data => this.packetHandlers.handleMute(data)
  onPong = time => this.packetHandlers.handlePong(time)
  onKick = code => this.packetHandlers.handleKick(code)
  onHotReload = data => this.packetHandlers.handleHotReload(data)
  onErrors = data => this.packetHandlers.handleErrors(data)

  requestErrors(options = {}) {
    this.send('getErrors', options)
  }

  clearErrors() {
    this.send('clearErrors')
  }

  destroy() {
    this.wsManager.destroy()
  }
}
