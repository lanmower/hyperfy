import { System } from './System.js'

/**
 * Base Environment System
 *
 * - Shared functionality for ClientEnvironment and ServerEnvironment
 * - Manages environment state and lifecycle
 * - Subclasses override setup() for platform-specific initialization
 *
 */
export class BaseEnvironment extends System {
  constructor(world) {
    super(world)
    this.model = null
  }
}
