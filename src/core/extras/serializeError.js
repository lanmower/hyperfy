export function serializeError(error) {
  const seen = new WeakSet()

  function serialize(err) {
    if (!err) return null
    if (seen.has(err)) return { message: '[Circular]' }
    seen.add(err)

    return {
      message: err?.message || 'Unknown error',
      code: err?.code || 'UNKNOWN',
      stack: err?.stack || '',
      name: err?.name || 'Error',
      cause: err?.cause ? serialize(err.cause) : null
    }
  }

  return serialize(error)
}
