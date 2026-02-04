import { createServer as createHttpServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { pack, unpack } from 'msgpackr'
import { PhysicsWorld } from './src/physics/World.js'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3000', 10)
const TICK_RATE = 128
const DT = 1 / TICK_RATE
const SPAWN = [-8, 5, -8]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary' }
const MSG = { HANDSHAKE_ACK: 0x02, HEARTBEAT: 0x03, HEARTBEAT_ACK: 0x04, SNAPSHOT: 0x10, INPUT: 0x11, PLAYER_LEAVE: 0x21 }

const players = new Map()
let nextId = 1, tick = 0, physics = null, J = null

function frame(type, payload) {
  const body = pack(payload)
  const buf = Buffer.alloc(3 + body.length)
  buf.writeUInt8(type, 0)
  buf.writeUInt16BE(tick & 0xFFFF, 1)
  body.copy(buf, 3)
  return buf
}

function decode(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
  if (buf.length < 3) return null
  return { type: buf.readUInt8(0), seq: buf.readUInt16BE(1), payload: buf.length > 3 ? unpack(buf.slice(3)) : null }
}

function broadcast(type, payload) {
  const f = frame(type, payload)
  for (const p of players.values()) { try { p.socket.send(f) } catch (_) {} }
}

function addPlayer(socket) {
  const id = nextId++
  const bodyId = physics.addDynamicCapsule(0.3, 0.6, [...SPAWN], 80)
  const body = physics.bodies.get(bodyId)
  const player = { id, socket, bodyId, joltId: body.GetID(), input: {}, grounded: false }
  players.set(id, player)
  try { socket.send(frame(MSG.HANDSHAKE_ACK, { playerId: id, tick, tickRate: TICK_RATE })) } catch (_) {}
  return player
}

function removePlayer(id) {
  const p = players.get(id)
  if (!p) return
  physics.removeBody(p.bodyId)
  players.delete(id)
  broadcast(MSG.PLAYER_LEAVE, { playerId: id })
}

function processInput(player) {
  const inp = player.input
  const vel = physics.getBodyVelocity(player.bodyId)
  let vx = 0, vz = 0
  if (inp.forward || inp.backward || inp.left || inp.right) {
    const yaw = inp.yaw || 0, sinY = Math.sin(yaw), cosY = Math.cos(yaw)
    let fwd = (inp.forward ? 1 : 0) - (inp.backward ? 1 : 0)
    let strafe = (inp.right ? 1 : 0) - (inp.left ? 1 : 0)
    const len = Math.sqrt(fwd * fwd + strafe * strafe)
    if (len > 0) { fwd /= len; strafe /= len }
    vx = (strafe * cosY + fwd * sinY) * 6.0
    vz = (-strafe * sinY + fwd * cosY) * 6.0
  }
  let vy = vel[1]
  player.grounded = vy > -0.5 && vy < 0.5
  if (inp.jump && player.grounded) { vy = 7.0; player.grounded = false; inp.jump = false }
  if (vy < -15) vy = -15
  physics.setBodyVelocity(player.bodyId, [vx, vy, vz])
  physics.bodyInterface.SetAngularVelocity(player.joltId, new J.Vec3(0, 0, 0))
}

function gameTick() {
  tick++
  for (const p of players.values()) processInput(p)
  physics.step(DT)
  if (players.size === 0) return
  const plist = []
  for (const p of players.values()) {
    const pos = physics.getBodyPosition(p.bodyId)
    const rot = physics.getBodyRotation(p.bodyId)
    const vel = physics.getBodyVelocity(p.bodyId)
    const q = (v) => Math.round(v * 100) / 100
    plist.push([p.id, q(pos[0]), q(pos[1]), q(pos[2]), rot[0], rot[1], rot[2], rot[3], q(vel[0]), q(vel[1]), q(vel[2]), p.grounded ? 1 : 0])
  }
  const snap = pack([tick, Date.now(), plist])
  const buf = Buffer.alloc(3 + snap.length)
  buf.writeUInt8(MSG.SNAPSHOT, 0)
  buf.writeUInt16BE(tick & 0xFFFF, 1)
  snap.copy(buf, 3)
  for (const p of players.values()) { try { p.socket.send(buf) } catch (_) {} }
}

function resolveFile(url) {
  if (url === '/' || url === '/index.html') return join(ROOT, 'client', 'index.html')
  if (url === '/client.js') return join(ROOT, 'client', 'client.js')
  if (url.startsWith('/world/')) return join(ROOT, url.slice(1))
  return null
}

async function main() {
  physics = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await physics.init()
  J = physics.Jolt
  physics.addStaticTrimesh(join(ROOT, 'world', 'schwust.glb'), 0)

  const http = createHttpServer((req, res) => {
    const fp = resolveFile(req.url)
    if (!fp || !existsSync(fp)) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' })
    res.end(readFileSync(fp))
  })

  const wss = new WebSocketServer({ server: http })
  wss.on('connection', (socket) => {
    const player = addPlayer(socket)
    console.log(`[+] player ${player.id}`)
    socket.on('message', (raw) => {
      const msg = decode(raw)
      if (!msg) return
      if (msg.type === MSG.INPUT && msg.payload) {
        const d = msg.payload
        player.input = { forward: !!d.forward, backward: !!d.backward, left: !!d.left, right: !!d.right, jump: !!d.jump, yaw: typeof d.yaw === 'number' ? d.yaw : 0 }
      }
      if (msg.type === MSG.HEARTBEAT) {
        try { socket.send(frame(MSG.HEARTBEAT_ACK, { ts: msg.payload?.ts })) } catch (_) {}
      }
    })
    socket.on('close', () => { console.log(`[-] player ${player.id}`); removePlayer(player.id) })
    socket.on('error', () => removePlayer(player.id))
  })

  let last = Date.now()
  function loop() {
    const now = Date.now()
    if (now - last >= 1000 / TICK_RATE) { last = now; gameTick() }
    setImmediate(loop)
  }

  http.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `[server] port ${PORT} in use` : `[server] ${e.message}`)
    process.exit(1)
  })
  http.listen(PORT, () => { console.log(`[server] http://localhost:${PORT} @ ${TICK_RATE} TPS`); loop() })
}

main().catch(e => { console.error('[fatal]', e.message); process.exit(1) })
