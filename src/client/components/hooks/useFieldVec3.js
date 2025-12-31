import { useCallback } from 'react'
import { useFieldBase } from './useFieldBase.js'
import { parseNumberInput } from './parseNumber.js'

const createVec3Coerce = (current, dp) => (v) => {
  const str = typeof v === 'number' ? v.toFixed(dp) : v
  return str === '' ? current.toFixed(dp) : str
}

export function useFieldVec3(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const [vx, vy, vz] = value || [0, 0, 0]

  const createFieldProps = (idx, current) => {
    const coerce = useCallback(createVec3Coerce(current, dp), [current, dp])

    const { value: local, handlers } = useFieldBase(current, (num) => {
      const newVal = [...(value || [0, 0, 0])]
      newVal[idx] = num
      onChange(newVal)
    }, { coerce, selectOnFocus: true })

    const handleKeyDown = useCallback(e => {
      if (e.code === 'Enter') {
        e.preventDefault()
        const num = parseNumberInput(local, current, { min, max })
        const newVal = [...(value || [0, 0, 0])]
        newVal[idx] = +num.toFixed(dp)
        onChange(newVal)
        e.target.blur()
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        const amount = e.shiftKey ? bigStep : step
        const newNum = current + (e.code === 'ArrowUp' ? amount : -amount)
        const clamped = Math.max(min, Math.min(max, newNum))
        const num = parseNumberInput(clamped.toString(), current, { min, max })
        const newVal = [...(value || [0, 0, 0])]
        newVal[idx] = +num.toFixed(dp)
        onChange(newVal)
      }
    }, [local, current, idx, min, max, step, bigStep, dp])

    return {
      type: 'text',
      value: local,
      onChange: handlers.onChange,
      onFocus: handlers.onFocus,
      onBlur: handlers.onBlur,
      onKeyDown: handleKeyDown,
    }
  }

  return {
    x: createFieldProps(0, vx),
    y: createFieldProps(1, vy),
    z: createFieldProps(2, vz),
  }
}
