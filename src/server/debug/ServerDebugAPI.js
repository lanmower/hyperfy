import { LoggerFactory } from '../../core/utils/logging/index.js'
import { ServerDebugHelpers } from './ServerDebugHelpers.js'

const logger = LoggerFactory.get('ServerDebugAPI')

export function setupServerDebugGlobals(world) {
  const debugGlobals = {
    world,
    getWorld: () => ServerDebugHelpers.getWorldInfo(world),
    getSystems: () => ServerDebugHelpers.getSystems(world),
    getSystem: (name) => ServerDebugHelpers.getSystem(world, name),
    getBlueprints: () => ServerDebugHelpers.getBlueprints(world),
    getBlueprint: (id) => ServerDebugHelpers.getBlueprint(world, id),
    getEntities: () => ServerDebugHelpers.getEntities(world),
    getEntity: (id) => ServerDebugHelpers.getEntity(world, id),
    getApps: () => ServerDebugHelpers.getApps(world),
    getPlayers: () => ServerDebugHelpers.getPlayers(world),
    getNetworkStats: () => ServerDebugHelpers.getNetworkStats(world),
    getConnectedClients: () => ServerDebugHelpers.getConnectedClients(world),
    getLoadingStats: () => ServerDebugHelpers.getLoadingStats(world),
    getPhysicsStats: () => ServerDebugHelpers.getPhysicsStats(world),
    getMetrics: () => ServerDebugHelpers.getMetrics(world),
    getTraces: () => ServerDebugHelpers.getTraces(world),
    getErrors: () => ServerDebugHelpers.getErrors(world),
    getHealthStatus: () => ServerDebugHelpers.getHealthStatus(world),
    checkSceneIntegrity: () => ServerDebugHelpers.checkSceneIntegrity(world),
    testWorldIntegrity: () => ServerDebugHelpers.testWorldIntegrity(world),
  }

  if (typeof global !== 'undefined') {
    global.__DEBUG__ = debugGlobals
  }

  logger.info('Server debug globals available at global.__DEBUG__')

  return debugGlobals
}
