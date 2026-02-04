export function createPlayerProxy(app, player) {
  return new Proxy({}, {
    get: (target, key) => {
      if (key === 'transform') return player.transform
      if (key === 'position') return player.transform.position
      if (key === 'rotation') return player.transform.rotation
      if (key === 'velocity') return player.body?.velocity
      if (key === 'id') return player.id
      if (key === 'name') return player.name
      return undefined
    },
    set: (target, key, value) => {
      return false
    },
  })
}
