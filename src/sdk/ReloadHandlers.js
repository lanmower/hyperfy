export function createReloadHandlers(deps) {
  const {
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections
  } = deps

  const reloadTickHandler = async () => {
    const { createTickHandler: refreshHandler } = await import('./TickHandler.js?' + Date.now())
    const newHandler = refreshHandler(deps)
    return newHandler
  }

  const reloadPhysicsIntegration = async () => {
    const oldColliders = new Map(physicsIntegration.playerColliders)
    const { PhysicsIntegration: NewPhysicsIntegration } = await import('../netcode/PhysicsIntegration.js?' + Date.now())
    const newIntegration = new NewPhysicsIntegration({ gravity: physicsIntegration.config.gravity })
    newIntegration.playerColliders = oldColliders
    Object.assign(physicsIntegration, newIntegration)
  }

  const reloadLagCompensator = async () => {
    const oldHistory = new Map(lagCompensator.playerHistory)
    const { LagCompensator: NewLagCompensator } = await import('../netcode/LagCompensator.js?' + Date.now())
    const newLag = new NewLagCompensator(lagCompensator.historyWindow)
    newLag.playerHistory = oldHistory
    Object.assign(lagCompensator, newLag)
  }

  const reloadPlayerManager = async () => {
    const oldPlayers = new Map(playerManager.players)
    const oldInputBuffers = new Map(playerManager.inputBuffers)
    const { PlayerManager: NewPlayerManager } = await import('../netcode/PlayerManager.js?' + Date.now())
    const newPM = new NewPlayerManager()
    newPM.players = oldPlayers
    newPM.inputBuffers = oldInputBuffers
    newPM.nextPlayerId = playerManager.nextPlayerId
    Object.assign(playerManager, newPM)
  }

  const reloadNetworkState = async () => {
    const oldPlayers = new Map(networkState.players)
    const { NetworkState: NewNetworkState } = await import('../netcode/NetworkState.js?' + Date.now())
    const newNS = new NewNetworkState()
    newNS.players = oldPlayers
    newNS.tick = networkState.tick
    newNS.timestamp = networkState.timestamp
    Object.assign(networkState, newNS)
  }

  return {
    reloadTickHandler,
    reloadPhysicsIntegration,
    reloadLagCompensator,
    reloadPlayerManager,
    reloadNetworkState
  }
}
