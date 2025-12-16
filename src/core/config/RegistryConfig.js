/**
 * Unified Registry Configuration
 *
 * Consolidates all hardcoded registries into a single, extensible configuration.
 * Enables dynamic addition of new asset types, commands, handlers, and settings
 * without modifying dispatch logic.
 */

// ==================== COMMAND REGISTRY ====================
/**
 * Maps command names to their handler functions
 * Format: { commandName: handlerFunction }
 */
export const commandRegistry = {
  admin: 'admin', // admin <code>
  name: 'name',   // name <newname>
  spawn: 'spawn', // spawn <url>
  chat: 'chat',   // chat <message>
  server: 'server', // server <command>
}

// ==================== ASSET TYPE REGISTRY ====================
/**
 * Defines which asset types are supported and how they're loaded
 * Keyed by environment: client, server
 * Each type maps to its handler
 */
export const assetTypeRegistry = {
  client: {
    video: 'video',
    hdr: 'hdr',
    image: 'image',
    texture: 'texture',
    model: 'model',
    emote: 'emote',
    avatar: 'avatar',
    script: 'script',
    audio: 'audio',
  },
  server: {
    model: 'model',
    script: 'script',
    video: 'video',
    image: 'image',
    audio: 'audio',
  }
}

// ==================== MESSAGE HANDLER REGISTRY ====================
/**
 * Maps network message types to their handler functions
 * Keyed by environment: client, server
 */
export const messageHandlerRegistry = {
  server: {
    // Chat & Communication
    'chatAdded': 'chatAdded',

    // Entity Operations
    'entityAdded': 'entityAdded',
    'entityModified': 'entityModified',
    'entityRemoved': 'entityRemoved',

    // Blueprint Management
    'blueprintAdded': 'blueprintAdded',
    'blueprintModified': 'blueprintModified',
    'blueprintRemoved': 'blueprintRemoved',

    // Admin & Moderation
    'modifyRank': 'modifyRank',
    'kick': 'kick',
    'mute': 'mute',

    // File Operations
    'fileUpload': 'fileUpload',

    // Error Handling
    'errorEvent': 'errorEvent',
  },

  client: {
    // World State
    'snapshot': 'snapshot',

    // Chat & Communication
    'chatAdded': 'chatAdded',

    // Entity Operations
    'entityAdded': 'entityAdded',
    'entityModified': 'entityModified',
    'entityRemoved': 'entityRemoved',

    // Blueprint Management
    'blueprintAdded': 'blueprintAdded',
    'blueprintModified': 'blueprintModified',
    'blueprintRemoved': 'blueprintRemoved',
  }
}

// ==================== SETTING REGISTRY ====================
/**
 * Defines configurable settings for client/server
 * Format: { settingKey: { type, default, min?, max?, values? } }
 */
export const settingRegistry = {
  // Audio Settings
  audio: {
    volume: { type: 'number', default: 1, min: 0, max: 1 },
    muted: { type: 'boolean', default: false },
    spatialAudio: { type: 'boolean', default: true },
    masterVolume: { type: 'number', default: 1, min: 0, max: 1 },
  },

  // Graphics Settings
  graphics: {
    quality: { type: 'enum', default: 'medium', values: ['low', 'medium', 'high', 'ultra'] },
    enablePostProcessing: { type: 'boolean', default: true },
    enableShadows: { type: 'boolean', default: true },
    renderDistance: { type: 'number', default: 1000, min: 100, max: 10000 },
    fov: { type: 'number', default: 75, min: 30, max: 120 },
  },

  // Network Settings
  network: {
    tickRate: { type: 'number', default: 8, min: 1, max: 60 },
    bufferSize: { type: 'number', default: 1024, min: 512, max: 8192 },
    compressionEnabled: { type: 'boolean', default: true },
  },

  // Physics Settings
  physics: {
    gravity: { type: 'number', default: -9.81, min: -50, max: 0 },
    fixedTimestep: { type: 'number', default: 0.02, min: 0.001, max: 0.1 },
    maxSubsteps: { type: 'number', default: 5, min: 1, max: 20 },
  },
}

// ==================== NODE TYPE REGISTRY ====================
/**
 * Defines available node types and their categories
 */
export const nodeTypeRegistry = {
  // 3D Geometry
  mesh: { category: '3D', type: 'geometry' },
  skinnedMesh: { category: '3D', type: 'geometry' },
  group: { category: '3D', type: 'container' },

  // Physics
  rigidBody: { category: 'Physics', type: 'physics' },
  collider: { category: 'Physics', type: 'physics' },
  joint: { category: 'Physics', type: 'physics' },
  particles: { category: 'Physics', type: 'effect' },

  // UI
  ui: { category: 'UI', type: 'interactive' },
  uiText: { category: 'UI', type: 'text' },
  uiImage: { category: 'UI', type: 'visual' },
  uiView: { category: 'UI', type: 'container' },

  // Media
  video: { category: 'Media', type: 'visual' },
  image: { category: 'Media', type: 'visual' },
  audio: { category: 'Media', type: 'audio' },

  // Interaction
  action: { category: 'Interaction', type: 'interactive' },
  avatar: { category: 'Interaction', type: 'character' },
  nametag: { category: 'Interaction', type: 'text' },

  // Rendering
  lod: { category: 'Rendering', type: 'optimization' },
  sky: { category: 'Rendering', type: 'environment' },
}

// ==================== SYSTEM REGISTRY ====================
/**
 * Metadata and configurations for systems
 * Enables dynamic system discovery and configuration
 */
export const systemRegistry = {
  client: [
    'ClientBuilder',
    'ClientControls',
    'ClientNetwork',
    'ClientLoader',
    'ClientGraphics',
    'ClientUI',
    'ClientAudio',
    'ClientPointer',
    'ClientStats',
  ],
  server: [
    'ServerNetwork',
    'ServerLoader',
    'Entities',
    'Chat',
    'Apps',
    'Scripts',
    'Stage',
    'Physics',
    'Wind',
    'LODs',
  ],
  shared: [
    'Avatars',
    'Nametags',
    'Animations',
    'ErrorMonitor',
  ]
}

// ==================== LOADER REGISTRY ====================
/**
 * Defines file type handlers for asset loading
 */
export const loaderRegistry = {
  video: {
    extensions: ['.mp4', '.webm', '.ogg'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  },
  image: {
    extensions: ['.jpg', '.png', '.webp', '.gif'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  model: {
    extensions: ['.glb', '.gltf', '.fbx', '.obj'],
    mimeTypes: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  },
}

// ==================== PREFERENCE REGISTRY ====================
/**
 * User preference keys and their metadata
 */
export const preferenceRegistry = {
  audio_volume: { type: 'number', min: 0, max: 1, description: 'Master volume' },
  audio_muted: { type: 'boolean', description: 'Mute all audio' },
  graphics_quality: { type: 'enum', values: ['low', 'medium', 'high'], description: 'Render quality' },
  graphics_postprocessing: { type: 'boolean', description: 'Enable post-processing effects' },
  controls_sensitivity: { type: 'number', min: 0.1, max: 5, description: 'Mouse/controller sensitivity' },
  language: { type: 'enum', values: ['en', 'es', 'fr', 'de', 'ja', 'zh'], description: 'UI language' },
}

// ==================== ERROR PATTERN REGISTRY ====================
/**
 * Predefined error patterns for categorization and handling
 */
export const errorPatternRegistry = {
  network: /network|connection|socket|websocket|timeout|disconnected/i,
  physics: /physics|rigidbody|collider|constraint|joint/i,
  rendering: /render|shader|texture|material|graphics|webgl/i,
  audio: /audio|sound|speaker|microphone/i,
  scripting: /script|syntax|reference|type|runtime/i,
  storage: /storage|database|file|save|load|persist/i,
  permission: /permission|access|denied|forbidden|unauthorized/i,
  validation: /validation|schema|constraint|invalid|required/i,
}

// ==================== RANK REGISTRY ====================
/**
 * User ranks and their capabilities
 */
export const rankRegistry = {
  visitor: { level: 0, permissions: ['join', 'chat', 'view'] },
  member: { level: 1, permissions: ['join', 'chat', 'view', 'build', 'script'] },
  moderator: { level: 2, permissions: ['join', 'chat', 'view', 'build', 'script', 'kick', 'mute'] },
  admin: { level: 3, permissions: ['all'] },
}

// ==================== EXPORT FACTORY ====================
/**
 * Factory function to get registries
 */
export function getRegistry(type, environment = null) {
  const registries = {
    commands: commandRegistry,
    assets: assetTypeRegistry,
    handlers: messageHandlerRegistry,
    settings: settingRegistry,
    nodes: nodeTypeRegistry,
    systems: systemRegistry,
    loaders: loaderRegistry,
    preferences: preferenceRegistry,
    errors: errorPatternRegistry,
    ranks: rankRegistry,
  }

  const registry = registries[type]
  if (!registry) {
    throw new Error(`Unknown registry type: ${type}`)
  }

  // Return environment-specific registry if applicable
  if (environment && registry[environment]) {
    return registry[environment]
  }

  return registry
}

// ==================== REGISTRY EXTENSION ====================
/**
 * Helper to extend registries at runtime
 */
const extensionHandlers = new Map()

export function registerExtension(type, environment, key, handler) {
  const id = `${type}:${environment}:${key}`
  extensionHandlers.set(id, handler)
  return () => extensionHandlers.delete(id)
}

export function getExtension(type, environment, key) {
  const id = `${type}:${environment}:${key}`
  return extensionHandlers.get(id)
}
