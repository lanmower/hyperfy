import moment from 'moment'
import { writePacket } from '../packets.js'
import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
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
    this.events.emit('errors', data)
  }

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
