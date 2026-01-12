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
  }
}
