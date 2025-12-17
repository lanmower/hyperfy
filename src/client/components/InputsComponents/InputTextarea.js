import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'

export function InputTextarea({ value, onChange, placeholder }) {
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
        cursor: text;
        textarea {
          padding: 6px 8px;
          line-height: 1.4;
          font-size: 14px;
          min-height: 56px;
          max-width: 100%;
          min-width: 100%;
        }
      `}
    >
      <textarea
        value={localValue || ''}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={e => {
          if (e.metaKey && e.code === 'Enter') {
            e.preventDefault()
            onChange(localValue)
            e.target.blur()
          }
        }}
        onBlur={e => {
          onChange(localValue)
        }}
        placeholder={placeholder}
      />
    </label>
  )
}
