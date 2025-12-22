let errorObserver = null
let isServerEnv = typeof process !== 'undefined' && process.versions?.node

async function loadErrorObserver() {
  if (isServerEnv && !errorObserver) {
    const mod = await import('../../../server/services/ErrorObserver.js')
    errorObserver = mod.errorObserver
  }
}

export class ErrorHandlingService {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
    loadErrorObserver()
  }

  onErrorEvent = (socket, errorEvent) => {
    if (!this.serverNetwork.errorMonitor) return
    this.serverNetwork.errorMonitor.onErrorReport(socket, errorEvent)
  }

  onErrorReport = (socket, data) => {
    const metadata = {
      realTime: data.realTime || false,
      clientId: socket.id,
      userId: socket.player?.data?.id,
      userName: socket.player?.data?.name,
      clientIP: socket.ws?.remoteAddress || 'unknown',
      timestamp: Date.now()
    }

    if (errorObserver) {
      errorObserver.recordClientError(socket.id, data.error || data, metadata)
    }

    if (this.serverNetwork.errorMonitor) {
      this.serverNetwork.errorMonitor.receiveClientError({
        error: data.error || data,
        ...metadata
      })
    }

    this.serverNetwork.sockets.forEach(mcpSocket => {
      if (mcpSocket.mcpErrorSubscription?.active) {
        mcpSocket.send('mcpErrorEvent', {
          error: data.error || data,
          ...metadata,
          timestamp: new Date().toISOString(),
          side: 'client-reported'
        })
      }
    })
  }

  onMcpSubscribeErrors = (socket, options = {}) => {
    if (!this.serverNetwork.errorMonitor) return

    const errorListener = (event, errorData) => {
      if (event === 'error' || event === 'critical') {
        socket.send('mcpErrorEvent', errorData)
      }
    }

    socket.mcpErrorListener = errorListener
    socket.mcpErrorSubscription = { active: true, options }
    this.serverNetwork.errorMonitor.listeners.add(errorListener)
  }

  onGetErrors = (socket, options = {}) => {
    if (!this.serverNetwork.errorMonitor) {
      socket.send('errors', { errors: [], stats: null })
      return
    }
    const errors = this.serverNetwork.errorMonitor.getErrors(options)
    const stats = this.serverNetwork.errorMonitor.getStats()
    socket.send('errors', { errors, stats })
  }

  onClearErrors = (socket) => {
    if (!this.serverNetwork.errorMonitor) {
      socket.send('clearErrors', { cleared: 0 })
      return
    }
    const count = this.serverNetwork.errorMonitor.clearErrors()
    socket.send('clearErrors', { cleared: count })
  }
}
