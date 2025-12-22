import * as THREE from '../../extras/three.js'
import { getRef } from '../../nodes/Node.js'
import moment from 'moment'
import { Layers } from '../../extras/Layers.js'

export const WorldAPIConfig = {
  getters: {
    networkId: (apps, entity) => apps.world.network.id,
    isServer: (apps, entity) => apps.world.network.isServer,
    isClient: (apps, entity) => apps.world.network.isClient,
  },

  setters: {},

  methods: {
    add: (apps, entity, pNode) => {
      const node = getRef(pNode)
      if (!node) return
      if (node.parent) {
        node.parent.remove(node)
      }
      entity.worldNodes.add(node)
      node.activate({ world: apps.world, entity })
    },

    remove: (apps, entity, pNode) => {
      const node = getRef(pNode)
      if (!node) return
      if (node.parent) return
      if (!entity.worldNodes.has(node)) return
      entity.worldNodes.delete(node)
      node.deactivate()
    },

    attach: (apps, entity, pNode) => {
      const node = getRef(pNode)
      if (!node) return
      const parent = node.parent
      if (!parent) return
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

    on: (apps, entity, name, callback) => {
      entity.onWorldEvent(name, callback)
    },

    off: (apps, entity, name, callback) => {
      entity.offWorldEvent(name, callback)
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

    getTime: (apps, entity) => apps.world.network.getTime(),

    getTimestamp: (apps, entity, format) => {
      if (!format) return moment().toISOString()
      return moment().format(format)
    },

    chat: (apps, entity, msg, broadcast) => {
      if (!msg) return
      apps.world.chat.add(msg, broadcast)
    },

    getPlayer: (apps, entity, playerId) => entity.getPlayerProxy(playerId),

    getPlayers: (apps, entity) => {
      const players = []
      apps.world.entities.players.forEach(player => {
        players.push(entity.getPlayerProxy(player.data.id))
      })
      return players
    },

    createLayerMask: (apps, entity, ...groups) => {
      let mask = 0
      for (const group of groups) {
        if (!Layers[group]) throw new Error(`[createLayerMask] invalid group: ${group}`)
        mask |= Layers[group].group
      }
      return mask
    },

    raycast: (apps, entity, origin, direction, maxDistance, layerMask) => {
      if (!origin?.isVector3) throw new Error('[raycast] origin must be Vector3')
      if (!direction?.isVector3) throw new Error('[raycast] direction must be Vector3')
      if (maxDistance !== undefined && maxDistance !== null && typeof maxDistance !== 'number') {
        throw new Error('[raycast] maxDistance must be number')
      }
      if (layerMask !== undefined && layerMask !== null && typeof layerMask !== 'number') {
        throw new Error('[raycast] layerMask must be number')
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

    overlapSphere: (apps, entity, radius, origin, layerMask) => {
      const hits = apps.world.physics.overlapSphere(radius, origin, layerMask)
      return hits.map(hit => hit.proxy)
    },

    get: (apps, entity, key) => apps.world.storage?.get(key),
    set: (apps, entity, key, value) => apps.world.storage?.set(key, value),

    open: (apps, entity, url, newWindow = false) => {
      if (!url) {
        console.error('[world.open] URL is required')
        return
      }
      if (apps.world.network.isClient) {
        try {
          const resolvedUrl = apps.world.resolveURL(url)
          setTimeout(() => {
            if (newWindow) {
              window.open(resolvedUrl, '_blank')
            } else {
              window.location.href = resolvedUrl
            }
          }, 0)
        } catch (e) {
          console.error('[world.open] Failed to open URL:', e)
        }
      }
    },

    load: (apps, entity, type, url) => {
      return new Promise(async (resolve, reject) => {
        const hook = entity.getDeadHook()
        try {
          const allowLoaders = ['avatar', 'model']
          if (!allowLoaders.includes(type)) {
            return reject(new Error(`cannot load type: ${type}`))
          }
          let glb = apps.world.loader.get(type, url)
          if (!glb) glb = await apps.world.loader.load(type, url)
          if (hook.dead) return
          const root = glb.toNodes()
          resolve(type === 'avatar' ? root.children[0] : root)
        } catch (err) {
          if (hook.dead) return
          reject(err)
        }
      })
    },

    getQueryParam: (apps, entity, key) => {
      if (typeof window === 'undefined') {
        console.error('getQueryParam() must be called in the browser')
        return null
      }
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(key)
    },

    setQueryParam: (apps, entity, key, value) => {
      if (typeof window === 'undefined') {
        console.error('setQueryParam() must be called in the browser')
        return null
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
  },
}
