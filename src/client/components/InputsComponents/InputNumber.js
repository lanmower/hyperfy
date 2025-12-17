import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'

export function InputNumber({ value, onChange, dp = 0, min = -Infinity, max = Infinity, step = 1 }) {
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value.toFixed(dp))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused && local !== value.toFixed(dp)) setLocal(value.toFixed(dp))
  }, [focused, value])
  const setTo = str => {
    // try parse math
    let num
    try {
      num = (0, eval)(str)
      if (typeof num !== 'number') {
        throw new Error('input number parse fail')
      }
    } catch (err) {
      console.error(err)
      num = value // revert back to original
    }
    if (num < min || num > max) {
      num = value
    }
    setLocal(num.toFixed(dp))
    onChange(+num.toFixed(dp))
  }
  return (
    <label
      css={css`
        display: block;
        background-color: #252630;
        border-radius: 10px;
        padding: 0 8px;
        cursor: text;
        input {
          height: 34px;
          font-size: 14px;
        }
      `}
    >
      <input
        type='text'
        value={local}
        onChange={e => setLocal(e.target.value)}
        onKeyDown={e => {
          if (e.code === 'Enter') {
            e.target.blur()
          }
          if (e.code === 'ArrowUp') {
            setTo(value + step)
          }
          if (e.code === 'ArrowDown') {
            setTo(value - step)
          }
        }}
        onFocus={e => {
          setFocused(true)
          e.target.select()
        }}
        onBlur={e => {
          setFocused(false)
          // if blank, set back to original
          if (local === '') {
            setLocal(value.toFixed(dp))
            return
          }
          // otherwise run through pipeline
          setTo(local)
        }}
      />
    </label>
  )
}
