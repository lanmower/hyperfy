import React from 'react'
import { useState, useCallback } from 'react'

export function useStateFactory(initialValue) {
  const [value, setValue] = useState(initialValue)

  const set = useCallback((newValue) => {
    setValue(typeof newValue === 'function' ? newValue : () => newValue)
  }, [])

  const reset = useCallback(() => {
    setValue(initialValue)
  }, [initialValue])

  const toggle = useCallback(() => {
    setValue(prev => !prev)
  }, [])

  return { value, set, reset, toggle, setValue }
}
