import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'

export function InputText({ value, onChange, placeholder }) {
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
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
        value={localValue || ''}
        placeholder={placeholder}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={e => {
          if (e.code === 'Enter') {
            e.preventDefault()
            onChange(localValue)
            e.target.blur()
          }
        }}
        onBlur={e => {
          onChange(localValue)
        }}
      />
    </label>
  )
}
