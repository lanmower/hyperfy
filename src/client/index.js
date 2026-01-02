import 'ses'

// Process shim to handle graceful-fs mutations
if (typeof window !== 'undefined') {
  if (typeof process !== 'undefined' && process) {
    try {
      let cwdValue = '/'
      Object.defineProperty(process, 'cwd', {
        get: () => cwdValue,
        set: (value) => { cwdValue = value },
        configurable: true
      })
    } catch (e) {
      // Suppress if defineProperty fails
    }
  }
  // Suppress the specific error about process.cwd
  const originalError = console.error
  console.error = function(...args) {
    const msg = args[0]?.toString?.() || ''
    if (msg.includes('Cannot set property cwd')) {
      return // Suppress this specific error
    }
    return originalError.apply(console, args)
  }
}

import { createRoot } from 'react-dom/client'
import { Client } from './world-client.js'
import { ClientPrefs } from '../core/systems/ClientPrefs.js'
import { InputSystem } from '../core/systems/input/InputSystem.js'
import { ClientGraphics } from '../core/systems/ClientGraphics.js'
import { ClientEnvironment } from '../core/systems/ClientEnvironment.js'
import { ClientNetwork } from '../core/systems/ClientNetwork.js'

console.log('[HYPERFY] Client module starting')

function setupClientSystems(world, config) {
  world.register('prefs', ClientPrefs)
  world.register('controls', InputSystem)
  world.register('graphics', ClientGraphics)
  world.register('environment', ClientEnvironment)
  world.register('network', ClientNetwork)
}

console.log('[HYPERFY] About to create root and render')
const rootEl = document.getElementById('root')
if (rootEl) {
  rootEl.setAttribute('data-client-loaded', 'yes')
  const root = createRoot(rootEl)
  root.render(<Client wsUrl={window.env?.PUBLIC_WS_URL} onSetup={setupClientSystems} />)
  console.log('[HYPERFY] React rendered')
}
