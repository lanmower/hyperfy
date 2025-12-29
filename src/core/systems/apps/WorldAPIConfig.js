import * as THREE from '../../extras/three.js'
import { getRef } from '../../nodes/Node.js'
import moment from 'moment'
import { Layers } from '../../extras/Layers.js'
import { APIMethodWrapper } from '../../utils/api/APIMethodWrapper.js'
import { SYSTEM_INTERNAL_EVENTS } from '../../utils/events/EventConstants.js'

export const WorldAPIConfig = {
  getters: {
    networkId: APIMethodWrapper.wrapMethod(
      (apps, entity) => {
        if (!apps?.world?.network) {
          throw new HyperfyError('INVALID_STATE', 'Network system not available')
        }
        return apps.world.network.id
      },
      { module: 'WorldAPIConfig', method: 'networkId' }
    ),

    isServer: APIMethodWrapper.wrapMethod(
      (apps, entity) => apps?.world?.network?.isServer || false,
      { module: 'WorldAPIConfig', method: 'isServer', defaultReturn: false }
    ),

    isClient: APIMethodWrapper.wrapMethod(
      (apps, entity) => apps?.world?.network?.isClient || false,
      { module: 'WorldAPIConfig', method: 'isClient', defaultReturn: false }
    ),

    props: APIMethodWrapper.wrapMethod(
      (apps, entity) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'get props' })
        return entity.blueprint?.props || {}
      },
      { module: 'WorldAPIConfig', method: 'props', defaultReturn: {} }
    ),
  },

  setters: {},

  methods: {
    add: APIMethodWrapper.wrapMethod(
      (apps, entity, pNode) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'add' })
        ValidationHelper.assertNotNull(pNode, 'node', { operation: 'add' })

        const node = getRef(pNode)
        if (!node) {
          throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'add' })
        }

        if (node.parent) {
          node.parent.remove(node)
        }
        entity.worldNodes.add(node)
        node.activate({ world: apps.world, entity })
      },
      { module: 'WorldAPIConfig', method: 'add' }
    ),

    remove: APIMethodWrapper.wrapMethod(
      (apps, entity, pNode) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'remove' })
        ValidationHelper.assertNotNull(pNode, 'node', { operation: 'remove' })

        const node = getRef(pNode)
        if (!node) return

        if (node.parent) return
        if (!entity.worldNodes.has(node)) return

        entity.worldNodes.delete(node)
        node.deactivate()
      },
      { module: 'WorldAPIConfig', method: 'remove' }
    ),

    attach: APIMethodWrapper.wrapMethod(
      (apps, entity, pNode) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'attach' })
        ValidationHelper.assertNotNull(pNode, 'node', { operation: 'attach' })

        const node = getRef(pNode)
        if (!node) {
          throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'attach' })
        }

        const parent = node.parent
        if (!parent) {
          throw new HyperfyError('INVALID_STATE', 'Node has no parent to attach from', { operation: 'attach' })
        }

        const finalMatrix = new THREE.Matrix4()
        finalMatrix.copy(node.matrix)
        let currentParent = node.parent
        while (currentParent) {
          finalMatrix.premultiply(currentParent.matrix)
          currentParent = currentParent.parent
        }
        parent.remove(node)
        finalMatrix.decompose(node.position, node.quaternion, node.scale)
        node.activate({ world: apps.world, entity })
        entity.worldNodes.add(node)
      },
      { module: 'WorldAPIConfig', method: 'attach' }
    ),

    on: APIMethodWrapper.wrapMethod(
      (apps, entity, name, callback) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'on', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })

        entity.onWorldEvent(name, callback)
      },
      { module: 'WorldAPIConfig', method: 'on' }
    ),

    off: APIMethodWrapper.wrapMethod(
      (apps, entity, name, callback) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'off', eventName: name })
        ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
        ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })

        entity.offWorldEvent(name, callback)
      },
      { module: 'WorldAPIConfig', method: 'off' }
    ),

    emit: APIMethodWrapper.wrapMethod(
      (apps, entity, name, data) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'emit', eventName: name })
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
      { module: 'WorldAPIConfig', method: 'emit' }
    ),

    getTime: APIMethodWrapper.wrapMethod(
      (apps, entity) => {
        if (!apps?.world?.network) {
          throw new HyperfyError('INVALID_STATE', 'Network system not available', { operation: 'getTime' })
        }
        return apps.world.network.getTime()
      },
      { module: 'WorldAPIConfig', method: 'getTime', defaultReturn: Date.now }
    ),

    getTimestamp: APIMethodWrapper.wrapMethod(
      (apps, entity, format) => {
        if (!format) return moment().toISOString()
        return moment().format(format)
      },
      { module: 'WorldAPIConfig', method: 'getTimestamp', defaultReturn: moment().toISOString }
    ),

    chat: APIMethodWrapper.wrapMethod(
      (apps, entity, msg, broadcast) => {
        ValidationHelper.assertNotNull(msg, 'msg', { operation: 'chat' })
        if (!apps?.world?.chat) {
          throw new HyperfyError('INVALID_STATE', 'Chat system not available', { operation: 'chat' })
        }
        apps.world.chat.add(msg, broadcast)
      },
      { module: 'WorldAPIConfig', method: 'chat' }
    ),

    getPlayer: APIMethodWrapper.wrapMethod(
      (apps, entity, playerId) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'getPlayer' })
        ValidationHelper.assertIsString(playerId, 'playerId', { operation: 'getPlayer' })
        return entity.getPlayerProxy(playerId)
      },
      { module: 'WorldAPIConfig', method: 'getPlayer' }
    ),

    getPlayers: APIMethodWrapper.wrapMethod(
      (apps, entity) => {
        ValidationHelper.assertEntityValid(entity, { operation: 'getPlayers' })

        const players = []
        apps.world.entities.players.forEach(player => {
          players.push(entity.getPlayerProxy(player.data.id))
        })
        return players
      },
      { module: 'WorldAPIConfig', method: 'getPlayers', defaultReturn: [] }
    ),

    createLayerMask: APIMethodWrapper.wrapMethod(
      (apps, entity, ...groups) => {
        let mask = 0
        for (const group of groups) {
          if (!Layers[group]) {
            throw new HyperfyError('INPUT_VALIDATION', `Invalid layer group: ${group}`, {
              operation: 'createLayerMask',
              group,
            })
          }
          mask |= Layers[group].group
        }
        return mask
      },
      { module: 'WorldAPIConfig', method: 'createLayerMask', defaultReturn: 0 }
    ),

    raycast: APIMethodWrapper.wrapMethod(
      (apps, entity, origin, direction, maxDistance, layerMask) => {
        ValidationHelper.assertIsVector3(origin, 'origin', { operation: 'raycast' })
        ValidationHelper.assertIsVector3(direction, 'direction', { operation: 'raycast' })

        if (maxDistance !== undefined && maxDistance !== null) {
          ValidationHelper.assertIsNumber(maxDistance, 'maxDistance', { operation: 'raycast' })
        }

        if (layerMask !== undefined && layerMask !== null) {
          ValidationHelper.assertIsNumber(layerMask, 'layerMask', { operation: 'raycast' })
        }

        if (!apps?.world?.physics) {
          throw new HyperfyError('INVALID_STATE', 'Physics system not available', { operation: 'raycast' })
        }

        const hit = apps.world.physics.raycast(origin, direction, maxDistance, layerMask)
        if (!hit) return null

        if (!apps.raycastHit) {
          apps.raycastHit = {
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
            distance: 0,
            tag: null,
            playerId: null,
          }
        }

        apps.raycastHit.point.copy(hit.point)
        apps.raycastHit.normal.copy(hit.normal)
        apps.raycastHit.distance = hit.distance
        apps.raycastHit.tag = hit.handle?.tag
        apps.raycastHit.playerId = hit.handle?.playerId
        return apps.raycastHit
      },
      { module: 'WorldAPIConfig', method: 'raycast' }
    ),

    overlapSphere: APIMethodWrapper.wrapMethod(
      (apps, entity, radius, origin, layerMask) => {
        ValidationHelper.assertIsNumber(radius, 'radius', { operation: 'overlapSphere' })
        ValidationHelper.assertIsVector3(origin, 'origin', { operation: 'overlapSphere' })

        if (layerMask !== undefined && layerMask !== null) {
          ValidationHelper.assertIsNumber(layerMask, 'layerMask', { operation: 'overlapSphere' })
        }

        if (!apps?.world?.physics) {
          throw new HyperfyError('INVALID_STATE', 'Physics system not available', { operation: 'overlapSphere' })
        }

        const hits = apps.world.physics.overlapSphere(radius, origin, layerMask)
        return hits.map(hit => hit.proxy)
      },
      { module: 'WorldAPIConfig', method: 'overlapSphere', defaultReturn: [] }
    ),

    get: APIMethodWrapper.wrapMethod(
      (apps, entity, key) => {
        ValidationHelper.assertIsString(key, 'key', { operation: 'get' })
        return apps.world.storage?.get(key)
      },
      { module: 'WorldAPIConfig', method: 'get' }
    ),

    set: APIMethodWrapper.wrapMethod(
      (apps, entity, key, value) => {
        ValidationHelper.assertIsString(key, 'key', { operation: 'set' })
        apps.world.storage?.set(key, value)
      },
      { module: 'WorldAPIConfig', method: 'set' }
    ),

    open: APIMethodWrapper.wrapMethod(
      (apps, entity, url, newWindow = false) => {
        ValidationHelper.assertNotNull(url, 'url', { operation: 'open' })
        ValidationHelper.assertIsString(url, 'url', { operation: 'open' })

        if (!apps?.world?.network?.isClient) {
          return
        }

        try {
          const resolvedUrl = apps.world.resolveURL(url)
          setTimeout(() => {
            if (newWindow) {
              window.open(resolvedUrl, '_blank')
            } else {
              window.location.href = resolvedUrl
            }
          }, 0)
        } catch (resolveErr) {
          throw new HyperfyError('OPERATION_NOT_SUPPORTED', `Failed to resolve URL: ${resolveErr.message}`, {
            operation: 'open',
            url,
          })
        }
      },
      { module: 'WorldAPIConfig', method: 'open' }
    ),

    load: (apps, entity, type, url) => {
      return new Promise(async (resolve, reject) => {
        try {
          ValidationHelper.assertIsString(type, 'type', { operation: 'load' })
          ValidationHelper.assertIsString(url, 'url', { operation: 'load' })

          const hook = entity.getDeadHook()
          const allowLoaders = ['avatar', 'model']

          if (!allowLoaders.includes(type)) {
            return reject(
              new HyperfyError('OPERATION_NOT_SUPPORTED', `cannot load type: ${type}`, {
                operation: 'load',
                type,
              })
            )
          }

          if (!apps?.world?.loader) {
            return reject(
              new HyperfyError('INVALID_STATE', 'Loader system not available', {
                operation: 'load',
                type,
              })
            )
          }

          let glb = apps.world.loader.get(type, url)
          if (!glb) {
            glb = await apps.world.loader.load(type, url)
          }

          if (hook.dead) return

          const root = glb.toNodes()
          resolve(type === 'avatar' ? root.children[0] : root)
        } catch (err) {
          const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('OPERATION_NOT_SUPPORTED', err.message, { originalError: err.toString() })
          reject(hyperfyError)
        }
      })
    },

    getQueryParam: APIMethodWrapper.wrapMethod(
      (apps, entity, key) => {
        ValidationHelper.assertIsString(key, 'key', { operation: 'getQueryParam' })

        if (typeof window === 'undefined') {
          throw new HyperfyError('OPERATION_NOT_SUPPORTED', 'getQueryParam() must be called in the browser', {
            operation: 'getQueryParam',
          })
        }

        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(key)
      },
      { module: 'WorldAPIConfig', method: 'getQueryParam' }
    ),

    setQueryParam: APIMethodWrapper.wrapMethod(
      (apps, entity, key, value) => {
        ValidationHelper.assertIsString(key, 'key', { operation: 'setQueryParam' })

        if (typeof window === 'undefined') {
          throw new HyperfyError('OPERATION_NOT_SUPPORTED', 'setQueryParam() must be called in the browser', {
            operation: 'setQueryParam',
          })
        }

        const urlParams = new URLSearchParams(window.location.search)
        if (value) {
          urlParams.set(key, value)
        } else {
          urlParams.delete(key)
        }

        const newUrl = window.location.pathname + '?' + urlParams.toString()
        window.history.replaceState({}, '', newUrl)
      },
      { module: 'WorldAPIConfig', method: 'setQueryParam' }
    ),
  },
}
