import moment from 'moment'
import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
import { ClientPacketHandlers } from './network/ClientPacketHandlers.js'
import { PacketCodec } from './network/PacketCodec.js'
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
    console.log('ClientNetwork.init() called', { wsUrl, name, avatar })
    if (!wsUrl) {
      console.error('ClientNetwork.init() ERROR: wsUrl is missing!')
      return
    }
    this.wsManager.init(wsUrl, name, avatar)
  }

  send(name, data) {
    const ignore = ['ping']
    if (!ignore.includes(name) && data.id != this.id) {
      console.log('->', name, data)
    }
    const packet = PacketCodec.encode(name, data)
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
    const [method, data] = PacketCodec.decode(e.data)
    console.log('Packet decoded:', { method, dataSize: data ? JSON.stringify(data).length : 0 })
    if (method && typeof this[method] === 'function') {
      console.log('Executing:', method)
      this[method](data)
    }
  }

  onClose = code => {
    const codeMsg = code === 1000 ? 'gracefully' : `(code: ${code})`
    this.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `You have been disconnected ${codeMsg}. Attempting to reconnect...`,
      createdAt: moment().toISOString(),
    })
    this.events.emit('disconnect', code || true)
    console.log('disconnect', code)
  }

  onReconnect = () => {
    console.log('Reconnected to server, clearing stale entities and requesting full snapshot')
    this.clearStaleEntities()
    this.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `Reconnected. Syncing state...`,
      createdAt: moment().toISOString(),
    })
    this.events.emit('reconnect')
    this.requestFullSnapshot()
  }

  clearStaleEntities() {
    const entities = this.world?.entities
    if (!entities) return

    const before = entities.items.size
    const toRemove = []

    entities.items.forEach((entity, id) => {
      if (entity && typeof entity.destroy === 'function') {
        toRemove.push(id)
      }
    })

    toRemove.forEach(id => {
      entities.remove(id)
    })

    console.log('Cleared stale entities:', { before, after: entities.items.size, removed: toRemove.length })
  }

  requestFullSnapshot() {
    this.send('getSnapshot', { force: true })
  }

  enqueue(method, data) {
    this.protocol.enqueue(method, data)
  }

  getTime() {
    return (performance.now() + this.serverTimeOffset) / 1000
  }

  onSnapshot(data) {
    console.log('onSnapshot called', { id: data.id, entityCount: data.entities?.length })
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.assetsUrl = data.assetsUrl
    console.log('Calling snapshotProcessor.process()')
    this.snapshotProcessor.process(data)
    console.log('snapshotProcessor.process() completed')
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
