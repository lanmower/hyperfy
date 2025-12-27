import { isArray } from 'lodash-es'
import * as THREE from '../../extras/three.js'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import * as NodeClasses from '../../nodes/index.js'
import { HyperfyError } from '../error/ErrorCodes.js'
import ValidationHelper from '../error/ValidationHelper.js'

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
    instanceId: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get instanceId' })
        return entity.data.id
      } catch (e) {
        console.error('[AppAPIConfig.instanceId]', e.message)
        return null
      }
    },

    version: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get version' })
        return entity.blueprint?.version
      } catch (e) {
        console.error('[AppAPIConfig.version]', e.message)
        return null
      }
    },

    modelUrl: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get modelUrl' })
        return entity.blueprint?.model
      } catch (e) {
        console.error('[AppAPIConfig.modelUrl]', e.message)
        return null
      }
    },

    state: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get state' })
        return entity.data.state
      } catch (e) {
        console.error('[AppAPIConfig.state]', e.message)
        return {}
      }
    },

    props: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get props' })
        return entity.blueprint?.props || {}
      } catch (e) {
        console.error('[AppAPIConfig.props]', e.message)
        return {}
      }
    },

    config: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get config' })
        return entity.blueprint?.props || {}
      } catch (e) {
        console.error('[AppAPIConfig.config]', e.message)
        return {}
      }
    },

    keepActive: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get keepActive' })
        return entity.keepActive
      } catch (e) {
        console.error('[AppAPIConfig.keepActive]', e.message)
        return false
      }
    },

    matrixWorld: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get matrixWorld' })
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
      } catch (e) {
        console.error('[AppAPIConfig.matrixWorld]', e.message)
        return new THREE.Matrix4()
      }
    },

    position: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get position' })
        const pos = entity.data?.position || [0, 0, 0]
        return new THREE.Vector3(pos[0], pos[1], pos[2])
      } catch (e) {
        console.error('[AppAPIConfig.position]', e.message)
        return new THREE.Vector3()
      }
    },

    quaternion: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get quaternion' })
        const quat = entity.data?.quaternion || [0, 0, 0, 1]
        return new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3])
      } catch (e) {
        console.error('[AppAPIConfig.quaternion]', e.message)
        return new THREE.Quaternion()
      }
    },

    scale: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'get scale' })
        const scale = entity.data?.scale || [1, 1, 1]
        return new THREE.Vector3(scale[0], scale[1], scale[2])
      } catch (e) {
        console.error('[AppAPIConfig.scale]', e.message)
        return new THREE.Vector3(1, 1, 1)
      }
    },
  },

  setters: {
    state: (apps, entity, value) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'set state' })
        ValidationHelper.assertIsObject(value, 'state', { operation: 'set state' })
        entity.data.state = value
      } catch (e) {
        console.error('[AppAPIConfig.setState]', e.message)
      }
    },

    keepActive: (apps, entity, value) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'set keepActive' })
        if (typeof value !== 'boolean') {
          console.warn('[AppAPIConfig.setKeepActive] Expected boolean, got', typeof value)
          return
        }
        entity.keepActive = value
      } catch (e) {
        console.error('[AppAPIConfig.setKeepActive]', e.message)
      }
    },
  },

  methods: {
    on: (apps, entity, name, callback) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'on', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })
        entity.on(name, callback)
      } catch (e) {
        console.error('[AppAPIConfig.on]', e.message)
      }
    },

    off: (apps, entity, name, callback) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'off', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })
        entity.off(name, callback)
      } catch (e) {
        console.error('[AppAPIConfig.off]', e.message)
      }
    },

    send: (apps, entity, name, data, ignoreSocketId) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'send', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'send' })

        const internalEvents = [
          'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
          'enter', 'leave', 'chat', 'command', 'health',
        ]
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
      } catch (e) {
        console.error('[AppAPIConfig.send]', e.message)
      }
    },

    sendTo: (apps, entity, playerId, name, data) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'sendTo', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'sendTo' })
        ValidationHelper.assertIsString(playerId, 'playerId', { operation: 'sendTo' })

        if (!apps?.world?.network?.isServer) {
          throw new HyperfyError('PERMISSION_DENIED', 'sendTo can only be called on the server', {
            operation: 'sendTo',
          })
        }

        const internalEvents = [
          'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
          'enter', 'leave', 'chat', 'command', 'health',
        ]
        if (internalEvents.includes(name)) {
          throw new HyperfyError('PERMISSION_DENIED', `apps cannot send internal events (${name})`, {
            eventName: name,
            operation: 'sendTo',
          })
        }

        const player = apps.world.entities.get(playerId)
        if (!player) {
          console.warn('[AppAPIConfig.sendTo] Player not found:', playerId)
          return
        }

        const event = [entity.data.id, entity.blueprint?.version, name, data]
        apps.world.network.sendTo(playerId, 'entityEvent', event)
      } catch (e) {
        console.error('[AppAPIConfig.sendTo]', e.message)
      }
    },

    emit: (apps, entity, name, data) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'emit', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'emit' })

        const internalEvents = [
          'fixedUpdate', 'updated', 'lateUpdate', 'destroy',
          'enter', 'leave', 'chat', 'command', 'health',
        ]
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
      } catch (e) {
        console.error('[AppAPIConfig.emit]', e.message)
      }
    },

    create: (apps, entity, name, data) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'create', nodeName: name })
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
      } catch (e) {
        console.error('[AppAPIConfig.create]', e.message)
        return null
      }
    },

    control: (apps, entity, options) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'control' })
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
      } catch (e) {
        console.error('[AppAPIConfig.control]', e.message)
        return null
      }
    },

    configure: (apps, entity, fields) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'configure' })

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
          if (!field || typeof field !== 'object') {
            console.warn('[AppAPIConfig.configure] Invalid field object:', field)
            continue
          }
          fileRemaps[field.type]?.(field)
          if (field.initial !== undefined && props[field.key] === undefined) {
            props[field.key] = field.initial
          }
        }
        entity.onFields?.(entity.fields)
      } catch (e) {
        console.error('[AppAPIConfig.configure]', e.message)
      }
    },

    add: (apps, entity, node) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'add' })
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
      } catch (e) {
        console.error('[AppAPIConfig.add]', e.message)
      }
    },

    remove: (apps, entity, node) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'remove' })
        ValidationHelper.assertNotNull(node, 'node', { operation: 'remove' })

        if (!entity.root) {
          throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'remove' })
        }

        const ref = node.ref || node
        if (ref && ref.parent === entity.root) {
          entity.root.remove(ref)
        }
        ref?.deactivate?.()
      } catch (e) {
        console.error('[AppAPIConfig.remove]', e.message)
      }
    },

    traverse: (apps, entity, callback) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'traverse' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'traverse' })

        if (!entity.root) {
          throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'traverse' })
        }

        entity.root.traverse(callback)
      } catch (e) {
        console.error('[AppAPIConfig.traverse]', e.message)
      }
    },

    clean: (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation: 'clean' })

        if (!entity.root) {
          console.warn('[AppAPIConfig.clean] Entity root not initialized')
          return
        }

        entity.root.clean?.()
      } catch (e) {
        console.error('[AppAPIConfig.clean]', e.message)
      }
    },
  },
}