import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../')

async function analyzeBundle() {
  const metaPath = path.join(rootDir, 'build/meta.json')

  if (!await fs.pathExists(metaPath)) {
    console.error('No metafile found. Run client build first with metafile enabled.')
    process.exit(1)
  }

  const meta = await fs.readJson(metaPath)

  const outputs = Object.entries(meta.outputs)
    .filter(([path]) => path.endsWith('.js'))
    .map(([path, info]) => ({
      path: path.replace('build/', ''),
      bytes: info.bytes,
      size: formatBytes(info.bytes),
      imports: info.imports?.length || 0,
    }))
    .sort((a, b) => b.bytes - a.bytes)

  const inputs = Object.entries(meta.inputs)
    .map(([path, info]) => ({
      path,
      bytes: info.bytes,
      size: formatBytes(info.bytes),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20)

  const totalBytes = outputs.reduce((sum, o) => sum + o.bytes, 0)
  const totalSize = formatBytes(totalBytes)

  console.log('\n=== BUNDLE ANALYSIS ===\n')

  console.log('Total Bundle Size:', totalSize)
  console.log('Output Files:', outputs.length)
  console.log('')

  console.log('Largest Output Files:')
  outputs.forEach(o => {
    const pct = ((o.bytes / totalBytes) * 100).toFixed(1)
    console.log(`  ${o.size.padEnd(10)} (${pct.padStart(5)}%) ${o.path}`)
  })

  console.log('\nLargest Input Modules (Top 20):')
  inputs.forEach(m => {
    console.log(`  ${m.size.padEnd(10)} ${m.path}`)
  })

  const warnings = []
  if (totalBytes > 3 * 1024 * 1024) {
    warnings.push(`FAIL: Bundle exceeds 3MB limit (${totalSize})`)
  } else if (totalBytes > 2 * 1024 * 1024) {
    warnings.push(`WARN: Bundle exceeds 2MB budget (${totalSize})`)
  }

  const largeModules = inputs.filter(m => m.bytes > 500 * 1024)
  if (largeModules.length > 0) {
    warnings.push('WARN: Large modules found (>500KB):')
    largeModules.forEach(m => {
      warnings.push(`  - ${m.size} ${m.path}`)
    })
  }

  if (warnings.length > 0) {
    console.log('\n=== WARNINGS ===\n')
    warnings.forEach(w => console.log(w))
  }

  console.log('\n=== RECOMMENDATIONS ===\n')

  if (totalBytes > 2 * 1024 * 1024) {
    console.log('- Enable code splitting for routes')
    console.log('- Use dynamic imports for large dependencies')
  }

  if (largeModules.some(m => m.path.includes('node_modules'))) {
    console.log('- Consider replacing large dependencies with lighter alternatives')
    console.log('- Check if all imported modules are tree-shakeable')
  }

  console.log('- Enable minification in production builds')
  console.log('- Use compression (gzip/brotli) for serving assets')
  console.log('')

  const report = {
    totalSize: totalBytes,
    outputs,
    largestInputs: inputs,
    warnings,
    timestamp: new Date().toISOString(),
  }

  await fs.writeJson(path.join(rootDir, 'build/bundle-report.json'), report, { spaces: 2 })
  console.log('Full report saved to build/bundle-report.json\n')

  if (warnings.some(w => w.startsWith('FAIL'))) {
    process.exit(1)
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

analyzeBundle().catch(err => {
  console.error('Bundle analysis failed:', err)
  process.exit(1)
})
