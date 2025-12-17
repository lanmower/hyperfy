
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
          console.error('Listener error:', err)
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
