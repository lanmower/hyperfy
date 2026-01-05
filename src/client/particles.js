const emitters = {}

import { createEmitter } from './particles/EmitterFactory.js'

self.onmessage = msg => {
  msg = msg.data
  try {
    switch (msg.op) {
      case 'create':
        const system = createEmitter(msg)
        emitters[msg.id] = system
        break
      case 'emitting':
        emitters[msg.emitterId]?.setEmitting(msg.value)
        break
      case 'update':
        emitters[msg.emitterId]?.update(msg)
        break
      case 'destroy':
        emitters[msg.emitterId]?.destroy()
        emitters[msg.emitterId] = null
        break
    }
  } catch (err) {
    self.postMessage({ op: 'error', error: err.message, stack: err.stack })
  }
}

self.addEventListener('error', err => {
  self.postMessage({ op: 'worker-error', error: err.message, stack: err.stack })
})
