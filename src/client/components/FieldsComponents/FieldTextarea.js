import { css } from '@firebolt-dev/css'
import { useContext, useEffect, useRef, useState } from 'react'
import { HintContext } from '../../Hint.js'

export function FieldTextarea({ label, hint, placeholder, value, onChange }) {
  const { setHint } = useContext(HintContext)
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
      className='fieldtextarea'
      css={css`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldtextarea-label {
          padding-top: 0.6rem;
          width: 9.4rem;
          flex-shrink: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldtextarea-field {
          flex: 1;
          padding: 0.6rem 0 0.6rem 0;
        }
        textarea {
          font-size: 0.9375rem;
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
          background-color: rgba(255, 255, 255, 0.03);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='fieldtextarea-label'>{label}</div>
      <div className='fieldtextarea-field'>
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
