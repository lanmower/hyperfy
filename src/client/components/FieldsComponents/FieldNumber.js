import { css } from '@firebolt-dev/css'
import { useContext, useEffect, useState } from 'react'
import { HintContext } from '../../Hint.js'

export function FieldNumber({
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
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value.toFixed(dp))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused && local !== value.toFixed(dp)) setLocal(value.toFixed(dp))
  }, [focused, value])
  const setTo = str => {
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
    setLocal(num.toFixed(dp))
    onChange(+num.toFixed(dp))
  }
  return (
    <label
      className='fieldnumber'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldnumber-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldnumber-field {
          flex: 1;
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
      <div className='fieldnumber-label'>{label}</div>
      <div className='fieldnumber-field'>
        <input
          type='text'
          value={local}
          onChange={e => setLocal(e.target.value)}
          onKeyDown={e => {
            if (e.code === 'Enter') {
              e.preventDefault()
              e.target.blur()
            }
            if (e.code === 'ArrowUp') {
              const amount = e.shiftKey ? bigStep : step
              setTo(value + amount)
            }
            if (e.code === 'ArrowDown') {
              const amount = e.shiftKey ? bigStep : step
              setTo(value - amount)
            }
          }}
          onFocus={e => {
            setFocused(true)
            e.target.select()
          }}
          onBlur={e => {
            setFocused(false)
            if (local === '') {
              setLocal(value.toFixed(dp))
              return
            }
            setTo(local)
          }}
        />
      </div>
    </label>
  )
}
