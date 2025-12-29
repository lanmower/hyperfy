import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../')

const checks = [
  {
    name: 'Bundle minification enabled',
    file: 'scripts/build-client.mjs',
    test: async () => {
      const content = await fs.readFile(path.join(rootDir, 'scripts/build-client.mjs'), 'utf8')
      return content.includes('minify: !dev')
    },
  },
  {
    name: 'Network compression implemented',
    file: 'src/core/systems/network/Compressor.js',
    test: async () => {
      return fs.pathExists(path.join(rootDir, 'src/core/systems/network/Compressor.js'))
    },
  },
  {
    name: 'ServerNetwork uses compression',
    file: 'src/core/systems/ServerNetwork.js',
    test: async () => {
      const content = await fs.readFile(path.join(rootDir, 'src/core/systems/ServerNetwork.js'), 'utf8')
      return content.includes('Compressor') && content.includes('this.compressor')
    },
  },
  {
    name: 'ClientNetwork uses compression',
    file: 'src/core/systems/ClientNetwork.js',
    test: async () => {
      const content = await fs.readFile(path.join(rootDir, 'src/core/systems/ClientNetwork.js'), 'utf8')
      return content.includes('Compressor') && content.includes('this.compressor')
    },
  },
  {
    name: 'Physics ground check optimization',
    file: 'src/core/entities/player/PlayerPhysics.js',
    test: async () => {
      const content = await fs.readFile(path.join(rootDir, 'src/core/entities/player/PlayerPhysics.js'), 'utf8')
      return content.includes('groundCheckInterval') && content.includes('frameCount % this.groundCheckInterval')
    },
  },
  {
    name: 'Stage object pooling',
    file: 'src/core/systems/Stage.js',
    test: async () => {
      const content = await fs.readFile(path.join(rootDir, 'src/core/systems/Stage.js'), 'utf8')
      return content.includes('ObjectPool') && content.includes('this.objectPool')
    },
  },
  {
    name: 'Memory profiler available',
    file: 'scripts/memory-profile.js',
    test: async () => {
      return fs.pathExists(path.join(rootDir, 'scripts/memory-profile.js'))
    },
  },
  {
    name: 'Bundle analyzer available',
    file: 'scripts/analyze-bundle.js',
    test: async () => {
      return fs.pathExists(path.join(rootDir, 'scripts/analyze-bundle.js'))
    },
  },
]

async function verify() {
  console.log('=== OPTIMIZATION VERIFICATION ===\n')

  let passed = 0
  let failed = 0

  for (const check of checks) {
    try {
      const result = await check.test()
      if (result) {
        console.log('✓', check.name)
        passed++
      } else {
        console.log('✗', check.name, '- FAILED')
        failed++
      }
    } catch (err) {
      console.log('✗', check.name, '- ERROR:', err.message)
      failed++
    }
  }

  console.log('')
  console.log('Results:', passed, 'passed,', failed, 'failed')
  console.log('')

  if (failed === 0) {
    console.log('All optimizations verified successfully!')
  } else {
    console.log('Some optimizations failed verification.')
  }

  process.exit(failed > 0 ? 1 : 0)
}

verify().catch(err => {
  console.error('Verification failed:', err)
  process.exit(1)
})
