import { App } from '../../entities/App.js'
import { PlayerLocal } from '../../entities/PlayerLocal.js'
import { PlayerRemote } from '../../entities/PlayerRemote.js'
import { EVENT } from '../../constants/EventNames.js'

let hyperfyEntityValidation = null

const Types = {
  app: App,
  playerLocal: PlayerLocal,
  playerRemote: PlayerRemote,
}

export class EntitySpawner {
  constructor(world, entities) {
    this.world = world
    this.entities = entities
  }

  spawn(data, local) {
    console.log('EntitySpawner.spawn() called', { type: data.type, id: data.id, userId: data.userId, networkId: this.entities.network?.id })
    if (hyperfyEntityValidation && data.type === 'app' && data.blueprint) {
      const validation = hyperfyEntityValidation.validateEntityCreation(this.world, data)
      if (!validation.valid) {
        console.error('🚫 Entity creation rejected:', validation.error)
        if (local && this.entities.network && this.entities.network.send) {
          this.entities.network.send('entityCreationFailed', validation.error)
        }
        return null
      }
    }

    let Entity
    if (data.type === 'player') {
      Entity = Types[data.userId === this.entities.network.id ? 'playerLocal' : 'playerRemote']
      console.log('Creating player entity', { isLocal: data.userId === this.entities.network.id })
    } else {
      Entity = Types[data.type]
    }
    console.log('Entity class resolved:', Entity?.name || 'unknown')
    const entity = new Entity(this.world, data, local)
    this.entities.items.set(entity.data.id, entity)

    if (data.type === 'player') {
      this.entities.players.set(entity.data.id, entity)
      if (this.entities.network.isClient && data.userId !== this.entities.network.id) {
        this.entities.events.emit(EVENT.game.enter, { playerId: entity.data.id })
      }
    }

    if (data.userId === this.entities.network.id) {
      this.entities.player = entity
      this.entities.events.emit(EVENT.player, entity)
    }

    this.entities.events.emit(EVENT.entity.added, entity)
    return entity
  }
}
