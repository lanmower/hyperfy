import { WorldBuilder } from './WorldBuilder.js'
import { VIEWER_PLATFORM } from './initialization/PlatformConfigs.js'

export { System } from './systems/System.js'

export function createViewerWorld() {
  const builder = new WorldBuilder()
  builder.addSystems(VIEWER_PLATFORM.systems)
  return builder.build()
}
