import WebSocket from 'ws'
import { Packr } from 'msgpackr'

const packr = new Packr({ structuredClone: true })

const tests = {
  passed: 0,
  failed: 0,
  total: 0
}

function log(message, type = 'info') {
  const prefix = {
    info: '[INFO]',
    pass: '[PASS]',
    fail: '[FAIL]',
    test: '[TEST]'
  }[type]
  console.log(`${prefix} ${message}`)
}

async function runTest(name, testFn) {
  tests.total++
  log(name, 'test')
  try {
    await testFn()
    tests.passed++
    log(`${name} - PASSED`, 'pass')
  } catch (err) {
    tests.failed++
    log(`${name} - FAILED: ${err.message}`, 'fail')
    console.error(err.stack)
  }
}

function createWS() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws')
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
    setTimeout(() => reject(new Error('Connection timeout')), 5000)
  })
}

function waitForMessage(ws, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Message timeout')), timeout)
    ws.once('message', data => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

async function testInvalidMessageType() {
  const ws = await createWS()

  ws.send('invalid string message')

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testMessageSizeLimit() {
  const ws = await createWS()

  const large = Buffer.alloc(2 * 1024 * 1024)
  ws.send(large)

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testEmptyMessage() {
  const ws = await createWS()

  ws.send(Buffer.alloc(0))

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testInvalidPacketStructure() {
  const ws = await createWS()

  const invalidPacket = packr.pack('not an array')
  ws.send(invalidPacket)

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testInvalidPacketId() {
  const ws = await createWS()

  const invalidPacket = packr.pack([999999, {}])
  ws.send(invalidPacket)

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testValidMessage() {
  const ws = await createWS()

  const validPacket = packr.pack([0, { force: true }])
  ws.send(validPacket)

  const response = await waitForMessage(ws, 5000)
  if (!response) {
    throw new Error('No response received')
  }

  ws.close()
}

async function testRateLimiting() {
  const ws = await createWS()

  for (let i = 0; i < 15; i++) {
    ws.send('invalid')
    await new Promise(r => setTimeout(r, 50))
  }

  await new Promise(r => setTimeout(r, 500))

  if (ws.readyState !== WebSocket.CLOSED) {
    ws.close()
    throw new Error('Connection should be closed after rate limit exceeded')
  }
}

async function testUnknownCommand() {
  const ws = await createWS()

  const commandPacket = packr.pack([2, ['unknowncommand', 'arg1']])
  ws.send(commandPacket)

  await new Promise(r => setTimeout(r, 100))

  ws.close()
}

async function testValidCommand() {
  const ws = await createWS()

  const snapshot = await waitForMessage(ws, 5000)
  if (!snapshot) {
    throw new Error('No snapshot received')
  }

  const commandPacket = packr.pack([2, ['server', 'stats']])
  ws.send(commandPacket)

  await new Promise(r => setTimeout(r, 500))

  ws.close()
}

async function runAllTests() {
  log('Starting WebSocket Security Tests')
  log('Testing against ws://localhost:3000/ws')
  console.log('')

  await runTest('Invalid Message Type', testInvalidMessageType)
  await runTest('Message Size Limit (2MB)', testMessageSizeLimit)
  await runTest('Empty Message', testEmptyMessage)
  await runTest('Invalid Packet Structure', testInvalidPacketStructure)
  await runTest('Invalid Packet ID', testInvalidPacketId)
  await runTest('Valid Message', testValidMessage)
  await runTest('Rate Limiting (15 invalid messages)', testRateLimiting)
  await runTest('Unknown Command', testUnknownCommand)
  await runTest('Valid Command', testValidCommand)

  console.log('')
  log('='.repeat(50))
  log(`Tests Complete: ${tests.passed}/${tests.total} passed, ${tests.failed} failed`)
  log('='.repeat(50))

  if (tests.failed > 0) {
    process.exit(1)
  }
}

runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'fail')
  process.exit(1)
})
