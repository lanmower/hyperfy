import EventEmitter from 'node:events'
import { MSG } from '../protocol/MessageTypes.js'

export class Inspector extends EventEmitter {
  constructor() {
    super()
    this.clientLogs = new Map()
    this.clientPerf = new Map()
    this.clientErrors = new Map()
    this.maxLogsPerClient = 200
  }

  handleMessage(clientId, msg) {
    if (msg.type === MSG.CLIENT_LOG) {
      this._storeLog(clientId, 'log', msg.payload)
      this.emit('clientLog', clientId, 'log', msg.payload.args)
      return true
    }
    if (msg.type === MSG.CLIENT_ERROR) {
      this._storeError(clientId, msg.payload)
      this.emit('clientError', clientId, msg.payload)
      return true
    }
    if (msg.type === MSG.CLIENT_WARN) {
      this._storeLog(clientId, 'warn', msg.payload)
      this.emit('clientWarn', clientId, msg.payload.args)
      return true
    }
    if (msg.type === MSG.CLIENT_PERF) {
      this.clientPerf.set(clientId, {
        ...msg.payload,
        receivedAt: Date.now()
      })
      this.emit('clientPerf', clientId, msg.payload)
      return true
    }
    if (msg.type === MSG.CLIENT_STATE) {
      this.emit('clientState', clientId, msg.payload)
      return true
    }
    if (msg.type === MSG.INSPECT_RESPONSE) {
      this.emit('inspectResponse', clientId, msg.payload)
      return true
    }
    return false
  }

  _storeLog(clientId, level, payload) {
    if (!this.clientLogs.has(clientId)) this.clientLogs.set(clientId, [])
    const logs = this.clientLogs.get(clientId)
    logs.push({ level, args: payload.args, ts: payload.ts || Date.now() })
    if (logs.length > this.maxLogsPerClient) logs.shift()
  }

  _storeError(clientId, payload) {
    if (!this.clientErrors.has(clientId)) this.clientErrors.set(clientId, [])
    const errors = this.clientErrors.get(clientId)
    errors.push({
      message: payload.message,
      stack: payload.stack,
      ts: payload.ts || Date.now()
    })
    if (errors.length > this.maxLogsPerClient) errors.shift()
  }

  getClientLogs(clientId) {
    return this.clientLogs.get(clientId) || []
  }

  getClientErrors(clientId) {
    return this.clientErrors.get(clientId) || []
  }

  getClientPerf(clientId) {
    return this.clientPerf.get(clientId) || null
  }

  getClientStats(clientId, connectionManager) {
    const perf = this.clientPerf.get(clientId)
    const connStats = connectionManager
      ? connectionManager.getClientStats(clientId)
      : null
    return {
      perf: perf || null,
      connection: connStats,
      logCount: (this.clientLogs.get(clientId) || []).length,
      errorCount: (this.clientErrors.get(clientId) || []).length
    }
  }

  getAllClients(connectionManager) {
    const all = new Map()
    const ids = new Set([
      ...this.clientLogs.keys(),
      ...this.clientPerf.keys(),
      ...this.clientErrors.keys()
    ])
    if (connectionManager) {
      for (const [id] of connectionManager.clients) ids.add(id)
    }
    for (const id of ids) {
      all.set(id, this.getClientStats(id, connectionManager))
    }
    return all
  }

  removeClient(clientId) {
    this.clientLogs.delete(clientId)
    this.clientPerf.delete(clientId)
    this.clientErrors.delete(clientId)
  }

  clear() {
    this.clientLogs.clear()
    this.clientPerf.clear()
    this.clientErrors.clear()
  }
}
