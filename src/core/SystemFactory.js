// System factory - unified auto-discovery of systems by platform

import { Auto } from './Auto.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function discoverSystems() {
  const systemsDir = path.join(__dirname, 'systems')
  const all = await Auto.discover(systemsDir)

  const serverSystems = {}
  const clientSystems = {}
  const shared = new Set(['LODs', 'Nametags', 'Particles', 'Snaps', 'Wind', 'XR', 'ErrorMonitor'])

  for (const [name, System] of Object.entries(all)) {
    const key = name.replace(/^Server/, '').replace(/^Client/, '')
      .replace(/^(.)/, c => c.toLowerCase())

    if (name.startsWith('Server')) {
      serverSystems[key] = System
    } else if (name.startsWith('Client')) {
      clientSystems[key] = System
    } else if (shared.has(name)) {
      serverSystems[key] = System
      clientSystems[key] = System
    }
  }

  return { serverSystems, clientSystems }
}

// Cached results
let _cached = null

export async function getSystemsAsync() {
  if (!_cached) {
    _cached = await discoverSystems()
  }
  return _cached
}
