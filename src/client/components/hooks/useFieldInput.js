import { useContext, useEffect, useState, useCallback } from 'react'
import { HintContext } from '../Hint.js'

export function useFieldHint(hint) {
  const { setHint } = useContext(HintContext)
  return {
    onPointerEnter: () => setHint(hint),
    onPointerLeave: () => setHint(null),
  }
}

export function useFieldText(value, onChange) {
  const [localValue, setLocalValue] = useState(value ?? '')

  useEffect(() => {
    if (localValue !== value) setLocalValue(value ?? '')
  }, [value])

  const handleChange = e => setLocalValue(e.target.value)
  const handleFocus = e => e.target.select()
  const handleBlur = () => onChange(localValue)
  const handleKeyDown = e => {
    if (e.code === 'Enter') {
      e.preventDefault()
      onChange(localValue)
      e.target.blur()
    }
  }

  return {
    value: localValue || '',
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  }
}

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

export const fieldLabelCss = `
  width: 9.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.6);
`

export const fieldWrapperCss = `
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 1rem;
  cursor: text;
  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`

export const fieldInputCss = `
  font-size: 0.9375rem;
  text-align: right;
  cursor: inherit;
  &::selection {
    background-color: white;
    color: rgba(0, 0, 0, 0.8);
  }
`
