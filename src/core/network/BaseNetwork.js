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
          const packet = writePacket(method, data)
          socket?.send?.(packet)
        } catch (err) {
          logger.error('Send failed', { method, error: err.message })
        }
      },
      sendReliable: (socket, method, data) => {
        return new Promise((resolve, reject) => {
          try {
            const packet = writePacket(method, data)
            socket?.send?.(packet)
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
