export class DeltaCodec {
  static encode(current, previous) {
    if (!previous) return current

    const delta = {}
    let hasChanges = false

    for (const [key, value] of Object.entries(current)) {
      if (!this.equals(value, previous[key])) {
        delta[key] = value
        hasChanges = true
      }
    }

    return hasChanges ? delta : null
  }

  static decode(delta, base) {
    if (!delta) return base
    return { ...base, ...delta }
  }

  static equals(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== typeof b) return false

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      if (keysA.length !== keysB.length) return false
      for (const key of keysA) {
        if (!this.equals(a[key], b[key])) return false
      }
      return true
    }

    return false
  }

  static encodeEntityDelta(entity, previousState) {
    if (!previousState) {
      return { id: entity.id, ...entity.data }
    }

    const delta = { id: entity.id }
    let hasChanges = false

    for (const [key, value] of Object.entries(entity.data)) {
      if (key === 'id') continue
      if (!this.equals(value, previousState[key])) {
        delta[key] = value
        hasChanges = true
      }
    }

    return hasChanges ? delta : null
  }

  static compressEntityList(entities, previousEntities = new Map()) {
    const added = []
    const modified = []
    const removed = []
    const current = new Map()

    for (const entity of entities) {
      current.set(entity.id, entity)
      const prev = previousEntities.get(entity.id)

      if (!prev) {
        added.push(entity.serialize())
      } else {
        const delta = this.encodeEntityDelta(entity, prev.data)
        if (delta) {
          modified.push(delta)
        }
      }
    }

    for (const [id, entity] of previousEntities) {
      if (!current.has(id)) {
        removed.push(id)
      }
    }

    return { added, modified, removed, current }
  }
}
