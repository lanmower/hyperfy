import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('PluginHooks')

export class PluginHooks {
  constructor() {
    this.hooks = new Map()
  }

  register(name, type = 'action') {
    if (this.hooks.has(name)) {
      logger.warn('Hook already registered', { name })
      return
    }

    this.hooks.set(name, {
      name,
      type,
      before: [],
      action: [],
      after: [],
      filters: [],
    })
  }

  before(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.before.push(fn)

    return () => {
      const idx = hookData.before.indexOf(fn)
      if (idx !== -1) hookData.before.splice(idx, 1)
    }
  }

  after(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.after.push(fn)

    return () => {
      const idx = hookData.after.indexOf(fn)
      if (idx !== -1) hookData.after.splice(idx, 1)
    }
  }

  filter(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.filters.push(fn)

    return () => {
      const idx = hookData.filters.indexOf(fn)
      if (idx !== -1) hookData.filters.splice(idx, 1)
    }
  }

  action(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.action.push(fn)

    return () => {
      const idx = hookData.action.indexOf(fn)
      if (idx !== -1) hookData.action.splice(idx, 1)
    }
  }

  async execute(hook, ...args) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return args[0]
    }

    try {
      for (const fn of hookData.before) {
        await Promise.resolve(fn(...args))
      }

      let result = args[0]
      for (const fn of hookData.filters) {
        result = await Promise.resolve(fn(result, ...args.slice(1)))
      }

      for (const fn of hookData.action) {
        await Promise.resolve(fn(result, ...args.slice(1)))
      }

      for (const fn of hookData.after) {
        await Promise.resolve(fn(result, ...args.slice(1)))
      }

      return result
    } catch (error) {
      logger.error('Hook execution error', { hook, error: error.message })
      throw error
    }
  }

  getHooks() {
    return Array.from(this.hooks.keys())
  }

  getHookDetails(name) {
    const hook = this.hooks.get(name)
    if (!hook) return null

    return {
      name: hook.name,
      type: hook.type,
      beforeCount: hook.before.length,
      afterCount: hook.after.length,
      filterCount: hook.filters.length,
      actionCount: hook.action.length,
    }
  }

  getAllHooks() {
    const hooks = []
    this.hooks.forEach((hook, name) => {
      hooks.push({
        name,
        type: hook.type,
        handlers: hook.before.length + hook.after.length + hook.action.length + hook.filters.length
      })
    })
    return hooks
  }

  getHookCount(name) {
    const hook = this.hooks.get(name)
    if (!hook) return 0
    return hook.before.length + hook.after.length + hook.action.length + hook.filters.length
  }

  hasHook(name) {
    return this.hooks.has(name)
  }
}

export const pluginHooks = new PluginHooks()
