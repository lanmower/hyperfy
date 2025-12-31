import { useEffect, useState, useCallback } from 'react'
import { parseNumberInput } from './parseNumber.js'

export function useFieldNumber(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const safeValue = value ?? 0
  const [local, setLocal] = useState(safeValue.toFixed(dp))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused && local !== safeValue.toFixed(dp)) setLocal(safeValue.toFixed(dp))
  }, [focused, safeValue, dp])

  const setTo = useCallback(str => {
    const num = parseNumberInput(str, safeValue, { min, max })
    setLocal(num.toFixed(dp))
    onChange(+num.toFixed(dp))
  }, [safeValue, min, max, dp, onChange])

  const handleChange = e => setLocal(e.target.value)
  const handleFocus = e => { setFocused(true); e.target.select() }
  const handleBlur = () => {
    setFocused(false)
    if (local === '') { setLocal(safeValue.toFixed(dp)); return }
    setTo(local)
  }
  const handleKeyDown = e => {
    if (e.code === 'Enter') { e.preventDefault(); e.target.blur() }
    if (e.code === 'ArrowUp') setTo(safeValue + (e.shiftKey ? bigStep : step))
    if (e.code === 'ArrowDown') setTo(safeValue - (e.shiftKey ? bigStep : step))
  }

  return {
    value: local,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  }
}
