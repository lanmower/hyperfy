import 'ses'
import '../core/lockdown.js'
import { createRoot } from 'react-dom/client'
import { Client } from './world-client.js'

function App() {
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
