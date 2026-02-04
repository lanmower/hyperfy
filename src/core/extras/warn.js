import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Warn')
const warned = new Set()

export function warn(message) {
  if (!warned.has(message)) {
    logger.warn(message, { context: 'Deduplication warning' })
    warned.add(message)
  }
}
