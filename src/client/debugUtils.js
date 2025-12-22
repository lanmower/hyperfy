export function setupDebugGlobals(world) {
  if (typeof window === 'undefined') return

  window.__DEBUG__ = {
    world,
    entities: () => Array.from(world.entities.items.values()),
    blueprints: () => Array.from(world.blueprints.items.entries()),
    apps: () => Array.from(world.entities.items.values()).filter(e => e.isApp),
    players: () => Array.from(world.entities.items.values()).filter(e => e.isPlayer),
    getEntity: (id) => world.entities.get(id),
    getBlueprint: (id) => world.blueprints.get(id),
    network: {
      id: () => world.network.id,
      isServer: () => world.network.isServer,
      isClient: () => world.network.isClient,
    },
    systems: {
      loader: () => world.loader,
      scripts: () => world.scripts,
      blueprints: () => world.blueprints,
      entities: () => world.entities,
      controls: () => world.controls,
    },
    logs: {
      errors: [],
      warnings: [],
      info: [],
    }
  }

  // Hook console to capture logs
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = function(...args) {
    window.__DEBUG__.logs.info.push({ time: new Date(), args })
    return originalLog.apply(console, args)
  }

  console.warn = function(...args) {
    window.__DEBUG__.logs.warnings.push({ time: new Date(), args })
    return originalWarn.apply(console, args)
  }

  console.error = function(...args) {
    window.__DEBUG__.logs.errors.push({ time: new Date(), args })
    return originalError.apply(console, args)
  }

  console.log('[DEBUG] Global debug utilities available at window.__DEBUG__')
  console.log('[DEBUG] Usage in Playwright: await page.evaluate(() => window.__DEBUG__.getEntity("entity-id"))')
}
