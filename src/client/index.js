import 'ses'
import '../core/lockdown.js'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Client } from './world-client.js'

// Make React global for JSX transform (which uses React.createElement)
globalThis.React = React

function App() {
  // Phase 2: Network initialization
  return <Client wsUrl={() => window.env?.PUBLIC_WS_URL} />
}

function initializeApp() {
  const root = createRoot(document.getElementById('root'))
  root.render(<App />)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initializeApp, 100))
} else {
  setTimeout(initializeApp, 100)
}
