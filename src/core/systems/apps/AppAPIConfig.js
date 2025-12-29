import { isArray } from 'lodash-es'
import * as THREE from '../../extras/three.js'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import * as NodeClasses from '../../nodes/index.js'
import { HyperfyError } from '../error/ErrorCodes.js'
import ValidationHelper from '../error/ValidationHelper.js'
import { APIMethodWrapper } from '../../utils/api/APIMethodWrapper.js'
import { SYSTEM_INTERNAL_EVENTS } from '../../utils/events/EventConstants.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AppAPIConfig')

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
    instanceId: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.data.id,
      { module: 'AppAPIConfig', method: 'instanceId', defaultReturn: null }
    ),

    version: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.blueprint?.version,
      { module: 'AppAPIConfig', method: 'version', defaultReturn: null }
    ),

    modelUrl: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.blueprint?.model,
      { module: 'AppAPIConfig', method: 'modelUrl', defaultReturn: null }
    ),

    state: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.data.state,
      { module: 'AppAPIConfig', method: 'state', defaultReturn: {} }
    ),

    props: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.blueprint?.props || {},
      { module: 'AppAPIConfig', method: 'props', defaultReturn: {} }
    ),

    config: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.blueprint?.props || {},
      { module: 'AppAPIConfig', method: 'config', defaultReturn: {} }
    ),

    keepActive: APIMethodWrapper.wrapGetter(
      (apps, entity) => entity.keepActive,
      { module: 'AppAPIConfig', method: 'keepActive', defaultReturn: false }
    ),

    matrixWorld: APIMethodWrapper.wrapGetter(
      (apps, entity) => {
        const m = new THREE.Matrix4()
        const pos = entity.data?.position || [0, 0, 0]
        const quat = entity.data?.quaternion || [0, 0, 0, 1]
        const scale = entity.data?.scale || [1, 1, 1]
        m.compose(
          new THREE.Vector3(pos[0], pos[1], pos[2]),
          new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3]),
          new THREE.Vector3(scale[0], scale[1], scale[2])
        )
        return m
      },
      { module: 'AppAPIConfig', method: 'matrixWorld', defaultReturn: new THREE.Matrix4() }
    ),

    position: APIMethodWrapper.wrapGetter(
      (apps, entity) => {
        const pos = entity.data?.position || [0, 0, 0]
        return new THREE.Vector3(pos[0], pos[1], pos[2])
      },
      { module: 'AppAPIConfig', method: 'position', defaultReturn: new THREE.Vector3() }
    ),

    quaternion: APIMethodWrapper.wrapGetter(
      (apps, entity) => {
        const quat = entity.data?.quaternion || [0, 0, 0, 1]
        return new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3])
      },
      { module: 'AppAPIConfig', method: 'quaternion', defaultReturn: new THREE.Quaternion() }
    ),

    scale: APIMethodWrapper.wrapGetter(
      (apps, entity) => {
        const scale = entity.data?.scale || [1, 1, 1]
        return new THREE.Vector3(scale[0], scale[1], scale[2])
      },
      { module: 'AppAPIConfig', method: 'scale', defaultReturn: new THREE.Vector3(1, 1, 1) }
    ),
  },

  setters: {
    state: APIMethodWrapper.wrapSetter(
      (apps, entity, value) => {
        ValidationHelper.assertIsObject(value, 'state', { operation: 'set state' })
        entity.data.state = value
      },
      { module: 'AppAPIConfig', method: 'state' }
    ),

    keepActive: APIMethodWrapper.wrapSetter(
      (apps, entity, value) => {
        if (typeof value !== 'boolean') {
          logger.warn('Expected boolean for keepActive', { received: typeof value })
          return
        }
        entity.keepActive = value
      },
      { module: 'AppAPIConfig', method: 'keepActive' }
    ),
  },

  methods: {
    on: APIMethodWrapper.wrapWithValidation(
      (apps, entity, name, callback) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })
        entity.on(name, callback)
      },
      { module: 'AppAPIConfig', method: 'on', operation: 'on' }
    ),

    off: APIMethodWrapper.wrapWithValidation(
      (apps, entity, name, callback) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })
        entity.off(name, callback)
      },
      { module: 'AppAPIConfig', method: 'off', operation: 'off' }
    ),

    send: APIMethodWrapper.wrapWithValidation(
      (apps, entity, name, data, ignoreSocketId) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'send' })

        const internalEvents = SYSTEM_INTERNAL_EVENTS
        if (internalEvents.includes(name)) {
          throw new HyperfyError('PERMISSION_DENIED', `apps cannot send internal events (${name})`, {
            eventName: name,
            operation: 'send',
          })
        }

        if (!apps?.world?.network) {
          throw new HyperfyError('INVALID_STATE', 'Network system not available', { operation: 'send' })
        }

        const event = [entity.data.id, entity.blueprint?.version, name, data]
        apps.world.network.send('entityEvent', event, ignoreSocketId)
      },
      { module: 'AppAPIConfig', method: 'send', operation: 'send' }
    ),

    sendTo: APIMethodWrapper.wrapWithValidation(
      (apps, entity, playerId, name, data) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'sendTo' })
        ValidationHelper.assertIsString(playerId, 'playerId', { operation: 'sendTo' })

        if (!apps?.world?.network?.isServer) {
          throw new HyperfyError('PERMISSION_DENIED', 'sendTo can only be called on the server', {
            operation: 'sendTo',
          })
        }

        const internalEvents = SYSTEM_INTERNAL_EVENTS
        if (internalEvents.includes(name)) {
          throw new HyperfyError('PERMISSION_DENIED', `apps cannot send internal events (${name})`, {
            eventName: name,
            operation: 'sendTo',
          })
        }

        const player = apps.world.entities.get(playerId)
        if (!player) {
          logger.warn('Player not found for sendTo', { playerId })
          return
        }

        const event = [entity.data.id, entity.blueprint?.version, name, data]
        apps.world.network.sendTo(playerId, 'entityEvent', event)
      },
      { module: 'AppAPIConfig', method: 'sendTo', operation: 'sendTo' }
    ),

    emit: APIMethodWrapper.wrapWithValidation(
      (apps, entity, name, data) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'emit' })

        const internalEvents = SYSTEM_INTERNAL_EVENTS
        if (internalEvents.includes(name)) {
          throw new HyperfyError('PERMISSION_DENIED', `apps cannot emit internal events (${name})`, {
            eventName: name,
            operation: 'emit',
          })
        }

        if (!apps?.world?.events) {
          throw new HyperfyError('INVALID_STATE', 'Events system not available', { operation: 'emit' })
        }

        apps.world.events.emit(name, data)
      },
      { module: 'AppAPIConfig', method: 'emit', operation: 'emit' }
    ),

    create: APIMethodWrapper.wrapWithValidation(
      (apps, entity, name, data) => {
        ValidationHelper.assertIsString(name, 'name', { operation: 'create' })

        if (!entity.createNode || typeof entity.createNode !== 'function') {
          throw new HyperfyError('INVALID_STATE', 'Entity does not support createNode', {
            operation: 'create',
            nodeName: name,
          })
        }

        if (name === 'sky') {
          const skyNode = new NodeClasses.sky({})
          const ctx = { world: apps.world, entity }
          skyNode.ctx = ctx
          const proxy = skyNode.getProxy?.() || skyNode
          return proxy
        }

        const node = entity.createNode(name, data)
        return node.getProxy?.() || node
      },
      { module: 'AppAPIConfig', method: 'create', operation: 'create', defaultReturn: null }
    ),

    control: APIMethodWrapper.wrapWithValidation(
      (apps, entity, options) => {
        ValidationHelper.assertIsObject(options, 'options', { operation: 'control' })

        if (!apps?.world?.controls) {
          throw new HyperfyError('INVALID_STATE', 'Controls system not available', { operation: 'control' })
        }

        entity.control?.release()
        entity.control = apps.world.controls.bind({
          ...options,
          priority: ControlPriorities.APP,
          object: entity,
        })
        return entity.control
      },
      { module: 'AppAPIConfig', method: 'control', operation: 'control', defaultReturn: null }
    ),

    configure: APIMethodWrapper.wrapWithValidation(
      (apps, entity, fields) => {
        if (!isArray(fields)) {
          entity.fields = []
        } else {
          entity.fields = fields
        }

        if (!entity.blueprint) {
          logger.warn('Blueprint not loaded yet for configure', { entityId: entity.data.id })
          return
        }

        const props = entity.blueprint.props
        for (const field of entity.fields) {
          if (!field || typeof field !== 'object') {
            logger.warn('Invalid field object in configure', { field, entityId: entity.data.id })
            continue
          }
          fileRemaps[field.type]?.(field)
          if (field.initial !== undefined && props[field.key] === undefined) {
            props[field.key] = field.initial
          }
        }
        entity.onFields?.(entity.fields)
      },
      { module: 'AppAPIConfig', method: 'configure', operation: 'configure' }
    ),

    add: APIMethodWrapper.wrapWithValidation(
      (apps, entity, node) => {
        ValidationHelper.assertNotNull(node, 'node', { operation: 'add' })

        if (!entity.root) {
          throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'add' })
        }

        const ref = node.ref || node
        if (!ref) {
          throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'add' })
        }

        if (ref.parent) ref.parent.remove(ref)
        entity.root.add(ref)
        ref.mount?.()
        ref.activate?.({ world: apps.world, entity })
      },
      { module: 'AppAPIConfig', method: 'add', operation: 'add' }
    ),

    remove: APIMethodWrapper.wrapWithValidation(
      (apps, entity, node) => {
        ValidationHelper.assertNotNull(node, 'node', { operation: 'remove' })

        if (!entity.root) {
          throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'remove' })
        }

        const ref = node.ref || node
        if (ref && ref.parent === entity.root) {
          entity.root.remove(ref)
        }
        ref?.deactivate?.()
      },
      { module: 'AppAPIConfig', method: 'remove', operation: 'remove' }
    ),

    traverse: APIMethodWrapper.wrapWithValidation(
      (apps, entity, callback) => {
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'traverse' })

        if (!entity.root) {
          throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'traverse' })
        }

        entity.root.traverse(callback)
      },
      { module: 'AppAPIConfig', method: 'traverse', operation: 'traverse' }
    ),

    clean: APIMethodWrapper.wrapWithValidation(
      (apps, entity) => {
        if (!entity.root) {
          logger.warn('Entity root not initialized for clean', { entityId: entity.data.id })
          return
        }

        entity.root.clean?.()
      },
      { module: 'AppAPIConfig', method: 'clean', operation: 'clean' }
    ),
  },
}