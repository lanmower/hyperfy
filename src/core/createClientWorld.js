// Client world with client-side systems

import { World } from './World.js'
import { clientSystems } from './SystemFactory.js'

export function createClientWorld() {
  const world = new World()
  world.isClient = true
  for (const [name, System] of Object.entries(clientSystems)) {
    world.register(name, System)
  }
  return world
}
