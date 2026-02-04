import React from 'react'
import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldTextarea, fieldLabelCss } from '../hooks/index.js'

export function FieldTextarea({ label, hint, placeholder, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const textareaProps = useFieldTextarea(value, onChange)
  return (
    <label
      className='fieldtextarea'
      css={css`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldtextarea-label { ${fieldLabelCss} padding-top: 0.6rem; }
        .fieldtextarea-field { flex: 1; padding: 0.6rem 0; }
        textarea {
          font-size: 0.9375rem;
          width: 100%;
          text-align: right;
          height: auto;
          overflow: hidden;
          resize: none;
          cursor: inherit;
          &::selection { background-color: white; color: rgba(0, 0, 0, 0.8); }
        }
        &:hover { background-color: rgba(255, 255, 255, 0.03); }
      `}
      {...hintProps}
    >
      <div className='fieldtextarea-label'>{label}</div>
      <div className='fieldtextarea-field'>
        <textarea placeholder={placeholder} {...textareaProps} />
      </div>
    </label>
  )
}
