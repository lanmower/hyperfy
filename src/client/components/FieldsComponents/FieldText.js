import React from 'react'
import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldText, fieldLabelCss, fieldWrapperCss, fieldInputCss } from '../hooks/index.js'

export function FieldText({ label, hint, placeholder, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const inputProps = useFieldText(value, onChange)

  return (
    <label
      className='fieldtext'
      css={css`
        ${fieldWrapperCss}
        .fieldtext-label { ${fieldLabelCss} }
        .fieldtext-field { flex: 1; }
        input { ${fieldInputCss} }
      `}
      {...hintProps}
    >
      <div className='fieldtext-label'>{label}</div>
      <div className='fieldtext-field'>
        <input type='text' placeholder={placeholder} {...inputProps} />
      </div>
    </label>
  )
}
