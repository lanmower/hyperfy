import { isArray } from 'lodash-es'
import * as THREE from '../../extras/three.js'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import * as NodeClasses from '../../nodes/index.js'
import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { SYSTEM_INTERNAL_EVENTS } from '../../utils/events/EventConstants.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { FILE_TYPES } from './FieldTypeConstants.js'

const logger = new StructuredLogger('AppAPIConfig')

const fileRemaps = Object.fromEntries(FILE_TYPES.map(type => [
  type,
  field => { field.type = 'file'; field.kind = type }
]))

const b = new APIConfigBuilder('AppAPIConfig')

// Instance Properties
b.addGetter('instanceId', (apps, entity) => entity.data.id, { defaultReturn: null })
b.addGetter('version', (apps, entity) => entity.blueprint?.version, { defaultReturn: null })
b.addGetter('modelUrl', (apps, entity) => entity.blueprint?.model, { defaultReturn: null })
b.addGetter('state', (apps, entity) => entity.data.state, { defaultReturn: {} })
b.addGetter('props', (apps, entity) => entity.blueprint?.props || {}, { defaultReturn: {} })
b.addGetter('config', (apps, entity) => entity.blueprint?.props || {}, { defaultReturn: {} })
b.addGetter('keepActive', (apps, entity) => entity.keepActive, { defaultReturn: false })

// Transform & Matrix Properties
b.addGetter('matrixWorld', (apps, entity) => {
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
}, { defaultReturn: new THREE.Matrix4() })

b.addGetter('position', (apps, entity) => {
  const pos = entity.data?.position || [0, 0, 0]
  return new THREE.Vector3(pos[0], pos[1], pos[2])
}, { defaultReturn: new THREE.Vector3() })

b.addGetter('quaternion', (apps, entity) => {
  const quat = entity.data?.quaternion || [0, 0, 0, 1]
  return new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3])
}, { defaultReturn: new THREE.Quaternion() })

b.addGetter('scale', (apps, entity) => {
  const scale = entity.data?.scale || [1, 1, 1]
  return new THREE.Vector3(scale[0], scale[1], scale[2])
}, { defaultReturn: new THREE.Vector3(1, 1, 1) })

// Setters
b.addSetter('state', (apps, entity, value) => {
  ValidationHelper.assertIsObject(value, 'state', { operation: 'set state' })
  entity.data.state = value
})

b.addSetter('keepActive', (apps, entity, value) => {
  if (typeof value !== 'boolean') {
    logger.warn('Expected boolean for keepActive', { received: typeof value })
    return
  }
  entity.keepActive = value
})

// Events & Communication
b.addMethod('on', (apps, entity, name, callback) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })
  entity.on(name, callback)
})

b.addMethod('off', (apps, entity, name, callback) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })
  entity.off(name, callback)
})

b.addMethod('send', (apps, entity, name, data, ignoreSocketId) => {
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
})

b.addMethod('sendTo', (apps, entity, playerId, name, data) => {
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
})

b.addMethod('emit', (apps, entity, name, data) => {
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
})

// Node & Scene Management
b.addMethod('create', (apps, entity, name, data) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'create' })

  if (!entity.createNode || typeof entity.createNode !== 'function') {
    throw new HyperfyError('INVALID_STATE', 'Entity does not support createNode', {
      operation: 'create',
      nodeName: name,
    })
  }

  const node = entity.createNode(name, data)
  if (!node) {
    throw new HyperfyError('NULL_REFERENCE', `Failed to create node: ${name}`, {
      operation: 'create',
      nodeName: name,
    })
  }
  const proxy = node.getProxy?.()
  return proxy || node
})

b.addMethod('add', (apps, entity, node) => {
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
})

b.addMethod('remove', (apps, entity, node) => {
  ValidationHelper.assertNotNull(node, 'node', { operation: 'remove' })

  if (!entity.root) {
    throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'remove' })
  }

  const ref = node.ref || node
  if (ref && ref.parent === entity.root) {
    entity.root.remove(ref)
  }
  ref?.deactivate?.()
})

b.addMethod('traverse', (apps, entity, callback) => {
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'traverse' })

  if (!entity.root) {
    throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'traverse' })
  }

  entity.root.traverse(callback)
})

b.addMethod('clean', (apps, entity) => {
  if (!entity.root) {
    logger.warn('Entity root not initialized for clean', { entityId: entity.data.id })
    return
  }

  entity.root.clean?.()
})

// Configuration
b.addMethod('configure', (apps, entity, fields) => {
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
})

b.addMethod('control', (apps, entity, options) => {
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
})

// Storage
b.addMethodDirect('get', (apps, entity, key) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'get' })
  return entity.data.state?.[key]
}, {
  module: 'AppAPIConfig',
  method: 'get',
})

b.addMethodDirect('set', (apps, entity, key, value) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'set' })
  if (!entity.data.state) entity.data.state = {}
  entity.data.state[key] = value
}, {
  module: 'AppAPIConfig',
  method: 'set',
})

export const AppAPIConfig = b.build()
