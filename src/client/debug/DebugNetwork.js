export function setupDebugNetwork(world) {
  return {
    network: {
      id: () => world.network.id,
      isServer: () => world.network.isServer,
      isClient: () => world.network.isClient,
    },
    getNetworkStats: () => ({
      id: world.network.id,
      isServer: world.network.isServer,
      isClient: world.network.isClient,
      connected: !!world.network.ws,
    }),
  }
}
