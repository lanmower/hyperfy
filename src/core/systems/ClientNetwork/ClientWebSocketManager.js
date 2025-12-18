import moment from 'moment'
import { uuid } from '../../utils.js'
import { storage } from '../../storage.js'

export class ClientWebSocketManager {
  constructor(network) {
    this.network = network
    this.ws = null
  }

  init({ wsUrl, name, avatar }) {
    const authToken = storage.get('authToken')
    let url = `${wsUrl}?authToken=${authToken}`
    if (name) url += `&name=${encodeURIComponent(name)}`
    if (avatar) url += `&avatar=${encodeURIComponent(avatar)}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.ws.addEventListener('message', this.onPacket)
    this.ws.addEventListener('close', this.onClose)
    this.network.protocol.isConnected = true
  }

  send(packet) {
    this.ws.send(packet)
  }

  onPacket = e => {
    this.network.protocol.processPacket(e.data)
  }

  onClose = code => {
    this.network.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `You have been disconnected.`,
      createdAt: moment().toISOString(),
    })
    this.network.events.emit('disconnect', code || true)
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
