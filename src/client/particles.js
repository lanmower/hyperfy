const emitters = {}

import { createEmitter } from './particles/EmitterFactory.js'

self.onmessage = msg => {
  msg = msg.data
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
}
