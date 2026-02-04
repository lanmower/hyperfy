import React from 'react'
import { createRoot } from 'react-dom/client'
import { Client } from './world-client.js'
import * as pc from '../core/extras/playcanvas.js'

globalThis.React = React

window.pc = Object.assign({}, pc)

function App() {
  return React.createElement(Client, { wsUrl: () => window.env?.PUBLIC_WS_URL })
}

function initializeApp() {
  const root = createRoot(document.getElementById('root'))
  root.render(React.createElement(App))
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initializeApp, 100))
} else {
  setTimeout(initializeApp, 100)
}
