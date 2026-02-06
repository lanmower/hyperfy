import { PhysicsNetworkClient, InputHandler } from '/src/index.client.js'

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const inputHandler = new InputHandler()

const client = new PhysicsNetworkClient({
  serverUrl: `ws://${window.location.host}/ws`,
  onStateUpdate: render,
  debug: false
})

let inputLoopId = null
let yaw = 0
let pitch = 0
let lastShootTime = 0
const shootCooldown = 100

canvas.addEventListener('click', () => {
  if (!document.pointerLockElement) canvas.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    document.addEventListener('mousemove', onMouseMove)
  } else {
    document.removeEventListener('mousemove', onMouseMove)
  }
})

function onMouseMove(e) {
  yaw -= e.movementX * 0.002
  pitch -= e.movementY * 0.002
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch))
}

function getAimDirection() {
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  return [sy * cp, sp, cy * cp]
}

function startInputLoop() {
  if (inputLoopId) return
  const sendRate = 1000 / 60
  inputLoopId = setInterval(() => {
    if (!client.connected) return
    const input = inputHandler.getInput()
    input.yaw = yaw
    input.pitch = pitch
    client.sendInput(input)

    if (input.shoot && Date.now() - lastShootTime > shootCooldown) {
      lastShootTime = Date.now()
      const localPlayer = client.state?.players?.find(p => p.id === client.playerId)
      if (localPlayer) {
        const pos = localPlayer.position
        const origin = [pos[0], pos[1] + 1.5, pos[2]]
        const direction = getAimDirection()
        client.sendFire({ origin, direction })
      }
    }
  }, sendRate)
}

function stopInputLoop() {
  if (inputLoopId) {
    clearInterval(inputLoopId)
    inputLoopId = null
  }
}

function render(state) {
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#fff'
  ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 2, 4, 4)

  ctx.fillStyle = '#0f0'
  ctx.font = '14px monospace'
  let y = 20
  ctx.fillText(`Connected: ${client.connected}`, 10, y); y += 18
  ctx.fillText(`Player ID: ${client.playerId || 'none'}`, 10, y); y += 18
  ctx.fillText(`Players: ${state?.players?.length || 0}`, 10, y); y += 18
  ctx.fillText(`Entities: ${state?.entities?.length || 0}`, 10, y); y += 25

  const input = inputHandler.getInput()
  ctx.fillStyle = '#ff0'
  ctx.fillText('--- Input ---', 10, y); y += 18
  ctx.fillStyle = '#aaa'
  ctx.fillText(`W: ${input.forward} A: ${input.left} S: ${input.backward} D: ${input.right}`, 10, y); y += 18
  ctx.fillText(`Jump: ${input.jump} Shoot: ${input.shoot}`, 10, y); y += 25

  if (state?.players?.length > 0) {
    ctx.fillStyle = '#0ff'
    ctx.fillText('--- Players ---', 10, y); y += 18
    for (const p of state.players) {
      const isLocal = p.id === client.playerId
      ctx.fillStyle = isLocal ? '#0f0' : '#888'
      const pos = p.position || [0, 0, 0]
      const vel = p.velocity || [0, 0, 0]
      ctx.fillText(`${isLocal ? '>' : ' '} P${p.id}: pos[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`, 10, y); y += 16
      ctx.fillText(`    vel[${vel[0].toFixed(1)}, ${vel[1].toFixed(1)}, ${vel[2].toFixed(1)}] hp:${p.health || 100} grnd:${p.onGround}`, 10, y); y += 18
    }
  }

  y += 10
  if (state?.entities?.length > 0) {
    ctx.fillStyle = '#ff0'
    ctx.fillText('--- Entities ---', 10, y); y += 18
    for (const e of state.entities) {
      ctx.fillStyle = '#888'
      ctx.fillText(`${e.id}: ${e.model?.split('/').pop() || 'no model'}`, 10, y); y += 16
    }
  }

  renderMinimap(state)
}

function renderMinimap(state) {
  const mapSize = 150
  const mapX = canvas.width - mapSize - 20
  const mapY = 20
  const scale = 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(mapX, mapY, mapSize, mapSize)
  ctx.strokeStyle = '#444'
  ctx.strokeRect(mapX, mapY, mapSize, mapSize)

  const centerX = mapX + mapSize / 2
  const centerY = mapY + mapSize / 2

  if (state?.players) {
    for (const p of state.players) {
      const pos = p.position || [0, 0, 0]
      const px = centerX + pos[0] * scale
      const py = centerY - pos[2] * scale
      const isLocal = p.id === client.playerId
      ctx.fillStyle = isLocal ? '#0f0' : '#f00'
      ctx.beginPath()
      ctx.arc(px, py, isLocal ? 5 : 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

client.connect()
  .then(() => {
    console.log('Connected to server')
    startInputLoop()
  })
  .catch(err => console.error('Connection failed:', err))

// Log errors
window.addEventListener('error', (e) => {
  console.error('Window error:', e.error)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})

window.gameState = { client, canvas, ctx, render, inputHandler }
window.debug = {
  client,
  canvas,
  render,
  inputHandler,
  getConnectedPlayers: () => client?.state?.players || [],
  getEntities: () => client?.state?.entities || [],
  getCanvasSize: () => ({ width: canvas.width, height: canvas.height }),
  isConnected: () => client?.connected || false,
  getServerUrl: () => client?.serverUrl,
  sendManualRender: (state) => render(state),
  getInput: () => inputHandler.getInput(),
  sendInput: (input) => client.sendInput(input)
}
