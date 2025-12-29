export class MonacoLoadError extends Error {
  constructor(message, context = {}) {
    super(message)
    this.name = 'MonacoLoadError'
    this.context = context
  }
}

export function handleMonacoError(error, context = 'unknown') {
  if (error instanceof MonacoLoadError) {
    return error
  }

  let message = 'Monaco editor failed to load'
  let code = 'MONACO_LOAD_FAILED'

  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message
  }

  if (message.includes('404') || message.includes('not found')) {
    code = 'MONACO_NOT_FOUND'
    message = 'Monaco editor CDN not available'
  } else if (message.includes('timeout')) {
    code = 'MONACO_TIMEOUT'
    message = 'Monaco editor CDN request timed out'
  } else if (message.includes('require') || message.includes('module')) {
    code = 'MONACO_MODULE_LOAD_FAILED'
    message = 'Failed to load Monaco editor modules'
  } else if (message.includes('window.monaco')) {
    code = 'MONACO_WINDOW_REFERENCE'
    message = 'Monaco editor not available on window object'
  }

  return new MonacoLoadError(message, {
    code,
    context,
    originalError: error instanceof Error ? error.message : String(error)
  })
}

export async function loadMonacoWithFallback(primaryLoader, fallbackFn = null) {
  try {
    return await primaryLoader()
  } catch (err) {
    const monacoError = handleMonacoError(err, 'primaryLoader')
    console.warn('[Monaco] Primary loader failed:', monacoError.message)

    if (fallbackFn) {
      try {
        return await fallbackFn()
      } catch (fallbackErr) {
        throw handleMonacoError(fallbackErr, 'fallbackLoader')
      }
    }

    throw monacoError
  }
}

export function validateMonacoLoaded() {
  if (!window.monaco) {
    throw new MonacoLoadError('Monaco editor is not loaded. Call Monaco.load() first.', {
      code: 'MONACO_NOT_LOADED'
    })
  }

  if (!window.monaco.editor) {
    throw new MonacoLoadError('Monaco editor module is not available.', {
      code: 'MONACO_EDITOR_UNAVAILABLE'
    })
  }

  return window.monaco
}
