import { css } from '@firebolt-dev/css'
import { useContext, useEffect, useState } from 'react'
import { HintContext } from '../Hint.js'

export function FieldText({ label, hint, placeholder, value, onChange }) {
  const { setHint } = useContext(HintContext)
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
  return (
    <label
      className='fieldtext'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldtext-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldtext-field {
          flex: 1;
        }
        input {
          font-size: 0.9375rem;
          text-align: right;
          cursor: inherit;
          &::selection {
            background-color: white;
            color: rgba(0, 0, 0, 0.8);
          }
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='fieldtext-label'>{label}</div>
      <div className='fieldtext-field'>
        <input
          type='text'
          value={localValue || ''}
          placeholder={placeholder}
          onFocus={e => e.target.select()}
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
      </div>
    </label>
  )
}
