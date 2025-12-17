
import { EventBus } from './EventBus.js'
import { createErrorEvent, mergeErrorEvents, isSameError, ErrorLevels } from '../../schemas/ErrorEvent.schema.js'

export class ErrorEventBus extends EventBus {
  constructor() {
    super()
    this.handlers = new Set()
    this.errorHistory = []
    this.errorMap = new Map()
    this.maxHistory = 500
    this.stats = {
      total: 0,
      byLevel: {},
      byCategory: {},
      bySource: {}
    }
  }

  register(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function')
    }
    this.handlers.add(handler)
    return () => this.unregister(handler)
  }

  unregister(handler) {
    this.handlers.delete(handler)
  }

  emit(error, context = {}, level = ErrorLevels.ERROR) {
    const event = createErrorEvent(error, context, level)
    const existing = this.findExisting(event)

    if (existing) {
      const merged = mergeErrorEvents(existing, event)
      this.updateEvent(existing, merged)
      this.notifyHandlers(merged, true)
      return merged
    }

    this.addEvent(event)
    this.updateStats(event)
    this.notifyHandlers(event, false)
    return event
  }

  findExisting(event) {
    const key = this.getErrorKey(event)
    return this.errorMap.get(key)
  }

  addEvent(event) {
    this.errorHistory.push(event)
    const key = this.getErrorKey(event)
    this.errorMap.set(key, event)

    if (this.errorHistory.length > this.maxHistory) {
      const removed = this.errorHistory.shift()
      const removedKey = this.getErrorKey(removed)
      if (this.errorMap.get(removedKey) === removed) {
        this.errorMap.delete(removedKey)
      }
    }
  }

  updateEvent(existing, merged) {
    Object.assign(existing, merged)
    this.updateStats(merged)
  }

  notifyHandlers(event, isDuplicate) {
    for (const handler of this.handlers) {
      try {
        handler(event, isDuplicate)
      } catch (err) {
        console.error('Error in event handler:', err)
      }
    }

    this.emit('error', event, isDuplicate)
  }

  getErrorKey(event) {
    return `${event.level}:${event.category}:${event.message}:${JSON.stringify(event.context)}`
  }

  updateStats(event) {
    this.stats.total += event.count

    this.stats.byLevel[event.level] = (this.stats.byLevel[event.level] || 0) + event.count
    this.stats.byCategory[event.category] = (this.stats.byCategory[event.category] || 0) + event.count
    this.stats.bySource[event.source] = (this.stats.bySource[event.source] || 0) + event.count
  }

  getStats() {
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    const recentErrors = this.errorHistory.filter(e => e.lastSeen >= hourAgo)

    return {
      total: this.stats.total,
      unique: this.errorHistory.length,
      recent: recentErrors.length,
      byLevel: { ...this.stats.byLevel },
      byCategory: { ...this.stats.byCategory },
      bySource: { ...this.stats.bySource },
      mostCommon: this.getMostCommon(5)
    }
  }

  getMostCommon(limit = 10) {
    return [...this.errorHistory]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(e => ({
        message: e.message,
        category: e.category,
        count: e.count,
        level: e.level,
        lastSeen: e.lastSeen
      }))
  }

  getErrors(options = {}) {
    const {
      level = null,
      category = null,
      source = null,
      since = null,
      limit = 50
    } = options

    let filtered = [...this.errorHistory]

    if (level) {
      filtered = filtered.filter(e => e.level === level)
    }

    if (category) {
      filtered = filtered.filter(e => e.category === category)
    }

    if (source) {
      filtered = filtered.filter(e => e.source === source)
    }

    if (since) {
      const sinceTime = typeof since === 'number' ? since : new Date(since).getTime()
      filtered = filtered.filter(e => e.lastSeen >= sinceTime)
    }

    return filtered
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, limit)
  }

  clear() {
    this.errorHistory = []
    this.errorMap.clear()
    this.stats = {
      total: 0,
      byLevel: {},
      byCategory: {},
      bySource: {}
    }
    this.emit('cleared')
  }
}

export const globalErrorBus = new ErrorEventBus()
