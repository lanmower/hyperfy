console.log('[HYPERFY] Module executing')

import React, { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { initHMR } from './hmr.js'
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

console.log('[HYPERFY] Imports complete')

function setupClientSystems(world, config) {
  console.log('[HYPERFY] Setting up client systems')
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
  console.log('[HYPERFY] Systems registered')
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return h('div', { style: { padding: '20px', color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#000', height: '100%', overflow: 'auto' } },
        h('div', null, '❌ Error in Client'),
        h('div', { style: { marginTop: '20px', fontSize: '12px', color: '#aaa' } }, this.state.error.toString()),
        this.state.errorInfo && h('div', { style: { marginTop: '20px', fontSize: '10px', color: '#666' } }, this.state.errorInfo.componentStack)
      )
    }
    return this.props.children
  }
}

function initializeReactApp() {
  console.log('[HYPERFY] Initializing React UI...')
  try {
    const rootEl = document.getElementById('root')
    if (rootEl) {
      console.log('[HYPERFY] Root element found, creating React root')
      const root = createRoot(rootEl)
      console.log('[HYPERFY] Root created, attempting Client render')

      const clientElement = h(ErrorBoundary, null,
        h(Client, {
          wsUrl: window.env?.PUBLIC_WS_URL,
          onSetup: setupClientSystems
        })
      )

      root.render(clientElement)
      console.log('[HYPERFY] Client render called')
    } else {
      console.error('[HYPERFY] Root element not found')
    }
  } catch (err) {
    console.error('[HYPERFY] React error:', err.toString())
    console.error('[HYPERFY] Stack:', err.stack)
  }
}

initHMR()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReactApp)
} else {
  initializeReactApp()
}

export { setupClientSystems }
