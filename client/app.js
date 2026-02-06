import { PhysicsNetworkClient } from '/src/index.client.js'

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

// Initialize client
const client = new PhysicsNetworkClient({
  serverUrl: `ws://${window.location.host}/ws`,
  onStateUpdate: render
})

function render(state) {
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#fff'
  ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 2, 4, 4)

  ctx.fillStyle = '#0f0'
  ctx.font = '12px monospace'
  ctx.fillText(`Connected: ${client.connected}`, 10, 20)
  ctx.fillText(`Players: ${state?.players?.length || 0}`, 10, 35)
  ctx.fillText(`Entities: ${state?.entities?.length || 0}`, 10, 50)

  if (state?.entities) {
    let y = 80
    ctx.fillStyle = '#ff0'
    ctx.fillText('--- Entities ---', 10, y)
    y += 15
    for (const entity of state.entities) {
      ctx.fillStyle = '#0ff'
      ctx.fillText(`${entity.id}: ${entity.model}`, 10, y)
      y += 15
      ctx.fillStyle = '#888'
      ctx.fillText(`  pos: [${entity.position.map(v => v.toFixed(1)).join(', ')}]`, 10, y)
      y += 15
    }
  }
}

// Connect to server
client.connect()
  .then(() => console.log('Connected to server'))
  .catch(err => console.error('Connection failed:', err))

// Log errors
window.addEventListener('error', (e) => {
  console.error('Window error:', e.error)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})

window.gameState = { client, canvas, ctx, render }
window.debug = {
  client,
  canvas,
  render,
  getConnectedPlayers: () => client?.state?.players || [],
  getEntities: () => client?.state?.entities || [],
  getCanvasSize: () => ({ width: canvas.width, height: canvas.height }),
  isConnected: () => client?.connected || false,
  getServerUrl: () => client?.serverUrl,
  sendManualRender: (state) => render(state)
}
