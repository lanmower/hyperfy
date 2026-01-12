export function setupDebugPlacement(world) {
  return {
    placementState: () => {
      const builder = world.builder
      const composer = builder?.composer
      const selectionMgr = composer?.selectionManager
      const stateTransition = composer?.stateTransitionHandler
      const apps = world.entities.apps.filter(e => !e.data.id.includes('scene'))

      return {
        builderEnabled: builder?.enabled || false,
        builderSelectedId: builder?.selected?.data?.id || null,
        selectionMgrSelectedId: selectionMgr?.selected?.data?.id || null,
        selectedApp: builder?.selected ? {
          id: builder.selected.data.id,
          mode: builder.selected.mode,
          mover: builder.selected.data.mover,
          position: builder.selected.root.position.toArray(),
          isMover: builder.selected.data.mover === world.network.id,
        } : null,
        modelApps: apps.map(app => ({
          id: app.data.id,
          mode: app.mode,
          mover: app.data.mover,
          isMover: app.data.mover === world.network.id,
          position: app.root.position.toArray(),
        })),
        stateMismatch: builder?.selected?.data?.id !== selectionMgr?.selected?.data?.id ? 'MISMATCH!' : 'OK',
      }
    },
    testPlacementFinalization: (appId) => {
      const app = world.entities.get(appId)
      if (!app?.isApp) return { error: `App ${appId} not found` }
      if (app.data.mover !== world.network.id) return { error: 'App not being moved by this client' }

      const beforeMover = app.data.mover
      const beforeMode = app.mode

      world.builder.composer.stateTransitionHandler.select(null)

      const afterMover = app.data.mover
      const afterMode = app.mode

      return {
        success: afterMover === null && beforeMover === world.network.id,
        beforeMover,
        afterMover,
        beforeMode,
        afterMode,
        moverCleared: afterMover === null,
      }
    },
    assertPlacementReady: () => {
      const assertions = []
      const builder = world.builder
      const apps = world.entities.apps.filter(e => !e.data.id.includes('scene'))

      if (!builder) assertions.push('❌ Builder system missing')
      else assertions.push('✅ Builder system available')

      if (!builder?.composer?.selectionManager) assertions.push('❌ SelectionManager missing')
      else assertions.push('✅ SelectionManager available')

      if (!builder?.composer?.stateTransitionHandler) assertions.push('❌ StateTransitionHandler missing')
      else assertions.push('✅ StateTransitionHandler available')

      const modelApps = apps.filter(a => a.data.blueprint !== '$scene')
      if (modelApps.length === 0) assertions.push('⚠️  No model apps created yet')
      else assertions.push(`✅ ${modelApps.length} model app(s) exist`)

      const movingApps = modelApps.filter(a => a.data.mover === world.network.id)
      if (movingApps.length > 0) assertions.push(`✅ ${movingApps.length} app(s) in MOVING mode`)
      else assertions.push('⚠️  No apps in MOVING mode')

      return {
        assertions,
        all_pass: assertions.every(a => a.startsWith('✅')),
      }
    },
  }
}
