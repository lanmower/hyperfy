import { AIProviderHealth } from './src/server/health/AIProviderHealth.js'

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
}

console.log('AI Provider Fallback Mechanism Demo')
console.log('='.repeat(60))

const aiHealth = new AIProviderHealth(logger)

aiHealth.addProvider('primary', {
  apiKey: 'test',
  healthEndpoint: 'https://httpbin.org/status/200',
})

aiHealth.addProvider('secondary', {
  apiKey: 'test',
  healthEndpoint: 'https://httpbin.org/status/200',
})

aiHealth.addProvider('tertiary', {
  apiKey: 'test',
  healthEndpoint: 'https://httpbin.org/status/200',
})

console.log('\nInitial check - all providers healthy')
await aiHealth.checkAll()

let status = aiHealth.getAllStatus()
console.log('\nProvider Status:')
Object.entries(status).forEach(([name, data]) => {
  console.log(`  ${name}: ${data.status} (${data.successRate}% success)`)
})

let best = aiHealth.getHealthyProvider()
console.log(`\nBest provider: ${best}`)

console.log('\n' + '='.repeat(60))
console.log('Simulating primary provider failure...')

aiHealth.providers.get('primary').status = 'DOWN'
aiHealth.providers.get('primary').failureCount = 5
aiHealth.providers.get('primary').successCount = 0
aiHealth.providers.get('primary').successRate = 0

best = aiHealth.getHealthyProvider()
console.log(`Best provider after primary failure: ${best}`)

console.log('\n' + '='.repeat(60))
console.log('Simulating secondary provider degradation...')

aiHealth.providers.get('secondary').status = 'DEGRADED'
aiHealth.providers.get('secondary').failureCount = 2
aiHealth.providers.get('secondary').successCount = 8
aiHealth.providers.get('secondary').successRate = 80

best = aiHealth.getHealthyProvider()
console.log(`Best provider after secondary degradation: ${best}`)

status = aiHealth.getAllStatus()
console.log('\nFinal Provider Status:')
Object.entries(status).forEach(([name, data]) => {
  console.log(`  ${name}: ${data.status} (${data.successRate}% success)`)
})

console.log('\n' + '='.repeat(60))
console.log('Fallback Mechanism Demonstration:')
console.log('1. Primary provider DOWN - switches to secondary')
console.log('2. Secondary provider DEGRADED - prefers tertiary (UP)')
console.log('3. No healthy providers - returns null')

console.log('\nExcluding tertiary from selection...')
best = aiHealth.getHealthyProvider(['tertiary'])
console.log(`Best provider excluding tertiary: ${best}`)

console.log('\nSimulating all providers down...')
aiHealth.providers.get('secondary').status = 'DOWN'
aiHealth.providers.get('tertiary').status = 'DOWN'

best = aiHealth.getHealthyProvider()
console.log(`Best provider when all down: ${best}`)

console.log('\nDemo complete!')
