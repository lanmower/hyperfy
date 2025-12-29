import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ListenerMixin')

export function ListenerMixin(Base) {
  return class extends Base {
    constructor(...args) {
      super(...args)
      this.listeners = new Set()
    }

    addListener(callback) {
      this.listeners.add(callback)
      return () => this.listeners.delete(callback)
    }

    notifyListeners(...args) {
      this.listeners.forEach(callback => {
        try {
          callback(...args)
        } catch (err) {
          logger.error('Listener callback failed', { error: err.message })
        }
      })
    }

    clearListeners() {
      this.listeners.clear()
    }

    destroy() {
      this.clearListeners()
      super.destroy?.()
    }
  }
}
