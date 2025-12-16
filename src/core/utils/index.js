// Unified utilities index for easy importing
// Supports both: import { uuid } from '@/core/utils' and import * as events from '@/core/utils/events'

// ==================== Events ====================
export { EventBus, globalEvents, ErrorEventBus } from './events/index.js'

// ==================== Validation & Schemas ====================
export * as validation from './validation/index.js'
export { createNodeSchema } from './validation/createNodeSchema.js'

// ==================== Serialization ====================
export * as serialization from './serialization/index.js'

// ==================== Caching & Performance ====================
export { ObjectPool } from './caching/ObjectPool.js'
export { Cache } from './caching/Cache.js'
export { TempVectors } from './caching/TempVectors.js'

// ==================== Async & Task Processing ====================
export { TaskQueue } from './async/TaskQueue.js'

// ==================== Collections & Data ====================
export * as collections from './collections/collections.js'

// ==================== Helpers & Misc ====================
export { uuid, clamp, num } from './helpers/misc.js'
export { ChatFormatter } from './helpers/ChatFormatter.js'
export { hashFile, createJWT, readJWT, hashFileClient, hashFileServer } from './helpers/crypto.js'

// ==================== Core Exports (for backward compatibility) ====================
export { Auto } from '../Auto.js'
export { Props, prop, propSchema } from '../Props.js'
