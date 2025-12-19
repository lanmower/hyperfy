
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

let __filename = fileURLToPath(import.meta.url)
if (__filename.startsWith('/') && __filename[2] === ':') {
  __filename = __filename.slice(1)
}
const __dirname = path.dirname(__filename)

async function discover(dirPath) {
  const modules = {}
  const files = await fs.readdir(dirPath)
  for (const file of files) {
    if (!file.endsWith('.js')) continue
    const name = file.replace('.js', '')
    const fullPath = path.join(dirPath, file)
    try {
      const module = await import(`file://${fullPath}`)
      modules[name] = module.default || module
    } catch (err) {
    }
  }
  return modules
}

export async function discoverSystems() {
  const systemsDir = path.join(__dirname, 'systems')
  const all = await discover(systemsDir)

  const serverSystems = {}
  const clientSystems = {}
  const shared = new Set(['LODs', 'Nametags', 'Particles', 'Snaps', 'Wind', 'XR', 'ErrorMonitor'])

  for (const [name, System] of Object.entries(all)) {
    if (!System || typeof System !== 'function') continue

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

let _cached = null
let _systemsDir = null

export function setSystemsDir(dir) {
  _systemsDir = dir
  _cached = null
}

export async function getSystemsAsync() {
  if (!_cached) {
    if (_systemsDir) {
      const all = await discover(_systemsDir)
      const serverSystems = {}
      const clientSystems = {}
      const shared = new Set(['LODs', 'Nametags', 'Particles', 'Snaps', 'Wind', 'XR', 'ErrorMonitor'])

      for (const [name, System] of Object.entries(all)) {
        if (!System || typeof System !== 'function') continue

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

      _cached = { serverSystems, clientSystems }
    } else {
      _cached = await discoverSystems()
    }
  }
  return _cached
}
