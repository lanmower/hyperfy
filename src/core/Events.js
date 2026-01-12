import { UnifiedEventEmitter } from './patterns/UnifiedEventEmitter.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('Events')

export class Events {
  constructor(name = 'Events') {
    this.name = name
    this.bus = new UnifiedEventEmitter(name)
    this.types = new Map()
  }

  define(event, schema = {}) {
    this.types.set(event, schema)
    return this
  }

  defineBatch(events) {
    for (const [name, schema] of Object.entries(events)) {
      this.define(name, schema)
    }
    return this
  }

  on(event, fn) {
    return this.bus.on(event, fn)
  }

  once(event, fn) {
    return this.bus.once(event, fn)
  }

  off(event, fn) {
    return this.bus.off(event, fn)
  }

  emit(event, data) {
    const schema = this.types.get(event)
    if (schema && data) {
      this.#validate(event, data, schema)
    }
    this.bus.emit(event, data)
  }

  has(event) {
    return this.types.has(event)
  }

  list() {
    return Array.from(this.types.keys())
  }

  #validate(event, data, schema) {
    for (const [key, type] of Object.entries(schema)) {
      const value = data[key]
      if (typeof value !== type && value !== undefined) {
        logger.warn('Event field type mismatch', { event, field: key, expected: type, got: typeof value })
      }
    }
  }

  toString() {
    return `${this.name}(${this.types.size} events)`
  }
}

export function listen(target, events) {
  for (const [event, fn] of Object.entries(events)) {
    target.on(event, fn)
  }
  return target
}

export function emit(bus, event, data) {
  bus.emit(event, data)
}

export const sys = new Events('system')

sys.defineBatch({
  'world:init': { world: 'object' },
  'world:start': { world: 'object' },
  'world:destroy': { world: 'object' },
  'entity:add': { id: 'string', type: 'string' },
  'entity:remove': { id: 'string' },
  'entity:change': { id: 'string', key: 'string', value: 'object' },
  'network:connect': { id: 'string' },
  'network:disconnect': { id: 'string' },
  'error': { message: 'string', stack: 'string' },
})
