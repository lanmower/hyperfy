import { WebSocketServer } from 'ws'

export class ServerHMR {
  constructor(server) {
    this.server = server
    this.clients = new Set()
    this.wss = new WebSocketServer({ noServer: true })
    this.setupUpgrade()
  }

  setupUpgrade() {
    this.server.on('upgrade', (req, socket, head) => {
      if (req.url !== '/hmr') return

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.clients.add(ws)

        ws.on('close', () => {
          this.clients.delete(ws)
        })

        ws.on('error', () => {
          this.clients.delete(ws)
        })
      })
    })
  }

  broadcast(message) {
    const data = JSON.stringify(message)
    this.clients.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(data)
      }
    })
  }
}
