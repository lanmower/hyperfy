import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('DisposableResource')

export class DisposableResource {
  constructor(name = 'DisposableResource') {
    this.name = name
    this.disposed = false
    this.disposables = []
    this.dependents = new Set()
  }

  addDisposable(resource) {
    if (resource && typeof resource.dispose === 'function') {
      this.disposables.push(resource)
    }
    return resource
  }

  addDependent(dependent) {
    if (dependent) {
      this.dependents.add(dependent)
    }
  }

  removeDependent(dependent) {
    this.dependents.delete(dependent)
  }

  dispose() {
    if (this.disposed) {
      logger.warn(`${this.name} already disposed`)
      return
    }

    try {
      this.onDispose()

      for (const disposable of this.disposables) {
        try {
          disposable.dispose()
        } catch (err) {
          logger.error(`Failed to dispose ${disposable.name || 'resource'}`, {
            parent: this.name,
            error: err.message
          })
        }
      }

      this.disposables = []
      this.dependents.clear()
      this.disposed = true
    } catch (err) {
      logger.error(`Error disposing ${this.name}`, { error: err.message })
      this.disposed = true
    }
  }

  onDispose() {
  }

  isDisposed() {
    return this.disposed
  }

  ensureNotDisposed() {
    if (this.disposed) {
      throw new Error(`${this.name} has been disposed`)
    }
  }

  getDependencyChain() {
    const chain = [this.name]
    for (const dependent of this.dependents) {
      if (dependent.getDependencyChain) {
        chain.push(...dependent.getDependencyChain())
      }
    }
    return chain
  }
}
