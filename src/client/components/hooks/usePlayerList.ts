import { useEffect, useState } from 'react'
import { sortBy } from '../../../core/utils/helpers/typeChecks.js'

const getPlayers = (world) => {
  const players = []
  world.entities.players.forEach(player => {
    players.push(player)
  })
  return sortBy(players, player => player.enteredAt)
}

const attachListeners = (world, onChange) => {
  const listeners = ['entities:added', 'entities:removed', 'livekit:speaking', 'livekit:muted', 'world:rank', 'world:name']
  const attach = (emitter, event, handler) => emitter.on(event, handler)
  const detach = (emitter, event, handler) => emitter.off(event, handler)

  attach(world.entities, 'added', onChange)
  attach(world.entities, 'removed', onChange)
  attach(world.livekit, 'speaking', onChange)
  attach(world.livekit, 'muted', onChange)
  attach(world, 'rank', onChange)
  attach(world, 'name', onChange)

  return () => {
    detach(world.entities, 'added', onChange)
    detach(world.entities, 'removed', onChange)
    detach(world.livekit, 'speaking', onChange)
    detach(world.livekit, 'muted', onChange)
    detach(world, 'rank', onChange)
    detach(world, 'name', onChange)
  }
}

export function usePlayerList(world) {
  const [players, setPlayers] = useState(() => getPlayers(world))

  useEffect(() => {
    const onChange = () => setPlayers(getPlayers(world))
    return attachListeners(world, onChange)
  }, [])

  return players
}
