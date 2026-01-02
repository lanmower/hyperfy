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
import { Events } from '../core/systems/Events.js'
import { Settings } from '../core/systems/Settings.js'
import { Stage } from '../core/systems/Stage.js'
import { Collections } from '../core/systems/Collections.js'
import { Chat } from '../core/systems/Chat.js'
import { UnifiedLoader } from '../core/systems/UnifiedLoader.js'
import { BlueprintManager } from '../core/systems/BlueprintManager.js'
import { Entities } from '../core/systems/Entities.js'
import { ClientLiveKit } from '../core/systems/ClientLiveKit.js'

console.log('[HYPERFY] Client module starting')

import { initHMR } from './hmr.js'

if (typeof window !== 'undefined') {
  initHMR()
}

function setupClientSystems(world, config) {
  world.register('settings', Settings)
  world.register('collections', Collections)
  world.register('events', Events)
  world.register('chat', Chat)
  world.register('loader', UnifiedLoader)
  world.register('blueprints', BlueprintManager)
  world.register('entities', Entities)
  world.register('stage', Stage)
  world.register('prefs', ClientPrefs)
  world.register('environment', ClientEnvironment)
  world.register('graphics', ClientGraphics)
  world.register('livekit', ClientLiveKit)
  world.register('controls', InputSystem)
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
