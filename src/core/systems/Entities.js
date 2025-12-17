import { App } from '../entities/App.js'
import { PlayerLocal } from '../entities/PlayerLocal.js'
import { PlayerRemote } from '../entities/PlayerRemote.js'
import { System } from './System.js'

let hyperfyEntityValidation = null

const Types = {
  app: App,
  playerLocal: PlayerLocal,
  playerRemote: PlayerRemote,
}

export class Entities extends System {
  static DEPS = {
    network: 'network',
    events: 'events',
  }

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
    if (hyperfyEntityValidation && data.type === 'app' && data.blueprint) {
      const validation = hyperfyEntityValidation.validateEntityCreation(this.world, data)
      if (!validation.valid) {
        console.error('🚫 Entity creation rejected:', validation.error)
        if (local && this.network && this.network.send) {
          this.network.send('entityCreationFailed', validation.error)
        }
        return null // Don't create the entity
      }
    }

    let Entity
    if (data.type === 'player') {
      Entity = Types[data.userId === this.network.id ? 'playerLocal' : 'playerRemote']
    } else {
      Entity = Types[data.type]
    }
    const entity = new Entity(this.world, data, local)
    this.items.set(entity.data.id, entity)
    if (data.type === 'player') {
      this.players.set(entity.data.id, entity)
      if (this.network.isClient && data.userId !== this.network.id) {
        this.events.emit('enter', { playerId: entity.data.id })
      }
    }
    if (data.userId === this.network.id) {
      this.player = entity
      this.events.emit('player', entity)
    }
    this.events.emit('entityAdded', entity)
    return entity
  }

  remove(id) {
    const entity = this.items.get(id)
    if (!entity) return console.warn(`tried to remove entity that did not exist: ${id}`)
    if (entity.isPlayer) this.players.delete(entity.data.id)
    entity.destroy()
    this.items.delete(id)
    this.removed.push(id)
    this.events.emit('entityRemoved', id)
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
