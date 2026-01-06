import { WorldBuilder } from './WorldBuilder.js'
import { NODE_CLIENT_PLATFORM } from './initialization/PlatformConfigs.js'

export function createNodeClientWorld() {
  const builder = new WorldBuilder()
  builder.addSystems(NODE_CLIENT_PLATFORM.systems)
  return builder.build()
}
