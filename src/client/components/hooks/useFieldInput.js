import { useContext, useEffect, useState, useCallback } from 'react'
import { HintContext } from '../Hint.js'
import { MenuContext } from '../MenuComponents/Menu.js'

export function useMenuHint(hint) {
  const setHint = useContext(MenuContext)
  return {
    onPointerEnter: () => setHint(hint),
    onPointerLeave: () => setHint(null),
  }
}

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

export const menuLabelCss = `
  width: 9.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

export const menuWrapperCss = `
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  cursor: text;
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`

export const menuInputCss = `
  text-align: right;
  cursor: inherit;
  &::selection {
    background-color: white;
    color: rgba(0, 0, 0, 0.8);
  }
`

export function useFieldVec3(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const [vx, vy, vz] = value || [0, 0, 0]
  const [localX, setLocalX] = useState(vx.toFixed(dp))
  const [localY, setLocalY] = useState(vy.toFixed(dp))
  const [localZ, setLocalZ] = useState(vz.toFixed(dp))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      if (localX !== vx.toFixed(dp)) setLocalX(vx.toFixed(dp))
      if (localY !== vy.toFixed(dp)) setLocalY(vy.toFixed(dp))
      if (localZ !== vz.toFixed(dp)) setLocalZ(vz.toFixed(dp))
    }
  }, [focused, vx, vy, vz, dp])

  const parseStr = useCallback(str => {
    let num
    try {
      num = (0, eval)(str)
      if (typeof num !== 'number') throw new Error('input number parse fail')
    } catch (err) {
      num = 0
    }
    return num < min || num > max ? 0 : num
  }, [min, max])

  const createInputProps = (idx, local, setLocal, current) => ({
    type: 'text',
    value: local,
    onChange: e => setLocal(e.target.value),
    onFocus: e => { setFocused(true); e.target.select() },
    onBlur: () => {
      setFocused(false)
      if (local === '') { setLocal(current.toFixed(dp)); return }
      const num = parseStr(local)
      setLocal(num.toFixed(dp))
      const newVal = [...(value || [0, 0, 0])]
      newVal[idx] = +num.toFixed(dp)
      onChange(newVal)
    },
    onKeyDown: e => {
      if (e.code === 'Enter') { e.preventDefault(); e.target.blur() }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        const amount = e.shiftKey ? bigStep : step
        const num = parseStr(current + (e.code === 'ArrowUp' ? amount : -amount))
        setLocal(num.toFixed(dp))
        const newVal = [...(value || [0, 0, 0])]
        newVal[idx] = +num.toFixed(dp)
        onChange(newVal)
      }
    },
  })

  return {
    x: createInputProps(0, localX, setLocalX, vx),
    y: createInputProps(1, localY, setLocalY, vy),
    z: createInputProps(2, localZ, setLocalZ, vz),
  }
}
