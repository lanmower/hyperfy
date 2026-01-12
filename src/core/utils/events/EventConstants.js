/**
 * Internal event names used across app lifecycle (ready, destroy, error, load)
 */
export const INTERNAL_EVENTS = ['ready', 'destroy', 'error', 'load']

export const SYSTEM_INTERNAL_EVENTS = [
  'fixedUpdate',
  'updated',
  'lateUpdate',
  'destroy',
  'enter',
  'leave',
  'chat',
  'command',
  'health'
]

export default {
  INTERNAL_EVENTS,
  SYSTEM_INTERNAL_EVENTS
}
