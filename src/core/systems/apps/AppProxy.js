import { isArray } from 'lodash-es'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import { fileRemaps } from './fileRemaps.js'

const internalEvents = [
  'fixedUpdate',
  'updated',
  'lateUpdate',
  'destroy',
  'enter',
  'leave',
  'chat',
  'command',
  'health',
]

export class AppProxy {
  constructor(world) {
    this.world = world
  }

  getGetters() {
    return {
      instanceId: (entity) => entity.data.id,
      version: (entity) => entity.blueprint.version,
      modelUrl: (entity) => entity.blueprint.model,
      state: (entity) => entity.data.state,
      props: (entity) => entity.blueprint.props,
      keepActive: (entity) => entity.keepActive,
    }
  }

  getSetters() {
    return {
      state: (entity, value) => {
        entity.data.state = value
      },
      keepActive: (entity, value) => {
        entity.keepActive = value
      },
    }
  }

  getMethods() {
    return {
      on: (entity, name, callback) => {
        entity.on(name, callback)
      },
      off: (entity, name, callback) => {
        entity.off(name, callback)
      },
      send: (entity, name, data, ignoreSocketId) => {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot send internal events (${name})`)
        }
        const event = [entity.data.id, entity.blueprint.version, name, data]
        this.world.network.send('entityEvent', event, ignoreSocketId)
      },
      sendTo: (entity, playerId, name, data) => {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot send internal events (${name})`)
        }
        if (!this.world.network.isServer) {
          throw new Error('sendTo can only be called on the server')
        }
        const player = this.world.entities.get(playerId)
        if (!player) return
        const event = [entity.data.id, entity.blueprint.version, name, data]
        this.world.network.sendTo(playerId, 'entityEvent', event)
      },
      emit: (entity, name, data) => {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot emit internal events (${name})`)
        }
        this.world.events.emit(name, data)
      },
      create: (entity, name, data) => {
        const node = entity.createNode(name, data)
        return node.getProxy()
      },
      control: (entity, options) => {
        entity.control?.release()
        entity.control = this.world.controls.bind({
          ...options,
          priority: ControlPriorities.APP,
          object: entity,
        })
        return entity.control
      },
      configure: (entity, fields) => {
        if (!isArray(fields)) {
          entity.fields = []
        } else {
          entity.fields = fields
        }
        const props = entity.blueprint.props
        for (const field of entity.fields) {
          fileRemaps[field.type]?.(field)
          if (field.initial !== undefined && props[field.key] === undefined) {
            props[field.key] = field.initial
          }
        }
        entity.onFields?.(entity.fields)
      },
    }
  }
}
