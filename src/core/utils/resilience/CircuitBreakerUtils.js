export class CircuitBreakerUtils {
  static executeWithCircuitBreaker(fn, resourceName, circuitBreakerManager, fallbackValue = null) {
    if (circuitBreakerManager?.has(resourceName)) {
      try {
        return fn()
      } catch (err) {
        circuitBreakerManager.recordFailure(resourceName)
        throw err
      }
    }
    return fallbackValue
  }

  static async executeAsyncWithCircuitBreaker(asyncFn, resourceName, circuitBreakerManager, fallbackValue = null) {
    if (circuitBreakerManager?.has(resourceName)) {
      try {
        return await asyncFn()
      } catch (err) {
        circuitBreakerManager.recordFailure(resourceName)
        throw err
      }
    }
    return fallbackValue
  }

  static wrapWithCircuitBreaker(fn, resourceName, circuitBreakerManager, fallbackValue = null) {
    return (...args) => this.executeWithCircuitBreaker(
      () => fn(...args),
      resourceName,
      circuitBreakerManager,
      fallbackValue
    )
  }

  static wrapAsyncWithCircuitBreaker(asyncFn, resourceName, circuitBreakerManager, fallbackValue = null) {
    return (...args) => this.executeAsyncWithCircuitBreaker(
      () => asyncFn(...args),
      resourceName,
      circuitBreakerManager,
      fallbackValue
    )
  }
}
