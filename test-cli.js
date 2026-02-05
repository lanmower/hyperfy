import { createServer } from './src/sdk/server.js'
import { createClient } from './src/sdk/client.js'
import { WebSocket as WS } from 'ws'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const Results = {
  passed: 0,
  failed: 0,
  tests: [],

  pass(name, msg = '') {
    this.passed++
    this.tests.push({ status: 'PASS', name, msg })
    console.log(`✓ ${name}${msg ? ': ' + msg : ''}`)
  },

  fail(name, msg = '') {
    this.failed++
    this.tests.push({ status: 'FAIL', name, msg })
    console.log(`✗ ${name}${msg ? ': ' + msg : ''}`)
  },

  assert(condition, name, msg = '') {
    condition ? this.pass(name, msg) : this.fail(name, msg)
  },

  assertClose(actual, expected, tolerance, name, msg = '') {
    const pass = Math.abs(actual - expected) <= tolerance
    this.assert(pass, name, `${actual.toFixed(3)} ≈ ${expected.toFixed(3)} (±${tolerance})`)
  },

  summary() {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`)
    console.log(`${'='.repeat(50)}\n`)
    return this.failed === 0
  }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function testPhysicsWorldSetup() {
  console.log('\n=== TEST: Physics World Setup ===')
  const { PhysicsWorld } = await import('./src/physics/World.js')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  Results.assert(world.jolt !== null, 'Jolt instance initialized')
  Results.assert(world.physicsSystem !== null, 'Physics system created')
  Results.assert(world.bodies.size === 0, 'No bodies at start')
  world.destroy()
}

async function testCapsuleCreation() {
  console.log('\n=== TEST: Capsule Creation ===')
  const { PhysicsWorld } = await import('./src/physics/World.js')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 1, 0], 80)
  Results.assert(capsuleId !== null && capsuleId !== undefined, 'Capsule created with valid ID')
  Results.assert(world.bodies.has(capsuleId), 'Capsule in bodies map')

  const pos = world.getBodyPosition(capsuleId)
  Results.assertClose(pos[1], 1, 0.01, 'Capsule Y position set to 1.0')

  world.destroy()
}

async function testGLBLoading() {
  console.log('\n=== TEST: GLB Loading ===')
  const { extractMeshFromGLB } = await import('./src/physics/GLBLoader.js')

  try {
    const mesh = extractMeshFromGLB(join(__dirname, 'world', 'kaira.glb'), 0)
    Results.assert(mesh !== null, 'GLB loaded successfully')
    Results.assert(mesh.vertices instanceof Float32Array, 'Vertices extracted as Float32Array')
    Results.assert(mesh.triangleCount > 0, `Triangles extracted: ${mesh.triangleCount}`)
  } catch (e) {
    Results.fail('GLB Loading', e.message)
  }
}

async function testStaticTrimesh() {
  console.log('\n=== TEST: Static Trimesh ===')
  const { PhysicsWorld } = await import('./src/physics/World.js')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  try {
    const trimeshId = world.addStaticTrimesh(join(__dirname, 'world', 'kaira.glb'), 0)
    Results.assert(trimeshId !== null, 'Trimesh created')
    Results.assert(world.bodies.has(trimeshId), 'Trimesh in bodies map')
  } catch (e) {
    Results.fail('Static Trimesh', e.message)
  }

  world.destroy()
}

async function testTickSystem() {
  console.log('\n=== TEST: Tick System ===')
  const { TickSystem } = await import('./src/netcode/TickSystem.js')
  const ticks = new TickSystem(128)

  let tickCount = 0
  ticks.onTick(() => { tickCount++ })
  ticks.start()

  await delay(100)
  ticks.stop()

  Results.assert(tickCount > 0, `Ticks fired: ${tickCount}`)
  Results.assertClose(tickCount, 12, 3, 'Tick rate approximately 128 TPS (12-16 ticks in 100ms)')
}

async function testSnapshotEncoding() {
  console.log('\n=== TEST: Snapshot Encoding ===')
  const { SnapshotEncoder } = await import('./src/netcode/SnapshotEncoder.js')

  const snap = {
    tick: 1,
    timestamp: Date.now(),
    players: [{
      id: 1,
      position: [1.234, 2.345, 3.456],
      rotation: [0.1, 0.2, 0.3, 0.9],
      velocity: [0.5, 1.5, 2.5],
      onGround: true,
      health: 100,
      inputSequence: 10
    }],
    entities: []
  }

  const encoded = SnapshotEncoder.encode(snap)
  const decoded = SnapshotEncoder.decode(encoded)

  Results.assert(decoded.players.length === 1, 'Player encoded/decoded')
  Results.assertClose(decoded.players[0].position[0], 1.234, 0.01, 'Position X quantized correctly')
  Results.assert(decoded.players[0].health === 100, 'Health preserved')
}

async function testServerBasics() {
  console.log('\n=== TEST: Server Basics ===')

  const server = await createServer({
    port: 18080,
    tickRate: 128,
    appsDir: './apps'
  })

  Results.assert(server !== null, 'Server created')
  Results.assert(typeof server.start === 'function', 'Server has start method')
  Results.assert(typeof server.stop === 'function', 'Server has stop method')
  Results.assert(server.getPlayerCount() === 0, 'No players at start')
}

async function testClientConnection() {
  console.log('\n=== TEST: Client Connection ===')

  const server = await createServer({
    port: 18081,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  try {
    const client = createClient({
      serverUrl: 'ws://localhost:18081',
      WebSocket: WS
    })

    Results.assert(client !== null, 'Client created')
    Results.assert(typeof client.connect === 'function', 'Client has connect method')

    await delay(500)
    server.stop()
  } catch (e) {
    Results.fail('Client Connection', e.message)
    server.stop()
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗')
  console.log('║      HYPERFY CLI PHYSICS & NETWORKING TESTS        ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  try {
    await testPhysicsWorldSetup()
    await testCapsuleCreation()
    await testGLBLoading()
    await testStaticTrimesh()
    await testTickSystem()
    await testSnapshotEncoding()
    await testServerBasics()
    await testClientConnection()
  } catch (e) {
    console.error('\nFATAL ERROR:', e)
    process.exit(1)
  }

  const success = Results.summary()
  process.exit(success ? 0 : 1)
}

runAllTests()
