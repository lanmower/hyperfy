import { World } from './World.js'
import { Physics } from './systems/Physics.js'

export function createServerWorld() {
  const world = new World()
  world.isServer = true
  world.register('physics', Physics)
  return world
}
