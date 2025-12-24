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
    console.log('WebSocketManager.init() creating WebSocket:', { url })
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.messageHandler = e => {
      console.log('WebSocket message received, packet size:', e.data.byteLength)
      this.network.onPacket(e)
    }
    this.closeHandler = e => {
      console.log('WebSocket closed, reloading page in 1 second...')
      this.network.onClose(e.code)
      setTimeout(() => window.location.reload(), 1000)
    }
    this.ws.addEventListener('message', this.messageHandler)
    this.ws.addEventListener('close', this.closeHandler)
    this.ws.addEventListener('open', () => {
      console.log('WebSocket opened, marking as connected')
      this.network.protocol.isConnected = true
    })
    this.ws.addEventListener('error', e => {
      console.error('WebSocket error:', e)
    })
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
