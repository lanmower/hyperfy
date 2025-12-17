
export class PluginSystem {
  constructor(world) {
    this.world = world
    this.plugins = new Map()
    this.hooks = new Map()
    this.middleware = new Map()
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin already registered: ${name}`)
    }

    if (typeof plugin.install !== 'function') {
      throw new Error(`Plugin must have install method`)
    }

    const instance = {
      name,
      plugin,
      enabled: false,
      config: {}
    }

    this.plugins.set(name, instance)
    return this
  }

  async enable(name, config = {}) {
    const instance = this.plugins.get(name)
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`)
    }

    if (instance.enabled) {
      console.warn(`Plugin already enabled: ${name}`)
      return false
    }

    try {
      instance.config = config
      await instance.plugin.install(this.world, config)
      instance.enabled = true
      this.executeHook('pluginEnabled', name)
      console.log(`Plugin enabled: ${name}`)
      return true
    } catch (err) {
      console.error(`Failed to enable plugin ${name}:`, err)
      throw err
    }
  }

  async disable(name) {
    const instance = this.plugins.get(name)
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`)
    }

    if (!instance.enabled) {
      console.warn(`Plugin not enabled: ${name}`)
      return false
    }

    try {
      if (typeof instance.plugin.uninstall === 'function') {
        await instance.plugin.uninstall(this.world)
      }
      instance.enabled = false
      this.executeHook('pluginDisabled', name)
      console.log(`Plugin disabled: ${name}`)
      return true
    } catch (err) {
      console.error(`Failed to disable plugin ${name}:`, err)
      throw err
    }
  }

  addHook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, [])
    }
    this.hooks.get(event).push(callback)
    return () => this.removeHook(event, callback)
  }

  removeHook(event, callback) {
    const callbacks = this.hooks.get(event)
    if (callbacks) {
      const idx = callbacks.indexOf(callback)
      if (idx >= 0) callbacks.splice(idx, 1)
    }
    return this
  }

  executeHook(event, ...args) {
    const callbacks = this.hooks.get(event) || []
    for (const callback of callbacks) {
      try {
        callback(...args)
      } catch (err) {
        console.error(`Error in hook ${event}:`, err)
      }
    }
  }

  async executeHookAsync(event, ...args) {
    const callbacks = this.hooks.get(event) || []
    for (const callback of callbacks) {
      try {
        await callback(...args)
      } catch (err) {
        console.error(`Error in hook ${event}:`, err)
      }
    }
  }

  addMiddleware(name, fn) {
    if (!this.middleware.has(name)) {
      this.middleware.set(name, [])
    }
    this.middleware.get(name).push(fn)
    return this
  }

  async executeMiddleware(name, data) {
    const middlewares = this.middleware.get(name) || []
    let result = data
    for (const fn of middlewares) {
      try {
        result = await fn(result, this.world)
      } catch (err) {
        console.error(`Error in middleware ${name}:`, err)
      }
    }
    return result
  }

  isEnabled(name) {
    const instance = this.plugins.get(name)
    return instance?.enabled || false
  }

  list() {
    return Array.from(this.plugins.entries()).map(([name, instance]) => ({
      name,
      enabled: instance.enabled,
      config: instance.config
    }))
  }

  toString() {
    const enabled = Array.from(this.plugins.values()).filter(p => p.enabled).length
    return `PluginSystem(${enabled}/${this.plugins.size} enabled)`
  }
}
