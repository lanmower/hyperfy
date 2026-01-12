import 'ses'
import '../core/lockdown.js'
import path from 'path'
import { fileURLToPath } from 'url'

// support `__dirname` in ESM
globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url))

export { createNodeClientWorld } from '../core/createNodeClientWorld.js'
export { System } from '../core/systems/System.js'
export { storage } from '../core/storage.js'
