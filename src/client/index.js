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

function App() {
  return <Client wsUrl={env.PUBLIC_WS_URL} />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
