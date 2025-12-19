import {
  MicIcon,
  MicOffIcon,
} from '../Icons.js'
import {
  CircleArrowRightIcon,
  HammerIcon,
  UserXIcon,
  Volume2Icon,
} from 'lucide-react'
import { cls } from '../cls.js'
import { useContext } from 'react'
import { HintContext } from '../Hint.js'
import { Ranks } from '../../../core/extras/ranks.js'
import * as THREE from '../../../core/extras/three.js'
import { Pane } from './Pane.js'
import { usePlayerList } from '../hooks/usePlayerList.js'
import { playersStyles } from './PlayersStyles.js'

export function Players({ world, hidden }) {
  const { setHint } = useContext(HintContext)
  const localPlayer = world.entities.player
  const isAdmin = localPlayer.isAdmin()
  const players = usePlayerList(world)

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

  return (
    <Pane hidden={hidden}>
      <div className='players' css={playersStyles}>
        <div className='players-head'>
          <div className='players-title'>Players</div>
        </div>
        <div className='players-content noscrollbar'>
          {players.map(player => (
            <div className='players-item' key={player.data.id}>
              <div className='players-name'>
                <span>{player.data.name}</span>
                {player.speaking && <Volume2Icon size='1rem' />}
                {player.isMuted() && <MicOffIcon size='1rem' />}
              </div>
              {isAdmin && player.isRemote && !player.isAdmin() && world.settings.rank < Ranks.BUILDER && (
                <div
                  className={cls('players-btn', { dim: !player.isBuilder() })}
                  onPointerEnter={() =>
                    setHint(
                      player.isBuilder()
                        ? 'Player is not a builder. Click to allow building.'
                        : 'Player is a builder. Click to revoke.'
                    )
                  }
                  onPointerLeave={() => setHint(null)}
                  onClick={() => toggleBuilder(player)}
                >
                  <HammerIcon size='1.125rem' />
                </div>
              )}
              {player.isRemote && localPlayer.outranks(player) && (
                <div
                  className='players-btn'
                  onPointerEnter={() => setHint('Teleport to player.')}
                  onPointerLeave={() => setHint(null)}
                  onClick={() => teleportTo(player)}
                >
                  <CircleArrowRightIcon size='1.125rem' />
                </div>
              )}
              {player.isRemote && localPlayer.outranks(player) && (
                <div
                  className='players-btn'
                  onPointerEnter={() =>
                    setHint(
                      player.isMuted() ? 'Player is muted. Click to unmute.' : 'Player is not muted. Click to mute.'
                    )
                  }
                  onPointerLeave={() => setHint(null)}
                  onClick={() => toggleMute(player)}
                >
                  {player.isMuted() ? <MicOffIcon size='1.125rem' /> : <MicIcon size='1.125rem' />}
                </div>
              )}
              {player.isRemote && localPlayer.outranks(player) && (
                <div
                  className='players-btn'
                  onPointerEnter={() => setHint('Kick this player.')}
                  onPointerLeave={() => setHint(null)}
                  onClick={() => kick(player)}
                >
                  <UserXIcon size='1.125rem' />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Pane>
  )
}
