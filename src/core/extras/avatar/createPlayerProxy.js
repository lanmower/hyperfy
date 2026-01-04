import { clamp, uuid } from '../../utils/helpers/misc.js'
import * as THREE from '../three.js'
import { ProxyBuilder } from '../../utils/ProxyBuilder.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PlayerProxy')

const HEALTH_MAX = 100

export function createPlayerProxy(entity, player) {
  const world = player.world
  const position = new THREE.Vector3()
  const rotation = new THREE.Euler()
  const quaternion = new THREE.Quaternion()
  let activeEffectConfig = null
  let voiceMod

  const builder = new ProxyBuilder(player)

  builder.addMultiple({
    networkId: () => player.data.userId,
    id: () => player.data.id,
    local: () => player.data.id === world.network.id,
    admin: () => player.isAdmin(),
    builder: () => player.isBuilder(),
    name: () => player.data.name,
    health: () => player.data.health,
    position: () => position.copy(player.base.position),
    rotation: () => rotation.copy(player.base.rotation),
    quaternion: () => quaternion.copy(player.base.quaternion),
    height: () => player.avatar?.getHeight(),
    headToHeight: () => player.avatar?.getHeadToHeight(),
    destroyed: () => !!player.destroyed,
  })

  return builder.build({
    teleport(position, rotationY) {
      if (player.data.userId === world.network.id) {
        world.network.enqueue('onPlayerTeleport', { position: position.toArray(), rotationY })
      } else if (world.network.isClient) {
        world.network.send('playerTeleport', { networkId: player.data.userId, position: position.toArray(), rotationY })
      } else {
        world.network.sendTo(player.data.userId, 'playerTeleport', { position: position.toArray(), rotationY })
      }
    },
    getBoneTransform(boneName) {
      return player.avatar?.getBoneTransform?.(boneName)
    },
    setSessionAvatar(url) {
      const avatar = url
      if (player.data.userId === world.network.id) {
        world.network.enqueue('onPlayerSessionAvatar', { avatar })
      } else if (world.network.isClient) {
        world.network.send('playerSessionAvatar', { networkId: player.data.userId, avatar })
      } else {
        world.network.sendTo(player.data.userId, 'playerSessionAvatar', { avatar })
      }
    },
    damage(amount) {
      const health = clamp(player.data.health - amount, 0, HEALTH_MAX)
      if (player.data.health === health) return
      if (world.network.isServer) {
        world.network.send('entityModified', { id: player.data.id, health })
      }
      player.modify({ health })
    },
    heal(amount = HEALTH_MAX) {
      const health = clamp(player.data.health + amount, 0, HEALTH_MAX)
      if (player.data.health === health) return
      if (world.network.isServer) {
        world.network.send('entityModified', { id: player.data.id, health })
      }
      player.modify({ health })
    },
    hasEffect() {
      return !!player.data.effect
    },
    applyEffect(opts) {
      if (!opts) return
      const effect = {}
      if (opts.anchor) effect.anchorId = opts.anchor.anchorId
      if (opts.emote) effect.emote = opts.emote
      if (opts.snare) effect.snare = opts.snare
      if (opts.freeze) effect.freeze = opts.freeze
      if (opts.turn) effect.turn = opts.turn
      if (opts.duration) effect.duration = opts.duration
      if (opts.cancellable) {
        effect.cancellable = opts.cancellable
        delete effect.freeze // overrides
      }
      const config = {
        effect,
        onEnd: () => {
          if (activeEffectConfig !== config) return
          activeEffectConfig = null
          player.setEffect(null)
          opts.onEnd?.()
        },
      }
      activeEffectConfig = config
      player.setEffect(config.effect, config.onEnd)
      if (world.network.isServer) {
        world.network.send('entityModified', { id: player.data.id, ef: config.effect })
      }
      return {
        get active() {
          return activeEffectConfig === config
        },
        cancel: () => {
          config.onEnd()
        },
      }
    },
    cancelEffect() {
      activeEffectConfig?.onEnd()
    },
    push(force) {
      force = force.toArray()
      if (player.data.userId === world.network.id) {
        player.push(force)
      } else if (world.network.isClient) {
        world.network.send('playerPush', { networkId: player.data.userId, force })
      } else {
        world.network.sendTo(player.data.userId, 'playerPush', { force })
      }
    },
    screenshare(targetId) {
      if (!targetId) {
        return logger.error('Screenshare has invalid targetId', { targetId })
      }
      if (player.data.userId !== world.network.id) {
        return logger.error('Screenshare can only be called on local player', {})
      }
      world.livekit.setScreenShareTarget(targetId)
    },
    setVoiceLevel(level) {
      if (!world.network.isServer) {
        return logger.error('setVoiceLevel must be applied on the server', {})
      }
      if (!level && !voiceMod) {
        return // no modifiers to remove, this is a noop
      }
      if (!level && voiceMod) {
        voiceMod = world.livekit.removeModifier(voiceMod)
        return
      }
      if (level && !voiceMod) {
        voiceMod = world.livekit.addModifier(player.data.id, level)
        return
      }
      if (level && voiceMod) {
        voiceMod = world.livekit.updateModifier(voiceMod, level)
        return
      }
    },
    $cleanup() {
      activeEffectConfig?.onEnd()
      if (voiceMod) {
        voiceMod = world.livekit.removeModifier(voiceMod)
      }
    },
  })
}
