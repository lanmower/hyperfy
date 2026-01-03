// Transport implementations for structured logging (console, buffer, file handlers).
import { formatLogEntry, getConsoleMethod } from './StructuredLoggerFormatters.js'

export function defaultConsoleHandler(logEntry) {
  const { timestamp, level, category, message, context } = logEntry

  const prefix = [
    timestamp && `[${timestamp}]`,
    `[${level}]`,
    `[${category}]`
  ].filter(Boolean).join(' ')

  const logMessage = context ? `${message} ${JSON.stringify(context)}` : message
  const formatted = `${prefix} ${logMessage}`.trim()
  const method = getConsoleMethod(level)

  console[method](formatted)
}

export function createLogBuffer(maxSize = 1000) {
  const buffer = []

  return {
    handler: (logEntry) => {
      buffer.push({
        ...logEntry,
        timestamp: logEntry.timestamp || Date.now()
      })
      if (buffer.length > maxSize) {
        buffer.shift()
      }
    },
    getAll: () => [...buffer],
    getByLevel: (level) => buffer.filter(e => e.level === level),
    getLast: (count) => buffer.slice(-count),
    clear: () => buffer.length = 0,
    stats: () => ({ size: buffer.length, maxSize })
  }
}

export function createFileHandler(filePath) {
  return (logEntry) => {
    // Placeholder for file handler - would use fs in Node.js
    // Implementation depends on platform (Node.js vs Browser)
  }
}

export function createNetworkHandler(endpoint) {
  return async (logEntry) => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    } catch (err) {
      console.error('Network handler error:', err.message)
    }
  }
}
