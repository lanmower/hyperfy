import { useEffect, useState } from 'react'
import { sortBy } from 'lodash-es'

function getPlayers(world) {
  let players = []
  world.entities.players.forEach(player => {
    players.push(player)
  })
  return sortBy(players, player => player.enteredAt)
}

export function usePlayerList(world) {
  const [players, setPlayers] = useState(() => getPlayers(world))

  useEffect(() => {
    const onChange = () => {
      setPlayers(getPlayers(world))
    }
    world.entities.on('added', onChange)
    world.entities.on('removed', onChange)
    world.livekit.on('speaking', onChange)
    world.livekit.on('muted', onChange)
    world.on('rank', onChange)
    world.on('name', onChange)
    return () => {
      world.entities.off('added', onChange)
      world.entities.off('removed', onChange)
      world.livekit.off('speaking', onChange)
      world.livekit.off('muted', onChange)
      world.off('rank', onChange)
      world.off('name', onChange)
    }
  }, [])

  return players
}
