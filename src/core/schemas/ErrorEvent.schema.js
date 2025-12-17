
export const ErrorLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

export const ErrorSources = {
  CLIENT: 'client',
  SERVER: 'server',
  SDK: 'sdk'
}

export function createErrorEvent(error, context = {}, level = ErrorLevels.ERROR) {
  const timestamp = Date.now()
  const id = generateErrorId(timestamp)
  const message = extractMessage(error)
  const stack = extractStack(error)
  const category = context.category || categorizeError(error, message)
  const source = context.source || ErrorSources.CLIENT

  return {
    id,
    timestamp,
    level,
    category,
    source,
    context: sanitizeContext(context),
    message,
    stack,
    count: 1,
    firstSeen: timestamp,
    lastSeen: timestamp,
    metadata: context.metadata || {},
    resolved: false
  }
}

export function normalizeErrorEvent(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid error event: must be an object')
  }

  const timestamp = event.timestamp || Date.now()

  return {
    id: event.id || generateErrorId(timestamp),
    timestamp,
    level: validateLevel(event.level),
    category: event.category || 'unknown',
    source: validateSource(event.source),
    context: sanitizeContext(event.context || {}),
    message: String(event.message || ''),
    stack: event.stack || null,
    count: Math.max(1, event.count || 1),
    firstSeen: event.firstSeen || timestamp,
    lastSeen: event.lastSeen || timestamp,
    metadata: event.metadata || {},
    resolved: Boolean(event.resolved)
  }
}

export function serializeErrorEvent(event) {
  const normalized = normalizeErrorEvent(event)
  return {
    ...normalized,
    stack: normalized.stack ? truncateStack(normalized.stack) : null,
    context: serializeContext(normalized.context)
  }
}

export function deserializeErrorEvent(data) {
  if (typeof data === 'string') {
    data = JSON.parse(data)
  }
  return normalizeErrorEvent(data)
}

export function mergeErrorEvents(existing, incoming) {
  if (!isSameError(existing, incoming)) {
    throw new Error('Cannot merge different error types')
  }

  return {
    ...existing,
    count: existing.count + incoming.count,
    lastSeen: Math.max(existing.lastSeen, incoming.lastSeen),
    firstSeen: Math.min(existing.firstSeen, incoming.firstSeen),
    metadata: { ...existing.metadata, ...incoming.metadata }
  }
}

export function isSameError(event1, event2) {
  return (
    event1.message === event2.message &&
    event1.category === event2.category &&
    event1.level === event2.level &&
    compareContext(event1.context, event2.context)
  )
}

function generateErrorId(timestamp) {
  return `${timestamp.toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

function extractMessage(error) {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error?.message) return String(error.message)
  return String(error)
}

function extractStack(error) {
  if (error instanceof Error) return error.stack || null
  if (error?.stack) return String(error.stack)
  return null
}

function categorizeError(error, message) {
  const text = message.toLowerCase()

  if (text.includes('network') || text.includes('websocket')) return 'network'
  if (text.includes('syntax') || text.includes('compile')) return 'app.script.compile'
  if (text.includes('reference') || text.includes('not defined')) return 'app.script.runtime'
  if (text.includes('load') || text.includes('fetch')) return 'app.load'
  if (text.includes('gltf') || text.includes('model')) return 'app.model.load'
  if (text.includes('physics') || text.includes('collision')) return 'physics'
  if (text.includes('render') || text.includes('webgl')) return 'render'

  return 'unknown'
}

function validateLevel(level) {
  const levels = Object.values(ErrorLevels)
  return levels.includes(level) ? level : ErrorLevels.ERROR
}

function validateSource(source) {
  const sources = Object.values(ErrorSources)
  return sources.includes(source) ? source : ErrorSources.CLIENT
}

function sanitizeContext(context) {
  if (!context || typeof context !== 'object') return {}

  const sanitized = {}
  const allowed = ['app', 'entity', 'user', 'player', 'blueprint', 'url', 'component']

  for (const key of allowed) {
    if (context[key] !== undefined) {
      sanitized[key] = serializeValue(context[key])
    }
  }

  return sanitized
}

function serializeContext(context) {
  const serialized = {}
  for (const [key, value] of Object.entries(context)) {
    serialized[key] = serializeValue(value)
  }
  return serialized
}

function serializeValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value))
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function truncateStack(stack, maxLines = 20) {
  if (!stack) return null
  const lines = stack.split('\n')
  if (lines.length <= maxLines) return stack
  return lines.slice(0, maxLines).join('\n') + '\n... (truncated)'
}

function compareContext(ctx1, ctx2) {
  const keys1 = Object.keys(ctx1 || {}).sort()
  const keys2 = Object.keys(ctx2 || {}).sort()

  if (keys1.length !== keys2.length) return false

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false
    if (ctx1[keys1[i]] !== ctx2[keys2[i]]) return false
  }

  return true
}
