import { Ranks } from '../../../core/extras/ranks.js'
import * as THREE from '../../../core/extras/three.js'

export function usePlayerActions(world) {
  const localPlayer = world.entities.player

  const toggleBuilder = player => {
    if (player.data.rank === Ranks.BUILDER) {
      world.network.send('modifyRank', { playerId: player.data.id, rank: Ranks.VISITOR })
    } else {
      world.network.send('modifyRank', { playerId: player.data.id, rank: Ranks.BUILDER })
    }
  }

  const toggleMute = player => {
    world.network.send('mute', { playerId: player.data.id, muted: !player.isMuted() })
  }

  const kick = player => {
    world.network.send('kick', player.data.id)
  }

  const teleportTo = player => {
    const position = new THREE.Vector3(0, 0, 1)
    position.applyQuaternion(player.base.quaternion)
    position.multiplyScalar(0.6).add(player.base.position)
    localPlayer.teleport({
      position,
      rotationY: player.base.rotation.y,
    })
  }

  return {
    toggleBuilder,
    toggleMute,
    kick,
    teleportTo,
  }
}
