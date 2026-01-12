import { useEffect, useState } from 'react'

export function useSyncedState(manager, keys, initialValues = {}) {
  const keysArray = Array.isArray(keys) ? keys : [keys]
  const initial = Array.isArray(keys)
    ? keysArray.reduce((acc, k) => ({ ...acc, [k]: initialValues[k] ?? manager[k] }), {})
    : (initialValues ?? manager[keys])

  const [state, setState] = useState(initial)

  useEffect(() => {
    const onChange = changes => {
      if (Array.isArray(keys)) {
        const updates = {}
        for (const key of keysArray) {
          if (changes[key]) updates[key] = changes[key].value
        }
        if (Object.keys(updates).length) {
          setState(prev => ({ ...prev, ...updates }))
        }
      } else {
        if (changes[keys]) setState(changes[keys].value)
      }
    }
    manager.on('change', onChange)
    return () => manager.off('change', onChange)
  }, [keys, manager])

  return state
}

export function useSyncedBool(manager, key) {
  const value = useSyncedState(manager, key)
  return value
}

export function useSyncedNumber(manager, key) {
  const value = useSyncedState(manager, key)
  return value
}
