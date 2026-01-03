export const CleanupChecklistPart2 = {
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
