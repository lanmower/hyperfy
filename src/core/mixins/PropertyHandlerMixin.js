export class PropertyHandlerMixin {
  static applyPropertyHandlers(target, data, handlers) {
    const results = {}
    for (const [key, handler] of Object.entries(handlers)) {
      if (data.hasOwnProperty(key)) {
        const result = handler.call(target, data[key], data)
        if (result !== undefined) {
          results[key] = result
        }
      }
    }
    return results
  }
}
