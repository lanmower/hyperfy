export const LogLevels = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  SILENT: 6
}

export const LogLevelNames = {
  0: 'TRACE',
  1: 'DEBUG',
  2: 'INFO',
  3: 'WARN',
  4: 'ERROR',
  5: 'FATAL',
  6: 'SILENT'
}

export function getLevelValue(levelName) {
  return LogLevels[levelName?.toUpperCase()] ?? LogLevels.INFO
}

export function getLevelName(levelValue) {
  return LogLevelNames[levelValue] ?? 'INFO'
}

export function shouldLog(currentLevel, messageLevel) {
  return messageLevel >= currentLevel
}
