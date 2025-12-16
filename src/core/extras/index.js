// Extras module - organized domain-specific utilities
// Exports all submodules for easy importing

export * from './avatar/index.js'
export * from './spatial/index.js'
export * from './math/index.js'
export * from './rendering/index.js'
export * from './utils/index.js'
export * from './assets/index.js'

// Re-export for backward compatibility - semantic imports
export * as avatar from './avatar/index.js'
export * as spatial from './spatial/index.js'
export * as math from './math/index.js'
export * as rendering from './rendering/index.js'
export * as extrasUtils from './utils/index.js'
export * as assets from './assets/index.js'
