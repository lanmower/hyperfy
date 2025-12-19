export class ErrorStorage {
  constructor(maxErrors = 1000) {
    this.errors = []
    this.errorsByClient = new Map()
    this.errorsByCategory = new Map()
    this.maxErrors = maxErrors
  }

  add(errorEntry) {
    this.errors.push(errorEntry)

    if (!this.errorsByClient.has(errorEntry.clientId)) {
      this.errorsByClient.set(errorEntry.clientId, [])
    }
    this.errorsByClient.get(errorEntry.clientId).push(errorEntry)

    if (!this.errorsByCategory.has(errorEntry.category)) {
      this.errorsByCategory.set(errorEntry.category, [])
    }
    this.errorsByCategory.get(errorEntry.category).push(errorEntry)

    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }
  }

  getRecent(timeWindow = 60000) {
    const cutoff = Date.now() - timeWindow
    return this.errors.filter(e => e.timestamp >= cutoff)
  }

  getAll() {
    return this.errors
  }

  getByClient(clientId) {
    return this.errorsByClient.get(clientId) || []
  }

  getByCategory(category) {
    return this.errorsByCategory.get(category) || []
  }

  clear() {
    const count = this.errors.length
    this.errors = []
    this.errorsByClient.clear()
    this.errorsByCategory.clear()
    return count
  }

  clearClient(clientId) {
    const clientErrors = this.errorsByClient.get(clientId) || []
    const count = clientErrors.length

    this.errors = this.errors.filter(e => e.clientId !== clientId)
    this.errorsByClient.delete(clientId)

    for (const [category, errors] of this.errorsByCategory.entries()) {
      this.errorsByCategory.set(
        category,
        errors.filter(e => e.clientId !== clientId)
      )
    }

    return count
  }

  getClientCount() {
    return this.errorsByClient.size
  }
}
