// Integration test for unified error event system

import { ErrorHandler } from '../hypersdk/src/utils/ErrorHandler.js'
import { ErrorMonitor } from '../src/core/systems/ErrorMonitor.js'
import { ErrorEventBus } from '../src/core/utils/ErrorEventBus.js'
import { createErrorEvent, serializeErrorEvent, deserializeErrorEvent, ErrorLevels, ErrorSources } from '../src/core/schemas/ErrorEvent.schema.js'

function createMockWorld(isServer = false) {
  return {
    isServer,
    isClient: !isServer,
    network: null,
    entities: { count: 0 },
    blueprints: { count: 0 },
    events: {
      emit: () => {}
    }
  }
}

console.log('Testing unified error event system...\n')

// Test 1: ErrorEvent schema creation
console.log('Test 1: ErrorEvent schema creation')
const testError = new Error('Test error message')
const context = {
  category: 'app.load',
  source: ErrorSources.SDK,
  app: 'test-app',
  user: 'test-user'
}
const event = createErrorEvent(testError, context, ErrorLevels.ERROR)

console.log('  Created event:', {
  id: event.id,
  level: event.level,
  category: event.category,
  source: event.source,
  message: event.message,
  count: event.count
})
console.assert(event.level === ErrorLevels.ERROR, 'Level should be ERROR')
console.assert(event.category === 'app.load', 'Category should be app.load')
console.assert(event.source === ErrorSources.SDK, 'Source should be SDK')
console.assert(event.message === 'Test error message', 'Message should match')
console.log('  PASS\n')

// Test 2: Error event serialization/deserialization
console.log('Test 2: Error event serialization/deserialization')
const serialized = serializeErrorEvent(event)
const deserialized = deserializeErrorEvent(serialized)

console.log('  Serialized keys:', Object.keys(serialized))
console.log('  Deserialized event:', {
  id: deserialized.id,
  level: deserialized.level,
  category: deserialized.category,
  message: deserialized.message
})
console.assert(deserialized.id === event.id, 'ID should match')
console.assert(deserialized.level === event.level, 'Level should match')
console.assert(deserialized.category === event.category, 'Category should match')
console.assert(deserialized.message === event.message, 'Message should match')
console.log('  PASS\n')

// Test 3: ErrorEventBus functionality
console.log('Test 3: ErrorEventBus functionality')
const errorBus = new ErrorEventBus()
let capturedEvents = []

errorBus.register((event, isDuplicate) => {
  capturedEvents.push({ event, isDuplicate })
})

errorBus.emit(new Error('Bus test error'), { category: 'network' }, ErrorLevels.ERROR)
errorBus.emit(new Error('Bus test error'), { category: 'network' }, ErrorLevels.ERROR) // Duplicate

console.log('  Captured events:', capturedEvents.length)
console.log('  First event duplicate:', capturedEvents[0].isDuplicate)
console.log('  Second event duplicate:', capturedEvents[1].isDuplicate)
console.assert(capturedEvents.length === 2, 'Should capture 2 events')
console.assert(capturedEvents[0].isDuplicate === false, 'First should not be duplicate')
console.assert(capturedEvents[1].isDuplicate === true, 'Second should be duplicate')

const stats = errorBus.getStats()
console.log('  Bus stats:', {
  total: stats.total,
  unique: stats.unique,
  byLevel: stats.byLevel
})
console.assert(stats.total === 2, 'Total should be 2')
console.assert(stats.unique === 1, 'Unique should be 1')
console.log('  PASS\n')

// Test 4: SDK ErrorHandler integration
console.log('Test 4: SDK ErrorHandler integration')
const errorHandler = new ErrorHandler()
let networkSentEvents = []

errorHandler.setNetworkSender((errorEvent) => {
  networkSentEvents.push(errorEvent)
})

errorHandler.handleError(new Error('SDK error'), { category: 'app.script.runtime' })

console.log('  Network sent events:', networkSentEvents.length)
console.log('  Sent event:', {
  id: networkSentEvents[0]?.id,
  level: networkSentEvents[0]?.level,
  message: networkSentEvents[0]?.message
})
console.assert(networkSentEvents.length === 1, 'Should send 1 event')
console.assert(networkSentEvents[0].message === 'SDK error', 'Message should match')
console.assert(networkSentEvents[0].source === ErrorSources.SDK, 'Source should be SDK')
console.log('  PASS\n')

// Test 5: ErrorMonitor integration
console.log('Test 5: ErrorMonitor integration')
const mockWorld = createMockWorld(true) // Server-side
const errorMonitor = new ErrorMonitor(mockWorld)

let monitorCapturedEvents = []
mockWorld.events.emit = (eventName, eventData) => {
  if (eventName === 'errorCaptured') {
    monitorCapturedEvents.push(eventData)
  }
}

errorMonitor.captureError('app.load', { message: 'Monitor test error' }, null)

console.log('  Monitor captured events:', monitorCapturedEvents.length)
console.log('  Captured event:', {
  type: monitorCapturedEvents[0]?.type,
  side: monitorCapturedEvents[0]?.side,
  level: monitorCapturedEvents[0]?.level
})
console.assert(monitorCapturedEvents.length === 1, 'Should capture 1 event')
console.assert(monitorCapturedEvents[0].type === 'app.load', 'Type should match')
console.assert(monitorCapturedEvents[0].side === 'server', 'Side should be server')
console.log('  PASS\n')

// Test 6: Client error forwarding to server
console.log('Test 6: Client error forwarding to server')
const clientError = createErrorEvent(
  new Error('Client error'),
  { category: 'network', source: ErrorSources.CLIENT },
  ErrorLevels.ERROR
)

const serializedClientError = serializeErrorEvent(clientError)
errorMonitor.receiveClientError({
  error: serializedClientError,
  realTime: true
})

const serverErrors = errorMonitor.state.get('errors')
console.log('  Server received errors:', serverErrors.length)
console.log('  Last error:', {
  type: serverErrors[serverErrors.length - 1]?.type,
  side: serverErrors[serverErrors.length - 1]?.side,
  level: serverErrors[serverErrors.length - 1]?.level
})
console.assert(serverErrors.length >= 2, 'Should have at least 2 errors')
console.assert(serverErrors[serverErrors.length - 1].side === 'client', 'Side should be client')
console.log('  PASS\n')

// Test 7: Error statistics
console.log('Test 7: Error statistics')
const monitorStats = errorMonitor.getStats()

console.log('  Monitor stats:', {
  total: monitorStats.total,
    recent: monitorStats.recent,
    unified: {
      total: monitorStats.unified.total,
      unique: monitorStats.unified.unique
    }
})
console.assert(monitorStats.total >= 2, 'Should have errors')
console.assert(monitorStats.unified, 'Should have unified stats')
console.log('  PASS\n')

console.log('All tests passed!')
