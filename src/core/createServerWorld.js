// Server world with server-side systems

import { World } from './World.js'
import { serverSystems } from './SystemFactory.js'

export function createServerWorld() {
  const world = new World()
  world.isServer = true
  for (const [name, System] of Object.entries(serverSystems)) {
    world.register(name, System)
  }
  return world
}
