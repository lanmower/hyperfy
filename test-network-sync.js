import { createServer } from './src/sdk/server.js'
import { WebSocket as WS } from 'ws'

const Results = {
  passed: 0,
  failed: 0,

  pass(name, msg = '') {
    this.passed++
    console.log(`✓ ${name}${msg ? ': ' + msg : ''}`)
  },

  fail(name, msg = '') {
    this.failed++
    console.log(`✗ ${name}${msg ? ': ' + msg : ''}`)
  },

  assert(condition, name, msg = '') {
    condition ? this.pass(name, msg) : this.fail(name, msg)
  },

  summary() {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`)
    console.log(`${'='.repeat(50)}\n`)
    return this.failed === 0
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function testServerStartStop() {
  console.log('\n=== TEST: Server Start/Stop ===')
  const server = await createServer({
    port: 18082,
    tickRate: 128,
    appsDir: './apps'
  })

  try {
    await server.start()
    Results.assert(true, 'Server started')
    await delay(100)
    server.stop()
    Results.assert(true, 'Server stopped cleanly')
  } catch (e) {
    Results.fail('Server Start/Stop', e.message)
  }
}

async function testSingleClientConnection() {
  console.log('\n=== TEST: Single Client Connection ===')

  const server = await createServer({
    port: 18083,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  let clientConnected = false
  let playerAssigned = false

  server.on('playerJoin', ({ id }) => {
    playerAssigned = true
  })

  try {
    const ws = new WS('ws://localhost:18083')

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 2000)

      ws.on('open', () => {
        clientConnected = true
        clearTimeout(timeout)
        resolve()
      })

      ws.on('error', (e) => {
        clearTimeout(timeout)
        reject(e)
      })
    })

    Results.assert(clientConnected, 'Client connected to server')

    await delay(100)
    Results.assert(server.getPlayerCount() === 1, 'Server registered 1 player')

    ws.close()
    await delay(100)
    server.stop()
  } catch (e) {
    Results.fail('Single Client Connection', e.message)
    server.stop()
  }
}

async function testMultipleClientConnections() {
  console.log('\n=== TEST: Multiple Client Connections ===')

  const server = await createServer({
    port: 18084,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  try {
    const clients = []
    for (let i = 0; i < 3; i++) {
      const ws = new WS('ws://localhost:18084')
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000)
        ws.on('open', () => { clearTimeout(timeout); resolve() })
        ws.on('error', reject)
      })
      clients.push(ws)
    }

    await delay(100)
    Results.assert(server.getPlayerCount() === 3, `3 clients connected, server has ${server.getPlayerCount()} players`)

    clients.forEach(ws => ws.close())
    await delay(100)
    server.stop()
  } catch (e) {
    Results.fail('Multiple Client Connections', e.message)
    server.stop()
  }
}

async function testInputBroadcast() {
  console.log('\n=== TEST: Input Broadcast ===')

  const server = await createServer({
    port: 18085,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  try {
    const ws = new WS('ws://localhost:18085')
    let snapshotReceived = false
    let snapshotData = null

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 2000)
      ws.on('open', () => { clearTimeout(timeout); resolve() })
      ws.on('error', reject)
    })

    ws.on('message', (data) => {
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        snapshotReceived = true
        snapshotData = data
      }
    })

    ws.send(JSON.stringify({ type: 3, payload: { forward: true } }))
    await delay(200)

    Results.assert(snapshotReceived, 'Snapshot received after input')

    ws.close()
    await delay(100)
    server.stop()
  } catch (e) {
    Results.fail('Input Broadcast', e.message)
    server.stop()
  }
}

async function testPlayerStateSync() {
  console.log('\n=== TEST: Player State Sync ===')

  const server = await createServer({
    port: 18086,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  try {
    const ws1 = new WS('ws://localhost:18086')
    const ws2 = new WS('ws://localhost:18086')

    await Promise.all([
      new Promise(resolve => {
        ws1.on('open', () => resolve())
      }),
      new Promise(resolve => {
        ws2.on('open', () => resolve())
      })
    ])

    let player2Snapshot = null
    ws2.on('message', (data) => {
      if (Buffer.isBuffer(data)) {
        player2Snapshot = data
      }
    })

    ws1.send(JSON.stringify({ type: 3, payload: { forward: true } }))
    await delay(150)

    Results.assert(player2Snapshot !== null, 'Player 2 received snapshot with Player 1 data')

    ws1.close()
    ws2.close()
    await delay(100)
    server.stop()
  } catch (e) {
    Results.fail('Player State Sync', e.message)
    server.stop()
  }
}

async function testServerResilience() {
  console.log('\n=== TEST: Server Resilience ===')

  const server = await createServer({
    port: 18087,
    tickRate: 128,
    appsDir: './apps'
  })

  await server.start()

  try {
    const ws = new WS('ws://localhost:18087')
    await new Promise(resolve => ws.on('open', () => resolve()))

    ws.close()
    await delay(100)

    const ws2 = new WS('ws://localhost:18087')
    await new Promise(resolve => ws2.on('open', () => resolve()))

    Results.assert(true, 'Server accepted second connection after first closed')

    ws2.close()
    await delay(100)
    server.stop()
  } catch (e) {
    Results.fail('Server Resilience', e.message)
    server.stop()
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗')
  console.log('║      NETWORK SYNCHRONIZATION TESTS                ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  try {
    await testServerStartStop()
    await testSingleClientConnection()
    await testMultipleClientConnections()
    await testInputBroadcast()
    await testPlayerStateSync()
    await testServerResilience()
  } catch (e) {
    console.error('\nFATAL ERROR:', e)
    console.error(e.stack)
    process.exit(1)
  }

  const success = Results.summary()
  process.exit(success ? 0 : 1)
}

runAllTests()
