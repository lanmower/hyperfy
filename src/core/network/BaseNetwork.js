import { System } from '../systems/System.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { writePacket } from '../packets.js'

const logger = new StructuredLogger('BaseNetwork')

export class BaseNetwork extends System {
  constructor(world, handlers = {}) {
    super(world)
    this.protocol = {
      isClient: false,
      isServer: false,
      isConnected: false,
      flushTarget: null,
      handlers: handlers || {},
      enqueue: (socket, method, data) => {
        if (this.protocol.handlers[method]) {
          const handlerName = this.protocol.handlers[method]
          if (typeof this.protocol.flushTarget[handlerName] === 'function') {
            this.protocol.flushTarget[handlerName](socket, data)
          }
        }
      },
      send: (socket, method, data) => {
        try {
          if (!socket) {
            logger.error('Send failed: socket is null', { method })
            return
          }
          if (typeof socket.send !== 'function') {
            logger.error('Send failed: socket.send is not a function', { method, socketType: typeof socket })
            return
          }
          const packet = writePacket(method, data)
          socket.send(packet)
        } catch (err) {
          logger.error('Send failed', { method, error: err.message })
        }
      },
      sendReliable: (socket, method, data) => {
        return new Promise((resolve, reject) => {
          try {
            if (!socket) {
              logger.error('SendReliable failed: socket is null', { method })
              return reject(new Error('Socket is null'))
            }
            if (typeof socket.send !== 'function') {
              logger.error('SendReliable failed: socket.send is not a function', { method, socketType: typeof socket })
              return reject(new Error('Socket send is not a function'))
            }
            const packet = writePacket(method, data)
            socket.send(packet)
            resolve()
          } catch (err) {
            logger.error('SendReliable failed', { method, error: err.message })
            reject(err)
          }
        })
      },
      processPacket: (data) => {
        try {
          const { type, payload } = JSON.parse(data)
          this.protocol.enqueue(null, type, payload)
        } catch (err) {
          logger.error('Failed to process packet', { error: err.message })
        }
      },
      getTime: () => {
        return this.world?.network?.getTime?.() || (performance.now() / 1000)
      },
    }
  }
}
