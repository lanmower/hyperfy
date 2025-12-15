// Visual demonstration of stderr output formatting
import { errorObserver } from '../src/server/services/ErrorObserver.js'
import { ErrorLevels } from '../src/core/schemas/ErrorEvent.schema.js'

console.log('\n')
console.log('═══════════════════════════════════════════════════════════════')
console.log('  ERROR OBSERVATION SYSTEM - STDERR OUTPUT DEMONSTRATION')
console.log('═══════════════════════════════════════════════════════════════')
console.log('\n')

console.log('Simulating client errors from multiple users...\n')

setTimeout(() => {
  errorObserver.recordClientError(
    'client-alice-001',
    {
      level: ErrorLevels.ERROR,
      category: 'app.script.runtime',
      message: 'ReferenceError: config is not defined',
      stack: `ReferenceError: config is not defined
    at MetaverseUI.js:127:15
    at updateUI (app.js:45:20)
    at render (renderer.js:89:12)`,
      context: {
        app: 'MetaverseUI',
        entity: 'e-ui-001'
      }
    },
    {
      userId: 'alice-123',
      userName: 'AliceWonderland',
      clientIP: '192.168.1.101'
    }
  )
}, 100)

setTimeout(() => {
  errorObserver.recordClientError(
    'client-bob-002',
    {
      level: ErrorLevels.ERROR,
      category: 'physics.collision.fatal',
      message: 'Uncaught TypeError: body is null in rigid body update',
      stack: `TypeError: body is null
    at updateDynamics (physics.js:789:12)
    at PhysicsEngine.step (engine.js:123:8)
    at World.fixedUpdate (world.js:456:22)`,
      context: {
        app: 'PhysicsEngine',
        entity: 'b-physics-456'
      },
      count: 3
    },
    {
      userId: 'bob-456',
      userName: 'BobBuilder',
      clientIP: '192.168.1.102'
    }
  )
}, 200)

setTimeout(() => {
  errorObserver.recordClientError(
    'client-alice-001',
    {
      level: ErrorLevels.WARN,
      category: 'network.timeout',
      message: 'Failed to fetch blueprint after 30s',
      stack: null,
      context: {
        app: 'WorldLoader',
        entity: 'e-loader-789'
      }
    },
    {
      userId: 'alice-123',
      userName: 'AliceWonderland',
      clientIP: '192.168.1.101'
    }
  )
}, 300)

setTimeout(() => {
  errorObserver.recordClientError(
    'client-charlie-003',
    {
      level: ErrorLevels.ERROR,
      category: 'app.model.load',
      message: 'Failed to load GLTF: Invalid mesh data',
      stack: `Error: Invalid mesh data
    at GLTFLoader.parse (loader.js:234:15)
    at ModelSystem.loadModel (models.js:67:20)`,
      context: {
        app: 'ModelLoader',
        entity: 'e-model-321'
      }
    },
    {
      userId: 'charlie-789',
      userName: 'CharlieChaplin',
      clientIP: '192.168.1.103'
    }
  )
}, 400)

setTimeout(() => {
  console.log('\n')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  ERROR STATISTICS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('\n')

  const stats = errorObserver.getErrorStats()

  console.log('Total Errors:', stats.total)
  console.log('Last Minute:', stats.lastMinute)
  console.log('Active Clients:', stats.activeClients)
  console.log('\n')

  console.log('By Level:')
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`)
  })
  console.log('\n')

  console.log('By Category:')
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })
  console.log('\n')

  console.log('Top Error Patterns:')
  stats.topPatterns.forEach((pattern, i) => {
    console.log(`  ${i + 1}. [${pattern.category}] ${pattern.message.substring(0, 50)}...`)
    console.log(`     Count: ${pattern.count}, Clients: ${pattern.affectedClients}`)
  })

  console.log('\n')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DEMONSTRATION COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('\n')

  console.log('This is how errors will appear in production when clients')
  console.log('experience issues. All errors are:')
  console.log('  • Captured automatically from SDK')
  console.log('  • Formatted with full context')
  console.log('  • Output to stderr in real-time')
  console.log('  • Aggregated for pattern detection')
  console.log('  • Available for export and analysis')
  console.log('\n')

  errorObserver.clearErrors()
}, 600)
