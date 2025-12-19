export class MonitorWrapper {
  static wrap(system, monitors) {
    const wrappedSystem = Object.create(Object.getPrototypeOf(system))

    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(system))) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(system), key)

      if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
        wrappedSystem[key] = function (...args) {
          const start = performance.now()

          for (const monitor of monitors) {
            monitor({ system, method: key, start })
          }

          try {
            const result = system[key].apply(system, args)
            return result
          } finally {
            const duration = performance.now() - start

            for (const monitor of monitors) {
              monitor({
                system,
                method: key,
                duration,
                end: performance.now(),
              })
            }
          }
        }
      }
    }

    for (const key of Object.keys(system)) {
      wrappedSystem[key] = system[key]
    }

    return wrappedSystem
  }
}
