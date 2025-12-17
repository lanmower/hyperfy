import { css } from '@firebolt-dev/css'
import { useContext, useEffect, useState } from 'react'
import { HintContext } from '../Hint.js'

export function FieldVec3({
  label,
  hint,
  dp = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  bigStep = 2,
  value,
  onChange,
}) {
  const { setHint } = useContext(HintContext)
  let valueX = value?.[0] || 0
  let valueY = value?.[1] || 0
  let valueZ = value?.[2] || 0
  const [localX, setLocalX] = useState(valueX.toFixed(dp))
  const [localY, setLocalY] = useState(valueY.toFixed(dp))
  const [localZ, setLocalZ] = useState(valueZ.toFixed(dp))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) {
      if (localX !== valueX.toFixed(dp)) setLocalX(valueX.toFixed(dp))
      if (localY !== valueY.toFixed(dp)) setLocalY(valueY.toFixed(dp))
      if (localZ !== valueZ.toFixed(dp)) setLocalZ(valueZ.toFixed(dp))
    }
  }, [focused, valueX, valueY, valueZ])
  const parseStr = str => {
    let num
    try {
      num = (0, eval)(str)
      if (typeof num !== 'number') {
        throw new Error('input number parse fail')
      }
    } catch (err) {
      console.error(err)
      num = value
    }
    if (num < min || num > max) {
      num = value
    }
    return num
  }
  return (
    <label
      className='fieldvec3'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldvec3-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldvec3-field {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        input {
          font-size: 0.9375rem;
          height: 1rem;
          text-align: right;
          overflow: hidden;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='fieldvec3-label'>{label}</div>
      <div className='fieldvec3-field'>
        <input
          type='text'
          value={localX}
          onChange={e => setLocalX(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              e.target.blur()
            }
            if (e.code === 'ArrowUp') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueX + amount)
              setLocalX(num.toFixed(dp))
              onChange([+num.toFixed(dp), valueY, valueZ])
            }
            if (e.code === 'ArrowDown') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueX - amount)
              setLocalX(num.toFixed(dp))
              onChange([+num.toFixed(dp), valueY, valueZ])
            }
          }}
          onFocus={e => {
            setFocused(true)
            e.target.select()
          }}
          onBlur={e => {
            setFocused(false)
            if (localX === '') {
              setLocalX(valueX.toFixed(dp))
              return
            }
            const num = parseStr(localX)
            setLocalX(num.toFixed(dp))
            onChange([+num.toFixed(dp), valueY, valueZ])
          }}
        />
        <input
          type='text'
          value={localY}
          onChange={e => setLocalY(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              e.target.blur()
            }
            if (e.code === 'ArrowUp') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueY + amount)
              setLocalY(num.toFixed(dp))
              onChange([valueX, +num.toFixed(dp), valueZ])
            }
            if (e.code === 'ArrowDown') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueY - amount)
              setLocalY(num.toFixed(dp))
              onChange([valueX, +num.toFixed(dp), valueZ])
            }
          }}
          onFocus={e => {
            setFocused(true)
            e.target.select()
          }}
          onBlur={e => {
            setFocused(false)
            if (localY === '') {
              setLocalY(valueY.toFixed(dp))
              return
            }
            const num = parseStr(localY)
            setLocalY(num.toFixed(dp))
            onChange([valueX, +num.toFixed(dp), valueZ])
          }}
        />
        <input
          type='text'
          value={localZ}
          onChange={e => setLocalZ(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              e.target.blur()
            }
            if (e.code === 'ArrowUp') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueZ + amount)
              setLocalZ(num.toFixed(dp))
              onChange([valueX, valueY, +num.toFixed(dp)])
            }
            if (e.code === 'ArrowDown') {
              const amount = e.shiftKey ? bigStep : step
              const num = parseStr(valueZ - amount)
              setLocalZ(num.toFixed(dp))
              onChange([valueX, valueY, +num.toFixed(dp)])
            }
          }}
          onFocus={e => {
            setFocused(true)
            e.target.select()
          }}
          onBlur={e => {
            setFocused(false)
            if (localZ === '') {
              setLocalZ(valueZ.toFixed(dp))
              return
            }
            const num = parseStr(localZ)
            setLocalZ(num.toFixed(dp))
            onChange([valueX, valueY, +num.toFixed(dp)])
          }}
        />
      </div>
    </label>
  )
}
