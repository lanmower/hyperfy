/* Event handler auto-registration from static EVENTS declarations */

export const EventBindingMixin = {
  registerEventHandlers() {
    const events = this.constructor.EVENTS
    if (!events) return

    for (const [eventName, handlerName] of Object.entries(events)) {
      const handler = this[handlerName]
      if (handler) {
        this.world.on(eventName, handler.bind(this))
      }
    }
  },

  unregisterEventHandlers() {
    const events = this.constructor.EVENTS
    if (!events) return

    for (const [eventName, handlerName] of Object.entries(events)) {
      const handler = this[handlerName]
      if (handler) {
        this.world.off(eventName, handler.bind(this))
      }
    }
  }
}
