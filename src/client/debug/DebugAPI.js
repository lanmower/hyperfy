import { StructuredLogger } from '../../core/utils/logging/index.js'
import { ConsoleCapture } from './ConsoleCapture.js'
import { setupDebugEntity } from './DebugEntity.js'
import { setupDebugPlayer } from './DebugPlayer.js'
import { setupDebugNetwork } from './DebugNetwork.js'
import { setupDebugPlacement } from './DebugPlacement.js'
import { setupDebugSystems } from './DebugSystems.js'
import { setupDebugPlugins } from './DebugPlugins.js'
import { setupDebugMonitoring } from './DebugMonitoring.js'

const logger = new StructuredLogger('DebugAPI')

export function setupDebugGlobals(world) {
  if (typeof window === 'undefined') return

  const consoleCapture = new ConsoleCapture(500)
  consoleCapture.enable()

  window.__DEBUG__ = {
    world,
    logs: consoleCapture.logs,

    ...setupDebugEntity(world),
    ...setupDebugPlayer(world),
    ...setupDebugNetwork(world),
    ...setupDebugPlacement(world),
    ...setupDebugSystems(world, consoleCapture.logs),
    ...setupDebugPlugins(world),
    ...setupDebugMonitoring(world),
  }

  logger.info('Global debug utilities available at window.__DEBUG__')
  logger.info('Player: window.__DEBUG__.player() | playerState() | avatarHierarchy() | playerPerformance()')
  logger.info('Quick check: window.__DEBUG__.checkSceneApp() | getPerformanceMetrics()')
  logger.info('Apps: window.__DEBUG__.apps() | getAppState("app-id") | findNodesByName("sky")')
}
