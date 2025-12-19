// IMPROVEMENT_CONFIG.js - Phase 2 Modularization Framework
// Additional 2,600-3,400 LOC reduction across 6 batches
// Configuration-driven approach to systematically improve Hyperfy systems

export const ImprovementConfig = {

  // BATCH 8: OPTIONAL FEATURE OPTIMIZATION (High Impact, Medium Risk)
  // Target: 859+ LOC reduction
  batch8: {
    name: 'Optional Feature Optimization',
    priority: 'high',
    risk: 'medium',
    expectedReduction: 859,
    systems: [
      {
        system: 'CSM',
        file: 'src/core/libs/csm/CSM.js',
        currentLOC: 759,
        targetLOC: 350,
        reduction: 409,
        pattern: 'lazy-loading',
        strategy: 'Convert to optional plugin loaded on-demand',
        implementation: [
          'Extract CSMPlugin.js wrapper',
          'Add lazy import in ClientGraphics when shadows enabled',
          'Cache loaded instance for reuse'
        ]
      },
      {
        system: 'ButtonMappings',
        file: 'src/core/extras/ButtonMappings.js',
        currentLOC: 221,
        targetLOC: 100,
        reduction: 121,
        pattern: 'data-compression',
        strategy: 'Generate mapping tables programmatically',
        implementation: [
          'Create generateButtonMappings() factory',
          'Use inverse mapping instead of duplicate tables',
          'Reduce from 4 objects to 2'
        ]
      },
      {
        system: 'VRM',
        file: 'src/core/libs/three-vrm/index.js',
        currentLOC: 5530,
        targetLOC: 0,
        reduction: 5530,
        pattern: 'npm-externalization',
        strategy: 'Replace bundled library with npm package',
        note: 'OPTIONAL - HIGH RISK - Only if build system supports',
        skipByDefault: true
      }
    ]
  },

  // BATCH 9: SYSTEM CONSOLIDATION (High Impact, Low-Medium Risk)
  // Target: 700-950 LOC reduction
  batch9: {
    name: 'System Consolidation',
    priority: 'critical',
    risk: 'low',
    expectedReduction: 825,
    systems: [
      {
        system: 'ClientControls',
        file: 'src/core/systems/ClientControls.js',
        currentLOC: 529,
        targetLOC: 250,
        reduction: 279,
        pattern: 'closed-class-delegation',
        extractions: [
          {
            name: 'XRControllerManager',
            expectedLOC: 100,
            methods: ['updateXRControllers', 'processGamepadInput']
          },
          {
            name: 'TouchInputHandler',
            expectedLOC: 80,
            methods: ['onTouchStart', 'onTouchMove', 'onTouchEnd']
          },
          {
            name: 'ButtonStateTracker',
            expectedLOC: 70,
            methods: ['trackButtonState', 'updateButtonValues']
          }
        ]
      },
      {
        system: 'ClientLiveKit',
        file: 'src/core/systems/ClientLiveKit.js',
        currentLOC: 346,
        targetLOC: 256,
        reduction: 90,
        pattern: 'closure-consolidation',
        strategy: 'Further inline voice level and track management',
        implementation: [
          'Merge VoiceLevelManager into voice closure factory',
          'Inline track subscription handlers',
          'Simplify participant tracking'
        ]
      },
      {
        system: 'PlayerLocal',
        file: 'src/core/entities/PlayerLocal.js',
        currentLOC: 321,
        targetLOC: 211,
        reduction: 110,
        pattern: 'coordinator-consolidation',
        strategy: 'Merge PlayerStateCoordinator and render methods',
        implementation: [
          'Inline state coordination into update loop',
          'Consolidate render matrix calculations',
          'Remove redundant property delegations'
        ]
      },
      {
        system: 'ClientActions',
        file: 'src/core/systems/ClientActions.js',
        currentLOC: 265,
        targetLOC: 195,
        reduction: 70,
        pattern: 'utility-consolidation',
        strategy: 'Consolidate canvas drawing utilities',
        implementation: [
          'Create single CanvasDrawUtils module',
          'Merge box/circle/pie chart methods',
          'Share path building logic'
        ]
      },
      {
        system: 'Nametags',
        file: 'src/core/systems/Nametags.js',
        currentLOC: 230,
        targetLOC: 170,
        reduction: 60,
        pattern: 'closure-consolidation',
        strategy: 'Inline texture management and health rendering',
        implementation: [
          'Merge texture atlas creation inline',
          'Consolidate health bar rendering',
          'Simplify instance tracking'
        ]
      }
    ]
  },

  // BATCH 10: ENTITY & NODE EXTRACTION (Medium Impact, Low Risk)
  // Target: 600-800 LOC reduction
  batch10: {
    name: 'Entity & Node Extraction',
    priority: 'high',
    risk: 'low',
    expectedReduction: 700,
    systems: [
      {
        system: 'SkinnedMesh',
        file: 'src/core/nodes/SkinnedMesh.js',
        currentLOC: 213,
        targetLOC: 123,
        reduction: 90,
        pattern: 'factory-extraction',
        extractions: [
          {
            name: 'AnimationActionManager',
            expectedLOC: 60,
            methods: ['createActions', 'updateAction', 'fadeAction']
          }
        ]
      },
      {
        system: 'Joint',
        file: 'src/core/nodes/Joint.js',
        currentLOC: 204,
        targetLOC: 124,
        reduction: 80,
        pattern: 'factory-extraction',
        extractions: [
          {
            name: 'JointTypeFactory',
            expectedLOC: 50,
            note: 'Factory for spherical/revolute/prismatic/fixed joints'
          }
        ]
      },
      {
        system: 'RigidBody',
        file: 'src/core/nodes/RigidBody.js',
        currentLOC: 196,
        targetLOC: 146,
        reduction: 50,
        pattern: 'closure-consolidation',
        strategy: 'Inline remaining shape management'
      },
      {
        system: 'PlayerInputHandler+Processor',
        files: [
          'src/core/entities/player/PlayerInputHandler.js',
          'src/core/entities/player/PlayerInputProcessor.js'
        ],
        currentLOC: 385,
        targetLOC: 265,
        reduction: 120,
        pattern: 'module-merge',
        strategy: 'Merge duplicated camera/zoom logic into unified InputStateManager',
        risk: 'medium'
      },
      {
        system: 'PlayerPhysicsState',
        file: 'src/core/entities/player/PlayerPhysicsState.js',
        currentLOC: 141,
        targetLOC: 86,
        reduction: 55,
        pattern: 'state-machine',
        strategy: 'Extract state transitions into compact state machine'
      },
      {
        system: 'PlayerPhysics+Modules',
        files: [
          'src/core/entities/player/PlayerPhysics.js',
          'src/core/entities/player/VelocityCalculator.js',
          'src/core/entities/player/PlayerGroundDetector.js'
        ],
        currentLOC: 302,
        targetLOC: 212,
        reduction: 90,
        pattern: 'module-merge',
        strategy: 'Merge related physics calculations with preserved vector pools',
        risk: 'medium',
        note: 'Must preserve module-scoped vector pools for performance'
      }
    ]
  },

  // BATCH 11: UI COMPONENT CONSOLIDATION (Medium Impact, Low Risk)
  // Target: 285-365 LOC reduction
  batch11: {
    name: 'UI Component Consolidation',
    priority: 'medium',
    risk: 'low',
    expectedReduction: 325,
    systems: [
      {
        system: 'SidebarPanes',
        path: 'src/client/components/SidebarPanes/',
        currentLOC: 1449,
        targetLOC: 1224,
        reduction: 225,
        pattern: 'style-consolidation',
        strategy: 'Consolidate 24 small style files into SidebarStyles.js barrel',
        implementation: [
          'Create SidebarStyles.js with all style objects',
          'Update imports in all panes',
          'Remove individual style files'
        ]
      },
      {
        system: 'App Sidebar',
        file: 'src/client/components/SidebarPanes/App.js',
        currentLOC: 144,
        targetLOC: 109,
        reduction: 35,
        pattern: 'hook-extraction',
        strategy: 'Convert AppLogic class to useAppLogic hook'
      },
      {
        system: 'Players Sidebar',
        file: 'src/client/components/SidebarPanes/Players.js',
        currentLOC: 122,
        targetLOC: 87,
        reduction: 35,
        pattern: 'hook-extraction',
        strategy: 'Extract usePlayerActions hook for action handlers'
      },
      {
        system: 'World Sidebar',
        file: 'src/client/components/SidebarPanes/World.js',
        currentLOC: 104,
        targetLOC: 74,
        reduction: 30,
        pattern: 'hook-reuse',
        strategy: 'Apply useSyncedState pattern for world settings'
      }
    ]
  },

  // BATCH 12: AVATAR SYSTEM CONSOLIDATION (Medium Impact, Medium Risk)
  // Target: 250-350 LOC reduction
  batch12: {
    name: 'Avatar System Consolidation',
    priority: 'medium',
    risk: 'medium',
    expectedReduction: 300,
    systems: [
      {
        system: 'VRM Avatar Controllers',
        path: 'src/core/extras/avatar/',
        currentLOC: 1791,
        targetLOC: 1491,
        reduction: 300,
        pattern: 'factory-consolidation',
        strategy: 'Consolidate 19 controller files into unified VRMControllerFactory',
        implementation: [
          'Create VRMControllerFactory with type-based controller creation',
          'Merge similar controller patterns (IK, look-at, blink)',
          'Preserve individual controller classes as factory products',
          'Reduce boilerplate in controller setup'
        ],
        note: 'Complex VRM spec - test thoroughly with various avatar types'
      }
    ]
  },

  // BATCH 13: PATTERN UNIFICATION (Low-Medium Impact, Low Risk)
  // Target: 100-200 LOC reduction
  batch13: {
    name: 'Pattern Unification',
    priority: 'low',
    risk: 'low',
    expectedReduction: 150,
    systems: [
      {
        system: 'Node Property Schemas',
        pattern: 'All 19 node files',
        currentLOC: 285,
        targetLOC: 135,
        reduction: 150,
        pattern: 'base-class-inheritance',
        strategy: 'Create PropertySchemaBuilder base class or mixin',
        implementation: [
          'Create BaseNodeWithSchema mixin',
          'Implement schema() as base method with defineProps helper',
          'All nodes extend/use base schema builder',
          'Eliminates duplicated schema setup code (10-20 LOC per node)'
        ]
      }
    ]
  }
}

// VALIDATION & METRICS
export const Phase2Metrics = {
  totalBatches: 6,
  totalSystems: 23,
  totalLOCReduction: 3159,
  currentCodebase: 80175,
  targetCodebase: 77016,
  percentageReduction: 3.94,
  riskDistribution: {
    low: 15,
    medium: 7,
    high: 1
  }
}

export const BatchValidationSchema = {
  required: ['name', 'priority', 'risk', 'expectedReduction', 'systems'],
  systemRequired: ['system', 'currentLOC', 'targetLOC', 'reduction', 'pattern'],
  riskLevels: ['low', 'medium', 'high'],
  patterns: [
    'lazy-loading',
    'data-compression',
    'npm-externalization',
    'closed-class-delegation',
    'closure-consolidation',
    'utility-consolidation',
    'factory-extraction',
    'module-merge',
    'state-machine',
    'style-consolidation',
    'hook-extraction',
    'hook-reuse',
    'factory-consolidation',
    'base-class-inheritance',
    'coordinator-consolidation'
  ]
}

export default ImprovementConfig
