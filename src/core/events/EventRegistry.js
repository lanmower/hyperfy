import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('EventRegistry')

export class EventRegistry {
  constructor() {
    this.events = new Map()
    this.schemas = new Map()
    this.categories = new Map()
  }

  registerEvent(name, options = {}) {
    const eventDef = {
      name,
      category: options.category || 'general',
      description: options.description || '',
      dataSchema: options.dataSchema || null,
      allowBubble: options.allowBubble !== false,
      allowCancelable: options.allowCancelable !== false,
      deprecated: options.deprecated || false,
      replacedBy: options.replacedBy || null,
      version: options.version || '1.0.0',
    }

    this.events.set(name, eventDef)

    if (!this.categories.has(eventDef.category)) {
      this.categories.set(eventDef.category, [])
    }
    this.categories.get(eventDef.category).push(name)

    logger.debug('Event registered', { name, category: eventDef.category })
    return eventDef
  }

  registerEventSchema(name, schema) {
    this.schemas.set(name, schema)
    const event = this.events.get(name)
    if (event) {
      event.dataSchema = schema
    }
    return this
  }

  getEvent(name) {
    return this.events.get(name) || null
  }

  getEventsByCategory(category) {
    const eventNames = this.categories.get(category) || []
    return eventNames.map(name => this.events.get(name))
  }

  getAllEvents() {
    return Array.from(this.events.values())
  }

  validateEventData(eventName, data) {
    const event = this.events.get(eventName)
    if (!event) {
      return { valid: false, error: `Event ${eventName} not registered` }
    }

    if (!event.dataSchema) {
      return { valid: true }
    }

    const schema = this.schemas.get(eventName)
    if (!schema) {
      return { valid: true }
    }

    try {
      const validate = this.createValidator(schema)
      const valid = validate(data)
      if (!valid) {
        return { valid: false, errors: validate.errors }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  createValidator(schema) {
    return (data) => {
      if (typeof data !== 'object' || data === null) {
        return { errors: ['Data must be an object'], __errors: true }
      }

      const errors = []

      for (const [key, requirement] of Object.entries(schema)) {
        const value = data[key]

        if (requirement.required && (value === null || value === undefined)) {
          errors.push(`Field ${key} is required`)
        }

        if (value !== null && value !== undefined && requirement.type) {
          if (typeof value !== requirement.type) {
            errors.push(`Field ${key} must be ${requirement.type}, got ${typeof value}`)
          }
        }
      }

      return { errors, __errors: errors.length > 0 }
    }
  }

  deprecateEvent(oldName, newName) {
    const event = this.events.get(oldName)
    if (event) {
      event.deprecated = true
      event.replacedBy = newName
      logger.warn('Event deprecated', { oldName, newName })
    }
  }

  getDeprecatedEvents() {
    return Array.from(this.events.values()).filter(e => e.deprecated)
  }

  getEventDocumentation(eventName) {
    const event = this.events.get(eventName)
    if (!event) return null

    const doc = {
      name: event.name,
      category: event.category,
      description: event.description,
      version: event.version,
      dataSchema: this.schemas.get(eventName) || null,
      bubbles: event.allowBubble,
      cancelable: event.allowCancelable,
      deprecated: event.deprecated,
      replacedBy: event.replacedBy,
    }

    return doc
  }

  getAllDocumentation() {
    const docs = {}

    for (const [name] of this.events) {
      docs[name] = this.getEventDocumentation(name)
    }

    return docs
  }

  getDocumentationByCategory(category) {
    const eventNames = this.categories.get(category) || []
    const docs = {}

    for (const name of eventNames) {
      docs[name] = this.getEventDocumentation(name)
    }

    return docs
  }

  exportRegistry() {
    return {
      events: Array.from(this.events.values()),
      schemas: Object.fromEntries(this.schemas),
      categories: Object.fromEntries(this.categories),
      deprecated: this.getDeprecatedEvents(),
      totalEvents: this.events.size,
    }
  }
}

export const eventRegistry = new EventRegistry()

export function defineEvents(eventDefinitions) {
  for (const [name, definition] of Object.entries(eventDefinitions)) {
    eventRegistry.registerEvent(name, definition)

    if (definition.dataSchema) {
      eventRegistry.registerEventSchema(name, definition.dataSchema)
    }
  }

  return eventRegistry
}
