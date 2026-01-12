// Structured log formatting and colorization utilities.
import { LogLevelNames } from './LogLevels.js'

export function formatLogEntry(logEntry, includeTimestamp = true, category = '') {
  const { timestamp, level, message, context } = logEntry

  const prefix = [
    includeTimestamp && timestamp && `[${timestamp}]`,
    `[${level}]`,
    category && `[${category}]`
  ].filter(Boolean).join(' ')

  const logMessage = context ? `${message} ${JSON.stringify(context)}` : message
  return `${prefix} ${logMessage}`.trim()
}

export function getConsoleMethod(level) {
  if (level === 'TRACE' || level === 'DEBUG') {
    return 'debug'
  } else if (level === 'INFO') {
    return 'log'
  } else if (level === 'WARN') {
    return 'warn'
  } else if (level === 'ERROR' || level === 'FATAL') {
    return 'error'
  }
  return 'log'
}

export function buildLogStructure(level, message, category, fullContext, metadata, includeTimestamp) {
  const timestamp = includeTimestamp ? new Date().toISOString() : null
  const levelName = LogLevelNames[level] || 'UNKNOWN'

  return {
    timestamp,
    level: levelName,
    category,
    message,
    context: Object.keys(fullContext).length ? fullContext : null,
    metadata
  }
}
