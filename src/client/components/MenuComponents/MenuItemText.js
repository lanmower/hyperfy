import { useContext, useEffect, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { MenuContext } from './Menu.js'

export function MenuItemText({ label, hint, placeholder, value, onChange }) {
  const setHint = useContext(MenuContext)
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
  return (
    <label
      className='menuitemtext'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemtext-label {
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemtext-field {
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
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemtext-label'>{label}</div>
      <div className='menuitemtext-field'>
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
