import { coreSystemsConfig } from './registry/CoreSystemsConfig.js'
import { PlatformDetection } from './registry/PlatformDetection.js'

export class SystemRegistry {
  constructor() {
    this.systems = new Map()
    this.registerDefaultSystems()
  }

  registerDefaultSystems() {
    for (const config of coreSystemsConfig) {
      this.register(config)
    }
  }

  register(config) {
    const {
      name,
      class: SystemClass,
      platforms = ['server', 'client'],
      priority = 50,
      required = false,
      enabled = true,
    } = config

    this.systems.set(name, {
      name,
      class: SystemClass,
      platforms: Array.isArray(platforms) ? platforms : [platforms],
      priority,
      required,
      enabled,
    })
  }

  unregister(name) {
    this.systems.delete(name)
  }

  setEnabled(name, enabled) {
    const system = this.systems.get(name)
    if (system) {
      system.enabled = enabled
    }
  }

  getSystemsForPlatform(platform) {
    const matched = []

    for (const [name, config] of this.systems.entries()) {
      if (!config.enabled) continue
      if (!config.platforms.includes(platform)) continue

      matched.push({
        name,
        class: config.class,
        priority: config.priority,
        required: config.required,
      })
    }

    matched.sort((a, b) => b.priority - a.priority)

    return matched
  }

  getAllSystemNames() {
    return Array.from(this.systems.keys())
  }

  getSystem(name) {
    return this.systems.get(name)
  }

  static getCurrentPlatform() {
    return PlatformDetection.getCurrentPlatform()
  }

  getCurrentPlatformSystems() {
    const platform = PlatformDetection.getCurrentPlatform()
    return this.getSystemsForPlatform(platform)
  }
}

export const systemRegistry = new SystemRegistry()
