import { useContext, useEffect, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { MenuContext } from './Menu.js'

export function MenuItemNumber({
  label,
  hint,
  dp = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  value,
  onChange,
}) {
  const setHint = useContext(MenuContext)
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
      className='menuitemnumber'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemnumber-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemnumber-field {
          flex: 1;
        }
        input {
          text-align: right;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemnumber-label'>{label}</div>
      <div className='menuitemnumber-field'>
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
