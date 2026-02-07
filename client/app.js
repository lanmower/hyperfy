import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { PhysicsNetworkClient, InputHandler, MSG } from '/src/index.client.js'

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
sun.shadow.camera.left = -80
sun.shadow.camera.right = 80
sun.shadow.camera.top = 80
sun.shadow.camera.bottom = -80
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const gltfLoader = new GLTFLoader()
const playerMeshes = new Map()
const entityMeshes = new Map()
const appModules = new Map()
const inputHandler = new InputHandler()

const hudInfo = document.getElementById('info')
const healthFill = document.getElementById('health-fill')
const healthText = document.getElementById('health-text')
const clickPrompt = document.getElementById('click-prompt')

const savedCam = JSON.parse(sessionStorage.getItem('cam') || 'null')
let yaw = savedCam?.yaw || 0, pitch = savedCam?.pitch || 0
let lastShootTime = 0
const camTarget = new THREE.Vector3()
const camRaycaster = new THREE.Raycaster()
const camDir = new THREE.Vector3()
const camDesired = new THREE.Vector3()
const shoulderOffset = 0.6
const headHeight = 0.4
const zoomStages = [0, 1.5, 3, 5, 8]
let zoomIndex = savedCam?.zoomIndex ?? 2
if (savedCam) sessionStorage.removeItem('cam')

function createPlayerMesh(id, isLocal) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.0, 4, 8),
    new THREE.MeshStandardMaterial({ color: isLocal ? 0x00ff88 : 0xff4444 })
  )
  body.position.y = 0.9
  body.castShadow = true
  group.add(body)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 6),
    new THREE.MeshStandardMaterial({ color: isLocal ? 0x00cc66 : 0xcc3333 })
  )
  head.position.y = 1.7
  head.castShadow = true
  group.add(head)
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
    const fn = new Function(wrapped)
    return fn()
  } catch (e) {
    console.error('[app-eval]', e.message)
    return null
  }
}

function loadEntityModel(entityId, entityState) {
  if (!entityState.model) return
  const url = entityState.model.startsWith('./') ? '/' + entityState.model.slice(2) : entityState.model
  gltfLoader.load(url, (gltf) => {
    const model = gltf.scene
    model.position.set(...entityState.position)
    if (entityState.rotation) {
      model.quaternion.set(entityState.rotation[0], entityState.rotation[1], entityState.rotation[2], entityState.rotation[3])
    }
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
    scene.add(model)
    entityMeshes.set(entityId, model)
    scene.remove(ground)
  }, undefined, (err) => console.error('[gltf]', entityId, err))
}

function onWorldDef(worldDef) {
  console.log('[client] received world definition:', worldDef)
  if (worldDef.entities) {
    for (const ent of worldDef.entities) {
      if (ent.model && !entityMeshes.has(ent.id)) {
        loadEntityModel(ent.id, ent)
      }
    }
  }
}

function onAppModule(data) {
  const { app, code } = data
  console.log('[client] received app module:', app)
  const appDef = evaluateAppModule(code)
  if (appDef && appDef.client) {
    appModules.set(app, appDef.client)
  }
}

const client = new PhysicsNetworkClient({
  serverUrl: `ws://${window.location.host}/ws`,
  onStateUpdate: updateState,
  onPlayerJoined: (id) => {
    if (!playerMeshes.has(id)) playerMeshes.set(id, createPlayerMesh(id, id === client.playerId))
  },
  onPlayerLeft: (id) => removePlayerMesh(id),
  onEntityAdded: (id, state) => loadEntityModel(id, state),
  onWorldDef: onWorldDef,
  onAppModule: onAppModule,
  onAssetUpdate: (data) => console.log('[client] asset update:', data),
  onHotReload: () => {
    sessionStorage.setItem('cam', JSON.stringify({ yaw, pitch, zoomIndex }))
    location.reload()
  },
  debug: false
})

function updateState(state) {
  for (const p of state.players) {
    if (!playerMeshes.has(p.id)) playerMeshes.set(p.id, createPlayerMesh(p.id, p.id === client.playerId))
    const mesh = playerMeshes.get(p.id)
    mesh.position.set(p.position[0], p.position[1] - 1.3, p.position[2])
    if (p.rotation) mesh.quaternion.set(p.rotation[0], p.rotation[1], p.rotation[2], p.rotation[3])
  }
  const local = state.players.find(p => p.id === client.playerId)
  if (local) {
    const hp = local.health ?? 100
    healthFill.style.width = hp + '%'
    healthFill.style.backgroundColor = hp > 60 ? '#0f0' : hp > 30 ? '#ff0' : '#f00'
    healthText.textContent = hp
  }
  hudInfo.textContent = `Players: ${state.players.length} | Tick: ${client.currentTick}`
}

function getAimDirection() {
  const sy = Math.sin(yaw), cy = Math.cos(yaw)
  const sp = Math.sin(pitch), cp = Math.cos(pitch)
  return [sy * cp, sp, cy * cp]
}

let inputLoopId = null
function startInputLoop() {
  if (inputLoopId) return
  inputLoopId = setInterval(() => {
    if (!client.connected) return
    const input = inputHandler.getInput()
    input.yaw = yaw
    input.pitch = pitch
    client.sendInput(input)
    if (input.shoot && Date.now() - lastShootTime > 100) {
      lastShootTime = Date.now()
      const local = client.state?.players?.find(p => p.id === client.playerId)
      if (local) {
        const pos = local.position
        client.sendFire({ origin: [pos[0], pos[1] + 0.5, pos[2]], direction: getAimDirection() })
        showMuzzleFlash(pos)
      }
    }
  }, 1000 / 60)
}

function showMuzzleFlash(pos) {
  const flash = new THREE.PointLight(0xffaa00, 3, 8)
  flash.position.set(pos[0], pos[1] + 0.5, pos[2])
  scene.add(flash)
  setTimeout(() => scene.remove(flash), 60)
}

renderer.domElement.addEventListener('click', () => {
  if (!document.pointerLockElement) renderer.domElement.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement
  clickPrompt.style.display = locked ? 'none' : 'block'
  if (locked) document.addEventListener('mousemove', onMouseMove)
  else document.removeEventListener('mousemove', onMouseMove)
})

function onMouseMove(e) {
  yaw -= e.movementX * 0.002
  pitch -= e.movementY * 0.002
  pitch = Math.max(-1.4, Math.min(1.4, pitch))
}

renderer.domElement.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) zoomIndex = Math.min(zoomIndex + 1, zoomStages.length - 1)
  else zoomIndex = Math.max(zoomIndex - 1, 0)
  e.preventDefault()
}, { passive: false })

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate)
  const local = client.state?.players?.find(p => p.id === client.playerId)
  if (local) {
    const dist = zoomStages[zoomIndex]
    camTarget.set(local.position[0], local.position[1] + headHeight, local.position[2])
    const localMesh = playerMeshes.get(client.playerId)
    if (localMesh) localMesh.visible = dist > 0.5

    const sy = Math.sin(yaw), cy = Math.cos(yaw)
    const sp = Math.sin(pitch), cp = Math.cos(pitch)
    const fwdX = sy * cp, fwdY = sp, fwdZ = cy * cp
    const rightX = -cy, rightZ = sy

    if (dist < 0.01) {
      camera.position.copy(camTarget)
      camera.lookAt(camTarget.x + fwdX, camTarget.y + fwdY, camTarget.z + fwdZ)
    } else {
      camDesired.set(
        camTarget.x - fwdX * dist + rightX * shoulderOffset,
        camTarget.y - fwdY * dist + 0.2,
        camTarget.z - fwdZ * dist + rightZ * shoulderOffset
      )
      camDir.subVectors(camDesired, camTarget).normalize()
      const fullDist = camTarget.distanceTo(camDesired)
      camRaycaster.set(camTarget, camDir)
      camRaycaster.far = fullDist
      camRaycaster.near = 0
      const hits = camRaycaster.intersectObjects(scene.children, true)
      let clippedDist = fullDist
      for (const hit of hits) {
        if (hit.object === localMesh || localMesh?.children?.includes(hit.object)) continue
        if (hit.distance < clippedDist) clippedDist = hit.distance - 0.2
      }
      if (clippedDist < 0.3) clippedDist = 0.3
      camera.position.set(
        camTarget.x + camDir.x * clippedDist,
        camTarget.y + camDir.y * clippedDist,
        camTarget.z + camDir.z * clippedDist
      )
      camera.lookAt(
        camera.position.x + fwdX * 100,
        camera.position.y + fwdY * 100,
        camera.position.z + fwdZ * 100
      )
    }
  }
  renderer.render(scene, camera)
}
animate()

client.connect()
  .then(() => { console.log('Connected'); startInputLoop() })
  .catch(err => console.error('Connection failed:', err))

window.debug = { scene, camera, renderer, client, playerMeshes, entityMeshes, appModules, inputHandler }
