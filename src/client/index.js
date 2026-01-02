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
import { UnifiedLoader } from '../core/systems/UnifiedLoader.js'
import { InputSystem } from '../core/systems/input/InputSystem.js'
import { ClientGraphics } from '../core/systems/ClientGraphics.js'
import { ClientEnvironment } from '../core/systems/ClientEnvironment.js'
import { ClientNetwork } from '../core/systems/ClientNetwork.js'

function setupClientSystems(world, config) {
  world.register('prefs', ClientPrefs)
  world.register('loader', UnifiedLoader)
  world.register('controls', InputSystem)
  world.register('graphics', ClientGraphics)
  world.register('environment', ClientEnvironment)
  world.register('network', ClientNetwork)
}

function App() {
  return <Client wsUrl={env.PUBLIC_WS_URL} onSetup={setupClientSystems} />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
