const warned = new Set()

export function warn(message) {
  if (!warned.has(message)) {
    console.warn(message)
    warned.add(message)
  }
}
