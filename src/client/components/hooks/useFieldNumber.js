import { useCallback } from 'react'
import { useFieldBase } from './useFieldBase.js'
import { parseNumberInput } from './parseNumber.js'

export function useFieldNumber(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const safeValue = value ?? 0
  const coerce = useCallback(v => {
    const str = typeof v === 'number' ? v.toFixed(dp) : v
    return str === '' ? safeValue.toFixed(dp) : str
  }, [safeValue, dp])

  const { value: local, handlers } = useFieldBase(value, onChange, { coerce, selectOnFocus: true })

  const handleBlur = useCallback(() => {
    if (local === '') return
    const num = parseNumberInput(local, safeValue, { min, max })
    onChange(+num.toFixed(dp))
  }, [local, safeValue, min, max, dp, onChange])

  const handleArrowKeys = useCallback(e => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      const amount = e.shiftKey ? bigStep : step
      const newNum = safeValue + (e.code === 'ArrowUp' ? amount : -amount)
      const clamped = Math.max(min, Math.min(max, newNum))
      onChange(clamped)
    }
  }, [safeValue, min, max, step, bigStep, onChange])

  const handleKeyDown = useCallback(e => {
    if (e.code === 'Enter') {
      e.preventDefault()
      handleBlur()
      e.target.blur()
    } else {
      handleArrowKeys(e)
    }
  }, [handleBlur, handleArrowKeys])

  return {
    value: local,
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  }
}
