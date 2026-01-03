// Generates proxy objects from property schemas, eliminating getter/setter boilerplate

export function createSchemaProxy(target, schema) {
  const proxy = {}
  for (const [key, config] of Object.entries(schema)) {
    const descriptor = {}
    if (config.get !== false) {
      descriptor.get = () => target[key]
    }
    if (config.set !== false) {
      descriptor.set = (value) => {
        target[key] = value
      }
    }
    if (config.deprecated) {
      if (descriptor.set) {
        const originalSet = descriptor.set
        descriptor.set = (value) => {
          console.warn(`${key} is deprecated`)
          originalSet(value)
        }
      }
    }
    Object.defineProperty(proxy, key, descriptor)
  }
  return proxy
}
