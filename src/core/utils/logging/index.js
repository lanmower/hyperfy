// Client exports only - server-only exports separated to prevent bundling
export { StructuredLogger, defaultConsoleHandler, createLogBuffer } from './StructuredLogger.js'
export { LogLevels, LogLevelNames, getLevelValue, shouldLog } from './LogLevels.js'
export { LoggerFactory } from './LoggerFactory.js'

// Server-only exports - not imported by client
export function createFileHandler(filePath) {
  // Server-only implementation
  return (logEntry) => {}
}
