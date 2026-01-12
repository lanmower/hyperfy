// Minimal client bundle - loads React and renders the app
console.log('[CLIENT] Bundle loading')

// Dynamic import with proper error handling
async function init() {
  try {
    console.log('[CLIENT] Initializing...')

    // Import React and ReactDOM from CDN
    const React = await import('https://esm.sh/react@19.0.0?dev')
    const ReactDOM = await import('https://esm.sh/react-dom@19.0.0?dev')
    const { createRoot } = await import('https://esm.sh/react-dom@19.0.0/client?dev')

    console.log('[CLIENT] React imported')

    // Import the Client component
    const clientModule = await import('./world-client.js')
    const { Client } = clientModule

    console.log('[CLIENT] Client component imported, mounting...')

    // Get root element
    const rootEl = document.getElementById('root')
    if (!rootEl) {
      console.error('[CLIENT] Root element not found')
      return
    }

    // Setup client systems
    function setupClientSystems(world, config) {
      const { ClientPrefs } = require('../core/systems/ClientPrefs.js')
      const { InputSystem } = require('../core/systems/input/InputSystem.js')
      const { ClientGraphics } = require('../core/systems/ClientGraphics.js')
      const { ClientEnvironment } = require('../core/systems/ClientEnvironment.js')
      const { ClientNetwork } = require('../core/systems/ClientNetwork.js')
      const { Events } = require('../core/systems/Events.js')
      const { Settings } = require('../core/systems/Settings.js')
      const { Stage } = require('../core/systems/Stage.js')
      const { Collections } = require('../core/systems/Collections.js')
      const { Chat } = require('../core/systems/Chat.js')
      const { UnifiedLoader } = require('../core/systems/UnifiedLoader.js')
      const { BlueprintManager } = require('../core/systems/BlueprintManager.js')
      const { Entities } = require('../core/systems/Entities.js')
      const { ClientLiveKit } = require('../core/systems/ClientLiveKit.js')

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

    // Create React root and render
    const root = createRoot(rootEl)
    root.render(React.createElement(Client, {
      wsUrl: window.env?.PUBLIC_WS_URL,
      onSetup: setupClientSystems
    }))

    console.log('[CLIENT] React mounted')
  } catch (err) {
    console.error('[CLIENT] Initialization error:', err.message, err.stack)
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
