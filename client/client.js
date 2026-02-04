import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createClient } from '../src/sdk/client.js'

const COLORS = [0x4488FF, 0xFF4444, 0x44FF44, 0xFFFF44, 0xFF44FF, 0x44FFFF, 0xFF8844, 0x8844FF]

const client = createClient({
  serverUrl: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`
})

const localPos = new THREE.Vector3(-8, 5, -8)
const remotePlayers = new Map()
let playerCount = 0

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB)
scene.fog = new THREE.Fog(0x87CEEB, 80, 200)

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500)
camera.position.set(-8, 7, -3)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
document.body.appendChild(renderer.domElement)

scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const sun = new THREE.DirectionalLight(0xffffff, 1.4)
sun.position.set(30, 50, 20)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
const sc = sun.shadow.camera
sc.near = 0.5; sc.far = 200; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80
scene.add(sun)
scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3))

new GLTFLoader().load('/world/schwust.glb', (gltf) => {
  gltf.scene.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
  scene.add(gltf.scene)
})

function makeAvatar(color) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 0.6, 8, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 })
  )
  body.position.y = 0.6; body.castShadow = true; g.add(body)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.8 })
  )
  head.position.y = 1.3; head.castShadow = true; g.add(head)
  return g
}

const localMesh = makeAvatar(0x4488FF)
scene.add(localMesh)

function getRemote(id) {
  let r = remotePlayers.get(id)
  if (r) return r
  const mesh = makeAvatar(COLORS[id % COLORS.length])
  scene.add(mesh)
  r = { mesh, target: new THREE.Vector3(), current: new THREE.Vector3() }
  remotePlayers.set(id, r)
  return r
}

function removeRemote(id) {
  const r = remotePlayers.get(id)
  if (!r) return
  scene.remove(r.mesh)
  remotePlayers.delete(id)
}

client.on('snapshot', (snap) => {
  const seen = new Set()
  for (const p of snap.players || []) {
    const id = Array.isArray(p) ? p[0] : p.id
    const pos = Array.isArray(p) ? [p[1], p[2], p[3]] : p.position
    seen.add(id)
    if (id === client.playerId) localPos.set(pos[0], pos[1], pos[2])
    else getRemote(id).target.set(pos[0], pos[1], pos[2])
  }
  playerCount = seen.size
  for (const [id] of remotePlayers) { if (!seen.has(id)) removeRemote(id) }
})

client.on('playerLeave', (playerId) => removeRemote(playerId))

const keys = {}
let yaw = 0, pitch = 0, locked = false

addEventListener('keydown', (e) => { keys[e.code] = true })
addEventListener('keyup', (e) => { keys[e.code] = false })
addEventListener('mousemove', (e) => {
  if (!locked) return
  yaw -= e.movementX * 0.002
  pitch = Math.max(-1.2, Math.min(1.2, pitch - e.movementY * 0.002))
})

const overlay = document.getElementById('overlay')
overlay.addEventListener('click', () => renderer.domElement.requestPointerLock())
document.addEventListener('pointerlockchange', () => {
  locked = !!document.pointerLockElement
  overlay.classList.toggle('hidden', locked)
})
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

const hud = {
  ping: document.getElementById('hud-ping'),
  players: document.getElementById('hud-players'),
  pos: document.getElementById('hud-pos'),
  fps: document.getElementById('hud-fps')
}
let frames = 0, fpsTime = performance.now(), fps = 0
const clock = new THREE.Clock()
const camTarget = new THREE.Vector3()
const lookAt = new THREE.Vector3()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)

  if (client.isConnected) {
    client.sendInput({
      forward: !!keys['KeyW'] || !!keys['ArrowUp'],
      backward: !!keys['KeyS'] || !!keys['ArrowDown'],
      left: !!keys['KeyA'] || !!keys['ArrowLeft'],
      right: !!keys['KeyD'] || !!keys['ArrowRight'],
      jump: !!keys['Space'], yaw
    })
  }

  for (const [, r] of remotePlayers) {
    r.current.lerp(r.target, Math.min(1, 10 * dt))
    r.mesh.position.copy(r.current)
  }

  localMesh.position.copy(localPos)
  localMesh.rotation.y = yaw
  camTarget.set(localPos.x - Math.sin(yaw) * 5, localPos.y + 2.5, localPos.z - Math.cos(yaw) * 5)
  camera.position.lerp(camTarget, Math.min(1, 8 * dt))
  lookAt.set(localPos.x, localPos.y + 1.0, localPos.z)
  camera.lookAt(lookAt)
  renderer.render(scene, camera)

  frames++
  const now = performance.now()
  if (now - fpsTime >= 1000) { fps = frames; frames = 0; fpsTime = now }

  const stats = client.quality.getStats()
  hud.ping.textContent = `PING: ${stats.rtt}ms`
  hud.players.textContent = `PLAYERS: ${playerCount}`
  hud.pos.textContent = `POS: ${localPos.x.toFixed(1)}, ${localPos.y.toFixed(1)}, ${localPos.z.toFixed(1)}`
  hud.fps.textContent = `FPS: ${fps}`
}

client.connect().then(() => console.log('[client] connected'))
animate()
