export function setupDebugPlugins(world) {
  return {
    plugins: {
      getAll: () => world.pluginRegistry?.getAllPlugins() || [],
      get: (name) => world.pluginRegistry?.getPlugin(name) || null,
      getAssetHandlers: (type) => world.pluginRegistry?.getAssetHandlers(type) || [],
      getNetworkHandler: (messageType) => world.pluginRegistry?.getNetworkHandler(messageType) || null,
      getScriptGlobals: () => world.pluginRegistry?.getScriptGlobals() || {},
      getServerRoutes: () => world.pluginRegistry?.getServerRoutes() || [],
      getHooks: () => world.pluginHooks?.getHooks() || [],
      getHookDetails: (hookName) => world.pluginHooks?.getHookDetails(hookName) || null,
      listAllHooks: () => {
        const hooks = world.pluginHooks?.getHooks() || []
        return hooks.map(name => ({
          name,
          details: world.pluginHooks.getHookDetails(name),
        }))
      },
    },
  }
}
