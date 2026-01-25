import React from 'react'
import { useCallback } from 'react'

export function useFieldSwitch(options, value, onChange) {
  const safeOptions = options || []
  const idx = safeOptions.findIndex(o => o.value === value)
  const selected = safeOptions[idx]
  const prev = useCallback(() => {
    let nextIdx = idx - 1
    if (nextIdx < 0) nextIdx = safeOptions.length - 1
    onChange(safeOptions[nextIdx].value)
  }, [idx, safeOptions, onChange])
  const next = useCallback(() => {
    let nextIdx = idx + 1
    if (nextIdx > safeOptions.length - 1) nextIdx = 0
    onChange(safeOptions[nextIdx].value)
  }, [idx, safeOptions, onChange])
  return { selected, prev, next }
}
