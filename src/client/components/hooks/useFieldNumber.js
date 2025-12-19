import { useEffect, useState, useCallback } from 'react'

export function useFieldNumber(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const safeValue = value ?? 0
  const [local, setLocal] = useState(safeValue.toFixed(dp))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused && local !== safeValue.toFixed(dp)) setLocal(safeValue.toFixed(dp))
  }, [focused, safeValue, dp])

  const setTo = useCallback(str => {
    let num
    try {
      num = (0, eval)(str)
      if (typeof num !== 'number') throw new Error('input number parse fail')
    } catch (err) {
      num = safeValue
    }
    if (num < min || num > max) num = safeValue
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
