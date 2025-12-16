/**
 * System Registry
 *
 * Centralized registry for system definitions and lifecycle.
 * Enables dynamic system loading based on platform and configuration.
 *
 * Usage:
 * ```javascript
 * const registry = new SystemRegistry()
 * registry.register({
 *   name: 'physics',
 *   class: Physics,
 *   platforms: ['server', 'client'],
 *   priority: 50
 * })
 * const systems = registry.getSystemsForPlatform('client')
 * ```
 */

import { ErrorMonitor } from './ErrorMonitor.js'
import { Settings } from './Settings.js'
import { Collections } from './Collections.js'
import { Apps } from './Apps.js'
import { Anchors } from './Anchors.js'
import { Avatars } from './Avatars.js'
import { Events } from './Events.js'
import { Chat } from './Chat.js'
import { Scripts } from './Scripts.js'
import { Blueprints } from './Blueprints.js'
import { Entities } from './Entities.js'
import { Physics } from './Physics.js'
import { Stage } from './Stage.js'

// Platform detection
const isServer = typeof process !== 'undefined' && typeof window === 'undefined'
const isClient = typeof window !== 'undefined'

export class SystemRegistry {
  constructor() {
    this.systems = new Map()
    this.registerDefaultSystems()
  }

  /**
   * Register all default Hyperfy systems
   */
  registerDefaultSystems() {
    // Core systems (both platforms)
    this.register({
      name: 'errorMonitor',
      class: ErrorMonitor,
      platforms: ['server', 'client'],
      priority: 1000, // First to initialize
      required: true,
    })

    this.register({
      name: 'settings',
      class: Settings,
      platforms: ['server', 'client'],
      priority: 90,
      required: true,
    })

    this.register({
      name: 'collections',
      class: Collections,
      platforms: ['server', 'client'],
      priority: 80,
    })

    this.register({
      name: 'scripts',
      class: Scripts,
      platforms: ['server', 'client'],
      priority: 75,
    })

    this.register({
      name: 'events',
      class: Events,
      platforms: ['server', 'client'],
      priority: 70,
      required: true,
    })

    this.register({
      name: 'chat',
      class: Chat,
      platforms: ['server', 'client'],
      priority: 65,
    })

    this.register({
      name: 'blueprints',
      class: Blueprints,
      platforms: ['server', 'client'],
      priority: 60,
    })

    this.register({
      name: 'entities',
      class: Entities,
      platforms: ['server', 'client'],
      priority: 50,
      required: true,
    })

    this.register({
      name: 'apps',
      class: Apps,
      platforms: ['server', 'client'],
      priority: 45,
    })

    this.register({
      name: 'anchors',
      class: Anchors,
      platforms: ['server', 'client'],
      priority: 40,
    })

    this.register({
      name: 'avatars',
      class: Avatars,
      platforms: ['server', 'client'],
      priority: 35,
    })

    this.register({
      name: 'physics',
      class: Physics,
      platforms: ['server', 'client'],
      priority: 30,
    })

    // Client-only systems
    this.register({
      name: 'stage',
      class: Stage,
      platforms: ['client'],
      priority: 25,
    })
  }

  /**
   * Register a system
   */
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

  /**
   * Unregister a system
   */
  unregister(name) {
    this.systems.delete(name)
  }

  /**
   * Enable/disable a system by name
   */
  setEnabled(name, enabled) {
    const system = this.systems.get(name)
    if (system) {
      system.enabled = enabled
    }
  }

  /**
   * Get systems for a specific platform
   * Returns array sorted by priority (highest first)
   */
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

    // Sort by priority (highest first)
    matched.sort((a, b) => b.priority - a.priority)

    return matched
  }

  /**
   * Get all registered system names
   */
  getAllSystemNames() {
    return Array.from(this.systems.keys())
  }

  /**
   * Get system configuration by name
   */
  getSystem(name) {
    return this.systems.get(name)
  }

  /**
   * Detect current platform
   */
  static getCurrentPlatform() {
    if (isServer) return 'server'
    if (isClient) return 'client'
    return 'unknown'
  }

  /**
   * Get current platform systems
   */
  getCurrentPlatformSystems() {
    const platform = SystemRegistry.getCurrentPlatform()
    return this.getSystemsForPlatform(platform)
  }
}

// Export singleton instance
export const systemRegistry = new SystemRegistry()
