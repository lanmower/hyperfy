export const CleanupChecklist = {
  SYSTEM: {
    name: 'System Cleanup',
    items: [
      'Clear all event listeners via listeners.clear()',
      'Stop any timers (clearInterval, clearTimeout)',
      'Cancel all pending promises (AbortController)',
      'Detach from world events',
      'Release reference to world',
      'Cleanup child systems or managers',
      'Call super.destroy() to trigger parent cleanup',
      'Log cleanup completion for debugging'
    ],
    template: `
destroy() {
  this.listeners.clear()
  if (this.abortController) this.abortController.abort()
  if (this.interval) clearInterval(this.interval)
  for (const system of this.subsystems) {
    system.destroy()
  }
  super.destroy?.()
}
    `
  },

  NODE: {
    name: 'Node Cleanup (Three.js objects)',
    items: [
      'Dispose geometries (geometry.dispose())',
      'Dispose materials (material.dispose() or for array: forEach)',
      'Dispose textures (texture.dispose())',
      'Remove from parent (parent.remove(this))',
      'Clear child references',
      'Stop animations or tweens',
      'Remove event listeners',
      'Clean up sub-controllers (audio, video, etc.)',
      'Call super.dispose() if extending Node'
    ],
    template: `
dispose() {
  if (this.geometry) {
    this.geometry.dispose()
  }
  if (this.material) {
    if (Array.isArray(this.material)) {
      this.material.forEach(m => m.dispose())
    } else {
      this.material.dispose()
    }
  }
  if (this.parent) {
    this.parent.remove(this)
  }
  this.audioController?.cleanup()
  super.dispose?.()
}
    `
  },

  EVENT_EMITTER: {
    name: 'Event Emitter Cleanup',
    items: [
      'Use EventListenerManager for automatic tracking',
      'Call listeners.clear() on destroy',
      'Or manually: off() each registered listener',
      'For DOM events: use removeEventListener()',
      'For EE: use off() method',
      'Check that all listeners are removed before disposal'
    ],
    template: `
// Option 1: Automatic via EventListenerManager
destroy() {
  this.listeners.clear()  // Removes all tracked listeners
  super.destroy?.()
}

// Option 2: Manual cleanup
destroy() {
  this.emitter.off('event', this.boundHandler)
  document.removeEventListener('click', this.domHandler)
  super.destroy?.()
}
    `
  },

  ASYNC_OPERATION: {
    name: 'Async Operation Cleanup',
    items: [
      'Create AbortController at initialization',
      'Pass signal to fetch() and promises',
      'Call abortController.abort() on cleanup',
      'Catch AbortError gracefully',
      'Clear pending promises',
      'Stop async loops (while loops checking !abortController.signal.aborted)',
      'Cancel timers that drive async work'
    ],
    template: `
constructor() {
  this.abortController = new AbortController()
}

async fetch() {
  return fetch(url, { signal: this.abortController.signal })
}

destroy() {
  this.abortController.abort()
  this.listeners.clear()
  super.destroy?.()
}
    `
  },

  CACHE: {
    name: 'Cache Cleanup',
    items: [
      'Clear cache on destroy (cache.clear())',
      'Set max size limits to prevent unbounded growth',
      'Implement LRU (least-recently-used) eviction',
      'Track cache hits/misses for monitoring',
      'Log cache size on destroy'
    ],
    template: `
destroy() {
  const size = this.cache.size
  this.cache.clear()
  logger.info('Cache cleared', { size })
  super.destroy?.()
}
    `
  },

  THREE_TEXTURE: {
    name: 'Three.js Texture Cleanup',
    items: [
      'Call texture.dispose() for all textures',
      'Check for textures in materials (material.map, normalMap, etc.)',
      'Clear texture references',
      'Stop loading if in progress (AbortController)',
      'Remove from TextureLoader cache if applicable'
    ],
    template: `
disposeTextures() {
  if (this.material?.map) this.material.map.dispose()
  if (this.material?.normalMap) this.material.normalMap.dispose()
  if (this.material?.metalnessMap) this.material.metalnessMap.dispose()
  if (this.material?.roughnessMap) this.material.roughnessMap.dispose()
}
    `
  },

  THREE_GEOMETRY: {
    name: 'Three.js Geometry Cleanup',
    items: [
      'Call geometry.dispose() for all geometries',
      'Check for shared geometries (may be used by multiple meshes)',
      'Use reference counting for shared resources',
      'Clear vertex data after disposal',
      'Log disposal for debugging'
    ],
    template: `
disposeGeometry() {
  if (this.geometry && !this.geometry.isShared) {
    this.geometry.dispose()
    this.geometry = null
  }
}
    `
  },

  INTERVAL_TIMER: {
    name: 'Interval/Timer Cleanup',
    items: [
      'Store interval/timeout IDs',
      'Call clearInterval() or clearTimeout() on cleanup',
      'Check if already cleared (id !== null)',
      'Clear ID reference after clearing',
      'Log cleanup if timer was significant'
    ],
    template: `
constructor() {
  this.updateInterval = null
}

start() {
  this.updateInterval = setInterval(() => this.update(), 100)
}

destroy() {
  if (this.updateInterval) {
    clearInterval(this.updateInterval)
    this.updateInterval = null
  }
  super.destroy?.()
}
    `
  },

  WORKER_THREAD: {
    name: 'Web Worker Cleanup',
    items: [
      'Store worker reference',
      'Call worker.terminate() on cleanup',
      'Remove message listener (removeEventListener or off)',
      'Don\'t send messages after termination',
      'Clear worker reference'
    ],
    template: `
constructor() {
  this.worker = new Worker('worker.js')
  this.worker.addEventListener('message', this.handleMessage.bind(this))
}

destroy() {
  this.worker.terminate()
  this.worker = null
  super.destroy?.()
}
    `
  },

  ANIMATION_FRAME: {
    name: 'RequestAnimationFrame Cleanup',
    items: [
      'Store animationFrameId',
      'Call cancelAnimationFrame() on cleanup',
      'Check if frame is pending',
      'Clear reference after cancelling',
      'Use AbortController pattern as alternative'
    ],
    template: `
constructor() {
  this.animationFrameId = null
}

start() {
  this.animationFrameId = requestAnimationFrame(() => this.update())
}

destroy() {
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
  }
  super.destroy?.()
}
    `
  },

  DOM_REFERENCES: {
    name: 'DOM Reference Cleanup',
    items: [
      'Clear all DOM element references',
      'Remove event listeners from DOM elements',
      'Remove elements from DOM (parentNode.removeChild)',
      'Set references to null to break cycles',
      'Don\'t store global references to DOM nodes'
    ],
    template: `
constructor() {
  this.canvas = document.getElementById('canvas')
  this.canvas.addEventListener('click', this.onClick.bind(this))
}

destroy() {
  this.canvas.removeEventListener('click', this.onClick)
  this.canvas.parentNode?.removeChild(this.canvas)
  this.canvas = null
  super.destroy?.()
}
    `
  },

  MEMORY_REFERENCES: {
    name: 'Memory Reference Cleanup',
    items: [
      'Break circular references (a.b = null, b.a = null)',
      'Clear large data structures (arrays, maps)',
      'Don\'t store references to dispose()-d objects',
      'Use WeakMap for cache keys when appropriate',
      'Use WeakRef for optional references'
    ],
    template: `
destroy() {
  this.parent = null
  this.children.clear()
  this.cache.clear()
  this.largeArray = null
  super.destroy?.()
}
    `
  },

  CHECKLIST_PATTERN: {
    name: 'Pre-Destroy Checklist',
    items: [
      '1. Identify all resources created in constructor',
      '2. For each resource, determine cleanup requirement',
      '3. Create cleanup code in destroy() method',
      '4. Test that dispose/destroy works (check console)',
      '5. Verify no memory leaks (use ResourceLeakDetector)',
      '6. Add parent class cleanup call (super.destroy)',
      '7. Log cleanup completion if tracking important',
      '8. Remove references to prevent circular dependencies'
    ],
    questions: [
      'Does this class create any timers/intervals?',
      'Does this class register any event listeners?',
      'Does this class create Three.js objects?',
      'Does this class use web workers?',
      'Does this class fetch/stream data?',
      'Does this class modify DOM?',
      'Does this class have circular references?',
      'Does this class spawn child objects?'
    ]
  }
}

export function printCleanupGuide(category) {
  const guide = CleanupChecklist[category]
  if (!guide) {
    return 'Unknown category. Available: ' + Object.keys(CleanupChecklist).join(', ')
  }

  let output = `\n=== ${guide.name} ===\n\n`

  if (guide.items) {
    output += 'Checklist:\n'
    guide.items.forEach((item, i) => {
      output += `${i + 1}. ${item}\n`
    })
  }

  if (guide.questions) {
    output += '\nQuestions to ask:\n'
    guide.questions.forEach((q, i) => {
      output += `${i + 1}. ${q}\n`
    })
  }

  if (guide.template) {
    output += `\nTemplate:\n${guide.template}\n`
  }

  return output
}
