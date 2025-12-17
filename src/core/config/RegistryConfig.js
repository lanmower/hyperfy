


export const commandRegistry = {
  admin: 'admin', // admin <code>
  name: 'name',   // name <newname>
  spawn: 'spawn', // spawn <url>
  chat: 'chat',   // chat <message>
  server: 'server', // server <command>
}


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


export const messageHandlerRegistry = {
  server: {
    'chatAdded': 'chatAdded',

    'entityAdded': 'entityAdded',
    'entityModified': 'entityModified',
    'entityRemoved': 'entityRemoved',

    'blueprintAdded': 'blueprintAdded',
    'blueprintModified': 'blueprintModified',
    'blueprintRemoved': 'blueprintRemoved',

    'modifyRank': 'modifyRank',
    'kick': 'kick',
    'mute': 'mute',

    'fileUpload': 'fileUpload',

    'errorEvent': 'errorEvent',
  },

  client: {
    'snapshot': 'snapshot',

    'chatAdded': 'chatAdded',

    'entityAdded': 'entityAdded',
    'entityModified': 'entityModified',
    'entityRemoved': 'entityRemoved',

    'blueprintAdded': 'blueprintAdded',
    'blueprintModified': 'blueprintModified',
    'blueprintRemoved': 'blueprintRemoved',
  }
}


export const settingRegistry = {
  audio: {
    volume: { type: 'number', default: 1, min: 0, max: 1 },
    muted: { type: 'boolean', default: false },
    spatialAudio: { type: 'boolean', default: true },
    masterVolume: { type: 'number', default: 1, min: 0, max: 1 },
  },

  graphics: {
    quality: { type: 'enum', default: 'medium', values: ['low', 'medium', 'high', 'ultra'] },
    enablePostProcessing: { type: 'boolean', default: true },
    enableShadows: { type: 'boolean', default: true },
    renderDistance: { type: 'number', default: 1000, min: 100, max: 10000 },
    fov: { type: 'number', default: 75, min: 30, max: 120 },
  },

  network: {
    tickRate: { type: 'number', default: 8, min: 1, max: 60 },
    bufferSize: { type: 'number', default: 1024, min: 512, max: 8192 },
    compressionEnabled: { type: 'boolean', default: true },
  },

  physics: {
    gravity: { type: 'number', default: -9.81, min: -50, max: 0 },
    fixedTimestep: { type: 'number', default: 0.02, min: 0.001, max: 0.1 },
    maxSubsteps: { type: 'number', default: 5, min: 1, max: 20 },
  },
}


export const nodeTypeRegistry = {
  mesh: { category: '3D', type: 'geometry' },
  skinnedMesh: { category: '3D', type: 'geometry' },
  group: { category: '3D', type: 'container' },

  rigidBody: { category: 'Physics', type: 'physics' },
  collider: { category: 'Physics', type: 'physics' },
  joint: { category: 'Physics', type: 'physics' },
  particles: { category: 'Physics', type: 'effect' },

  ui: { category: 'UI', type: 'interactive' },
  uiText: { category: 'UI', type: 'text' },
  uiImage: { category: 'UI', type: 'visual' },
  uiView: { category: 'UI', type: 'container' },

  video: { category: 'Media', type: 'visual' },
  image: { category: 'Media', type: 'visual' },
  audio: { category: 'Media', type: 'audio' },

  action: { category: 'Interaction', type: 'interactive' },
  avatar: { category: 'Interaction', type: 'character' },
  nametag: { category: 'Interaction', type: 'text' },

  lod: { category: 'Rendering', type: 'optimization' },
  sky: { category: 'Rendering', type: 'environment' },
}


export const systemRegistry = {
  client: [
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
  ],
  shared: [
    'Avatars',
    'Nametags',
    'Animations',
    'ErrorMonitor',
  ]
}


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


export const preferenceRegistry = {
  audio_volume: { type: 'number', min: 0, max: 1, description: 'Master volume' },
  audio_muted: { type: 'boolean', description: 'Mute all audio' },
  graphics_quality: { type: 'enum', values: ['low', 'medium', 'high'], description: 'Render quality' },
  graphics_postprocessing: { type: 'boolean', description: 'Enable post-processing effects' },
  controls_sensitivity: { type: 'number', min: 0.1, max: 5, description: 'Mouse/controller sensitivity' },
  language: { type: 'enum', values: ['en', 'es', 'fr', 'de', 'ja', 'zh'], description: 'UI language' },
}


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


export const rankRegistry = {
  visitor: { level: 0, permissions: ['join', 'chat', 'view'] },
  member: { level: 1, permissions: ['join', 'chat', 'view', 'build', 'script'] },
  moderator: { level: 2, permissions: ['join', 'chat', 'view', 'build', 'script', 'kick', 'mute'] },
  admin: { level: 3, permissions: ['all'] },
}


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

  if (environment && registry[environment]) {
    return registry[environment]
  }

  return registry
}


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
