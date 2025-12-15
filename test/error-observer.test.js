// Test error observer system with stderr output
import { errorObserver } from '../src/server/services/ErrorObserver.js'
import { errorFormatter } from '../src/server/utils/ErrorFormatter.js'
import { ErrorLevels } from '../src/core/schemas/ErrorEvent.schema.js'

console.log('Testing Error Observer System\n')

const mockClient1 = 'client-alice-123'
const mockClient2 = 'client-bob-456'

console.log('1. Recording client errors...\n')

errorObserver.recordClientError(
  mockClient1,
  {
    id: 'err-1',
    level: ErrorLevels.ERROR,
    category: 'app.script.runtime',
    message: 'ReferenceError: config is not defined',
    stack: 'ReferenceError: config is not defined\n    at MetaverseUI.js:127:15\n    at updateUI (app.js:45:20)',
    context: {
      app: 'MetaverseUI',
      entity: 'e123'
    }
  },
  {
    userId: 'alice',
    userName: 'Alice',
    clientIP: '192.168.1.10'
  }
)

errorObserver.recordClientError(
  mockClient2,
  {
    id: 'err-2',
    level: ErrorLevels.ERROR,
    category: 'physics.collision.fatal',
    message: 'Uncaught TypeError: body is null in rigid body update',
    stack: 'TypeError: body is null\n    at updateDynamics (physics.js:789:12)\n    at PhysicsEngine.step (engine.js:123:8)',
    context: {
      app: 'PhysicsEngine',
      entity: 'b456'
    },
    count: 3
  },
  {
    userId: 'bob',
    userName: 'Bob',
    clientIP: '192.168.1.20'
  }
)

errorObserver.recordClientError(
  mockClient1,
  {
    id: 'err-3',
    level: ErrorLevels.WARN,
    category: 'network.timeout',
    message: 'Failed to fetch blueprint after 30s',
    context: {
      app: 'WorldLoader'
    }
  },
  {
    userId: 'alice',
    userName: 'Alice',
    clientIP: '192.168.1.10'
  }
)

console.log('\n2. Getting error statistics...\n')

const stats = errorObserver.getErrorStats()
console.log('Statistics:')
console.log(JSON.stringify(stats, null, 2))

console.log('\n3. Testing error summary...\n')

const summary = errorFormatter.formatErrorSummary({
  errors: stats.errors,
  warnings: stats.warnings,
  critical: stats.critical,
  byCategory: stats.byCategory
})

process.stderr.write(summary)

console.log('\n4. Testing alert formatting...\n')

const alert = errorFormatter.formatAlert(
  'High error rate detected - 15 errors in last minute',
  'WARNING'
)
process.stderr.write(alert)

const criticalAlert = errorFormatter.formatAlert(
  'Physics system failure - multiple cascading errors',
  'CRITICAL'
)
process.stderr.write(criticalAlert)

console.log('\n5. Getting errors by client...\n')

const aliceErrors = errorObserver.getErrorsByClient(mockClient1)
console.log(`Alice has ${aliceErrors.length} errors`)

const bobErrors = errorObserver.getErrorsByClient(mockClient2)
console.log(`Bob has ${bobErrors.length} errors`)

console.log('\n6. Getting errors by category...\n')

const scriptErrors = errorObserver.getErrorsByCategory('app.script.runtime')
console.log(`Script runtime errors: ${scriptErrors.length}`)

const physicsErrors = errorObserver.getErrorsByCategory('physics.collision.fatal')
console.log(`Physics errors: ${physicsErrors.length}`)

console.log('\n7. Testing error pattern detection...\n')

const patterns = errorObserver.getErrorPatterns()
console.log(`Detected ${patterns.length} unique error patterns`)
patterns.forEach((pattern, i) => {
  console.log(`  ${i + 1}. [${pattern.category}] ${pattern.message.substring(0, 60)}`)
  console.log(`     Count: ${pattern.count}, Clients: ${pattern.clients.size}`)
})

console.log('\n8. Exporting errors...\n')

const exported = errorObserver.exportErrors('summary')
console.log(exported)

console.log('\n9. Testing alert thresholds (simulating high error rate)...\n')

for (let i = 0; i < 12; i++) {
  errorObserver.recordClientError(
    `client-${i}`,
    {
      id: `err-high-${i}`,
      level: ErrorLevels.ERROR,
      category: 'network.disconnected',
      message: 'WebSocket connection lost',
      context: {}
    },
    {
      userId: `user-${i}`,
      userName: `User${i}`,
      clientIP: `192.168.1.${100 + i}`
    }
  )
}

console.log('\n10. Final statistics...\n')

const finalStats = errorObserver.getErrorStats()
console.log(JSON.stringify(finalStats, null, 2))

console.log('\n11. Clearing errors...\n')

const cleared = errorObserver.clearErrors()
console.log(`Cleared ${cleared} errors`)

const afterClear = errorObserver.getErrorStats()
console.log('After clear:', JSON.stringify(afterClear, null, 2))

console.log('\nTest completed successfully!')
