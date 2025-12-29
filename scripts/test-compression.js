import { Compressor } from '../src/core/systems/network/Compressor.js'

const compressor = new Compressor()

const testData = {
  snapshot: {
    entities: Array(100).fill(null).map((_, i) => ({
      id: `entity-${i}`,
      type: 'app',
      blueprint: 'test-blueprint',
      data: {
        position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        scale: [1, 1, 1],
        visible: true,
      },
    })),
    blueprints: Array(20).fill(null).map((_, i) => ({
      id: `blueprint-${i}`,
      name: `Test Blueprint ${i}`,
      model: `model-${i}.glb`,
      script: 'function update() { /* test */ }',
      props: {
        color: '#ffffff',
        size: 1.0,
        enabled: true,
      },
    })),
  },
}

console.log('=== COMPRESSION TEST ===\n')

const originalJson = JSON.stringify(testData)
const originalSize = Buffer.byteLength(originalJson)

console.log('Original Data:')
console.log('  Size:', (originalSize / 1024).toFixed(2), 'KB')
console.log('  Entities:', testData.snapshot.entities.length)
console.log('  Blueprints:', testData.snapshot.blueprints.length)
console.log('')

const compressed = compressor.compress(testData)

console.log('Compressed Data:')
console.log('  Compressed:', compressed.compressed)
if (compressed.compressed) {
  const compressedSize = Buffer.byteLength(compressed.data)
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
  console.log('  Size:', (compressedSize / 1024).toFixed(2), 'KB')
  console.log('  Ratio:', ratio + '%', 'reduction')
  console.log('  Savings:', ((originalSize - compressedSize) / 1024).toFixed(2), 'KB')
} else {
  console.log('  Not compressed (payload too small)')
}
console.log('')

const decompressed = compressor.decompress(compressed)
const matches = JSON.stringify(decompressed) === JSON.stringify(testData)

console.log('Decompression:')
console.log('  Success:', matches)
console.log('  Data Integrity:', matches ? 'PASS' : 'FAIL')
console.log('')

const stats = compressor.getStats()
console.log('Compressor Stats:')
console.log('  Compressed:', stats.compressed)
console.log('  Uncompressed:', stats.uncompressed)
console.log('  Ratio:', stats.ratio)
console.log('  Avg Original:', (stats.avgOriginal / 1024).toFixed(2), 'KB')
console.log('  Avg Compressed:', (stats.avgCompressed / 1024).toFixed(2), 'KB')
console.log('')

const smallData = { ping: Date.now() }
const smallCompressed = compressor.compress(smallData)
console.log('Small Payload Test (<1KB):')
console.log('  Original:', JSON.stringify(smallData))
console.log('  Compressed:', smallCompressed.compressed)
console.log('  Reason:', 'Skip compression for payloads <1KB')
console.log('')

process.exit(matches ? 0 : 1)
