export function validateHandler(fn, name = 'handler') {
  if (typeof fn !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}

export function validateRoute(path, method, handler) {
  if (typeof path !== 'string' || typeof method !== 'string' || typeof handler !== 'function') {
    throw new Error('Invalid route configuration')
  }
}

export function validateMessageHandler(type, fn) {
  if (typeof type !== 'string' || typeof fn !== 'function') {
    throw new Error('Invalid message handler')
  }
}
