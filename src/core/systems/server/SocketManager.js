import { writePacket } from '../../packets.js'

export class SocketManager {
  constructor(network) {
    this.network = network
  }

  send(name, data, ignoreSocketId) {
    const packet = writePacket(name, data)
    this.network.sockets.forEach(socket => {
      if (socket.id === ignoreSocketId) return
      socket.sendPacket(packet)
    })
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
