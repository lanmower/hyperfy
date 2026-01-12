
export function findById(collection, id) {
  if (collection instanceof Map) return collection.get(id)
  if (Array.isArray(collection)) return collection.find(item => item.id === id)
  return collection[id]
}

export function updateById(collection, id, updates) {
  if (!updates || typeof updates !== 'object') return null
  if (collection instanceof Map) {
    const item = collection.get(id)
    if (item) {
      for (const key in updates) {
        if (updates.hasOwnProperty(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) {
          item[key] = updates[key]
        }
      }
    }
    return item
  }
  if (Array.isArray(collection)) {
    const item = collection.find(x => x.id === id)
    if (item) {
      for (const key in updates) {
        if (updates.hasOwnProperty(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) {
          item[key] = updates[key]
        }
      }
    }
    return item
  }
  if (collection[id]) {
    for (const key in updates) {
      if (updates.hasOwnProperty(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) {
        collection[id][key] = updates[key]
      }
    }
    return collection[id]
  }
}

export function deleteById(collection, id) {
  if (collection instanceof Map) return collection.delete(id)
  if (Array.isArray(collection)) {
    const idx = collection.findIndex(x => x.id === id)
    if (idx >= 0) collection.splice(idx, 1)
    return idx >= 0
  }
  delete collection[id]
}

export function getValues(collection) {
  if (collection instanceof Map) return Array.from(collection.values())
  if (Array.isArray(collection)) return collection
  return Object.values(collection)
}

export function filterByProperty(collection, prop, value) {
  const values = getValues(collection)
  return values.filter(item => item[prop] === value)
}

export function sortByProperty(collection, prop, desc = false) {
  const values = getValues(collection)
  return values.sort((a, b) => {
    if (desc) return b[prop] > a[prop] ? 1 : -1
    return a[prop] > b[prop] ? 1 : -1
  })
}
