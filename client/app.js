import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { PhysicsNetworkClient, InputHandler, MSG } from '/src/index.client.js'
import { createElement, applyDiff } from 'webjsx'
import { createCameraController } from './camera.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 80, 200)
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

scene.add(new THREE.AmbientLight(0xffffff, 0.6))
const sun = new THREE.DirectionalLight(0xffffff, 1.0)
sun.position.set(30, 50, 20)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.near = 0.5
sun.shadow.camera.far = 200
const sc = sun.shadow.camera
sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80
scene.add(sun)

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x444444 }))
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const gltfLoader = new GLTFLoader()
const playerMeshes = new Map()
const entityMeshes = new Map()
const appModules = new Map()
const entityAppMap = new Map()
const inputHandler = new InputHandler()
const uiRoot = document.getElementById('ui-root')
const clickPrompt = document.getElementById('click-prompt')
const cam = createCameraController(camera, scene)
cam.restore(JSON.parse(sessionStorage.getItem('cam') || 'null'))
sessionStorage.removeItem('cam')
let lastShootTime = 0
let lastFrameTime = performance.now()

function createPlayerMesh(id, isLocal) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.0, 4, 8), new THREE.MeshStandardMaterial({ color: isLocal ? 0x00ff88 : 0xff4444 }))
  body.position.y = 0.9; body.castShadow = true; group.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshStandardMaterial({ color: isLocal ? 0x00cc66 : 0xcc3333 }))
  head.position.y = 1.7; head.castShadow = true; group.add(head)
  scene.add(group)
  return group
}

function removePlayerMesh(id) {
  const mesh = playerMeshes.get(id)
  if (!mesh) return
  scene.remove(mesh)
  mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose() })
  playerMeshes.delete(id)
}

function evaluateAppModule(code) {
  try {
    const stripped = code.replace(/^import\s+.*$/gm, '')
    const wrapped = stripped.replace(/export\s+default\s+/, 'return ')
    return new Function(wrapped)()
  } catch (e) { console.error('[app-eval]', e.message); return null }
}

function loadEntityModel(entityId, entityState) {
  if (!entityState.model) return
  const url = entityState.model.startsWith('./') ? '/' + entityState.model.slice(2) : entityState.model
  gltfLoader.load(url, (gltf) => {
    const model = gltf.scene
    model.position.set(...entityState.position)
    if (entityState.rotation) model.quaternion.set(...entityState.rotation)
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
    scene.add(model)
    entityMeshes.set(entityId, model)
    scene.remove(ground)
  }, undefined, (err) => console.error('[gltf]', entityId, err))
}

function renderAppUI(state) {
  const uiFragments = []
  for (const entity of state.entities) {
    const appName = entityAppMap.get(entity.id)
    if (!appName) continue
    const appClient = appModules.get(appName)
    if (!appClient?.render) continue
    try {
      const result = appClient.render({ entity, state: entity.custom || {}, h: createElement })
      if (result?.ui) uiFragments.push({ id: entity.id, ui: result.ui })
    } catch (e) { console.error('[ui]', entity.id, e.message) }
  }
  const local = state.players.find(p => p.id === client.playerId)
  const hp = local?.health ?? 100
  const hudVdom = createElement('div', { id: 'hud' },
    createElement('div', { id: 'crosshair' }, '+'),
    createElement('div', { id: 'health-bar' },
      createElement('div', { id: 'health-fill', style: `width:${hp}%;background:${hp > 60 ? '#0f0' : hp > 30 ? '#ff0' : '#f00'}` }),
      createElement('span', { id: 'health-text' }, String(hp))
    ),
    createElement('div', { id: 'info' }, `Players: ${state.players.length} | Tick: ${client.currentTick}`),
    ...uiFragments.map(f => createElement('div', { 'data-app': f.id }, f.ui))
  )
  try { applyDiff(uiRoot, hudVdom) } catch (e) { console.error('[ui] diff:', e.message) }
}

const client = new PhysicsNetworkClient({
  serverUrl: `ws://${window.location.host}/ws`,
  onStateUpdate: (state) => {
    for (const p of state.players) {
      if (!playerMeshes.has(p.id)) playerMeshes.set(p.id, createPlayerMesh(p.id, p.id === client.playerId))
      const mesh = playerMeshes.get(p.id)
      mesh.position.set(p.position[0], p.position[1] - 1.3, p.position[2])
      if (p.rotation) mesh.quaternion.set(...p.rotation)
    }
    renderAppUI(state)
  },
  onPlayerJoined: (id) => { if (!playerMeshes.has(id)) playerMeshes.set(id, createPlayerMesh(id, id === client.playerId)) },
  onPlayerLeft: (id) => removePlayerMesh(id),
  onEntityAdded: (id, state) => loadEntityModel(id, state),
  onWorldDef: (wd) => { if (wd.entities) for (const e of wd.entities) { if (e.app) entityAppMap.set(e.id, e.app); if (e.model && !entityMeshes.has(e.id)) loadEntityModel(e.id, e) } },
  onAppModule: (d) => { const a = evaluateAppModule(d.code); if (a?.client) appModules.set(d.app, a.client) },
  onAssetUpdate: () => {},
  onAppEvent: () => {},
  onHotReload: () => { sessionStorage.setItem('cam', JSON.stringify(cam.save())); location.reload() },
  debug: false
})

let inputLoopId = null
function startInputLoop() {
  if (inputLoopId) return
  inputLoopId = setInterval(() => {
    if (!client.connected) return
    const input = inputHandler.getInput()
    input.yaw = cam.yaw; input.pitch = cam.pitch
    client.sendInput(input)
    if (input.shoot && Date.now() - lastShootTime > 100) {
      lastShootTime = Date.now()
      const local = client.state?.players?.find(p => p.id === client.playerId)
      if (local) {
        const pos = local.position
        client.sendFire({ origin: [pos[0], pos[1] + 0.9, pos[2]], direction: cam.getAimDirection(pos) })
        const flash = new THREE.PointLight(0xffaa00, 3, 8)
        flash.position.set(pos[0], pos[1] + 0.5, pos[2])
        scene.add(flash)
        setTimeout(() => scene.remove(flash), 60)
      }
    }
  }, 1000 / 60)
}

renderer.domElement.addEventListener('click', () => { if (!document.pointerLockElement) renderer.domElement.requestPointerLock() })
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement
  clickPrompt.style.display = locked ? 'none' : 'block'
  if (locked) document.addEventListener('mousemove', cam.onMouseMove)
  else document.removeEventListener('mousemove', cam.onMouseMove)
})
renderer.domElement.addEventListener('wheel', cam.onWheel, { passive: false })
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight) })

function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1)
  lastFrameTime = now
  const local = client.state?.players?.find(p => p.id === client.playerId)
  cam.update(local, playerMeshes.get(client.playerId), frameDt)
  renderer.render(scene, camera)
}
animate()

client.connect().then(() => { console.log('Connected'); startInputLoop() }).catch(err => console.error('Connection failed:', err))
window.debug = { scene, camera, renderer, client, playerMeshes, entityMeshes, appModules, inputHandler }
