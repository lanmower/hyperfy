import { storage } from '../../storage.js'

export class WebSocketManager {
  constructor(network) {
    this.network = network
    this.ws = null
    this.messageHandler = null
    this.closeHandler = null
  }

  init(wsUrl, name, avatar) {
    const authToken = storage.get('authToken')
    let url = `${wsUrl}?authToken=${authToken}`
    if (name) url += `&name=${encodeURIComponent(name)}`
    if (avatar) url += `&avatar=${encodeURIComponent(avatar)}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.messageHandler = e => this.network.onPacket(e)
    this.closeHandler = e => this.network.onClose(e.code)
    this.ws.addEventListener('message', this.messageHandler)
    this.ws.addEventListener('close', this.closeHandler)
    this.network.protocol.isConnected = true
  }

  send(packet) {
    if (this.ws) {
      this.ws.send(packet)
    }
  }

  destroy() {
    if (this.ws) {
      if (this.messageHandler) this.ws.removeEventListener('message', this.messageHandler)
      if (this.closeHandler) this.ws.removeEventListener('close', this.closeHandler)
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }
  }
}
