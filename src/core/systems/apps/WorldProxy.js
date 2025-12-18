import moment from 'moment'
import { isNumber } from 'lodash-es'
import * as THREE from '../../extras/three.js'

import { getRef } from '../../nodes/Node.js'
import { Layers } from '../../extras/Layers.js'

const isBrowser = typeof window !== 'undefined'

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

export class WorldProxy {
  constructor(world) {
    this.world = world
    this.raycastHit = null
  }

  getGetters() {
    return {
      networkId: () => this.world.network.id,
      isServer: () => this.world.network.isServer,
      isClient: () => this.world.network.isClient,
    }
  }

  getSetters() {
    return {}
  }

  getMethods() {
    return {
      add: (entity, pNode) => {
        const node = getRef(pNode)
        if (!node) return
        if (node.parent) {
          node.parent.remove(node)
        }
        entity.worldNodes.add(node)
        node.activate({ world: this.world, entity })
      },
      remove: (entity, pNode) => {
        const node = getRef(pNode)
        if (!node) return
        if (node.parent) return
        if (!entity.worldNodes.has(node)) return
        entity.worldNodes.delete(node)
        node.deactivate()
      },
      attach: (entity, pNode) => {
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
        node.activate({ world: this.world, entity })
        entity.worldNodes.add(node)
      },
      on: (entity, name, callback) => {
        entity.onWorldEvent(name, callback)
      },
      off: (entity, name, callback) => {
        entity.offWorldEvent(name, callback)
      },
      emit: (entity, name, data) => {
        if (internalEvents.includes(name)) {
          return console.error(`apps cannot emit internal events (${name})`)
        }
        this.world.events.emit(name, data)
      },
      getTime: (entity) => this.world.network.getTime(),
      getTimestamp: (entity, format) => {
        if (!format) return moment().toISOString()
        return moment().format(format)
      },
      chat: (entity, msg, broadcast) => {
        if (!msg) return
        this.world.chat.add(msg, broadcast)
      },
      getPlayer: (entity, playerId) => entity.getPlayerProxy(playerId),
      getPlayers: (entity) => {
        const players = []
        this.world.entities.players.forEach(player => {
          players.push(entity.getPlayerProxy(player.data.id))
        })
        return players
      },
      createLayerMask: (entity, ...groups) => {
        let mask = 0
        for (const group of groups) {
          if (!Layers[group]) throw new Error(`[createLayerMask] invalid group: ${group}`)
          mask |= Layers[group].group
        }
        return mask
      },
      raycast: (entity, origin, direction, maxDistance, layerMask) => {
        if (!origin?.isVector3) throw new Error('[raycast] origin must be Vector3')
        if (!direction?.isVector3) throw new Error('[raycast] direction must be Vector3')
        if (maxDistance !== undefined && maxDistance !== null && !isNumber(maxDistance)) {
          throw new Error('[raycast] maxDistance must be number')
        }
        if (layerMask !== undefined && layerMask !== null && !isNumber(layerMask)) {
          throw new Error('[raycast] layerMask must be number')
        }
        const hit = this.world.physics.raycast(origin, direction, maxDistance, layerMask)
        if (!hit) return null
        if (!this.raycastHit) {
          this.raycastHit = {
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
            distance: 0,
            tag: null,
            playerId: null,
          }
        }
        this.raycastHit.point.copy(hit.point)
        this.raycastHit.normal.copy(hit.normal)
        this.raycastHit.distance = hit.distance
        this.raycastHit.tag = hit.handle?.tag
        this.raycastHit.playerId = hit.handle?.playerId
        return this.raycastHit
      },
      overlapSphere: (entity, radius, origin, layerMask) => {
        const hits = this.world.physics.overlapSphere(radius, origin, layerMask)
        return hits.map(hit => hit.proxy)
      },
      get: (entity, key) => this.world.storage?.get(key),
      set: (entity, key, value) => this.world.storage?.set(key, value),
      open: (entity, url, newWindow = false) => {
        if (!url) {
          console.error('[world.open] URL is required')
          return
        }
        if (this.world.network.isClient) {
          try {
            const resolvedUrl = this.world.resolveURL(url)
            setTimeout(() => {
              if (newWindow) {
                window.open(resolvedUrl, '_blank')
              } else {
                window.location.href = resolvedUrl
              }
            }, 0)
            console.log(`[world.open] Redirecting to: ${resolvedUrl} ${newWindow ? '(new window)' : ''}`)
          } catch (e) {
            console.error('[world.open] Failed to open URL:', e)
          }
        } else {
          console.warn('[world.open] URL redirection only works on client side')
        }
      },
      load: (entity, type, url) => {
        return new Promise(async (resolve, reject) => {
          const hook = entity.getDeadHook()
          try {
            const allowLoaders = ['avatar', 'model']
            if (!allowLoaders.includes(type)) {
              return reject(new Error(`cannot load type: ${type}`))
            }
            let glb = this.world.loader.get(type, url)
            if (!glb) glb = await this.world.loader.load(type, url)
            if (hook.dead) return
            const root = glb.toNodes()
            resolve(type === 'avatar' ? root.children[0] : root)
          } catch (err) {
            if (hook.dead) return
            reject(err)
          }
        })
      },
      getQueryParam: (entity, key) => {
        if (!isBrowser) {
          console.error('getQueryParam() must be called in the browser')
          return null
        }
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(key)
      },
      setQueryParam: (entity, key, value) => {
        if (!isBrowser) {
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
    }
  }
}
