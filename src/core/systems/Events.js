import { System } from './System.js'
import { EventBus } from '../utils/events/EventBus.js'

/**
 * Events System
 *
 * - Runs on both the server and client.
 * - Unified event dispatcher for world events (player join/leave, entity events, etc.)
 * - Uses EventBus internally for consistent behavior across the system
 *
 */
export class Events extends System {
  constructor(world) {
    super(world)
    this.bus = new EventBus()
  }

  /**
   * Subscribe to an event
   * @param {string} name - Event name/topic
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(name, callback) {
    return this.bus.on(name, callback)
  }

  /**
   * Subscribe to an event once
   * @param {string} name - Event name/topic
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  once(name, callback) {
    return this.bus.once(name, callback)
  }

  /**
   * Unsubscribe from an event
   * @param {string} name - Event name/topic
   * @param {Function} callback - Handler function
   */
  off(name, callback) {
    return this.bus.off(name, callback)
  }

  /**
   * Emit an event
   * @param {string} name - Event name/topic
   * @param {...any} args - Event data
   */
  emit(name, ...args) {
    return this.bus.emit(name, ...args)
  }

  /**
   * Get count of listeners for an event
   * @param {string} name - Event name/topic
   * @returns {number} Number of listeners
   */
  listenerCount(name) {
    return this.bus.listenerCount(name)
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return this.bus.eventNames()
  }

  /**
   * Clear listeners for specific event or all events
   * @param {string} name - Optional event name
   */
  clear(name) {
    return this.bus.clear(name)
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.bus.clear()
  }
}
