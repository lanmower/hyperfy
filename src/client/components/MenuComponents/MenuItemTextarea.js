import { useContext, useEffect, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { MenuContext } from './Menu.js'

export function MenuItemTextarea({ label, hint, placeholder, value, onChange }) {
  const setHint = useContext(MenuContext)
  const textareaRef = useRef()
  const [localValue, setLocalValue] = useState(value)
  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])
  useEffect(() => {
    const textarea = textareaRef.current
    function update() {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
    update()
    textarea.addEventListener('input', update)
    return () => {
      textarea.removeEventListener('input', update)
    }
  }, [])
  return (
    <label
      className='menuitemtextarea'
      css={css`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 0.875rem;
        cursor: text;
        .menuitemtextarea-label {
          padding-top: 0.6rem;
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .menuitemtextarea-field {
          flex: 1;
          padding: 0.6rem 0 0.6rem 0;
        }
        textarea {
          width: 100%;
          height: 1rem;
          text-align: right;
          height: auto;
          overflow: hidden;
          resize: none;
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
      <div className='menuitemtextarea-label'>{label}</div>
      <div className='menuitemtextarea-field'>
        <textarea
          ref={textareaRef}
          value={localValue || ''}
          placeholder={placeholder}
          onFocus={e => e.target.select()}
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
        />
      </div>
    </label>
  )
}
