// Server world with auto-discovered server-side systems

import { World } from './World.js'
import { getSystemsAsync } from './SystemFactory.js'

export async function createServerWorld() {
  const world = new World()
  world.isServer = true

  const { serverSystems } = await getSystemsAsync()
  for (const [name, System] of Object.entries(serverSystems)) {
    world.register(name, System)
  }

  return world
}
