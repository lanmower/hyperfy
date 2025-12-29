import { PacketCodec } from '../network/PacketCodec.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('SocketManager')

export class SocketManager {
  constructor(network) {
    this.network = network
    this.circuitBreakerManager = null
  }

  setCircuitBreakerManager(manager) {
    this.circuitBreakerManager = manager
  }

  send(name, data, ignoreSocketId) {
    const executeSend = async () => {
      const compressed = this.network.compressor.compress(data)
      const packet = PacketCodec.encode(name, compressed)
      this.network.sockets.forEach(socket => {
        if (socket.id === ignoreSocketId) return
        socket.sendPacket(packet)
      })
    }

    if (this.circuitBreakerManager && this.circuitBreakerManager.has('websocket')) {
      this.circuitBreakerManager.execute('websocket', executeSend).catch(err => {
        if (err.code === 'CIRCUIT_OPEN') {
          logger.error('WebSocket circuit open, broadcast skipped', { name })
        } else {
          logger.error('Broadcast error', { name, error: err.message })
        }
      })
    } else {
      try {
        executeSend()
      } catch (err) {
        logger.error('Broadcast error', { name, error: err.message })
      }
    }
  }

  sendTo(socketId, name, data) {
    const socket = this.network.sockets.get(socketId)
    socket?.send(name, data)
  }

  checkSockets() {
    const dead = []
    this.network.sockets.forEach(socket => {
      if (!socket.alive) {
        dead.push(socket)
      } else {
        socket.ping()
      }
    })
    dead.forEach(socket => socket.disconnect())
  }
}
