import { useEffect, useState, useCallback } from 'react'

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
