import { isArray } from 'lodash-es'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import * as NodeClasses from '../../nodes/index.js'

const fileRemaps = {
  avatar: field => {
    field.type = 'file'
    field.kind = 'avatar'
  },
  emote: field => {
    field.type = 'file'
    field.kind = 'emote'
  },
  model: field => {
    field.type = 'file'
    field.kind = 'model'
  },
  texture: field => {
    field.type = 'file'
    field.kind = 'texture'
  },
  image: field => {
    field.type = 'file'
    field.kind = 'image'
  },
  video: field => {
    field.type = 'file'
    field.kind = 'video'
  },
  hdr: field => {
    field.type = 'file'
    field.kind = 'hdr'
  },
  audio: field => {
    field.type = 'file'
    field.kind = 'audio'
  },
}

export const AppAPIConfig = {
  getters: {
    instanceId: (apps, entity) => entity.data.id,
    version: (apps, entity) => entity.blueprint?.version,
    modelUrl: (apps, entity) => entity.blueprint?.model,
    state: (apps, entity) => entity.data.state,
    props: (apps, entity) => entity.blueprint?.props || {},
    config: (apps, entity) => entity.blueprint?.props || {},
    keepActive: (apps, entity) => entity.keepActive,
  },

  setters: {
    state: (apps, entity, value) => {
      entity.data.state = value
    },
    keepActive: (apps, entity, value) => {
      entity.keepActive = value
    },
  },

  methods: {
    on: (apps, entity, name, callback) => {
      entity.on(name, callback)
    },

    off: (apps, entity, name, callback) => {
      entity.off(name, callback)
    },

    send: (apps, entity, name, data, ignoreSocketId) => {
      const internalEvents = [
        'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
        'enter', 'leave', 'chat', 'command', 'health',
      ]
      if (internalEvents.includes(name)) {
        return console.error(`apps cannot send internal events (${name})`)
      }
      const event = [entity.data.id, entity.blueprint.version, name, data]
      apps.world.network.send('entityEvent', event, ignoreSocketId)
    },

    sendTo: (apps, entity, playerId, name, data) => {
      const internalEvents = [
        'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
        'enter', 'leave', 'chat', 'command', 'health',
      ]
      if (internalEvents.includes(name)) {
        return console.error(`apps cannot send internal events (${name})`)
      }
      if (!apps.world.network.isServer) {
        throw new Error('sendTo can only be called on the server')
      }
      const player = apps.world.entities.get(playerId)
      if (!player) return
      const event = [entity.data.id, entity.blueprint.version, name, data]
      apps.world.network.sendTo(playerId, 'entityEvent', event)
    },

    emit: (apps, entity, name, data) => {
      const internalEvents = [
        'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
        'enter', 'leave', 'chat', 'command', 'health',
      ]
      if (internalEvents.includes(name)) {
        return console.error(`apps cannot emit internal events (${name})`)
      }
      apps.world.events.emit(name, data)
    },

    create: (apps, entity, name, data) => {
      if (!entity || typeof entity.createNode !== 'function') {
        return null
      }
      const node = entity.createNode(name, data)
      return node.getProxy?.() || node
    },

    control: (apps, entity, options) => {
      entity.control?.release()
      entity.control = apps.world.controls.bind({
        ...options,
        priority: ControlPriorities.APP,
        object: entity,
      })
      return entity.control
    },

    configure: (apps, entity, fields) => {
      if (!isArray(fields)) {
        entity.fields = []
      } else {
        entity.fields = fields
      }

      if (!entity.blueprint) {
        console.warn('[AppAPIConfig.configure] Blueprint not loaded yet')
        return
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

    add: (apps, entity, node) => {
      if (!node || !entity.root) return
      const ref = node.ref || node

      if (ref.type === 'sky' && !ref.mount && ref.children !== undefined) {
        const skyNode = new NodeClasses.sky({})
        skyNode.ctx = { world: apps.world, entity }
        if (ref.bg) skyNode.bg = ref.bg
        if (ref.hdr) skyNode.hdr = ref.hdr
        if (ref.rotationY !== undefined) skyNode.rotationY = ref.rotationY
        if (ref.sunDirection) skyNode.sunDirection = ref.sunDirection
        if (ref.sunIntensity !== undefined) skyNode.sunIntensity = ref.sunIntensity
        if (ref.sunColor) skyNode.sunColor = ref.sunColor
        if (ref.fogNear !== undefined) skyNode.fogNear = ref.fogNear
        if (ref.fogFar !== undefined) skyNode.fogFar = ref.fogFar
        if (ref.fogColor) skyNode.fogColor = ref.fogColor
        entity.root.add(skyNode)
        skyNode.mount?.()
        return
      }

      if (ref.parent) ref.parent.remove(ref)
      entity.root.add(ref)
      ref.mount?.()
      ref.activate?.({ world: apps.world, entity })
    },

    remove: (apps, entity, node) => {
      if (!node || !entity.root) return
      const ref = node.ref || node
      if (ref.parent === entity.root) entity.root.remove(ref)
      ref.deactivate?.()
    },
  },
}
