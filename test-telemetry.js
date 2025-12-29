import { AIProviderHealth } from './src/server/health/AIProviderHealth.js'
import { Telemetry } from './src/server/telemetry/Telemetry.js'

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
}

console.log('AI Provider Health Check Demo')
console.log('='.repeat(50))

const aiHealth = new AIProviderHealth(logger)

aiHealth.addProvider('test-provider', {
  apiKey: 'test-key',
  healthEndpoint: 'https://httpbin.org/status/200',
})

aiHealth.addProvider('failing-provider', {
  apiKey: 'test-key',
  healthEndpoint: 'https://httpbin.org/status/500',
})

console.log('Running health checks...')
await aiHealth.checkAll()

console.log('\nProvider Status:')
console.log(JSON.stringify(aiHealth.getAllStatus(), null, 2))

console.log('\nHealthy Provider Fallback:')
const healthyProvider = aiHealth.getHealthyProvider()
console.log(`Best available provider: ${healthyProvider}`)

console.log('\n' + '='.repeat(50))
console.log('Telemetry System Demo')
console.log('='.repeat(50))

const telemetry = new Telemetry(logger, {
  batchInterval: 5000,
  enabled: true,
})

telemetry.trackAPICall('anthropic', '/v1/messages', 150, true)
telemetry.trackAPICall('openai', '/v1/chat/completions', 200, true)
telemetry.trackAPICall('anthropic', '/v1/messages', 180, false)

telemetry.trackError('TypeError', 'Runtime', 'Cannot read property of undefined')
telemetry.trackError('NetworkError', 'API', 'Connection timeout')

telemetry.trackEntitySpawn('entity-1', 'player')
telemetry.trackEntitySpawn('entity-2', 'npc')
telemetry.trackEntityDespawn('entity-1', 'player')

telemetry.trackPlayerConnection('player-123')
telemetry.trackPlayerConnection('player-456')
telemetry.trackPlayerDisconnection('player-123')

telemetry.trackWebSocketMessage('sent', 1024)
telemetry.trackWebSocketMessage('received', 2048)

console.log('\nTelemetry Stats:')
console.log(JSON.stringify(telemetry.getStats(), null, 2))

console.log('\nExported Data:')
const exported = telemetry.exportData()
console.log(`Batch size: ${exported.currentBatch.length} events`)
console.log(`Sample events:`)
exported.currentBatch.slice(0, 3).forEach((event, i) => {
  console.log(`  ${i + 1}. ${event.type} - ${event.timestamp}`)
})

console.log('\nDemo complete!')
