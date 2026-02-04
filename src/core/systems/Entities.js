import { System } from './System.js'
import { EntitySpawner } from './entities/EntitySpawner.js'
import { EntityLifecycle } from './entities/EntityLifecycle.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Entities')

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
    this.spawner = new EntitySpawner(world, this)
    this.lifecycle = new EntityLifecycle(world, this)
  }

  get(id) {
    return this.items.get(id)
  }

  getPlayer(entityId) {
    return this.players.get(entityId)
  }

  get apps() {
    const apps = []
    for (const e of this.items.values()) {
      if (e.isApp) apps.push(e)
    }
    return apps
  }

  get playerEntities() {
    const players = []
    for (const e of this.items.values()) {
      if (e.isPlayer) players.push(e)
    }
    return players
  }

  countApps() {
    let count = 0
    for (const e of this.items.values()) {
      if (e.isApp) count++
    }
    return count
  }

  countPlayers() {
    let count = 0
    for (const e of this.items.values()) {
      if (e.isPlayer) count++
    }
    return count
  }

  add(data, local) {
    return this.spawner.spawn(data, local)
  }

  remove(id) {
    this.lifecycle.remove(id)
  }

  setHot(entity, hot) {
    this.lifecycle.setHot(entity, hot)
  }

  fixedUpdate(delta) {
    this.lifecycle.fixedUpdate(delta)
  }

  update(delta) {
    this.lifecycle.update(delta)
  }

   lateUpdate(delta) {
     this.lifecycle.lateUpdate(delta)
   }

   commit() {
     // Synchronize removed entities to clients
     if (this.removed.length > 0 && this.network && this.network.send) {
       for (const entityId of this.removed) {
         this.network.send('entityRemoved', { id: entityId })
       }
       this.removed = []
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
    if (!Array.isArray(datas)) {
      logger.warn('Entities.deserialize() received non-array data', { dataType: typeof datas })
      return
    }
    for (const data of datas) {
      if (data && typeof data === 'object') {
        this.add(data)
      } else {
        logger.warn('Invalid entity data in deserialization', { dataType: typeof data })
      }
    }
  }

  destroy() {
    this.lifecycle.destroy()
  }
}
