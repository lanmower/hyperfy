export class ErrorEventBus {
  constructor() {
    this.listeners = []
  }

  on(handler) {
    this.listeners.push(handler)
  }

  off(handler) {
    this.listeners = this.listeners.filter(l => l !== handler)
  }

  emit(error) {
    this.listeners.forEach(l => l(error))
  }
}
