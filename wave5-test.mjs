import { boot } from './src/sdk/server.js'
import { WebSocket } from 'ws'

async function runWave5Test() {
  console.log('[WAVE5] Starting cold boot test...')
  console.log('[WAVE5] Part 1: Cold Boot Setup')

  try {
    // Start server
    console.log('[WAVE5] Starting fresh server...')
    const server = await boot()
    console.log('[WAVE5] Server started successfully')

    // Get initial stats
    const stats = server.getAllStats()
    console.log('[WAVE5] Initial stats:', JSON.stringify(stats, null, 2))

    // Wait a moment for tick system to stabilize
    await new Promise(r => setTimeout(r, 2000))

    console.log('[WAVE5] Part 2: Client Connection Test')

    // Connect a test client
    const ws = new WebSocket('ws://localhost:8080/ws')

    let connected = false
    let messageCount = 0
    let worldReceived = false

    ws.on('open', () => {
      console.log('[WAVE5] Client connected to ws://localhost:8080/ws')
      connected = true
    })

    ws.on('message', (data) => {
      messageCount++
      console.log(`[WAVE5] Received message #${messageCount}, size: ${data.byteLength} bytes`)

      // First message should be world state
      if (messageCount === 1) {
        worldReceived = true
        console.log('[WAVE5] World state received')
      }
    })

    ws.on('error', (err) => {
      console.error('[WAVE5] WebSocket error:', err.message)
    })

    ws.on('close', () => {
      console.log('[WAVE5] WebSocket closed')
    })

    // Wait 30 seconds for test
    await new Promise(r => setTimeout(r, 30000))

    console.log('[WAVE5] Part 3: Production Readiness Check')
    const finalStats = server.getAllStats()
    console.log('[WAVE5] Final stats:', JSON.stringify(finalStats, null, 2))

    const snapshot = server.getSnapshot()
    console.log('[WAVE5] Snapshot entities:', snapshot ? snapshot.entities ? snapshot.entities.length : 0 : 'none')

    // Close client
    ws.close()

    // Stop server
    console.log('[WAVE5] Stopping server...')
    server.stop()
    console.log('[WAVE5] Server stopped')

    console.log('[WAVE5] TEST COMPLETE')
    process.exit(0)

  } catch (err) {
    console.error('[WAVE5] ERROR:', err)
    process.exit(1)
  }
}

runWave5Test()
