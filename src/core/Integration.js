// Integration example - demonstrates how all new systems work together

import { Auto } from './Auto.js'
import { Props, propSchema } from './Props.js'
import { DynamicFactory } from './DynamicFactory.js'
import { DynamicWorld } from './DynamicWorld.js'
import { NodeBuilder, builder } from './NodeBuilder.js'
import { UnifiedNetwork } from './network/UnifiedNetwork.js'

export class Integration {
  // Example: Auto-discover and register systems from directory
  static async setupSystems(world, systemsPath) {
    const dynamic = new DynamicWorld(world)
    await dynamic.autoSystems(systemsPath)
    await dynamic.init()
    return dynamic
  }

  // Example: Create mesh node with builder pattern
  static createMesh(MeshClass, x, y, z) {
    return builder(MeshClass, 'Mesh')
      .position(x, y, z)
      .color('#0088ff')
      .set('type', 'box')
      .set('width', 2)
      .set('height', 2)
      .set('depth', 2)
      .build()
  }

  // Example: Create UI container with builder
  static createUIContainer(UIClass, width, height) {
    return builder(UIClass, 'UI')
      .set('width', width)
      .set('height', height)
      .set('display', 'flex')
      .set('flexDirection', 'row')
      .set('justifyContent', 'center')
      .set('alignItems', 'center')
      .set('gap', 16)
      .build()
  }

  // Example: Create audio with properties
  static createAudio(AudioClass, src, volume = 1) {
    const props = Props.validate({
      src,
      volume,
      loop: false,
      spatial: true,
      group: 'sfx',
    }, propSchema(['src', 'volume', 'loop', 'spatial', 'group']))
    
    return new AudioClass(props)
  }

  // Example: Setup dynamic factory for all entity types
  static async setupFactory(factory, entitiesPath) {
    await factory.discover(entitiesPath)
    return factory
  }

  // Example: Create entity with factory and builder
  static createEntity(factory, NodeClass, type, data) {
    const node = factory.create(type, data)
    return builder(NodeClass).setAll(node).build()
  }

  // Example: Setup network
  static async setupNetwork(isServer = false, options = {}) {
    const network = new UnifiedNetwork({ isServer, ...options })
    
    if (isServer) {
      await network.initServer(options)
      network.on('playerJoined', (id, data) => {
        console.log(`Player ${id} joined: ${data.name}`)
      })
    } else {
      await network.initClient({
        wsUrl: options.wsUrl || 'ws://localhost:3000',
        name: options.name || 'Player',
        avatar: options.avatar || null,
      })
      network.on('entityCreated', (data) => {
        console.log(`Entity created: ${data.id}`)
      })
    }
    
    return network
  }

  // Example: Complete world setup with all systems
  static async setupWorld(world, config = {}) {
    const systemsPath = config.systemsPath || './src/core/systems'
    const entitiesPath = config.entitiesPath || './src/core/entities'
    const isServer = config.isServer || false

    // Setup systems
    const systems = await this.setupSystems(world, systemsPath)
    
    // Setup factory
    const factory = new DynamicFactory()
    await this.setupFactory(factory, entitiesPath)
    world.factory = factory

    // Setup network
    const network = await this.setupNetwork(isServer, config.networkOptions)
    world.network = network

    return {
      systems,
      factory,
      network,
    }
  }

  // Example: Auto-discover environment
  static async autoEnvironment() {
    return Auto.envFiltered('PUBLIC_')
  }

  // Example: Get type-safe config from env
  static getConfig() {
    return {
      port: Auto.env('PORT', 'number', 3000),
      debug: Auto.env('DEBUG', 'boolean', false),
      maxPlayers: Auto.env('MAX_PLAYERS', 'number', 32),
      assetsUrl: Auto.env('PUBLIC_ASSETS_URL', 'string', '/assets'),
    }
  }
}

export default Integration
