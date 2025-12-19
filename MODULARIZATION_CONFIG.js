// MODULARIZATION FRAMEWORK CONFIG
// Config-driven approach to systematically refactor and modularize all Hyperfy systems
// Target: 3,000+ LOC reduction across 30+ systems in 7 batches

export const ModularizationConfig = {
  // BATCH 1: NETWORK SYSTEMS (Low Risk, High Impact)
  // Target: 202 LOC reduction
  // Risk Level: Low (isolated systems with proven patterns)

  batch1: {
    name: 'Network Systems',
    priority: 'critical',
    risk: 'low',
    expectedReduction: 202,
    systems: [
      {
        system: 'ClientNetwork',
        batch: 1,
        currentLOC: 190,
        targetLOC: 95,
        reduction: 95,
        pattern: 'closed-class-delegation',
        extractions: [
          {
            name: 'SnapshotProcessor',
            methods: ['processSnapshot', 'applySnapshot', 'reconcile'],
            type: 'processor',
            filePath: 'src/core/systems/network/SnapshotProcessor.js',
            expectedLOC: '80-100'
          },
          {
            name: 'WebSocketManager',
            methods: ['init', 'send', 'disconnect', 'reconnect'],
            type: 'manager',
            filePath: 'src/core/systems/network/WebSocketManager.js',
            expectedLOC: '60-80',
            note: 'Already extracted, refactor delegation'
          }
        ],
        delegation: {
          constructor: ['wsManager', 'snapshotProcessor'],
          methods: {
            send: 'this.wsManager.send',
            processSnapshot: 'this.snapshotProcessor.process'
          }
        }
      },
      {
        system: 'ServerNetwork',
        batch: 1,
        currentLOC: 237,
        targetLOC: 130,
        reduction: 107,
        pattern: 'closed-class-delegation',
        extractions: [
          {
            name: 'PacketHandlers',
            methods: ['onPlayerJoined', 'onPlayerLeft', 'onEntityModified', 'onFileUpload', 'onErrorEvent'],
            type: 'handler-registry',
            filePath: 'src/core/systems/server/PacketHandlers.js',
            expectedLOC: '80-100',
            note: 'Consolidate all 27+ packet handler methods'
          }
        ],
        delegation: {
          constructor: ['handlers', 'persistence', 'errorHandling'],
          methods: {
            handlePacket: 'this.handlers.handle',
            sendPacket: 'this.send'
          }
        }
      }
    ]
  },

  // BATCH 2: CONTROL & INPUT SYSTEMS (Medium Risk, High Complexity)
  // Target: 450 LOC reduction
  // Risk Level: Medium (XR/touch/pointer lock interactions)

  batch2: {
    name: 'Control & Input Systems',
    priority: 'high',
    risk: 'medium',
    expectedReduction: 450,
    systems: [
      {
        system: 'ClientControls',
        batch: 2,
        currentLOC: 207,
        targetLOC: 140,
        reduction: 67,
        pattern: 'closed-class-delegation',
        extractions: [
          {
            name: 'ControlBindingManager',
            methods: ['bind', 'unbind', 'setActions', 'buildActions', 'getPriority'],
            type: 'manager',
            filePath: 'src/core/systems/controls/ControlBindingManager.js',
            expectedLOC: '70-90'
          },
          {
            name: 'XRInputProcessor',
            methods: ['processXRInput', 'handleGrip', 'handleTrigger', 'handlePose'],
            type: 'processor',
            filePath: 'src/core/systems/controls/XRInputProcessor.js',
            expectedLOC: '50-70'
          }
        ]
      },
      {
        system: 'ClientActions',
        batch: 2,
        currentLOC: 100,
        targetLOC: 45,
        reduction: 55,
        pattern: 'closed-class-delegation',
        note: 'Merge ActionHUD and ActionDisplay with core logic'
      },
      {
        system: 'Nametags',
        batch: 2,
        currentLOC: 180,
        targetLOC: 90,
        reduction: 90,
        pattern: 'closed-class-delegation',
        note: 'Merge NametagRenderer and NametagPositioner into unified manager'
      },
      {
        system: 'ClientPointer',
        batch: 2,
        currentLOC: 168,
        targetLOC: 98,
        reduction: 70,
        pattern: 'closed-class-delegation',
        note: 'Separate pointer tracking, locking, and event handling'
      }
    ]
  },

  // BATCH 3: ASSET & RESOURCE SYSTEMS (Medium Risk, High Value)
  // Target: 500 LOC reduction
  // Risk Level: Medium (file I/O, async operations)

  batch3: {
    name: 'Asset & Resource Systems',
    priority: 'high',
    risk: 'medium',
    expectedReduction: 500,
    systems: [
      {
        system: 'ClientLoader',
        batch: 3,
        currentLOC: 140,
        targetLOC: 60,
        reduction: 80,
        pattern: 'factory-delegation',
        extractions: [
          {
            name: 'ResourceCache',
            methods: ['get', 'set', 'has', 'clear', 'size'],
            type: 'cache',
            filePath: 'src/core/systems/loaders/ResourceCache.js',
            expectedLOC: '30-40'
          },
          {
            name: 'FileLoader',
            methods: ['load', 'loadBlob', 'loadText', 'loadArrayBuffer'],
            type: 'loader',
            filePath: 'src/core/systems/loaders/FileLoader.js',
            expectedLOC: '40-50'
          }
        ]
      },
      {
        system: 'ServerLoader',
        batch: 3,
        currentLOC: 95,
        targetLOC: 50,
        reduction: 45,
        pattern: 'factory-delegation',
        note: 'Extract asset type handlers to specialized modules'
      },
      {
        system: 'AssetHandlerRegistry',
        batch: 3,
        currentLOC: 237,
        targetLOC: 120,
        reduction: 117,
        pattern: 'registry-pattern',
        extractions: [
          {
            name: 'TypeHandlers',
            methods: ['handleVideo', 'handleImage', 'handleModel', 'handleAudio'],
            type: 'handler-registry',
            filePath: 'src/core/systems/loaders/TypeHandlers.js',
            expectedLOC: '80-100'
          }
        ]
      }
    ]
  },

  // BATCH 4: BUILDER & INTERACTION (High Risk, Complex)
  // Target: 350 LOC reduction
  // Risk Level: High (interdependent, performance-critical)

  batch4: {
    name: 'Builder & Interaction Systems',
    priority: 'high',
    risk: 'high',
    expectedReduction: 350,
    systems: [
      {
        system: 'ClientBuilder',
        batch: 4,
        currentLOC: 169,
        targetLOC: 80,
        reduction: 89,
        pattern: 'unified-facade',
        note: 'Consolidate 11+ builder modules under unified facade'
      },
      {
        system: 'Physics',
        batch: 4,
        currentLOC: 172,
        targetLOC: 100,
        reduction: 72,
        pattern: 'closed-class-delegation',
        note: 'Further consolidation of physics queries and contact management'
      },
      {
        system: 'Stage',
        batch: 4,
        currentLOC: 128,
        targetLOC: 75,
        reduction: 53,
        pattern: 'closed-class-delegation',
        note: 'Separate grid rendering and stage state management'
      }
    ]
  },

  // BATCH 5: UI & GRAPHICS SYSTEMS (Medium Risk, Visual Impact)
  // Target: 400 LOC reduction
  // Risk Level: Medium (visual regression potential)

  batch5: {
    name: 'UI & Graphics Systems',
    priority: 'high',
    risk: 'medium',
    expectedReduction: 400,
    systems: [
      {
        system: 'ClientGraphics',
        batch: 5,
        currentLOC: 174,
        targetLOC: 95,
        reduction: 79,
        pattern: 'closed-class-delegation',
        extractions: [
          {
            name: 'RenderStateManager',
            methods: ['setSize', 'setPixelRatio', 'setViewport', 'updateState'],
            type: 'manager',
            filePath: 'src/core/systems/graphics/RenderStateManager.js',
            expectedLOC: '40-50'
          },
          {
            name: 'ViewportResizer',
            methods: ['onResize', 'getAspectRatio', 'calculateDimensions'],
            type: 'controller',
            filePath: 'src/core/systems/graphics/ViewportResizer.js',
            expectedLOC: '30-40'
          },
          {
            name: 'XRGraphicsAdapter',
            methods: ['setupXR', 'configureXRDimensions', 'updateXRState'],
            type: 'adapter',
            filePath: 'src/core/systems/graphics/XRGraphicsAdapter.js',
            expectedLOC: '35-45'
          }
        ]
      },
      {
        system: 'UI',
        batch: 5,
        currentLOC: 299,
        targetLOC: 180,
        reduction: 119,
        pattern: 'closed-class-delegation',
        note: 'Further consolidate UIRenderer and UIHelpers'
      },
      {
        system: 'ClientStats',
        batch: 5,
        currentLOC: 145,
        targetLOC: 85,
        reduction: 60,
        pattern: 'closed-class-delegation',
        note: 'Separate stats collection, formatting, and display'
      }
    ]
  },

  // BATCH 6: ENTITIES & APPS SYSTEMS (Low Risk, Data Focus)
  // Target: 350 LOC reduction
  // Risk Level: Low (well-defined data structures)

  batch6: {
    name: 'Entities & Apps Systems',
    priority: 'medium',
    risk: 'low',
    expectedReduction: 350,
    systems: [
      {
        system: 'Entities',
        batch: 6,
        currentLOC: 165,
        targetLOC: 95,
        reduction: 70,
        pattern: 'closed-class-delegation',
        note: 'Separate entity spawning, destruction, and lifecycle'
      },
      {
        system: 'Apps',
        batch: 6,
        currentLOC: 142,
        targetLOC: 80,
        reduction: 62,
        pattern: 'closed-class-delegation',
        note: 'Separate app registration, execution, and state'
      },
      {
        system: 'Blueprints',
        batch: 6,
        currentLOC: 128,
        targetLOC: 75,
        reduction: 53,
        pattern: 'closed-class-delegation',
        note: 'Separate blueprint loading, parsing, and instantiation'
      },
      {
        system: 'Properties',
        batch: 6,
        currentLOC: 185,
        targetLOC: 110,
        reduction: 75,
        pattern: 'schema-registry',
        note: 'Property definition schema consolidation'
      }
    ]
  },

  // BATCH 7: AUDIO & ENVIRONMENT (Low Risk, Optional Features)
  // Target: 400 LOC reduction
  // Risk Level: Low (mostly standalone features)

  batch7: {
    name: 'Audio & Environment Systems',
    priority: 'medium',
    risk: 'low',
    expectedReduction: 400,
    systems: [
      {
        system: 'ClientLiveKit',
        batch: 7,
        currentLOC: 129,
        targetLOC: 70,
        reduction: 59,
        pattern: 'closed-class-delegation',
        note: 'Further consolidation of voice and screen sharing'
      },
      {
        system: 'ClientAudio',
        batch: 7,
        currentLOC: 156,
        targetLOC: 85,
        reduction: 71,
        pattern: 'closed-class-delegation',
        note: 'Separate spatial audio, attenuation, and effects'
      },
      {
        system: 'Wind',
        batch: 7,
        currentLOC: 84,
        targetLOC: 50,
        reduction: 34,
        pattern: 'closed-class-delegation',
        note: 'Extract wind effect calculations'
      },
      {
        system: 'Avatars',
        batch: 7,
        currentLOC: 165,
        targetLOC: 95,
        reduction: 70,
        pattern: 'closed-class-delegation',
        note: 'Separate avatar loading, rigging, and animation'
      },
      {
        system: 'AvatarPreview',
        batch: 7,
        currentLOC: 146,
        targetLOC: 85,
        reduction: 61,
        pattern: 'closed-class-delegation',
        note: 'Further consolidation of camera and stats'
      }
    ]
  },

  // BATCH 8: OPTIONAL - FURTHER OPTIMIZATIONS
  batch8: {
    name: 'Optional Optimizations',
    priority: 'low',
    risk: 'medium',
    expectedReduction: 500,
    systems: [
      {
        system: 'CSM',
        batch: 8,
        currentLOC: 759,
        targetLOC: 350,
        reduction: 409,
        pattern: 'feature-optional',
        note: 'Make cascaded shadow mapping fully optional/lazy'
      },
      {
        system: 'VRM',
        batch: 8,
        currentLOC: 245,
        targetLOC: 120,
        reduction: 125,
        pattern: 'closed-class-delegation',
        note: 'Simplify VRM animation and bone management'
      }
    ]
  }
}

// CONFIGURATION VALIDATION SCHEMA
export const BatchValidationSchema = {
  required: ['name', 'priority', 'risk', 'expectedReduction', 'systems'],
  systemRequired: ['system', 'batch', 'currentLOC', 'targetLOC', 'reduction', 'pattern'],
  riskLevels: ['low', 'medium', 'high'],
  patterns: [
    'closed-class-delegation',
    'factory-delegation',
    'handler-registry',
    'registry-pattern',
    'unified-facade',
    'schema-registry',
    'feature-optional'
  ]
}

// TOTAL METRICS
export const ProjectMetrics = {
  totalBatches: 7,
  totalSystems: 30,
  totalLOCReduction: 3252,
  totalModulesCreated: 65,
  currentCodebase: 76598,
  targetCodebase: 73346,
  percentageReduction: 4.25,
  estimatedTimePerBatch: '1-3 weeks',
  parallelExecutionPossible: true
}

// EXTRACTION PATTERN TEMPLATES
export const ExtractionPatterns = {
  'closed-class-delegation': {
    description: 'Core system delegates to focused helper classes',
    structure: `
      class MainSystem {
        constructor() {
          this.helper1 = new Helper1(this)
          this.helper2 = new Helper2(this)
        }
        publicMethod() {
          return this.helper1.execute()
        }
      }
      class Helper1 {
        constructor(parent) { this.parent = parent }
        execute() { /* focused logic */ }
      }
    `,
    bestFor: 'Large systems with 3+ distinct responsibilities',
    reduction: '30-70%'
  },
  'factory-delegation': {
    description: 'Specialized factory classes for different component types',
    structure: `
      class Loader {
        constructor() {
          this.videoFactory = new VideoFactory()
          this.imageFactory = new ImageFactory()
        }
      }
    `,
    bestFor: 'Systems managing multiple component types',
    reduction: '40-60%'
  },
  'handler-registry': {
    description: 'Registry pattern for event/packet handlers',
    structure: `
      class PacketHandlers {
        static registry = {
          'playerJoined': handlePlayerJoined,
          'playerLeft': handlePlayerLeft
        }
        static handle(type, data) {
          return this.registry[type](data)
        }
      }
    `,
    bestFor: 'Systems with many similar handler methods',
    reduction: '50-80%'
  },
  'unified-facade': {
    description: 'Multiple extracted modules under single parent facade',
    structure: `
      class Builder {
        constructor() {
          this.fileHandler = new FileDropHandler(this)
          this.gizmo = new GizmoManager(this)
          this.undo = new UndoManager()
        }
      }
    `,
    bestFor: 'Systems with 5+ extracted modules needing coordination',
    reduction: '40-60%'
  }
}

export default ModularizationConfig
