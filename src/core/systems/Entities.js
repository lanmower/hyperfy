import { App } from '../entities/App.js'
import { PlayerLocal } from '../entities/PlayerLocal.js'
import { PlayerRemote } from '../entities/PlayerRemote.js'
import { System } from './System.js'

// Import validation system to prevent entities with invalid blueprints
let hyperfyEntityValidation = null

const Types = {
  app: App,
  playerLocal: PlayerLocal,
  playerRemote: PlayerRemote,
}

/**
 * Entities System
 *
 * - Runs on both the server and client.
 * - Supports inserting entities into the world
 * - Executes entity scripts
 *
 */
export class Entities extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
    this.players = new Map()
    this.player = null
    this.hot = new Set()
    this.removed = []
  }

  get(id) {
    return this.items.get(id)
  }

  getPlayer(entityId) {
    return this.players.get(entityId)
  }

  add(data, local) {
    // CRITICAL FIX: Validate blueprint exists before creating entity
    // This prevents the core issue where entities persist with invalid blueprint references
    if (hyperfyEntityValidation && data.type === 'app' && data.blueprint) {
      const validation = hyperfyEntityValidation.validateEntityCreation(this.world, data)
      if (!validation.valid) {
        console.error('🚫 Entity creation rejected:', validation.error)
        if (local && this.world.network && this.world.network.send) {
          this.world.network.send('entityCreationFailed', validation.error)
        }
        return null // Don't create the entity
      }
    }
    
    // Proceed with entity creation only if validation passed
    let Entity
    if (data.type === 'player') {
      Entity = Types[data.userId === this.world.network.id ? 'playerLocal' : 'playerRemote']
    } else {
      Entity = Types[data.type]
    }
    const entity = new Entity(this.world, data, local)
    this.items.set(entity.data.id, entity)
    if (data.type === 'player') {
      this.players.set(entity.data.id, entity)
      // on the client remote players emit enter events here.
      // but on the server, enter events is delayed for players entering until after their snapshot is sent
      // that way they can actually respond correctly to follow-through events.
      // see ServerNetwork.js -> onConnection
      if (this.world.network.isClient && data.userId !== this.world.network.id) {
        this.world.events.emit('enter', { playerId: entity.data.id })
      }
    }
    if (data.userId === this.world.network.id) {
      this.player = entity
      this.world.events.emit('player', entity)
    }
    this.world.events.emit('entityAdded', entity)
    return entity
  }

  remove(id) {
    const entity = this.items.get(id)
    if (!entity) return console.warn(`tried to remove entity that did not exist: ${id}`)
    if (entity.isPlayer) this.players.delete(entity.data.id)
    entity.destroy()
    this.items.delete(id)
    this.removed.push(id)
    this.world.events.emit('entityRemoved', id)
  }

  setHot(entity, hot) {
    if (hot) {
      this.hot.add(entity)
    } else {
      this.hot.delete(entity)
    }
  }

  fixedUpdate(delta) {
    for (const entity of this.hot) {
      entity.fixedUpdate(delta)
    }
  }

  update(delta) {
    for (const entity of this.hot) {
      entity.update(delta)
    }
  }

  lateUpdate(delta) {
    for (const entity of this.hot) {
      entity.lateUpdate(delta)
    }
  }

  serialize() {
    const data = []
    this.items.forEach(entity => {
      data.push(entity.serialize())
    })
    return data
  }

  deserialize(datas) {
    for (const data of datas) {
      this.add(data)
    }
  }

  destroy() {
    this.items.forEach(item => {
      this.remove(item.data.id)
    })
    this.items.clear()
    this.players.clear()
    this.hot.clear()
  }
}
