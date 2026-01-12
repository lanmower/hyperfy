export function setupDebugPlayer(world) {
  return {
    player: () => {
      const players = Array.from(world.entities.items.values()).filter(e => e.isPlayer)
      return players.find(p => p.isLocal) || players[0]
    },
    getPlayerState: (playerId) => {
      const player = world.entities.get(playerId)
      if (!player?.isPlayer) return null
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: player.data.position,
        mode: player.data.mode,
        hasAvatar: !!player.avatar,
        hasPhysics: !!player.physics,
      }
    },
    playerState: () => {
      const player = world.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        quaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        hasAvatar: !!player.avatar,
        avatarPosition: player.avatar ? { x: player.avatar.raw?.scene?.position.x, y: player.avatar.raw?.scene?.position.y, z: player.avatar.raw?.scene?.position.z } : null,
        hasPhysics: !!player.physics,
        moving: player.physics?.moving || false,
        grounded: player.physics?.grounded || false,
        jumping: player.physics?.jumping || false,
        falling: player.physics?.falling || false,
        flying: player.physics?.flying || false,
        animationMode: player.mode,
        hasControl: !!player.control,
        firstPerson: player.firstPerson || false,
        cameraZoom: player.control?.camera?.zoom || null,
        cameraDistance: player.control?.camera?.position.distanceTo(player.cam.position) || null,
      }
    },
    avatarHierarchy: () => {
      const player = world.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        basePosition: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        baseQuaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        baseMatrixWorld: player.base.matrixWorld ? 'set' : 'unset',
        avatar: player.avatar ? {
          hasRaw: !!player.avatar.raw,
          rawScene: player.avatar.raw?.scene ? {
            position: { x: player.avatar.raw.scene.position.x, y: player.avatar.raw.scene.position.y, z: player.avatar.raw.scene.position.z },
            quaternion: { x: player.avatar.raw.scene.quaternion.x, y: player.avatar.raw.scene.quaternion.y, z: player.avatar.raw.scene.quaternion.z, w: player.avatar.raw.scene.quaternion.w },
            visible: player.avatar.raw.scene.visible,
            childCount: player.avatar.raw.scene.children?.length || 0,
            matrixWorld: player.avatar.raw.scene.matrixWorld ? 'set' : 'unset',
          } : null,
        } : null,
        baseParent: player.base.parent?.name || player.base.parent?.constructor.name || 'unknown',
        baseInScene: world.stage?.scene?.children.includes(player.base) || false,
      }
    },
    testMovement: (direction = 'forward', duration = 2000) => {
      const player = world.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      const startPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z }
      const startTime = Date.now()
      const handleTick = () => {
        const elapsed = Date.now() - startTime
        if (elapsed >= duration) {
          const endPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z }
          const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) +
            Math.pow(endPos.y - startPos.y, 2) +
            Math.pow(endPos.z - startPos.z, 2)
          )
          return {
            direction,
            duration,
            startPos,
            endPos,
            distance: distance.toFixed(2),
            moved: distance > 0.01,
            animationMode: player.mode,
          }
        }
        requestAnimationFrame(handleTick)
      }
      handleTick()
    },
    playerPerformance: () => {
      const player = world.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        hasUpdateMatrix: typeof player.avatar?.raw?.scene?.updateMatrix === 'function',
        hasUpdateMatrixWorld: typeof player.avatar?.raw?.scene?.updateMatrixWorld === 'function',
        avatarVisible: player.avatar?.raw?.scene?.visible || false,
        physicsActive: !!player.physics,
        physicsUpdateRate: player.physics ? 'active' : 'inactive',
        inputProcessorActive: !!player.inputProcessor,
        animationControllerActive: !!player.animationController,
        networkSynchronizerActive: !!player.networkSynchronizer,
        cameraManagerActive: !!player.cam,
      }
    },
  }
}
